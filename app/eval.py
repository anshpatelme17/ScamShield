"""Evaluation harness for the labelled dataset.

Runs every labelled sample through the full analysis pipeline and computes
deterministic metrics. No randomness, no network access. Image-channel
samples are rendered from their text lines with a fixed system font before
analysis, so OCR quality is exercised exactly as in production.
"""

from __future__ import annotations

import base64
import io
import json
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pydantic import BaseModel, ConfigDict, model_validator

from app.models import ScamCaseFile, VerdictCategory
from app.router import build_case_file
from app.validation import normalize_input

DATASET_PATH = (
    Path(__file__).resolve().parent.parent / "tests" / "data" / "labeled_samples.json"
)

SCAM_VERDICTS = frozenset(
    {
        VerdictCategory.HIGHLY_SUSPICIOUS,
        VerdictCategory.SUSPICIOUS,
    }
)

_OCR_FONT_PATH = "C:/Windows/Fonts/arial.ttf"
_IMAGE_LINE_STEP = 60
_IMAGE_PADDING = 20
_IMAGE_WIDTH = 800


class Sample(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    label: str
    category: str
    expected_verdict: VerdictCategory
    text: str = ""
    image_lines: tuple[str, ...] = ()
    font_size: int = 30

    @model_validator(mode="after")
    def _require_one_channel(self) -> Sample:
        if bool(self.text) == bool(self.image_lines):
            raise ValueError("exactly one of text or image_lines is required")
        return self


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


def render_text_image(lines: tuple[str, ...], size: int = 30) -> str:
    """Render text lines to base64 PNG the way OCR samples are scanned."""
    img = Image.new(
        "RGB",
        (_IMAGE_WIDTH, _IMAGE_LINE_STEP * len(lines) + 2 * _IMAGE_PADDING),
        "white",
    )
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(_OCR_FONT_PATH, size)
    for index, line in enumerate(lines):
        draw.text(
            (_IMAGE_PADDING, _IMAGE_PADDING + _IMAGE_LINE_STEP * index),
            line,
            fill="black",
            font=font,
        )
    out = io.BytesIO()
    img.save(out, format="PNG")
    return base64.b64encode(out.getvalue()).decode()


def _analyze(text: str) -> ScamCaseFile:
    normalized = normalize_input(text)
    return build_case_file(normalized)


def evaluate(samples: tuple[Sample, ...]) -> EvalReport:
    results: list[SampleResult] = []

    for sample in samples:
        if sample.image_lines:
            image_b64 = render_text_image(sample.image_lines, sample.font_size)
            case = build_case_file(image_b64=image_b64)
        else:
            case = _analyze(sample.text)
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
