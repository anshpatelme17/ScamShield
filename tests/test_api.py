import pytest
from fastapi.testclient import TestClient

from app.main import create_app

HARD_NEGATIVE = (
    "Never share your OTP or UPI PIN with anyone. "
    "Your bank will never ask you for your PIN over the phone."
)


@pytest.fixture()
def client():
    return TestClient(create_app())


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_suspicious_text(client):
    response = client.post(
        "/api/analyze",
        json={"text": "Enter your UPI PIN to receive the money. Act now!"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["case_file"]["verdict"] == "highly_suspicious"
    assert body["explanation"]["headline"] == "Strong scam indicators found"
    assert body["explanation"]["reporting"]
    assert body["case_file"]["disclaimer"]
    assert body["case_file"]["findings"]


def test_analyze_url(client):
    response = client.post(
        "/api/analyze",
        json={"text": "http://192.168.0.10/otp/verify now or account blocked"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["case_file"]["verdict"] == "suspicious"
    rule_ids = [f["rule_id"] for f in body["case_file"]["findings"]]
    assert "URL-IP-001" in rule_ids
    assert "IN-SUSPEND-001" in rule_ids


def test_analyze_hard_negative_is_not_suspicious(client):
    response = client.post("/api/analyze", json={"text": HARD_NEGATIVE})
    assert response.status_code == 200
    body = response.json()
    assert body["case_file"]["verdict"] == "no_strong_warning_signs_found"
    rule_ids = [f["rule_id"] for f in body["case_file"]["findings"]]
    assert "IN-SECRET-001" not in rule_ids


def test_analyze_rejects_empty_text(client):
    response = client.post("/api/analyze", json={"text": "   "})
    assert response.status_code == 422


def test_analyze_rejects_over_length(client):
    response = client.post("/api/analyze", json={"text": "a" * 10001})
    assert response.status_code == 422


def test_analyze_rejects_non_string_text(client):
    response = client.post("/api/analyze", json={"text": 123})
    assert response.status_code == 422


def test_analyze_missing_field(client):
    response = client.post("/api/analyze", json={})
    assert response.status_code == 422


def test_unparseable_url_is_unable_to_determine(client):
    response = client.post("/api/analyze", json={"text": "http:///path"})
    assert response.status_code == 200
    body = response.json()
    assert body["case_file"]["verdict"] == "unable_to_determine"
    assert body["explanation"]["headline"] == "Unable to determine"


def test_response_shape_has_evidence_fields(client):
    response = client.post(
        "/api/analyze",
        json={"text": "Approve the collect request to receive money."},
    )
    body = response.json()
    finding = body["case_file"]["findings"][0]
    for key in ("id", "title", "category", "status", "source", "evidence", "rule_id"):
        assert key in finding
    assert body["case_file"]["verdict_reasons"]
