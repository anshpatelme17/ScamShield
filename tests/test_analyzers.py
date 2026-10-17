import pytest

from app.analyzers.india_rules import analyze_india_rules
from app.extractors import extract_indicators
from app.models import FindingCategory


def _rules(text):
    return analyze_india_rules(text, extract_indicators(text))


def _rule_ids(text):
    return {f.rule_id for f in _rules(text)}


HARD_NEGATIVE = (
    "Never share your OTP or UPI PIN with anyone. "
    "Your bank will never ask you for your PIN over the phone."
)


def test_hard_negative_not_flagged_for_secret_solicitation():
    assert "IN-SECRET-001" not in _rule_ids(HARD_NEGATIVE)


def test_hard_negative_yields_no_findings_at_all():
    assert _rules(HARD_NEGATIVE) == []


def test_upi_pin_request_flagged():
    findings = _rules("Enter your UPI PIN to receive the money.")
    assert "IN-SECRET-001" in {f.rule_id for f in findings}
    pin = next(f for f in findings if f.rule_id == "IN-SECRET-001")
    assert pin.category is FindingCategory.UPI_PIN_REQUEST


def test_otp_solicitation_flagged():
    findings = _rules("Please share the OTP you received on your phone.")
    otp = next(f for f in findings if f.rule_id == "IN-SECRET-001")
    assert otp.category is FindingCategory.OTP_CREDENTIAL_THEFT


@pytest.mark.parametrize(
    ("text", "rule_id"),
    [
        ("Your KYC is expiring today. Update now.", "IN-KYC-001"),
        ("Your account will be suspended. Click to verify.", "IN-SUSPEND-001"),
        ("Approve the collect request to receive money.", "IN-COLLECT-001"),
        (
            "CBI has registered a case. You are under digital arrest. Pay to avoid jail.",
            "IN-ARREST-001",
        ),
        (
            "Work from home part time job. Earn daily. Registration fee Rs.500 on Telegram.",
            "IN-JOB-001",
        ),
        ("Guaranteed return of 3x. Join our trading tips group.", "IN-INVEST-001"),
        ("Pre-approved loan of Rs.50000. Pay processing fee to release.", "IN-LOAN-001"),
        ("Your electricity will be disconnected tonight. Pay immediately.", "IN-ELEC-001"),
        ("Install this app to get your refund: http://refund.apk", "IN-APK-001"),
        (
            "I have your private video. Pay money or I will leak it to your family.",
            "IN-SEXTORT-001",
        ),
    ],
)
def test_india_category_rules_fire(text, rule_id):
    assert rule_id in _rule_ids(text)
