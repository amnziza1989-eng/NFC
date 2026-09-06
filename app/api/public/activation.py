"""Public Self-Service Card Activation API routes."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.api.dependencies.rate_limit import rate_limit
from app.schemas.schemas import (
    CardActivationVerifyRequest,
    CardActivationVerifyResponse,
    CardActivationConfigureRequest,
    CardActivationConfigureResponse,
)
from app.services.service import (
    verify_card_activation,
    configure_card_activation,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/public/activation", tags=["Card Activation"])


@router.post(
    "/verify",
    response_model=CardActivationVerifyResponse,
    summary="Verify physical card ownership and issue temporary activation token",
    dependencies=[Depends(rate_limit)],
)
async def verify_activation(
    payload: CardActivationVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify card code, order number, and customer contact proof to issue a 15-minute token."""
    try:
        result = await verify_card_activation(
            db=db,
            card_code=payload.card_code,
            order_number=payload.order_number,
            verification_contact=payload.verification_contact,
        )
        await db.commit()
        return result
    except ValueError as e:
        logger.warning("Card activation verification failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        await db.rollback()
        logger.error("Activation verification transaction error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify card activation details",
        )


@router.post(
    "/configure",
    response_model=CardActivationConfigureResponse,
    summary="Configure target destination URL using active activation token",
    dependencies=[Depends(rate_limit)],
)
async def configure_activation(
    payload: CardActivationConfigureRequest,
    db: AsyncSession = Depends(get_db),
):
    """Configure card destination URL and activate physical redirection."""
    try:
        result = await configure_card_activation(
            db=db,
            activation_token=payload.activation_token,
            destination_type=payload.destination_type,
            destination_url=payload.destination_url,
        )
        await db.commit()
        return result
    except ValueError as e:
        logger.warning("Card activation configuration failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        await db.rollback()
        logger.error("Activation configuration transaction error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to configure card activation destination",
        )
