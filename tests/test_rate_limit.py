"""Tests for rate limiting."""

import pytest
from httpx import AsyncClient

from app.models.models import Card


@pytest.mark.asyncio
async def test_rate_limit_fails_open_with_no_redis(client: AsyncClient, sample_card: Card):
    """When redis is a dummy URL and fails to connect, rate limiting fails open."""
    # We set a dummy redis url in conftest (redis://localhost:6379/9)
    # The rate limiter should catch connection errors and allow the request
    for _ in range(65):
        response = await client.get(f"/n/{sample_card.code}", follow_redirects=False)
        assert response.status_code == 302
