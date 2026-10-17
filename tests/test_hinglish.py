"""Hinglish/Devanagari rule tests (Phase 9).

Covers both language layers: module-level rule behaviour, and end-to-end
verdicts through the router. Hard negatives include a Devanagari bank
security warning and a Latin-script Hinglish OTP warning — these must not
be flagged.
"""

from app.analyzers.hinglish_rules import analyze_hinglish_rules
from app.extractors import extract_indicators
from app.models import VerdictCategory
from app.router import build_case_file
from app.validation import normalize_input

DEVANAGARI_WARNING = (
    "अपना OTP या UPI PIN किसी से शेयर न करें। "
    "आपका बैंक कभी भी आपसे ओटीपी या पिन नहीं मांगेगा।"
)
HINGLISH_WARNING = (
    "Paise lene ke liye UPI PIN daalne ki zaroorat nahi hoti. "
    "Kabhi pin daalein na."
)


def _rules(text: str):
    return {f.rule_id for f in analyze_hinglish_rules(text, extract_indicators(text))}


def test_otp_solicitation_hinglish_fires():
    assert "IN-H-SECRET-001" in _rules("Apna OTP share karein taaki delivery verify ho sake.")


def test_upi_pin_solicitation_hinglish_fires():
    rules = _rules("Paise lene ke liye apna UPI PIN daalein aur screen par confirm karein.")
    assert "IN-H-SECRET-001" in rules


def test_otp_solicitation_devanagari_fires():
    assert "IN-H-SECRET-001" in _rules("अपना ओटीपी शेयर करें और पैसे मिलेंगे।")


def test_devanagari_warning_hard_negative():
    assert "IN-H-SECRET-001" not in _rules(DEVANAGARI_WARNING)


def test_hinglish_warning_hard_negative():
    assert "IN-H-SECRET-001" not in _rules(HINGLISH_WARNING)


def test_english_never_share_warning_not_flagged():
    text = "Never share your OTP or UPI PIN with anyone. Your bank will never ask you for it."
    assert "IN-H-SECRET-001" not in _rules(text)


def test_postal_pin_code_is_not_a_credential():
    assert _rules("Aapka pin code 110001 hai, parcel 2 din me pahunch jayega.") == set()


def test_collect_request_hinglish_fires():
    assert "IN-H-COLLECT-001" in _rules(
        "Aapke account me payment request aaya hai. Collect request approve karein."
    )


def test_kyc_with_expiry_language_fires():
    rules = _rules("KYC khatam hone wala hai. Turant update karein warna account band.")
    assert "IN-H-KYC-001" in rules


def test_benign_kyc_meeting_not_flagged():
    rules = _rules("Aaj shaam me meeting hai. Video call pe join karke batana.")
    assert not rules


def test_suspend_threat_hinglish_fires():
    assert "IN-H-SUSPEND-001" in _rules(
        "Aapka bank account 24 ghante me suspend ho jayega. Turant verify karein."
    )


def test_digital_arrest_hinglish_fires():
    assert "IN-H-ARREST-001" in _rules(
        "CP Mumbai Cyber Cell: aap digital arrest me hain. "
        "Case clear karein funds transfer karen."
    )


def test_job_with_registration_fee_hinglish_fires():
    assert "IN-H-JOB-001" in _rules(
        "Ghar baithe kaam hai. Registration fee dena hoga Telegram par."
    )


def test_investment_claim_hinglish_fires():
    assert "IN-H-INVEST-001" in _rules(
        "Guaranteed return 5x. Hamare trading tips group join karein aur paisa double karein."
    )


def test_loan_with_fee_hinglish_fires():
    assert "IN-H-LOAN-001" in _rules(
        "Aapka pre-approved loan ready hai. Thodi processing fee jama karein."
    )


def test_electricity_threat_hinglish_fires():
    assert "IN-H-ELEC-001" in _rules(
        "Bijli aaj raat 12 baje cut jayegi. Bakaya bill turant jama karein."
    )


def test_apk_reference_hinglish_fires():
    assert "IN-H-APK-001" in _rules(
        "Reward app ka APK: http://win-reward.xyz/app.apk. Claim karne ke liye install karein."
    )


def test_sextortion_hinglish_fires():
    assert "IN-H-SEXTORT-001" in _rules(
        "Maine aapka private video call record kar liya. Paise bhejo warna viral kar dunga."
    )


def test_router_devanagari_otp_scam_is_highly_suspicious():
    case = build_case_file(normalize_input("अपना ओटीपी शेयर करें और पैसे मिलेंगे।"))
    assert case.verdict is VerdictCategory.HIGHLY_SUSPICIOUS


def test_router_devanagari_warning_is_not_flagged():
    case = build_case_file(normalize_input(DEVANAGARI_WARNING))
    assert all(f.rule_id != "IN-H-SECRET-001" for f in case.findings)
    assert not any(
        f.rule_id.startswith("IN-") for f in case.findings
    )


def test_router_hinglish_kyc_is_suspicious():
    case = build_case_file(
        normalize_input(
            "Aapka bank account ka KYC khatam hone wala hai. "
            "Turant update karein: http://sbi-kyc-update.top/verify"
        )
    )
    assert case.verdict is VerdictCategory.SUSPICIOUS


def test_router_hinglish_warning_verdict_is_clean():
    case = build_case_file(normalize_input(HINGLISH_WARNING))
    assert case.verdict is VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND
