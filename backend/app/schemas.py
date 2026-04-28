from datetime import date

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, model_validator


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    city: str = ""
    phone_number: str | None = Field(
        default=None,
        validation_alias=AliasChoices("phone_number", "phoneNumber"),
        serialization_alias="phoneNumber",
    )
    id_number: str | None = Field(
        default=None,
        validation_alias=AliasChoices("id_number", "idNumber"),
        serialization_alias="idNumber",
    )

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SignupBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(pattern="^(worker|client)$")
    city: str = Field(min_length=1, max_length=128)
    phone_number: str = Field(
        min_length=9,
        max_length=20,
        pattern=r"^\+?\d{9,20}$",
        validation_alias=AliasChoices("phone_number", "phoneNumber"),
    )
    id_number: str = Field(
        min_length=7,
        max_length=8,
        pattern=r"^\d{7,8}$",
        validation_alias=AliasChoices("id_number", "idNumber"),
    )
    hourly_rate: float | None = Field(
        default=None,
        validation_alias=AliasChoices("hourly_rate", "hourlyRate"),
        ge=0,
    )

    @model_validator(mode="after")
    def worker_hourly_required(self) -> "SignupBody":
        if self.role == "worker":
            if self.hourly_rate is None or self.hourly_rate <= 0:
                raise ValueError("Workers must provide an hourly rate in Kenyan Shillings (greater than 0).")
        return self


class LoginBody(BaseModel):
    email: EmailStr
    password: str
    role: str = Field(pattern="^(worker|client)$")


class WorkerPublic(BaseModel):
    id: str
    name: str
    rating: float
    services: list[str]
    hourlyRate: float
    city: str
    available: bool


class JobOut(BaseModel):
    id: str
    workerId: str
    clientName: str
    service: str
    date: str
    time: str
    status: str


class ClientJobOut(BaseModel):
    id: str
    workerId: str
    workerName: str
    service: str
    date: str
    time: str
    status: str


class WorkerProfileUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = Field(default=None, min_length=1, max_length=255)
    city: str | None = None
    hourly_rate: float | None = Field(
        default=None,
        validation_alias=AliasChoices("hourly_rate", "hourlyRate"),
        ge=0,
    )
    services: list[str] | None = None
    available: bool | None = None


class JobStatusUpdate(BaseModel):
    status: str = Field(pattern="^(accepted|rejected)$")


class JobCompleteBody(BaseModel):
    hours_worked: float = Field(
        ge=0.25,
        le=24,
        validation_alias=AliasChoices("hours_worked", "hoursWorked"),
    )


class BookingCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    worker_id: str = Field(
        min_length=1,
        validation_alias=AliasChoices("worker_id", "workerId"),
    )
    service_id: str = Field(
        min_length=1,
        max_length=64,
        validation_alias=AliasChoices("service_id", "serviceId"),
    )
    job_date: date = Field(validation_alias=AliasChoices("job_date", "jobDate"))
    time_window: str = Field(
        min_length=1,
        max_length=128,
        validation_alias=AliasChoices("time_window", "timeWindow"),
    )


class InvoiceOut(BaseModel):
    id: str
    clientName: str
    workerName: str
    service: str
    amount: float
    gross: float | None = None
    net: float | None = None
    hoursWorked: float | None = None
    deductions: dict | None = None
    date: str
    status: str


class InvoiceMpesaPay(BaseModel):
    """M-Pesa STK-style payment request (phone validated; settlement is app-managed)."""

    model_config = ConfigDict(populate_by_name=True)

    mpesa_phone: str = Field(
        min_length=9,
        max_length=20,
        validation_alias=AliasChoices("mpesa_phone", "mpesaPhone"),
    )

