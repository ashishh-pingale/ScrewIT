"""Auditable candidate match score records."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.material import Material
    from app.models.review_decision import ReviewDecision
    from app.models.standard_material import StandardMaterial


class MaterialMatch(Base):
    """A proposed link from a source material to a standard material candidate."""

    __tablename__ = "material_matches"
    __table_args__ = (
        CheckConstraint(
            "semantic_score IS NULL OR (semantic_score >= 0 AND semantic_score <= 1)",
            name="ck_material_matches_semantic_score_range",
        ),
        CheckConstraint(
            "attribute_score IS NULL OR (attribute_score >= 0 AND attribute_score <= 1)",
            name="ck_material_matches_attribute_score_range",
        ),
        CheckConstraint(
            "category_score IS NULL OR (category_score >= 0 AND category_score <= 1)",
            name="ck_material_matches_category_score_range",
        ),
        CheckConstraint(
            "dimension_score IS NULL OR (dimension_score >= 0 AND dimension_score <= 1)",
            name="ck_material_matches_dimension_score_range",
        ),
        CheckConstraint(
            "final_score >= 0 AND final_score <= 1",
            name="ck_material_matches_final_score_range",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    source_material_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_material_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("standard_materials.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    semantic_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    attribute_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    category_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    dimension_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    final_score: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    match_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending_review", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    source_material: Mapped[Material] = relationship(back_populates="candidate_matches")
    candidate_material: Mapped[StandardMaterial] = relationship(back_populates="candidate_matches")
    review_decisions: Mapped[list[ReviewDecision]] = relationship(back_populates="match")
