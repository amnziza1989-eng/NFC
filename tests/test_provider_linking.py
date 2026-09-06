import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.identity import CustomerIdentity, IdentityMethod
from app.services.auth import create_jwt_token

@pytest.fixture
async def authenticated_client(client: AsyncClient, test_db: AsyncSession):
    # Create a user with PHONE
    customer = CustomerIdentity(name="Test Phone User")
    test_db.add(customer)
    await test_db.commit()
    
    method = IdentityMethod(
        customer_id=customer.id,
        provider="PHONE",
        provider_value="09120000001"
    )
    test_db.add(method)
    await test_db.commit()
    
    token = create_jwt_token(customer.id)
    client.headers["Authorization"] = f"Bearer {token}"
    return client, customer

@pytest.fixture
async def other_client(client: AsyncClient, test_db: AsyncSession):
    customer = CustomerIdentity(name="Test Email User")
    test_db.add(customer)
    await test_db.commit()
    
    method = IdentityMethod(
        customer_id=customer.id,
        provider="EMAIL",
        provider_value="existing@example.com"
    )
    test_db.add(method)
    
    method_google = IdentityMethod(
        customer_id=customer.id,
        provider="GOOGLE",
        provider_value="other@google.com"
    )
    test_db.add(method_google)
    await test_db.commit()
    
    return customer

@pytest.mark.asyncio
async def test_link_google_mock_development(authenticated_client, monkeypatch):
    from app.config import get_settings
    settings = get_settings()
    monkeypatch.setattr(settings, "APP_ENV", "development")

    client, customer = authenticated_client
    
    # Link Google
    res = await client.post("/api/v1/auth/link-provider/verify", json={
        "provider": "GOOGLE",
        "provider_value": "google@example.com"
    })
    assert res.status_code == 200
    
    # Check methods
    methods_res = await client.get("/api/v1/auth/methods")
    assert methods_res.status_code == 200
    methods = methods_res.json()
    assert len(methods) == 2
    providers = [m["provider"] for m in methods]
    assert "PHONE" in providers
    assert "GOOGLE" in providers

@pytest.mark.asyncio
async def test_link_google_twice_fails(authenticated_client, monkeypatch):
    from app.config import get_settings
    settings = get_settings()
    monkeypatch.setattr(settings, "APP_ENV", "development")

    client, customer = authenticated_client
    
    # Link Google first time
    await client.post("/api/v1/auth/link-provider/verify", json={
        "provider": "GOOGLE",
        "provider_value": "google2@example.com"
    })
    
    # Link Google second time with same value
    res = await client.post("/api/v1/auth/link-provider/verify", json={
        "provider": "GOOGLE",
        "provider_value": "google2@example.com"
    })
    assert res.status_code == 400
    assert "already linked" in res.json()["detail"]

@pytest.mark.asyncio
async def test_linking_already_owned_provider_fails(authenticated_client, other_client, monkeypatch):
    from app.config import get_settings
    settings = get_settings()
    monkeypatch.setattr(settings, "APP_ENV", "development")

    client, customer = authenticated_client
    
    # Customer tries to link 'other@google.com' (owned by other_customer)
    res = await client.post("/api/v1/auth/link-provider/verify", json={
        "provider": "GOOGLE",
        "provider_value": "other@google.com"
    })
    assert res.status_code == 400
    assert "already registered to another account" in res.json()["detail"]

@pytest.mark.asyncio
async def test_unauthenticated_linking(client: AsyncClient):
    req_res = await client.post("/api/v1/auth/link-provider/request", json={
        "provider": "EMAIL",
        "provider_value": "new_email@example.com"
    })
    # Must fail because no token provided
    assert req_res.status_code == 401

@pytest.mark.asyncio
async def test_unverified_linking_fails(authenticated_client):
    client, customer = authenticated_client
    
    req_res = await client.post("/api/v1/auth/link-provider/verify", json={
        "provider": "EMAIL",
        "provider_value": "new_email@example.com"
        # No code provided
    })
    assert req_res.status_code == 400
    assert "OTP code is required" in req_res.json()["detail"]

