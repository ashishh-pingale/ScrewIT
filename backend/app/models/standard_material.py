"""Canonical, governed standard material identities."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from pgvector.sqlalchemy import Vector

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.material import Material
    from app.models.material_match import MaterialMatch


class StandardMaterial(Base):
    """A shared material identity that local CPSE records may map to."""

    __tablename__ = "standard_materials"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    standard_code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    canonical_name: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(String(255))
    material: Mapped[str | None] = mapped_column(String(255))
    grade: Mapped[str | None] = mapped_column(String(255))
    specifications: Mapped[str | None] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(384))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    materials: Mapped[list[Material]] = relationship(back_populates="standard_material")
    candidate_matches: Mapped[list[MaterialMatch]] = relationship(
        back_populates="candidate_material"
    )
