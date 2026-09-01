"""Vector retrieval of semantic material candidates."""

from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.standard_material import StandardMaterial


def retrieve_semantic_candidates(
    db: Session,
    embedding: list[float],
    limit: int = 10,
) -> Sequence[StandardMaterial]:
    """Retrieve top-K standard materials most semantically similar to the embedding.

    Uses cosine distance (<=>) provided by pgvector.
    
    Args:
        db: SQLAlchemy session.
        embedding: A 384-dimensional query embedding.
        limit: Max candidates to return.
        
    Returns:
        List of StandardMaterial objects ordered by semantic similarity.
    """
    stmt = (
        select(StandardMaterial)
        .order_by(StandardMaterial.embedding.cosine_distance(embedding))
        .limit(limit)
    )
    return db.scalars(stmt).all()
