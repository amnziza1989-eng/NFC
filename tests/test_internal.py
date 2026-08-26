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


# ── Destination CRUD ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_destination(client: AsyncClient, sample_business: Business):
    """POST /api/v1/destinations → 201."""
    response = await client.post("/api/v1/destinations", json={
        "business_id": str(sample_business.id),
        "type": "GOOGLE_REVIEW",
        "url": "https://g.page/r/test/review",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "GOOGLE_REVIEW"
    assert data["url"] == "https://g.page/r/test/review"


@pytest.mark.asyncio
async def test_destination_url_validation_rejects_javascript(client: AsyncClient, sample_business: Business):
    """Destination URL must not allow javascript: scheme."""
    response = await client.post("/api/v1/destinations", json={
        "business_id": str(sample_business.id),
        "type": "GOOGLE_REVIEW",
        "url": "javascript:alert(1)",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_destination_url_validation_rejects_no_scheme(client: AsyncClient, sample_business: Business):
    """Destination URL must have a scheme."""
    response = await client.post("/api/v1/destinations", json={
        "business_id": str(sample_business.id),
        "type": "GOOGLE_REVIEW",
        "url": "not-a-url",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_destination_update(client: AsyncClient, sample_destination: Destination):
    """PATCH /api/v1/destinations/{id} — core Option B feature:
    change destination URL without changing the physical card."""
    new_url = "https://g.page/r/new-location/review"
    response = await client.patch(
        f"/api/v1/destinations/{sample_destination.id}",
        json={"url": new_url},
    )
    assert response.status_code == 200
    assert response.json()["url"] == new_url


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
        json={"url": new_url},
    )

    # Same card now redirects to new URL
    response = await client.get(f"/n/{sample_card.code}", follow_redirects=False)
    assert response.status_code == 302
    assert response.headers["location"] == new_url
