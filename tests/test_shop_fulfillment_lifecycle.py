"""Comprehensive test suite for the Online Shop Orders Fulfillment Lifecycle & Readiness Guardrails."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_scenario_1_paid_and_not_produced(auth_client: AsyncClient):
    """Scenario 1: Paid order where cards are NOT produced is NOT ready to ship."""
    payload = {
        "customer": {
            "name": "تست مرحله یک",
            "email": "stage1@example.com",
            "phone": "09121110001",
        },
        "shipping": {
            "address": "تهران، خیابان آزادی",
            "city": "تهران",
            "postal_code": "1111111111",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند NFC+QR",
                "unit_price": 290000,
                "quantity": 1,
                "destination_configured": True,
                "destination_type": "GOOGLE_REVIEW",
                "destination_url": "https://g.page/r/sample/review",
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert create_res.status_code == 201
    order_data = create_res.json()
    order_num = order_data["shop_order_number"]

    # Retrieve order status
    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert get_res.status_code == 200
    info = get_res.json()

    assert info["payment_status"] == "MOCK_PAID"
    assert info["ready_to_ship"] is False
    assert info["fulfillment_status"] in ("PENDING", "AWAITING_PRODUCTION")
    assert len(info["blocking_reasons"]) >= 1
    assert any("تولید" in r for r in info["blocking_reasons"])


@pytest.mark.asyncio
async def test_scenario_2_produced_but_unverified_link(auth_client: AsyncClient):
    """Scenario 2: Cards produced, but destination link is not verified/assigned."""
    payload = {
        "customer": {
            "name": "تست مرحله دو",
            "email": "stage2@example.com",
            "phone": "09121110002",
        },
        "shipping": {
            "address": "اصفهان، چهارباغ عباسی",
            "city": "اصفهان",
            "postal_code": "2222222222",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند رستوران",
                "unit_price": 290000,
                "quantity": 1,
                "destination_configured": True,
                "destination_type": "GOOGLE_REVIEW",
                "destination_url": "https://maps.app.goo.gl/shortened",
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert create_res.status_code == 201
    order_data = create_res.json()
    order_num = order_data["shop_order_number"]
    item_id = order_data["items"][0]["id"]

    # Mark production as COMPLETED
    prod_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/production",
        json={"production_status": "COMPLETED"},
    )
    assert prod_res.status_code == 200

    # Retrieve order status: still not ready to ship because link is CUSTOMER_SUBMITTED (unverified)
    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    info = get_res.json()

    assert info["ready_to_ship"] is False
    assert any("لینک" in r for r in info["blocking_reasons"])


@pytest.mark.asyncio
async def test_scenario_3_raw_cards_no_link_verification_needed(auth_client: AsyncClient):
    """Scenario 3: Raw cards (destination_configured=False) do not require link verification."""
    payload = {
        "customer": {
            "name": "تست کارت خام",
            "email": "raw@example.com",
            "phone": "09121110003",
        },
        "shipping": {
            "address": "شیراز، خیابان زند",
            "city": "شیراز",
            "postal_code": "3333333333",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_ONLY",
                "product_title": "کارت خام اختصاصی",
                "unit_price": 240000,
                "quantity": 2,
                "destination_configured": False,
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert create_res.status_code == 201
    order_data = create_res.json()
    order_num = order_data["shop_order_number"]
    item_id = order_data["items"][0]["id"]

    # Raw cards start with link_status = VERIFIED by default
    assert order_data["items"][0]["destination_configured"] is False

    # Mark production as COMPLETED
    prod_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/production",
        json={"production_status": "COMPLETED"},
    )
    assert prod_res.status_code == 200

    # Retrieve order: should immediately be ready to ship!
    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    info = get_res.json()

    assert info["ready_to_ship"] is True
    assert info["fulfillment_status"] in ("COMPLETED", "READY_TO_SHIP")
    assert len(info["blocking_reasons"]) == 0


@pytest.mark.asyncio
async def test_scenario_4_partial_completion(auth_client: AsyncClient):
    """Scenario 4: Multi-item order with 1 item completed and 1 item incomplete."""
    payload = {
        "customer": {
            "name": "تست سفارش ترکیبی",
            "email": "multi@example.com",
            "phone": "09121110004",
        },
        "shipping": {
            "address": "تهران، شهرک غرب",
            "city": "تهران",
            "postal_code": "4444444444",
            "shipping_method": "COURIER",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "محصول اول",
                "unit_price": 290000,
                "quantity": 1,
                "destination_configured": False,
            },
            {
                "product_type": "NFC_ONLY",
                "product_title": "محصول دوم",
                "unit_price": 240000,
                "quantity": 1,
                "destination_configured": False,
            },
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert create_res.status_code == 201
    order_data = create_res.json()
    order_num = order_data["shop_order_number"]
    item_1_id = order_data["items"][0]["id"]

    # Mark only item 1 as completed
    await auth_client.patch(
        f"/api/v1/shop-order-items/{item_1_id}/production",
        json={"production_status": "COMPLETED"},
    )

    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    info = get_res.json()

    assert info["fulfillment_status"] == "PARTIALLY_COMPLETED"
    assert info["ready_to_ship"] is False
    assert len(info["blocking_reasons"]) == 1
    assert "محصول دوم" in info["blocking_reasons"][0]


@pytest.mark.asyncio
async def test_scenario_5_full_fulfillment_workflow(auth_client: AsyncClient):
    """Scenario 5: Full workflow from placement to verified link and completed production."""
    payload = {
        "customer": {
            "name": "جریان کامل تولید",
            "email": "full@example.com",
            "phone": "09121110005",
        },
        "shipping": {
            "address": "تهران، میدان انقلاب",
            "city": "تهران",
            "postal_code": "5555555555",
            "shipping_method": "COURIER",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت منو دیجیتال",
                "unit_price": 290000,
                "quantity": 1,
                "destination_configured": True,
                "destination_type": "GOOGLE_REVIEW",
                "destination_url": "https://maps.google.com/?cid=12345",
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert create_res.status_code == 201
    order_data = create_res.json()
    order_num = order_data["shop_order_number"]
    item_id = order_data["items"][0]["id"]

    # Step 1: Operator verifies and updates final destination URL
    link_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/link",
        json={
            "link_status": "ASSIGNED_TO_CARD",
            "final_verified_url": "https://search.google.com/local/writereview?placeid=ChIJ123456",
        },
    )
    assert link_res.status_code == 200

    # Step 2: Production and QC completed
    prod_res = await auth_client.patch(
        f"/api/v1/shop-order-items/{item_id}/production",
        json={"production_status": "COMPLETED"},
    )
    assert prod_res.status_code == 200

    # Step 3: Verify order is ready to ship
    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    info = get_res.json()
    assert info["ready_to_ship"] is True
    assert info["fulfillment_status"] in ("COMPLETED", "READY_TO_SHIP")
    assert len(info["blocking_reasons"]) == 0

    # Step 4: Dispatch courier
    ship_res = await auth_client.patch(
        f"/api/v1/shop-orders/{order_num}/ship",
        json={"courier_phone": "09120001122"},
    )
    assert ship_res.status_code == 200
    ship_data = ship_res.json()
    assert ship_data["status"] == "SHIPPED"
    assert ship_data["shipping_notification_status"] == "SENT"


@pytest.mark.asyncio
async def test_scenario_6_premature_shipping_rejection(auth_client: AsyncClient):
    """Scenario 6: Attempting to ship an unready order must return HTTP 400 Bad Request."""
    payload = {
        "customer": {
            "name": "تست رد ارسال زودهنگام",
            "email": "premature@example.com",
            "phone": "09121110006",
        },
        "shipping": {
            "address": "کرج، مهرشهر",
            "city": "کرج",
            "postal_code": "6666666666",
            "shipping_method": "POST",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت خام نشده",
                "unit_price": 290000,
                "quantity": 1,
                "destination_configured": True,
                "destination_url": "https://example.com/unverified",
            }
        ],
    }
    create_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_num = create_res.json()["shop_order_number"]

    # Attempt to ship immediately -> MUST be rejected with HTTP 400
    ship_res = await auth_client.patch(
        f"/api/v1/shop-orders/{order_num}/ship",
        json={"tracking_code": "TRACK-PREMATURE-123"},
    )
    assert ship_res.status_code == 400
    detail = ship_res.json()["detail"]
    assert "سفارش آماده ارسال نیست" in str(detail)
    assert "reasons" in detail
    assert len(detail["reasons"]) > 0


@pytest.mark.asyncio
async def test_scenario_7_in_person_workflow_isolated(auth_client: AsyncClient):
    """Scenario 7: Ensure In-Person workflow (businesses, destinations, orders, cards) is untouched."""
    # 1. Create Business
    biz_res = await auth_client.post(
        "/api/v1/businesses",
        json={"name": "رستوران سنتی ارسباران"},
    )
    assert biz_res.status_code == 201
    biz_id = biz_res.json()["id"]

    # 2. Create Destination
    dest_res = await auth_client.post(
        "/api/v1/destinations",
        json={
            "business_id": biz_id,
            "type": "GOOGLE_REVIEW",
            "source_url": "https://maps.google.com/?cid=99999",
        },
    )
    assert dest_res.status_code == 201
    dest_id = dest_res.json()["id"]

    # 3. Create In-Person Order
    order_res = await auth_client.post(
        "/api/v1/orders",
        json={
            "business_id": biz_id,
            "destination_id": dest_id,
            "product_type": "NFC_QR",
            "quantity": 5,
        },
    )
    assert order_res.status_code == 201
    order_id = order_res.json()["id"]

    # 4. Generate Cards for In-Person Order
    cards_res = await auth_client.post(f"/api/v1/orders/{order_id}/generate-cards")
    assert cards_res.status_code == 200
    cards_data = cards_res.json()
    assert cards_data["generated_count"] == 5
