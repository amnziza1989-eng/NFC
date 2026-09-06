"""Tests for internal management API endpoints."""

import uuid
import pytest
from httpx import AsyncClient

from app.models.models import Business, Card, Destination


# ── Business CRUD ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_business(client: AsyncClient):
    """POST /api/v1/businesses → 201."""
    response = await client.post("/api/v1/businesses", json={
        "name": "Test Restaurant",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Restaurant"
    assert data["status"] == "ACTIVE"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_businesses(client: AsyncClient, sample_business: Business):
    """GET /api/v1/businesses → list."""
    response = await client.get("/api/v1/businesses")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_business(client: AsyncClient, sample_business: Business):
    """GET /api/v1/businesses/{id} → 200."""
    response = await client.get(f"/api/v1/businesses/{sample_business.id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Demo Cafe"


@pytest.mark.asyncio
async def test_update_business(client: AsyncClient, sample_business: Business):
    """PATCH /api/v1/businesses/{id} → updated."""
    response = await client.patch(
        f"/api/v1/businesses/{sample_business.id}",
        json={"name": "Updated Cafe"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Cafe"


# ── Business Logo URL Validation (Phase 10) ──────────────────────────

@pytest.mark.asyncio
async def test_create_business_valid_https_logo_url(client: AsyncClient):
    """Business creation accepts valid HTTPS logo URL."""
    res = await client.post("/api/v1/businesses", json={
        "name": "HTTPS Logo Biz",
        "logo_url": "https://example.com/logo.png",
    })
    assert res.status_code == 201
    assert res.json()["logo_url"] == "https://example.com/logo.png"


@pytest.mark.asyncio
async def test_create_business_valid_http_logo_url(client: AsyncClient):
    """Business creation accepts valid HTTP logo URL."""
    res = await client.post("/api/v1/businesses", json={
        "name": "HTTP Logo Biz",
        "logo_url": "http://example.com/logo.png",
    })
    assert res.status_code == 201
    assert res.json()["logo_url"] == "http://example.com/logo.png"


@pytest.mark.asyncio
async def test_create_business_rejects_javascript_logo_url(client: AsyncClient):
    """Business creation rejects javascript: scheme with HTTP 422."""
    res = await client.post("/api/v1/businesses", json={
        "name": "XSS Logo Biz",
        "logo_url": "javascript:alert(1)",
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_business_rejects_plain_string_logo_url(client: AsyncClient):
    """Business creation rejects plain non-URL strings with HTTP 422."""
    res = await client.post("/api/v1/businesses", json={
        "name": "Invalid Logo Biz",
        "logo_url": "not-a-url",
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_business_rejects_ftp_logo_url(client: AsyncClient):
    """Business creation rejects ftp: scheme with HTTP 422."""
    res = await client.post("/api/v1/businesses", json={
        "name": "FTP Logo Biz",
        "logo_url": "ftp://example.com/logo.png",
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_update_business_logo_url_validation(client: AsyncClient, sample_business: Business):
    """Business update validates logo_url."""
    # Reject invalid scheme
    res = await client.patch(
        f"/api/v1/businesses/{sample_business.id}",
        json={"logo_url": "javascript:alert(1)"},
    )
    assert res.status_code == 422

    # Accept valid URL
    res = await client.patch(
        f"/api/v1/businesses/{sample_business.id}",
        json={"logo_url": "https://example.com/updated_logo.png"},
    )
    assert res.status_code == 200
    assert res.json()["logo_url"] == "https://example.com/updated_logo.png"


# ── Destination CRUD ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_destination(client: AsyncClient, sample_business: Business):
    """POST /api/v1/destinations → 201."""
    response = await client.post("/api/v1/destinations", json={
        "business_id": str(sample_business.id),
        "type": "GOOGLE_REVIEW",
        "source_url": "https://g.page/r/test/review",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "GOOGLE_REVIEW"
    assert data["source_url"] == "https://g.page/r/test/review"


@pytest.mark.asyncio
async def test_destination_url_validation_rejects_javascript(client: AsyncClient, sample_business: Business):
    """Destination URL must not allow javascript: scheme."""
    response = await client.post("/api/v1/destinations", json={
        "business_id": str(sample_business.id),
        "type": "GOOGLE_REVIEW",
        "source_url": "javascript:alert(1)",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_destination_url_validation_rejects_no_scheme(client: AsyncClient, sample_business: Business):
    """Destination URL must have a scheme."""
    response = await client.post("/api/v1/destinations", json={
        "business_id": str(sample_business.id),
        "type": "GOOGLE_REVIEW",
        "source_url": "not-a-url",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_destination_update(client: AsyncClient, sample_destination: Destination):
    """PATCH /api/v1/destinations/{id} — core Option B feature:
    change destination URL without changing the physical card."""
    new_url = "https://g.page/r/new-location/review"
    response = await client.patch(
        f"/api/v1/destinations/{sample_destination.id}",
        json={"source_url": new_url},
    )
    assert response.status_code == 200
    assert response.json()["source_url"] == new_url


# ── Card CRUD ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_card(
    client: AsyncClient,
    sample_business: Business,
    sample_destination: Destination,
):
    """POST /api/v1/cards → 201 with unique code."""
    response = await client.post("/api/v1/cards", json={
        "business_id": str(sample_business.id),
        "destination_id": str(sample_destination.id),
    })
    assert response.status_code == 201
    data = response.json()
    assert "code" in data
    assert len(data["code"]) == 8
    assert data["status"] == "ACTIVE"
    assert data["qc_nfc_tested"] is False
    assert data["qc_qr_tested"] is False
    assert data["qc_destination_verified"] is False


@pytest.mark.asyncio
async def test_update_card_qc(client: AsyncClient, sample_card: Card):
    """PATCH /api/v1/cards/{id} → updates QC fields."""
    response = await client.patch(
        f"/api/v1/cards/{sample_card.id}",
        json={
            "qc_nfc_tested": True,
            "qc_qr_tested": True,
            "qc_destination_verified": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["qc_nfc_tested"] is True
    assert data["qc_qr_tested"] is True
    assert data["qc_destination_verified"] is True


@pytest.mark.asyncio
async def test_disable_card(client: AsyncClient, sample_card: Card):
    """PATCH card status to DISABLED prevents redirect."""
    # Disable the card
    response = await client.patch(
        f"/api/v1/cards/{sample_card.id}",
        json={"status": "DISABLED"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "DISABLED"

    # Verify redirect fails
    response = await client.get(f"/n/{sample_card.code}", follow_redirects=False)
    assert response.status_code == 410


@pytest.mark.asyncio
async def test_card_info(client: AsyncClient, sample_card: Card):
    """GET /api/v1/cards/{id}/info → QC info with URLs."""
    response = await client.get(f"/api/v1/cards/{sample_card.id}/info")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == sample_card.code
    assert data["business_name"] == "Demo Cafe"
    assert "/n/" in data["nfc_url"]
    assert "/q/" in data["qr_url"]


# ── Destination Update + Redirect ──────────────────────────────────

@pytest.mark.asyncio
async def test_destination_change_affects_redirect(
    client: AsyncClient,
    sample_card: Card,
    sample_destination: Destination,
):
    """The core Option B test: changing destination URL changes where
    the card redirects, without changing the card itself."""
    # Initial redirect goes to original URL
    response = await client.get(f"/n/{sample_card.code}", follow_redirects=False)
    assert response.status_code == 302
    assert response.headers["location"] == "https://g.page/r/demo-cafe/review"

    # Update destination URL
    new_url = "https://g.page/r/moved-cafe/review"
    await client.patch(
        f"/api/v1/destinations/{sample_destination.id}",
        json={"source_url": new_url},
    )

    # Same card now redirects to new URL
    response = await client.get(f"/n/{sample_card.code}", follow_redirects=False)
    assert response.status_code == 302
    assert response.headers["location"] == new_url


# ── Search & Operational Filtering (Phase 6) ─────────────────────────

@pytest.mark.asyncio
async def test_business_search_and_status_filtering(client: AsyncClient):
    """Test business search and status filtering."""
    # Create test businesses
    b1_res = await client.post("/api/v1/businesses", json={"name": "Alpha Coffee Shop"})
    b1 = b1_res.json()
    b2_res = await client.post("/api/v1/businesses", json={"name": "Beta Bakery"})
    b2 = b2_res.json()
    b3_res = await client.post("/api/v1/businesses", json={"name": "Alpha Tech Hub"})
    b3 = b3_res.json()
    # Disable b3
    await client.patch(f"/api/v1/businesses/{b3['id']}", json={"status": "DISABLED"})

    # 1. No filter returns all
    res = await client.get("/api/v1/businesses")
    assert res.status_code == 200
    ids = [b["id"] for b in res.json()]
    assert b1["id"] in ids and b2["id"] in ids and b3["id"] in ids

    # 2. Case-insensitive substring search
    res = await client.get("/api/v1/businesses?search=alpha")
    assert res.status_code == 200
    names = [b["name"] for b in res.json()]
    assert "Alpha Coffee Shop" in names
    assert "Alpha Tech Hub" in names
    assert "Beta Bakery" not in names

    # 3. Status filter ACTIVE
    res = await client.get("/api/v1/businesses?status=ACTIVE")
    assert res.status_code == 200
    for b in res.json():
        assert b["status"] == "ACTIVE"
    active_ids = [b["id"] for b in res.json()]
    assert b1["id"] in active_ids and b2["id"] in active_ids
    assert b3["id"] not in active_ids

    # 4. Status filter DISABLED
    res = await client.get("/api/v1/businesses?status=DISABLED")
    assert res.status_code == 200
    for b in res.json():
        assert b["status"] == "DISABLED"
    disabled_ids = [b["id"] for b in res.json()]
    assert b3["id"] in disabled_ids

    # 5. Combined search + status (AND logic)
    res = await client.get("/api/v1/businesses?search=ALPHA&status=ACTIVE")
    assert res.status_code == 200
    names = [b["name"] for b in res.json()]
    assert "Alpha Coffee Shop" in names
    assert "Alpha Tech Hub" not in names
    assert "Beta Bakery" not in names

    # 6. Invalid status returns HTTP 422
    res = await client.get("/api/v1/businesses?status=UNKNOWN_STATUS")
    assert res.status_code == 422

    # 7. Pagination with filters
    res = await client.get("/api/v1/businesses?search=alpha&skip=0&limit=1")
    assert res.status_code == 200
    assert len(res.json()) == 1


@pytest.mark.asyncio
async def test_card_search_and_operational_filtering(client: AsyncClient, sample_business: Business, sample_destination: Destination):
    """Test card search, code filter, status filter, and destination_id filter."""
    # Create additional destination
    dest2_res = await client.post("/api/v1/destinations", json={
        "business_id": str(sample_business.id),
        "source_url": "https://g.page/r/dest2/review",
        "type": "GOOGLE_REVIEW",
    })
    dest2 = dest2_res.json()

    # Create cards
    c1_res = await client.post("/api/v1/cards", json={
        "business_id": str(sample_business.id),
        "destination_id": str(sample_destination.id),
    })
    c1 = c1_res.json()

    c2_res = await client.post("/api/v1/cards", json={
        "business_id": str(sample_business.id),
        "destination_id": str(dest2["id"]),
    })
    c2 = c2_res.json()

    # Disable c2
    await client.patch(f"/api/v1/cards/{c2['id']}", json={"status": "DISABLED"})

    # 1. Unfiltered list works
    res = await client.get("/api/v1/cards")
    assert res.status_code == 200
    ids = [c["id"] for c in res.json()]
    assert c1["id"] in ids and c2["id"] in ids

    # 2. code substring filter
    code_sub = c1["code"][:4]
    res = await client.get(f"/api/v1/cards?code={code_sub}")
    assert res.status_code == 200
    matching_codes = [c["code"] for c in res.json()]
    assert c1["code"] in matching_codes

    # 3. search substring filter (case-insensitive)
    res = await client.get(f"/api/v1/cards?search={c1['code'].upper()}")
    assert res.status_code == 200
    matching_codes = [c["code"] for c in res.json()]
    assert c1["code"] in matching_codes

    # 4. status=ACTIVE filter
    res = await client.get("/api/v1/cards?status=ACTIVE")
    assert res.status_code == 200
    for card in res.json():
        assert card["status"] == "ACTIVE"
    active_ids = [c["id"] for c in res.json()]
    assert c1["id"] in active_ids
    assert c2["id"] not in active_ids

    # 5. status=DISABLED filter
    res = await client.get("/api/v1/cards?status=DISABLED")
    assert res.status_code == 200
    for card in res.json():
        assert card["status"] == "DISABLED"
    disabled_ids = [c["id"] for c in res.json()]
    assert c2["id"] in disabled_ids

    # 6. destination_id filter
    res = await client.get(f"/api/v1/cards?destination_id={dest2['id']}")
    assert res.status_code == 200
    for card in res.json():
        assert card["destination_id"] == dest2["id"]
    dest2_card_ids = [c["id"] for c in res.json()]
    assert c2["id"] in dest2_card_ids
    assert c1["id"] not in dest2_card_ids

    # 7. business_id + status together
    res = await client.get(f"/api/v1/cards?business_id={sample_business.id}&status=DISABLED")
    assert res.status_code == 200
    card_ids = [c["id"] for c in res.json()]
    assert c2["id"] in card_ids
    assert c1["id"] not in card_ids

    # 8. business_id + destination_id together
    res = await client.get(f"/api/v1/cards?business_id={sample_business.id}&destination_id={dest2['id']}")
    assert res.status_code == 200
    card_ids = [c["id"] for c in res.json()]
    assert c2["id"] in card_ids

    # 9. code + search both apply deterministically (AND logic)
    res = await client.get(f"/api/v1/cards?code={c1['code']}&search={c1['code']}")
    assert res.status_code == 200
    assert c1["id"] in [c["id"] for c in res.json()]

    # Conflicting code and search returns empty list
    res = await client.get(f"/api/v1/cards?code={c1['code']}&search=nonexistentcode123")
    assert res.status_code == 200
    assert len(res.json()) == 0

    # 10. invalid status returns HTTP 422
    res = await client.get("/api/v1/cards?status=INVALID_STATUS")
    assert res.status_code == 422

    # 11. invalid destination_id returns HTTP 422
    res = await client.get("/api/v1/cards?destination_id=not-a-uuid")
    assert res.status_code == 422

    # 12. pagination remains correct after filtering
    res = await client.get(f"/api/v1/cards?business_id={sample_business.id}&skip=0&limit=1")
    assert res.status_code == 200
    assert len(res.json()) == 1


# ── Destination List & Filtering (Phase 7) ───────────────────────────

@pytest.mark.asyncio
async def test_list_destinations_and_filtering(client: AsyncClient, sample_business: Business):
    """Test GET /api/v1/destinations listing, filtering, pagination, and auth."""
    # Create second business
    b2_res = await client.post("/api/v1/businesses", json={"name": "Second Biz"})
    b2 = b2_res.json()

    # Create destinations
    d1_res = await client.post("/api/v1/destinations", json={
        "business_id": str(sample_business.id),
        "source_url": "https://g.page/r/d1/review",
        "type": "GOOGLE_REVIEW",
    })
    d1 = d1_res.json()

    d2_res = await client.post("/api/v1/destinations", json={
        "business_id": str(sample_business.id),
        "source_url": "https://g.page/r/d2/review",
        "type": "GOOGLE_REVIEW",
    })
    d2 = d2_res.json()

    d3_res = await client.post("/api/v1/destinations", json={
        "business_id": str(b2["id"]),
        "source_url": "https://g.page/r/d3/review",
        "type": "GOOGLE_REVIEW",
    })
    d3 = d3_res.json()

    # Disable d2
    await client.patch(f"/api/v1/destinations/{d2['id']}", json={"status": "DISABLED"})

    # 1. Unfiltered listing returns all created
    res = await client.get("/api/v1/destinations")
    assert res.status_code == 200
    dest_ids = [d["id"] for d in res.json()]
    assert d1["id"] in dest_ids and d2["id"] in dest_ids and d3["id"] in dest_ids

    # 2. Filter by business_id
    res = await client.get(f"/api/v1/destinations?business_id={sample_business.id}")
    assert res.status_code == 200
    for d in res.json():
        assert d["business_id"] == str(sample_business.id)
    b1_dest_ids = [d["id"] for d in res.json()]
    assert d1["id"] in b1_dest_ids and d2["id"] in b1_dest_ids
    assert d3["id"] not in b1_dest_ids

    # 3. Filter by status ACTIVE
    res = await client.get("/api/v1/destinations?status=ACTIVE")
    assert res.status_code == 200
    for d in res.json():
        assert d["status"] == "ACTIVE"
    active_ids = [d["id"] for d in res.json()]
    assert d1["id"] in active_ids and d3["id"] in active_ids
    assert d2["id"] not in active_ids

    # 4. Filter by status DISABLED
    res = await client.get("/api/v1/destinations?status=DISABLED")
    assert res.status_code == 200
    for d in res.json():
        assert d["status"] == "DISABLED"
    disabled_ids = [d["id"] for d in res.json()]
    assert d2["id"] in disabled_ids
    assert d1["id"] not in disabled_ids

    # 5. Filter by type
    res = await client.get("/api/v1/destinations?type=GOOGLE_REVIEW")
    assert res.status_code == 200
    for d in res.json():
        assert d["type"] == "GOOGLE_REVIEW"

    # 6. Combined business_id + status
    res = await client.get(f"/api/v1/destinations?business_id={sample_business.id}&status=ACTIVE")
    assert res.status_code == 200
    combined_ids = [d["id"] for d in res.json()]
    assert d1["id"] in combined_ids
    assert d2["id"] not in combined_ids
    assert d3["id"] not in combined_ids

    # 7. Invalid status returns HTTP 422
    res = await client.get("/api/v1/destinations?status=INVALID_STATUS")
    assert res.status_code == 422

    # 8. Invalid business_id returns HTTP 422
    res = await client.get("/api/v1/destinations?business_id=not-a-uuid")
    assert res.status_code == 422

    # 9. Pagination (skip, limit)
    res = await client.get(f"/api/v1/destinations?business_id={sample_business.id}&skip=0&limit=1")
    assert res.status_code == 200
    assert len(res.json()) == 1


@pytest.mark.asyncio
async def test_list_destinations_unauth(client: AsyncClient):
    """Test GET /api/v1/destinations requires authentication."""
    del client.headers["X-API-Key"]
    res = await client.get("/api/v1/destinations")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_order_lifecycle_and_reconciliation(client: AsyncClient, sample_business, sample_destination):
    """Test full order lifecycle, idempotent card generation, and packaging reconciliation."""
    # 1. Create Order
    order_payload = {
        "business_id": str(sample_business.id),
        "destination_id": str(sample_destination.id),
        "product_type": "NFC_QR",
        "quantity": 2,
    }
    res = await client.post("/api/v1/orders", json=order_payload)
    assert res.status_code == 201
    order = res.json()
    order_id = order["id"]
    assert order["product_type"] == "NFC_QR"
    assert order["quantity"] == 2
    assert order["status"] == "CREATED"

    # 2. Generate Cards (Idempotent)
    res = await client.post(f"/api/v1/orders/{order_id}/generate-cards")
    assert res.status_code == 200
    gen_data = res.json()
    assert gen_data["generated_count"] == 2
    assert len(gen_data["cards"]) == 2

    # Verify Orders List API consistency immediately after generation
    list_res = await client.get("/api/v1/orders")
    assert list_res.status_code == 200
    orders_list = list_res.json()
    target_in_list = next((o for o in orders_list if o["id"] == order_id), None)
    assert target_in_list is not None
    assert target_in_list["cards_generated_count"] == 2
    assert target_in_list["status"] == "CARDS_GENERATED"

    # Repeat generation (Idempotency check)
    res_repeat = await client.post(f"/api/v1/orders/{order_id}/generate-cards")
    assert res_repeat.status_code == 200
    assert res_repeat.json()["generated_count"] == 2

    # 3. Check Reconciliation (Incomplete QC -> NOT READY)
    res = await client.get(f"/api/v1/orders/{order_id}/reconciliation")
    assert res.status_code == 200
    recon = res.json()
    assert recon["ordered_quantity"] == 2
    assert recon["cards_generated_count"] == 2
    assert recon["is_ready_for_delivery"] is False
    assert len(recon["blocking_reasons"]) > 0

    # 4. Attempt premature COMPLETED update -> Expect HTTP 422
    res = await client.patch(f"/api/v1/orders/{order_id}", json={"status": "COMPLETED"})
    assert res.status_code == 422

    # 5. Fulfill QC for all cards
    cards = gen_data["cards"]
    for c in cards:
        patch_res = await client.patch(
            f"/api/v1/cards/{c['id']}",
            json={"qc_nfc_tested": True, "qc_qr_tested": True, "qc_destination_verified": True},
        )
        assert patch_res.status_code == 200

    # 6. Check Reconciliation (All QC passed -> READY FOR DELIVERY)
    res = await client.get(f"/api/v1/orders/{order_id}/reconciliation")
    assert res.status_code == 200
    recon_after = res.json()
    assert recon_after["is_ready_for_delivery"] is True
    assert len(recon_after["blocking_reasons"]) == 0

    # 7. Now transition to COMPLETED -> Expect 200
    res = await client.patch(f"/api/v1/orders/{order_id}", json={"status": "COMPLETED"})
    assert res.status_code == 200
    assert res.json()["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_order_csv_exports_and_labels(client: AsyncClient, sample_business, sample_destination):
    """Test batch CSV exports and QR label sheet payloads for NFC_ONLY and NFC_QR."""
    # Create NFC_ONLY Order
    nfc_payload = {
        "business_id": str(sample_business.id),
        "destination_id": str(sample_destination.id),
        "product_type": "NFC_ONLY",
        "quantity": 1,
    }
    res = await client.post("/api/v1/orders", json=nfc_payload)
    assert res.status_code == 201
    nfc_order_id = res.json()["id"]

    await client.post(f"/api/v1/orders/{nfc_order_id}/generate-cards")

    # Full Cards CSV
    res = await client.get(f"/api/v1/orders/{nfc_order_id}/export/cards.csv")
    assert res.status_code == 200
    assert "NFC Write URL" in res.text

    # NFC Provisioning CSV
    res = await client.get(f"/api/v1/orders/{nfc_order_id}/export/nfc.csv")
    assert res.status_code == 200
    assert "NFC Write URL" in res.text

    # QR CSV should be rejected for NFC_ONLY
    res = await client.get(f"/api/v1/orders/{nfc_order_id}/export/qr.csv")
    assert res.status_code == 422

    # QR Labels endpoint returns 0 for NFC_ONLY
    res = await client.get(f"/api/v1/orders/{nfc_order_id}/qr-labels")
    assert res.status_code == 200
    assert res.json()["total_labels"] == 0



