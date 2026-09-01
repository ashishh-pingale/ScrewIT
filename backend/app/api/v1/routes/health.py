"""Health-check endpoints for service and database availability."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.health import DatabaseHealthResponse, HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Check API availability")
def get_health() -> HealthResponse:
    """Return service availability without requiring a database connection."""
    return HealthResponse(status="ok")


@router.get(
    "/health/database",
    response_model=DatabaseHealthResponse,
    summary="Check PostgreSQL availability",
)
def get_database_health(db: Session = Depends(get_db)) -> DatabaseHealthResponse:
    """Validate the configured database connection with a minimal query."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "database_unavailable", "message": "Database is unavailable."},
        ) from exc
    return DatabaseHealthResponse(status="ok", database="connected")
