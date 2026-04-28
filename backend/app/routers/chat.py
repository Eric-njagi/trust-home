from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import ChatMessage, Job, User, WorkerProfile

router = APIRouter()


class ChatSendJson(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    text: str = Field(min_length=1, max_length=4000)
    to_user_id: str = Field(
        validation_alias=AliasChoices("to_user_id", "toUserId"),
        min_length=1,
    )
    from_role: str | None = Field(
        default=None,
        validation_alias=AliasChoices("from", "from_role"),
        pattern="^(client|worker)$",
    )


def _format_ts(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local = dt.astimezone()
    return local.strftime("%H:%M")


@router.get("/messages", response_model=list[dict])
def list_messages(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    peer_user_id: Annotated[str | None, Query(alias="peerUserId")] = None,
) -> list[dict]:
    if not peer_user_id:
        return []
    try:
        peer_id = UUID(peer_user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid peer user id")

    peer = db.get(User, peer_id)
    if not peer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat user not found")
    if not _users_can_chat(db, user, peer):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot chat with this user")

    rows = (
        db.execute(
            select(ChatMessage)
            .where(
                or_(
                    (ChatMessage.sender_user_id == user.id) & (ChatMessage.recipient_user_id == peer_id),
                    (ChatMessage.sender_user_id == peer_id) & (ChatMessage.recipient_user_id == user.id),
                )
            )
            .order_by(ChatMessage.created_at.asc())
        )
        .scalars()
        .all()
    )
    return [
        {
            "id": str(m.id),
            "from": m.from_role,
            "fromUserId": str(m.sender_user_id) if m.sender_user_id else "",
            "toUserId": str(m.recipient_user_id) if m.recipient_user_id else "",
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
    if body.from_role and user.role != body.from_role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role does not match account")
    try:
        to_user_id = UUID(body.to_user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid recipient user id")
    if to_user_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send a message to yourself")

    recipient = db.get(User, to_user_id)
    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat user not found")
    if not _users_can_chat(db, user, recipient):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot chat with this user")

    now = datetime.now(timezone.utc)
    msg = ChatMessage(
        sender_user_id=user.id,
        recipient_user_id=to_user_id,
        from_role=user.role,
        body=body.text.strip(),
        created_at=now,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {
        "id": str(msg.id),
        "from": msg.from_role,
        "fromUserId": str(msg.sender_user_id) if msg.sender_user_id else "",
        "toUserId": str(msg.recipient_user_id) if msg.recipient_user_id else "",
        "text": msg.body,
        "timestamp": _format_ts(msg.created_at),
    }


def _users_can_chat(db: Session, a: User, b: User) -> bool:
    # Only client-worker direct chat is allowed.
    if a.role == b.role:
        return False
    client = a if a.role == "client" else b
    worker = a if a.role == "worker" else b
    worker_profile = db.scalar(select(WorkerProfile).where(WorkerProfile.user_id == worker.id))
    if not worker_profile:
        return False
    linked_job = db.scalar(
        select(Job.id).where(Job.client_user_id == client.id, Job.worker_profile_id == worker_profile.id)
    )
    return linked_job is not None


@router.get("/contacts", response_model=list[dict])
def list_contacts(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[dict]:
    contacts: dict[str, dict] = {}
    if user.role == "client":
        jobs = db.execute(select(Job).where(Job.client_user_id == user.id)).scalars().all()
        for job in jobs:
            wp = db.get(WorkerProfile, job.worker_profile_id)
            if not wp:
                continue
            worker_user = db.get(User, wp.user_id)
            if not worker_user:
                continue
            contacts[str(worker_user.id)] = {
                "id": str(worker_user.id),
                "name": worker_user.name,
                "role": worker_user.role,
            }
    else:
        wp = db.scalar(select(WorkerProfile).where(WorkerProfile.user_id == user.id))
        if wp:
            jobs = db.execute(select(Job).where(Job.worker_profile_id == wp.id)).scalars().all()
            for job in jobs:
                client_user = db.get(User, job.client_user_id)
                if not client_user:
                    continue
                contacts[str(client_user.id)] = {
                    "id": str(client_user.id),
                    "name": client_user.name,
                    "role": client_user.role,
                }

    return sorted(contacts.values(), key=lambda c: c["name"].lower())
