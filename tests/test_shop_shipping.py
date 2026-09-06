"""Automated test suite for Smart Shipping Method Selection & Customer Notification System.

Covers:
- Postal shipping checkout (nationwide coverage)
- Tehran courier checkout (eligible Tehran addresses)
- Courier rejection for non-Tehran addresses (HTTP 422)
- Postal shipment fulfillment with tracking code & SMS generation
- Postal shipment rejection when tracking code is missing
- Courier shipment fulfillment without postal tracking code
- Centralized Persian SMS message formatting
- Duplicate SMS prevention on repeated shipment actions
- Public order tracking integration
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import ShopOrder, ShippingMethod, NotificationStatus
from app.services.service import is_tehran_eligible
from app.services.notifications import (
    build_postal_shipping_sms,
    build_courier_shipping_sms,
    MockSmsAdapter,
    NotificationService,
)


# ── Tehran Eligibility Unit Tests ──────────────────────────────────────

def test_is_tehran_eligible():
    """Verify Tehran courier eligibility checker across various input forms."""
    # Positive matches
    assert is_tehran_eligible("تهران") is True
    assert is_tehran_eligible("شهر تهران") is True
    assert is_tehran_eligible("Tehran") is True
    assert is_tehran_eligible("تهران بزرگ") is True
    assert is_tehran_eligible("تهران، منطقه ۱") is True
    assert is_tehran_eligible("تهران - سعادت آباد") is True
    assert is_tehran_eligible("tehran") is True

    # Negative matches (other provinces/cities)
    assert is_tehran_eligible("اصفهان") is False
    assert is_tehran_eligible("شیراز") is False
    assert is_tehran_eligible("مشهد") is False
    assert is_tehran_eligible("تبریز") is False
    assert is_tehran_eligible("کرج") is False
    assert is_tehran_eligible("Isfahan") is False
    assert is_tehran_eligible("") is False
    assert is_tehran_eligible(None) is False

    # Outer satellite towns in Tehran province (excluded from city courier)
    assert is_tehran_eligible("ورامین") is False
    assert is_tehran_eligible("شهریار") is False
    assert is_tehran_eligible("دماوند") is False
    assert is_tehran_eligible("اسلامشهر") is False
    assert is_tehran_eligible("پردیس") is False


# ── Message Template Unit Tests ─────────────────────────────────────────

def test_postal_shipping_sms_format():
    """Verify exact Persian postal SMS structure with tracking code and link."""
    msg = build_postal_shipping_sms(
        customer_name="علیرضا رضایی",
        order_number="SHOP-2026-0830-1234",
        shipping_date="1405/06/08 14:30",
        tracking_code="19395123456789012345",
        tracking_url="https://tracking.post.ir/?traking_code=19395123456789012345",
    )
    assert "علیرضا رضایی" in msg
    assert "SHOP-2026-0830-1234" in msg
    assert "19395123456789012345" in msg
    assert "https://tracking.post.ir/?traking_code=19395123456789012345" in msg
    assert "ارسال شد" in msg
    assert "TapNow" in msg


def test_courier_shipping_sms_format():
    """Verify exact Persian courier SMS structure without fake postal codes."""
    msg = build_courier_shipping_sms(
        customer_name="سارا محمدی",
        order_number="SHOP-2026-0830-5678",
        shipping_date="1405/06/08 15:00",
        courier_phone="09123456789",
    )
    assert "سارا محمدی" in msg
    assert "SHOP-2026-0830-5678" in msg
    assert "با پیک ارسال شده است" in msg
    assert "🛵" in msg
    assert "09123456789" in msg
    assert "کد رهگیری مرسوله" not in msg  # No fake postal tracking code
    assert "www.tapnow.ir" in msg


# ── API Integration Tests ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_postal_checkout_success(auth_client: AsyncClient):
    """Postal shipping checkout succeeds for any city in Iran."""
    payload = {
        "customer": {
            "name": "محسن اصفهانی",
            "email": "mohsen@example.com",
            "phone": "09131234567",
        },
        "shipping": {
            "address": "اصفهان، میدان انقلاب، خیابان کمال اسماعیل",
            "city": "اصفهان",
            "province": "اصفهان",
            "postal_code": "8146512345",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت نقد و بررسی هوشمند",
                "unit_price": 290000,
                "quantity": 1,
                "destination_configured": True,
                "destination_type": "GOOGLE_REVIEW",
                "destination_url": "https://g.page/r/sample/review",
            }
        ],
    }

    response = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["shipping_method"] == "POST"
    assert data["shipping_city"] == "اصفهان"
    assert data["shipping_notification_status"] == "NOT_SENT"
    assert data["status"] == "PLACED"


@pytest.mark.asyncio
async def test_tehran_courier_checkout_success(auth_client: AsyncClient):
    """Tehran Courier checkout succeeds for eligible Tehran address."""
    payload = {
        "customer": {
            "name": "علیرضا رضایی",
            "email": "alireza@example.com",
            "phone": "09123456789",
        },
        "shipping": {
            "address": "تهران، میدان ونک، خیابان ملاصدرا",
            "city": "تهران",
            "province": "تهران",
            "postal_code": "1994612345",
            "shipping_method": "COURIER",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند",
                "unit_price": 290000,
                "quantity": 2,
                "destination_configured": True,
                "destination_type": "GOOGLE_REVIEW",
                "destination_url": "https://g.page/r/sample/review",
            }
        ],
    }

    response = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["shipping_method"] == "COURIER"
    assert data["shipping_city"] == "تهران"
    assert data["shipping_notification_status"] == "NOT_SENT"


@pytest.mark.asyncio
async def test_courier_checkout_rejected_for_non_tehran(auth_client: AsyncClient):
    """Courier checkout is rejected with HTTP 422 for addresses outside Tehran."""
    payload = {
        "customer": {
            "name": "رضا حسینی",
            "email": "reza@example.com",
            "phone": "09171234567",
        },
        "shipping": {
            "address": "شیراز، خیابان زند، کوچه ۱۰",
            "city": "شیراز",
            "province": "فارس",
            "postal_code": "7134512345",
            "shipping_method": "COURIER",  # Ineligible for courier!
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند",
                "unit_price": 290000,
                "quantity": 1,
            }
        ],
    }

    response = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert response.status_code == 422
    err_detail = response.json().get("detail", "")
    assert "پیک" in err_detail


@pytest.mark.asyncio
async def test_province_shipping_rules_and_azerbaijan_courier_disabled(auth_client: AsyncClient, client: AsyncClient):
    """Verify province-based shipping rules API and Azerbaijan courier restriction."""
    # 1. Public list of shipping rules
    res = await auth_client.get("/api/v1/public/shop/shipping-rules")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 30
    
    # Verify East Azerbaijan and West Azerbaijan are present with courier disabled
    ea = next((r for r in rules if "آذربایجان شرقی" in r["province"]), None)
    assert ea is not None
    assert ea["courier_available"] is False
    assert ea["postal_price"] == 45000

    wa = next((r for r in rules if "آذربایجان غربی" in r["province"]), None)
    assert wa is not None
    assert wa["courier_available"] is False

    # 2. Shipping Quote for East Azerbaijan
    quote_res = await auth_client.post(
        "/api/v1/public/shop/shipping-quote",
        json={"province": "آذربایجان شرقی", "shipping_method": "POST"}
    )
    assert quote_res.status_code == 200
    q_data = quote_res.json()
    assert q_data["shipping_cost"] == 45000
    assert q_data["courier_available"] is False

    # 3. Courier attempt for Azerbaijan should fail
    courier_fail = await auth_client.post(
        "/api/v1/public/shop/shipping-quote",
        json={"province": "آذربایجان شرقی", "shipping_method": "COURIER"}
    )
    assert courier_fail.status_code == 422

    # 4. Admin update shipping rule
    admin_rules_res = await client.get("/api/v1/shop/shipping-rules")
    assert admin_rules_res.status_code == 200
    rule_id = ea["id"]
    update_res = await client.put(
        f"/api/v1/shop/shipping-rules/{rule_id}",
        json={"postal_price": 50000, "courier_available": False, "courier_price": 0, "active": True}
    )
    assert update_res.status_code == 200
    assert update_res.json()["postal_price"] == 50000




@pytest.mark.asyncio
async def test_admin_postal_shipment_workflow(auth_client: AsyncClient):
    """Admin postal fulfillment records tracking code, updates status to SHIPPED, and sends SMS."""
    # 1. Place a postal order
    payload = {
        "customer": {
            "name": "سارا محمدی",
            "email": "sara@example.com",
            "phone": "09121112233",
        },
        "shipping": {
            "address": "مشهد، بلوار سجاد",
            "city": "مشهد",
            "postal_code": "9186512345",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند",
                "unit_price": 290000,
                "quantity": 1,
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert create_res.status_code == 201
    order_data = create_res.json()
    order_num = order_data["shop_order_number"]
    item_id = order_data["items"][0]["id"]

    # Mark item production completed and link assigned to satisfy fulfillment readiness
    prod_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/production",
        json={"production_status": "COMPLETED"},
    )
    assert prod_res.status_code == 200
    link_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/link",
        json={"link_status": "ASSIGNED_TO_CARD"},
    )
    assert link_res.status_code == 200

    # 2. Attempt to ship without tracking code -> fails 422
    ship_fail = await auth_client.patch(
        f"/api/v1/shop-orders/{order_num}/ship",
        json={"tracking_code": ""},
    )
    assert ship_fail.status_code == 422

    # 3. Ship with valid tracking code -> succeeds
    tracking = "12345678901234567890"
    ship_res = await auth_client.patch(
        f"/api/v1/shop-orders/{order_num}/ship",
        json={"tracking_code": tracking},
    )
    assert ship_res.status_code == 200
    ship_data = ship_res.json()

    assert ship_data["status"] == "SHIPPED"
    assert ship_data["shipping_tracking_code"] == tracking
    assert ship_data["shipped_at"] is not None
    assert ship_data["shipping_notification_status"] == "SENT"
    assert ship_data["shipping_notification_sent_at"] is not None
    assert ship_data["shipping_notification_provider_ref"] is not None


@pytest.mark.asyncio
async def test_admin_courier_dispatch_workflow(auth_client: AsyncClient):
    """Admin courier dispatch succeeds without postal tracking code."""
    # 1. Place a Tehran courier order
    payload = {
        "customer": {
            "name": "کامران شایان",
            "email": "kamran@example.com",
            "phone": "09129998877",
        },
        "shipping": {
            "address": "تهران، خیابان شریعتی، بالاتر از پل رومی",
            "city": "تهران",
            "postal_code": "1939512345",
            "shipping_method": "COURIER",
        },
        "items": [
            {
                "product_type": "NFC_ONLY",
                "product_title": "کارت هوشمند NFC",
                "unit_price": 240000,
                "quantity": 1,
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert create_res.status_code == 201
    order_data = create_res.json()
    order_num = order_data["shop_order_number"]
    item_id = order_data["items"][0]["id"]

    # Mark item production completed and link assigned
    prod_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/production",
        json={"production_status": "COMPLETED"},
    )
    assert prod_res.status_code == 200
    link_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/link",
        json={"link_status": "ASSIGNED_TO_CARD"},
    )
    assert link_res.status_code == 200

    # 2. Ship without tracking code -> succeeds for courier!
    ship_res = await auth_client.patch(
        f"/api/v1/shop-orders/{order_num}/ship",
        json={"tracking_code": None},
    )
    assert ship_res.status_code == 200
    ship_data = ship_res.json()

    assert ship_data["status"] == "SHIPPED"
    assert ship_data["shipping_method"] == "COURIER"
    assert ship_data["shipping_notification_status"] == "SENT"


@pytest.mark.asyncio
async def test_duplicate_sms_protection(auth_client: AsyncClient):
    """Calling ship twice does not resend duplicate successful SMS."""
    # 1. Place postal order
    payload = {
        "customer": {
            "name": "مریم احمدی",
            "email": "maryam@example.com",
            "phone": "09125554433",
        },
        "shipping": {
            "address": "تبریز، خیابان آزادی",
            "city": "تبریز",
            "postal_code": "5134512345",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند",
                "unit_price": 290000,
                "quantity": 1,
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_data = create_res.json()
    order_num = order_data["shop_order_number"]
    item_id = order_data["items"][0]["id"]

    # Mark item production completed and link assigned
    prod_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/production",
        json={"production_status": "COMPLETED"},
    )
    assert prod_res.status_code == 200
    link_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/link",
        json={"link_status": "ASSIGNED_TO_CARD"},
    )
    assert link_res.status_code == 200

    # 2. First ship
    ship_1 = await auth_client.patch(
        f"/api/v1/shop-orders/{order_num}/ship",
        json={"tracking_code": "TRACK-111"},
    )
    assert ship_1.status_code == 200
    first_sent_at = ship_1.json()["shipping_notification_sent_at"]
    first_ref = ship_1.json()["shipping_notification_provider_ref"]

    # 3. Second ship (duplicate attempt)
    ship_2 = await auth_client.patch(
        f"/api/v1/shop-orders/{order_num}/ship",
        json={"tracking_code": "TRACK-111", "force_resend": False},
    )
    assert ship_2.status_code == 200
    assert ship_2.json()["shipping_notification_status"] == "SENT"
    assert ship_2.json()["shipping_notification_provider_ref"] == first_ref


@pytest.mark.asyncio
async def test_public_order_tracking_with_shipping_method(auth_client: AsyncClient):
    """Verify that public order tracking returns shipping method and dynamic courier vs post timeline."""
    payload = {
        "customer": {
            "name": "حمید کاظمی",
            "email": "hamid@example.com",
            "phone": "09127778899",
        },
        "shipping": {
            "address": "تهران، شهرک غرب",
            "city": "تهران",
            "postal_code": "1983912345",
            "shipping_method": "COURIER",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند",
                "unit_price": 290000,
                "quantity": 1,
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_num = create_res.json()["shop_order_number"]

    # Public tracking request
    track_res = await auth_client.post(
        "/api/v1/public/shop/orders/track",
        json={
            "order_number": order_num,
            "verification_contact": "09127778899",
        },
    )
    assert track_res.status_code == 200
    track_data = track_res.json()

    assert track_data["shipping_method"] == "COURIER"
    assert "پیک" in track_data["timeline"][3]["title_fa"]


# ── Scenario Regression Tests (Scenarios 1 to 6) ─────────────────────────

@pytest.mark.asyncio
async def test_scenario_1_normal_postal_shipping(auth_client: AsyncClient):
    """Scenario 1: Normal Postal Shipping calculates fee, adds to total, and creates order."""
    payload = {
        "customer": {
            "name": "محسن رضایی",
            "email": "mohsen.r@example.com",
            "phone": "09121112233",
        },
        "shipping": {
            "address": "اصفهان، خیابان چهارباغ عباسی",
            "city": "اصفهان",
            "province": "اصفهان",
            "postal_code": "8146512345",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند NFC و QR",
                "unit_price": 390000,
                "quantity": 2,
                "destination_configured": False,
            }
        ],
    }

    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert res.status_code == 201
    data = res.json()

    subtotal = 390000 * 2  # 780,000
    expected_shipping = 45000  # Default postal fee for Isfahan
    assert data["shipping_cost"] == expected_shipping
    assert data["total_amount"] == subtotal + expected_shipping
    assert data["status"] == "PLACED"


@pytest.mark.asyncio
async def test_scenario_2_province_courier_restriction(auth_client: AsyncClient):
    """Scenario 2: Province with courier restriction rejects COURIER delivery with 422."""
    payload = {
        "customer": {
            "name": "بابک تبریزی",
            "email": "babak@example.com",
            "phone": "09141112233",
        },
        "shipping": {
            "address": "تبریز، خیابان ارتش جنوبی",
            "city": "تبریز",
            "province": "آذربایجان شرقی",
            "postal_code": "5134512345",
            "shipping_method": "COURIER",
        },
        "items": [
            {
                "product_type": "NFC_ONLY",
                "product_title": "کارت نقد و بررسی",
                "unit_price": 340000,
                "quantity": 1,
            }
        ],
    }

    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert res.status_code == 422
    assert "پیک" in res.json()["detail"]


@pytest.mark.asyncio
async def test_scenario_3_admin_price_change_and_subsequent_order(auth_client: AsyncClient):
    """Scenario 3: Changing a province shipping price in Admin settings applies immediately to new checkouts."""
    # 1. Fetch rules to find Fars province
    rules_res = await auth_client.get("/api/v1/shop/shipping-rules")
    assert rules_res.status_code == 200
    rules = rules_res.json()
    fars_rule = next(r for r in rules if "فارس" in r["province"])

    # 2. Update Fars postal price from 45,000 to 55,000
    update_res = await auth_client.put(
        f"/api/v1/shop/shipping-rules/{fars_rule['id']}",
        json={
            "postal_price": 55000,
            "courier_available": False,
            "courier_price": 0,
            "active": True,
        },
    )
    assert update_res.status_code == 200
    assert update_res.json()["postal_price"] == 55000

    # 3. New checkout for Shiraz (Fars) uses the new 55,000 price
    payload = {
        "customer": {
            "name": "شیما شیرازی",
            "email": "shima@example.com",
            "phone": "09171112233",
        },
        "shipping": {
            "address": "شیراز، بلوار زند",
            "city": "شیراز",
            "province": "فارس",
            "postal_code": "7134512345",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_ONLY",
                "product_title": "کارت هوشمند",
                "unit_price": 340000,
                "quantity": 1,
            }
        ],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["shipping_cost"] == 55000
    assert data["total_amount"] == 340000 + 55000


@pytest.mark.asyncio
async def test_scenario_4_missing_or_invalid_province_fails_safely(auth_client: AsyncClient):
    """Scenario 4: Missing or invalid province fails safely and rejects checkout (no silent zero/fallback)."""
    payload = {
        "customer": {
            "name": "تست نامعتبر",
            "email": "invalid@example.com",
            "phone": "09120000000",
        },
        "shipping": {
            "address": "مکان نامشخص",
            "city": "ناکجاآباد",
            "province": "استان ناموجود در منظومه شمسی",
            "postal_code": "0000000000",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_ONLY",
                "product_title": "کارت",
                "unit_price": 340000,
                "quantity": 1,
            }
        ],
    }

    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert res.status_code == 422
    assert "یافت نشد" in res.json()["detail"]


@pytest.mark.asyncio
async def test_scenario_5_historical_orders_remain_immutable(auth_client: AsyncClient):
    """Scenario 5: Past orders retain their historical shipping_cost and total_amount even after rules change."""
    # 1. Place initial order for Mazandaran (default 45,000 postal)
    payload = {
        "customer": {
            "name": "رامین ساروی",
            "email": "ramin@example.com",
            "phone": "09111112233",
        },
        "shipping": {
            "address": "ساری، میدان شهدا",
            "city": "ساری",
            "province": "مازندران",
            "postal_code": "4814512345",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند",
                "unit_price": 390000,
                "quantity": 1,
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert create_res.status_code == 201
    order_num = create_res.json()["shop_order_number"]
    assert create_res.json()["shipping_cost"] == 45000
    assert create_res.json()["total_amount"] == 390000 + 45000

    # 2. Change Mazandaran shipping price to 70,000
    rules_res = await auth_client.get("/api/v1/shop/shipping-rules")
    rules = rules_res.json()
    maz_rule = next(r for r in rules if "مازندران" in r["province"])

    await auth_client.put(
        f"/api/v1/shop/shipping-rules/{maz_rule['id']}",
        json={
            "postal_price": 70000,
            "courier_available": False,
            "courier_price": 0,
            "active": True,
        },
    )

    # 3. Fetch past order and verify it is completely unchanged
    get_order_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert get_order_res.status_code == 200
    historical_order = get_order_res.json()
    assert historical_order["shipping_cost"] == 45000  # Original price preserved
    assert historical_order["total_amount"] == 390000 + 45000


@pytest.mark.asyncio
async def test_scenario_6_admin_negative_price_rejection(auth_client: AsyncClient):
    """Scenario 6: Admin settings reject negative prices with 422."""
    rules_res = await auth_client.get("/api/v1/shop/shipping-rules")
    rules = rules_res.json()
    rule_id = rules[0]["id"]

    bad_res = await auth_client.put(
        f"/api/v1/shop/shipping-rules/{rule_id}",
        json={
            "postal_price": -10000,
            "courier_available": False,
            "courier_price": 0,
            "active": True,
        },
    )
    assert bad_res.status_code == 422


@pytest.mark.asyncio
async def test_bulk_update_shipping_rules(auth_client: AsyncClient):
    """Verify bulk updating multiple province shipping rules in a single transaction."""
    rules_res = await auth_client.get("/api/v1/shop/shipping-rules")
    rules = rules_res.json()
    assert len(rules) >= 5
    target_ids = [r["id"] for r in rules[:5]]

    bulk_res = await auth_client.post(
        "/api/v1/shop/shipping-rules/bulk-update",
        json={
            "rule_ids": target_ids,
            "postal_price": 60000,
            "courier_available": False,
            "courier_price": 0,
            "active": True,
        },
    )
    assert bulk_res.status_code == 200
    updated_rules = bulk_res.json()
    assert len(updated_rules) == 5
    for r in updated_rules:
        assert r["postal_price"] == 60000
        assert r["courier_available"] is False


@pytest.mark.asyncio
async def test_checkout_with_expired_or_invalid_token_falls_back_gracefully(auth_client: AsyncClient):
    """Guest checkout succeeds even if an invalid or expired Bearer token is provided in headers."""
    payload = {
        "customer": {
            "name": "تست کاربر",
            "email": "test@example.com",
            "phone": "09123456789",
        },
        "shipping": {
            "address": "تهران، خیابان ولیعصر",
            "city": "تهران",
            "province": "تهران",
            "postal_code": "1234567890",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_ONLY",
                "product_title": "کارت هوشمند",
                "unit_price": 290000,
                "quantity": 1,
            }
        ],
    }

    # Pass an invalid Bearer token
    res = await auth_client.post(
        "/api/v1/public/shop/checkout",
        json=payload,
        headers={"Authorization": "Bearer invalid_or_expired_jwt_token_here"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["shop_order_number"].startswith("SHOP-")


@pytest.mark.asyncio
async def test_all_31_iranian_provinces_seeded_and_active(auth_client: AsyncClient):
    """Verify that all 31 standard Iranian provinces exist and have active shipping rules."""
    from app.services.service import DEFAULT_PROVINCE_RULES
    assert len(DEFAULT_PROVINCE_RULES) == 31

    rules_res = await auth_client.get("/api/v1/shop/shipping-rules")
    assert rules_res.status_code == 200
    rules = rules_res.json()
    assert len(rules) >= 31

    provinces_in_db = {r["province"] for r in rules}
    for item in DEFAULT_PROVINCE_RULES:
        assert item["province"] in provinces_in_db


@pytest.mark.asyncio
async def test_province_normalization_variants(auth_client: AsyncClient):
    """Verify that province normalization correctly matches variants with zero-width characters, prefixes, etc."""
    variants = [
        ("تهران", 35000),
        (" استان تهران ", 35000),
        ("خراسان\u200cرضوی", 45000),
        ("خراسان رضوی", 45000),
        ("آذربايجان شرقي", 45000),
        ("چهارمحال و بختیاری", 45000),
        ("چهارمحال وبختیاری", 45000),
    ]
    for prov_name, expected_postal in variants:
        res = await auth_client.post(
            "/api/v1/public/shop/shipping-quote",
            json={"province": prov_name, "shipping_method": "POST"},
        )
        assert res.status_code == 200, f"Failed for variant: {prov_name}"
        data = res.json()
        assert data["postal_price"] == expected_postal
        assert data["shipping_cost"] == expected_postal


@pytest.mark.asyncio
async def test_bulk_update_fixed_and_percentage_adjustments(auth_client: AsyncClient):
    """Verify fixed amount (+10k) and percentage (+10%) adjustments in bulk."""
    rules_res = await auth_client.get("/api/v1/shop/shipping-rules")
    rules = rules_res.json()
    rule_ids = [r["id"] for r in rules[:3]]

    # 1. Reset base to 50,000
    await auth_client.post(
        "/api/v1/shop/shipping-rules/bulk-update",
        json={"rule_ids": rule_ids, "postal_price": 50000},
    )

    # 2. Apply Fixed +15,000
    fixed_res = await auth_client.post(
        "/api/v1/shop/shipping-rules/bulk-update",
        json={"rule_ids": rule_ids, "price_adjustment_amount": 15000},
    )
    assert fixed_res.status_code == 200
    for r in fixed_res.json():
        assert r["postal_price"] == 65000

    # 3. Apply Percentage +10% (65,000 * 1.1 = 71,500)
    pct_res = await auth_client.post(
        "/api/v1/shop/shipping-rules/bulk-update",
        json={"rule_ids": rule_ids, "price_adjustment_percentage": 10.0},
    )
    assert pct_res.status_code == 200
    for r in pct_res.json():
        assert r["postal_price"] == 71500


@pytest.mark.asyncio
async def test_bulk_update_preserves_courier_settings(auth_client: AsyncClient):
    """Updating global postal shipping price MUST NOT modify courier availability or courier price."""
    # Find Tehran
    rules_res = await auth_client.get("/api/v1/shop/shipping-rules")
    rules = rules_res.json()
    tehran = next(r for r in rules if "تهران" in r["province"])
    all_ids = [r["id"] for r in rules]

    # Global Postal Update
    bulk_res = await auth_client.post(
        "/api/v1/shop/shipping-rules/bulk-update",
        json={"rule_ids": all_ids, "postal_price": 75000},
    )
    assert bulk_res.status_code == 200

    # Verify Tehran courier remained intact
    updated_tehran = next(r for r in bulk_res.json() if r["id"] == tehran["id"])
    assert updated_tehran["postal_price"] == 75000
    assert updated_tehran["courier_available"] == tehran["courier_available"]
    assert updated_tehran["courier_price"] == tehran["courier_price"]




