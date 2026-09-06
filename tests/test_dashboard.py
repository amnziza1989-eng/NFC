"""Tests for the dashboard overview API."""

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_dashboard_overview_unauth(client: AsyncClient):
    """Test dashboard overview without API key."""
    del client.headers["X-API-Key"]
    response = await client.get("/api/v1/dashboard/overview")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_dashboard_overview_invalid_auth(client: AsyncClient):
    """Test dashboard overview with invalid API key."""
    response = await client.get(
        "/api/v1/dashboard/overview",
        headers={"X-API-Key": "invalid_key"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_dashboard_overview_empty(client: AsyncClient):
    """Test dashboard overview with an empty database."""
    response = await client.get("/api/v1/dashboard/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_businesses"] == 0
    assert data["active_businesses"] == 0
    assert data["total_cards"] == 0
    assert data["active_cards"] == 0
    assert data["total_events"] == 0
    assert data["nfc_events"] == 0
    assert data["qr_events"] == 0

@pytest.mark.asyncio
async def test_dashboard_overview_with_data(client: AsyncClient, sample_card):
    """Test dashboard overview with some data in the database."""
    # Perform an NFC redirect to generate an event
    await client.get(f"/n/{sample_card.code}", follow_redirects=False)
    
    response = await client.get("/api/v1/dashboard/overview")
    assert response.status_code == 200
    data = response.json()
    
    # Assert counts reflect the sample data
    assert data["total_businesses"] >= 1
    assert data["active_businesses"] >= 1
    assert data["total_cards"] >= 1
    assert data["active_cards"] >= 1
    assert data["total_events"] >= 1
    assert data["nfc_events"] >= 1
    assert data["qr_events"] >= 0
