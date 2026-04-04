from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import ChatMessage, User

router = APIRouter()


class ChatSendJson(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    text: str = Field(min_length=1, max_length=4000)
    from_role: str = Field(
        validation_alias=AliasChoices("from", "from_role"),
        pattern="^(client|worker)$",
    )


def _format_ts(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local = dt.astimezone()
    return local.strftime("%H:%M")


@router.get("/messages", response_model=list[dict])
def list_messages(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    rows = (
        db.execute(select(ChatMessage).order_by(ChatMessage.created_at.asc())).scalars().all()
    )
    return [
        {
            "id": str(m.id),
            "from": m.from_role,
            "text": m.body,
            "timestamp": _format_ts(m.created_at),
        }
        for m in rows
    ]


@router.post("/messages", response_model=dict)
def send_message(
    body: ChatSendJson,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict:
    if user.role != body.from_role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role does not match account")

    now = datetime.now(timezone.utc)
    msg = ChatMessage(
        sender_user_id=user.id,
        from_role=body.from_role,
        body=body.text.strip(),
        created_at=now,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {
        "id": str(msg.id),
        "from": msg.from_role,
        "text": msg.body,
        "timestamp": _format_ts(msg.created_at),
    }
