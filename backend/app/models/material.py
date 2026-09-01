"""CPSE source material-master records."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.material_match import MaterialMatch
    from app.models.standard_material import StandardMaterial


class Material(Base):
    """An immutable-source-oriented record supplied by a CPSE material master."""

    __tablename__ = "materials"
    __table_args__ = (
        CheckConstraint(
            "confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)",
            name="ck_materials_confidence_score_range",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    cpse_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    original_code: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(255))
    material: Mapped[str | None] = mapped_column(String(255))
    grade: Mapped[str | None] = mapped_column(String(255))
    diameter: Mapped[Decimal | None] = mapped_column(Numeric(12, 3))
    length: Mapped[Decimal | None] = mapped_column(Numeric(12, 3))
    width: Mapped[Decimal | None] = mapped_column(Numeric(12, 3))
    height: Mapped[Decimal | None] = mapped_column(Numeric(12, 3))
    unit: Mapped[str | None] = mapped_column(String(50))
    manufacturer: Mapped[str | None] = mapped_column(String(255))
    part_number: Mapped[str | None] = mapped_column(String(255), index=True)
    standard_material_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("standard_materials.id", ondelete="SET NULL"), index=True
    )
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending_review", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    standard_material: Mapped[StandardMaterial | None] = relationship(back_populates="materials")
    candidate_matches: Mapped[list[MaterialMatch]] = relationship(back_populates="source_material")
