"""Chat-related API routes.

Will likely use WebSockets for real-time messaging between clients and workers.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/chat", tags=["chat"])
