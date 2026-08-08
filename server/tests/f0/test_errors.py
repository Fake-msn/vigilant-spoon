"""F0 error envelope checks."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_validation_error_returns_envelope() -> None:
    response = client.post("/api/session/enter", json={})
    assert response.status_code == 422
    data = response.json()
    assert data["code"] == "VALIDATION_ERROR"
    assert "message" in data
    assert "details" in data


def test_401_returns_envelope() -> None:
    response = client.get("/api/students/demo/growth")
    assert response.status_code == 401
    data = response.json()
    assert data["code"] == "TOKEN_INVALID"
