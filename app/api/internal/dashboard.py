"""Dashboard internal management API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.api.dependencies.auth import get_api_key
from app.services.service import get_dashboard_overview
from app.schemas.schemas import DashboardOverviewResponse

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_api_key)],
)

@router.get("/overview", response_model=DashboardOverviewResponse)
async def api_dashboard_overview(db: AsyncSession = Depends(get_db)):
    """Get aggregated metrics for the dashboard overview."""
    stats = await get_dashboard_overview(db)
    return stats
