"""Shared fixtures for backend tests."""

from collections.abc import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Provide an API client with a mocked successful database dependency."""
    database_session = MagicMock()

    def override_get_db() -> Generator[MagicMock, None, None]:
        yield database_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
