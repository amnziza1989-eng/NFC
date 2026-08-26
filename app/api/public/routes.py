"""Public API routes — health check and card redirect endpoints."""

import logging

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.schemas import HealthResponse
from app.services.service import resolve_redirect

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Public"])
async def health_check():
    """Health check endpoint. Returns service status."""
    return HealthResponse()


async def _handle_redirect(
    card_code: str,
    event_type: str,
    request: Request,
    db: AsyncSession,
):
    """Shared redirect logic for NFC and QR endpoints."""
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    referrer = request.headers.get("referer")

    destination_url, status = await resolve_redirect(
        db=db,
        card_code=card_code,
        event_type=event_type,
        user_agent=user_agent,
        ip_address=ip_address,
        referrer=referrer,
    )

    if status == "not_found":
        return JSONResponse(
            status_code=404,
            content={"detail": "Card not found"},
        )

    if status == "disabled":
        return JSONResponse(
            status_code=410,
            content={"detail": "This card is no longer active"},
        )

    if status == "no_destination":
        return JSONResponse(
            status_code=404,
            content={"detail": "No active destination configured for this card"},
        )

    # HTTP 302 redirect to destination
    return RedirectResponse(url=destination_url, status_code=302)


@router.get("/n/{card_code}", tags=["Public"], summary="NFC tap redirect")
async def nfc_redirect(
    card_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle NFC tap. Records event and redirects to destination."""
    return await _handle_redirect(card_code, "NFC", request, db)


@router.get("/q/{card_code}", tags=["Public"], summary="QR scan redirect")
async def qr_redirect(
    card_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle QR scan. Records event and redirects to destination."""
    return await _handle_redirect(card_code, "QR", request, db)
