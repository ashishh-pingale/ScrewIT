"""Add pgvector extension and embedding column.

Revision ID: 0002_add_vector_extension
Revises: 0001_material_master
Create Date: 2026-09-01
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = "0002_add_vector_extension"
down_revision: str | None = "0001_material_master"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # We must execute CREATE EXTENSION if it doesn't exist
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    op.add_column("standard_materials", sa.Column("embedding", Vector(384), nullable=True))


def downgrade() -> None:
    op.drop_column("standard_materials", "embedding")
    op.execute("DROP EXTENSION IF EXISTS vector;")
