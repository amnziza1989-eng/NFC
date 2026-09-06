"""Tests for Card Provisioning."""

import pytest
from httpx import AsyncClient

from app.models.models import Card

@pytest.mark.asyncio
async def test_card_provisioning_valid(client: AsyncClient, sample_card: Card):
    """GET /api/v1/cards/{id}/provisioning returns required info without secrets."""
    response = await client.get(f"/api/v1/cards/{sample_card.id}/provisioning")
    assert response.status_code == 200
    data = response.json()
    
    assert data["card_id"] == str(sample_card.id)
    assert data["card_code"] == sample_card.code
    assert "/n/" in data["nfc_url"]
    assert "/q/" in data["qr_url"]
    assert "/qr.png" in data["qr_image_url"]
    assert "business" in data
    assert "destination" in data
    assert "qc_nfc_tested" in data
    
    # Ensure no secrets leak
    assert "API_KEY" not in str(data)
    assert "DATABASE_URL" not in str(data)

@pytest.mark.asyncio
async def test_card_provisioning_unauth(client: AsyncClient, sample_card: Card):
    """Provisioning requires authentication."""
    del client.headers["X-API-Key"]
    response = await client.get(f"/api/v1/cards/{sample_card.id}/provisioning")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_card_provisioning_invalid_auth(client: AsyncClient, sample_card: Card):
    """Provisioning rejects invalid API Key."""
    response = await client.get(
        f"/api/v1/cards/{sample_card.id}/provisioning", 
        headers={"X-API-Key": "wrong-key"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_card_provisioning_unknown(client: AsyncClient):
    """Provisioning returns 404 for unknown card."""
    from uuid import uuid4
    response = await client.get(f"/api/v1/cards/{uuid4()}/provisioning")
    assert response.status_code == 404
