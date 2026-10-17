"""Shared helpers for building findings."""

from __future__ import annotations

from re import Match

from app.models import (
    Confidence,
    EvidenceSource,
    Finding,
    FindingCategory,
    FindingStatus,
)


def snippet(text: str, match: Match[str] | None = None, width: int = 100) -> str:
    if match is None:
        return text.strip()[:width]
    start = max(0, match.start() - width // 3)
    end = min(len(text), match.end() + width // 3)
    return text[start:end].strip()


def make_finding(
    *,
    rule_id: str,
    category: FindingCategory,
    title: str,
    evidence: str,
    status: FindingStatus = FindingStatus.RULE_MATCH,
    source: EvidenceSource = EvidenceSource.LOCAL_RULE,
    limitations: str | None = None,
    recommended_action: str | None = None,
    confidence: Confidence | None = None,
) -> Finding:
    return Finding(
        id=rule_id,
        title=title,
        category=category,
        status=status,
        source=source,
        evidence=(evidence,) if evidence else (),
        rule_id=rule_id,
        limitations=limitations,
        recommended_action=recommended_action,
        confidence=confidence,
    )
