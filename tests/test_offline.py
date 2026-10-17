import socket

import pytest

from app.eval import evaluate, load_dataset
from app.router import run_analysis
from app.validation import normalize_input


@pytest.fixture(autouse=True)
def block_network(monkeypatch):
    def _deny(*args, **kwargs):
        raise AssertionError("network access attempted during analysis")

    monkeypatch.setattr(socket, "socket", _deny)
    monkeypatch.setattr(socket, "create_connection", _deny)


def test_analysis_runs_fully_offline():
    normalized = normalize_input("Enter your UPI PIN to receive money. http://1.2.3.4/otp")
    findings = run_analysis(normalized)
    assert findings


def test_full_evaluation_runs_fully_offline():
    report = evaluate(load_dataset())
    assert report.total >= 20
