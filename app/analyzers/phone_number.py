"""Phone-number analysis (format validation and normalization only).

A submitted bare phone number is format-checked and normalized to the
+91XXXXXXXXXX national form. This offline build has no number-reputation
source, so reputation is explicitly reported as NOT verified: an unfamiliar
number is never labeled a scammer, and a correctly formatted number is never
declared safe. The findings state exactly what the local checks established.
"""

from __future__ import annotations

import re

from app.analyzers.base import make_finding
from app.models import Confidence, Finding, FindingCategory, FindingStatus

_SEPARATORS = re.compile(r"[\s\-().\u00a0]", re.UNICODE)
_INDIAN_MOBILE = re.compile(r"^(?:\+91|0091|0)?([6-9]\d{9})$")

_REPUTATION_NOTE = (
    "Number reputation could not be verified: this offline build has no "
    "phone-reputation source available locally."
)

_NOT_SCAMMER_NOTE = (
    "A valid format does not make a number trustworthy, and an unfamiliar "
    "number is not treated as fraudulent."
)


def normalize_phone_number(raw: str) -> str | None:
    """Return the +91XXXXXXXXXX form, or None if the digits do not match."""
    compact = _SEPARATORS.sub("", raw).strip()
    match = _INDIAN_MOBILE.match(compact)
    if match is None:
        return None
    return f"+91{match.group(1)}"


def analyze_phone_number(text: str) -> list[Finding]:
    normalized = normalize_phone_number(text)
    if normalized is not None:
        return [
            make_finding(
                rule_id="IN-PHONE-FMT-001",
                category=FindingCategory.OTHER,
                title="Indian mobile number validated (format only)",
                evidence=normalized,
                limitations=(
                    "Only the number format was checked locally (10 digits "
                    "starting 6-9, optional +91/0091/0 prefix). " + _REPUTATION_NOTE
                    + " " + _NOT_SCAMMER_NOTE
                ),
                recommended_action=(
                    "Do not trust a number just because it is formatted correctly. "
                    "Call back through the official number published on the "
                    "organisation's website. Report fraud attempts to "
                    "cybercrime.gov.in or helpline 1930."
                ),
                status=FindingStatus.OBSERVED,
                confidence=Confidence.LOW,
            )
        ]
    return [
        make_finding(
            rule_id="IN-PHONE-FMT-001",
            category=FindingCategory.OTHER,
            title="Number-like submission is not a valid Indian mobile format",
            evidence=text,
            limitations=(
                "The submission looks like a phone number but its digits do not "
                "match the Indian mobile format (10 digits starting 6-9 with an "
                "optional +91/0091/0 prefix). " + _REPUTATION_NOTE
            ),
            recommended_action=(
                "Treat the submission as unverified contact data. If it is a phone "
                "number, check its origin before calling or trusting it."
            ),
            status=FindingStatus.OBSERVED,
            confidence=Confidence.LOW,
        )
    ]
