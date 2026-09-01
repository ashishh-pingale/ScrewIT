"""Tests for foundation health endpoints."""

from fastapi.testclient import TestClient


def test_service_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_database_health_returns_connected_when_query_succeeds(client: TestClient) -> None:
    response = client.get("/api/v1/health/database")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}
