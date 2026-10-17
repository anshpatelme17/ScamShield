"""General contextual text signals (language-level, not India-specific).

These are supporting signals. They are intentionally few and conservative.
"""

from __future__ import annotations

import re

from app.analyzers.base import make_finding, snippet
from app.models import Confidence, Finding, FindingCategory

_URGENCY = re.compile(
    r"(?i)\b(urgent(?:ly)?|immediately|act now|within\s+\d+\s+(?:hours|minutes|hrs)|"
    r"last\s+chance|final\s+(?:warning|notice)|today\s+only|asap|right\s+now|"
    r"expir(?:e|es|ed|ing)\s+(?:today|soon|in))\b"
)
_THREAT = re.compile(
    r"(?i)\b(legal\s+action|fir|police\s+complaint|penalty|fine|court|lawsuit|"
    r"terminate|blacklist|recover(?:y)?\s+agent)\b"
)
_MONEY = re.compile(
    r"(?i)\b(pay\s+(?:now|immediately|the)|transfer\s+(?:the\s+)?(?:amount|money|funds)|"
    r"send\s+money|scan\s+(?:this\s+)?qr|scan\s+the\s+qr|make\s+(?:the\s+)?payment|"
    r"remit|neft|imps)\b"
)
_DATA = re.compile(
    r"(?i)\b(aadhaar|aadhar|pan\s+(?:card|number)|card\s+number|cvv|expiry\s+date|"
    r"debit\s+card|credit\s+card|passcode|mother'?s\s+maiden|date\s+of\s+birth)\b"
)
_SECRECY = re.compile(
    r"(?i)\b(do\s+not\s+tell|don'?t\s+tell|keep\s+(?:it\s+)?secret|between\s+us|"
    r"do\s+not\s+inform|keep\s+this\s+confidential)\b"
)


def analyze_text_signals(text: str) -> list[Finding]:
    findings: list[Finding] = []

    if (match := _URGENCY.search(text)) is not None:
        findings.append(
            make_finding(
                rule_id="TXT-URGENCY-001",
                category=FindingCategory.URGENCY_PRESSURE,
                title="Urgency or pressure language",
                evidence=snippet(text, match),
                limitations="Urgency alone is common in legitimate messages too.",
                confidence=Confidence.LOW,
            )
        )

    if (match := _THREAT.search(text)) is not None:
        findings.append(
            make_finding(
                rule_id="TXT-THREAT-001",
                category=FindingCategory.OTHER,
                title="Threat or fear language",
                evidence=snippet(text, match),
                recommended_action="Do not act under pressure; verify independently.",
                confidence=Confidence.LOW,
            )
        )

    if (match := _MONEY.search(text)) is not None:
        findings.append(
            make_finding(
                rule_id="TXT-MONEY-001",
                category=FindingCategory.OTHER,
                title="Payment or money-transfer instruction",
                evidence=snippet(text, match),
                limitations="Payment requests are also normal in genuine transactions.",
                recommended_action="Confirm the request through a trusted channel first.",
                confidence=Confidence.LOW,
            )
        )

    if (match := _DATA.search(text)) is not None:
        findings.append(
            make_finding(
                rule_id="TXT-DATA-001",
                category=FindingCategory.OTHER,
                title="Request for sensitive personal identifiers",
                evidence=snippet(text, match),
                recommended_action=(
                    "Share Aadhaar, PAN, and card details only with verified, official "
                    "services."
                ),
                confidence=Confidence.MEDIUM,
            )
        )

    if (match := _SECRECY.search(text)) is not None:
        findings.append(
            make_finding(
                rule_id="TXT-SECRECY-001",
                category=FindingCategory.OTHER,
                title="Request for secrecy",
                evidence=snippet(text, match),
                recommended_action="Legitimate organisations do not ask you to keep secrets.",
                confidence=Confidence.MEDIUM,
            )
        )

    return findings
