"""NFC Review Platform — FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.public.routes import router as public_router
from app.api.internal.routes import router as internal_router


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

    yield

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
    app.include_router(internal_router)

    return app


app = create_app()
