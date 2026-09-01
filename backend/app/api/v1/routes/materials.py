"""API routes for material ingestion and management."""

import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ingestion import ColumnMapping, ImportSummaryResponse, PreviewResponse
from app.services.ingestion.parser import parse_upload_preview
from app.services.ingestion.importer import process_import

router = APIRouter()


@router.post(
    "/upload-preview",
    response_model=PreviewResponse,
    summary="Parse file and return preview",
)
def upload_preview(file: UploadFile = File(...)) -> PreviewResponse:
    """Accepts a CSV/XLSX file and returns headers and top rows for column mapping."""
    try:
        return parse_upload_preview(file)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/import",
    response_model=ImportSummaryResponse,
    summary="Import materials with column mapping",
)
def import_materials(
    file: UploadFile = File(...),
    mapping: str = Form(...),
    cpse_name: str = Form(...),
    db: Session = Depends(get_db),
) -> ImportSummaryResponse:
    """Process uploaded file, apply mapping, and insert materials into database."""
    try:
        mapping_dict = json.loads(mapping)
        column_mapping = ColumnMapping(**mapping_dict)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid column mapping format.",
        ) from exc

    contents = file.file.read()
    filename = file.filename or "unknown"
    
    try:
        return process_import(db, contents, filename, cpse_name, column_mapping)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during import: {exc}",
        ) from exc
