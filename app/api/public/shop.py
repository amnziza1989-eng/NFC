"""Public Shop API routes — product catalog, checkout, order tracking, and logo upload."""

import logging
import os
import uuid
from pathlib import Path
from PIL import Image
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.api.dependencies.rate_limit import rate_limit
from app.api.dependencies.auth import get_current_customer, get_optional_customer
from app.schemas.schemas import (
    ShopCatalogResponse,
    ShopCheckoutRequest,
    ShopCheckoutResponse,
    ShopOrderTrackRequest,
    ShopOrderTrackResponse,
    ShippingRuleResponse,
    ShippingQuoteRequest,
    ShippingQuoteResponse,
)
from app.services.service import (
    get_shop_catalog,
    process_shop_checkout,
    get_shop_order_by_number,
    track_shop_order,
    get_all_shipping_rules,
    calculate_order_shipping,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/public/shop", tags=["Public Shop"])

UPLOAD_DIR = Path("uploads/logos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB


@router.get(
    "/products",
    response_model=ShopCatalogResponse,
    summary="Get available product catalog",
)
async def list_shop_products():
    """Retrieve the list of physical NFC and QR products available in the shop."""
    products = get_shop_catalog()
    return {"products": products}


@router.post(
    "/checkout",
    response_model=ShopCheckoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Process multi-item customer checkout with mock payment",
    dependencies=[Depends(rate_limit)],
)
async def checkout(
    payload: ShopCheckoutRequest,
    db: AsyncSession = Depends(get_db),
    customer_id_str: str | None = Depends(get_optional_customer),
):
    """Process a shopping cart checkout.

    Creates customer business, destinations, factory fulfillment orders,
    and the parent shop order with mock payment simulation.
    """
    try:
        customer_id = uuid.UUID(customer_id_str) if customer_id_str else None
        result = await process_shop_checkout(
            db=db, 
            checkout_data=payload.model_dump(),
            customer_id=customer_id
        )
        await db.commit()
        return result
    except ValueError as e:
        logger.warning("Checkout validation failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        await db.rollback()
        logger.error("Checkout transaction error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process checkout transaction",
        )


@router.get(
    "/my-orders",
    response_model=list[ShopCheckoutResponse],
    summary="Get all orders for the authenticated customer",
    dependencies=[Depends(rate_limit)],
)
async def my_orders(
    db: AsyncSession = Depends(get_db),
    customer_id_str: str = Depends(get_current_customer),
):
    """Retrieve all orders placed by the currently authenticated customer."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.models import ShopOrder
    
    customer_id = uuid.UUID(customer_id_str)
    
    query = (
        select(ShopOrder)
        .where(ShopOrder.customer_id == customer_id)
        .order_by(ShopOrder.created_at.desc())
        .options(selectinload(ShopOrder.items))
    )
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # We map them to ShopCheckoutResponse format
    response = []
    for order in orders:
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
        
        from app.services.service import get_shop_order_readiness
        readiness = get_shop_order_readiness(order, order.items)
        
        response.append({
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
        })
    return response


@router.post(
    "/orders/track",
    response_model=ShopOrderTrackResponse,
    summary="Secure customer order tracking with contact verification",
    dependencies=[Depends(rate_limit)],
)
async def track_order(
    payload: ShopOrderTrackRequest,
    db: AsyncSession = Depends(get_db),
):
    """Securely look up public order tracking status with phone/email verification."""
    try:
        result = await track_shop_order(
            db=db,
            order_number=payload.order_number,
            verification_contact=payload.verification_contact,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/orders/{shop_order_number}",
    response_model=ShopCheckoutResponse,
    summary="Lookup customer shop order by order number",
    dependencies=[Depends(rate_limit)],
)
async def get_shop_order(
    shop_order_number: str,
    db: AsyncSession = Depends(get_db),
    customer_id_str: str | None = Depends(get_optional_customer),
):
    """Public customer order confirmation endpoint."""
    order = await get_shop_order_by_number(db=db, shop_order_number=shop_order_number)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shop order '{shop_order_number}' not found",
        )
    return order


@router.post(
    "/upload-logo",
    summary="Upload and validate custom brand logo image",
    dependencies=[Depends(rate_limit)],
)
async def upload_logo(file: UploadFile = File(...)):
    """Upload a business logo for card customization.

    Validates file size (max 2MB), MIME type (PNG/JPG/JPEG), and Pillow image headers.
    """
    if file.content_type not in ("image/png", "image/jpeg", "image/jpg"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only PNG, JPG, and JPEG image formats are allowed.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File size exceeds the maximum limit of 2MB.",
        )

    # Verify real image headers using PIL
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()
        ext = ".png" if file.content_type == "image/png" else ".jpg"
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid image file or corrupted headers.",
        )

    # Generate secure random filename
    filename = f"logo_{uuid.uuid4().hex[:12]}{ext}"
    target_path = UPLOAD_DIR / filename

    with open(target_path, "wb") as f:
        f.write(content)

    logo_url = f"/uploads/logos/{filename}"
    logger.info("Custom logo uploaded successfully: %s", logo_url)

    return {
        "logo_url": logo_url,
        "filename": filename,
        "size_bytes": len(content),
    }


@router.get(
    "/shipping-rules",
    response_model=list[ShippingRuleResponse],
    summary="Get active province shipping rules and courier availability",
)
async def list_shipping_rules(db: AsyncSession = Depends(get_db)):
    """Retrieve all available province shipping rules."""
    rules = await get_all_shipping_rules(db)
    return rules


@router.post(
    "/shipping-quote",
    response_model=ShippingQuoteResponse,
    summary="Calculate shipping cost and courier eligibility for a province",
)
async def calculate_shipping_quote(
    payload: ShippingQuoteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Calculate the shipping cost based on province and method."""
    try:
        quote = await calculate_order_shipping(
            db=db,
            province=payload.province,
            shipping_method=payload.shipping_method,
        )
        return quote
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

