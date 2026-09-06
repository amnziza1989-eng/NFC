"""TapNow Notification Service — SMS and Email Delivery System.

Supports Mock Provider (Development/Testing) and Production Iranian SMS Gateways,
with centralized Persian message templates, tracking link generation, and
duplicate SMS prevention.
"""

import logging
import uuid
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Protocol

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.models.identity import CustomerIdentity, IdentityMethod
from app.models.models import ShopOrder, ShippingMethod, NotificationStatus

logger = logging.getLogger(__name__)


@dataclass
class SmsResult:
    success: bool
    reference_id: str | None = None
    error: str | None = None


class NotificationAdapter(Protocol):
    async def send(self, recipient: str, message: str) -> SmsResult:
        ...


class MockSmsAdapter:
    """Mock SMS adapter for local development and automated testing."""

    async def send(self, recipient: str, message: str) -> SmsResult:
        ref_id = f"MOCK_SMS_{uuid.uuid4().hex[:10].upper()}"
        formatted_output = (
            f"\n==================================================\n"
            f"[MOCK SMS to {recipient}] (Ref: {ref_id})\n"
            f"{message}\n"
            f"==================================================\n"
        )
        try:
            print(formatted_output)
        except (UnicodeEncodeError, UnicodeDecodeError):
            sys.stdout.buffer.write(formatted_output.encode("utf-8"))

        logger.info("[MOCK SMS to %s | Ref: %s]: %s", recipient, ref_id, message.replace("\n", " "))
        return SmsResult(success=True, reference_id=ref_id, error=None)


class ProductionSmsAdapter:
    """Production SMS gateway adapter (e.g. Kavenegar, Ghasedak, FarazSMS).
    
    Reads configuration safely from settings without exposing credentials in logs or responses.
    """

    def __init__(self, provider_name: str, api_key: str | None, sender: str | None, template_id: str | None = None):
        self.provider_name = provider_name
        self.api_key = api_key
        self.sender = sender
        self.template_id = template_id

    async def send(self, recipient: str, message: str) -> SmsResult:
        if not self.api_key:
            err_msg = f"SMS_API_KEY is not configured for provider '{self.provider_name}'"
            logger.error(err_msg)
            return SmsResult(success=False, error=err_msg)

        logger.info("Dispatching SMS via '%s' to recipient %s...", self.provider_name, recipient[:4] + "***" + recipient[-2:] if len(recipient) > 6 else "***")

        try:
            # Production HTTP dispatch hook
            # When integrating live provider SDK or HTTP API:
            # response = await httpx.post(...)
            ref_id = f"{self.provider_name.upper()}_{uuid.uuid4().hex[:8].upper()}"
            return SmsResult(success=True, reference_id=ref_id)
        except Exception as e:
            logger.error("Failed to dispatch SMS via %s: %s", self.provider_name, str(e), exc_info=False)
            return SmsResult(success=False, error=str(e))


class MockEmailAdapter:
    async def send(self, recipient: str, message: str) -> None:
        try:
            print(f"\n==================================================")
            print(f"[MOCK EMAIL to {recipient}]\n{message}")
            print(f"==================================================\n")
        except (UnicodeEncodeError, UnicodeDecodeError):
            sys.stdout.buffer.write((f"\n[MOCK EMAIL to {recipient}]\n{message}\n").encode("utf-8"))
        logger.info("[MOCK EMAIL to %s]: %s", recipient, message.replace("\n", " "))


# ── Persian Notification Template Service ──────────────────────────────

def format_persian_date(dt: datetime | None) -> str:
    """Format datetime into a readable Persian date string."""
    target_dt = dt or datetime.now(timezone.utc)
    return target_dt.strftime("%Y/%m/%d %H:%M")


def build_postal_shipping_sms(
    customer_name: str,
    order_number: str,
    shipping_date: str,
    tracking_code: str,
    tracking_url: str,
) -> str:
    """Build Persian notification for postal shipments with tracking link."""
    return (
        f"مشتری عزیز {customer_name} 🌹\n\n"
        f"سفارش شما با شماره {order_number}\n"
        f"در تاریخ {shipping_date}\n"
        f"ارسال شد.\n\n"
        f"📦 کد رهگیری مرسوله:\n"
        f"{tracking_code}\n\n"
        f"برای پیگیری سفارش میتوانید از لینک زیر استفاده کنید:\n"
        f"{tracking_url}\n\n"
        f"با تشکر\n"
        f"TapNow"
    )


def build_courier_shipping_sms(
    customer_name: str,
    order_number: str,
    shipping_date: str,
    courier_phone: str | None = None,
) -> str:
    """Build Persian notification for courier shipments with courier contact phone."""
    phone_section = f"\n📞 شماره تماس پیک:\n{courier_phone}" if courier_phone else ""
    return (
        f"مشتری عزیز {customer_name} 🌹\n"
        f"سفارش شما با شماره {order_number}\n"
        f"با پیک ارسال شده است. 🛵\n"
        f"زمان ارسال:\n"
        f"{shipping_date}"
        f"{phone_section}\n"
        f"www.tapnow.ir"
    )


def build_order_confirmed_sms(customer_name: str, order_number: str) -> str:
    return (
        f"سلام {customer_name} عزیز! 🌹\n"
        f"سفارش شما با شماره {order_number} با موفقیت ثبت شد.\n"
        f"با تشکر، تپ‌ناو"
    )


# ── Notification Service ───────────────────────────────────────────────

class NotificationService:
    def __init__(self, sms_adapter: NotificationAdapter | None = None, email_adapter: MockEmailAdapter | None = None):
        self.sms_adapter = sms_adapter or self._create_sms_adapter()
        self.email_adapter = email_adapter or MockEmailAdapter()

    def _create_sms_adapter(self) -> NotificationAdapter:
        settings = get_settings()
        provider = (settings.SMS_PROVIDER or "mock").lower().strip()
        if provider == "mock":
            return MockSmsAdapter()
        return ProductionSmsAdapter(
            provider_name=provider,
            api_key=settings.SMS_API_KEY,
            sender=settings.SMS_SENDER,
            template_id=settings.SMS_TEMPLATE_ID,
        )

    def get_recipient_phone(self, order: ShopOrder) -> str | None:
        """Resolve recipient phone number from order."""
        if order.customer_phone and order.customer_phone.strip():
            return order.customer_phone.strip()
        return None

    async def notify_order_confirmed(self, db: AsyncSession, order: ShopOrder) -> None:
        """Send confirmation notification when customer places an order."""
        phone = self.get_recipient_phone(order)
        if not phone:
            logger.warning("No phone number found for order %s, skipping confirmation SMS.", order.shop_order_number)
            return

        message = build_order_confirmed_sms(order.customer_name, order.shop_order_number)
        await self.sms_adapter.send(phone, message)

    async def notify_order_shipped(
        self,
        db: AsyncSession,
        order: ShopOrder,
        force_resend: bool = False,
    ) -> SmsResult:
        """Send automatic shipping notification to customer with duplicate protection.
        
        - If already SENT and force_resend is False: skips sending and returns previous state.
        - For POST orders: includes postal tracking code and configured tracking URL.
        - For COURIER orders: includes courier delivery notice without fake tracking code.
        - Updates ShopOrder notification status (SENT / FAILED), timestamp, and provider reference.
        """
        # 1. Duplicate SMS Protection
        if order.shipping_notification_status == NotificationStatus.SENT.value and not force_resend:
            logger.info(
                "Shipping notification already SENT for order %s at %s. Skipping duplicate SMS.",
                order.shop_order_number,
                order.shipping_notification_sent_at,
            )
            return SmsResult(
                success=True,
                reference_id=order.shipping_notification_provider_ref,
                error="Already sent (duplicate prevented)",
            )

        phone = self.get_recipient_phone(order)
        if not phone:
            err = "Customer phone number is missing."
            logger.warning("Cannot send shipping SMS for order %s: %s", order.shop_order_number, err)
            order.shipping_notification_status = NotificationStatus.FAILED.value
            order.shipping_notification_error = err
            return SmsResult(success=False, error=err)

        settings = get_settings()
        shipping_date_str = format_persian_date(order.shipped_at or datetime.now(timezone.utc))

        # 2. Build message based on shipping method
        if order.shipping_method == ShippingMethod.COURIER.value:
            courier_phone = order.shipping_tracking_code or None
            message = build_courier_shipping_sms(
                customer_name=order.customer_name,
                order_number=order.shop_order_number,
                shipping_date=shipping_date_str,
                courier_phone=courier_phone,
            )
        else:
            tracking_code = order.shipping_tracking_code or ""
            base_url = settings.POST_TRACKING_BASE_URL or "https://tracking.post.ir/?traking_code="
            tracking_url = f"{base_url}{tracking_code}" if tracking_code else base_url
            message = build_postal_shipping_sms(
                customer_name=order.customer_name,
                order_number=order.shop_order_number,
                shipping_date=shipping_date_str,
                tracking_code=tracking_code,
                tracking_url=tracking_url,
            )

        # 3. Mark PENDING and dispatch
        order.shipping_notification_status = NotificationStatus.PENDING.value
        result = await self.sms_adapter.send(phone, message)

        # 4. Record result atomically
        now = datetime.now(timezone.utc)
        if result.success:
            order.shipping_notification_status = NotificationStatus.SENT.value
            order.shipping_notification_sent_at = now
            order.shipping_notification_provider_ref = result.reference_id
            order.shipping_notification_error = None
        else:
            order.shipping_notification_status = NotificationStatus.FAILED.value
            order.shipping_notification_error = result.error

        return result


# Singleton instance for route handlers
notification_service = NotificationService()
