import logging
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.auth import request_otp, verify_otp, verify_otp_and_resolve, create_jwt_token, link_identity_method
from app.api.dependencies.auth import get_current_customer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


class OTPRequest(BaseModel):
    provider: str  # 'PHONE' or 'EMAIL'
    provider_value: str


class OTPVerify(BaseModel):
    provider: str
    provider_value: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer_id: str
    name: str | None = None


@router.post("/request-otp")
async def api_request_otp(data: OTPRequest, db: AsyncSession = Depends(get_db)):
    """Request an OTP to be sent to the given provider."""
    if data.provider not in ["PHONE", "EMAIL", "GOOGLE"]:
        raise HTTPException(status_code=422, detail="Invalid provider")
    
    try:
        # Actually Google doesn't use OTP but just in case we hit this
        session, code = await request_otp(db, data.provider, data.provider_value)
        
        # TODO: Integrate with NotificationService to actually send the OTP.
        # For now (localhost MVP), we log it.
        print(f"==================================================")
        print(f"MOCK OTP for {data.provider_value}: {code}")
        print(f"==================================================")
        logger.info(f"MOCK OTP for {data.provider_value}: {code}")
        
        return {"message": "OTP sent successfully"}
    except ValueError as e:
        logger.warning(f"OTP rate limit / validation error: {str(e)}")
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        logger.error(f"Internal error during OTP request for {data.provider_value}: {str(e)}", exc_info=True)
        # Persian user-facing safe error message
        raise HTTPException(
            status_code=500,
            detail="ارسال کد تأیید با خطا مواجه شد. لطفاً دوباره تلاش کنید."
        )


@router.post("/verify-otp", response_model=TokenResponse)
async def api_verify_otp(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    """Verify an OTP and receive a JWT token."""
    success, customer, error_msg = await verify_otp_and_resolve(
        db, data.provider, data.provider_value, data.code
    )
    if not success or not customer:
        if error_msg == "Invalid OTP code.":
            error_msg = "کد تأیید اشتباه است."
        elif error_msg == "Too many failed attempts.":
            error_msg = "تعداد دفعات مجاز به پایان رسیده است. لطفاً دوباره کد درخواست کنید."
        elif error_msg == "No active OTP session found or expired.":
            error_msg = "کد تأیید منقضی شده یا یافت نشد."
        raise HTTPException(status_code=400, detail=error_msg)
    
    access_token = create_jwt_token(customer.id)
    return TokenResponse(
        access_token=access_token,
        customer_id=str(customer.id),
        name=customer.name
    )

class MockGoogleLoginRequest(BaseModel):
    email: str
    name: str | None = None

@router.post("/mock-google-login", response_model=TokenResponse)
async def api_mock_google_login(data: MockGoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """MOCK implementation of Google OAuth login for development only.
    This demonstrates the identity resolution path without real credentials.
    """
    from app.config import get_settings
    settings = get_settings()
    if settings.APP_ENV not in ["development", "local", "test"]:
        raise HTTPException(status_code=404, detail="Not Found")

    from app.services.auth import get_or_create_identity

    customer = await get_or_create_identity(db, "GOOGLE", data.email)
    
    # Optional: Update name if provided and customer name is empty
    if data.name and not customer.name:
        customer.name = data.name
        await db.commit()
        await db.refresh(customer)
        
    access_token = create_jwt_token(customer.id)
    return TokenResponse(
        access_token=access_token,
        customer_id=str(customer.id),
        name=customer.name
    )

class LinkedMethodResponse(BaseModel):
    provider: str
    provider_value: str
    verified_at: str | None

@router.get("/methods", response_model=list[LinkedMethodResponse])
async def get_linked_methods(
    current_customer: str = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    """Get all identity methods linked to the current customer."""
    from sqlalchemy import select
    from app.models.identity import IdentityMethod
    import uuid
    
    query = select(IdentityMethod).where(IdentityMethod.customer_id == uuid.UUID(current_customer))
    result = await db.execute(query)
    methods = result.scalars().all()
    
    return [
        LinkedMethodResponse(
            provider=m.provider,
            provider_value=m.provider_value,
            verified_at=m.verified_at.isoformat() if m.verified_at else None
        ) for m in methods
    ]

@router.post("/link-provider/request")
async def request_link_provider(
    data: OTPRequest, 
    current_customer: str = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    """Request an OTP to link a new provider."""
    if data.provider not in ["PHONE", "EMAIL"]:
        raise HTTPException(status_code=422, detail="Invalid provider for OTP linking")
        
    try:
        session, code = await request_otp(db, data.provider, data.provider_value, purpose="LINK_PROVIDER")
        
        logger.info(f"MOCK OTP for {data.provider_value}: {code}")
        
        return {"message": "OTP sent successfully"}
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))

class LinkProviderVerify(BaseModel):
    provider: str
    provider_value: str
    code: str | None = None

@router.post("/link-provider/verify")
async def verify_link_provider(
    data: LinkProviderVerify,
    current_customer: str = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    """Verify linking a new provider to the current customer."""
    if data.provider in ["PHONE", "EMAIL"]:
        if not data.code:
            raise HTTPException(status_code=400, detail="OTP code is required")
        success, _, error_msg = await verify_otp(db, data.provider, data.provider_value, data.code)
        if not success:
            if error_msg == "Invalid OTP code.":
                error_msg = "کد تأیید اشتباه است."
            elif error_msg == "Too many failed attempts.":
                error_msg = "تعداد دفعات مجاز به پایان رسیده است. لطفاً دوباره کد درخواست کنید."
            elif error_msg == "No active OTP session found or expired.":
                error_msg = "کد تأیید منقضی شده یا یافت نشد."
            raise HTTPException(status_code=400, detail=error_msg)
            
    elif data.provider == "GOOGLE":
        from app.config import get_settings
        settings = get_settings()
        if settings.APP_ENV not in ["development", "local", "test"]:
            raise HTTPException(status_code=404, detail="Not Found")
            
    else:
        raise HTTPException(status_code=422, detail="Invalid provider")
        
    success, error_msg = await link_identity_method(db, current_customer, data.provider, data.provider_value)
    if not success:
        raise HTTPException(status_code=400, detail=error_msg)
        
    return {"message": "Provider linked successfully"}
