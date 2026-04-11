from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, WorkerProfile
from app.schemas import LoginBody, SignupBody, TokenResponse, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter()


def _user_out(user: User) -> UserOut:
    return UserOut(id=str(user.id), name=user.name, email=user.email, role=user.role)


@router.post("/signup", response_model=TokenResponse)
def signup(body: SignupBody, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    existing = db.scalar(select(User).where(User.email == body.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=body.email.lower().strip(),
        hashed_password=hash_password(body.password),
        name=body.name.strip(),
        role=body.role,
    )
    db.add(user)
    db.flush()

    if body.role == "worker":
        rate = Decimal(str(body.hourly_rate)) if body.hourly_rate is not None else Decimal("0")
        db.add(
            WorkerProfile(
                user_id=user.id,
                city="",
                hourly_rate=rate,
                available=True,
                rating_avg=0,
                services=[],
            )
        )

    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id), {"role": user.role})
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginBody, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == body.email.lower().strip()))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if user.role != body.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account is registered as a {user.role}, not a {body.role}",
        )

    token = create_access_token(str(user.id), {"role": user.role})
    return TokenResponse(access_token=token, user=_user_out(user))
