import pytest

from app.models import (
    Confidence,
    EvidenceSource,
    Finding,
    FindingCategory,
    FindingStatus,
    VerdictCategory,
)
from app.verdict import VerdictResult, determine_verdict


def _finding(rule_id, category=FindingCategory.OTHER, status=FindingStatus.RULE_MATCH):
    return Finding(
        id=rule_id,
        title="t",
        category=category,
        status=status,
        source=EvidenceSource.LOCAL_RULE,
        rule_id=rule_id,
        confidence=Confidence.LOW,
    )


def test_empty_findings_is_no_strong_warning_signs():
    result = determine_verdict(())
    assert result.verdict is VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND


def test_strong_rule_beats_everything():
    findings = (
        _finding("IN-SECRET-001", FindingCategory.UPI_PIN_REQUEST),
        _finding("URL-ERR-001", status=FindingStatus.CHECK_FAILED),
    )
    assert determine_verdict(findings).verdict is VerdictCategory.HIGHLY_SUSPICIOUS


def test_medium_india_rule_is_suspicious():
    result = determine_verdict((_finding("IN-KYC-001"),))
    assert result.verdict is VerdictCategory.SUSPICIOUS


def test_two_distinct_url_anomalies_are_suspicious():
    findings = (_finding("URL-IP-001"), _finding("URL-SHORT-001"))
    assert determine_verdict(findings).verdict is VerdictCategory.SUSPICIOUS


def test_single_url_anomaly_is_not_suspicious():
    result = determine_verdict((_finding("URL-HTTP-001"),))
    assert result.verdict is VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND
    assert "URL-HTTP-001" in result.reasons[0]


def test_three_text_signals_are_suspicious():
    findings = (
        _finding("TXT-URGENCY-001"),
        _finding("TXT-MONEY-001"),
        _finding("TXT-DATA-001"),
    )
    assert determine_verdict(findings).verdict is VerdictCategory.SUSPICIOUS


def test_two_text_signals_are_not_suspicious():
    findings = (_finding("TXT-URGENCY-001"), _finding("TXT-MONEY-001"))
    assert determine_verdict(findings).verdict is VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND


def test_check_failed_is_unable_to_determine():
    findings = (
        _finding("URL-ERR-001", status=FindingStatus.CHECK_FAILED),
        _finding("TXT-URGENCY-001"),
    )
    assert determine_verdict(findings).verdict is VerdictCategory.UNABLE_TO_DETERMINE


def test_check_failed_finding_not_counted_as_anomaly():
    findings = (_finding("URL-ERR-001", status=FindingStatus.CHECK_FAILED),)
    result = determine_verdict(findings)
    assert result.verdict is VerdictCategory.UNABLE_TO_DETERMINE


def test_result_is_frozen():
    result = determine_verdict(())
    assert isinstance(result, VerdictResult)
    with pytest.raises(Exception):
        result.verdict = VerdictCategory.SUSPICIOUS
