"""Phone-number input: classification, analyzer honesty, and case-file output."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.models import InputType
from app.router import build_case_file
from app.validation import detect_input_type, normalize_input


@pytest.fixture()
def client():
    return TestClient(create_app())


def test_detect_phone_number_forms():
    assert detect_input_type("9876543210") is InputType.PHONENUMBER
    assert detect_input_type("+919876543210") is InputType.PHONENUMBER
    assert detect_input_type("+91 98765 43210") is InputType.PHONENUMBER
    assert detect_input_type("+91-98765-43210") is InputType.PHONENUMBER
    assert detect_input_type("00919876543210") is InputType.PHONENUMBER
    assert detect_input_type("098765 43210") is InputType.PHONENUMBER


def test_detect_phone_number_ambiguity_stays_text():
    assert detect_input_type("hello there") is InputType.TEXT
    assert detect_input_type("just-a-word") is InputType.TEXT
    assert detect_input_type("Order id 12345") is InputType.TEXT
    assert detect_input_type("1930") is InputType.TEXT
    assert detect_input_type("https://example.com and more words") is InputType.TEXT


def test_phone_case_file_valid_number():
    case = build_case_file(normalize_input("+91 98765 43210"))
    assert case.input_type is InputType.PHONENUMBER
    finding = next(f for f in case.findings if f.rule_id == "IN-PHONE-FMT-001")
    assert "+919876543210" in "".join(finding.evidence)
    assert "reputation could not be verified" in finding.limitations
    # Honest verdict: format validation alone is never a scam signal.
    assert case.verdict.value == "no_strong_warning_signs_found"


def test_phone_case_file_invalid_number_like_submission():
    case = build_case_file(normalize_input("123456789012"))
    assert case.input_type is InputType.PHONENUMBER
    finding = next(f for f in case.findings if f.rule_id == "IN-PHONE-FMT-001")
    assert "not a valid" in finding.title.lower()
    assert "reputation could not be verified" in finding.limitations


def test_phone_analyzer_never_flags_scammer():
    # A valid, unfamiliar number must not produce any scam verdict signal.
    case = build_case_file(normalize_input("9123456780"))
    strong = [f for f in case.findings if f.status.value == "rule_match"]
    assert strong == []
    assert case.verdict.value == "no_strong_warning_signs_found"


def test_api_phone_input(client):
    response = client.post("/api/analyze", json={"text": "+91 98765 43210"})
    assert response.status_code == 200
    body = response.json()
    assert body["case_file"]["input_type"] == "phone_number"
    assert any(f["rule_id"] == "IN-PHONE-FMT-001" for f in body["case_file"]["findings"])
    assert body["case_file"]["verdict"] == "no_strong_warning_signs_found"
