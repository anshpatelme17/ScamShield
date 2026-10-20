"""Structured evidence model for the Scam Case File.

All content derived from user submissions is treated as untrusted data.
These models describe evidence; they do not decide a verdict.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.config import DEFAULT_DISCLAIMER, SCHEMA_VERSION


class InputType(str, Enum):
    TEXT = "text"
    URL = "url"
    PHONENUMBER = "phone_number"
    IMAGE = "image"


class FindingCategory(str, Enum):
    BANK_KYC_IMPERSONATION = "bank_kyc_impersonation"
    ACCOUNT_SUSPENSION = "account_suspension"
    UPI_COLLECT_REQUEST = "upi_collect_request"
    UPI_PIN_REQUEST = "upi_pin_request"
    OTP_CREDENTIAL_THEFT = "otp_credential_theft"
    DIGITAL_ARREST = "digital_arrest"
    FAKE_JOB_TASK = "fake_job_task"
    INVESTMENT_TRADING = "investment_trading"
    FAKE_LOAN = "fake_loan"
    ELECTRICITY_DISCONNECTION = "electricity_disconnection"
    MALICIOUS_APK = "malicious_apk"
    SEXTORTION = "sextortion"
    URL_ANOMALY = "url_anomaly"
    URGENCY_PRESSURE = "urgency_pressure"
    OTHER = "other"


class FindingStatus(str, Enum):
    OBSERVED = "observed"
    RULE_MATCH = "rule_match"
    UNVERIFIED = "unverified"
    CHECK_FAILED = "check_failed"
    NOT_APPLICABLE = "not_applicable"


class EvidenceSource(str, Enum):
    SUBMITTED_INPUT = "submitted_input"
    LOCAL_RULE = "local_rule"
    EXTERNAL_INTEL = "external_intel"


class Confidence(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class VerdictCategory(str, Enum):
    HIGHLY_SUSPICIOUS = "highly_suspicious"
    SUSPICIOUS = "suspicious"
    NO_STRONG_WARNING_SIGNS_FOUND = "no_strong_warning_signs_found"
    UNABLE_TO_DETERMINE = "unable_to_determine"


class ReasonSpec(BaseModel):
    """Machine-readable verdict reason for localized frontend rendering.

    `key` is a stable translation key (e.g. `verdictreason.strong`); `args`
    carries the rule ids or counts the template interpolates. The raw English
    sentence stays available in `verdict_reasons` for export and fallback.
    """

    model_config = ConfigDict(extra="forbid", frozen=True)

    key: str = Field(min_length=1, max_length=64)
    args: tuple[str, ...] = ()


class Finding(BaseModel):
    """A single, attributable piece of evidence about the submitted input."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    id: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=200)
    category: FindingCategory
    status: FindingStatus
    source: EvidenceSource
    evidence: tuple[str, ...] = ()
    rule_id: str | None = Field(default=None, max_length=64)
    limitations: str | None = Field(default=None, max_length=1000)
    recommended_action: str | None = Field(default=None, max_length=1000)
    confidence: Confidence | None = None

    @field_validator("id", "title")
    @classmethod
    def _no_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be blank")
        return stripped


class ScamCaseFile(BaseModel):
    """The evidence-backed investigation artifact for one submission."""

    model_config = ConfigDict(extra="forbid")

    case_id: str = Field(min_length=1, max_length=64)
    schema_version: str = Field(default=SCHEMA_VERSION, max_length=16)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    input_type: InputType
    input_length: int = Field(ge=0)
    input_sha256: str = Field(min_length=64, max_length=64)
    findings: tuple[Finding, ...] = ()
    limitations: tuple[str, ...] = ()
    checks_not_completed: tuple[str, ...] = ()
    verdict: VerdictCategory | None = None
    verdict_reasons: tuple[str, ...] = ()
    verdict_reason_specs: tuple[ReasonSpec, ...] = ()
    disclaimer: str = DEFAULT_DISCLAIMER

    @field_validator("input_sha256")
    @classmethod
    def _hex_sha256(cls, value: str) -> str:
        if len(value) != 64 or any(c not in "0123456789abcdef" for c in value.lower()):
            raise ValueError("must be a 64-character lowercase hex sha256 digest")
        return value.lower()

    @model_validator(mode="after")
    def _unique_finding_ids(self) -> ScamCaseFile:
        ids = [finding.id for finding in self.findings]
        if len(ids) != len(set(ids)):
            raise ValueError("finding ids must be unique within a case file")
        return self
