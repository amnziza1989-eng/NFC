"""Unit & API tests for Phase 15 Step 5: Customer Lifecycle Completion."""

import pytest
import io
from httpx import AsyncClient
from PIL import Image

pytestmark = pytest.mark.asyncio


async def test_order_tracking_success_and_masking(auth_client: AsyncClient):
    """Test that customer can track order with 2-factor contact proof, and sensitive info is masked."""
    # 1. Place checkout order
    payload = {
        "customer": {
            "name": "علیرضا رضایی",
            "email": "alireza.test@example.com",
            "phone": "09121112233",
            "company_name": "شرکت فناوری نوین",
        },
        "shipping": {
            "address": "تهران، خیابان آزادی، کوچه مروارید، پلاک ۱۲",
            "city": "تهران",
            "postal_code": "1455612345",
            "notes": "تحویل به لابی",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند نقد و بررسی",
                "unit_price": 290000,
                "quantity": 1,
                "destination_configured": True,
                "destination_type": "GOOGLE_REVIEW",
                "destination_url": "https://g.page/r/test-track/review",
                "customization_color": "#1E3A8A",
                "customization_template": "modern",
            }
        ],
    }
    checkout_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert checkout_res.status_code == 201
    shop_num = checkout_res.json()["shop_order_number"]

    # 2. Track with normalized mobile phone
    track_res = await auth_client.post("/api/v1/public/shop/orders/track", json={
        "order_number": shop_num,
        "verification_contact": "۰۹۱۲۱۱۱۲۲۳۳",  # Persian digits test
    })
    assert track_res.status_code == 200
    data = track_res.json()
    assert data["shop_order_number"] == shop_num
    assert data["status"] == "PLACED"
    assert data["shipping_city"] == "تهران"
    assert "***" in data["shipping_address_masked"]
    assert "***" in data["customer_name_masked"]
    assert len(data["items"]) == 1
    assert data["items"][0]["customization_color"] == "#1E3A8A"
    assert data["items"][0]["customization_template"] == "modern"
    assert len(data["timeline"]) == 4

    # 3. Track with email
    track_res_email = await auth_client.post("/api/v1/public/shop/orders/track", json={
        "order_number": shop_num,
        "verification_contact": "alireza.test@example.com",
    })
    assert track_res_email.status_code == 200


async def test_order_tracking_enumeration_protection(auth_client: AsyncClient):
    """Test that nonexistent order or wrong contact return the same generic 404 without leaking info."""
    # Nonexistent order
    res1 = await auth_client.post("/api/v1/public/shop/orders/track", json={
        "order_number": "SHOP-NONEXISTENT-999",
        "verification_contact": "09120000000",
    })
    assert res1.status_code == 404

    # Existing order with wrong phone
    payload = {
        "customer": {"name": "تست", "email": "a@b.com", "phone": "09123334455"},
        "shipping": {"address": "تهران", "city": "تهران", "postal_code": "123"},
        "items": [{
            "product_type": "NFC_ONLY",
            "product_title": "کارت",
            "unit_price": 240000,
            "quantity": 1,
            "destination_configured": False,
        }],
    }
    c_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    shop_num = c_res.json()["shop_order_number"]

    res2 = await auth_client.post("/api/v1/public/shop/orders/track", json={
        "order_number": shop_num,
        "verification_contact": "09129999999",  # Wrong contact
    })
    assert res2.status_code == 404
    assert res1.json()["detail"] == res2.json()["detail"]


async def test_logo_upload_validation(auth_client: AsyncClient):
    """Test logo upload file validation and Pillow image verification."""
    # Create valid PNG image in-memory
    img = Image.new("RGBA", (100, 100), color=(0, 100, 200, 255))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_bytes = img_byte_arr.getvalue()

    files = {"file": ("logo.png", img_bytes, "image/png")}
    upload_res = await auth_client.post("/api/v1/public/shop/upload-logo", files=files)
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert data["logo_url"].startswith("/uploads/logos/")
    assert data["filename"].endswith(".png")

    # Invalid MIME type rejection
    bad_files = {"file": ("script.js", b"console.log('pwned')", "text/javascript")}
    bad_res = await auth_client.post("/api/v1/public/shop/upload-logo", files=bad_files)
    assert bad_res.status_code == 422


async def test_card_activation_lifecycle(auth_client: AsyncClient):
    """Test full self-service card activation workflow for destination-later purchases."""
    # 1. Purchase destination-later card
    payload = {
        "customer": {
            "name": "سارا محمدی",
            "email": "sara.m@example.com",
            "phone": "09351234567",
        },
        "shipping": {
            "address": "اصفهان، چهارباغ عباسی",
            "city": "اصفهان",
            "postal_code": "8134567890",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت خام هوشمند",
                "unit_price": 290000,
                "quantity": 1,
                "destination_configured": False,
            }
        ],
    }
    c_res = await auth_client.post("/api/v1/public/shop/checkout", json=payload)
    assert c_res.status_code == 201
    shop_num = c_res.json()["shop_order_number"]
    fo_num = c_res.json()["fulfillment_order_numbers"][0]

    # 2. Factory admin generates digital cards for this order
    headers = {"X-API-Key": "test-api-key"}
    admin_orders = (await auth_client.get("/api/v1/orders", headers=headers)).json()
    target_fo = next(o for o in admin_orders if o["order_number"] == fo_num)

    gen_res = await auth_client.post(f"/api/v1/orders/{target_fo['id']}/generate-cards", headers=headers)
    assert gen_res.status_code == 200
    card_code = gen_res.json()["cards"][0]["code"]

    # 3. Customer activates card via self-service portal
    verify_res = await auth_client.post("/api/v1/public/activation/verify", json={
        "card_code": card_code,
        "order_number": shop_num,
        "verification_contact": "09351234567",
    })
    assert verify_res.status_code == 200
    token = verify_res.json()["activation_token"]
    assert token.startswith("act_")

    # Wrong contact fails
    bad_verify = await auth_client.post("/api/v1/public/activation/verify", json={
        "card_code": card_code,
        "order_number": shop_num,
        "verification_contact": "09120000000",
    })
    assert bad_verify.status_code == 404

    # 4. Configure Destination URL using the token
    config_res = await auth_client.post("/api/v1/public/activation/configure", json={
        "activation_token": token,
        "destination_type": "GOOGLE_REVIEW",
        "destination_url": "https://g.page/r/sara-cafe/review",
    })
    assert config_res.status_code == 200
    assert config_res.json()["status"] == "activated"

    # 5. Token is now consumed (single-use)
    reused_res = await auth_client.post("/api/v1/public/activation/configure", json={
        "activation_token": token,
        "destination_type": "INSTAGRAM",
        "destination_url": "https://instagram.com/sara_cafe",
    })
    assert reused_res.status_code == 422

    # 6. Physical Card Redirection now redirects to the configured Google Review link
    redirect_res = await auth_client.get(f"/n/{card_code}", follow_redirects=False)
    assert redirect_res.status_code == 302
    assert redirect_res.headers["location"] == "https://g.page/r/sara-cafe/review"
