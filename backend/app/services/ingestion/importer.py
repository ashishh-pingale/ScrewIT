"""Importer service to validate and persist uploaded material files."""

import io
import logging

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.material import Material
from app.models.material_match import MaterialMatch
from app.schemas.ingestion import ColumnMapping, ImportSummaryResponse
from app.services.normalization import normalize_description
from app.services.attribute_extraction import extract_attributes
from app.services.matching.retrieval import retrieve_semantic_candidates
from app.services.scoring.engine import ScoringEngine

logger = logging.getLogger(__name__)


def process_import(
    db: Session,
    contents: bytes,
    filename: str,
    cpse_name: str,
    mapping: ColumnMapping,
) -> ImportSummaryResponse:
    """Read file, validate rows, extract attributes, match, and persist."""
    if filename.lower().endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents), dtype=str, keep_default_na=False)
    elif filename.lower().endswith((".xls", ".xlsx")):
        df = pd.read_excel(io.BytesIO(contents), dtype=str, keep_default_na=False)
    else:
        raise ValueError("Unsupported file format.")

    total_rows = len(df)
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0
    review_required_count = 0

    engine = ScoringEngine()

    for _, row in df.iterrows():
        # Retrieve mapped values
        try:
            original_code = str(row[mapping.original_code]).strip()
            description = str(row[mapping.description]).strip()
        except KeyError:
            invalid_count += 1
            continue
            
        if not original_code or not description:
            invalid_count += 1
            continue

        # Optional fields
        cat = str(row[mapping.category]).strip() if mapping.category and mapping.category in row else None
        unit = str(row[mapping.unit]).strip() if mapping.unit and mapping.unit in row else None
        mfr = str(row[mapping.manufacturer]).strip() if mapping.manufacturer and mapping.manufacturer in row else None
        pn = str(row[mapping.part_number]).strip() if mapping.part_number and mapping.part_number in row else None

        # Check for duplicates (same CPSE and original_code)
        existing = db.execute(
            select(Material).where(
                Material.cpse_name == cpse_name,
                Material.original_code == original_code
            )
        ).scalars().first()

        if existing:
            duplicate_count += 1
            continue

        # Normalize and Extract
        norm_result = normalize_description(description)
        attrs = extract_attributes(description)

        # Merge extracted with explicit optionally mapped values
        final_category = cat or attrs.category
        final_unit = unit or attrs.unit
        final_mfr = mfr or attrs.manufacturer
        final_pn = pn or attrs.part_number

        # Create Material
        material = Material(
            cpse_name=cpse_name,
            original_code=original_code,
            description=description,
            normalized_description=norm_result.normalized_description,
            category=final_category,
            material=attrs.material,
            grade=attrs.grade,
            diameter=float(attrs.diameter.split()[0]) if attrs.diameter and attrs.diameter.split()[0].replace('.', '', 1).isdigit() else None,
            length=float(attrs.length.split()[0]) if attrs.length and attrs.length.split()[0].replace('.', '', 1).isdigit() else None,
            width=float(attrs.width.split()[0]) if attrs.width and attrs.width.split()[0].replace('.', '', 1).isdigit() else None,
            height=float(attrs.height.split()[0]) if attrs.height and attrs.height.split()[0].replace('.', '', 1).isdigit() else None,
            unit=final_unit,
            manufacturer=final_mfr,
            part_number=final_pn,
            status="pending_review",
        )
        
        db.add(material)
        try:
            db.flush()
            valid_count += 1
            review_required_count += 1 # New valid materials always start as pending_review
        except IntegrityError:
            db.rollback()
            invalid_count += 1
            continue

        # Match Candidates
        try:
            # We need the source embedding to retrieve
            from app.services.matching.embedding import generate_embedding
            source_emb = generate_embedding(description)
            candidates = retrieve_semantic_candidates(db, source_emb, limit=3)
            
            for candidate in candidates:
                result = engine.evaluate_candidate(description, attrs, candidate)
                match_record = MaterialMatch(
                    source_material_id=material.id,
                    candidate_material_id=candidate.id,
                    semantic_score=result.semantic_score,
                    attribute_score=result.attribute_score,
                    category_score=result.category_score,
                    dimension_score=result.dimension_score,
                    final_score=result.final_score,
                    match_type=result.match_type,
                    status="pending_review"
                )
                db.add(match_record)
            
            db.flush()
        except Exception as e:
            logger.error(f"Error matching for {original_code}: {e}")
            # Non-fatal to import if matching fails
            pass

    db.commit()

    return ImportSummaryResponse(
        records_uploaded=total_rows,
        valid_records=valid_count,
        invalid_records=invalid_count,
        duplicates_detected=duplicate_count,
        records_requiring_review=review_required_count,
    )
