"""Internal management API routes.

These endpoints are separated from public routes so that authentication
can be added cleanly in a future phase without affecting public redirect
performance.
"""

import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.config import get_settings
from app.schemas.schemas import (
    BusinessCreate, BusinessUpdate, BusinessResponse,
    DestinationCreate, DestinationUpdate, DestinationResponse,
    CardCreate, CardUpdate, CardResponse, CardInfoResponse,
    EventResponse,
)
from app.services.service import (
    create_business, get_business, list_businesses, update_business,
    create_destination, get_destination, update_destination,
    create_card, get_card, list_cards, update_card, get_card_info,
    get_card_events,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Internal Management"])


# ── Business endpoints ─────────────────────────────────────────────

@router.post("/businesses", response_model=BusinessResponse, status_code=201)
async def api_create_business(
    data: BusinessCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new business."""
    business = await create_business(db, name=data.name, logo_url=data.logo_url)
    return business


@router.get("/businesses", response_model=list[BusinessResponse])
async def api_list_businesses(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all businesses."""
    return await list_businesses(db, skip=skip, limit=limit)


@router.get("/businesses/{business_id}", response_model=BusinessResponse)
async def api_get_business(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a business by ID."""
    business = await get_business(db, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@router.patch("/businesses/{business_id}", response_model=BusinessResponse)
async def api_update_business(
    business_id: uuid.UUID,
    data: BusinessUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a business."""
    business = await update_business(
        db, business_id,
        name=data.name, logo_url=data.logo_url, status=data.status,
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


# ── Destination endpoints ──────────────────────────────────────────

@router.post("/destinations", response_model=DestinationResponse, status_code=201)
async def api_create_destination(
    data: DestinationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a destination for a business."""
    # Verify business exists
    business = await get_business(db, data.business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    destination = await create_destination(
        db,
        business_id=data.business_id,
        url=data.url,
        dest_type=data.type,
    )
    return destination


@router.get("/destinations/{destination_id}", response_model=DestinationResponse)
async def api_get_destination(
    destination_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a destination by ID."""
    destination = await get_destination(db, destination_id)
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    return destination


@router.patch("/destinations/{destination_id}", response_model=DestinationResponse)
async def api_update_destination(
    destination_id: uuid.UUID,
    data: DestinationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a destination. This is the core Option B feature —
    change the destination URL without changing the physical card."""
    destination = await update_destination(
        db, destination_id,
        url=data.url, type=data.type, status=data.status,
    )
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    return destination


# ── Card endpoints ─────────────────────────────────────────────────

@router.post("/cards", response_model=CardResponse, status_code=201)
async def api_create_card(
    data: CardCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new card with a unique random code."""
    # Verify business exists
    business = await get_business(db, data.business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Verify destination exists
    destination = await get_destination(db, data.destination_id)
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")

    card = await create_card(
        db,
        business_id=data.business_id,
        destination_id=data.destination_id,
    )
    return card


@router.get("/cards", response_model=list[CardResponse])
async def api_list_cards(
    business_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List cards, optionally filtered by business."""
    return await list_cards(db, business_id=business_id, skip=skip, limit=limit)


@router.get("/cards/{card_id}", response_model=CardResponse)
async def api_get_card(
    card_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a card by ID."""
    card = await get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.patch("/cards/{card_id}", response_model=CardResponse)
async def api_update_card(
    card_id: uuid.UUID,
    data: CardUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a card (status, destination)."""
    update_data = {}
    if data.status is not None:
        update_data["status"] = data.status
    if data.destination_id is not None:
        # Verify new destination exists
        dest = await get_destination(db, data.destination_id)
        if not dest:
            raise HTTPException(status_code=404, detail="Destination not found")
        update_data["destination_id"] = data.destination_id

    card = await update_card(db, card_id, **update_data)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.get("/cards/{card_id}/info", response_model=CardInfoResponse)
async def api_card_info(
    card_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed card info for QC/operator inspection.

    Returns business, destination, NFC URL, QR URL, and recent events.
    """
    info = await get_card_info(db, card_id)
    if not info:
        raise HTTPException(status_code=404, detail="Card not found")

    settings = get_settings()
    card = info["card"]
    business = info["business"]
    destination = info["destination"]

    return CardInfoResponse(
        id=card.id,
        code=card.code,
        status=card.status,
        business_name=business.name,
        destination_url=destination.url,
        destination_type=destination.type,
        destination_status=destination.status,
        nfc_url=f"{settings.PUBLIC_BASE_URL}/n/{card.code}",
        qr_url=f"{settings.PUBLIC_BASE_URL}/q/{card.code}",
        created_at=card.created_at,
        recent_events=[
            EventResponse(
                id=e.id,
                card_id=e.card_id,
                type=e.type,
                user_agent=e.user_agent,
                created_at=e.created_at,
            )
            for e in info["recent_events"]
        ],
    )


@router.get("/cards/{card_id}/events", response_model=list[EventResponse])
async def api_card_events(
    card_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Get events for a card."""
    # Verify card exists
    card = await get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    return await get_card_events(db, card_id, skip=skip, limit=limit)
