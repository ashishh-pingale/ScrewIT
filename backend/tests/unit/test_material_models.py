"""Persistence tests for material-master model relationships."""

from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models import Material, MaterialMatch, ReviewDecision, StandardMaterial


@pytest.fixture
def session() -> Session:
    """Provide an isolated in-memory database for model relationship tests."""
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)
    database_session = session_factory()
    try:
        yield database_session
    finally:
        database_session.close()
        Base.metadata.drop_all(engine)


def test_material_master_models_persist_their_relationships(session: Session) -> None:
    standard_material = StandardMaterial(
        standard_code="STD-FASTENER-0001",
        canonical_name="Hex Bolt M10 x 50 mm",
        category="Fasteners",
        material="Steel",
        grade="8.8",
        specifications="M10; length 50 mm",
    )
    source_material = Material(
        cpse_name="Synthetic CPSE Fixture",
        original_code="LOCAL-BOLT-10-50",
        description="Hexagonal bolt M10 x 50 mm, grade 8.8",
        normalized_description="hex bolt m10 x 50 mm grade 8.8",
        category="Fasteners",
        material="Steel",
        grade="8.8",
        diameter=Decimal("10.000"),
        length=Decimal("50.000"),
        unit="mm",
        standard_material=standard_material,
        confidence_score=Decimal("0.9500"),
        status="pending_review",
    )
    material_match = MaterialMatch(
        source_material=source_material,
        candidate_material=standard_material,
        semantic_score=Decimal("0.9200"),
        attribute_score=Decimal("1.0000"),
        category_score=Decimal("1.0000"),
        dimension_score=Decimal("1.0000"),
        final_score=Decimal("0.9700"),
        match_type="candidate",
        status="pending_review",
    )
    review = ReviewDecision(
        match=material_match,
        decision="approved",
        reviewer="reviewer@example.test",
        notes="Synthetic fixture approved for relationship verification.",
    )
    session.add(review)
    session.commit()
    session.refresh(source_material)
    session.refresh(material_match)
    session.refresh(review)

    assert source_material.id is not None
    assert source_material.standard_material_id == standard_material.id
    assert source_material.standard_material is standard_material
    assert material_match.source_material is source_material
    assert material_match.candidate_material is standard_material
    assert material_match in source_material.candidate_matches
    assert material_match in standard_material.candidate_matches
    assert review.match is material_match
    assert review in material_match.review_decisions
    assert review.timestamp is not None
