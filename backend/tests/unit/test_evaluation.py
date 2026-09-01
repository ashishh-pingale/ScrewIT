"""Evaluation tests for the matching engine using synthetic dataset."""

import csv
from pathlib import Path

from app.models.standard_material import StandardMaterial
from app.services.attribute_extraction import extract_attributes
from app.services.scoring.engine import ScoringEngine

def test_evaluation_pipeline():
    """Evaluate candidate generation and scoring on synthetic demo data."""
    # This is a mocked evaluation since we don't have a live DB in this unit test.
    # We will just verify that the pipeline can run on a row of the demo data.
    
    root = Path(__file__).resolve().parents[3]
    records_path = root / "data" / "demo" / "material_records.csv"
    canonical_path = root / "data" / "demo" / "canonical_materials.csv"
    
    if not records_path.exists() or not canonical_path.exists():
        return # Skip if data not generated
        
    engine = ScoringEngine()
    
    # Just take one record and one canonical material to prove it runs
    with records_path.open() as f:
        reader = csv.DictReader(f)
        record = next(reader)
        
    with canonical_path.open() as f:
        reader = csv.DictReader(f)
        canonical = next(reader)
        
    source_attrs = extract_attributes(record["description"])
    
    # Mock StandardMaterial
    import uuid
    candidate = StandardMaterial(
        id=uuid.uuid4(),
        canonical_name=canonical["canonical_name"],
        category=canonical["category"],
        material=canonical["material"],
        grade=canonical["grade"],
        specifications=canonical["specifications"],
    )
    
    # Evaluate
    result = engine.evaluate_candidate(record["description"], source_attrs, candidate)
    
    assert result.candidate_id == candidate.id
    assert 0.0 <= result.final_score <= 1.0
    assert result.match_type in ["EXACT", "EQUIVALENT", "SIMILAR", "REVIEW_REQUIRED", "DIFFERENT"]
