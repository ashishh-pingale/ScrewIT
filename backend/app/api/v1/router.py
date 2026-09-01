"""Versioned API router composition."""

from fastapi import APIRouter

from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.materials import router as materials_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(materials_router, prefix="/materials", tags=["materials"])
