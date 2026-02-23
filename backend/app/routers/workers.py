"""Worker-related API routes.

Will cover worker profiles, availability, job management, and ratings.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/workers", tags=["workers"])
