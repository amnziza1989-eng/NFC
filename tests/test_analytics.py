"""Tests for Card Analytics."""

import pytest
from httpx import AsyncClient

from app.models.models import Card

@pytest.mark.asyncio
async def test_card_analytics(client: AsyncClient, sample_card: Card):
    """Analytics counts NFC and QR events."""
    # Initially 0
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics")
    assert response.status_code == 200
    assert response.json()["total"] == 0
    
    # Trigger NFC
    await client.get(f"/n/{sample_card.code}", follow_redirects=False)
    
    # Trigger QR
    await client.get(f"/q/{sample_card.code}", follow_redirects=False)
    
    # Check again
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics")
    data = response.json()
    assert data["total"] == 2
    assert data["nfc"] == 1
    assert data["qr"] == 1
    assert len(data["recent"]) == 2

@pytest.mark.asyncio
async def test_card_analytics_unauth(client: AsyncClient, sample_card: Card):
    del client.headers["X-API-Key"]
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics")
    assert response.status_code == 401
    
@pytest.mark.asyncio
async def test_card_analytics_unknown(client: AsyncClient):
    from uuid import uuid4
    response = await client.get(f"/api/v1/cards/{uuid4()}/analytics")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_card_analytics_date_filtering(client: AsyncClient, sample_card: Card):
    """Analytics date filtering works correctly."""
    from datetime import datetime, timezone
    
    # Trigger NFC and QR
    await client.get(f"/n/{sample_card.code}", follow_redirects=False)
    await client.get(f"/q/{sample_card.code}", follow_redirects=False)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # 1. No filters
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics")
    assert response.status_code == 200
    assert response.json()["total"] == 2
    
    # 2. start_date only
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics?start_date={today}")
    assert response.status_code == 200
    assert response.json()["total"] == 2
    
    # 3. end_date only
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics?end_date={today}")
    assert response.status_code == 200
    assert response.json()["total"] == 2
    
    # 4. both start_date and end_date
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics?start_date={today}&end_date={today}")
    assert response.status_code == 200
    assert response.json()["total"] == 2
    
    # 5. Invalid date format
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics?start_date=invalid-date")
    assert response.status_code == 422
    
    # 6. start_date > end_date
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics?start_date=2099-01-01&end_date={today}")
    assert response.status_code == 422
    
    # 7. events outside range are excluded
    response = await client.get(f"/api/v1/cards/{sample_card.id}/analytics?start_date=2099-01-01")
    assert response.status_code == 200
    assert response.json()["total"] == 0


# ── Business-Level Aggregated Analytics (Phase 8) ────────────────────

@pytest.mark.asyncio
async def test_business_analytics(client: AsyncClient, sample_business, sample_destination):
    """Business analytics aggregates events and cards across the business."""
    # Create a second business with its own destination and card
    b2_res = await client.post("/api/v1/businesses", json={"name": "Other Biz"})
    b2 = b2_res.json()
    d2_res = await client.post("/api/v1/destinations", json={
        "business_id": b2["id"],
        "source_url": "https://g.page/r/other/review",
        "type": "GOOGLE_REVIEW",
    })
    d2 = d2_res.json()
    c_other_res = await client.post("/api/v1/cards", json={
        "business_id": b2["id"],
        "destination_id": d2["id"],
    })
    c_other = c_other_res.json()

    # Create 3 cards for sample_business: 2 ACTIVE, 1 DISABLED
    c1_res = await client.post("/api/v1/cards", json={
        "business_id": str(sample_business.id),
        "destination_id": str(sample_destination.id),
    })
    c1 = c1_res.json()

    c2_res = await client.post("/api/v1/cards", json={
        "business_id": str(sample_business.id),
        "destination_id": str(sample_destination.id),
    })
    c2 = c2_res.json()

    c3_res = await client.post("/api/v1/cards", json={
        "business_id": str(sample_business.id),
        "destination_id": str(sample_destination.id),
    })
    c3 = c3_res.json()
    await client.patch(f"/api/v1/cards/{c3['id']}", json={"status": "DISABLED"})

    # Trigger events on sample_business cards: 2 NFC + 1 QR
    await client.get(f"/n/{c1['code']}", follow_redirects=False)
    await client.get(f"/q/{c1['code']}", follow_redirects=False)
    await client.get(f"/n/{c2['code']}", follow_redirects=False)

    # Trigger events on other business card (must be excluded from sample_business analytics)
    await client.get(f"/n/{c_other['code']}", follow_redirects=False)

    # Fetch business analytics
    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics")
    assert res.status_code == 200
    data = res.json()

    assert data["total"] == 3
    assert data["nfc"] == 2
    assert data["qr"] == 1
    assert data["total_cards"] == 3
    assert data["active_cards"] == 2
    assert len(data["recent"]) == 3


@pytest.mark.asyncio
async def test_business_analytics_date_filtering(client: AsyncClient, sample_business, sample_destination):
    """Business analytics date filtering works correctly with inclusive/exclusive bounds."""
    from datetime import datetime, timezone

    c_res = await client.post("/api/v1/cards", json={
        "business_id": str(sample_business.id),
        "destination_id": str(sample_destination.id),
    })
    c = c_res.json()

    await client.get(f"/n/{c['code']}", follow_redirects=False)
    await client.get(f"/q/{c['code']}", follow_redirects=False)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 1. No filters
    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics")
    assert res.status_code == 200
    assert res.json()["total"] == 2

    # 2. start_date only
    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics?start_date={today}")
    assert res.status_code == 200
    assert res.json()["total"] == 2

    # 3. end_date only
    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics?end_date={today}")
    assert res.status_code == 200
    assert res.json()["total"] == 2

    # 4. both start_date and end_date
    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics?start_date={today}&end_date={today}")
    assert res.status_code == 200
    assert res.json()["total"] == 2

    # 5. Invalid date format returns HTTP 422
    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics?start_date=not-a-date")
    assert res.status_code == 422

    # 6. start_date > end_date returns HTTP 422
    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics?start_date=2099-01-01&end_date={today}")
    assert res.status_code == 422

    # 7. events outside range are excluded
    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics?start_date=2099-01-01")
    assert res.status_code == 200
    assert res.json()["total"] == 0


@pytest.mark.asyncio
async def test_business_analytics_unauth_and_unknown(client: AsyncClient, sample_business):
    """Business analytics authentication and 404 handling."""
    from uuid import uuid4

    # 401 when unauthorized
    del client.headers["X-API-Key"]
    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics")
    assert res.status_code == 401

    # 404 for unknown business
    client.headers["X-API-Key"] = "test-api-key"
    res = await client.get(f"/api/v1/businesses/{uuid4()}/analytics")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_business_analytics_recent_limit_and_order(client: AsyncClient, sample_business, sample_destination):
    """Recent events list is limited to 20 and ordered by created_at DESC."""
    c_res = await client.post("/api/v1/cards", json={
        "business_id": str(sample_business.id),
        "destination_id": str(sample_destination.id),
    })
    card = c_res.json()

    # Trigger 25 events
    for _ in range(25):
        await client.get(f"/n/{card['code']}", follow_redirects=False)

    res = await client.get(f"/api/v1/businesses/{sample_business.id}/analytics")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 25
    assert len(data["recent"]) == 20

    # Verify descending ordering by created_at
    recent_dates = [e["created_at"] for e in data["recent"]]
    assert recent_dates == sorted(recent_dates, reverse=True)


