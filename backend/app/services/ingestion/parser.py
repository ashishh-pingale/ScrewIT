"""Parser service for uploaded material files."""

import io

import pandas as pd
from fastapi import UploadFile

from app.schemas.ingestion import PreviewResponse


def parse_upload_preview(file: UploadFile, num_rows: int = 20) -> PreviewResponse:
    """Read a CSV or XLSX file and return headers and preview data."""
    contents = file.file.read()
    # Reset pointer if we need to read it again later
    file.file.seek(0)
    
    filename = file.filename or "unknown"
    
    if filename.lower().endswith(".csv"):
        # Explicit string to avoid dtype warnings
        df = pd.read_csv(io.BytesIO(contents), dtype=str, keep_default_na=False)
    elif filename.lower().endswith((".xls", ".xlsx")):
        df = pd.read_excel(io.BytesIO(contents), dtype=str, keep_default_na=False)
    else:
        raise ValueError("Unsupported file format. Must be CSV or XLSX.")
        
    headers = df.columns.tolist()
    total_rows = len(df)
    
    # Take first num_rows
    preview_df = df.head(num_rows)
    preview_data = preview_df.to_dict(orient="records")
    
    return PreviewResponse(
        filename=filename,
        headers=headers,
        preview_data=preview_data,
        total_rows=total_rows,
    )
