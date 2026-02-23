"""Authentication-related API routes (login, signup, etc.).

Endpoints will be implemented in a later step.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])
