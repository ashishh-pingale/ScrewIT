"""Schemas for material matching candidate results."""

from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


MatchType = Literal["EXACT", "EQUIVALENT", "SIMILAR", "REVIEW_REQUIRED", "DIFFERENT"]


class CandidateResult(BaseModel):
    """A proposed candidate match from the matching engine."""

    candidate_id: UUID = Field(description="The UUID of the canonical standard material.")
    semantic_score: Decimal = Field(description="Score derived from embedding similarity (0.0 to 1.0).")
    attribute_score: Decimal = Field(description="Score derived from structured attributes (0.0 to 1.0).")
    category_score: Decimal = Field(description="Score derived from category compatibility (0.0 to 1.0).")
    dimension_score: Decimal = Field(description="Score derived from dimensions and units (0.0 to 1.0).")
    final_score: Decimal = Field(description="Weighted final score (0.0 to 1.0).")
    match_type: MatchType = Field(description="Categorization of the match confidence.")
    explanation: str = Field(description="Human-readable explanation of how the score was derived.")
