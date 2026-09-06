import pytest
from httpx import AsyncClient
from app.config import get_settings

@pytest.mark.asyncio
async def test_mock_google_login_development(client: AsyncClient, monkeypatch):
    """Test that mock Google login succeeds in a test environment."""
    settings = get_settings()
    monkeypatch.setattr(settings, "APP_ENV", "development")
    
    response = await client.post("/api/v1/auth/mock-google-login", json={
        "email": "test@google.com",
        "name": "Dev User"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "customer_id" in data
    assert data["name"] == "Dev User"

@pytest.mark.asyncio
async def test_mock_google_login_production_forbidden(client: AsyncClient, monkeypatch):
    """Test that mock Google login fails securely in production."""
    settings = get_settings()
    # Force settings APP_ENV to production for this test
    monkeypatch.setattr(settings, "APP_ENV", "production")
    
    response = await client.post("/api/v1/auth/mock-google-login", json={
        "email": "hacker@google.com",
        "name": "Hacker"
    })
    
    # Must be 404 Not Found to obscure the endpoint, or 403. Our implementation uses 404.
    assert response.status_code == 404
    assert response.json()["detail"] == "Not Found"

@pytest.mark.asyncio
async def test_phone_otp_request(client: AsyncClient):
    """Test that the existing phone OTP request flow functions."""
    response = await client.post("/api/v1/auth/request-otp", json={
        "provider": "PHONE",
        "provider_value": "09121234567"
    })
    # Might be 200 OK or 429 Too Many Requests if rate limited, both imply the logic runs safely
    assert response.status_code in [200, 429]

@pytest.mark.asyncio
async def test_email_otp_request(client: AsyncClient):
    """Test that the existing email OTP request flow functions."""
    response = await client.post("/api/v1/auth/request-otp", json={
        "provider": "EMAIL",
        "provider_value": "test@example.com"
    })
    assert response.status_code in [200, 429]
