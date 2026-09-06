"""Dedicated test suite for the 10 User-Specified Production, Link & Fulfillment Scenarios."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_scenario_1_customer_google_link_to_final_generation(auth_client: AsyncClient):
    """Scenario 1: Customer provides a Google link -> Review -> Confirm Final Link -> Internal Link Generated."""
    payload = {
        "customer": {"name": "کاربر گوگل مپ", "email": "gmap@example.com", "phone": "09121112233"},
        "shipping": {"address": "تهران، میدان آزادی", "city": "تهران", "postal_code": "1234567890", "shipping_method": "POST"},
        "items": [{
            "product_type": "NFC_QR",
            "product_title": "کارت گوگل ریویو",
            "unit_price": 290000,
            "quantity": 1,
            "destination_configured": True,
            "destination_type": "GOOGLE_REVIEW",
            "destination_url": "https://maps.google.com/?cid=11223344",
        }],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert res.status_code == 201
    order_data = res.json()
    order_num = order_data["shop_order_number"]
    item = order_data["items"][0]
    item_id = item["id"]

    # Initial state
    assert item["customer_submitted_url"] == "https://maps.google.com/?cid=11223344"
    assert len(item["cards"]) == 1
    assert item["cards"][0]["nfc_url"] is not None
    assert item["cards"][0]["qr_url"] is not None

    # Operator confirms final destination URL
    confirm_res = await auth_client.post(
        f"/api/v1/shop-order-items/{item_id}/confirm-link",
        json={"final_verified_url": "https://g.page/r/sample/review"},
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["link_status"] == "FINAL_GENERATED"

    # Order details reflects FINAL_GENERATED with generated internal link
    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert get_res.status_code == 200
    updated_item = get_res.json()["items"][0]
    assert updated_item["final_verified_url"] == "https://g.page/r/sample/review"
    assert updated_item["link_status"] in ("FINAL_GENERATED", "LINK_REVIEW_REQUIRED")


@pytest.mark.asyncio
async def test_scenario_2_customer_incorrect_link_corrected(auth_client: AsyncClient):
    """Scenario 2: Customer provides invalid/shortened link -> Operator replaces/corrects -> Confirm -> Final link."""
    payload = {
        "customer": {"name": "کاربر لینک اشتباه", "email": "wrong@example.com", "phone": "09121114455"},
        "shipping": {"address": "مشهد، بلوار سجاد", "city": "مشهد", "postal_code": "9998887776", "shipping_method": "POST"},
        "items": [{
            "product_type": "NFC_QR",
            "product_title": "کارت اصلاحی",
            "unit_price": 290000,
            "quantity": 1,
            "destination_configured": True,
            "destination_url": "https://maps.app.goo.gl/tempShortened",
        }],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_data = res.json()
    order_num = order_data["shop_order_number"]
    item_id = order_data["items"][0]["id"]

    # Operator corrects destination to canonical Google Business URL
    canonical_url = "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4"
    confirm_res = await auth_client.post(
        f"/api/v1/shop-order-items/{item_id}/confirm-link",
        json={"final_verified_url": canonical_url},
    )
    assert confirm_res.status_code == 200

    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    updated_item = get_res.json()["items"][0]
    assert updated_item["customer_submitted_url"] == "https://maps.app.goo.gl/tempShortened"
    assert updated_item["final_verified_url"] == canonical_url


@pytest.mark.asyncio
async def test_scenario_3_customer_no_link_operator_enters_destination(auth_client: AsyncClient):
    """Scenario 3: Customer provides no link (setup later) -> Operator enters destination -> Confirm."""
    payload = {
        "customer": {"name": "سفارش بدون لینک اولیه", "email": "nolink@example.com", "phone": "09121116677"},
        "shipping": {"address": "تهران، ونک", "city": "تهران", "postal_code": "1999999999", "shipping_method": "COURIER"},
        "items": [{
            "product_type": "NFC_ONLY",
            "product_title": "کارت بدون لینک اولیه",
            "unit_price": 240000,
            "quantity": 1,
            "destination_configured": False,
        }],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_data = res.json()
    order_num = order_data["shop_order_number"]
    item_id = order_data["items"][0]["id"]

    # Operator enters client's requested URL later
    operator_url = "https://instagram.com/mybusiness"
    confirm_res = await auth_client.post(
        f"/api/v1/shop-order-items/{item_id}/confirm-link",
        json={"final_verified_url": operator_url},
    )
    assert confirm_res.status_code == 200

    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert get_res.json()["items"][0]["final_verified_url"] == operator_url


@pytest.mark.asyncio
async def test_scenario_4_nfc_only_product_workflow(auth_client: AsyncClient):
    """Scenario 4: NFC-only product: QR test is N/A, requires NFC + destination test."""
    payload = {
        "customer": {"name": "کاربر فقط ان‌اف‌سی", "email": "nfc@example.com", "phone": "09121118899"},
        "shipping": {"address": "تبریز، آبرسان", "city": "تبریز", "postal_code": "5133344455", "shipping_method": "POST"},
        "items": [{
            "product_type": "NFC_ONLY",
            "product_title": "کارت ان‌اف‌سی خام",
            "unit_price": 240000,
            "quantity": 1,
            "destination_configured": True,
            "destination_url": "https://tapnow.ir/menu",
        }],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_data = res.json()
    order_num = order_data["shop_order_number"]
    item = order_data["items"][0]
    card_id = item["cards"][0]["id"]

    assert item["is_nfc_required"] is True
    assert item["is_qr_required"] is False

    # Confirm final link
    await auth_client.post(f"/api/v1/shop-order-items/{item['id']}/confirm-link", json={"final_verified_url": "https://tapnow.ir/menu"})

    # Perform NFC QC and Destination QC
    qc_res = await auth_client.patch(f"/api/v1/cards/{card_id}", json={
        "qc_nfc_tested": True,
        "qc_destination_verified": True,
    })
    assert qc_res.status_code == 200

    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    info = get_res.json()
    assert info["ready_to_ship"] is True
    assert info["fulfillment_status"] in ("READY_TO_SHIP", "COMPLETED")


@pytest.mark.asyncio
async def test_scenario_5_nfc_qr_product_workflow(auth_client: AsyncClient):
    """Scenario 5: NFC + QR product requires both NFC, QR, and Destination QC."""
    payload = {
        "customer": {"name": "کاربر ان‌اف‌سی و کیوآر", "email": "nfcqr@example.com", "phone": "09121119900"},
        "shipping": {"address": "تهران، پاسداران", "city": "تهران", "postal_code": "1666677777", "shipping_method": "COURIER"},
        "items": [{
            "product_type": "NFC_QR",
            "product_title": "کارت هوشمند تجاری",
            "unit_price": 290000,
            "quantity": 1,
            "destination_configured": True,
            "destination_url": "https://google.com/review",
        }],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_data = res.json()
    order_num = order_data["shop_order_number"]
    item = order_data["items"][0]
    card_id = item["cards"][0]["id"]

    assert item["is_nfc_required"] is True
    assert item["is_qr_required"] is True

    await auth_client.post(f"/api/v1/shop-order-items/{item['id']}/confirm-link", json={"final_verified_url": "https://google.com/review"})

    # Only NFC passed -> still not ready to ship
    await auth_client.patch(f"/api/v1/cards/{card_id}", json={"qc_nfc_tested": True})
    unready = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert unready.json()["ready_to_ship"] is False

    # Complete QR and Destination QC
    await auth_client.patch(f"/api/v1/cards/{card_id}", json={"qc_qr_tested": True, "qc_destination_verified": True})
    ready = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert ready.json()["ready_to_ship"] is True


@pytest.mark.asyncio
async def test_scenario_6_qr_only_product_workflow(auth_client: AsyncClient):
    """Scenario 6: QR-only product: NFC is N/A, requires QR + Destination QC."""
    payload = {
        "customer": {"name": "کاربر فقط کیوآر", "email": "qronly@example.com", "phone": "09121112211"},
        "shipping": {"address": "کرج، گوهردشت", "city": "کرج", "postal_code": "3144455566", "shipping_method": "POST"},
        "items": [{
            "product_type": "QR_ONLY",
            "product_title": "استند کیوآر رومیزی",
            "unit_price": 220000,
            "quantity": 1,
            "destination_configured": True,
            "destination_url": "https://tapnow.ir/stand",
        }],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_data = res.json()
    order_num = order_data["shop_order_number"]
    item = order_data["items"][0]
    card_id = item["cards"][0]["id"]

    assert item["is_nfc_required"] is False
    assert item["is_qr_required"] is True

    await auth_client.post(f"/api/v1/shop-order-items/{item['id']}/confirm-link", json={"final_verified_url": "https://tapnow.ir/stand"})

    # Perform QR test and Destination verification
    await auth_client.patch(f"/api/v1/cards/{card_id}", json={"qc_qr_tested": True, "qc_destination_verified": True})

    ready = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert ready.json()["ready_to_ship"] is True


@pytest.mark.asyncio
async def test_scenario_7_raw_card_explicit_confirmation(auth_client: AsyncClient):
    """Scenario 7: Truly raw/blank card requires explicit fulfillment confirmation."""
    payload = {
        "customer": {"name": "کاربر کارت خام", "email": "rawblank@example.com", "phone": "09121113322"},
        "shipping": {"address": "تهران، شهران", "city": "تهران", "postal_code": "1477788899", "shipping_method": "COURIER"},
        "items": [{
            "product_type": "RAW_CARD",
            "product_title": "کارت خام سفید بدون چاپ",
            "unit_price": 180000,
            "quantity": 1,
            "destination_configured": False,
        }],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_data = res.json()
    order_num = order_data["shop_order_number"]
    item_id = order_data["items"][0]["id"]

    # Initially paid but not produced/inspected -> NOT ready to ship
    initial = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert initial.json()["ready_to_ship"] is False

    # Operator confirms physical preparation & inspection
    await auth_client.patch(f"/api/v1/shop-order-items/{item_id}/production", json={"production_status": "COMPLETED"})

    # Now ready to ship
    after = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert after.json()["ready_to_ship"] is True


@pytest.mark.asyncio
async def test_scenario_8_and_9_multicard_partial_and_full_completion(auth_client: AsyncClient):
    """Scenarios 8 & 9: Multi-card item (3 cards): 2 complete -> NOT ready; all 3 complete -> READY."""
    payload = {
        "customer": {"name": "سفارش ۳ عددی", "email": "multi3@example.com", "phone": "09121114433"},
        "shipping": {"address": "یزد، میدان امیرچخماق", "city": "یزد", "postal_code": "8911122233", "shipping_method": "POST"},
        "items": [{
            "product_type": "NFC_ONLY",
            "product_title": "پک ۳ تایی کارت ان‌اف‌سی",
            "unit_price": 200000,
            "quantity": 3,
            "destination_configured": True,
            "destination_url": "https://tapnow.ir/pack",
        }],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_data = res.json()
    order_num = order_data["shop_order_number"]
    item = order_data["items"][0]
    cards = item["cards"]
    assert len(cards) == 3

    await auth_client.post(f"/api/v1/shop-order-items/{item['id']}/confirm-link", json={"final_verified_url": "https://tapnow.ir/pack"})

    # Pass QC for Card 1 and Card 2 only (Scenario 8)
    await auth_client.patch(f"/api/v1/cards/{cards[0]['id']}", json={"qc_nfc_tested": True, "qc_destination_verified": True})
    await auth_client.patch(f"/api/v1/cards/{cards[1]['id']}", json={"qc_nfc_tested": True, "qc_destination_verified": True})

    partial = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert partial.json()["ready_to_ship"] is False
    assert partial.json()["items"][0]["cards_completed_count"] == 2

    # Pass QC for Card 3 (Scenario 9)
    await auth_client.patch(f"/api/v1/cards/{cards[2]['id']}", json={"qc_nfc_tested": True, "qc_destination_verified": True})

    full = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert full.json()["ready_to_ship"] is True
    assert full.json()["items"][0]["cards_completed_count"] == 3


@pytest.mark.asyncio
async def test_scenario_10_paid_not_produced_state_separation(auth_client: AsyncClient):
    """Scenario 10: Payment = PAID does not mean READY TO SHIP (Fulfillment = AWAITING_PRODUCTION)."""
    payload = {
        "customer": {"name": "تست تفکیک پرداخت و ارسال", "email": "sep@example.com", "phone": "09121115544"},
        "shipping": {"address": "تهران، سعادت آباد", "city": "تهران", "postal_code": "1988877766", "shipping_method": "COURIER"},
        "items": [{
            "product_type": "NFC_QR",
            "product_title": "کارت تفکیک وضعیت",
            "unit_price": 290000,
            "quantity": 1,
            "destination_configured": True,
            "destination_url": "https://example.com/dest",
        }],
    }
    res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    order_num = res.json()["shop_order_number"]

    info = (await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")).json()

    assert info["payment_status"] in ("PAID", "MOCK_PAID")
    assert info["ready_to_ship"] is False
    assert info["fulfillment_status"] == "AWAITING_PRODUCTION"
