"""Template-based explanation builder.

Turns a Scam Case File into a plain-language explanation with actions and
reporting guidance. Templates are static; only traceable evidence fills them.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.config import REPORTING_GUIDANCE
from app.models import ScamCaseFile, VerdictCategory

_HEADLINES = {
    VerdictCategory.HIGHLY_SUSPICIOUS: "Strong scam indicators found",
    VerdictCategory.SUSPICIOUS: "Warning signs found",
    VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND: "No strong warning signs found",
    VerdictCategory.UNABLE_TO_DETERMINE: "Unable to determine",
}

_SUMMARIES = {
    VerdictCategory.HIGHLY_SUSPICIOUS: (
        "This submission matched one or more strong indicators that are "
        "commonly used in scams. Treat it as fraudulent until you have "
        "verified it through official channels."
    ),
    VerdictCategory.SUSPICIOUS: (
        "This submission shows warning signs consistent with known scam "
        "patterns. Verify independently before acting on it."
    ),
    VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND: (
        "The checks found no strong warning signs. This is NOT proof that the "
        "submission is safe: scams change constantly and no check list is "
        "complete. If anything feels off, verify through official channels."
    ),
    VerdictCategory.UNABLE_TO_DETERMINE: (
        "One or more checks could not be completed, so the evidence is "
        "incomplete. The verdict reflects only what could be checked."
    ),
}

_DEFAULT_ACTIONS = {
    VerdictCategory.HIGHLY_SUSPICIOUS: "Do not pay, share codes, or click links.",
    VerdictCategory.SUSPICIOUS: "Do not act on this message until verified.",
    VerdictCategory.NO_STRONG_WARNING_SIGNS_FOUND: (
        "Stay alert; verify unexpected requests through official channels."
    ),
    VerdictCategory.UNABLE_TO_DETERMINE: (
        "Verify manually through official channels; the automated analysis is incomplete."
    ),
}


class Explanation(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    verdict: VerdictCategory
    headline: str
    summary: str
    key_points: tuple[str, ...] = ()
    unverified: tuple[str, ...] = ()
    actions: tuple[str, ...] = ()
    reporting: str = REPORTING_GUIDANCE


def explain(case: ScamCaseFile) -> Explanation:
    if case.verdict is None:
        raise ValueError("case file has no verdict; run the verdict policy first")

    key_points: list[str] = []
    unverified: list[str] = list(case.limitations) + list(case.checks_not_completed)
    actions: list[str] = []

    for finding in case.findings:
        key_points.append(f"{finding.id}: {finding.title}")
        if finding.limitations:
            unverified.append(f"{finding.id}: {finding.limitations}")
        if finding.recommended_action:
            actions.append(finding.recommended_action)
        if finding.evidence:
            unverified.append(
                f"{finding.id}: quoted text is untrusted input, not verified fact"
            )

    if not key_points:
        key_points = ("No indicator matched any rule in the current rule set.",)
    if not actions:
        actions = [_DEFAULT_ACTIONS[case.verdict]]
    actions.append(_DEFAULT_ACTIONS[case.verdict])
    actions = list(dict.fromkeys(actions))

    return Explanation(
        verdict=case.verdict,
        headline=_HEADLINES[case.verdict],
        summary=_SUMMARIES[case.verdict],
        key_points=tuple(key_points),
        unverified=tuple(dict.fromkeys(unverified)),
        actions=tuple(actions),
    )
