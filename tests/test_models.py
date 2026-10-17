import hashlib

import pytest
from pydantic import ValidationError

from app.config import DEFAULT_DISCLAIMER
from app.models import (
    EvidenceSource,
    Finding,
    FindingCategory,
    FindingStatus,
    InputType,
    ScamCaseFile,
)

SHA = hashlib.sha256(b"sample").hexdigest()


def _finding(**overrides):
    data = {
        "id": "F-001",
        "title": "UPI PIN requested",
        "category": FindingCategory.UPI_PIN_REQUEST,
        "status": FindingStatus.RULE_MATCH,
        "source": EvidenceSource.LOCAL_RULE,
        "evidence": ("message asks the user to enter a UPI PIN",),
        "rule_id": "IN-UPI-001",
    }
    data.update(overrides)
    return data


def _case(**overrides):
    data = {
        "case_id": "case-1",
        "input_type": InputType.TEXT,
        "input_length": 42,
        "input_sha256": SHA,
    }
    data.update(overrides)
    return data


def test_valid_finding_built_from_strings():
    finding = Finding(**_finding(category="upi_pin_request", status="rule_match"))
    assert finding.category is FindingCategory.UPI_PIN_REQUEST
    assert finding.status is FindingStatus.RULE_MATCH


def test_finding_rejects_blank_title():
    with pytest.raises(ValidationError):
        Finding(**_finding(title="   "))


def test_finding_rejects_unknown_category():
    with pytest.raises(ValidationError):
        Finding(**_finding(category="totally_made_up"))


def test_finding_rejects_extra_fields():
    with pytest.raises(ValidationError):
        Finding(**_finding(unexpected="x"))


def test_finding_is_frozen():
    finding = Finding(**_finding())
    with pytest.raises(ValidationError):
        finding.title = "changed"


def test_case_file_minimal_and_defaults():
    case = ScamCaseFile(**_case())
    assert case.findings == ()
    assert case.disclaimer == DEFAULT_DISCLAIMER
    assert case.schema_version


def test_case_file_rejects_bad_sha256():
    with pytest.raises(ValidationError):
        ScamCaseFile(**_case(input_sha256="not-a-hash"))


def test_case_file_rejects_duplicate_finding_ids():
    with pytest.raises(ValidationError):
        ScamCaseFile(**_case(findings=(_finding(), _finding())))


def test_case_file_accepts_distinct_findings():
    case = ScamCaseFile(**_case(findings=(_finding(id="F-001"), _finding(id="F-002"))))
    assert len(case.findings) == 2


def test_case_file_rejects_negative_length():
    with pytest.raises(ValidationError):
        ScamCaseFile(**_case(input_length=-1))
