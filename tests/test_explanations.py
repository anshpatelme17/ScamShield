import pytest

from app.config import REPORTING_GUIDANCE
from app.explanations import Explanation, explain
from app.models import (
    EvidenceSource,
    Finding,
    FindingCategory,
    FindingStatus,
    InputType,
    ScamCaseFile,
    VerdictCategory,
)
from app.verdict import determine_verdict

SHA = "a" * 64


def _case(findings=(), verdict=None):
    if verdict is None:
        verdict = determine_verdict(tuple(findings)).verdict
    return ScamCaseFile(
        case_id="case-1",
        input_type=InputType.TEXT,
        input_length=100,
        input_sha256=SHA,
        findings=tuple(findings),
        verdict=verdict,
        verdict_reasons=("reason",),
    )


def _finding(rule_id, action="Do X", limitation=None):
    return Finding(
        id=rule_id,
        title=f"Title {rule_id}",
        category=FindingCategory.OTHER,
        status=FindingStatus.RULE_MATCH,
        source=EvidenceSource.LOCAL_RULE,
        rule_id=rule_id,
        recommended_action=action,
        limitations=limitation,
        evidence=("quoted text from the submission",),
    )


def test_explain_requires_verdict():
    case = ScamCaseFile(
        case_id="case-1",
        input_type=InputType.TEXT,
        input_length=10,
        input_sha256=SHA,
        verdict=None,
    )
    with pytest.raises(ValueError):
        explain(case)


def test_explain_no_strong_signs_disclaims_safety():
    explanation = explain(_case())
    assert explanation.verdict is VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND
    assert "NOT proof" in explanation.summary
    assert REPORTING_GUIDANCE == explanation.reporting


def test_explain_collects_findings_and_actions():
    findings = (_finding("IN-KYC-001"), _finding("TXT-URGENCY-001", action="Do X"))
    explanation = explain(_case(findings, VerdictCategory.SUSPICIOUS))
    assert "IN-KYC-001: Title IN-KYC-001" in explanation.key_points
    assert "Do X" in explanation.actions
    assert explanation.headline == "Warning signs found"


def test_explain_defaults_action_when_no_finding_action():
    findings = (_finding("IN-KYC-001", action=None),)
    explanation = explain(_case(findings, VerdictCategory.SUSPICIOUS))
    assert explanation.actions


def test_explain_marks_evidence_as_untrusted():
    explanation = explain(_case((_finding("IN-KYC-001"),), VerdictCategory.SUSPICIOUS))
    assert any("untrusted input" in item for item in explanation.unverified)


def test_explanation_is_frozen():
    explanation = explain(_case())
    assert isinstance(explanation, Explanation)
    with pytest.raises(Exception):
        explanation.headline = "changed"
