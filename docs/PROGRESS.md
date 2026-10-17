# Progress Log

## Phase 0 — Environment inspection
- Completed. Read-only inspection of the environment (Python 3.13.5, pip 26.1,
  Git 2.53.0; Node.js/npm not installed). `D:\innotech` confirmed empty.
- Decisions: project root `D:\innotech`; independent Git repo; Python-only backend
  first; Node.js to be installed later for the frontend.

## Phase 1 — Repository & tooling skeleton
- Status: IN_PROGRESS
- Created: `git init`, `.gitignore`, `.venv`, `pyproject.toml`, `requirements.txt`,
  `README.md`, documentation stubs under `docs/`, and a toolchain smoke test.
- Verified:
  - `ruff 0.9.10` -> `All checks passed!` (exit 0)
  - `pytest 8.4.1` -> `2 passed in 0.63s` (exit 0)
  - Committed: `835347a` (root commit).

## Phase 2 — Structured evidence model & validation
- Status: IN_PROGRESS
- Created: `app/__init__.py`, `app/config.py`, `app/models.py`,
  `app/validation.py`, `tests/test_models.py`, `tests/test_validation.py`.
- Verified:
  - `ruff check .` -> `All checks passed!` (exit 0)
  - `pytest -v` -> `21 passed in 0.48s` (exit 0)
- Notes: verdict logic intentionally deferred to Phase 4; `ScamCaseFile` has no
  verdict field yet.
- Committed: `502f0ad`.

## Phase 3 — Analyzers, extraction, and analysis router
- Status: IN_PROGRESS
- Created: `app/extractors.py`, `app/analyzers/{__init__,base,india_rules,
  url_heuristics,text_signals}.py`, `app/router.py`, and
  `tests/test_{extractors,analyzers,url_heuristics,router}.py`.
- Verified:
  - `ruff check .` -> `All checks passed!` (exit 0)
  - `pytest` -> `55 passed in 0.52s` (exit 0)
- Bug fixed during verification: negation context was clipped at the
  80-char window edge in `_secret_solicitation`, causing the hard negative
  ("Never share your OTP or UPI PIN...") to fire `IN-SECRET-001`.
  Fixed by anchoring the negator check at the verb's absolute text position.
- The hard-negative test passes.
- Committed: `84ca213`.

## Phase 4 — Deterministic verdict policy & explanations
- Status: IN_PROGRESS
- Created: `app/verdict.py`, `app/explanations.py`,
  `tests/test_verdict.py`, `tests/test_explanations.py`.
- Modified: `app/models.py` (VerdictCategory enum; verdict fields on
  `ScamCaseFile`), `app/analyzers/url_heuristics.py` (CHECK_FAILED finding for
  unparseable URLs), `app/router.py` (verdict computed in `build_case_file`),
  `tests/test_url_heuristics.py`, `tests/test_router.py`.
- Verified:
  - `ruff check .` -> `All checks passed!` (exit 0)
  - `pytest` -> `74 passed in 0.57s` (exit 0)
- First pytest run had 2 test failures (test premise errors, not app bugs) and
  1 lint error (E501); all fixed and re-verified.
