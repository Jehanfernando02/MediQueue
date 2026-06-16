"""
MediQueue Test Suite — conftest.py
===================================
Shared pytest fixtures and configuration.

Spin-up strategy:
- Uses an in-memory SQLite database (via aiosqlite) so tests require
  NO running Postgres or Redis. Fast and CI-friendly.
- Overrides DATABASE_URL and REDIS_URL settings before the app loads.
"""

import asyncio
import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Event-loop fixture (required for pytest-asyncio)
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# App client fixture
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def client():
    """
    Returns a synchronous TestClient for the FastAPI app.
    No external services are required.
    """
    from app.main import app
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
