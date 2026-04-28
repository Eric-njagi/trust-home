import re
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_client
from app.models import Invoice, Job, User, WorkerProfile
from app.schemas import BookingCreate, ClientJobOut, InvoiceMpesaPay, InvoiceOut, JobOut

router = APIRouter()

_KE_MSISDN = re.compile(r"^254[17]\d{8}$")


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
        time_window=body.time_window.strip(),
        status="pending",
    )
    db.add(job)
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
