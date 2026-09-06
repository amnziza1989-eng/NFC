"""Unit and API tests for the Public Online Shop."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_shop_products(client: AsyncClient):
    """Verify that public shop products catalog returns valid items."""
    response = await client.get("/api/v1/public/shop/products")
    assert response.status_code == 200
    data = response.json()
    assert "products" in data
    assert len(data["products"]) == 3
    product_ids = [p["id"] for p in data["products"]]
    assert "card-nfc-qr" in product_ids
    assert "card-nfc-only" in product_ids
    assert "card-qr-only" in product_ids
    assert "stand-nfc-qr" not in product_ids


@pytest.mark.asyncio
async def test_shop_checkout_multi_item_success(auth_client: AsyncClient):
    """Verify multi-item checkout with mixed destination modes."""
    payload = {
        "customer": {
            "name": "سارا محمدی",
            "email": "sara@example.com",
            "phone": "09351112233",
            "company_name": "رستوران پردیس",
        },
        "shipping": {
            "address": "تهران، میدان ونک، خیابان گاندی، پلاک ۵",
            "city": "تهران",
            "postal_code": "1994612345",
            "notes": "تحویل در ساعات اداری",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند نقد و بررسی (NFC + QR)",
                "unit_price": 290000,
                "quantity": 3,
                "destination_configured": True,
                "destination_type": "GOOGLE_REVIEW",
                "destination_url": "https://g.page/r/sara-restaurant/review",
            },
            {
                "product_type": "NFC_ONLY",
                "product_title": "کارت هوشمند اختصاصی (فقط NFC)",
                "unit_price": 240000,
                "quantity": 2,
                "destination_configured": False,
            },
        ],
    }

    response = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["shop_order_number"].startswith("SHOP-")
    assert data["customer_name"] == "سارا محمدی"
    assert data["company_name"] == "رستوران پردیس"
    assert data["payment_status"] == "MOCK_PAID"
    assert data["shipping_cost"] == 35000
    assert data["total_amount"] == 3 * 290000 + 2 * 240000 + 35000  # 870,000 + 480,000 + 35,000 = 1,385,000
    assert len(data["items"]) == 2
    assert len(data["fulfillment_order_numbers"]) == 2

    # Lookup the created shop order
    order_num = data["shop_order_number"]
    get_res = await auth_client.get(f"/api/v1/public/shop/orders/{order_num}")
    assert get_res.status_code == 200
    order_info = get_res.json()
    assert order_info["shop_order_number"] == order_num
    assert order_info["total_amount"] == 1385000


@pytest.mark.asyncio
async def test_shop_checkout_empty_items_rejected(auth_client: AsyncClient):
    """Verify that checkout without items fails validation."""
    payload = {
        "customer": {
            "name": "تست کاربری",
            "email": "test@example.com",
            "phone": "09120000000",
        },
        "shipping": {
            "address": "تهران خیابان تست",
            "city": "تهران",
            "postal_code": "1234567890",
        },
        "items": [],
    }
    response = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_shop_checkout_invalid_destination_url_rejected(auth_client: AsyncClient):
    """Verify that invalid URL scheme is rejected."""
    payload = {
        "customer": {
            "name": "تست کاربری",
            "email": "test@example.com",
            "phone": "09120000000",
        },
        "shipping": {
            "address": "تهران خیابان تست",
            "city": "تهران",
            "postal_code": "1234567890",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت نقد و بررسی",
                "unit_price": 290000,
                "quantity": 1,
                "destination_configured": True,
                "destination_type": "CUSTOM_URL",
                "destination_url": "javascript:alert(1)",
            }
        ],
    }
    response = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_shop_order_not_found(client: AsyncClient):
    """Verify 404 for nonexistent shop order."""
    response = await client.get("/api/v1/public/shop/orders/SHOP-NONEXISTENT")
    assert response.status_code == 404
