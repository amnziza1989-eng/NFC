"""Pydantic schemas for request/response validation."""

import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, field_validator, model_validator, computed_field, ConfigDict
from urllib.parse import urlparse


# ── Business ───────────────────────────────────────────────────────

class BusinessCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    logo_url: str | None = Field(None, max_length=2048)

    @field_validator("logo_url")
    @classmethod
    def validate_logo_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("URL must include scheme and domain (e.g. https://example.com/logo.png)")
        if parsed.scheme not in ("https", "http"):
            raise ValueError("URL scheme must be https or http")
        if parsed.netloc.strip() == "":
            raise ValueError("URL must have a valid domain")
        return v


class BusinessUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    logo_url: str | None = Field(None, max_length=2048)
    status: str | None = Field(None, pattern=r"^(ACTIVE|DISABLED)$")

    @field_validator("logo_url")
    @classmethod
    def validate_logo_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("URL must include scheme and domain (e.g. https://example.com/logo.png)")
        if parsed.scheme not in ("https", "http"):
            raise ValueError("URL scheme must be https or http")
        if parsed.netloc.strip() == "":
            raise ValueError("URL must have a valid domain")
        return v


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
    source_url: str = Field(default="", max_length=2048)

    @model_validator(mode="before")
    @classmethod
    def resolve_source_url(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("source_url") and data.get("url"):
                data["source_url"] = data["url"]
        return data

    @field_validator("source_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validate destination URL to prevent open redirects and dangerous schemes."""
        if not v or not v.strip():
            raise ValueError("Destination URL is required")
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
    source_url: str | None = Field(None, max_length=2048)
    type: str | None = Field(None, pattern=r"^[A-Z_]+$")
    status: str | None = Field(None, pattern=r"^(ACTIVE|DISABLED)$")

    @model_validator(mode="before")
    @classmethod
    def resolve_source_url(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("source_url") and data.get("url"):
                data["source_url"] = data["url"]
        return data

    @field_validator("source_url")
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
    source_url: str
    status: str
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def url(self) -> str:
        return self.source_url


# ── Order ──────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    business_id: uuid.UUID
    destination_id: uuid.UUID
    product_type: str = Field(default="NFC_QR", pattern=r"^(NFC_ONLY|NFC_QR|QR_ONLY|RAW_CARD)$")
    quantity: int = Field(default=1, ge=1, le=500)


class OrderUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(CREATED|CARDS_GENERATED|PROVISIONING|QC_PENDING|COMPLETED|CANCELLED)$")


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_number: str
    business_id: uuid.UUID
    destination_id: uuid.UUID
    product_type: str
    physical_template: str = "NFC_QR_TEMPLATE"
    quantity: int
    cards_generated_count: int = 0
    status: str
    created_at: datetime
    updated_at: datetime


class OrderDetailResponse(OrderResponse):
    business_name: str
    destination_url: str
    destination_type: str


class OrderCardGenerationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: uuid.UUID
    order_number: str
    product_type: str
    physical_template: str
    requested_quantity: int
    generated_count: int
    status: str
    cards: list["CardResponse"]


class OrderReconciliationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: uuid.UUID
    order_number: str
    product_type: str
    physical_template: str
    ordered_quantity: int
    cards_generated_count: int
    missing_cards_count: int
    is_nfc_only: bool
    qc_nfc_passed_count: int
    qc_qr_passed_count: int
    qc_destination_verified_count: int
    all_qc_passed_count: int
    is_ready_for_delivery: bool
    blocking_reasons: list[str]


class QRLabelItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    card_id: uuid.UUID
    card_code: str
    qr_url: str
    qr_image_url: str
    sequence_number: int
    order_number: str
    business_name: str


class OrderQRLabelsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: uuid.UUID
    order_number: str
    business_name: str
    product_type: str
    total_labels: int
    labels: list[QRLabelItem]


# ── Card ───────────────────────────────────────────────────────────

class CardCreate(BaseModel):
    business_id: uuid.UUID
    destination_id: uuid.UUID
    order_id: uuid.UUID | None = None


class CardUpdate(BaseModel):
    destination_id: uuid.UUID | None = None
    status: str | None = Field(None, pattern=r"^(ACTIVE|DISABLED)$")
    qc_nfc_tested: bool | None = None
    qc_qr_tested: bool | None = None
    qc_destination_verified: bool | None = None


class CardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    destination_id: uuid.UUID
    order_id: uuid.UUID | None = None
    code: str
    status: str
    created_at: datetime
    updated_at: datetime
    qc_nfc_tested: bool
    qc_qr_tested: bool
    qc_destination_verified: bool


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
    order_id: uuid.UUID | None = None
    created_at: datetime
    recent_events: list["EventResponse"] = []
    qc_nfc_tested: bool = False
    qc_qr_tested: bool = False
    qc_destination_verified: bool = False


# ── Event ──────────────────────────────────────────────────────────

class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    card_id: uuid.UUID
    type: str
    user_agent: str | None
    created_at: datetime


# ── Provisioning & Analytics ───────────────────────────────────────

class ProvisioningResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    card_id: uuid.UUID
    card_code: str
    status: str
    nfc_url: str
    qr_url: str
    qr_image_url: str
    business: BusinessResponse
    destination: DestinationResponse
    qc_nfc_tested: bool
    qc_qr_tested: bool
    qc_destination_verified: bool


class AnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total: int
    nfc: int
    qr: int
    recent: list[EventResponse]


class BusinessAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total: int
    nfc: int
    qr: int
    total_cards: int
    active_cards: int
    recent: list[EventResponse]

# ── Health ─────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "nfc-review-platform"
    version: str = "0.1.0"


# Admin Auth Schemas
class IdentityMethodAdminResponse(BaseModel):
    id: uuid.UUID
    provider: str
    provider_value: str
    verified_at: datetime | None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class CustomerIdentityAdminResponse(BaseModel):
    id: uuid.UUID
    name: str | None
    created_at: datetime
    updated_at: datetime
    methods: list[IdentityMethodAdminResponse]
    
    model_config = ConfigDict(from_attributes=True)

class OtpSessionAdminResponse(BaseModel):
    id: uuid.UUID
    provider: str
    provider_value: str
    purpose: str
    debug_code: str | None = None
    expires_at: datetime
    attempts: int
    resend_count: int
    consumed: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Admin Dashboard Schemas──────────────────────────────────────────────────────

class DashboardOverviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_businesses: int
    active_businesses: int
    total_cards: int
    active_cards: int
    total_events: int
    nfc_events: int
    qr_events: int


# ── Shop ───────────────────────────────────────────────────────────

class ShopProductResponse(BaseModel):
    id: str
    title_fa: str
    title_en: str
    product_type: str
    physical_template: str
    unit_price: int
    currency: str = "TOMAN"
    description_fa: str
    description_en: str
    features_fa: list[str]
    features_en: list[str]
    is_available: bool = True
    supported_destination_types: list[str]


class ShopCatalogResponse(BaseModel):
    products: list[ShopProductResponse]


class ShopCartItemInput(BaseModel):
    product_type: str = Field(..., pattern=r"^(NFC_ONLY|NFC_QR|QR_ONLY|RAW_CARD)$")
    product_title: str = Field(..., min_length=1, max_length=255)
    unit_price: int = Field(..., ge=0)
    quantity: int = Field(default=1, ge=1, le=100)
    destination_configured: bool = Field(default=True)
    destination_type: str = Field(default="GOOGLE_REVIEW", max_length=50)
    destination_url: str | None = Field(default=None, max_length=2048)
    # Customization MVP
    customization_logo_url: str | None = Field(default=None, max_length=2048)
    customization_color: str | None = Field(default="#0F172A", pattern=r"^#([A-Fa-f0-9]{6})$")
    customization_template: str | None = Field(default="classic", pattern=r"^(classic|modern|minimal)$")

    @field_validator("destination_url")
    @classmethod
    def validate_destination_url(cls, v: str | None, info) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("URL must include scheme and domain (e.g. https://example.com)")
        if parsed.scheme not in ("https", "http"):
            raise ValueError("URL scheme must be https or http")
        if parsed.netloc.strip() == "":
            raise ValueError("URL must have a valid domain")
        return v


class ShopCustomerInput(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    phone: str = Field(..., min_length=5, max_length=64)
    company_name: str | None = Field(default=None, max_length=255)


class ShopShippingInput(BaseModel):
    address: str = Field(..., min_length=5, max_length=1000)
    city: str = Field(..., min_length=2, max_length=100)
    province: str | None = Field(default="تهران", max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=32)
    notes: str | None = Field(default=None, max_length=1000)
    shipping_method: str = Field(default="POST", pattern=r"^(POST|COURIER)$")


class ShopCheckoutRequest(BaseModel):
    customer: ShopCustomerInput
    shipping: ShopShippingInput
    items: list[ShopCartItemInput] = Field(..., min_length=1, max_length=20)
    idempotency_key: str | None = Field(default=None, max_length=64)


class CardItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    status: str
    nfc_url: str
    qr_url: str
    qr_image_url: str
    qc_nfc_tested: bool = False
    qc_qr_tested: bool = False
    qc_destination_verified: bool = False
    created_at: datetime


class ShopOrderItemResponse(BaseModel):
    id: uuid.UUID
    product_type: str
    product_title: str
    unit_price: int
    quantity: int
    total_price: int
    destination_type: str
    customer_submitted_url: str | None
    final_verified_url: str | None
    link_status: str
    production_status: str
    destination_configured: bool
    customization_logo_url: str | None = None
    customization_color: str | None = None
    customization_template: str | None = None
    fulfillment_order_number: str | None = None
    fulfillment_order_id: uuid.UUID | None = None
    destination_id: uuid.UUID | None = None
    internal_nfc_url: str | None = None
    internal_qr_url: str | None = None
    qr_image_url: str | None = None
    is_nfc_required: bool = True
    is_qr_required: bool = True
    cards: list[CardItemResponse] = []
    cards_count: int = 0
    cards_completed_count: int = 0


class ShopOrderItemConfirmLinkRequest(BaseModel):
    final_verified_url: str = Field(..., min_length=4, max_length=2048)

    @field_validator("final_verified_url")
    @classmethod
    def validate_final_url(cls, v: str) -> str:
        v = v.strip()
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("URL must include scheme and domain (e.g. https://example.com)")
        if parsed.scheme not in ("https", "http"):
            raise ValueError("URL scheme must be https or http")
        return v


class ShopOrderItemUpdateLinkRequest(BaseModel):
    link_status: str = Field(..., pattern=r"^(CUSTOMER_SUBMITTED|NEEDS_VERIFICATION|NEEDS_REVIEW|FINAL_GENERATED|VERIFIED|ASSIGNED_TO_CARD|RAW_READY)$")
    final_verified_url: str | None = Field(default=None, max_length=2048)


class ShopOrderItemUpdateProductionRequest(BaseModel):
    production_status: str = Field(..., pattern=r"^(NOT_PRODUCED|PROVISIONING|QC_PENDING|COMPLETED)$")


class ShopCheckoutResponse(BaseModel):
    shop_order_number: str
    customer_name: str
    customer_email: str
    customer_phone: str
    company_name: str | None = None
    shipping_address: str
    shipping_city: str
    shipping_province: str | None = None
    shipping_postal_code: str
    shipping_notes: str | None = None
    shipping_method: str = "POST"
    shipping_tracking_code: str | None = None
    shipped_at: datetime | None = None
    shipping_notification_status: str = "NOT_SENT"
    shipping_notification_sent_at: datetime | None = None
    shipping_notification_error: str | None = None
    shipping_notification_provider_ref: str | None = None
    shipping_cost: int = 0
    total_amount: int
    payment_status: str
    payment_reference: str
    status: str
    fulfillment_status: str = "PENDING"
    ready_to_ship: bool = False
    blocking_reasons: list[str] = []
    created_at: datetime
    items: list[ShopOrderItemResponse]
    fulfillment_order_numbers: list[str] = []


# ── Shipping Rules Schemas ──────────────────────────────────────────

class ShippingRuleResponse(BaseModel):
    id: uuid.UUID
    province: str
    postal_price: int
    courier_available: bool
    courier_price: int
    active: bool

    model_config = ConfigDict(from_attributes=True)



class ShippingRuleCreate(BaseModel):
    province: str = Field(..., min_length=1, max_length=100)
    postal_price: int = Field(..., ge=0)
    courier_available: bool = Field(default=False)
    courier_price: int = Field(default=0, ge=0)
    active: bool = Field(default=True)


class ShippingRuleUpdate(BaseModel):
    postal_price: int = Field(..., ge=0)
    courier_available: bool = Field(default=False)
    courier_price: int = Field(default=0, ge=0)
    active: bool = Field(default=True)


class ShippingRuleBulkUpdate(BaseModel):
    rule_ids: list[uuid.UUID] = Field(..., min_length=1)
    postal_price: int | None = Field(None, ge=0)
    price_adjustment_amount: int | None = None
    price_adjustment_percentage: float | None = None
    courier_available: bool | None = None
    courier_price: int | None = Field(None, ge=0)
    active: bool | None = None




class ShippingQuoteRequest(BaseModel):
    province: str = Field(..., min_length=2, max_length=100)
    shipping_method: str = Field(default="POST", pattern=r"^(POST|COURIER)$")


class ShippingQuoteResponse(BaseModel):
    province: str
    shipping_method: str
    shipping_cost: int
    postal_price: int
    courier_available: bool
    courier_price: int



class ShopOrderShipRequest(BaseModel):
    tracking_code: str | None = Field(default=None, max_length=100)
    courier_phone: str | None = Field(default=None, max_length=50)
    force_resend: bool = Field(default=False)


# ── Public Order Tracking ───────────────────────────────────────────

class ShopOrderTrackRequest(BaseModel):
    order_number: str = Field(..., min_length=5, max_length=50)
    verification_contact: str = Field(..., min_length=3, max_length=100)


class ShopOrderTrackTimelineItem(BaseModel):
    step: int
    title_fa: str
    title_en: str
    description_fa: str
    description_en: str
    is_completed: bool
    is_current: bool
    timestamp: datetime | None = None


class ShopOrderTrackItem(BaseModel):
    product_title: str
    product_type: str
    quantity: int
    destination_configured: bool
    destination_type: str
    customization_color: str | None = None
    customization_template: str | None = None
    fulfillment_status: str
    card_codes: list[str] = []


class ShopOrderTrackResponse(BaseModel):
    shop_order_number: str
    status: str
    payment_status: str
    created_at: datetime
    shipping_city: str
    shipping_address_masked: str
    customer_name_masked: str
    shipping_method: str = "POST"
    shipping_tracking_code: str | None = None
    items: list[ShopOrderTrackItem]
    timeline: list[ShopOrderTrackTimelineItem]


# ── Self-Service Card Activation ────────────────────────────────────

class CardActivationVerifyRequest(BaseModel):
    card_code: str = Field(..., min_length=4, max_length=20)
    order_number: str = Field(..., min_length=5, max_length=50)
    verification_contact: str = Field(..., min_length=3, max_length=100)


class CardActivationVerifyResponse(BaseModel):
    activation_token: str
    card_code: str
    business_name: str
    product_title: str
    current_destination_type: str
    expires_in_seconds: int = 900


class CardActivationConfigureRequest(BaseModel):
    activation_token: str = Field(..., min_length=10, max_length=100)
    destination_type: str = Field(default="GOOGLE_REVIEW", max_length=50)
    destination_url: str = Field(..., min_length=5, max_length=2048)

    @field_validator("destination_url")
    @classmethod
    def validate_destination_url(cls, v: str) -> str:
        v = v.strip()
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("URL must include scheme and domain (e.g. https://example.com)")
        if parsed.scheme not in ("https", "http"):
            raise ValueError("URL scheme must be https or http")
        if parsed.netloc.strip() == "":
            raise ValueError("URL must have a valid domain")
        return v


class CardActivationConfigureResponse(BaseModel):
    status: str = "activated"
    card_code: str
    destination_type: str
    destination_url: str
    is_perfect_link: bool = False
    message: str


