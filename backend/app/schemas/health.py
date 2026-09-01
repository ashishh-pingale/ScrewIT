"""Health endpoint response contracts."""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Service health response."""

    status: Literal["ok"]


class DatabaseHealthResponse(HealthResponse):
    """Database connectivity health response."""

    database: Literal["connected"]
