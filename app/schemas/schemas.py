"""Pydantic schemas for request/response validation."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict
from urllib.parse import urlparse


# ── Business ───────────────────────────────────────────────────────

class BusinessCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    logo_url: str | None = Field(None, max_length=2048)


class BusinessUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    logo_url: str | None = Field(None, max_length=2048)
    status: str | None = Field(None, pattern=r"^(ACTIVE|DISABLED)$")


class BusinessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    logo_url: str | None
    status: str
    created_at: datetime
    updated_at: datetime


# ── Destination ────────────────────────────────────────────────────

class DestinationCreate(BaseModel):
    business_id: uuid.UUID
    type: str = Field(default="GOOGLE_REVIEW", pattern=r"^[A-Z_]+$")
    url: str = Field(..., max_length=2048)

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validate destination URL to prevent open redirects and dangerous schemes."""
        parsed = urlparse(v)

        # Must have a scheme and netloc
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("URL must include scheme and domain (e.g. https://example.com)")

        # Only allow https (and http for dev)
        if parsed.scheme not in ("https", "http"):
            raise ValueError("URL scheme must be https or http")

        # Block dangerous patterns
        if parsed.netloc.strip() == "":
            raise ValueError("URL must have a valid domain")

        return v


class DestinationUpdate(BaseModel):
    url: str | None = Field(None, max_length=2048)
    type: str | None = Field(None, pattern=r"^[A-Z_]+$")
    status: str | None = Field(None, pattern=r"^(ACTIVE|DISABLED)$")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("URL must include scheme and domain")
        if parsed.scheme not in ("https", "http"):
            raise ValueError("URL scheme must be https or http")
        return v


class DestinationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    type: str
    url: str
    status: str
    created_at: datetime
    updated_at: datetime


# ── Card ───────────────────────────────────────────────────────────

class CardCreate(BaseModel):
    business_id: uuid.UUID
    destination_id: uuid.UUID


class CardUpdate(BaseModel):
    destination_id: uuid.UUID | None = None
    status: str | None = Field(None, pattern=r"^(ACTIVE|DISABLED)$")


class CardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    destination_id: uuid.UUID
    code: str
    status: str
    created_at: datetime
    updated_at: datetime


class CardInfoResponse(BaseModel):
    """Extended card info for QC and operator inspection."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    status: str
    business_name: str
    destination_url: str
    destination_type: str
    destination_status: str
    nfc_url: str
    qr_url: str
    created_at: datetime
    recent_events: list["EventResponse"] = []


# ── Event ──────────────────────────────────────────────────────────

class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    card_id: uuid.UUID
    type: str
    user_agent: str | None
    created_at: datetime


# ── Health ─────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "nfc-review-platform"
    version: str = "0.1.0"
