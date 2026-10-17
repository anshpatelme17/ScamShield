"""Adversarial ReDoS probes.

Each probe is a pathological input aimed at a regex in the codebase. Probes
are capped at MAX_INPUT_LENGTH so they must be accepted by validation, which
is also the size limit enforced at the API layer. The analysis must complete
quickly and deterministically regardless.
"""

import time

import pytest

from app.router import build_case_file
from app.validation import MAX_INPUT_LENGTH, InputValidationError, normalize_input

TIME_BUDGET_SECONDS = 5.0


def _probe(prefix: str, filler: str) -> str:
    total = prefix
    repeat = MAX_INPUT_LENGTH // max(len(filler), 1) + 1
    return (total + filler * repeat)[:MAX_INPUT_LENGTH]


_PROBE_SPECS = [
    ("otp-repeat", "enter your otp "),
    ("verb-repeat", "provide "),
    ("secret-repeat", "otp otp otp "),
    ("negation-repeat", "never share your otp "),
    ("monolith", "a"),
    ("at-flood", ""),
    ("at-huge", "@"),
    ("long-url-scheme", "http://"),
    ("long-url-domain", "http://a."),
    ("url-hyphens", "http://-"),
    ("deep-subdomains", "http://x-"),
    ("punycode-long", "http://xn--"),
    ("userinfo-huge", "http://"),
    ("shortener-query", "https://bit.ly/?"),
    ("weird-scheme-long", "offline://"),
    ("www-repeat", ""),
    ("rupee-flood", "₹"),
    ("rs-repeat", "Rs."),
    ("urgency-repeat", "urgent immedately "),
    ("police-repeat", "illegal fir cbi police "),
    ("loan-repeat", "loan processing fee deposit fees charges "),
    ("regex-garbage", "(x"),
    ("digit-flood", "0"),
    ("phone-flood", "9876543210 "),
    ("nul-bytes", ""),
    ("suspension-repeat", "your account will be suspended "),
]

_FILLERS = {
    "at-flood": "@",
    "deep-subdomains": "-x.",
    "userinfo-huge": "a",
    "www-repeat": "www",
    "nul-bytes": "ab\x00cd",
    "regex-garbage": "+++)(",
}


def _probes():
    probes = []
    for name, prefix in _PROBE_SPECS:
        filler = _FILLERS.get(name, "a" if len(prefix) > 0 else "b")
        probes.append(pytest.param(_probe(prefix, filler), id=name))
    probes.append(pytest.param("x" * 8, id="short-benign"))
    return probes


@pytest.mark.parametrize("probe", _probes())
def test_probe_completes_within_budget(probe):
    start = time.perf_counter()
    normalized = normalize_input(probe)
    case = build_case_file(normalized)
    elapsed = time.perf_counter() - start
    assert elapsed < TIME_BUDGET_SECONDS, f"probe took {elapsed:.3f}s"
    assert normalized.input_length == len(normalized.text)
    assert case.schema_version
    assert case.verdict is not None


def test_all_probes_at_limit():
    for param in _probes():
        probe: str = param.values[0]
        assert len(probe) == MAX_INPUT_LENGTH or probe == "x" * 8


def test_pure_control_char_input_rejected():
    with pytest.raises(InputValidationError):
        normalize_input("\x00" * MAX_INPUT_LENGTH)

