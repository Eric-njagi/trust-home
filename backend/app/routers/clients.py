import re
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.constants import service_label

from app.database import get_db
from app.deps import require_client
from app.legal_docs import build_contract_html
from app.models import Invoice, Job, LegalDocument, User, WorkerProfile
from app.schemas import (
    BookingCreate,
    ClientJobOut,
    InvoiceMpesaPay,
    InvoiceOut,
    JobOut,
    JobRatingBody,
    LegalDocumentOut,
)

router = APIRouter()

_KE_MSISDN = re.compile(r"^254[17]\d{8}$")
_MONTHLY_SERVICE_IDS = frozenset({"nanny", "childcare", "house_help_monthly"})


def _normalize_ke_mpesa_phone(raw: str) -> str:
    """Accept 07XXXXXXXX, 7XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX."""
    s = (raw or "").strip()
    digits = "".join(ch for ch in s if ch.isdigit())
    if not digits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter the M-Pesa phone number you use on your handset.",
        )
    if digits.startswith("254") and len(digits) == 12:
        normalized = digits
    elif digits.startswith("0") and len(digits) == 10 and digits[1] in "17":
        normalized = "254" + digits[1:]
    elif len(digits) == 9 and digits[0] in "17":
        normalized = "254" + digits
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use a valid Kenyan number (e.g. 07XX XXX XXX or 011 XXX XXXX).",
        )
    if not _KE_MSISDN.match(normalized):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="M-Pesa payments require a Safaricom or Airtel Kenya mobile number in international format.",
        )
    return normalized


def _invoice_out(inv: Invoice, db: Session) -> InvoiceOut:
    client = db.get(User, inv.client_user_id)
    wp = db.get(WorkerProfile, inv.worker_profile_id)
    worker_user = db.get(User, wp.user_id) if wp else None
    return InvoiceOut(
        id=str(inv.id),
        clientName=client.name if client else "",
        workerName=worker_user.name if worker_user else "",
        service=inv.service_label,
        amount=float(inv.amount),
        gross=float(inv.gross_amount or 0),
        net=float(inv.net_amount or 0),
        hoursWorked=float(inv.hours_worked or 0),
        deductions=inv.deductions or {},
        date=inv.invoice_date.isoformat(),
        status=inv.status,
    )


def _job_out(job: Job, worker_profile_id: UUID, client_name: str) -> JobOut:
    return JobOut(
        id=str(job.id),
        workerId=str(worker_profile_id),
        clientName=client_name,
        service=job.service_id,
        date=job.job_date.isoformat(),
        time=job.time_window,
        status=job.status,
        clientRating=job.client_to_worker_rating,
        workerRating=job.worker_to_client_rating,
        canClientRate=job.status == "completed" and job.client_to_worker_rating is None,
        canWorkerRate=job.status == "completed" and job.worker_to_client_rating is None,
    )


def _client_job_out(job: Job, worker_profile_id: UUID, worker_name: str) -> ClientJobOut:
    return ClientJobOut(
        id=str(job.id),
        workerId=str(worker_profile_id),
        workerName=worker_name,
        service=job.service_id,
        date=job.job_date.isoformat(),
        time=job.time_window,
        status=job.status,
        clientRating=job.client_to_worker_rating,
        workerRating=job.worker_to_client_rating,
        canClientRate=job.status == "completed" and job.client_to_worker_rating is None,
        canWorkerRate=job.status == "completed" and job.worker_to_client_rating is None,
    )


def _refresh_worker_rating_avg(db: Session, worker_profile_id: UUID) -> None:
    avg_rating = db.scalar(
        select(func.avg(Job.client_to_worker_rating)).where(
            Job.worker_profile_id == worker_profile_id,
            Job.client_to_worker_rating.isnot(None),
        )
    )
    wp = db.get(WorkerProfile, worker_profile_id)
    if wp:
        wp.rating_avg = float(avg_rating or 0)


def _legal_document_out(doc: LegalDocument) -> LegalDocumentOut:
    return LegalDocumentOut(
        id=str(doc.id),
        jobId=str(doc.job_id),
        documentType=doc.document_type,
        title=doc.title,
        html=doc.html_body,
        createdAt=doc.created_at.isoformat(),
    )


def _create_contract_documents_for_booking(
    db: Session,
    job: Job,
    client: User,
    worker_user: User,
    city: str,
) -> None:
    contract_number = f"TH-CTR-{str(job.id)[:8].upper()}"
    contract_title = f"Employment Contract {contract_number}"
    contract_html = build_contract_html(
        contract_number=contract_number,
        job_date=job.job_date.isoformat(),
        time_window=job.time_window,
        service_label=service_label(job.service_id),
        client_name=client.name,
        client_id=str(client.id),
        worker_name=worker_user.name,
        worker_id=str(worker_user.id),
        city=city,
    )
    created_at = datetime.now(timezone.utc)
    db.add(
        LegalDocument(
            recipient_user_id=client.id,
            job_id=job.id,
            document_type="contract",
            title=contract_title,
            html_body=contract_html,
            created_at=created_at,
        )
    )
    db.add(
        LegalDocument(
            recipient_user_id=worker_user.id,
            job_id=job.id,
            document_type="contract",
            title=contract_title,
            html_body=contract_html,
            created_at=created_at,
        )
    )


@router.get("/me/invoices", response_model=list[InvoiceOut])
def my_invoices(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_client)],
) -> list[InvoiceOut]:
    invs = (
        db.execute(
            select(Invoice).where(Invoice.client_user_id == user.id).order_by(Invoice.invoice_date.desc())
        )
        .scalars()
        .all()
    )
    return [_invoice_out(inv, db) for inv in invs]


@router.post("/me/bookings", response_model=JobOut)
def create_booking(
    body: BookingCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_client)],
) -> JobOut:
    try:
        wp_id = UUID(body.worker_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid worker id")

    wp = db.get(WorkerProfile, wp_id)
    if not wp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    offered = list(wp.services or [])
    if body.service_id not in offered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker does not offer this service",
        )

    job = Job(
        worker_profile_id=wp.id,
        client_user_id=user.id,
        service_id=body.service_id,
        job_date=body.job_date,
        time_window=(
            "Monthly recurring schedule"
            if body.service_id in _MONTHLY_SERVICE_IDS
            else body.time_window.strip()
        ),
        status="pending",
    )
    db.add(job)
    db.flush()
    worker_user = db.get(User, wp.user_id)
    if not worker_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker account not found")
    _create_contract_documents_for_booking(
        db=db,
        job=job,
        client=user,
        worker_user=worker_user,
        city=wp.city or user.city or "",
    )
    db.commit()
    db.refresh(job)
    return _job_out(job, wp.id, user.name)


@router.get("/me/jobs", response_model=list[ClientJobOut])
def my_jobs(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_client)],
) -> list[ClientJobOut]:
    jobs = (
        db.execute(select(Job).where(Job.client_user_id == user.id).order_by(Job.job_date.desc()))
        .scalars()
        .all()
    )
    out: list[ClientJobOut] = []
    for job in jobs:
        wp = db.get(WorkerProfile, job.worker_profile_id)
        worker_user = db.get(User, wp.user_id) if wp else None
        out.append(_client_job_out(job, job.worker_profile_id, worker_user.name if worker_user else "Worker"))
    return out


@router.get("/me/documents", response_model=list[LegalDocumentOut])
def my_documents(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_client)],
) -> list[LegalDocumentOut]:
    docs = (
        db.execute(
            select(LegalDocument)
            .where(LegalDocument.recipient_user_id == user.id)
            .order_by(LegalDocument.created_at.desc())
        )
        .scalars()
        .all()
    )
    return [_legal_document_out(d) for d in docs]


@router.patch("/me/jobs/{job_id}/rate-worker", response_model=ClientJobOut)
def rate_worker_for_job(
    job_id: UUID,
    body: JobRatingBody,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_client)],
) -> ClientJobOut:
    job = db.get(Job, job_id)
    if not job or job.client_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.status != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can only rate completed jobs")
    if job.client_to_worker_rating is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already rated this worker")

    job.client_to_worker_rating = body.rating
    _refresh_worker_rating_avg(db, job.worker_profile_id)
    db.commit()
    db.refresh(job)
    wp = db.get(WorkerProfile, job.worker_profile_id)
    worker_user = db.get(User, wp.user_id) if wp else None
    return _client_job_out(job, job.worker_profile_id, worker_user.name if worker_user else "Worker")


@router.patch("/me/invoices/{invoice_id}/pay", response_model=InvoiceOut)
def pay_invoice(
    invoice_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_client)],
    body: Annotated[InvoiceMpesaPay, Body()],
) -> InvoiceOut:
    _normalize_ke_mpesa_phone(body.mpesa_phone)
    inv = db.get(Invoice, invoice_id)
    if not inv or inv.client_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if inv.status == "Paid":
        return _invoice_out(inv, db)
    inv.status = "Paid"
    db.commit()
    db.refresh(inv)
    return _invoice_out(inv, db)
