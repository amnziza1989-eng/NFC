import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Index,
    Boolean,
    Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

def _new_uuid() -> uuid.UUID:
    return uuid.uuid4()


class CustomerIdentity(Base):
    """
    The root record representing a unique human customer.
    """
    __tablename__ = "customer_identities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    methods: Mapped[list["IdentityMethod"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )
    shop_orders: Mapped[list["ShopOrder"]] = relationship(
        back_populates="customer"
    )


class IdentityMethod(Base):
    """
    Links verification methods (PHONE, EMAIL, GOOGLE) to a CustomerIdentity.
    """
    __tablename__ = "identity_methods"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_identities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(20), nullable=False) # 'PHONE', 'EMAIL', 'GOOGLE'
    provider_value: Mapped[str] = mapped_column(String(255), nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )

    # Relationships
    customer: Mapped["CustomerIdentity"] = relationship(back_populates="methods")

    __table_args__ = (
        Index("uix_identity_methods_provider_value", "provider", "provider_value", unique=True),
    )


class OtpSession(Base):
    """
    Tracks OTP verification attempts for phone or email.
    """
    __tablename__ = "otp_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=_new_uuid
    )
    provider: Mapped[str] = mapped_column(String(20), nullable=False) # 'PHONE', 'EMAIL'
    provider_value: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    purpose: Mapped[str] = mapped_column(String(50), nullable=False, default="CHECKOUT")
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    debug_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    resend_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    consumed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
