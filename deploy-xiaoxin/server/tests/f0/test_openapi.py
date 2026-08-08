"""F0 OpenAPI contract checks."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

REQUIRED_PATHS = {
    "/api/classes/{class_code}",
    "/api/session/enter",
    "/api/students/{student_id}/growth",
    "/api/students/{student_id}/pet",
    "/api/students/{student_id}/pet/portrait",
    "/api/jobs/{job_id}",
    "/api/students/{student_id}/letters",
    "/api/students/{student_id}/letters/generate",
    "/api/lesson/generate",
    "/api/lessons/{lesson_id}",
    "/api/classes/{class_code}/session/start",
    "/api/classes/{class_code}/session/control",
    "/api/classes/{class_code}/session/status",
    "/api/classes/{class_code}/academic",
    "/api/classes/{class_code}/lessons",
    "/api/classes/{class_code}/pets",
}


def test_openapi_endpoint_reachable() -> None:
    response = client.get("/api/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data["info"]["version"] == "2.1.0"


def test_openapi_contains_all_routes() -> None:
    response = client.get("/api/openapi.json")
    data = response.json()
    paths = set(data["paths"].keys())
    missing = REQUIRED_PATHS - paths
    assert not missing, f"OpenAPI 缺少路径: {missing}"


def test_openapi_has_required_schemas() -> None:
    response = client.get("/api/openapi.json")
    data = response.json()
    required = {
        "ClassInfo",
        "StudentProfile",
        "EnterReq",
        "EnterResp",
        "GrowthView",
        "PetState",
        "Commitment",
        "ScoreCard",
        "EvidenceItem",
        "AcademicRecord",
        "SubjectScore",
        "Letter",
        "LessonGenReq",
        "LessonPlan",
        "LessonSummary",
        "ControlReq",
        "ClassroomStatus",
        "JobRef",
        "JobStatus",
        "ErrorEnvelope",
    }
    missing = required - set(data.get("components", {}).get("schemas", {}).keys())
    assert not missing, f"OpenAPI 缺少 schema: {missing}"
