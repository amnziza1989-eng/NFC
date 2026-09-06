"""Tests for QR Code generation."""

import pytest
from httpx import AsyncClient

from app.models.models import Card


@pytest.mark.asyncio
async def test_qr_generation(client: AsyncClient, sample_card: Card):
    """GET /q/{code}/qr.png returns a valid PNG image."""
    response = await client.get(f"/q/{sample_card.code}/qr.png")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    
    # Check it's actually a PNG file (starts with PNG signature)
    assert response.content.startswith(b"\x89PNG\r\n\x1a\n")


@pytest.mark.asyncio
async def test_qr_generation_invalid_card(client: AsyncClient):
    """GET /q/{invalid}/qr.png -> 404."""
    response = await client.get("/q/invalid/qr.png")
    assert response.status_code == 404
