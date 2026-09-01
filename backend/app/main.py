"""FastAPI application entry point."""

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    """Create the ScrewIT API application."""
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Foundation API for the ScrewIT material harmonization platform.",
    )
    application.include_router(api_router, prefix=settings.api_v1_prefix)
    return application


app = create_app()
