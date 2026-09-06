"""NFC Review Platform — FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uuid

from app.config import get_settings
from app.api.dependencies.rate_limit import init_redis, close_redis
from app.api.public.routes import router as public_router
from app.api.public.shop import router as shop_router
from app.api.public.activation import router as activation_router
from app.api.public.auth import router as auth_router
from app.api.internal.routes import router as internal_router
from app.api.internal.dashboard import router as dashboard_router
from app.api.internal.auth_admin import router as auth_admin_router

logger = logging.getLogger(__name__)


def setup_logging():
    """Configure structured logging."""
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    setup_logging()
    logger = logging.getLogger(__name__)
    settings = get_settings()

    logger.info("Starting NFC Review Platform")
    logger.info("Environment: %s", settings.APP_ENV)
    logger.info("Public base URL: %s", settings.PUBLIC_BASE_URL)

    # Ensure uploads directory exists
    Path("uploads/logos").mkdir(parents=True, exist_ok=True)

    await init_redis()

    # Idempotently seed default shipping rules on application startup
    try:
        from app.db.database import AsyncSessionLocal
        from app.services.service import init_default_shipping_rules
        async with AsyncSessionLocal() as session:
            await init_default_shipping_rules(session)
            logger.info("31 Iranian province shipping rules verified and seeded.")
    except Exception as e:
        logger.warning(f"Could not initialize default shipping rules on startup: {e}")

    yield

    await close_redis()
    logger.info("Shutting down NFC Review Platform")


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()

    app = FastAPI(
        title="NFC Review Platform",
        description=(
            "NFC + QR Review Card routing service. "
            "Redirects NFC taps and QR scans through a configurable backend "
            "to destination URLs (Google Reviews, etc.)."
        ),
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.APP_ENV == "development" else None,
        redoc_url="/redoc" if settings.APP_ENV == "development" else None,
    )

    # Static files for custom logos
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    @app.middleware("http")
    async def add_request_id_and_log(request: Request, call_next):
        req_id = str(uuid.uuid4())
        request.state.request_id = req_id
        
        # Avoid logging the sensitive headers
        logger.info(f"Request started: {request.method} {request.url.path} [ReqID: {req_id}]")
        
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = req_id
            logger.info(f"Request completed: {request.method} {request.url.path} - Status: {response.status_code} [ReqID: {req_id}]")
            return response
        except Exception as e:
            logger.error(f"Unhandled exception during request {request.method} {request.url.path} [ReqID: {req_id}]: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error", "request_id": req_id},
                headers={"X-Request-ID": req_id}
            )

    # CORS — restrictive by default, open in development
    if settings.APP_ENV == "development":
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[settings.PUBLIC_BASE_URL],
            allow_credentials=False,
            allow_methods=["GET"],
            allow_headers=["*"],
        )

    # Mount routers
    app.include_router(public_router)
    app.include_router(shop_router)
    app.include_router(activation_router)
    app.include_router(auth_router)
    app.include_router(internal_router)
    app.include_router(dashboard_router)
    app.include_router(auth_admin_router)

    return app


app = create_app()
