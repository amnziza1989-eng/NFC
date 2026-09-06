import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.identity import CustomerIdentity, IdentityMethod, OtpSession
from app.config import get_settings

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def generate_otp() -> str:
    """Generate a secure 6-digit numeric OTP."""
    digits = string.digits
    return "".join(secrets.choice(digits) for _ in range(6))


def create_jwt_token(customer_id: uuid.UUID) -> str:
    """Create a JWT token for the authenticated customer."""
    settings = get_settings()
    # Expiration: 30 days
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode = {"sub": str(customer_id), "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


async def request_otp(db: AsyncSession, provider: str, provider_value: str, purpose: str = "CHECKOUT") -> tuple[OtpSession, str]:
    """Create a new OTP session and return the (session, plaintext_code)."""
    # Rate limit check (basic: prevent more than 3 requests in 5 minutes for same provider_value)
    five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    recent_sessions_query = select(OtpSession).where(
        and_(
            OtpSession.provider_value == provider_value,
            OtpSession.created_at >= five_mins_ago
        )
    )
    result = await db.execute(recent_sessions_query)
    recent_sessions = result.scalars().all()
    if len(recent_sessions) >= 3:
        raise ValueError("Too many requests. Please try again later.")

    # Generate OTP
    code = generate_otp()
    code_hash = hash_password(code)
    
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    from app.config import get_settings
    settings = get_settings()
    debug_code = code if settings.APP_ENV in ["development", "local", "test"] else None

    session = OtpSession(
        provider=provider,
        provider_value=provider_value,
        purpose=purpose,
        code_hash=code_hash,
        debug_code=debug_code,
        expires_at=expires_at,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    return session, code


async def get_or_create_identity(db: AsyncSession, provider: str, provider_value: str) -> CustomerIdentity:
    """Resolve an existing customer identity by provider value, or create a new one."""
    method_query = select(IdentityMethod).where(
        and_(
            IdentityMethod.provider == provider,
            IdentityMethod.provider_value == provider_value
        )
    )
    result = await db.execute(method_query)
    method = result.scalar_one_or_none()

    if method:
        method.verified_at = datetime.now(timezone.utc)
        await db.commit()
        # Load the customer
        cust_query = select(CustomerIdentity).where(CustomerIdentity.id == method.customer_id)
        cust_result = await db.execute(cust_query)
        customer = cust_result.scalar_one()
        return customer
    
    # Create new identity and method
    customer = CustomerIdentity()
    db.add(customer)
    await db.commit()
    await db.refresh(customer)

    new_method = IdentityMethod(
        customer_id=customer.id,
        provider=provider,
        provider_value=provider_value,
        verified_at=datetime.now(timezone.utc)
    )
    db.add(new_method)
    await db.commit()

    return customer


async def verify_otp(db: AsyncSession, provider: str, provider_value: str, code: str) -> tuple[bool, CustomerIdentity | None, str | None]:
    """Verify an OTP and resolve the identity."""
    # Find the most recent active session
    session_query = select(OtpSession).where(
        and_(
            OtpSession.provider == provider,
            OtpSession.provider_value == provider_value,
            OtpSession.consumed == False,
            OtpSession.expires_at > datetime.now(timezone.utc)
        )
    ).order_by(OtpSession.created_at.desc()).limit(1)

    result = await db.execute(session_query)
    session = result.scalar_one_or_none()

    if not session:
        return False, None, "No active OTP session found or expired."

    if session.attempts >= 3:
        session.consumed = True
        await db.commit()
        return False, None, "Too many failed attempts."

    # Verify code
    if not verify_password(code, session.code_hash):
        session.attempts += 1
        await db.commit()
        return False, None, "Invalid OTP code."

    # Valid code!
    session.consumed = True
    await db.commit()
    return True, None, None

async def verify_otp_and_resolve(db: AsyncSession, provider: str, provider_value: str, code: str) -> tuple[bool, CustomerIdentity | None, str | None]:
    """Verify an OTP and resolve the identity for login."""
    success, _, error_msg = await verify_otp(db, provider, provider_value, code)
    if not success:
        return False, None, error_msg

    # Resolve Identity
    customer = await get_or_create_identity(db, provider, provider_value)
    return True, customer, None

async def link_identity_method(db: AsyncSession, customer_id: str, provider: str, provider_value: str) -> tuple[bool, str | None]:
    """Link a new provider to an existing customer identity."""
    # Check if this provider_value is already registered anywhere
    existing_method_query = select(IdentityMethod).where(
        and_(
            IdentityMethod.provider == provider,
            IdentityMethod.provider_value == provider_value
        )
    )
    result = await db.execute(existing_method_query)
    existing_method = result.scalar_one_or_none()

    if existing_method:
        if str(existing_method.customer_id) == str(customer_id):
            return False, "This login method is already linked to your account."
        return False, "This login method is already registered to another account."

    import uuid
    new_method = IdentityMethod(
        customer_id=uuid.UUID(customer_id) if isinstance(customer_id, str) else customer_id,
        provider=provider,
        provider_value=provider_value,
        verified_at=datetime.now(timezone.utc)
    )
    db.add(new_method)
    await db.commit()
    return True, None

