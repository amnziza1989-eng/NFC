"""PHASE 15 — MULTI-ITEM ONLINE SHOP LIVE INTEGRATION SUITE

Tests the complete customer shopping experience and its seamless integration
with the existing factory fulfillment, provisioning, and QC reconciliation engine.
"""

import sys
import urllib.request
import urllib.error
import json

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

def main():
    print("=== PHASE 15 MULTI-ITEM ONLINE SHOP VERIFICATION SUITE ===")

    # 1. Product Catalog
    print("\n[TEST 1] Testing Public Product Catalog (GET /api/v1/public/shop/products)...")
    status, data = request("GET", "/api/v1/public/shop/products")
    assert status == 200, f"Expected 200, got {status}"
    assert "products" in data and len(data["products"]) == 2
    print(f"✓ Catalog retrieved: {len(data['products'])} active card products available.")

    # 2. Multi-Item Checkout
    print("\n[TEST 2] Testing Multi-Item Checkout with Mixed Destinations (POST /api/v1/public/shop/checkout)...")
    checkout_payload = {
        "customer": {
            "name": "مریم احمدی",
            "email": "maryam@example.com",
            "phone": "09129876543",
            "company_name": "کلینیک دندانپزشکی مهر",
        },
        "shipping": {
            "address": "تهران، خیابان پاسداران، بوستان دوم، پلاک ۴۰",
            "city": "تهران",
            "postal_code": "1665412345",
            "notes": "طبقه سوم واحد ۵",
        },
        "items": [
            {
                "product_type": "NFC_QR",
                "product_title": "کارت هوشمند نقد و بررسی (NFC + QR)",
                "unit_price": 290000,
                "quantity": 2,
                "destination_configured": True,
                "destination_type": "GOOGLE_REVIEW",
                "destination_url": "https://g.page/r/mehr-clinic/review",
            },
            {
                "product_type": "NFC_ONLY",
                "product_title": "کارت هوشمند اختصاصی (فقط NFC)",
                "unit_price": 240000,
                "quantity": 3,
                "destination_configured": False,
            },
        ],
    }

    status, checkout_res = request("POST", "/api/v1/public/shop/checkout", body=checkout_payload)
    assert status == 201, f"Expected 201, got {status}: {checkout_res}"
    shop_order_num = checkout_res["shop_order_number"]
    assert shop_order_num.startswith("SHOP-")
    assert checkout_res["total_amount"] == (2 * 290000) + (3 * 240000)  # 580,000 + 720,000 = 1,300,000
    assert checkout_res["payment_status"] == "MOCK_PAID"
    assert len(checkout_res["fulfillment_order_numbers"]) == 2
    fo_nums = checkout_res["fulfillment_order_numbers"]
    print(f"✓ Shop Order placed: {shop_order_num} | Total: {checkout_res['total_amount']} Toman | Payment: {checkout_res['payment_status']}")
    print(f"✓ Linked Factory Orders created: {fo_nums}")

    # 3. Public Order Tracking
    print("\n[TEST 3] Testing Public Order Lookup (GET /api/v1/public/shop/orders/{shop_order_number})...")
    status, lookup_res = request("GET", f"/api/v1/public/shop/orders/{shop_order_num}")
    assert status == 200, f"Expected 200, got {status}"
    assert lookup_res["shop_order_number"] == shop_order_num
    assert lookup_res["customer_name"] == "مریم احمدی"
    print(f"✓ Public Order Lookup verified: Found {len(lookup_res['items'])} items.")

    # 4. Factory Admin Order Inspection
    print("\n[TEST 4] Testing Factory Admin Access to Generated Orders...")
    admin_headers = {"X-API-Key": API_KEY}
    status, admin_orders = request("GET", "/api/v1/orders", headers=admin_headers)
    assert status == 200, f"Expected 200, got {status}"
    
    order_map = {o["order_number"]: o for o in admin_orders}
    assert fo_nums[0] in order_map, f"Factory order {fo_nums[0]} not found in admin orders"
    assert fo_nums[1] in order_map, f"Factory order {fo_nums[1]} not found in admin orders"
    
    factory_order_1 = order_map[fo_nums[0]]  # NFC_QR, qty 2
    factory_order_2 = order_map[fo_nums[1]]  # NFC_ONLY, qty 3
    assert factory_order_1["quantity"] == 2
    assert factory_order_2["quantity"] == 3
    print(f"✓ Both factory orders found in Admin: {fo_nums[0]} (NFC_QR, qty=2), {fo_nums[1]} (NFC_ONLY, qty=3)")

    # 5. Factory Card Generation for Shop Orders
    print("\n[TEST 5] Testing Factory Batch Card Generation on Shop Orders...")
    status, gen_res_1 = request("POST", f"/api/v1/orders/{factory_order_1['id']}/generate-cards", headers=admin_headers)
    assert status == 200, f"Expected 200, got {status}"
    assert gen_res_1["generated_count"] == 2
    card_codes_1 = [c["code"] for c in gen_res_1["cards"]]
    print(f"✓ Generated 2 cards for Order 1: {card_codes_1}")

    status, gen_res_2 = request("POST", f"/api/v1/orders/{factory_order_2['id']}/generate-cards", headers=admin_headers)
    assert status == 200, f"Expected 200, got {status}"
    assert gen_res_2["generated_count"] == 3
    card_codes_2 = [c["code"] for c in gen_res_2["cards"]]
    print(f"✓ Generated 3 cards for Order 2: {card_codes_2}")

    # 6. Physical Card Redirection (Destination-Now)
    print("\n[TEST 6] Testing Physical NFC/QR Redirect for Destination-Now Product...")
    card_code = card_codes_1[0]
    nfc_req = urllib.request.Request(f"{BASE_URL}/n/{card_code}")
    class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
        def http_error_302(self, req, fp, code, msg, headers):
            return headers
    opener = urllib.request.build_opener(NoRedirectHandler)
    headers_res = opener.open(nfc_req)
    redirect_loc = headers_res.get("Location")
    assert redirect_loc == "https://g.page/r/mehr-clinic/review", f"Unexpected redirect: {redirect_loc}"
    print(f"✓ NFC Tap redirect verified: Location={redirect_loc}")

    # 7. Physical Card Redirection (Destination-Later)
    print("\n[TEST 7] Testing Physical NFC Redirect for Destination-Later Product...")
    later_card_code = card_codes_2[0]
    nfc_req_later = urllib.request.Request(f"{BASE_URL}/n/{later_card_code}")
    headers_res_later = opener.open(nfc_req_later)
    later_loc = headers_res_later.get("Location")
    assert later_loc == "https://tapnow.ir/setup", f"Unexpected redirect: {later_loc}"
    print(f"✓ Destination-Later redirect verified: Location={later_loc}")

    # 8. QC Reconciliation & Completion Gate
    print("\n[TEST 8] Testing QC Reconciliation and Completion Gate on Shop Order...")
    status, recon = request("GET", f"/api/v1/orders/{factory_order_1['id']}/reconciliation", headers=admin_headers)
    assert status == 200
    assert not recon["is_ready_for_delivery"]
    print(f"✓ Order 1 not ready for delivery (QC pending: {recon['blocking_reasons']})")

    # Pass QC for cards
    for c in gen_res_1["cards"]:
        request("PATCH", f"/api/v1/cards/{c['id']}", body={
            "qc_nfc_tested": True,
            "qc_qr_tested": True,
            "qc_destination_verified": True
        }, headers=admin_headers)

    status, recon_after = request("GET", f"/api/v1/orders/{factory_order_1['id']}/reconciliation", headers=admin_headers)
    assert recon_after["is_ready_for_delivery"]
    
    # Complete order
    status, comp_res = request("PATCH", f"/api/v1/orders/{factory_order_1['id']}", body={"status": "COMPLETED"}, headers=admin_headers)
    assert status == 200 and comp_res["status"] == "COMPLETED"
    print(f"✓ Order 1 successfully marked COMPLETED through factory completion gate!")

    # 9. Negative Validation: Empty Cart
    print("\n[TEST 9] Testing Negative Validation: Empty Cart Submission...")
    bad_payload = checkout_payload.copy()
    bad_payload["items"] = []
    status, err_res = request("POST", "/api/v1/public/shop/checkout", body=bad_payload)
    assert status == 422, f"Expected 422, got {status}"
    print(f"✓ Negative Test Passed: Empty cart rejected with HTTP 422")

    # 10. Negative Validation: Invalid Scheme URL
    print("\n[TEST 10] Testing Negative Validation: Script URL in Destination...")
    bad_payload_2 = {
        "customer": {"name": "تست", "email": "t@t.com", "phone": "0912"},
        "shipping": {"address": "تهران", "city": "تهران", "postal_code": "123"},
        "items": [{
            "product_type": "NFC_QR",
            "product_title": "تست",
            "unit_price": 290000,
            "quantity": 1,
            "destination_configured": True,
            "destination_type": "CUSTOM_URL",
            "destination_url": "javascript:alert('pwned')",
        }]
    }
    status, err_res_2 = request("POST", "/api/v1/public/shop/checkout", body=bad_payload_2)
    assert status == 422, f"Expected 422, got {status}"
    print(f"✓ Negative Test Passed: Script URL rejected with HTTP 422")

    print("\n=============================================================")
    print("ALL PHASE 15 MULTI-ITEM SHOP INTEGRATION TESTS PASSED (10/10)!")
    print("=============================================================")

if __name__ == "__main__":
    main()
