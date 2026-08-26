"""Test configuration and fixtures.

Uses SQLite in-memory for fast testing without requiring PostgreSQL.
This is intentional — the production database is PostgreSQL, but tests
use SQLite to run without Docker dependencies.
"""

import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.db.database import Base, get_db
from app.main import app
from app.models.models import Business, Card, Destination, Event


# Use SQLite for tests (no PostgreSQL dependency needed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///test.db"


@pytest_asyncio.fixture
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


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
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


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
        url="https://g.page/r/demo-cafe/review",
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
