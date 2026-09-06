"""Authentication dependencies for the API."""

import logging
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
import jwt
from pydantic import ValidationError

from app.config import get_settings

logger = logging.getLogger(__name__)

# We use a custom header for the API Key, e.g. "X-API-Key: your-key-here"
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_api_key(api_key_header: str = Security(api_key_header)) -> str:
    """Validate the API key from the header against the environment configuration."""
    if not api_key_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    settings = get_settings()

    if not settings.API_KEY:
        logger.error("Authentication failed: API_KEY is not configured in the environment.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server authentication is not configured properly.",
        )

    if api_key_header != settings.API_KEY:
        logger.warning("Authentication failed: Invalid API key provided.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )

    return api_key_header


security = HTTPBearer(auto_error=False)

async def get_current_customer(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """Validate JWT token and return customer ID."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    settings = get_settings()
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=["HS256"])
        customer_id: str = payload.get("sub")
        if customer_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return customer_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")


async def get_optional_customer(credentials: HTTPAuthorizationCredentials | None = Security(security)) -> str | None:
    """Validate JWT token if present, otherwise return None."""
    if not credentials:
        return None
    try:
        return await get_current_customer(credentials)
    except HTTPException:
        return None

