"""Create material master and review workflow tables.

Revision ID: 0001_material_master
Revises:
Create Date: 2026-09-01
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0001_material_master"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create source, standard, match, and review-decision tables."""
    op.create_table(
        "standard_materials",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("standard_code", sa.String(length=100), nullable=False),
        sa.Column("canonical_name", sa.String(length=500), nullable=False),
        sa.Column("category", sa.String(length=255), nullable=True),
        sa.Column("material", sa.String(length=255), nullable=True),
        sa.Column("grade", sa.String(length=255), nullable=True),
        sa.Column("specifications", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("standard_code"),
    )
    op.create_index("ix_standard_materials_standard_code", "standard_materials", ["standard_code"])

    op.create_table(
        "materials",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("cpse_name", sa.String(length=255), nullable=False),
        sa.Column("original_code", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("normalized_description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=255), nullable=True),
        sa.Column("material", sa.String(length=255), nullable=True),
        sa.Column("grade", sa.String(length=255), nullable=True),
        sa.Column("diameter", sa.Numeric(precision=12, scale=3), nullable=True),
        sa.Column("length", sa.Numeric(precision=12, scale=3), nullable=True),
        sa.Column("width", sa.Numeric(precision=12, scale=3), nullable=True),
        sa.Column("height", sa.Numeric(precision=12, scale=3), nullable=True),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.Column("manufacturer", sa.String(length=255), nullable=True),
        sa.Column("part_number", sa.String(length=255), nullable=True),
        sa.Column("standard_material_id", sa.Uuid(), nullable=True),
        sa.Column("confidence_score", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)", name="ck_materials_confidence_score_range"),
        sa.ForeignKeyConstraint(["standard_material_id"], ["standard_materials.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_materials_cpse_name", "materials", ["cpse_name"])
    op.create_index("ix_materials_original_code", "materials", ["original_code"])
    op.create_index("ix_materials_part_number", "materials", ["part_number"])
    op.create_index("ix_materials_standard_material_id", "materials", ["standard_material_id"])
    op.create_index("ix_materials_status", "materials", ["status"])

    op.create_table(
        "material_matches",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("source_material_id", sa.Uuid(), nullable=False),
        sa.Column("candidate_material_id", sa.Uuid(), nullable=False),
        sa.Column("semantic_score", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("attribute_score", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("category_score", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("dimension_score", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("final_score", sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column("match_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("semantic_score IS NULL OR (semantic_score >= 0 AND semantic_score <= 1)", name="ck_material_matches_semantic_score_range"),
        sa.CheckConstraint("attribute_score IS NULL OR (attribute_score >= 0 AND attribute_score <= 1)", name="ck_material_matches_attribute_score_range"),
        sa.CheckConstraint("category_score IS NULL OR (category_score >= 0 AND category_score <= 1)", name="ck_material_matches_category_score_range"),
        sa.CheckConstraint("dimension_score IS NULL OR (dimension_score >= 0 AND dimension_score <= 1)", name="ck_material_matches_dimension_score_range"),
        sa.CheckConstraint("final_score >= 0 AND final_score <= 1", name="ck_material_matches_final_score_range"),
        sa.ForeignKeyConstraint(["candidate_material_id"], ["standard_materials.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_material_id"], ["materials.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_material_matches_candidate_material_id", "material_matches", ["candidate_material_id"])
    op.create_index("ix_material_matches_source_material_id", "material_matches", ["source_material_id"])
    op.create_index("ix_material_matches_status", "material_matches", ["status"])

    op.create_table(
        "review_decisions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("match_id", sa.Uuid(), nullable=False),
        sa.Column("decision", sa.String(length=50), nullable=False),
        sa.Column("reviewer", sa.String(length=255), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["match_id"], ["material_matches.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_review_decisions_match_id", "review_decisions", ["match_id"])


def downgrade() -> None:
    """Drop material-master tables in dependency order."""
    op.drop_index("ix_review_decisions_match_id", table_name="review_decisions")
    op.drop_table("review_decisions")
    op.drop_index("ix_material_matches_status", table_name="material_matches")
    op.drop_index("ix_material_matches_source_material_id", table_name="material_matches")
    op.drop_index("ix_material_matches_candidate_material_id", table_name="material_matches")
    op.drop_table("material_matches")
    op.drop_index("ix_materials_status", table_name="materials")
    op.drop_index("ix_materials_standard_material_id", table_name="materials")
    op.drop_index("ix_materials_part_number", table_name="materials")
    op.drop_index("ix_materials_original_code", table_name="materials")
    op.drop_index("ix_materials_cpse_name", table_name="materials")
    op.drop_table("materials")
    op.drop_index("ix_standard_materials_standard_code", table_name="standard_materials")
    op.drop_table("standard_materials")
