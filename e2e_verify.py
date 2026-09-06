import httpx
import sys

API_KEY = "your-secure-api-key-here"
BASE_URL = "http://localhost:8300"
HEADERS = {"X-API-Key": API_KEY}

def run():
    print("Step 1 — Health")
    r = httpx.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("Health OK")

    print("Step 2 — Create Business")
    r = httpx.post(f"{BASE_URL}/api/v1/businesses", headers=HEADERS, json={"name": "E2E Test Business"})
    assert r.status_code == 201, f"Business creation failed: {r.text}"
    business_id = r.json()["id"]
    print(f"Business created: {business_id}")

    print("Step 3 — Create Destination")
    r = httpx.post(f"{BASE_URL}/api/v1/destinations", headers=HEADERS, json={
        "business_id": business_id,
        "type": "GOOGLE_REVIEW",
        "url": "https://g.page/r/demo/review"
    })
    assert r.status_code == 201, f"Destination creation failed: {r.text}"
    destination_id = r.json()["id"]
    print(f"Destination created: {destination_id}")

    print("Step 4 — Create Card")
    r = httpx.post(f"{BASE_URL}/api/v1/cards", headers=HEADERS, json={
        "business_id": business_id,
        "destination_id": destination_id
    })
    assert r.status_code == 201, f"Card creation failed: {r.text}"
    card = r.json()
    card_id = card["id"]
    code = card["code"]
    print(f"Card created: {card_id} with code {code}")

    print("Step 5 — Provisioning")
    r = httpx.get(f"{BASE_URL}/api/v1/cards/{card_id}/provisioning", headers=HEADERS)
    assert r.status_code == 200, f"Provisioning failed: {r.text}"
    prov = r.json()
    assert "/n/" in prov["nfc_url"]
    assert "/q/" in prov["qr_url"]
    assert "/qr.png" in prov["qr_image_url"]
    print("Provisioning OK")

    print("Step 6 — NFC Redirect")
    r = httpx.get(f"{BASE_URL}/n/{code}", follow_redirects=False)
    assert r.status_code == 302, f"NFC redirect failed: {r.text}"
    print("NFC Redirect OK")

    print("Step 7 — QR Redirect")
    r = httpx.get(f"{BASE_URL}/q/{code}", follow_redirects=False)
    assert r.status_code == 302, f"QR redirect failed: {r.text}"
    print("QR Redirect OK")

    print("Step 8 — QR Image")
    r = httpx.get(f"{BASE_URL}/q/{code}/qr.png")
    assert r.status_code == 200, f"QR Image failed: {r.text}"
    assert r.headers["content-type"] == "image/png"
    print("QR Image OK")

    print("Step 9 — Analytics")
    r = httpx.get(f"{BASE_URL}/api/v1/cards/{card_id}/analytics", headers=HEADERS)
    assert r.status_code == 200, f"Analytics failed: {r.text}"
    stats = r.json()
    assert stats["nfc"] >= 1
    assert stats["qr"] >= 1
    print("Analytics OK")

    print("Step 10 — Update Destination")
    r = httpx.patch(f"{BASE_URL}/api/v1/destinations/{destination_id}", headers=HEADERS, json={
        "url": "https://g.page/r/new/review"
    })
    assert r.status_code == 200
    r = httpx.get(f"{BASE_URL}/n/{code}", follow_redirects=False)
    assert r.status_code == 302
    assert r.headers["location"] == "https://g.page/r/new/review"
    print("Update Destination OK")

    print("Step 11 — QC Fields")
    r = httpx.patch(f"{BASE_URL}/api/v1/cards/{card_id}", headers=HEADERS, json={
        "qc_nfc_tested": True,
        "qc_qr_tested": True,
        "qc_destination_verified": True
    })
    assert r.status_code == 200
    assert r.json()["qc_nfc_tested"] is True
    print("QC Fields OK")

    print("Step 12 — Disable Card")
    r = httpx.patch(f"{BASE_URL}/api/v1/cards/{card_id}", headers=HEADERS, json={"status": "DISABLED"})
    assert r.status_code == 200
    r = httpx.get(f"{BASE_URL}/n/{code}", follow_redirects=False)
    assert r.status_code == 410, f"Expected 410, got {r.status_code}"
    print("Disable Card OK")

    print("Step 13 — Re-enable Card")
    r = httpx.patch(f"{BASE_URL}/api/v1/cards/{card_id}", headers=HEADERS, json={"status": "ACTIVE"})
    assert r.status_code == 200
    r = httpx.get(f"{BASE_URL}/n/{code}", follow_redirects=False)
    assert r.status_code == 302
    print("Re-enable Card OK")

    print("ALL VERIFICATIONS PASSED")

if __name__ == "__main__":
    run()
