"""Schemas for data ingestion endpoints."""

from typing import Any

from pydantic import BaseModel, Field


class PreviewResponse(BaseModel):
    """Response containing headers and first N rows of an uploaded file."""

    filename: str = Field(description="The original filename.")
    headers: list[str] = Field(description="The columns found in the file.")
    preview_data: list[dict[str, Any]] = Field(
        description="List of row dictionaries for previewing."
    )
    total_rows: int = Field(description="Total number of rows detected.")


class ColumnMapping(BaseModel):
    """Mapping from target system fields to the user's uploaded columns."""

    original_code: str = Field(description="Column mapped to CPSE local material code.")
    description: str = Field(description="Column mapped to full material description.")
    category: str | None = Field(default=None, description="Optional column for category.")
    unit: str | None = Field(default=None, description="Optional column for unit.")
    manufacturer: str | None = Field(default=None, description="Optional column for manufacturer.")
    part_number: str | None = Field(default=None, description="Optional column for part number.")


class ImportSummaryResponse(BaseModel):
    """Summary metrics returned after a successful import."""

    records_uploaded: int = Field(description="Total rows processed.")
    valid_records: int = Field(description="Number of records inserted successfully.")
    invalid_records: int = Field(description="Number of records that failed validation.")
    duplicates_detected: int = Field(description="Number of duplicate codes rejected/ignored.")
    records_requiring_review: int = Field(description="Number of records created in pending_review status.")
