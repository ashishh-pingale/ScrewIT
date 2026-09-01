"""Deterministic candidate scoring and policy rules engine."""

from decimal import Decimal
from typing import Optional

from app.models.standard_material import StandardMaterial
from app.schemas.match import CandidateResult, MatchType
from app.services.attribute_extraction import ExtractedAttributes, extract_attributes
from app.services.matching.embedding import generate_embedding


class ScoringEngine:
    """Engine that combines AI signals with exact attributes to determine final scores."""

    def __init__(
        self,
        semantic_weight: float = 0.50,
        attribute_weight: float = 0.30,
        category_weight: float = 0.10,
        dimension_weight: float = 0.10,
    ):
        self.weights = {
            "semantic": semantic_weight,
            "attribute": attribute_weight,
            "category": category_weight,
            "dimension": dimension_weight,
        }

    def _compare_strings(self, source: Optional[str], target: Optional[str]) -> float:
        """Helper to compare optional string attributes exactly."""
        if not source or not target:
            return 0.0
        return 1.0 if source.lower() == target.lower() else 0.0

    def score_category(
        self, source_attrs: ExtractedAttributes, candidate: StandardMaterial
    ) -> float:
        """Score category match."""
        return self._compare_strings(source_attrs.category, candidate.category)

    def score_dimensions(
        self, source_attrs: ExtractedAttributes, candidate_attrs: ExtractedAttributes
    ) -> float:
        """Score dimensional and unit compatibility."""
        score = 0.0
        comparisons = 0

        if source_attrs.diameter and candidate_attrs.diameter:
            score += self._compare_strings(source_attrs.diameter, candidate_attrs.diameter)
            comparisons += 1

        if source_attrs.length and candidate_attrs.length:
            score += self._compare_strings(source_attrs.length, candidate_attrs.length)
            comparisons += 1
            
        if source_attrs.unit and candidate_attrs.unit:
            score += self._compare_strings(source_attrs.unit, candidate_attrs.unit)
            comparisons += 1

        return score / comparisons if comparisons > 0 else 0.5 # Neutral if no dimensions to compare

    def score_attributes(
        self, source_attrs: ExtractedAttributes, candidate: StandardMaterial, candidate_attrs: ExtractedAttributes
    ) -> float:
        """Score material, grade, manufacturer etc."""
        score = 0.0
        comparisons = 0

        if source_attrs.material and candidate.material:
            score += self._compare_strings(source_attrs.material, candidate.material)
            comparisons += 1

        if source_attrs.grade and candidate.grade:
            score += self._compare_strings(source_attrs.grade, candidate.grade)
            comparisons += 1

        return score / comparisons if comparisons > 0 else 0.5 # Neutral if no attributes to compare

    def determine_match_type(self, final_score: float) -> MatchType:
        """Convert a final float score (0-1) into a business-logic match type."""
        if final_score >= 0.95:
            return "EXACT"
        if final_score >= 0.85:
            return "EQUIVALENT"
        if final_score >= 0.70:
            return "SIMILAR"
        if final_score >= 0.50:
            return "REVIEW_REQUIRED"
        return "DIFFERENT"

    def evaluate_candidate(
        self,
        source_description: str,
        source_attrs: ExtractedAttributes,
        candidate: StandardMaterial,
    ) -> CandidateResult:
        """Evaluate a single candidate against the source material."""
        # 1. Semantic Score (Using embedding)
        # Note: In a real flow, candidate retrieval already gives cosine distance,
        # but here we compute it or assume we passed the semantic score directly.
        # For full purity, we recompute similarity here or accept it as parameter.
        
        candidate_desc = candidate.canonical_name + " " + (candidate.specifications or "")
        source_emb = generate_embedding(source_description)
        candidate_emb = candidate.embedding or generate_embedding(candidate_desc)
        
        import math
        # cosine similarity
        dot_product = sum(a * b for a, b in zip(source_emb, candidate_emb))
        mag_a = math.sqrt(sum(a * a for a in source_emb))
        mag_b = math.sqrt(sum(b * b for b in candidate_emb))
        similarity = dot_product / (mag_a * mag_b) if mag_a and mag_b else 0.0
        
        semantic_score = max(0.0, min(1.0, similarity))

        # 2. Extract structured attributes from candidate if not available on DB model directly
        candidate_attrs = extract_attributes(candidate_desc)
        
        # 3. Component Scores
        category_score = self.score_category(source_attrs, candidate)
        dimension_score = self.score_dimensions(source_attrs, candidate_attrs)
        attribute_score = self.score_attributes(source_attrs, candidate, candidate_attrs)

        # 4. Final Score
        final_score = (
            semantic_score * self.weights["semantic"]
            + attribute_score * self.weights["attribute"]
            + category_score * self.weights["category"]
            + dimension_score * self.weights["dimension"]
        )

        match_type = self.determine_match_type(final_score)

        return CandidateResult(
            candidate_id=candidate.id,
            semantic_score=Decimal(f"{semantic_score:.4f}"),
            attribute_score=Decimal(f"{attribute_score:.4f}"),
            category_score=Decimal(f"{category_score:.4f}"),
            dimension_score=Decimal(f"{dimension_score:.4f}"),
            final_score=Decimal(f"{final_score:.4f}"),
            match_type=match_type,
            explanation=f"Evaluated with semantic({semantic_score:.2f}), "
                        f"attr({attribute_score:.2f}), cat({category_score:.2f}), dim({dimension_score:.2f})."
        )
