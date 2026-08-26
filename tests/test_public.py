"""Tests for public API endpoints — health, NFC redirect, QR redirect."""

import pytest
from httpx import AsyncClient

from app.models.models import Card, Destination, Event


# ── Health ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    """GET /health → 200 with service info."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "nfc-review-platform"
    assert "version" in data


# ── NFC Redirect ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_nfc_redirect_valid(client: AsyncClient, sample_card: Card):
    """GET /n/{valid_code} → 302 to destination URL."""
    response = await client.get(f"/n/{sample_card.code}", follow_redirects=False)
    assert response.status_code == 302
    assert response.headers["location"] == "https://g.page/r/demo-cafe/review"


@pytest.mark.asyncio
async def test_nfc_redirect_not_found(client: AsyncClient):
    """GET /n/{invalid_code} → 404."""
    response = await client.get("/n/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_nfc_redirect_disabled(client: AsyncClient, disabled_card: Card):
    """GET /n/{disabled_code} → 410."""
    response = await client.get(f"/n/{disabled_card.code}", follow_redirects=False)
    assert response.status_code == 410


# ── QR Redirect ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_qr_redirect_valid(client: AsyncClient, sample_card: Card):
    """GET /q/{valid_code} → 302 to destination URL."""
    response = await client.get(f"/q/{sample_card.code}", follow_redirects=False)
    assert response.status_code == 302
    assert response.headers["location"] == "https://g.page/r/demo-cafe/review"


@pytest.mark.asyncio
async def test_qr_redirect_not_found(client: AsyncClient):
    """GET /q/{invalid_code} → 404."""
    response = await client.get("/q/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_qr_redirect_disabled(client: AsyncClient, disabled_card: Card):
    """GET /q/{disabled_code} → 410."""
    response = await client.get(f"/q/{disabled_card.code}", follow_redirects=False)
    assert response.status_code == 410


# ── Event Distinction ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_event_type_distinction(client: AsyncClient, sample_card: Card):
    """NFC and QR taps on the same card produce different event types."""
    # NFC tap
    await client.get(f"/n/{sample_card.code}", follow_redirects=False)
    # QR scan
    await client.get(f"/q/{sample_card.code}", follow_redirects=False)

    # Check events via internal API
    response = await client.get(f"/api/v1/cards/{sample_card.id}/events")
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 2

    event_types = {e["type"] for e in events}
    assert "NFC" in event_types
    assert "QR" in event_types
