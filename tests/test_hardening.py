"""Hardening tests for Phase 4."""

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_ready_check(client: AsyncClient):
    """Test the readiness probe returns 200 and ignores missing Redis."""
    response = await client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}

@pytest.mark.asyncio
async def test_request_id_middleware(client: AsyncClient):
    """Test that all requests get an X-Request-ID header."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert len(response.headers["x-request-id"]) > 10
