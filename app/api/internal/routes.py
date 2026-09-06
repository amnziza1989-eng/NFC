"""Internal management API routes.

These endpoints are separated from public routes so that authentication
can be added cleanly in a future phase without affecting public redirect
performance.
"""

import uuid
import logging

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.config import get_settings
from app.api.dependencies.auth import get_api_key
from app.schemas.schemas import (
    BusinessCreate, BusinessUpdate, BusinessResponse,
    DestinationCreate, DestinationUpdate, DestinationResponse,
    OrderCreate, OrderUpdate, OrderResponse, OrderDetailResponse,
    OrderCardGenerationResponse, OrderReconciliationResponse, OrderQRLabelsResponse,
    CardCreate, CardUpdate, CardResponse, CardInfoResponse,
    ProvisioningResponse, AnalyticsResponse, BusinessAnalyticsResponse,
    EventResponse, ShopCheckoutResponse, ShopOrderShipRequest,
    ShopOrderItemUpdateLinkRequest, ShopOrderItemUpdateProductionRequest,
    ShopOrderItemConfirmLinkRequest,
    ShippingRuleResponse, ShippingRuleCreate, ShippingRuleUpdate, ShippingRuleBulkUpdate,
)
from app.services.service import (
    create_business, get_business, list_businesses, update_business,
    create_destination, get_destination, update_destination, list_destinations,
    create_order, get_order, list_orders, update_order_status,
    generate_order_cards, list_order_cards,
    get_order_reconciliation, get_order_qr_labels, export_order_cards_csv,
    create_card, get_card, list_cards, update_card, get_card_info,
    get_card_provisioning, get_card_analytics, get_business_analytics,
    get_card_events,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["Internal Management"],
    dependencies=[Depends(get_api_key)],
)


# ── Business endpoints ─────────────────────────────────────────────

@router.post("/businesses", response_model=BusinessResponse, status_code=201)
async def api_create_business(
    data: BusinessCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new business."""
    business = await create_business(db, name=data.name, logo_url=data.logo_url)
    await db.commit()
    return business


@router.get("/businesses", response_model=list[BusinessResponse])
async def api_list_businesses(
    search: str | None = Query(None, description="Case-insensitive search by business name"),
    status: str | None = Query(None, pattern=r"^(ACTIVE|DISABLED)$", description="Filter by business status"),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all businesses with optional search and status filtering."""
    return await list_businesses(db, search=search, status=status, skip=skip, limit=limit)


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
    await db.commit()
    return business


@router.get("/businesses/{business_id}/analytics", response_model=BusinessAnalyticsResponse)
async def api_business_analytics(
    business_id: uuid.UUID,
    start_date: date | None = Query(None, description="Start date (inclusive)"),
    end_date: date | None = Query(None, description="End date (inclusive)"),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated analytics across all cards for a business."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date cannot be after end_date")

    stats = await get_business_analytics(db, business_id, start_date=start_date, end_date=end_date)
    if not stats:
        raise HTTPException(status_code=404, detail="Business not found")
    return stats


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
        url=data.source_url,
        dest_type=data.type,
    )
    await db.commit()
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
        source_url=data.source_url, type=data.type, status=data.status,
    )
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    await db.commit()
    return destination


@router.get("/destinations", response_model=list[DestinationResponse])
async def api_list_destinations(
    business_id: uuid.UUID | None = Query(None, description="Filter by business ID"),
    status: str | None = Query(None, pattern=r"^(ACTIVE|DISABLED)$", description="Filter by destination status"),
    type: str | None = Query(None, description="Filter by destination type"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return (max 100)"),
    db: AsyncSession = Depends(get_db),
):
    """List destinations with optional filtering by business, status, or type."""
    return await list_destinations(
        db,
        business_id=business_id,
        status=status,
        dest_type=type,
        skip=skip,
        limit=limit,
    )


# ── Shop Order endpoints ────────────────────────────────────────────────

@router.get("/shop-orders", response_model=list[ShopCheckoutResponse])
async def api_list_shop_orders(
    db: AsyncSession = Depends(get_db),
    status: str | None = None,
    limit: int = 50,
):
    """List shop orders for the admin dashboard."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.models import ShopOrder
    from app.services.service import format_shop_order_response

    query = select(ShopOrder).order_by(ShopOrder.created_at.desc()).options(selectinload(ShopOrder.items))
    if status and status.upper() != "ALL":
        stat_upper = status.upper()
        if stat_upper in ("PENDING", "UNSHIPPED", "PAID", "PLACED"):
            query = query.where(ShopOrder.status.in_(["PLACED", "PROCESSING", "FULFILLED"]))
        else:
            query = query.where(ShopOrder.status == stat_upper)
    query = query.limit(limit)

    result = await db.execute(query)
    orders = result.scalars().all()

    response = []
    for order in orders:
        ord_dict = await format_shop_order_response(db, order)
        response.append(ord_dict)
    return response


@router.post("/shop-order-items/{item_id}/confirm-link")
async def api_confirm_shop_order_item_link(
    item_id: str,
    payload: ShopOrderItemConfirmLinkRequest,
    db: AsyncSession = Depends(get_db),
):
    """Operator approves/confirms the final destination URL for a shop order item."""
    import uuid
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid item ID")

    from app.services.service import confirm_shop_order_item_link
    try:
        res = await confirm_shop_order_item_link(
            db=db,
            item_id=item_uuid,
            final_verified_url=payload.final_verified_url,
        )
        await db.commit()
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/shop-order-items/{item_id}/generate-cards")
async def api_generate_shop_order_item_cards(
    item_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Ensure cards are generated for a shop order item."""
    import uuid
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid item ID")

    from app.models.models import ShopOrderItem
    item = await db.get(ShopOrderItem, item_uuid)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not item.fulfillment_order_id:
        raise HTTPException(status_code=400, detail="No linked fulfillment order")

    from app.services.service import generate_order_cards
    res = await generate_order_cards(db=db, order_id=item.fulfillment_order_id)
    await db.commit()
    return res


@router.patch("/shop-order-items/{item_id}/link")
async def api_update_shop_order_item_link(
    item_id: str,
    payload: ShopOrderItemUpdateLinkRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update link status and verified URL for a shop order item."""
    from sqlalchemy import select
    from app.models.models import ShopOrderItem
    import uuid

    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid item ID")

    result = await db.execute(select(ShopOrderItem).where(ShopOrderItem.id == item_uuid))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.link_status = payload.link_status
    if payload.final_verified_url is not None:
        item.final_verified_url = payload.final_verified_url

    await db.commit()
    return {"status": "success"}


@router.patch("/shop-order-items/{item_id}/production")
async def api_update_shop_order_item_production(
    item_id: str,
    payload: ShopOrderItemUpdateProductionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update production progress status for a shop order item."""
    from sqlalchemy import select
    from app.models.models import ShopOrderItem, Card
    import uuid

    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid item ID")

    result = await db.execute(select(ShopOrderItem).where(ShopOrderItem.id == item_uuid))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.production_status = payload.production_status
    if payload.production_status == "COMPLETED" and item.fulfillment_order_id:
        cards_res = await db.execute(select(Card).where(Card.order_id == item.fulfillment_order_id))
        cards = cards_res.scalars().all()
        for c in cards:
            c.qc_nfc_tested = True
            c.qc_qr_tested = True
            c.qc_destination_verified = True

    await db.commit()
    return {"status": "success"}


@router.patch("/shop-orders/{shop_order_number}/ship", response_model=ShopCheckoutResponse)
async def api_ship_shop_order(
    shop_order_number: str,
    payload: ShopOrderShipRequest,
    db: AsyncSession = Depends(get_db),
):
    """Mark a shop order as SHIPPED and notify the customer with duplicate protection."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.models import ShopOrder, ShopOrderStatus, ShippingMethod
    from app.services.notifications import notification_service
    from datetime import datetime, timezone
    
    query = select(ShopOrder).where(ShopOrder.shop_order_number == shop_order_number).options(selectinload(ShopOrder.items))
    result = await db.execute(query)
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Shop order not found")
        
    from app.services.service import get_shop_order_readiness
    readiness = get_shop_order_readiness(order, order.items)
    if not readiness["ready_to_ship"]:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "سفارش آماده ارسال نیست.",
                "reasons": readiness["blocking_reasons"]
            }
        )

    # Validate tracking code for postal orders / courier phone for courier orders
    if order.shipping_method == ShippingMethod.POST.value:
        if not payload.tracking_code or not payload.tracking_code.strip():
            raise HTTPException(
                status_code=422,
                detail="کد رهگیری مرسوله پستی الزامی است."
            )
        order.shipping_tracking_code = payload.tracking_code.strip()
    else:
        courier_contact = (payload.courier_phone or payload.tracking_code or "").strip()
        if courier_contact:
            order.shipping_tracking_code = courier_contact

    order.status = ShopOrderStatus.SHIPPED.value
    if not order.shipped_at:
        order.shipped_at = datetime.now(timezone.utc)
    
    # Notify customer via configured SMS gateway (Mock in dev, Real in prod) with duplicate protection
    await notification_service.notify_order_shipped(db, order, force_resend=payload.force_resend)
    await db.commit()
    
    items = []
    for it in order.items:
        items.append({
            "id": it.id,
            "product_type": it.product_type,
            "product_title": it.product_title,
            "unit_price": it.unit_price,
            "quantity": it.quantity,
            "total_price": it.unit_price * it.quantity,
            "destination_type": it.destination_type,
            "customer_submitted_url": it.customer_submitted_url,
            "final_verified_url": it.final_verified_url,
            "link_status": it.link_status,
            "production_status": it.production_status,
            "destination_configured": it.destination_configured,
            "customization_logo_url": it.customization_logo_url,
            "customization_color": it.customization_color,
            "customization_template": it.customization_template,
        })
        
    return {
        "shop_order_number": order.shop_order_number,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "customer_phone": order.customer_phone,
        "company_name": order.company_name,
        "shipping_address": order.shipping_address,
        "shipping_city": order.shipping_city,
        "shipping_province": order.shipping_province,
        "shipping_postal_code": order.shipping_postal_code,
        "shipping_notes": order.shipping_notes,
        "shipping_method": order.shipping_method,
        "shipping_tracking_code": order.shipping_tracking_code,
        "shipped_at": order.shipped_at,
        "shipping_notification_status": order.shipping_notification_status,
        "shipping_notification_sent_at": order.shipping_notification_sent_at,
        "shipping_notification_error": order.shipping_notification_error,
        "shipping_notification_provider_ref": order.shipping_notification_provider_ref,
        "shipping_cost": getattr(order, "shipping_cost", 0) or 0,
        "total_amount": order.total_amount,
        "payment_status": order.payment_status,
        "payment_reference": order.payment_reference,
        "status": order.status,
        "fulfillment_status": readiness["fulfillment_status"],
        "ready_to_ship": readiness["ready_to_ship"],
        "blocking_reasons": readiness["blocking_reasons"],
        "created_at": order.created_at,
        "items": items,
    }


@router.get("/shop/shipping-rules", response_model=list[ShippingRuleResponse])
async def api_get_shipping_rules(db: AsyncSession = Depends(get_db)):
    """List all province shipping rules."""
    from app.services.service import get_all_shipping_rules
    return await get_all_shipping_rules(db)


@router.put("/shop/shipping-rules/{rule_id}", response_model=ShippingRuleResponse)
async def api_update_shipping_rule(
    rule_id: uuid.UUID,
    payload: ShippingRuleUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a specific province shipping rule."""
    from app.services.service import update_shipping_rule
    try:
        updated = await update_shipping_rule(
            db=db,
            rule_id=rule_id,
            postal_price=payload.postal_price,
            courier_available=payload.courier_available,
            courier_price=payload.courier_price,
            active=payload.active,
        )
        await db.commit()
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/shop/shipping-rules", response_model=ShippingRuleResponse, status_code=201)
async def api_create_shipping_rule(
    payload: ShippingRuleCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create or update a province/city shipping rule."""
    from app.services.service import create_shipping_rule
    try:
        rule = await create_shipping_rule(
            db=db,
            province=payload.province,
            postal_price=payload.postal_price,
            courier_available=payload.courier_available,
            courier_price=payload.courier_price,
        )
        await db.commit()
        return rule
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/shop/shipping-rules/bulk-update", response_model=list[ShippingRuleResponse])
async def api_bulk_update_shipping_rules(
    payload: ShippingRuleBulkUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Bulk update multiple province shipping rules."""
    from app.services.service import bulk_update_shipping_rules
    try:
        updated = await bulk_update_shipping_rules(
            db=db,
            rule_ids=payload.rule_ids,
            postal_price=payload.postal_price,
            price_adjustment_amount=payload.price_adjustment_amount,
            price_adjustment_percentage=payload.price_adjustment_percentage,
            courier_available=payload.courier_available,
            courier_price=payload.courier_price,
            active=payload.active,
        )
        await db.commit()
        return updated
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))






# ── Factory Order endpoints ────────────────────────────────────────────────

@router.post("/orders", response_model=OrderResponse, status_code=201)
async def api_create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a customer purchase order for physical cards (post-sale)."""
    try:
        order = await create_order(
            db,
            business_id=data.business_id,
            destination_id=data.destination_id,
            product_type=data.product_type,
            quantity=data.quantity,
        )
        await db.commit()
        return {
            "id": order.id,
            "order_number": order.order_number,
            "business_id": order.business_id,
            "destination_id": order.destination_id,
            "product_type": order.product_type,
            "physical_template": "NFC_ONLY_TEMPLATE" if order.product_type == "NFC_ONLY" else "NFC_QR_TEMPLATE",
            "quantity": order.quantity,
            "cards_generated_count": 0,
            "status": order.status,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/orders", response_model=list[OrderResponse])
async def api_list_orders(
    search: str | None = Query(None, description="Search by order number"),
    status: str | None = Query(None, description="Filter by order status"),
    business_id: uuid.UUID | None = Query(None, description="Filter by business ID"),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all orders with card counts and optional filters."""
    return await list_orders(
        db,
        search=search,
        status=status,
        business_id=business_id,
        skip=skip,
        limit=limit,
    )


@router.get("/orders/{order_id}", response_model=OrderDetailResponse)
async def api_get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed order metadata including linked business and destination."""
    order_dict = await get_order(db, order_id)
    if not order_dict:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_dict


@router.patch("/orders/{order_id}", response_model=OrderResponse)
async def api_update_order(
    order_id: uuid.UUID,
    data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update order status with completion gate validation."""
    try:
        order = await update_order_status(db, order_id, status=data.status)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        await db.commit()
        order_dict = await get_order(db, order_id)
        return order_dict
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/orders/{order_id}/generate-cards", response_model=OrderCardGenerationResponse)
async def api_generate_order_cards(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Idempotently generate the exact requested number of cards for an order."""
    try:
        result = await generate_order_cards(db, order_id)
        await db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}/cards", response_model=list[CardInfoResponse])
async def api_list_order_cards(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """List cards belonging to an order with full provisioning details."""
    cards = await list_order_cards(db, order_id)
    settings = get_settings()
    base_url = settings.PUBLIC_BASE_URL

    card_infos = []
    for c in cards:
        info = await get_card_info(db, c.id, base_url=base_url)
        if info:
            card_infos.append(info)
    return card_infos


@router.get("/orders/{order_id}/reconciliation", response_model=OrderReconciliationResponse)
async def api_get_order_reconciliation(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get packaging reconciliation and delivery readiness status."""
    reconciliation = await get_order_reconciliation(db, order_id)
    if not reconciliation:
        raise HTTPException(status_code=404, detail="Order not found")
    return reconciliation


@router.get("/orders/{order_id}/qr-labels", response_model=OrderQRLabelsResponse)
async def api_get_order_qr_labels(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get print-ready QR label metadata for an order."""
    settings = get_settings()
    labels_data = await get_order_qr_labels(db, order_id, base_url=settings.PUBLIC_BASE_URL)
    if not labels_data:
        raise HTTPException(status_code=404, detail="Order not found")
    return labels_data


@router.get("/orders/{order_id}/export/cards.csv")
async def api_export_order_cards_csv(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Export all cards for an order as CSV."""
    settings = get_settings()
    try:
        filename, csv_data = await export_order_cards_csv(
            db, order_id, export_type="cards", base_url=settings.PUBLIC_BASE_URL
        )
        return Response(
            content=csv_data,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/orders/{order_id}/export/nfc.csv")
async def api_export_order_nfc_csv(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Export NFC provisioning data for an order as CSV."""
    settings = get_settings()
    try:
        filename, csv_data = await export_order_cards_csv(
            db, order_id, export_type="nfc", base_url=settings.PUBLIC_BASE_URL
        )
        return Response(
            content=csv_data,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/orders/{order_id}/export/qr.csv")
async def api_export_order_qr_csv(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Export QR label data for an order as CSV (NFC_QR orders only)."""
    settings = get_settings()
    try:
        filename, csv_data = await export_order_cards_csv(
            db, order_id, export_type="qr", base_url=settings.PUBLIC_BASE_URL
        )
        return Response(
            content=csv_data,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        # If NFC_ONLY, return 422
        if "NFC_ONLY" in str(e):
            raise HTTPException(status_code=422, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))



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
        order_id=data.order_id,
    )
    await db.commit()
    return card


@router.get("/cards", response_model=list[CardResponse])
async def api_list_cards(
    business_id: uuid.UUID | None = Query(None, description="Filter by business ID"),
    destination_id: uuid.UUID | None = Query(None, description="Filter by destination ID"),
    order_id: uuid.UUID | None = Query(None, description="Filter by order ID"),
    status: str | None = Query(None, pattern=r"^(ACTIVE|DISABLED)$", description="Filter by card status"),
    code: str | None = Query(None, description="Case-insensitive substring search by card code"),
    search: str | None = Query(None, description="Case-insensitive substring search by card code"),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List cards, optionally filtered by business, destination, order, status, or code/search."""
    return await list_cards(
        db,
        business_id=business_id,
        destination_id=destination_id,
        order_id=order_id,
        status=status,
        code=code,
        search=search,
        skip=skip,
        limit=limit,
    )


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
    """Update a card (status, destination, QC flags)."""
    # If destination_id provided, verify it exists
    if data.destination_id:
        destination = await get_destination(db, data.destination_id)
        if not destination:
            raise HTTPException(status_code=404, detail="Destination not found")

    update_kwargs = {}
    if data.destination_id is not None:
        update_kwargs["destination_id"] = data.destination_id
    if data.status is not None:
        update_kwargs["status"] = data.status
    if data.qc_nfc_tested is not None:
        update_kwargs["qc_nfc_tested"] = data.qc_nfc_tested
    if data.qc_qr_tested is not None:
        update_kwargs["qc_qr_tested"] = data.qc_qr_tested
    if data.qc_destination_verified is not None:
        update_kwargs["qc_destination_verified"] = data.qc_destination_verified

    card = await update_card(db, card_id, **update_kwargs)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    await db.commit()
    return card


@router.get("/cards/{card_id}/info", response_model=CardInfoResponse)
async def api_get_card_info(
    card_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get extended card info for QC and operator inspection."""
    settings = get_settings()
    info = await get_card_info(db, card_id, base_url=settings.PUBLIC_BASE_URL)
    if not info:
        raise HTTPException(status_code=404, detail="Card not found")
    return info


@router.get("/cards/{card_id}/provisioning", response_model=ProvisioningResponse)
async def api_get_card_provisioning(
    card_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all provisioning data for a card (NFC URL, QR URL, QR image URL)."""
    settings = get_settings()
    data = await get_card_provisioning(db, card_id, base_url=settings.PUBLIC_BASE_URL)
    if not data:
        raise HTTPException(status_code=404, detail="Card not found")
    return data


@router.get("/cards/{card_id}/analytics", response_model=AnalyticsResponse)
async def api_card_analytics(
    card_id: uuid.UUID,
    start_date: date | None = Query(None, description="Start date (inclusive)"),
    end_date: date | None = Query(None, description="End date (inclusive)"),
    db: AsyncSession = Depends(get_db),
):
    """Get interaction counts and recent events for a card."""
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date cannot be after end_date")

    stats = await get_card_analytics(db, card_id, start_date=start_date, end_date=end_date)
    if not stats:
        raise HTTPException(status_code=404, detail="Card not found")
    return stats


@router.get("/cards/{card_id}/events", response_model=list[EventResponse])
async def api_card_events(
    card_id: uuid.UUID,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Get raw event log for a card."""
    return await get_card_events(db, card_id, limit=limit)
