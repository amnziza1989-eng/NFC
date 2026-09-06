"""Public API routes — health check and card redirect endpoints."""

import logging
import io
import qrcode

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse, JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.schemas import HealthResponse
from app.services.service import resolve_redirect, get_card_by_code
from app.api.dependencies.rate_limit import rate_limit
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Public"])
async def health_check():
    """Health check endpoint. Returns service status."""
    return HealthResponse()


@router.get("/ready", tags=["Public"])
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness check. Ensures DB is reachable.
    Redis failure is ignored for readiness since rate limiting fails open.
    """
    from sqlalchemy import text
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error("Readiness check failed: DB unreachable - %s", e)
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Service Unavailable")
    return {"status": "ready"}


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
        settings = get_settings()
        activation_url = f"{settings.PUBLIC_BASE_URL}/activate/{card_code}"
        return RedirectResponse(url=activation_url, status_code=302)

    # HTTP 302 redirect to destination
    await db.commit()
    return RedirectResponse(url=destination_url, status_code=302)


@router.get("/n/{card_code}", tags=["Public"], summary="NFC tap redirect", dependencies=[Depends(rate_limit)])
async def nfc_redirect(
    card_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle NFC tap. Records event and redirects to destination."""
    return await _handle_redirect(card_code, "NFC", request, db)


@router.get("/q/{card_code}", tags=["Public"], summary="QR scan redirect", dependencies=[Depends(rate_limit)])
async def qr_redirect(
    card_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle QR scan. Records event and redirects to destination."""
    return await _handle_redirect(card_code, "QR", request, db)


@router.get("/q/{card_code}/qr.png", tags=["Public"], summary="Generate QR Code image", dependencies=[Depends(rate_limit)])
async def generate_qr_image(
    card_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Generate a PNG QR code for the given card.
    
    This only contains the public /q/{code} URL and doesn't expose internal IDs.
    """
    card = await get_card_by_code(db, card_code)
    if not card:
        return JSONResponse(status_code=404, content={"detail": "Card not found"})

    settings = get_settings()
    qr_url = f"{settings.PUBLIC_BASE_URL}/q/{card_code}"

    # Generate QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to memory buffer
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")
