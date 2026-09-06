"""Tests for API Key authentication."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_missing_api_key(client: AsyncClient):
    """GET /api/v1/businesses without API key -> 401."""
    # We remove the header from the client for this test
    del client.headers["X-API-Key"]
    response = await client.get("/api/v1/businesses")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


@pytest.mark.asyncio
async def test_invalid_api_key(client: AsyncClient):
    """GET /api/v1/businesses with wrong API key -> 401."""
    response = await client.get("/api/v1/businesses", headers={"X-API-Key": "wrong-key"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid API Key"


@pytest.mark.asyncio
async def test_valid_api_key(client: AsyncClient):
    """GET /api/v1/businesses with correct API key -> 200."""
    response = await client.get("/api/v1/businesses")
    assert response.status_code == 200
