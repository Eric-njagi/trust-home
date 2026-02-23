"""Client-related API routes.

Will cover client profiles, bookings, invoices, and ratings.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/clients", tags=["clients"])
