"""Test configuration and fixtures.

Uses SQLite in-memory for fast testing without requiring PostgreSQL.
This is intentional — the production database is PostgreSQL, but tests
use SQLite to run without Docker dependencies.
"""

import uuid
from datetime import datetime, timezone

import os
# Set env vars BEFORE importing app modules
os.environ["API_KEY"] = "test-api-key"
os.environ["REDIS_URL"] = "redis://localhost:6379/9"
os.environ["APP_ENV"] = "testing"

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import tempfile
import os

from app.db.database import Base, get_db
from app.main import app
from app.models.models import Business, Card, Destination, Event
from app.models.identity import CustomerIdentity, IdentityMethod, OtpSession
from app.api.dependencies.rate_limit import rate_limit
from app.config import get_settings

get_settings.cache_clear()


# Use SQLite for tests (no PostgreSQL dependency needed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_engine():
    """Create a test database engine with a unique file database per test."""
    # Use a real file to avoid SQLite memory DB quirks with async/StaticPool
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    
    url = f"sqlite+aiosqlite:///{path}"
    engine = create_async_engine(
        url, 
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed shipping rules for test suite
    from app.services.service import init_default_shipping_rules
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        await init_default_shipping_rules(session)
        
    yield engine
    
    await engine.dispose()
    try:
        os.remove(path)
    except Exception:
        pass


@pytest_asyncio.fixture
async def test_db(test_engine):
    """Create a test database session."""
    session_factory = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(test_engine):
    """Create an async test client with overridden DB dependency."""
    session_factory = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[rate_limit] = lambda: None
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        c.headers.update({"X-API-Key": "test-api-key"})
        yield c
        
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient, test_db: AsyncSession):
    """An authenticated test client that bypasses the OTP flow for testing checkout."""
    from app.services.auth import create_jwt_token
    import uuid
    from datetime import datetime, timezone
    
    phone = "09121112233"
    
    # 1. Create a dummy customer identity and method
    customer = CustomerIdentity(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    test_db.add(customer)
    
    method = IdentityMethod(
        customer_id=customer.id,
        provider="PHONE",
        provider_value=phone,
        verified_at=datetime.now(timezone.utc)
    )
    test_db.add(method)
    
    await test_db.commit()
    
    # 2. Generate a valid JWT token directly
    token = create_jwt_token(customer.id)
    
    # 3. Return authenticated client
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest_asyncio.fixture
async def sample_business(test_db: AsyncSession):
    """Create a sample business for testing."""
    business = Business(
        id=uuid.uuid4(),
        name="Demo Cafe",
        status="ACTIVE",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    test_db.add(business)
    await test_db.commit()
    await test_db.refresh(business)
    return business


@pytest_asyncio.fixture
async def sample_destination(test_db: AsyncSession, sample_business: Business):
    """Create a sample Google Review destination."""
    destination = Destination(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        type="GOOGLE_REVIEW",
        source_url="https://g.page/r/demo-cafe/review",
        status="ACTIVE",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    test_db.add(destination)
    await test_db.commit()
    await test_db.refresh(destination)
    return destination


@pytest_asyncio.fixture
async def sample_card(
    test_db: AsyncSession,
    sample_business: Business,
    sample_destination: Destination,
):
    """Create a sample active card."""
    card = Card(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        destination_id=sample_destination.id,
        code="test1234",
        status="ACTIVE",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    test_db.add(card)
    await test_db.commit()
    await test_db.refresh(card)
    return card


@pytest_asyncio.fixture
async def disabled_card(
    test_db: AsyncSession,
    sample_business: Business,
    sample_destination: Destination,
):
    """Create a disabled card for testing."""
    card = Card(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        destination_id=sample_destination.id,
        code="disabled1",
        status="DISABLED",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    test_db.add(card)
    await test_db.commit()
    await test_db.refresh(card)
    return card
