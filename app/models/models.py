"""SQLAlchemy ORM models for the NFC Review Platform."""

import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


# ── Enums ──────────────────────────────────────────────────────────

class BusinessStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"


class CardStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"


class DestinationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"


class DestinationType(str, enum.Enum):
    """Extensible destination types. V1 uses GOOGLE_REVIEW only."""
    GOOGLE_REVIEW = "GOOGLE_REVIEW"
    # Future:
    # INSTAGRAM = "INSTAGRAM"
    # WHATSAPP = "WHATSAPP"
    # WEBSITE = "WEBSITE"
    # MENU = "MENU"
    # BOOKING = "BOOKING"
    # CUSTOM_URL = "CUSTOM_URL"


class EventType(str, enum.Enum):
    NFC = "NFC"
    QR = "QR"


# ── Helper ─────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_uuid() -> uuid.UUID:
    return uuid.uuid4()


# ── Models ─────────────────────────────────────────────────────────

class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=BusinessStatus.ACTIVE.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    cards: Mapped[list["Card"]] = relationship(back_populates="business")
    destinations: Mapped[list["Destination"]] = relationship(back_populates="business")


class Destination(Base):
    __tablename__ = "destinations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(50), nullable=False, default=DestinationType.GOOGLE_REVIEW.value
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=DestinationStatus.ACTIVE.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    business: Mapped["Business"] = relationship(back_populates="destinations")
    cards: Mapped[list["Card"]] = relationship(back_populates="destination")


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False
    )
    destination_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("destinations.id"), nullable=False
    )
    code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=CardStatus.ACTIVE.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    business: Mapped["Business"] = relationship(back_populates="cards")
    destination: Mapped["Destination"] = relationship(back_populates="cards")
    events: Mapped[list["Event"]] = relationship(back_populates="card")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    card_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cards.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(10), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )

    # Relationships
    card: Mapped["Card"] = relationship(back_populates="events")

    # Indexes for future analytics queries
    __table_args__ = (
        Index("ix_events_card_id_created_at", "card_id", "created_at"),
        Index("ix_events_type", "type"),
    )
