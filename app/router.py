"""Small analysis router.

Wires extraction and the relevant local analyzers together, then assembles a
Scam Case File. Deliberately simple: no orchestration engine.
"""

from __future__ import annotations

from uuid import uuid4

from app.analyzers.hinglish_rules import analyze_hinglish_rules
from app.analyzers.india_rules import analyze_india_rules
from app.analyzers.text_signals import analyze_text_signals
from app.analyzers.url_heuristics import analyze_urls
from app.extractors import extract_indicators
from app.models import Finding, ScamCaseFile
from app.validation import NormalizedInput
from app.verdict import determine_verdict


def run_analysis(normalized: NormalizedInput) -> list[Finding]:
    indicators = extract_indicators(normalized.text)

    findings: list[Finding] = []
    findings.extend(analyze_india_rules(normalized.text, indicators))
    findings.extend(analyze_hinglish_rules(normalized.text, indicators))
    findings.extend(analyze_text_signals(normalized.text))
    if indicators.urls:
        findings.extend(analyze_urls(indicators.urls))

    return _finalize(findings)


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


def build_case_file(
    normalized: NormalizedInput, findings: list[Finding] | None = None
) -> ScamCaseFile:
    if findings is None:
        findings = run_analysis(normalized)
    verdict_result = determine_verdict(tuple(findings))
    return ScamCaseFile(
        case_id=uuid4().hex,
        input_type=normalized.input_type,
        input_length=normalized.input_length,
        input_sha256=normalized.sha256,
        findings=tuple(findings),
        verdict=verdict_result.verdict,
        verdict_reasons=verdict_result.reasons,
    )
