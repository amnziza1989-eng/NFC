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
    BigInteger,
    Boolean,
    Integer,
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
    """Extensible destination types."""
    GOOGLE_REVIEW = "GOOGLE_REVIEW"
    INSTAGRAM = "INSTAGRAM"
    WHATSAPP = "WHATSAPP"
    WEBSITE = "WEBSITE"
    CUSTOM_URL = "CUSTOM_URL"
    PENDING_SETUP = "PENDING_SETUP"


class PaymentStatus(str, enum.Enum):
    MOCK_PAID = "MOCK_PAID"
    PAID = "PAID"
    PENDING = "PENDING"
    FAILED = "FAILED"


class ShopOrderStatus(str, enum.Enum):
    PLACED = "PLACED"
    PROCESSING = "PROCESSING"
    FULFILLED = "FULFILLED"
    SHIPPED = "SHIPPED"
    CANCELLED = "CANCELLED"


class ShopOrderItemLinkStatus(str, enum.Enum):
    CUSTOMER_SUBMITTED = "CUSTOMER_SUBMITTED"
    NEEDS_VERIFICATION = "NEEDS_VERIFICATION"
    FINAL_GENERATED = "FINAL_GENERATED"
    VERIFIED = "VERIFIED"
    ASSIGNED_TO_CARD = "ASSIGNED_TO_CARD"


class ShopOrderItemProductionStatus(str, enum.Enum):
    NOT_PRODUCED = "NOT_PRODUCED"
    PROVISIONING = "PROVISIONING"
    QC_PENDING = "QC_PENDING"
    COMPLETED = "COMPLETED"


class ShippingMethod(str, enum.Enum):
    POST = "POST"
    COURIER = "COURIER"


class NotificationStatus(str, enum.Enum):
    NOT_SENT = "NOT_SENT"
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"


class EventType(str, enum.Enum):
    NFC = "NFC"
    QR = "QR"


class ProductType(str, enum.Enum):
    NFC_ONLY = "NFC_ONLY"
    NFC_QR = "NFC_QR"
    QR_ONLY = "QR_ONLY"
    RAW_CARD = "RAW_CARD"


PRODUCT_PHYSICAL_TEMPLATES: dict[str, str] = {
    ProductType.NFC_ONLY.value: "NFC_ONLY_TEMPLATE",
    ProductType.NFC_QR.value: "NFC_QR_TEMPLATE",
    ProductType.QR_ONLY.value: "QR_ONLY_TEMPLATE",
    ProductType.RAW_CARD.value: "RAW_CARD_TEMPLATE",
}


class OrderStatus(str, enum.Enum):
    CREATED = "CREATED"
    CARDS_GENERATED = "CARDS_GENERATED"
    PROVISIONING = "PROVISIONING"
    QC_PENDING = "QC_PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


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
    orders: Mapped[list["Order"]] = relationship(back_populates="business")


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
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    nfc_redirect_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    qr_redirect_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
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


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    order_number: Mapped[str] = mapped_column(
        String(32), unique=True, nullable=False, index=True
    )
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False
    )
    destination_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("destinations.id"), nullable=False
    )
    product_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ProductType.NFC_QR.value
    )
    quantity: Mapped[int] = mapped_column(nullable=False, default=1)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=OrderStatus.CREATED.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    business: Mapped["Business"] = relationship(back_populates="orders")
    destination: Mapped["Destination"] = relationship()
    cards: Mapped[list["Card"]] = relationship(back_populates="order")


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
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True, index=True
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

    # QC / Operational fields
    qc_nfc_tested: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")
    qc_qr_tested: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")
    qc_destination_verified: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")

    # Relationships
    business: Mapped["Business"] = relationship(back_populates="cards")
    destination: Mapped["Destination"] = relationship(back_populates="cards")
    order: Mapped["Order | None"] = relationship(back_populates="cards")
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


class ShopOrder(Base):
    __tablename__ = "shop_orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    shop_order_number: Mapped[str] = mapped_column(
        String(32), unique=True, nullable=False, index=True
    )
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_identities.id", ondelete="SET NULL"), nullable=True, index=True
    )
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(64), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    shipping_address: Mapped[str] = mapped_column(Text, nullable=False)
    shipping_city: Mapped[str] = mapped_column(String(100), nullable=False)
    shipping_province: Mapped[str | None] = mapped_column(String(100), nullable=True, default="تهران", server_default="تهران")
    shipping_postal_code: Mapped[str] = mapped_column(String(32), nullable=False)
    shipping_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    shipping_method: Mapped[str] = mapped_column(
        String(32), nullable=False, default=ShippingMethod.POST.value, server_default="POST"
    )
    shipping_tracking_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    shipping_notification_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=NotificationStatus.NOT_SENT.value, server_default="NOT_SENT"
    )
    shipping_notification_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    shipping_notification_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    shipping_notification_provider_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)
    shipping_cost: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    total_amount: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    payment_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=PaymentStatus.MOCK_PAID.value
    )
    payment_reference: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=ShopOrderStatus.PLACED.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    customer: Mapped["CustomerIdentity | None"] = relationship(back_populates="shop_orders")
    items: Mapped[list["ShopOrderItem"]] = relationship(
        back_populates="shop_order", cascade="all, delete-orphan"
    )


class ShopOrderItem(Base):
    __tablename__ = "shop_order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    shop_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shop_orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_type: Mapped[str] = mapped_column(String(20), nullable=False)
    product_title: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_price: Mapped[int] = mapped_column(BigInteger, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    destination_type: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_submitted_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    final_verified_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    link_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=ShopOrderItemLinkStatus.CUSTOMER_SUBMITTED.value
    )
    production_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=ShopOrderItemProductionStatus.NOT_PRODUCED.value
    )
    destination_configured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    fulfillment_order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Customization MVP fields
    customization_logo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    customization_color: Mapped[str | None] = mapped_column(String(32), nullable=True, default="#0F172A")
    customization_template: Mapped[str | None] = mapped_column(String(50), nullable=True, default="classic")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )

    # Relationships
    shop_order: Mapped["ShopOrder"] = relationship(back_populates="items")
    fulfillment_order: Mapped["Order | None"] = relationship()


class CardActivationSession(Base):
    __tablename__ = "card_activation_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    card_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )

    # Relationships
    card: Mapped["Card"] = relationship()


class ShippingRule(Base):
    __tablename__ = "shipping_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    province: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    postal_price: Mapped[int] = mapped_column(Integer, nullable=False, default=45000)
    courier_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    courier_price: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )



