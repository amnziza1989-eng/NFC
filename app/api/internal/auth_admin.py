from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.api.dependencies.auth import get_api_key
from app.models.identity import CustomerIdentity, OtpSession
from app.schemas.schemas import CustomerIdentityAdminResponse, OtpSessionAdminResponse

router = APIRouter(
    prefix="/api/v1/internal/auth",
    tags=["Internal Auth Admin"],
    dependencies=[Depends(get_api_key)],
)

@router.get("/identities", response_model=list[CustomerIdentityAdminResponse])
async def list_identities(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to list customer identities with their linked methods."""
    query = (
        select(CustomerIdentity)
        .options(selectinload(CustomerIdentity.methods))
        .order_by(desc(CustomerIdentity.created_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    customers = result.scalars().all()
    
    return [CustomerIdentityAdminResponse.model_validate(c) for c in customers]


@router.get("/otp-sessions", response_model=list[OtpSessionAdminResponse])
async def list_otp_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to monitor recent OTP sessions."""
    query = (
        select(OtpSession)
        .order_by(desc(OtpSession.created_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    return [OtpSessionAdminResponse.model_validate(s) for s in sessions]
