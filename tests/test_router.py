from app.models import InputType
from app.router import build_case_file, run_analysis
from app.validation import normalize_input

HARD_NEGATIVE = (
    "Never share your OTP or UPI PIN with anyone. "
    "Your bank will never ask you for your PIN over the phone."
)


def test_run_analysis_assigns_sequential_ids():
    normalized = normalize_input(
        "Your KYC is expiring. Approve the collect request. Pay Rs.500 immediately."
    )
    findings = run_analysis(normalized)
    assert [f.id for f in findings] == [
        f"F-{i:03d}" for i in range(1, len(findings) + 1)
    ]


def test_rule_fires_once_for_repeated_matches():
    normalized = normalize_input(
        "Guaranteed return. Join trading tips group for guaranteed return today."
    )
    findings = run_analysis(normalized)
    assert len([f for f in findings if f.rule_id == "IN-INVEST-001"]) == 1


def test_hard_negative_through_router_has_no_secret_rule():
    normalized = normalize_input(HARD_NEGATIVE)
    findings = run_analysis(normalized)
    assert all(f.rule_id != "IN-SECRET-001" for f in findings)


def test_build_case_file_metadata():
    normalized = normalize_input(
        "Your account will be suspended. Verify now https://bit.ly/kyc-check"
    )
    case = build_case_file(normalized)
    assert case.input_type is InputType.TEXT
    assert case.input_length == len(normalized.text)
    assert case.input_sha256 == normalized.sha256
    assert case.case_id
    assert case.disclaimer
    assert len(case.findings) >= 2


def test_url_input_type_run_through_router():
    normalized = normalize_input("https://192.168.0.10/otp/verify")
    assert normalized.input_type is InputType.URL
    findings = run_analysis(normalized)
    rule_ids = {f.rule_id for f in findings}
    assert {"URL-IP-001", "URL-KEYWORD-001"} <= rule_ids


def test_benign_url_yields_no_findings():
    normalized = normalize_input("https://www.example.com/about-us")
    assert run_analysis(normalized) == []
