"""Evaluation harness for the labelled dataset.

Runs every labelled sample through the full analysis pipeline and computes
deterministic metrics. No randomness, no network access.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, ConfigDict

from app.models import ScamCaseFile, VerdictCategory
from app.router import build_case_file
from app.validation import NormalizedInput, normalize_input

DATASET_PATH = (
    Path(__file__).resolve().parent.parent / "tests" / "data" / "labeled_samples.json"
)

SCAM_VERDICTS = frozenset(
    {
        VerdictCategory.HIGHLY_SUSPICIOUS,
        VerdictCategory.SUSPICIOUS,
    }
)


class Sample(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    text: str
    label: str
    category: str
    expected_verdict: VerdictCategory


class SampleResult(BaseModel):
    sample_id: str
    category: str
    labeled_scam: bool
    detected_scam: bool
    expected_verdict: VerdictCategory
    actual_verdict: VerdictCategory
    passed: bool


class CategoryReport(BaseModel):
    category: str
    total: int
    passed: int


class EvalReport(BaseModel):
    total: int
    passed: int
    accuracy: float
    true_positives: int
    false_negatives: int
    true_negatives: int
    false_positives: int
    precision: float
    recall: float
    f1: float
    category_reports: tuple[CategoryReport, ...] = ()
    failures: tuple[SampleResult, ...] = ()


@lru_cache(maxsize=1)
def load_dataset(path: Path | None = None) -> tuple[Sample, ...]:
    dataset_path = path or DATASET_PATH
    raw = json.loads(dataset_path.read_text(encoding="utf-8"))
    return tuple(Sample(**item) for item in raw["samples"])


def _analyze(text: str) -> tuple[NormalizedInput, ScamCaseFile]:
    normalized = normalize_input(text)
    case = build_case_file(normalized)
    return normalized, case


def evaluate(samples: tuple[Sample, ...]) -> EvalReport:
    results: list[SampleResult] = []

    for sample in samples:
        _, case = _analyze(sample.text)
        detected = case.verdict in SCAM_VERDICTS
        labeled_scam = sample.label == "scam"
        passed = case.verdict is sample.expected_verdict
        results.append(
            SampleResult(
                sample_id=sample.id,
                category=sample.category,
                labeled_scam=labeled_scam,
                detected_scam=detected,
                expected_verdict=sample.expected_verdict,
                actual_verdict=case.verdict,
                passed=passed,
            )
        )

    tp = sum(r.labeled_scam and r.detected_scam for r in results)
    fn = sum(r.labeled_scam and not r.detected_scam for r in results)
    tn = sum(not r.labeled_scam and not r.detected_scam for r in results)
    fp = sum(not r.labeled_scam and r.detected_scam for r in results)
    total = len(results)
    passed = sum(r.passed for r in results)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (
        2 * precision * recall / (precision + recall)
        if (precision + recall)
        else 0.0
    )

    categories = sorted({r.category for r in results})
    category_reports = tuple(
        CategoryReport(
            category=category,
            total=sum(r.category == category for r in results),
            passed=sum(r.category == category and r.passed for r in results),
        )
        for category in categories
    )

    return EvalReport(
        total=total,
        passed=passed,
        accuracy=passed / total if total else 0.0,
        true_positives=tp,
        false_negatives=fn,
        true_negatives=tn,
        false_positives=fp,
        precision=precision,
        recall=recall,
        f1=f1,
        category_reports=category_reports,
        failures=tuple(r for r in results if not r.passed),
    )
