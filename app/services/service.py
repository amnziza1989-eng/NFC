"""Business logic / service layer for the NFC Review Platform."""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import (
    Business, Card, Destination, Event,
    CardStatus, DestinationStatus, BusinessStatus,
)
from app.utils.code_generator import generate_card_code

logger = logging.getLogger(__name__)


# ── Business Service ───────────────────────────────────────────────

async def create_business(db: AsyncSession, name: str, logo_url: str | None = None) -> Business:
    """Create a new business."""
    business = Business(name=name, logo_url=logo_url)
    db.add(business)
    await db.flush()
    logger.info("Business created: %s (id=%s)", name, business.id)
    return business


async def get_business(db: AsyncSession, business_id: uuid.UUID) -> Business | None:
    """Get a business by ID."""
    return await db.get(Business, business_id)


async def list_businesses(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Business]:
    """List all businesses with pagination."""
    result = await db.execute(
        select(Business).offset(skip).limit(limit).order_by(Business.created_at.desc())
    )
    return list(result.scalars().all())


async def update_business(
    db: AsyncSession,
    business_id: uuid.UUID,
    **kwargs,
) -> Business | None:
    """Update business fields."""
    business = await db.get(Business, business_id)
    if not business:
        return None
    for key, value in kwargs.items():
        if value is not None and hasattr(business, key):
            setattr(business, key, value)
    business.updated_at = datetime.now(timezone.utc)
    await db.flush()
    logger.info("Business updated: id=%s", business_id)
    return business


# ── Destination Service ────────────────────────────────────────────

async def create_destination(
    db: AsyncSession,
    business_id: uuid.UUID,
    url: str,
    dest_type: str = "GOOGLE_REVIEW",
) -> Destination:
    """Create a new destination for a business."""
    destination = Destination(
        business_id=business_id,
        url=url,
        type=dest_type,
    )
    db.add(destination)
    await db.flush()
    logger.info("Destination created: type=%s (id=%s)", dest_type, destination.id)
    return destination


async def get_destination(db: AsyncSession, destination_id: uuid.UUID) -> Destination | None:
    """Get a destination by ID."""
    return await db.get(Destination, destination_id)


async def update_destination(
    db: AsyncSession,
    destination_id: uuid.UUID,
    **kwargs,
) -> Destination | None:
    """Update destination fields (especially URL for the core Option B feature)."""
    destination = await db.get(Destination, destination_id)
    if not destination:
        return None
    for key, value in kwargs.items():
        if value is not None and hasattr(destination, key):
            setattr(destination, key, value)
    destination.updated_at = datetime.now(timezone.utc)
    await db.flush()
    logger.info("Destination updated: id=%s", destination_id)
    return destination


# ── Card Service ───────────────────────────────────────────────────

async def create_card(
    db: AsyncSession,
    business_id: uuid.UUID,
    destination_id: uuid.UUID,
) -> Card:
    """Create a new card with a unique random code."""
    # Generate unique code with retry
    for _ in range(10):
        code = generate_card_code()
        existing = await db.execute(select(Card).where(Card.code == code))
        if existing.scalar_one_or_none() is None:
            break
    else:
        raise RuntimeError("Failed to generate unique card code after 10 attempts")

    card = Card(
        business_id=business_id,
        destination_id=destination_id,
        code=code,
    )
    db.add(card)
    await db.flush()
    logger.info("Card created: code=%s (id=%s)", code, card.id)
    return card


async def get_card(db: AsyncSession, card_id: uuid.UUID) -> Card | None:
    """Get a card by ID."""
    return await db.get(Card, card_id)


async def get_card_by_code(db: AsyncSession, code: str) -> Card | None:
    """Get a card by its public code (for redirect lookup)."""
    result = await db.execute(select(Card).where(Card.code == code))
    return result.scalar_one_or_none()


async def list_cards(
    db: AsyncSession,
    business_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Card]:
    """List cards, optionally filtered by business."""
    query = select(Card).offset(skip).limit(limit).order_by(Card.created_at.desc())
    if business_id:
        query = query.where(Card.business_id == business_id)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_card(
    db: AsyncSession,
    card_id: uuid.UUID,
    **kwargs,
) -> Card | None:
    """Update card fields (status, destination)."""
    card = await db.get(Card, card_id)
    if not card:
        return None
    for key, value in kwargs.items():
        if value is not None and hasattr(card, key):
            setattr(card, key, value)
    card.updated_at = datetime.now(timezone.utc)
    await db.flush()
    logger.info("Card updated: id=%s", card_id)
    return card


async def get_card_info(db: AsyncSession, card_id: uuid.UUID) -> dict | None:
    """Get detailed card info for QC inspection."""
    result = await db.execute(
        select(Card)
        .where(Card.id == card_id)
        .options(
            selectinload(Card.business),
            selectinload(Card.destination),
            selectinload(Card.events),
        )
    )
    card = result.scalar_one_or_none()
    if not card:
        return None

    # Get last 10 events
    events_result = await db.execute(
        select(Event)
        .where(Event.card_id == card_id)
        .order_by(Event.created_at.desc())
        .limit(10)
    )
    recent_events = list(events_result.scalars().all())

    return {
        "card": card,
        "business": card.business,
        "destination": card.destination,
        "recent_events": recent_events,
    }


# ── Event Service ──────────────────────────────────────────────────

async def create_event(
    db: AsyncSession,
    card_id: uuid.UUID,
    event_type: str,
    user_agent: str | None = None,
    ip_address: str | None = None,
    referrer: str | None = None,
) -> Event:
    """Record a card interaction event."""
    event = Event(
        card_id=card_id,
        type=event_type,
        user_agent=user_agent,
        ip_address=ip_address,
        referrer=referrer,
    )
    db.add(event)
    await db.flush()
    return event


async def get_card_events(
    db: AsyncSession,
    card_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> list[Event]:
    """Get events for a card with pagination."""
    result = await db.execute(
        select(Event)
        .where(Event.card_id == card_id)
        .order_by(Event.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


# ── Redirect Service ──────────────────────────────────────────────

async def resolve_redirect(
    db: AsyncSession,
    card_code: str,
    event_type: str,
    user_agent: str | None = None,
    ip_address: str | None = None,
    referrer: str | None = None,
) -> tuple[str, str]:
    """Resolve a card code to a destination URL and record the event.

    Returns:
        Tuple of (destination_url, status) where status is one of:
        'ok', 'not_found', 'disabled', 'no_destination'

    Raises:
        Nothing — returns status strings for the API layer to handle.
    """
    # 1. Find card
    card = await get_card_by_code(db, card_code)
    if not card:
        logger.warning("Redirect failed: card not found (code=%s)", card_code)
        return ("", "not_found")

    # 2. Check card status
    if card.status != CardStatus.ACTIVE.value:
        logger.warning("Redirect failed: card disabled (code=%s)", card_code)
        return ("", "disabled")

    # 3. Find destination
    destination = await get_destination(db, card.destination_id)
    if not destination or destination.status != DestinationStatus.ACTIVE.value:
        logger.warning("Redirect failed: no active destination (code=%s)", card_code)
        return ("", "no_destination")

    # 4. Record event
    await create_event(
        db=db,
        card_id=card.id,
        event_type=event_type,
        user_agent=user_agent,
        ip_address=ip_address,
        referrer=referrer,
    )

    logger.info("Redirect: code=%s type=%s → destination=%s", card_code, event_type, destination.id)
    return (destination.url, "ok")
