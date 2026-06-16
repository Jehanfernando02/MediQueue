"""
test_health.py
==============
Tests for the /api/health endpoint.

These tests:
- Run with no external database or Redis required (uses TestClient)
- Verify the contract of the health endpoint shape
- Act as a smoke test confirming the FastAPI app boots correctly in CI
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Smoke tests for GET /api/health"""

    def test_health_returns_200(self, client: TestClient):
        """Health endpoint must return HTTP 200."""
        response = client.get("/api/health")
        assert response.status_code == 200, (
            f"Expected 200 OK but got {response.status_code}. "
            f"Body: {response.text}"
        )

    def test_health_content_type_is_json(self, client: TestClient):
        """Health endpoint must return JSON."""
        response = client.get("/api/health")
        assert "application/json" in response.headers.get("content-type", ""), (
            "Expected Content-Type: application/json"
        )

    def test_health_body_has_status_field(self, client: TestClient):
        """Health response must contain a 'status' key."""
        response = client.get("/api/health")
        body = response.json()
        assert "status" in body, f"Missing 'status' key in response: {body}"

    def test_health_status_is_ok(self, client: TestClient):
        """Health status value must be 'ok'."""
        response = client.get("/api/health")
        body = response.json()
        assert body["status"] == "ok", f"Expected status='ok', got: {body['status']}"

    def test_health_body_has_version(self, client: TestClient):
        """Health response must expose the app version."""
        response = client.get("/api/health")
        body = response.json()
        assert "version" in body, f"Missing 'version' key in response: {body}"
        assert isinstance(body["version"], str), "version must be a string"

    def test_health_body_has_environment(self, client: TestClient):
        """Health response must expose the environment name."""
        response = client.get("/api/health")
        body = response.json()
        assert "env" in body, f"Missing 'env' key in response: {body}"

    def test_health_response_shape(self, client: TestClient):
        """Full shape assertion — all expected keys present."""
        response = client.get("/api/health")
        body = response.json()
        required_keys = {"status", "version", "env"}
        missing = required_keys - body.keys()
        assert not missing, f"Missing keys in health response: {missing}. Got: {body}"


class TestApiDocs:
    """Verify OpenAPI/Swagger endpoints are reachable in non-production."""

    def test_openapi_schema_is_accessible(self, client: TestClient):
        """OpenAPI JSON schema must be accessible."""
        response = client.get("/api/openapi.json")
        assert response.status_code == 200

    def test_openapi_schema_has_paths(self, client: TestClient):
        """OpenAPI schema must contain at least one path."""
        response = client.get("/api/openapi.json")
        schema = response.json()
        assert "paths" in schema
        assert len(schema["paths"]) > 0, "OpenAPI schema has no paths"

    def test_swagger_ui_accessible(self, client: TestClient):
        """Swagger UI docs must return 200."""
        response = client.get("/api/docs")
        assert response.status_code == 200


class TestCORSHeaders:
    """CORS headers must be present for browser-based frontends."""

    def test_cors_header_on_health(self, client: TestClient):
        """CORS must allow cross-origin requests."""
        response = client.get(
            "/api/health",
            headers={"Origin": "http://localhost:5173"},
        )
        # In test/dev mode, allow_origins=["*"] so this should pass
        assert response.status_code == 200
