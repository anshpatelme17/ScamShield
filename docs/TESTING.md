# Testing

Status: `IMPLEMENTED` (as of Phase 8; suite grows in later phases).

## Tooling

- Test runner: `pytest` (configured in `pyproject.toml`, `testpaths = ["tests"]`).
- Linter: `ruff`.

## Commands

```powershell
# Activate the virtual environment first
.\.venv\Scripts\Activate.ps1

pytest
ruff check .
```

## Current suite (executed results)

- **143 passed** in ~0.9 s (single warning: starlette testclient deprecation,
  library-internal).
- `tests/test_environment.py` — Python/dependency smoke.
- `tests/test_models.py` — evidence model integrity (unique ids, strict/frozen).
- `tests/test_validation.py` — input limits, control-character stripping,
  type/URL detection.
- `tests/test_extractors.py` — URL/UPI/phone/APK/amount extraction.
- `tests/test_analyzers.py` — India rules incl. the **hard negative** ("Never
  share your OTP or UPI PIN...") must produce zero findings.
- `tests/test_hinglish.py` — Hinglish/Devanagari rules incl. Devanagari bank
  warning hard negative, postal "pin code" guard, and negated-security
  variants ("share na karein" / "शेयर न करें").
- `tests/test_url_heuristics.py` — offline URL checks incl. `CHECK_FAILED`
  path for unparseable URLs.
- `tests/test_router.py` — sequential ids, dedupe by rule, verdict outcomes.
- `tests/test_verdict.py` — deterministic precedence incl. strong-rule
  dominance, check-failed -> UNABLE_TO_DETERMINE, weak-signal thresholds.
- `tests/test_explanations.py` — templates, actions, unverified lists,
  disclaimers.
- `tests/test_api.py` — FastAPI integration: valid/invalid inputs, 422s,
  verdicts, response shape.
- `tests/test_eval.py` — labelled dataset gate: hard negatives must all pass,
  zero false positives, precision/recall >= 0.9, every scam category fully
  detected (executed metrics: 40/40 samples, accuracy = precision = recall =
  F1 = 1.0; 27 scam / 13 hard negatives).
- `tests/test_offline.py` — **sockets are blocked** while the whole pipeline
  and the full evaluation run (prove R-015).
- `tests/test_redos.py` — 29 adversarial probes at the exact input-size limit
  (max length), each must finish analysis in < 5 s. Executed: all pass in
  ~0.3 s total, worst probe ~0.05 s.

## Policy

- A requirement is only marked `TESTED` after the relevant test is executed and
  its result inspected.
- Hard negatives must remain in the suite; removing one is a regression.
- New rules must ship with: matching positive test, at least one hard-negative
  guard, and a dataset sample if India-category specific.
