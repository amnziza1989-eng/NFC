"""PHASE 15 STEP 5 — CUSTOMER LIFECYCLE COMPLETION LIVE INTEGRATION SUITE

Verifies:
1. Logo Upload & Validation Pipeline
2. Secure Public Order Tracking & Masking
3. Enumeration Protection on Order Tracking
4. Secure Self-Service Card Activation
5. Token Lifecycle & Single-Use Enforcement
6. Dynamic NFC & QR Redirection Update on Physical Cards
"""

import sys
import urllib.request
import urllib.error
import json
import io
from PIL import Image

BASE_URL = "http://127.0.0.1:8300"
API_KEY = "your-secure-api-key-here"

def request(method, path, body=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, {"detail": err_body}

def upload_file(path, filename, content, content_type):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    url = f"{BASE_URL}{path}"
    
    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode("utf-8"))
    body.write(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"))
    body.write(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.write(content)
    body.write(f"\r\n--{boundary}--\r\n".encode("utf-8"))
    
    data = body.getvalue()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, {"detail": err_body}

def main():
    print("=== PHASE 15 STEP 5: CUSTOMER LIFECYCLE LIVE INTEGRATION SUITE ===")

    # 1. Logo Upload Testing
    print("\n[TEST 1] Testing Brand Logo Upload & Binary Validation...")
    img = Image.new("RGBA", (120, 120), color=(15, 23, 42, 255))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    png_bytes = img_byte_arr.getvalue()

    status, upload_res = upload_file("/api/v1/public/shop/upload-logo", "brand_logo.png", png_bytes, "image/png")
    assert status == 200, f"Expected 200, got {status}: {upload_res}"
    assert "logo_url" in upload_res and upload_res["logo_url"].startswith("/uploads/logos/")
    uploaded_logo_url = upload_res["logo_url"]
    print(f"✓ Valid PNG Logo uploaded successfully: {uploaded_logo_url}")

    # Negative logo upload: Corrupted image or invalid MIME
    status, bad_upload = upload_file("/api/v1/public/shop/upload-logo", "script.py", b"print('hack')", "text/x-python")
    assert status == 422, f"Expected 422, got {status}"
    print(f"✓ Security Test Passed: Malicious file rejected with HTTP 422")

    # 2. Place Multi-Item Customized Order
    print("\n[TEST 2] Placing Multi-Item Customized Order with Mixed Destinations...")
    order_payload = {
        "customer": {
            "name": "کامران اکبری",
            "email": "kamran.akbari@example.com",
            "phone": "09127778899",
            "company_name": "رستوران سنتی شب‌های البرز",
        },
        "shipping": {
            "address": "کرج، عظیمیه، میدان اسبی، خیابان بوستان دوازدهم، پلاک ۱۸",
            "city": "کرج",
            "postal_code": "3145678901",
            "notes": "طبقه همکف",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت طلایی هوشمند (NFC + QR)",
                "unit_price": 290000,
                "quantity": 2,
                "destination_configured": True,
                "destination_type": "GOOGLE_REVIEW",
                "destination_url": "https://g.page/r/shabhaye-alborz/review",
                "customization_logo_url": uploaded_logo_url,
                "customization_color": "#B45309",
                "customization_template": "modern",
            },
            {
                "product_type": "NFC_ONLY",
                "product_title": "کارت بدون مقصد (تنظیم بعداً)",
                "unit_price": 240000,
                "quantity": 1,
                "destination_configured": False,
                "customization_color": "#0F172A",
                "customization_template": "minimal",
            },
        ],
    }

    status, checkout_res = request("POST", "/api/v1/public/shop/checkout", body=order_payload)
    assert status == 201, f"Expected 201, got {status}: {checkout_res}"
    shop_num = checkout_res["shop_order_number"]
    fo_nums = checkout_res["fulfillment_order_numbers"]
    print(f"✓ Shop Order placed: {shop_num} | Linked Factory Orders: {fo_nums}")

    # 3. Secure Order Tracking (Positive Case with Persian Phone digits)
    print("\n[TEST 3] Testing Secure Order Tracking with Persian Phone Digits...")
    status, track_res = request("POST", "/api/v1/public/shop/orders/track", body={
        "order_number": shop_num,
        "verification_contact": "۰۹۱۲۷۷۷۸۸۹۹",
    })
    assert status == 200, f"Expected 200, got {status}: {track_res}"
    assert track_res["shop_order_number"] == shop_num
    assert "***" in track_res["shipping_address_masked"]
    assert "***" in track_res["customer_name_masked"]
    assert len(track_res["items"]) == 2
    assert track_res["items"][0]["customization_color"] == "#B45309"
    assert track_res["items"][0]["customization_template"] == "modern"
    print(f"✓ Order Tracking verified: Masked Name='{track_res['customer_name_masked']}' | Timeline Steps={len(track_res['timeline'])}")

    # 4. Secure Order Tracking (Enumeration & Mismatch Protection)
    print("\n[TEST 4] Testing Order Tracking Enumeration & Contact Mismatch Protection...")
    # Wrong contact on real order
    status, err_track_1 = request("POST", "/api/v1/public/shop/orders/track", body={
        "order_number": shop_num,
        "verification_contact": "09120000000",
    })
    assert status == 404, f"Expected 404, got {status}"

    # Nonexistent order
    status, err_track_2 = request("POST", "/api/v1/public/shop/orders/track", body={
        "order_number": "SHOP-NONEXISTENT-XXXX",
        "verification_contact": "09127778899",
    })
    assert status == 404, f"Expected 404, got {status}"
    assert err_track_1["detail"] == err_track_2["detail"]
    print(f"✓ Enumeration Protection verified: Uniform generic 404 returned ({err_track_1['detail']})")

    # 5. Factory Card Generation for Destination-Later Item
    print("\n[TEST 5] Generating Factory Cards for Destination-Later Order...")
    admin_headers = {"X-API-Key": API_KEY}
    status, admin_orders = request("GET", "/api/v1/orders", headers=admin_headers)
    assert status == 200
    
    later_fo = next(o for o in admin_orders if o["order_number"] == fo_nums[1])
    status, gen_res = request("POST", f"/api/v1/orders/{later_fo['id']}/generate-cards", headers=admin_headers)
    assert status == 200 and gen_res["generated_count"] == 1
    later_card_code = gen_res["cards"][0]["code"]
    print(f"✓ Factory Card Generated: Code={later_card_code} (Destination: PENDING_SETUP)")

    # 6. Physical Card Redirection (Initial Pending State)
    print("\n[TEST 6] Verifying Initial Redirection to Setup Landing Page...")
    class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
        def http_error_302(self, req, fp, code, msg, headers):
            return headers
    opener = urllib.request.build_opener(NoRedirectHandler)
    
    init_loc = opener.open(urllib.request.Request(f"{BASE_URL}/n/{later_card_code}")).get("Location")
    assert init_loc == "https://tapnow.ir/setup", f"Expected setup URL, got {init_loc}"
    print(f"✓ Initial NFC Tap redirect verified: {init_loc}")

    # 7. Card Activation Verification (Step 1)
    print("\n[TEST 7] Testing Card Activation Verification (Proof of Ownership)...")
    status, verify_res = request("POST", "/api/v1/public/activation/verify", body={
        "card_code": later_card_code,
        "order_number": shop_num,
        "verification_contact": "09127778899",
    })
    assert status == 200, f"Expected 200, got {status}: {verify_res}"
    assert "activation_token" in verify_res and verify_res["activation_token"].startswith("act_")
    token = verify_res["activation_token"]
    print(f"✓ Ownership Verified: Issued Token={token[:16]}... (Expires in {verify_res['expires_in_seconds']}s)")

    # Negative activation verify (wrong contact)
    status, bad_verify = request("POST", "/api/v1/public/activation/verify", body={
        "card_code": later_card_code,
        "order_number": shop_num,
        "verification_contact": "09199999999",
    })
    assert status == 404, f"Expected 404, got {status}"
    print(f"✓ Security Test Passed: Unauthorized activation attempt rejected with HTTP 404")

    # 8. Card Activation Destination Configuration (Step 2)
    print("\n[TEST 8] Configuring Destination URL via Activation Token...")
    status, config_res = request("POST", "/api/v1/public/activation/configure", body={
        "activation_token": token,
        "destination_type": "GOOGLE_REVIEW",
        "destination_url": "https://g.page/r/shabhaye-alborz-branch2/review",
    })
    assert status == 200, f"Expected 200, got {status}: {config_res}"
    assert config_res["status"] == "activated"
    print(f"✓ Card Activated: Destination set to {config_res['destination_url']}")

    # 9. Token Re-Use Prevention (Single-Use Enforcement)
    print("\n[TEST 9] Testing Token Single-Use Security Enforcement...")
    status, reuse_err = request("POST", "/api/v1/public/activation/configure", body={
        "activation_token": token,
        "destination_type": "WEBSITE",
        "destination_url": "https://alborz-restaurant.com",
    })
    assert status == 422, f"Expected 422, got {status}"
    print(f"✓ Security Test Passed: Re-used activation token rejected with HTTP 422")

    # 10. Physical Card Dynamic Redirection Live Verification
    print("\n[TEST 10] Testing Live Physical NFC Redirection to Updated URL...")
    updated_loc = opener.open(urllib.request.Request(f"{BASE_URL}/n/{later_card_code}")).get("Location")
    assert updated_loc == "https://g.page/r/shabhaye-alborz-branch2/review", f"Unexpected redirect: {updated_loc}"
    print(f"✓ Dynamic Redirection Verified: Physical NFC card {later_card_code} now redirects to {updated_loc}")

    print("\n==================================================================")
    print("ALL PHASE 15 STEP 5 CUSTOMER LIFECYCLE TESTS PASSED (10/10)!")
    print("==================================================================")

if __name__ == "__main__":
    main()
