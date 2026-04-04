from datetime import date

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SignupBody(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(pattern="^(worker|client)$")


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
    date: str
    status: str

