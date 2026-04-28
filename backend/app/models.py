import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)  # worker | client
    city: Mapped[str] = mapped_column(String(128), default="", nullable=False)
    # Nullable for existing rows; enforced for new signups at the API layer + unique index in bootstrap.
    id_number: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)

    worker_profile: Mapped["WorkerProfile | None"] = relationship(
        "WorkerProfile", back_populates="user", uselist=False
    )


class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    city: Mapped[str] = mapped_column(String(128), default="", nullable=False)
    hourly_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("0"))
    services: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    user: Mapped["User"] = relationship("User", back_populates="worker_profile")
    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="worker")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False
    )
    client_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    service_id: Mapped[str] = mapped_column(String(64), nullable=False)
    job_date: Mapped[date] = mapped_column(Date, nullable=False)
    time_window: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)

    worker: Mapped["WorkerProfile"] = relationship("WorkerProfile", back_populates="jobs")
    invoice: Mapped["Invoice | None"] = relationship("Invoice", back_populates="job", uselist=False)


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    client_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    worker_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False
    )
    service_label: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    net_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    hours_worked: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    deductions: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Unpaid", nullable=False)

    job: Mapped["Job"] = relationship("Job", back_populates="invoice")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    from_role: Mapped[str] = mapped_column(String(16), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
