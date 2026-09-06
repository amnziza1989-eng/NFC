import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_otp_request_bcrypt_regression(client: AsyncClient):
    """
    Test that requesting an OTP does not crash with a bcrypt 72-byte error
    and returns a successful API response.
    """
    response = await client.post("/api/v1/auth/request-otp", json={
        "provider": "PHONE",
        "provider_value": "09121111111"
    })
    
    # 200 OK or 429 if rate limited (either means it didn't crash internally with 500)
    assert response.status_code in [200, 429]
    if response.status_code == 200:
        assert response.json()["message"] == "OTP sent successfully"

@pytest.mark.asyncio
async def test_otp_request_error_boundary(client: AsyncClient, monkeypatch):
    """
    Test that if an internal error occurs during OTP request, 
    a Persian 500 error is returned, NOT the raw exception string.
    """
    import app.api.public.auth
    
    # Mock request_otp to raise a generic Exception
    async def mock_request_otp(*args, **kwargs):
        raise Exception("password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])")
        
    monkeypatch.setattr(app.api.public.auth, "request_otp", mock_request_otp)
    
    response = await client.post("/api/v1/auth/request-otp", json={
        "provider": "PHONE",
        "provider_value": "09122222222"
    })
    
    assert response.status_code == 500
    data = response.json()
    assert "password cannot be longer" not in data["detail"]
    assert data["detail"] == "ارسال کد تأیید با خطا مواجه شد. لطفاً دوباره تلاش کنید."
