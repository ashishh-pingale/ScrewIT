"""Unit tests for the matching and scoring engine."""

from decimal import Decimal
import uuid

import pytest

from app.models.standard_material import StandardMaterial
from app.services.attribute_extraction import ExtractedAttributes
from app.services.scoring.engine import ScoringEngine

def test_scoring_engine_exact_match():
    engine = ScoringEngine(semantic_weight=0.5, attribute_weight=0.3, category_weight=0.1, dimension_weight=0.1)
    
    # Fake source attributes
    source_attrs = ExtractedAttributes(
        category="bolt",
        material="stainless steel",
        grade="304",
        diameter="M10",
        length="50 mm",
        unit="each"
    )
    
    # Fake candidate
    candidate = StandardMaterial(
        id=uuid.uuid4(),
        canonical_name="Hex Bolt M10 x 50 mm Stainless Steel 304",
        category="bolt",
        material="stainless steel",
        grade="304",
        specifications="M10; 50 mm"
    )
    # Give candidate a perfect embedding match
    # Since we can't easily mock the sentence transformer inside the evaluate_candidate method 
    # without patching, let's just test the component scores directly first.
    
    candidate_attrs = ExtractedAttributes(
        category="bolt",
        material="stainless steel",
        grade="304",
        diameter="M10",
        length="50 mm",
        unit="each"
    )
    
    cat_score = engine.score_category(source_attrs, candidate)
    dim_score = engine.score_dimensions(source_attrs, candidate_attrs)
    attr_score = engine.score_attributes(source_attrs, candidate, candidate_attrs)
    
    assert cat_score == 1.0
    assert dim_score == 1.0
    assert attr_score == 1.0

def test_determine_match_type():
    engine = ScoringEngine()
    assert engine.determine_match_type(0.96) == "EXACT"
    assert engine.determine_match_type(0.86) == "EQUIVALENT"
    assert engine.determine_match_type(0.75) == "SIMILAR"
    assert engine.determine_match_type(0.55) == "REVIEW_REQUIRED"
    assert engine.determine_match_type(0.40) == "DIFFERENT"
