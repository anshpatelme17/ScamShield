"""Small analysis router.

Wires extraction and the relevant local analyzers together, then assembles a
Scam Case File. Deliberately simple: no orchestration engine. A submission is
typed text, a base64 image (QR analysis plus local OCR of readable text), or
both.
"""

from __future__ import annotations

import hashlib
from uuid import uuid4

from app.analyzers.base import make_finding
from app.analyzers.hinglish_rules import analyze_hinglish_rules
from app.analyzers.image_text import extract_text
from app.analyzers.india_rules import analyze_india_rules
from app.analyzers.qr_analysis import QRSubmission, analyze_qr_submission, prepare_qr_submission
from app.analyzers.text_signals import analyze_text_signals
from app.analyzers.url_heuristics import analyze_urls
from app.extractors import extract_indicators
from app.models import Finding, FindingCategory, FindingStatus, InputType, ScamCaseFile
from app.validation import InputValidationError, NormalizedInput, normalize_input
from app.verdict import determine_verdict


def _text_findings(text: str) -> list[Finding]:
    indicators = extract_indicators(text)
    findings: list[Finding] = []
    findings.extend(analyze_india_rules(text, indicators))
    findings.extend(analyze_hinglish_rules(text, indicators))
    findings.extend(analyze_text_signals(text))
    if indicators.urls:
        findings.extend(analyze_urls(indicators.urls))
    return findings


def _ocr_findings(submission: QRSubmission) -> list[Finding]:
    if submission.decode_failed or submission.byte_length == 0:
        return []
    ocr_text = extract_text(submission.image_bytes)
    if ocr_text:
        try:
            normalized = normalize_input(ocr_text)
        except InputValidationError:
            return []
        return _text_findings(normalized.text)
    if not submission.payloads:
        return [
            make_finding(
                rule_id="IN-IMG-NO-CONTENT-001",
                category=FindingCategory.OTHER,
                title="No analyzable content found in image",
                evidence="no QR symbol decoded and no readable text extracted",
                status=FindingStatus.CHECK_FAILED,
                limitations=(
                    "The image contained neither a QR symbol nor text readable "
                    "by the local OCR (Latin-script text only). The verdict "
                    "reflects that nothing could be analyzed."
                ),
            )
        ]
    return []


def _submission_findings(
    normalized: NormalizedInput | None, submission: QRSubmission | None
) -> list[Finding]:
    if normalized is None and submission is None:
        raise ValueError("at least one submission source is required")
    findings: list[Finding] = []
    if normalized is not None:
        findings.extend(_text_findings(normalized.text))
    if submission is not None:
        findings.extend(_ocr_findings(submission))
        findings.extend(analyze_qr_submission(submission))
        for payload in submission.payloads:
            try:
                payload_normalized = normalize_input(payload)
            except InputValidationError:
                continue
            findings.extend(_text_findings(payload_normalized.text))
    return findings


def run_analysis(
    normalized: NormalizedInput | None = None, image_b64: str | None = None
) -> list[Finding]:
    submission = prepare_qr_submission(image_b64) if image_b64 else None
    return _finalize(_submission_findings(normalized, submission))


def _finalize(findings: list[Finding]) -> list[Finding]:
    seen: set[str] = set()
    unique: list[Finding] = []
    for finding in findings:
        if finding.rule_id in seen:
            continue
        seen.add(finding.rule_id)
        unique.append(finding)
    return [
        finding.model_copy(update={"id": f"F-{index:03d}"})
        for index, finding in enumerate(unique, start=1)
    ]


def _case_identity(
    normalized: NormalizedInput | None, submission: QRSubmission | None
) -> dict:
    if submission is not None and normalized is None:
        return {
            "input_type": InputType.IMAGE,
            "input_length": submission.byte_length,
            "input_sha256": submission.sha256,
        }
    if submission is not None:
        combined = hashlib.sha256(
            f"{normalized.sha256}{submission.sha256}".encode()
        ).hexdigest()
        return {
            "input_type": InputType.IMAGE,
            "input_length": normalized.input_length + submission.byte_length,
            "input_sha256": combined,
        }
    return {
        "input_type": normalized.input_type,
        "input_length": normalized.input_length,
        "input_sha256": normalized.sha256,
    }


def build_case_file(
    normalized: NormalizedInput | None = None, image_b64: str | None = None
) -> ScamCaseFile:
    submission = prepare_qr_submission(image_b64) if image_b64 else None
    findings = _finalize(_submission_findings(normalized, submission))
    verdict_result = determine_verdict(tuple(findings))
    return ScamCaseFile(
        case_id=uuid4().hex,
        **_case_identity(normalized, submission),
        findings=tuple(findings),
        verdict=verdict_result.verdict,
        verdict_reasons=verdict_result.reasons,
    )
