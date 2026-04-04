from datetime import date
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import ALLOWED_SERVICE_IDS, service_label
from app.database import get_db
from app.deps import get_worker_profile, require_worker
from app.models import Invoice, Job, User, WorkerProfile
from app.schemas import JobOut, JobStatusUpdate, WorkerProfileUpdate, WorkerPublic

router = APIRouter()


def _worker_public(wp: WorkerProfile, display_name: str) -> WorkerPublic:
    return WorkerPublic(
        id=str(wp.id),
        name=display_name,
        rating=float(wp.rating_avg or 0),
        services=list(wp.services or []),
        hourlyRate=float(wp.hourly_rate or 0),
        city=wp.city or "",
        available=bool(wp.available),
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


@router.get("", response_model=list[WorkerPublic])
def list_workers(
    db: Annotated[Session, Depends(get_db)],
    service_id: Annotated[str | None, Query(alias="serviceId")] = None,
) -> list[WorkerPublic]:
    q = select(WorkerProfile, User).join(User, WorkerProfile.user_id == User.id).where(User.role == "worker")
    rows = db.execute(q).all()
    out: list[WorkerPublic] = []
    for wp, user in rows:
        svc = list(wp.services or [])
        if service_id and service_id not in svc:
            continue
        out.append(_worker_public(wp, user.name))
    return out


@router.get("/me", response_model=dict)
def get_my_worker_profile(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_worker)],
    wp: Annotated[WorkerProfile, Depends(get_worker_profile)],
) -> dict:
    return {
        "id": str(wp.id),
        "email": user.email,
        "name": user.name,
        "city": wp.city or "",
        "hourlyRate": float(wp.hourly_rate or 0),
        "services": list(wp.services or []),
        "available": bool(wp.available),
        "rating": float(wp.rating_avg or 0),
    }


def _normalize_service_ids(raw: list[str]) -> list[str]:
    unknown = [s for s in raw if s not in ALLOWED_SERVICE_IDS]
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown service ids: {', '.join(unknown)}",
        )
    seen: set[str] = set()
    out: list[str] = []
    for s in raw:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


@router.patch("/me", response_model=dict)
def update_my_worker_profile(
    body: WorkerProfileUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_worker)],
    wp: Annotated[WorkerProfile, Depends(get_worker_profile)],
) -> dict:
    if body.name is not None:
        user.name = body.name.strip()
    if body.city is not None:
        wp.city = body.city.strip()
    if body.hourly_rate is not None:
        wp.hourly_rate = Decimal(str(body.hourly_rate))
    if body.services is not None:
        wp.services = _normalize_service_ids(list(body.services))
    if body.available is not None:
        wp.available = body.available
    db.commit()
    db.refresh(wp)
    db.refresh(user)
    return {
        "id": str(wp.id),
        "email": user.email,
        "name": user.name,
        "city": wp.city or "",
        "hourlyRate": float(wp.hourly_rate or 0),
        "services": list(wp.services or []),
        "available": bool(wp.available),
        "rating": float(wp.rating_avg or 0),
    }


@router.get("/me/jobs", response_model=list[JobOut])
def my_jobs(
    db: Annotated[Session, Depends(get_db)],
    wp: Annotated[WorkerProfile, Depends(get_worker_profile)],
) -> list[JobOut]:
    jobs = (
        db.execute(select(Job).where(Job.worker_profile_id == wp.id).order_by(Job.job_date.desc()))
        .scalars()
        .all()
    )
    out: list[JobOut] = []
    for job in jobs:
        client = db.get(User, job.client_user_id)
        out.append(_job_out(job, wp.id, client.name if client else "Client"))
    return out


@router.patch("/me/jobs/{job_id}", response_model=JobOut)
def update_job_status(
    job_id: UUID,
    body: JobStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    wp: Annotated[WorkerProfile, Depends(get_worker_profile)],
) -> JobOut:
    job = db.get(Job, job_id)
    if not job or job.worker_profile_id != wp.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job is no longer pending")

    if body.status == "accepted":
        job.status = "accepted"
        hours = Decimal("3")
        amount = (wp.hourly_rate or Decimal("0")) * hours
        if amount <= 0:
            amount = Decimal("50")
        inv = Invoice(
            job_id=job.id,
            client_user_id=job.client_user_id,
            worker_profile_id=wp.id,
            service_label=service_label(job.service_id),
            amount=amount,
            invoice_date=date.today(),
            status="Unpaid",
        )
        db.add(inv)
    else:
        job.status = "rejected"

    db.commit()
    db.refresh(job)
    client = db.get(User, job.client_user_id)
    return _job_out(job, wp.id, client.name if client else "Client")
