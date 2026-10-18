import pytest

from app.eval import evaluate, load_dataset

THRESHOLD = 0.9


@pytest.fixture(scope="module")
def samples():
    return load_dataset()


@pytest.fixture(scope="module")
def report(samples):
    return evaluate(samples)


def test_dataset_basics(samples):
    labels = {s.label for s in samples}
    assert labels == {"scam", "safe"}
    assert len(samples) >= 20
    assert any(s.category == "hard_negative" for s in samples)
    assert any(s.category == "ocr_hard_negative" for s in samples)
    assert any(s.image_lines for s in samples)


def test_all_hard_negatives_pass(report):
    hard_negative_failures = [
        (f.sample_id, f.actual_verdict) for f in report.failures if "hard_negative" in f.category
    ]
    assert not hard_negative_failures


def test_zero_false_positives(report):
    assert report.false_positives == 0


def test_overall_metrics_above_threshold(report):
    assert report.recall >= THRESHOLD
    assert report.precision >= THRESHOLD
    assert report.accuracy >= THRESHOLD


def test_every_scam_category_detector_passes(samples, report):
    scam_categories = sorted({s.category for s in samples if s.label == "scam"})
    for category_report in report.category_reports:
        if category_report.category in scam_categories:
            assert category_report.passed == category_report.total, (
                f"category failed: {category_report} "
                f"failures={[f.sample_id for f in report.failures]}"
            )
    assert len(scam_categories) >= 12


def test_failure_details_when_any(report):
    if report.failures:
        for failure in report.failures:
            assert failure.actual_verdict == failure.expected_verdict
