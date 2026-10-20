"""Deterministic verdict policy.

The verdict is categorical, never a numeric score. Correlated indicators
cannot inflate the result: the router emits each rule at most once, and the
policy counts distinct rule ids. The policy is a fixed precedence order.

Precedence (highest first):
1. Any strong rule matched          -> HIGHLY_SUSPICIOUS
2. Any check failed                 -> UNABLE_TO_DETERMINE
3. Any medium India rule matched    -> SUSPICIOUS
4. Two or more distinct URL anomalies -> SUSPICIOUS
5. Three or more distinct text signals -> SUSPICIOUS
6. Otherwise                        -> NO_STRONG_WARNING_SIGNS_FOUND

Absence of indicators is never treated as proof of safety; that is stated in
the disclaimer and in the explanation templates.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models import Finding, FindingStatus, ReasonSpec, VerdictCategory

_STRONG_RULES = frozenset(
    {
        "IN-SECRET-001",
        "IN-COLLECT-001",
        "IN-ARREST-001",
        "IN-SEXTORT-001",
        "IN-APK-001",
        "IN-H-SECRET-001",
        "IN-H-COLLECT-001",
        "IN-H-ARREST-001",
        "IN-H-SEXTORT-001",
        "IN-H-APK-001",
    }
)

_URL_ANOMALY_MIN_COUNT = 2
_TEXT_SIGNAL_MIN_COUNT = 3


class VerdictResult(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    verdict: VerdictCategory
    reasons: tuple[str, ...] = ()
    reason_specs: tuple[ReasonSpec, ...] = ()


def determine_verdict(findings: tuple[Finding, ...]) -> VerdictResult:
    rule_ids = {
        finding.rule_id
        for finding in findings
        if finding.rule_id and finding.status is FindingStatus.RULE_MATCH
    }
    strong = sorted(rule_ids & _STRONG_RULES)
    failed = any(finding.status is FindingStatus.CHECK_FAILED for finding in findings)
    india_medium = sorted(
        rule_id
        for rule_id in rule_ids
        if rule_id.startswith("IN-") and rule_id not in _STRONG_RULES
    )
    url_anomalies = sorted(rule_id for rule_id in rule_ids if rule_id.startswith("URL-"))
    text_signals = sorted(rule_id for rule_id in rule_ids if rule_id.startswith("TXT-"))

    if strong:
        return VerdictResult(
            verdict=VerdictCategory.HIGHLY_SUSPICIOUS,
            reasons=(
                "Strong scam indicator matched: " + ", ".join(strong) + ".",
            ),
            reason_specs=(ReasonSpec(key="verdictreason.strong", args=strong),),
        )

    if failed:
        return VerdictResult(
            verdict=VerdictCategory.UNABLE_TO_DETERMINE,
            reasons=(
                "One or more checks could not be completed, so the analysis is "
                "incomplete.",
            ),
            reason_specs=(ReasonSpec(key="verdictreason.failed"),),
        )

    if india_medium:
        return VerdictResult(
            verdict=VerdictCategory.SUSPICIOUS,
            reasons=(
                "India-specific scam pattern matched: " + ", ".join(india_medium) + ".",
            ),
            reason_specs=(ReasonSpec(key="verdictreason.indiaMedium", args=india_medium),),
        )

    if len(url_anomalies) >= _URL_ANOMALY_MIN_COUNT:
        return VerdictResult(
            verdict=VerdictCategory.SUSPICIOUS,
            reasons=(
                f"{len(url_anomalies)} distinct URL anomalies found: "
                + ", ".join(url_anomalies)
                + ".",
            ),
            reason_specs=(
                ReasonSpec(key="verdictreason.urlAnomalies", args=list(url_anomalies)),
            ),
        )

    if len(text_signals) >= _TEXT_SIGNAL_MIN_COUNT:
        return VerdictResult(
            verdict=VerdictCategory.SUSPICIOUS,
            reasons=(
                f"{len(text_signals)} distinct supporting signals found: "
                + ", ".join(text_signals)
                + ".",
            ),
            reason_specs=(
                ReasonSpec(key="verdictreason.textSignals", args=list(text_signals)),
            ),
        )

    weak = sorted(
        url_anomalies + text_signals
    )
    if weak:
        return VerdictResult(
            verdict=VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND,
            reasons=(
                "Only weak, non-conclusive signals found: " + ", ".join(weak) + ".",
            ),
            reason_specs=(ReasonSpec(key="verdictreason.weak", args=weak),),
        )

    return VerdictResult(
        verdict=VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND,
        reasons=("No scam indicators matched any rule.",),
        reason_specs=(ReasonSpec(key="verdictreason.none"),),
    )
