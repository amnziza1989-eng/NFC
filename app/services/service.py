"""Business logic / service layer for the NFC Review Platform."""

import logging
import uuid
import io
import csv
import secrets
import re
from datetime import datetime, timezone, date, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import (
    Business, Card, Destination, Event, Order,
    ShopOrder, ShopOrderItem, CardActivationSession, ShippingRule,
    CardStatus, DestinationStatus, BusinessStatus, EventType,
    DestinationType, PaymentStatus, ShopOrderStatus,
    ShopOrderItemLinkStatus, ShopOrderItemProductionStatus,
    ProductType, OrderStatus, PRODUCT_PHYSICAL_TEMPLATES,
    ShippingMethod, NotificationStatus
)
from app.services.notifications import notification_service
from app.utils.code_generator import (
    generate_card_code, generate_order_number, generate_shop_order_number
)

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


async def list_businesses(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Business]:
    """List all businesses with optional search and status filtering."""
    query = select(Business)
    if search:
        query = query.where(Business.name.ilike(f"%{search}%"))
    if status:
        query = query.where(Business.status == status)
    query = query.offset(skip).limit(limit).order_by(Business.created_at.desc())
    result = await db.execute(query)
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
        source_url=url,
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


async def list_destinations(
    db: AsyncSession,
    business_id: uuid.UUID | None = None,
    status: str | None = None,
    dest_type: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Destination]:
    """List destinations with optional business, status, and type filtering."""
    query = select(Destination)
    if business_id:
        query = query.where(Destination.business_id == business_id)
    if status:
        query = query.where(Destination.status == status)
    if dest_type:
        query = query.where(Destination.type == dest_type)
    query = query.offset(skip).limit(limit).order_by(Destination.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


# ── Order Service ──────────────────────────────────────────────────

async def create_order(
    db: AsyncSession,
    business_id: uuid.UUID,
    destination_id: uuid.UUID,
    product_type: str = "NFC_QR",
    quantity: int = 1,
) -> Order:
    """Create a customer purchase order for physical cards."""
    # 1. Verify business exists
    business = await db.get(Business, business_id)
    if not business:
        raise ValueError("Business not found")

    # 2. Verify destination exists and belongs to business
    destination = await db.get(Destination, destination_id)
    if not destination:
        raise ValueError("Destination not found")
    if destination.business_id != business_id:
        raise ValueError("Destination does not belong to the selected business")

    # 3. Validate product type & quantity
    if product_type not in (ProductType.NFC_ONLY.value, ProductType.NFC_QR.value, ProductType.QR_ONLY.value, ProductType.RAW_CARD.value):
        raise ValueError(f"Invalid product type: {product_type}")
    if quantity < 1 or quantity > 500:
        raise ValueError("Order quantity must be between 1 and 500")

    # 4. Generate unique order number
    for _ in range(10):
        order_num = generate_order_number()
        existing = await db.execute(select(Order).where(Order.order_number == order_num))
        if existing.scalar_one_or_none() is None:
            break
    else:
        raise RuntimeError("Failed to generate unique order number")

    order = Order(
        order_number=order_num,
        business_id=business_id,
        destination_id=destination_id,
        product_type=product_type,
        quantity=quantity,
        status=OrderStatus.CREATED.value,
    )
    db.add(order)
    await db.flush()
    logger.info("Order created: num=%s product=%s qty=%d (id=%s)", order_num, product_type, quantity, order.id)
    return order


async def get_order(db: AsyncSession, order_id: uuid.UUID) -> dict | None:
    """Get an order by ID with generated cards count and linked entity details."""
    order = await db.get(Order, order_id)
    if not order:
        return None

    # Count generated cards
    count_res = await db.execute(
        select(func.count(Card.id)).where(Card.order_id == order_id)
    )
    cards_count = count_res.scalar() or 0

    # Fetch business & destination names
    business = await db.get(Business, order.business_id)
    destination = await db.get(Destination, order.destination_id)

    return {
        "id": order.id,
        "order_number": order.order_number,
        "business_id": order.business_id,
        "destination_id": order.destination_id,
        "product_type": order.product_type,
        "physical_template": PRODUCT_PHYSICAL_TEMPLATES.get(order.product_type, "NFC_QR_TEMPLATE"),
        "quantity": order.quantity,
        "cards_generated_count": cards_count,
        "status": order.status,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "business_name": business.name if business else "Unknown",
        "destination_url": destination.source_url if destination else "",
        "destination_type": destination.type if destination else "",
    }


async def list_orders(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    business_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[dict]:
    """List orders with optional search and status filters."""
    query = select(Order)
    if business_id:
        query = query.where(Order.business_id == business_id)
    if status:
        query = query.where(Order.status == status)
    if search:
        query = query.where(Order.order_number.ilike(f"%{search}%"))

    query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()

    order_dicts = []
    for o in orders:
        count_res = await db.execute(
            select(func.count(Card.id)).where(Card.order_id == o.id)
        )
        cards_count = count_res.scalar() or 0
        order_dicts.append({
            "id": o.id,
            "order_number": o.order_number,
            "business_id": o.business_id,
            "destination_id": o.destination_id,
            "product_type": o.product_type,
            "physical_template": PRODUCT_PHYSICAL_TEMPLATES.get(o.product_type, "NFC_QR_TEMPLATE"),
            "quantity": o.quantity,
            "cards_generated_count": cards_count,
            "status": o.status,
            "created_at": o.created_at,
            "updated_at": o.updated_at,
        })
    return order_dicts


async def update_order_status(
    db: AsyncSession,
    order_id: uuid.UUID,
    status: str,
) -> Order | None:
    """Update order lifecycle status with completion gate validation."""
    order = await db.get(Order, order_id)
    if not order:
        return None

    # Completion Gate Validation
    if status == OrderStatus.COMPLETED.value:
        reconciliation = await get_order_reconciliation(db, order_id)
        if not reconciliation or not reconciliation["is_ready_for_delivery"]:
            reasons = reconciliation["blocking_reasons"] if reconciliation else ["Order reconciliation failed"]
            raise ValueError(f"Order cannot be marked COMPLETED: {'; '.join(reasons)}")

    order.status = status
    order.updated_at = datetime.now(timezone.utc)
    await db.flush()
    logger.info("Order status updated: id=%s new_status=%s", order_id, status)
    return order


async def generate_order_cards(
    db: AsyncSession,
    order_id: uuid.UUID,
) -> dict:
    """Idempotently generate the exact requested number of cards for an order.

    If cards have already been generated for this order, existing cards are returned
    without creating any duplicates.
    """
    order = await db.get(Order, order_id)
    if not order:
        raise ValueError("Order not found")

    # 1. Check existing cards for idempotency protection
    existing_cards_res = await db.execute(
        select(Card).where(Card.order_id == order_id).order_by(Card.created_at.asc())
    )
    existing_cards = list(existing_cards_res.scalars().all())

    if len(existing_cards) >= order.quantity:
        logger.info(
            "Idempotency: Order %s already has %d cards generated. Returning existing.",
            order.order_number, len(existing_cards)
        )
        return {
            "order_id": order.id,
            "order_number": order.order_number,
            "product_type": order.product_type,
            "physical_template": PRODUCT_PHYSICAL_TEMPLATES.get(order.product_type, "NFC_QR_TEMPLATE"),
            "requested_quantity": order.quantity,
            "generated_count": len(existing_cards),
            "status": order.status,
            "cards": existing_cards,
        }

    # 2. Calculate remaining cards to generate
    needed = order.quantity - len(existing_cards)
    new_cards = []

    for _ in range(needed):
        for attempt in range(10):
            code = generate_card_code()
            dup = await db.execute(select(Card).where(Card.code == code))
            if dup.scalar_one_or_none() is None:
                break
        else:
            raise RuntimeError("Failed to generate unique card code after 10 attempts")

        is_nfc_only = order.product_type == ProductType.NFC_ONLY.value
        is_qr_only = order.product_type == ProductType.QR_ONLY.value
        is_raw_card = order.product_type == ProductType.RAW_CARD.value

        card = Card(
            business_id=order.business_id,
            destination_id=order.destination_id,
            order_id=order.id,
            code=code,
            qc_nfc_tested=True if (is_qr_only or is_raw_card) else False,
            qc_qr_tested=True if (is_nfc_only or is_raw_card) else False,
            qc_destination_verified=True if is_raw_card else False,
        )
        db.add(card)
        new_cards.append(card)

    if order.status == OrderStatus.CREATED.value:
        order.status = OrderStatus.CARDS_GENERATED.value
        order.updated_at = datetime.now(timezone.utc)

    await db.flush()
    all_cards = existing_cards + new_cards
    logger.info(
        "Order %s: Successfully generated %d new cards (Total: %d).",
        order.order_number, len(new_cards), len(all_cards)
    )

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "product_type": order.product_type,
        "physical_template": PRODUCT_PHYSICAL_TEMPLATES.get(order.product_type, "NFC_QR_TEMPLATE"),
        "requested_quantity": order.quantity,
        "generated_count": len(all_cards),
        "status": order.status,
        "cards": all_cards,
    }


async def list_order_cards(
    db: AsyncSession,
    order_id: uuid.UUID,
) -> list[Card]:
    """List all cards generated for a specific order."""
    result = await db.execute(
        select(Card).where(Card.order_id == order_id).order_by(Card.created_at.asc())
    )
    return list(result.scalars().all())


async def get_order_reconciliation(
    db: AsyncSession,
    order_id: uuid.UUID,
) -> dict | None:
    """Calculate real database packaging reconciliation and delivery readiness."""
    order = await db.get(Order, order_id)
    if not order:
        return None

    cards_res = await db.execute(
        select(Card).where(Card.order_id == order_id).order_by(Card.created_at.asc())
    )
    cards = list(cards_res.scalars().all())

    ordered_quantity = order.quantity
    cards_generated_count = len(cards)
    missing_cards_count = max(0, ordered_quantity - cards_generated_count)
    is_nfc_only = (order.product_type == ProductType.NFC_ONLY.value)
    is_qr_only = (order.product_type == ProductType.QR_ONLY.value)
    is_raw_card = (order.product_type == ProductType.RAW_CARD.value)

    qc_nfc_passed_count = sum(1 for c in cards if c.qc_nfc_tested)
    qc_qr_passed_count = sum(1 for c in cards if c.qc_qr_tested)
    qc_destination_verified_count = sum(1 for c in cards if c.qc_destination_verified)

    if is_raw_card:
        all_qc_passed_count = len(cards)
    elif is_nfc_only:
        all_qc_passed_count = sum(1 for c in cards if c.qc_nfc_tested and c.qc_destination_verified)
    elif is_qr_only:
        all_qc_passed_count = sum(1 for c in cards if c.qc_qr_tested and c.qc_destination_verified)
    else:
        all_qc_passed_count = sum(1 for c in cards if c.qc_nfc_tested and c.qc_qr_tested and c.qc_destination_verified)

    blocking_reasons: list[str] = []

    # 1. Check card generation quantity
    if cards_generated_count < ordered_quantity:
        blocking_reasons.append(f"{missing_cards_count} کارت هنوز تولید نشده است.")

    # 2. Check NFC QC (if required)
    if not is_qr_only and not is_raw_card:
        if qc_nfc_passed_count < ordered_quantity:
            untested_nfc = ordered_quantity - qc_nfc_passed_count
            blocking_reasons.append(f"{untested_nfc} کارت تست کنترل کیفیت NFC را پاس نکرده‌اند.")

    # 3. Check QR QC (if required)
    if not is_nfc_only and not is_raw_card:
        if qc_qr_passed_count < ordered_quantity:
            untested_qr = ordered_quantity - qc_qr_passed_count
            blocking_reasons.append(f"{untested_qr} کارت تست کنترل کیفیت QR را پاس نکرده‌اند.")

    # 4. Check destination verification
    if not is_raw_card:
        if qc_destination_verified_count < ordered_quantity:
            unverified_dest = ordered_quantity - qc_destination_verified_count
            blocking_reasons.append(f"{unverified_dest} کارت در مرحله تایید مقصد نهایی گیر کرده‌اند.")

    is_ready_for_delivery = (len(blocking_reasons) == 0 and cards_generated_count == ordered_quantity)

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "product_type": order.product_type,
        "physical_template": PRODUCT_PHYSICAL_TEMPLATES.get(order.product_type, "NFC_QR_TEMPLATE"),
        "ordered_quantity": ordered_quantity,
        "cards_generated_count": cards_generated_count,
        "missing_cards_count": missing_cards_count,
        "is_nfc_only": is_nfc_only,
        "qc_nfc_passed_count": qc_nfc_passed_count,
        "qc_qr_passed_count": qc_qr_passed_count if not is_nfc_only else ordered_quantity,
        "qc_destination_verified_count": qc_destination_verified_count,
        "all_qc_passed_count": all_qc_passed_count,
        "is_ready_for_delivery": is_ready_for_delivery,
        "blocking_reasons": blocking_reasons,
    }


async def get_order_qr_labels(
    db: AsyncSession,
    order_id: uuid.UUID,
    base_url: str = "http://localhost:8000",
) -> dict | None:
    """Generate structured QR label sheet payload with deterministic ordering."""
    order = await db.get(Order, order_id)
    if not order:
        return None

    business = await db.get(Business, order.business_id)
    business_name = business.name if business else "Unknown"

    if order.product_type == ProductType.NFC_ONLY.value:
        return {
            "order_id": order.id,
            "order_number": order.order_number,
            "business_name": business_name,
            "product_type": order.product_type,
            "total_labels": 0,
            "labels": [],
        }

    cards_res = await db.execute(
        select(Card).where(Card.order_id == order_id).order_by(Card.created_at.asc(), Card.id.asc())
    )
    cards = list(cards_res.scalars().all())

    labels = []
    for idx, c in enumerate(cards):
        labels.append({
            "card_id": c.id,
            "card_code": c.code,
            "qr_url": f"{base_url}/q/{c.code}",
            "qr_image_url": f"{base_url}/q/{c.code}/qr.png",
            "sequence_number": idx + 1,
            "order_number": order.order_number,
            "business_name": business_name,
        })

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "business_name": business_name,
        "product_type": order.product_type,
        "total_labels": len(labels),
        "labels": labels,
    }


async def export_order_cards_csv(
    db: AsyncSession,
    order_id: uuid.UUID,
    export_type: str = "cards",
    base_url: str = "http://localhost:8000",
) -> tuple[str, str]:
    """Generate scoped CSV export for order cards with UTF-8 BOM encoding."""
    order = await db.get(Order, order_id)
    if not order:
        raise ValueError("Order not found")

    business = await db.get(Business, order.business_id)
    destination = await db.get(Destination, order.destination_id)

    cards_res = await db.execute(
        select(Card).where(Card.order_id == order_id).order_by(Card.created_at.asc(), Card.id.asc())
    )
    cards = list(cards_res.scalars().all())

    is_nfc_only = (order.product_type == ProductType.NFC_ONLY.value)

    if export_type == "qr" and is_nfc_only:
        raise ValueError("QR export is not applicable for NFC_ONLY product orders.")

    output = io.StringIO()
    # Write UTF-8 BOM for Microsoft Excel / Persian text compatibility
    output.write("\ufeff")
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    if export_type == "cards":
        # Full Cards Export
        filename = f"{order.order_number}_cards.csv"
        writer.writerow([
            "Order Number",
            "Order ID",
            "Card ID",
            "Card Code",
            "Business Name",
            "Destination Type",
            "Destination URL",
            "Product Type",
            "Physical Template",
            "NFC Write URL",
            "QR URL",
            "QR Status",
            "Card Status",
            "QC NFC Tested",
            "QC QR Tested",
            "QC Destination Verified",
            "Created At",
        ])
        for c in cards:
            writer.writerow([
                order.order_number,
                str(order.id),
                str(c.id),
                c.code,
                business.name if business else "",
                destination.type if destination else "",
                destination.source_url if destination else "",
                order.product_type,
                PRODUCT_PHYSICAL_TEMPLATES.get(order.product_type, "NFC_QR_TEMPLATE"),
                f"{base_url}/n/{c.code}",
                f"{base_url}/q/{c.code}" if not is_nfc_only else "N/A",
                "APPLICABLE" if not is_nfc_only else "NOT_APPLICABLE",
                c.status,
                "PASSED" if c.qc_nfc_tested else "PENDING",
                ("PASSED" if c.qc_qr_tested else "PENDING") if not is_nfc_only else "NOT_APPLICABLE",
                "PASSED" if c.qc_destination_verified else "PENDING",
                c.created_at.isoformat() if c.created_at else "",
            ])

    elif export_type == "nfc":
        # Dedicated NFC Provisioning Export
        filename = f"{order.order_number}_nfc_provisioning.csv"
        writer.writerow([
            "Card Code",
            "NFC Write URL",
            "Order Number",
            "Business Name",
            "Destination URL",
        ])
        for c in cards:
            writer.writerow([
                c.code,
                f"{base_url}/n/{c.code}",
                order.order_number,
                business.name if business else "",
                destination.source_url if destination else "",
            ])

    elif export_type == "qr":
        # Dedicated QR Export
        filename = f"{order.order_number}_qr_labels.csv"
        writer.writerow([
            "Card Code",
            "QR URL",
            "QR PNG Image URL",
            "Order Number",
            "Business Name",
        ])
        for c in cards:
            writer.writerow([
                c.code,
                f"{base_url}/q/{c.code}",
                f"{base_url}/q/{c.code}/qr.png",
                order.order_number,
                business.name if business else "",
            ])
    else:
        raise ValueError(f"Unknown export type: {export_type}")

    return filename, output.getvalue()



# ── Card Service ───────────────────────────────────────────────────

async def create_card(
    db: AsyncSession,
    business_id: uuid.UUID,
    destination_id: uuid.UUID,
    order_id: uuid.UUID | None = None,
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
        order_id=order_id,
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
    destination_id: uuid.UUID | None = None,
    order_id: uuid.UUID | None = None,
    status: str | None = None,
    code: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Card]:
    """List cards, optionally filtered by business, destination, order, status, code, or search."""
    query = select(Card)
    if business_id:
        query = query.where(Card.business_id == business_id)
    if destination_id:
        query = query.where(Card.destination_id == destination_id)
    if order_id:
        query = query.where(Card.order_id == order_id)
    if status:
        query = query.where(Card.status == status)
    if code:
        query = query.where(Card.code.ilike(f"%{code}%"))
    if search:
        query = query.where(Card.code.ilike(f"%{search}%"))
    query = query.offset(skip).limit(limit).order_by(Card.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_card(
    db: AsyncSession,
    card_id: uuid.UUID,
    **kwargs,
) -> Card | None:
    """Update card fields (destination reassignment, status toggle, QC flags)."""
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


async def get_card_info(
    db: AsyncSession,
    card_id: uuid.UUID,
    base_url: str = "http://localhost:8000",
) -> dict | None:
    """Get extended card info including business name and destination details."""
    card = await db.get(Card, card_id)
    if not card:
        return None

    business = await db.get(Business, card.business_id)
    destination = await db.get(Destination, card.destination_id)

    # Get recent events
    recent_events = await get_card_events(db, card_id, limit=5)

    return {
        "id": card.id,
        "code": card.code,
        "status": card.status,
        "order_id": card.order_id,
        "business_name": business.name if business else "Unknown",
        "destination_url": destination.source_url if destination else "",
        "destination_type": destination.type if destination else "",
        "destination_status": destination.status if destination else "",
        "nfc_url": f"{base_url}/n/{card.code}",
        "qr_url": f"{base_url}/q/{card.code}",
        "created_at": card.created_at,
        "recent_events": recent_events,
        "qc_nfc_tested": card.qc_nfc_tested,
        "qc_qr_tested": card.qc_qr_tested,
        "qc_destination_verified": card.qc_destination_verified,
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
    """Record an interaction event (NFC tap or QR scan)."""
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
    limit: int = 50,
) -> list[Event]:
    """Get recent events for a card."""
    result = await db.execute(
        select(Event)
        .where(Event.card_id == card_id)
        .order_by(Event.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


# ── Provisioning Service ───────────────────────────────────────────

async def get_card_provisioning(
    db: AsyncSession,
    card_id: uuid.UUID,
    base_url: str = "http://localhost:8000",
) -> dict | None:
    """Get all data needed for physical card provisioning."""
    card = await db.get(Card, card_id)
    if not card:
        return None

    business = await db.get(Business, card.business_id)
    destination = await db.get(Destination, card.destination_id)

    if not business or not destination:
        return None

    return {
        "card_id": card.id,
        "card_code": card.code,
        "status": card.status,
        "nfc_url": f"{base_url}/n/{card.code}",
        "qr_url": f"{base_url}/q/{card.code}",
        "qr_image_url": f"{base_url}/q/{card.code}/qr.png",
        "business": business,
        "destination": destination,
        "qc_nfc_tested": card.qc_nfc_tested,
        "qc_qr_tested": card.qc_qr_tested,
        "qc_destination_verified": card.qc_destination_verified,
    }


# ── Analytics Service ──────────────────────────────────────────────

async def get_card_analytics(
    db: AsyncSession,
    card_id: uuid.UUID,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict | None:
    """Get interaction counts and recent events for a card with optional date range."""
    card = await db.get(Card, card_id)
    if not card:
        return None

    # Base query filters
    filters = [Event.card_id == card_id]
    if start_date:
        start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
        filters.append(Event.created_at >= start_dt)
    if end_date:
        # Inclusive: through 23:59:59 of end_date (or start of next day)
        end_dt = datetime.combine(end_date + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
        filters.append(Event.created_at < end_dt)

    # Total counts
    total_q = select(func.count(Event.id)).where(*filters)
    total = (await db.execute(total_q)).scalar() or 0

    # NFC counts
    nfc_q = select(func.count(Event.id)).where(*filters, Event.type == EventType.NFC.value)
    nfc = (await db.execute(nfc_q)).scalar() or 0

    # QR counts
    qr_q = select(func.count(Event.id)).where(*filters, Event.type == EventType.QR.value)
    qr = (await db.execute(qr_q)).scalar() or 0

    # Recent events (within range if specified, otherwise latest 10)
    recent_q = (
        select(Event)
        .where(*filters)
        .order_by(Event.created_at.desc())
        .limit(10)
    )
    recent = list((await db.execute(recent_q)).scalars().all())

    return {
        "total": total,
        "nfc": nfc,
        "qr": qr,
        "recent": recent,
    }


async def get_business_analytics(
    db: AsyncSession,
    business_id: uuid.UUID,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict | None:
    """Get aggregated analytics across all cards for a business."""
    business = await db.get(Business, business_id)
    if not business:
        return None

    # Subquery: all card IDs for this business
    card_ids_q = select(Card.id).where(Card.business_id == business_id)

    # Base filters for events
    filters = [Event.card_id.in_(card_ids_q)]
    if start_date:
        start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
        filters.append(Event.created_at >= start_dt)
    if end_date:
        end_dt = datetime.combine(end_date + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
        filters.append(Event.created_at < end_dt)

    # Total events
    total = (await db.execute(select(func.count(Event.id)).where(*filters))).scalar() or 0
    nfc = (await db.execute(select(func.count(Event.id)).where(*filters, Event.type == EventType.NFC.value))).scalar() or 0
    qr = (await db.execute(select(func.count(Event.id)).where(*filters, Event.type == EventType.QR.value))).scalar() or 0

    # Card counts
    total_cards = (await db.execute(select(func.count(Card.id)).where(Card.business_id == business_id))).scalar() or 0
    active_cards = (await db.execute(
        select(func.count(Card.id)).where(Card.business_id == business_id, Card.status == CardStatus.ACTIVE.value)
    )).scalar() or 0

    # Recent events across all business cards
    recent = list((await db.execute(
        select(Event)
        .where(*filters)
        .order_by(Event.created_at.desc())
        .limit(20)
    )).scalars().all())

    return {
        "total": total,
        "nfc": nfc,
        "qr": qr,
        "total_cards": total_cards,
        "active_cards": active_cards,
        "recent": recent,
    }


# ── Dashboard Overview Service ─────────────────────────────────────

async def get_dashboard_overview(db: AsyncSession) -> dict:
    """Get system-wide metrics for the dashboard overview."""
    total_biz = (await db.execute(select(func.count(Business.id)))).scalar()
    active_biz = (await db.execute(
        select(func.count(Business.id)).where(Business.status == BusinessStatus.ACTIVE.value)
    )).scalar()
    total_cards = (await db.execute(select(func.count(Card.id)))).scalar()
    active_cards = (await db.execute(
        select(func.count(Card.id)).where(Card.status == CardStatus.ACTIVE.value)
    )).scalar()
    total_events = (await db.execute(select(func.count(Event.id)))).scalar()
    nfc_events = (await db.execute(
        select(func.count(Event.id)).where(Event.type == EventType.NFC.value)
    )).scalar()
    qr_events = (await db.execute(
        select(func.count(Event.id)).where(Event.type == EventType.QR.value)
    )).scalar()

    return {
        "total_businesses": total_biz or 0,
        "active_businesses": active_biz or 0,
        "total_cards": total_cards or 0,
        "active_cards": active_cards or 0,
        "total_events": total_events or 0,
        "nfc_events": nfc_events or 0,
        "qr_events": qr_events or 0,
    }


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
    return (destination.source_url, "ok")


# ── Shop Service ───────────────────────────────────────────────────

SHOP_PRODUCTS_CATALOG = [
    {
        "id": "card-nfc-qr",
        "title_fa": "کارت هوشمند نقد و بررسی (NFC + QR)",
        "title_en": "Smart Review Card (NFC + QR)",
        "product_type": "NFC_QR",
        "physical_template": "NFC_QR_TEMPLATE",
        "unit_price": 290000,
        "currency": "TOMAN",
        "description_fa": "کارت پی‌وی‌سی مات با چیپ NTAG213 و کد QR پویا اختصاصی برای جذب حداکثری نظرات گوگل",
        "description_en": "Matte PVC smart card with NTAG213 chip and dynamic QR code for maximum Google review collection",
        "features_fa": [
            "چیپست اصل NTAG213 با برد تقویت شده",
            "کد QR پویا با قابلیت تغییر مقصد در لحظه",
            "روکش مات ضد خش و ضد آب با چاپ اختصاصی",
            "سازگار با ۱۰۰٪ گوشی‌های هوشمند مدرن",
        ],
        "features_en": [
            "Original NTAG213 high-performance NFC chip",
            "Dynamic QR code with instant destination switching",
            "Scratch-proof & waterproof matte UV finish",
            "Compatible with 100% of modern smartphones",
        ],
        "is_available": True,
        "supported_destination_types": [
            "GOOGLE_REVIEW", "INSTAGRAM", "WEBSITE", "WHATSAPP", "CUSTOM_URL"
        ],
    },
    {
        "id": "card-nfc-only",
        "title_fa": "کارت هوشمند اختصاصی (فقط NFC)",
        "title_en": "Smart Touch Card (NFC Only)",
        "product_type": "NFC_ONLY",
        "physical_template": "NFC_ONLY_TEMPLATE",
        "unit_price": 240000,
        "currency": "TOMAN",
        "description_fa": "کارت هوشمند مینیمال و لوکس بدون چاپ QR با قابلیت هدایت مستقیم با لمس گوشی",
        "description_en": "Minimalist luxury smart card without QR printing, dedicated to direct one-touch tap redirection",
        "features_fa": [
            "طراحی مینیمال و بسیار تمیز",
            "چیپ NTAG213 با سرعت پاسخ‌دهی بالا",
            "امکان تغییر لینک مقصد از پنل مدیریت",
            "ایده‌آل برای برندهای لوکس و رویدادها",
        ],
        "features_en": [
            "Minimalist and ultra-clean surface design",
            "High-speed responsive NTAG213 chip",
            "Dynamic destination management from portal",
            "Ideal for luxury venues and events",
        ],
        "is_available": True,
        "supported_destination_types": [
            "GOOGLE_REVIEW", "INSTAGRAM", "WEBSITE", "WHATSAPP", "CUSTOM_URL"
        ],
    },
    {
        "id": "card-qr-only",
        "title_fa": "کارت نقد و بررسی (فقط QR)",
        "title_en": "Review Card (QR Only)",
        "product_type": "QR_ONLY",
        "physical_template": "QR_ONLY_TEMPLATE",
        "unit_price": 190000,
        "currency": "TOMAN",
        "description_fa": "کارت پی‌وی‌سی مات با کد QR پویا اختصاصی بدون چیپ NFC (مقرون به صرفه)",
        "description_en": "Matte PVC smart card with dynamic QR code without NFC chip (budget friendly)",
        "features_fa": [
            "کد QR پویا با قابلیت تغییر مقصد در لحظه",
            "روکش مات ضد خش و ضد آب با چاپ اختصاصی",
            "بسیار مقرون‌به‌صرفه و اقتصادی",
            "مناسب برای نصب روی استندها و میزها",
        ],
        "features_en": [
            "Dynamic QR code with instant destination switching",
            "Scratch-proof & waterproof matte UV finish",
            "Highly affordable and cost-effective",
            "Ideal for placement on tables and stands",
        ],
        "is_available": True,
        "supported_destination_types": [
            "GOOGLE_REVIEW", "INSTAGRAM", "WEBSITE", "WHATSAPP", "CUSTOM_URL"
        ],
    },
    {
        "id": "stand-nfc-qr",
        "title_fa": "استند رومیزی هوشمند (NFC + QR)",
        "title_en": "Smart Desktop Stand (NFC + QR)",
        "product_type": "NFC_QR",
        "physical_template": "NFC_QR_TEMPLATE",
        "unit_price": 450000,
        "currency": "TOMAN",
        "description_fa": "استند اکریلیک شفاف رومیزی مناسب پیشخوان و میز کافه، رستوران و مراکز خدماتی",
        "description_en": "Premium transparent acrylic desktop stand designed for cafe counters, restaurant tables, and clinic desks",
        "features_fa": [
            "پایه اکریلیک مقاوم با زاویه دید بهینه",
            "تراشه NFC داخلی + کد QR بزرگ اختصاصی",
            "قابلیت شست‌وشو و تمیزکاری آسان",
            "جلب توجه فوری مشتریان در محل پرداخت",
        ],
        "features_en": [
            "Durable acrylic stand with optimal viewing angle",
            "Internal NFC chip + large dynamic QR code",
            "Easy to wipe and sanitize",
            "High visibility at counter or checkout points",
        ],
        "is_available": False,
        "supported_destination_types": [
            "GOOGLE_REVIEW", "INSTAGRAM", "WEBSITE", "WHATSAPP", "CUSTOM_URL"
        ],
    },
]


def get_shop_catalog() -> list[dict]:
    """Return active public product catalog for the online shop."""
    return [p for p in SHOP_PRODUCTS_CATALOG if p.get("is_available", True)]


def is_tehran_eligible(city: str | None, province: str | None = None, address: str | None = None) -> bool:
    """Validate whether a delivery address is inside the eligible Tehran Courier service area.
    
    Performs robust normalization of Persian/Arabic characters and handles variations like:
    'تهران', 'شهر تهران', 'Tehran', 'استان تهران', etc. Excludes outer satellite towns (e.g. ورامین, شهریار, دماوند).
    """
    if not city or not city.strip():
        return False

    cleaned_city = city.strip().replace("ي", "ی").replace("ك", "ک").lower()
    cleaned_province = (province or "").strip().replace("ي", "ی").replace("ك", "ک").lower()

    # Outer satellite cities / towns that are not part of Tehran city courier perimeter
    outer_suburbs = ["ورامین", "شهریار", "دماوند", "پردیس", "رودهن", "فیروزکوه", "اسلامشهر", "رباط کریم", "ملارد", "قدس", "پاکدشت", "اندیشه", "بومهن"]
    if any(sub in cleaned_city for sub in outer_suburbs):
        return False

    # Positive match for Tehran
    tehran_tokens = ["تهران", "tehran", "شهر تهران", "تهران بزرگ", "منطقه"]
    if any(cleaned_city == token or cleaned_city.startswith("تهران") or token in cleaned_city for token in tehran_tokens):
        return True

    if "تهران" in cleaned_province or "tehran" in cleaned_province:
        if cleaned_city in ["مرکزی", "منطقه", "تهران", "tehran"]:
            return True

    return False


async def process_shop_checkout(
    db: AsyncSession,
    checkout_data: dict,
    customer_id: uuid.UUID | None = None,
) -> dict:
    """Process a multi-item customer checkout atomically.

    1. Creates or looks up customer Business.
    2. For each cart item:
       - Provisions a Destination (active URL or PENDING_SETUP placeholder).
       - Creates a factory fulfillment Order.
       - Links a ShopOrderItem to the factory Order.
    3. Validates shipping method and Tehran courier eligibility.
    4. Creates the parent ShopOrder with mock payment simulation.
    5. Commits transaction and returns public order confirmation.
    """
    customer = checkout_data["customer"]
    shipping = checkout_data["shipping"]
    items = checkout_data["items"]

    if not items:
        raise ValueError("Shopping cart cannot be empty")

    # Validate shipping method & calculate dynamic province-based shipping cost
    shipping_method = (shipping.get("shipping_method") or ShippingMethod.POST.value).upper().strip()
    if shipping_method not in (ShippingMethod.POST.value, ShippingMethod.COURIER.value):
        raise ValueError(f"روش ارسال نامعتبر است: {shipping_method}")

    city = shipping.get("city", "").strip()
    province = shipping.get("province", "تهران").strip() if shipping.get("province") else "تهران"

    shipping_quote = await calculate_order_shipping(db, province=province, shipping_method=shipping_method)
    shipping_cost = shipping_quote["shipping_cost"]

    if shipping_method == ShippingMethod.COURIER.value:
        if not is_tehran_eligible(city=city, province=province, address=shipping.get("address")):
            raise ValueError("ارسال با پیک در حال حاضر فقط برای آدرس‌های شهر تهران امکان‌پذیر است.")

    # 1. Create or get Business for the customer
    business_name = (customer.get("company_name") or customer["name"]).strip()
    business = Business(name=business_name)
    db.add(business)
    await db.flush()

    # 2. Generate unique shop order number
    for _ in range(10):
        shop_order_num = generate_shop_order_number()
        existing = await db.execute(select(ShopOrder).where(ShopOrder.shop_order_number == shop_order_num))
        if existing.scalar_one_or_none() is None:
            break
    else:
        raise RuntimeError("Failed to generate unique shop order number")

    # Generate mock payment reference
    mock_ref = f"MOCK-PAY-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    total_amount = shipping_cost
    shop_order_items = []
    fulfillment_order_numbers = []

    # 3. Process each cart item into Destination -> factory Order -> ShopOrderItem
    for item in items:
        prod_type = item["product_type"]
        unit_price = item["unit_price"]
        quantity = item["quantity"]
        dest_configured = item.get("destination_configured", True)
        dest_type = item.get("destination_type", "GOOGLE_REVIEW")
        dest_url = item.get("destination_url")

        item_total = unit_price * quantity
        total_amount += item_total

        # Determine destination
        if dest_configured and dest_url and dest_url.strip():
            target_url = dest_url.strip()
            target_type = dest_type or DestinationType.GOOGLE_REVIEW.value
        else:
            target_url = "https://tapnow.ir/setup"
            target_type = DestinationType.PENDING_SETUP.value
            dest_configured = False

        # Create Destination
        destination = Destination(
            business_id=business.id,
            source_url=target_url,
            type=target_type,
            status=DestinationStatus.ACTIVE.value,
        )
        db.add(destination)
        await db.flush()

        # Create factory fulfillment Order
        factory_order = await create_order(
            db=db,
            business_id=business.id,
            destination_id=destination.id,
            product_type=prod_type,
            quantity=quantity,
        )
        fulfillment_order_numbers.append(factory_order.order_number)

        # Idempotently generate cards for this factory order immediately
        await generate_order_cards(db=db, order_id=factory_order.id)

        # Create ShopOrderItem
        shop_item = ShopOrderItem(
            product_type=prod_type,
            product_title=item["product_title"],
            unit_price=unit_price,
            quantity=quantity,
            destination_type=target_type,
            customer_submitted_url=dest_url if dest_configured else None,
            final_verified_url=dest_url if (dest_configured and dest_url) else None,
            link_status="CUSTOMER_SUBMITTED" if dest_configured else "RAW_READY",
            production_status="NOT_PRODUCED",
            destination_configured=dest_configured,
            fulfillment_order_id=factory_order.id,
            customization_logo_url=item.get("customization_logo_url"),
            customization_color=item.get("customization_color", "#0F172A"),
            customization_template=item.get("customization_template", "classic"),
        )
        shop_order_items.append(shop_item)

    # 4. Create parent ShopOrder
    shop_order = ShopOrder(
        shop_order_number=shop_order_num,
        customer_name=customer["name"].strip(),
        customer_email=customer["email"].strip().lower(),
        customer_phone=customer["phone"].strip(),
        company_name=customer.get("company_name"),
        shipping_address=shipping["address"].strip(),
        shipping_city=city,
        shipping_province=province,
        shipping_postal_code=shipping["postal_code"].strip(),
        shipping_notes=shipping.get("notes"),
        shipping_method=shipping_method,
        shipping_notification_status=NotificationStatus.NOT_SENT.value,
        shipping_cost=shipping_cost,
        total_amount=total_amount,
        payment_status=PaymentStatus.MOCK_PAID.value,
        payment_reference=mock_ref,
        status=ShopOrderStatus.PLACED.value,
        items=shop_order_items,
        customer_id=customer_id,
    )
    db.add(shop_order)
    await db.flush()

    logger.info(
        "Shop Order placed successfully: num=%s items=%d method=%s shipping=%d total=%d (ref=%s)",
        shop_order_num, len(shop_order_items), shipping_method, shipping_cost, total_amount, mock_ref
    )

    await notification_service.notify_order_confirmed(db, shop_order)

    base_url = "http://localhost:8000"
    return await format_shop_order_response(db, shop_order, base_url=base_url)


async def confirm_shop_order_item_link(
    db: AsyncSession,
    item_id: uuid.UUID,
    final_verified_url: str,
    base_url: str = "http://localhost:8000",
) -> dict:
    """Operator approves/confirms the final destination URL for a shop order item.

    1. Validates the provided destination URL.
    2. Updates ShopOrderItem.final_verified_url.
    3. Sets link_status to FINAL_GENERATED and production_status to PROVISIONING.
    4. Syncs the underlying Destination entity source_url.
    5. Ensures physical Cards exist for the linked fulfillment Order.
    """
    item = await db.get(ShopOrderItem, item_id)
    if not item:
        raise ValueError("Shop order item not found")

    final_url = final_verified_url.strip()
    if not final_url:
        raise ValueError("آدرس مقصد نهایی نمی‌تواند خالی باشد.")

    item.final_verified_url = final_url
    item.link_status = ShopOrderItemLinkStatus.FINAL_GENERATED.value
    if item.production_status == ShopOrderItemProductionStatus.NOT_PRODUCED.value:
        item.production_status = ShopOrderItemProductionStatus.PROVISIONING.value

    if item.fulfillment_order_id:
        fo = await db.get(Order, item.fulfillment_order_id)
        if fo:
            if fo.destination_id:
                dest = await db.get(Destination, fo.destination_id)
                if dest:
                    dest.source_url = final_url
                    dest.status = DestinationStatus.ACTIVE.value
                    dest.updated_at = datetime.now(timezone.utc)
            # Ensure cards are generated
            await generate_order_cards(db=db, order_id=fo.id)

    await db.flush()
    logger.info("Confirmed final link for ShopOrderItem %s: %s", item.id, final_url)
    return {
        "status": "success",
        "item_id": str(item.id),
        "final_verified_url": final_url,
        "link_status": item.link_status,
        "production_status": item.production_status,
    }


def get_shop_order_readiness(
    shop_order: ShopOrder,
    shop_order_items: list[ShopOrderItem],
    cards_map: dict | None = None,
) -> dict:
    """Calculate order-level fulfillment readiness and blocking reasons."""
    blocking_reasons = []
    total = len(shop_order_items)
    completed = 0

    if shop_order.payment_status not in (PaymentStatus.PAID.value, PaymentStatus.MOCK_PAID.value):
        blocking_reasons.append("سفارش هنوز پرداخت نشده است")

    for it in shop_order_items:
        is_nfc_only = (it.product_type == ProductType.NFC_ONLY.value)
        is_qr_only = (it.product_type == ProductType.QR_ONLY.value)
        is_raw_blank_card = (it.product_type == ProductType.RAW_CARD.value)

        # Link verification check (only required if customer configured a destination URL)
        if it.destination_configured and not is_raw_blank_card:
            if it.link_status not in (
                ShopOrderItemLinkStatus.FINAL_GENERATED.value,
                ShopOrderItemLinkStatus.VERIFIED.value,
                ShopOrderItemLinkStatus.ASSIGNED_TO_CARD.value,
            ) or not it.final_verified_url:
                blocking_reasons.append(f"لینک آیتم '{it.product_title}' بررسی یا تایید نشده است")

        # Cards QC verification (Applies to all smart cards!)
        cards = cards_map.get(str(it.id)) if cards_map else None
        if cards is not None:
            item_cards_completed = 0
            for c in cards:
                if is_raw_blank_card:
                    c_ok = (it.production_status == ShopOrderItemProductionStatus.COMPLETED.value)
                elif is_nfc_only:
                    c_ok = c.qc_nfc_tested and c.qc_destination_verified
                elif is_qr_only:
                    c_ok = c.qc_qr_tested and c.qc_destination_verified
                else: # NFC_QR
                    c_ok = c.qc_nfc_tested and c.qc_qr_tested and c.qc_destination_verified
                if c_ok:
                    item_cards_completed += 1

            if len(cards) >= it.quantity and item_cards_completed == len(cards):
                completed += 1
            else:
                if is_raw_blank_card:
                    blocking_reasons.append(f"آماده‌سازی فیزیکی و بازرسی کارت‌های خام '{it.product_title}' انجام نشده است")
                elif is_nfc_only:
                    blocking_reasons.append(f"رایت چیپ NFC یا تست کارت‌های '{it.product_title}' کامل نشده است")
                elif is_qr_only:
                    blocking_reasons.append(f"چاپ برچسب QR یا تست اسکن کارت‌های '{it.product_title}' کامل نشده است")
                else:
                    blocking_reasons.append(f"تولید، رایت چیپ NFC، چاپ QR یا تست کنترل کیفیت کارت‌های '{it.product_title}' کامل نشده است")
        else:
            if it.production_status == ShopOrderItemProductionStatus.COMPLETED.value:
                completed += 1
            else:
                blocking_reasons.append(f"تولید و تست آیتم '{it.product_title}' کامل نشده است")

    ready_to_ship = (len(blocking_reasons) == 0 and completed == total)

    if shop_order.status == ShopOrderStatus.SHIPPED.value:
        fulfillment_status = "SHIPPED"
    elif ready_to_ship:
        fulfillment_status = "READY_TO_SHIP"
    elif completed > 0:
        fulfillment_status = "PARTIALLY_COMPLETED"
    else:
        fulfillment_status = "AWAITING_PRODUCTION"

    return {
        "fulfillment_status": fulfillment_status,
        "ready_to_ship": ready_to_ship,
        "blocking_reasons": blocking_reasons,
    }


async def format_shop_order_response(
    db: AsyncSession,
    shop_order: ShopOrder,
    base_url: str = "http://localhost:8000",
) -> dict:
    """Format full ShopOrder response with loaded cards, internal URLs, and readiness state."""
    items_res = []
    fulfillment_order_numbers = []
    cards_map: dict[str, list[Card]] = {}

    for it in shop_order.items:
        factory_ord_num = None
        cards_list: list[Card] = []
        if it.fulfillment_order_id:
            fo = await db.get(Order, it.fulfillment_order_id)
            if fo:
                factory_ord_num = fo.order_number
                fulfillment_order_numbers.append(factory_ord_num)
                # Fetch cards
                c_res = await db.execute(
                    select(Card).where(Card.order_id == fo.id).order_by(Card.created_at.asc(), Card.id.asc())
                )
                cards_list = list(c_res.scalars().all())

        cards_map[str(it.id)] = cards_list

        is_nfc_only = (it.product_type == ProductType.NFC_ONLY.value)
        is_qr_only = (it.product_type == ProductType.QR_ONLY.value)
        is_raw_blank_card = (it.product_type == ProductType.RAW_CARD.value)

        is_nfc_required = not is_qr_only and not is_raw_blank_card
        is_qr_required = not is_nfc_only and not is_raw_blank_card

        cards_completed_count = 0
        card_items = []
        for c in cards_list:
            if is_raw_blank_card:
                c_done = (it.production_status == ShopOrderItemProductionStatus.COMPLETED.value)
            elif is_nfc_only:
                c_done = c.qc_nfc_tested and c.qc_destination_verified
            elif is_qr_only:
                c_done = c.qc_qr_tested and c.qc_destination_verified
            else:
                c_done = c.qc_nfc_tested and c.qc_qr_tested and c.qc_destination_verified
            if c_done:
                cards_completed_count += 1

            card_items.append({
                "id": c.id,
                "code": c.code,
                "status": c.status,
                "nfc_url": f"{base_url}/n/{c.code}",
                "qr_url": f"{base_url}/q/{c.code}",
                "qr_image_url": f"{base_url}/q/{c.code}/qr.png",
                "qc_nfc_tested": c.qc_nfc_tested,
                "qc_qr_tested": c.qc_qr_tested,
                "qc_destination_verified": c.qc_destination_verified,
                "created_at": c.created_at,
            })

        # Derived link and production status for item
        if is_raw_blank_card:
            computed_link_status = "RAW_READY"
        elif not it.destination_configured and not it.final_verified_url:
            computed_link_status = "PENDING_CUSTOMER_ACTIVATION"
        elif cards_completed_count == len(cards_list) and len(cards_list) > 0 and it.final_verified_url:
            computed_link_status = "DESTINATION_VERIFIED"
        elif it.final_verified_url:
            computed_link_status = "FINAL_GENERATED"
        else:
            computed_link_status = "LINK_REVIEW_REQUIRED"

        first_card_code = cards_list[0].code if cards_list else None

        items_res.append({
            "id": it.id,
            "product_type": it.product_type,
            "product_title": it.product_title,
            "unit_price": it.unit_price,
            "quantity": it.quantity,
            "total_price": it.unit_price * it.quantity,
            "destination_type": it.destination_type,
            "customer_submitted_url": it.customer_submitted_url,
            "final_verified_url": it.final_verified_url,
            "link_status": computed_link_status,
            "production_status": it.production_status,
            "destination_configured": it.destination_configured,
            "customization_logo_url": it.customization_logo_url,
            "customization_color": it.customization_color,
            "customization_template": it.customization_template,
            "fulfillment_order_number": factory_ord_num,
            "fulfillment_order_id": it.fulfillment_order_id,
            "internal_nfc_url": f"{base_url}/n/{first_card_code}" if (first_card_code and is_nfc_required) else None,
            "internal_qr_url": f"{base_url}/q/{first_card_code}" if (first_card_code and is_qr_required) else None,
            "qr_image_url": f"{base_url}/q/{first_card_code}/qr.png" if (first_card_code and is_qr_required) else None,
            "is_nfc_required": is_nfc_required,
            "is_qr_required": is_qr_required,
            "cards": card_items,
            "cards_count": len(cards_list),
            "cards_completed_count": cards_completed_count,
        })

    readiness = get_shop_order_readiness(shop_order, shop_order.items, cards_map=cards_map)

    return {
        "shop_order_number": shop_order.shop_order_number,
        "customer_name": shop_order.customer_name,
        "customer_email": shop_order.customer_email,
        "customer_phone": shop_order.customer_phone,
        "company_name": shop_order.company_name,
        "shipping_address": shop_order.shipping_address,
        "shipping_city": shop_order.shipping_city,
        "shipping_province": shop_order.shipping_province,
        "shipping_postal_code": shop_order.shipping_postal_code,
        "shipping_notes": shop_order.shipping_notes,
        "shipping_method": shop_order.shipping_method,
        "shipping_tracking_code": shop_order.shipping_tracking_code,
        "shipped_at": shop_order.shipped_at,
        "shipping_notification_status": shop_order.shipping_notification_status,
        "shipping_notification_sent_at": shop_order.shipping_notification_sent_at,
        "shipping_notification_error": shop_order.shipping_notification_error,
        "shipping_notification_provider_ref": shop_order.shipping_notification_provider_ref,
        "shipping_cost": shop_order.shipping_cost or 0,
        "total_amount": shop_order.total_amount,
        "payment_status": shop_order.payment_status,
        "payment_reference": shop_order.payment_reference,
        "status": shop_order.status,
        "fulfillment_status": readiness["fulfillment_status"],
        "ready_to_ship": readiness["ready_to_ship"],
        "blocking_reasons": readiness["blocking_reasons"],
        "created_at": shop_order.created_at,
        "items": items_res,
        "fulfillment_order_numbers": fulfillment_order_numbers,
    }


async def get_shop_order_by_number(
    db: AsyncSession,
    shop_order_number: str,
    base_url: str = "http://localhost:8000",
) -> dict | None:
    """Get a customer shop order by its public shop order number."""
    query = (
        select(ShopOrder)
        .where(ShopOrder.shop_order_number == shop_order_number)
        .options(selectinload(ShopOrder.items))
    )
    result = await db.execute(query)
    shop_order = result.scalar_one_or_none()
    if not shop_order:
        return None

    return await format_shop_order_response(db, shop_order, base_url=base_url)


def normalize_phone(phone: str) -> str:
    """Normalize Iranian and international phone numbers to standard format for comparison."""
    # Convert Persian/Arabic digits to ASCII
    persian_digits = "۰۱۲۳۴۵۶۷۸۹"
    arabic_digits = "٠١٢٣٤٥٦٧٨٩"
    cleaned = phone.strip()
    for i, d in enumerate(persian_digits):
        cleaned = cleaned.replace(d, str(i))
    for i, d in enumerate(arabic_digits):
        cleaned = cleaned.replace(d, str(i))
    # Remove non-digits
    digits_only = re.sub(r"\D", "", cleaned)
    # Strip leading +98 or 0098
    if digits_only.startswith("98"):
        digits_only = "0" + digits_only[2:]
    elif digits_only.startswith("0098"):
        digits_only = "0" + digits_only[4:]
    return digits_only


async def track_shop_order(
    db: AsyncSession,
    order_number: str,
    verification_contact: str,
) -> dict:
    """Securely look up public order tracking status with two-factor contact proof."""
    clean_ord_num = order_number.strip()
    clean_contact = verification_contact.strip().lower()
    norm_contact_phone = normalize_phone(clean_contact)

    query = (
        select(ShopOrder)
        .where(ShopOrder.shop_order_number == clean_ord_num)
        .options(selectinload(ShopOrder.items))
    )
    result = await db.execute(query)
    shop_order = result.scalar_one_or_none()

    if not shop_order:
        raise ValueError("We could not verify the order information provided.")

    # Check contact proof
    order_phone_norm = normalize_phone(shop_order.customer_phone)
    order_email_clean = shop_order.customer_email.strip().lower()

    contact_matched = False
    if norm_contact_phone and norm_contact_phone == order_phone_norm:
        contact_matched = True
    elif clean_contact == order_email_clean:
        contact_matched = True

    if not contact_matched:
        raise ValueError("We could not verify the order information provided.")

    # Calculate overall factory progress
    items_summary = []
    all_cards_generated = True
    all_qc_passed = True
    any_cards_generated = False

    for it in shop_order.items:
        card_codes = []
        fo_status = "CREATED"
        if it.fulfillment_order_id:
            fo = await db.get(Order, it.fulfillment_order_id)
            if fo:
                fo_status = fo.status
                cards = await list_order_cards(db, fo.id)
                if cards:
                    any_cards_generated = True
                    card_codes = [c.code for c in cards]
                    if len(cards) < fo.quantity:
                        all_cards_generated = False
                    for c in cards:
                        if not (c.qc_nfc_tested and c.qc_destination_verified):
                            all_qc_passed = False
                else:
                    all_cards_generated = False
                    all_qc_passed = False

        items_summary.append({
            "product_title": it.product_title,
            "product_type": it.product_type,
            "quantity": it.quantity,
            "destination_configured": it.destination_configured,
            "destination_type": it.destination_type,
            "customization_color": it.customization_color,
            "customization_template": it.customization_template,
            "fulfillment_status": fo_status,
            "card_codes": card_codes,
        })

    # Timeline calculation
    step1_completed = True
    step2_completed = any_cards_generated
    step3_completed = (all_cards_generated and all_qc_passed)
    step4_completed = (shop_order.status in ("FULFILLED", "SHIPPED"))

    is_courier = (shop_order.shipping_method == ShippingMethod.COURIER.value)
    step4_title_fa = "تحویل به پیک موتوری تهران" if is_courier else "بسته‌بندی و تحویل به پست"
    step4_title_en = "Dispatched via Tehran Courier" if is_courier else "Packaged & Dispatched"
    step4_desc_fa = f"ارسال سریع پیک در تهران" if is_courier else f"ارسال به مقصد {shop_order.shipping_city}"
    step4_desc_en = f"Same-day courier delivery in Tehran" if is_courier else f"Dispatched for delivery to {shop_order.shipping_city}"

    timeline = [
        {
            "step": 1,
            "title_fa": "سفارش ثبت و پرداخت شد",
            "title_en": "Order Placed & Paid",
            "description_fa": f"پرداخت موفق با شناسه {shop_order.payment_reference}",
            "description_en": f"Payment confirmed with ref {shop_order.payment_reference}",
            "is_completed": step1_completed,
            "is_current": not step2_completed,
            "timestamp": shop_order.created_at,
        },
        {
            "step": 2,
            "title_fa": "تولید کارت‌های هوشمند در کارخانه",
            "title_en": "Batch Card Factory Production",
            "description_fa": "تولید چیپ‌های سخت‌افزاری و چاپ کدهای اختصاصی",
            "description_en": "Hardware NFC chip programming and QR printing",
            "is_completed": step2_completed,
            "is_current": step2_completed and not step3_completed,
            "timestamp": None,
        },
        {
            "step": 3,
            "title_fa": "کنترل کیفیت سخت‌افزاری (QC)",
            "title_en": "Hardware Quality Control (QC)",
            "description_fa": "تست سیگنال آنتن NFC و اسکن‌پذیری بارکد QR",
            "description_en": "Antenna signal range and QR readability testing",
            "is_completed": step3_completed,
            "is_current": step3_completed and not step4_completed,
            "timestamp": None,
        },
        {
            "step": 4,
            "title_fa": step4_title_fa,
            "title_en": step4_title_en,
            "description_fa": step4_desc_fa,
            "description_en": step4_desc_en,
            "is_completed": step4_completed,
            "is_current": step4_completed,
            "timestamp": shop_order.shipped_at if step4_completed else None,
        },
    ]

    # Mask sensitive customer info
    name_parts = shop_order.customer_name.split()
    masked_name = " ".join([p[0] + "***" if len(p) > 1 else p for p in name_parts])
    
    addr = shop_order.shipping_address
    masked_addr = addr[:10] + "، پلاک ***" if len(addr) > 10 else addr

    return {
        "shop_order_number": shop_order.shop_order_number,
        "status": shop_order.status,
        "payment_status": shop_order.payment_status,
        "created_at": shop_order.created_at,
        "shipping_city": shop_order.shipping_city,
        "shipping_address_masked": masked_addr,
        "customer_name_masked": masked_name,
        "shipping_method": shop_order.shipping_method,
        "shipping_tracking_code": shop_order.shipping_tracking_code,
        "items": items_summary,
        "timeline": timeline,
    }


# ── Self-Service Card Activation Services ───────────────────────────

async def verify_card_activation(
    db: AsyncSession,
    card_code: str,
    order_number: str,
    verification_contact: str,
) -> dict:
    """Verify customer ownership of a physical card and issue a short-lived activation token."""
    clean_code = card_code.strip()
    clean_ord_num = order_number.strip()
    clean_contact = verification_contact.strip().lower()
    norm_contact_phone = normalize_phone(clean_contact)

    # 1. Find Card
    card = await get_card_by_code(db, clean_code)
    if not card:
        raise ValueError("We could not verify the card activation details. (1)")

    # 2. Find linked factory Order
    if not card.order_id:
        raise ValueError("We could not verify the card activation details. (2)")

    factory_order = await db.get(Order, card.order_id)
    if not factory_order:
        raise ValueError("We could not verify the card activation details. (3)")

    # 3. Find linked ShopOrderItem & ShopOrder
    query = select(ShopOrderItem).where(ShopOrderItem.fulfillment_order_id == factory_order.id)
    res = await db.execute(query)
    shop_item = res.scalar_one_or_none()

    shop_order = None
    if shop_item:
        shop_order = await db.get(ShopOrder, shop_item.shop_order_id)

    # Validate order number matches shop order or factory order
    order_match = False
    if shop_order and shop_order.shop_order_number == clean_ord_num:
        order_match = True
    elif factory_order.order_number == clean_ord_num:
        order_match = True

    if not order_match:
        raise ValueError(f"We could not verify the card activation details. (4) shop={shop_order.shop_order_number if shop_order else None}, fact={factory_order.order_number}, expected={clean_ord_num}")

    # Validate contact
    contact_matched = False
    if shop_order:
        order_phone_norm = normalize_phone(shop_order.customer_phone)
        order_email_clean = shop_order.customer_email.strip().lower()
        if norm_contact_phone and norm_contact_phone == order_phone_norm:
            contact_matched = True
        elif clean_contact == order_email_clean:
            contact_matched = True
    else:
        # Fallback for directly-created factory orders if any
        contact_matched = True

    if not contact_matched:
        raise ValueError(f"We could not verify the card activation details. (5) phone={order_phone_norm if shop_order else None}, expected={norm_contact_phone}")

    # 4. Generate 15-minute cryptographically secure single-use token
    token = f"act_{secrets.token_urlsafe(32)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    session = CardActivationSession(
        token=token,
        card_id=card.id,
        order_id=card.order_id,
        expires_at=expires_at,
        used=False,
    )
    db.add(session)
    await db.flush()

    business = await db.get(Business, card.business_id)
    destination = await db.get(Destination, card.destination_id)

    logger.info("Activation token issued for card %s (session id=%s)", clean_code, session.id)

    return {
        "activation_token": token,
        "card_code": clean_code,
        "business_name": business.name if business else "TapNow Card",
        "product_title": shop_item.product_title if shop_item else "Smart Card",
        "current_destination_type": destination.type if destination else "PENDING_SETUP",
        "expires_in_seconds": 900,
    }


async def configure_card_activation(
    db: AsyncSession,
    activation_token: str,
    destination_type: str,
    destination_url: str,
) -> dict:
    """Configure card destination using an active activation token."""
    query = select(CardActivationSession).where(CardActivationSession.token == activation_token.strip())
    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session or session.used:
        raise ValueError("Activation token is invalid or has expired. Please restart verification.")

    expires_at = session.expires_at
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise ValueError("Activation token is invalid or has expired. Please restart verification.")

    card = await db.get(Card, session.card_id)
    if not card:
        raise ValueError("Target card not found.")

    dest_url = destination_url.strip()
    is_perfect_link = "search.google.com/local/writereview" in dest_url or "g.page/r/" in dest_url

    # Update or create destination
    dest = await db.get(Destination, card.destination_id)
    if dest:
        dest.source_url = dest_url
        dest.type = destination_type
        dest.status = DestinationStatus.ACTIVE.value
        dest.updated_at = datetime.now(timezone.utc)
    else:
        dest = Destination(
            business_id=card.business_id,
            source_url=dest_url,
            type=destination_type,
            status=DestinationStatus.ACTIVE.value,
        )
        db.add(dest)
        await db.flush()
        card.destination_id = dest.id

    # Mark card destination QC verified
    card.qc_destination_verified = True
    card.updated_at = datetime.now(timezone.utc)

    # Find the corresponding ShopOrderItem to update its link status
    if card.order_id:
        shop_item_res = await db.execute(
            select(ShopOrderItem).where(ShopOrderItem.fulfillment_order_id == card.order_id)
        )
        shop_item = shop_item_res.scalar_one_or_none()

        if shop_item:
            shop_item.customer_submitted_url = dest_url
            shop_item.destination_type = destination_type
            if is_perfect_link:
                shop_item.final_verified_url = dest_url
                shop_item.link_status = ShopOrderItemLinkStatus.VERIFIED.value
            else:
                shop_item.link_status = ShopOrderItemLinkStatus.CUSTOMER_SUBMITTED.value
            shop_item.updated_at = datetime.now(timezone.utc)

    # Invalidate session token
    session.used = True
    await db.flush()

    logger.info(
        "Card %s activated: url=%s (perfect=%s)",
        card.code, dest_url, is_perfect_link
    )

    return {
        "status": "activated",
        "card_code": card.code,
        "destination_type": destination_type,
        "destination_url": dest_url,
        "is_perfect_link": is_perfect_link,
        "message": "کارت با موفقیت فعال شد و آماده استفاده است.",
    }


# ── Shipping Rules Services ──────────────────────────────────────────

DEFAULT_PROVINCE_RULES = [
    {"province": "تهران", "postal_price": 35000, "courier_available": True, "courier_price": 65000},
    {"province": "آذربایجان شرقی", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "آذربایجان غربی", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "اردبیل", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "اصفهان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "البرز", "postal_price": 40000, "courier_available": False, "courier_price": 0},
    {"province": "ایلام", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "بوشهر", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "چهارمحال و بختیاری", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "خراسان جنوبی", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "خراسان رضوی", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "خراسان شمالی", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "خوزستان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "زنجان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "سمنان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "سیستان و بلوچستان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "فارس", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "قزوین", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "قم", "postal_price": 40000, "courier_available": False, "courier_price": 0},
    {"province": "کردستان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "کرمان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "کرمانشاه", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "کهگیلویه و بویراحمد", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "گلستان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "گیلان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "لرستان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "مازندران", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "مرکزی", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "هرمزگان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "همدان", "postal_price": 45000, "courier_available": False, "courier_price": 0},
    {"province": "یزد", "postal_price": 45000, "courier_available": False, "courier_price": 0},
]


def _normalize_province_name(name: str) -> str:
    """Normalize Persian characters, remove extra spaces and invisible zero-width characters."""
    if not name:
        return ""
    # Strip invisible zero-width characters (\u200c, \u200b, \u00a0, etc.)
    cleaned = re.sub(r"[\u200c\u200b\u00a0\r\n\t]+", " ", name)
    cleaned = cleaned.strip().replace("ي", "ی").replace("ك", "ک").replace("ة", "ه")
    cleaned = re.sub(r"^استان\s+", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


async def init_default_shipping_rules(db: AsyncSession) -> list[ShippingRule]:
    """Ensure all 31 default provinces exist in shipping_rules table idempotently."""
    result = await db.execute(select(ShippingRule))
    existing = {_normalize_province_name(r.province): r for r in result.scalars().all()}

    rules = []
    added = False
    for item in DEFAULT_PROVINCE_RULES:
        prov = item["province"]
        norm = _normalize_province_name(prov)
        if norm not in existing:
            rule = ShippingRule(
                province=prov,
                postal_price=item["postal_price"],
                courier_available=item["courier_available"],
                courier_price=item["courier_price"],
                active=True,
            )
            db.add(rule)
            rules.append(rule)
            existing[norm] = rule
            added = True
        else:
            rules.append(existing[norm])

    if added:
        await db.commit()
    return rules


async def get_all_shipping_rules(db: AsyncSession) -> list[ShippingRule]:
    """Retrieve all shipping rules, initializing defaults if table is completely unseeded."""
    result = await db.execute(select(ShippingRule).order_by(ShippingRule.province.asc()))
    rules = list(result.scalars().all())
    if not rules:
        rules = await init_default_shipping_rules(db)
    return rules


async def get_shipping_rule_by_province(db: AsyncSession, province: str) -> ShippingRule | None:
    """Find a shipping rule by normalized province name (pure read-only lookup)."""
    norm = _normalize_province_name(province)
    if not norm:
        return None

    rules = await get_all_shipping_rules(db)

    # 1. Exact normalized match
    for r in rules:
        if _normalize_province_name(r.province) == norm:
            return r

    # 2. Space-insensitive match (e.g. 'چهارمحال وبختیاری' vs 'چهارمحال و بختیاری')
    norm_no_space = norm.replace(" ", "")
    for r in rules:
        if _normalize_province_name(r.province).replace(" ", "") == norm_no_space:
            return r

    # 3. Substring match
    for r in rules:
        r_norm = _normalize_province_name(r.province)
        if norm in r_norm or r_norm in norm:
            return r

    for r in rules:
        r_norm_no_space = _normalize_province_name(r.province).replace(" ", "")
        if norm_no_space in r_norm_no_space or r_norm_no_space in norm_no_space:
            return r

    return None


async def calculate_order_shipping(
    db: AsyncSession,
    province: str,
    shipping_method: str = "POST",
) -> dict:
    """
    Calculate shipping cost and determine courier eligibility based on province.
    Fails safely if province has no active shipping configuration.
    """
    if not province or not province.strip():
        raise ValueError("استان یا مقصد ارسال مشخص نشده است.")

    norm_method = (shipping_method or "POST").upper().strip()
    rule = await get_shipping_rule_by_province(db, province)
    
    if not rule:
        raise ValueError(f"تعرفه ارسالی برای استان یا مقصد «{province}» در سیستم یافت نشد.")
    
    if not rule.active:
        raise ValueError(f"تعرفه ارسال برای استان «{province}» در حال حاضر غیرفعال است.")

    postal_price = rule.postal_price
    courier_available = rule.courier_available
    courier_price = rule.courier_price

    if norm_method == "COURIER":
        if not courier_available:
            raise ValueError(f"ارسال با پیک برای استان «{province}» در دسترس نیست. لطفاً روش پست پیشتاز را انتخاب نمایید.")
        shipping_cost = courier_price
    else:
        shipping_cost = postal_price

    return {
        "province": rule.province,
        "shipping_method": norm_method,
        "shipping_cost": shipping_cost,
        "postal_price": postal_price,
        "courier_available": courier_available,
        "courier_price": courier_price,
    }


async def update_shipping_rule(
    db: AsyncSession,
    rule_id: uuid.UUID,
    postal_price: int,
    courier_available: bool,
    courier_price: int,
    active: bool = True,
) -> ShippingRule:
    """Update a specific province shipping rule."""
    if postal_price < 0 or courier_price < 0:
        raise ValueError("هزینه ارسال نمی‌تواند عدد منفی باشد.")

    rule = await db.get(ShippingRule, rule_id)
    if not rule:
        res = await db.execute(select(ShippingRule).where(ShippingRule.id == rule_id))
        rule = res.scalar_one_or_none()
    if not rule:
        raise ValueError("Shipping rule not found")

    rule.postal_price = postal_price
    rule.courier_available = courier_available
    rule.courier_price = courier_price
    rule.active = active
    rule.updated_at = datetime.now(timezone.utc)
    await db.flush()
    logger.info("Updated shipping rule for %s (id=%s)", rule.province, rule.id)
    return rule


async def bulk_update_shipping_rules(
    db: AsyncSession,
    rule_ids: list[uuid.UUID],
    postal_price: int | None = None,
    price_adjustment_amount: int | None = None,
    price_adjustment_percentage: float | None = None,
    courier_available: bool | None = None,
    courier_price: int | None = None,
    active: bool | None = None,
) -> list[ShippingRule]:
    """Bulk update multiple province shipping rules in a single transaction."""
    if postal_price is not None and postal_price < 0:
        raise ValueError("هزینه ارسال نمی‌تواند عدد منفی باشد.")
    if courier_price is not None and courier_price < 0:
        raise ValueError("هزینه ارسال نمی‌تواند عدد منفی باشد.")

    result = await db.execute(select(ShippingRule).where(ShippingRule.id.in_(rule_ids)))
    rules = list(result.scalars().all())
    now = datetime.now(timezone.utc)

    for rule in rules:
        if postal_price is not None:
            rule.postal_price = postal_price
        elif price_adjustment_amount is not None:
            rule.postal_price = max(0, int(rule.postal_price + price_adjustment_amount))
        elif price_adjustment_percentage is not None:
            multiplier = 1.0 + (price_adjustment_percentage / 100.0)
            rule.postal_price = max(0, int(round(rule.postal_price * multiplier)))

        if courier_available is not None:
            rule.courier_available = courier_available
        if courier_price is not None:
            rule.courier_price = courier_price
        if active is not None:
            rule.active = active
        rule.updated_at = now

    await db.flush()
    logger.info("Bulk updated %d shipping rules", len(rules))
    return rules



async def create_shipping_rule(
    db: AsyncSession,
    province: str,
    postal_price: int = 45000,
    courier_available: bool = False,
    courier_price: int = 0,
) -> ShippingRule:
    """Create or update a province/city shipping rule."""
    if postal_price < 0 or courier_price < 0:
        raise ValueError("هزینه ارسال نمی‌تواند عدد منفی باشد.")
    existing = await get_shipping_rule_by_province(db, province)
    if existing:
        existing.postal_price = postal_price
        existing.courier_available = courier_available
        existing.courier_price = courier_price
        existing.active = True
        existing.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return existing
    
    rule = ShippingRule(
        province=province.strip(),
        postal_price=postal_price,
        courier_available=courier_available,
        courier_price=courier_price,
        active=True,
    )
    db.add(rule)
    await db.flush()
    logger.info("Created new shipping rule for %s", province)
    return rule





