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
- Committed: `5c8b56f`.

## Phase 5 — FastAPI API
- Status: IN_PROGRESS
- Created: `app/api/__init__.py`, `app/api/routes.py` (`POST /api/analyze`,
  `GET /api/health`), `app/main.py`, `tests/test_api.py`.
- Added dev dependency `httpx 0.28.1` (needed by Starlette TestClient).
- Verified:
  - `ruff check .` -> `All checks passed!` (exit 0)
  - `pytest` -> `84 passed, 1 warning in 0.65s` (warning is a starlette
    testclient deprecation, not project code)
  - Live smoke test: `uvicorn app.main:app --port 8765`; `GET /api/health`
    -> `{"status":"ok"}`; `POST /api/analyze` with a UPI-PIN request ->
    `highly_suspicious`, headline "Strong scam indicators found", 2 findings.
- Committed: `0eef6ba`.

## Phase 6 — Labelled evaluation dataset & harness
- Status: IN_PROGRESS
- Created: `tests/data/labeled_samples.json` (21 samples: 13 scam positives
  covering 13 categories, 8 hard negatives incl. the bank OTP/UPI-PIN
  warning), `app/eval.py` (harness with precision/recall/F1 + per-category
  reports), `tests/test_eval.py`, `tests/test_offline.py`.
- Verified:
  - `ruff check .` -> `All checks passed!` (exit 0; 2 import-order errors
    auto-fixed)
  - `pytest` -> `92 passed, 1 warning in 0.68s`
  - Eval metrics: accuracy 1.0, precision 1.0, recall 1.0, F1 1.0,
    13 TP / 0 FN / 8 TN / 0 FP, 0 failures.
  - Offline proof: socket-creation is blocked by a test fixture and the full
    evaluation still passes (no network access during analysis).
- Committed: `a145140`.

## Phase 7 — React + Tailwind frontend
- Status: IN_PROGRESS
- Environment: Node.js v22.23.3 + npm 10.9.9 installed (portable, no admin) at
  `%LOCALAPPDATA%\Programs\nodejs\node-v22.23.3-win-x64`.
- Created: `frontend/` (Vite + React 19 + Tailwind 4): `package.json`,
  `vite.config.js` (dev proxy `/api` -> `127.0.0.1:8765`), `index.html`,
  `src/{main.jsx,index.css,App.jsx}`.
- Port conflict found and resolved: Docker Desktop (`com.docker.backend`)
  occupies ports 8000 and 5173 on this machine; backend moved to 8765,
  frontend dev server fixed to 5175 (`strictPort`).
- Verified:
  - `npm install` -> 78 packages; `npm run build` -> successful production
    build (vite 6.4.4, 29 modules)
  - Live full-stack smoke: backend on 8765 + vite on 5175 via `Invoke-RestMethod`
    - page served (HTTP 200)
    - `GET /api/health` via proxy -> `{"status":"ok"}`
    - `POST /api/analyze` via proxy -> `suspicious` / "Warning signs found",
      3 findings, 4 actions, reporting guidance present
    - empty text -> HTTP 422
- Note: an intermediate `422 json_invalid` during manual POST testing was a
  PowerShell 5.1 -> curl.exe quoting artifact, not an app bug.
- Committed: `b5bcab0`.

## Phase 8 — Security & documentation hardening
- Status: IN_PROGRESS
- Audited `app/` for logging, secrets, HTTP clients, subprocess, eval/exec -
  clean (no logging exists; no network primitives).
- Created: `tests/test_redos.py` - 29 adversarial probes at the exact
  maximum input length, each with a 5 s time budget.
- Fixed during verification: initial probe harness had (a) probes exceeding
  the max length (correctly rejected by validation), (b) Windows 32,767-char
  test-id/env issue from pytest parametrize, (c) a pure-NUL probe that
  validation correctly rejects (kept as an explicit rejection test).
- Verified:
  - `ruff check .` -> `All checks passed!`
  - `tests/test_redos.py` -> `29 passed in 0.29s`
  - full `pytest` -> `121 passed, 1 warning in 0.81s`
- Finalized `docs/THREAT_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`
  to match the implemented reality with evidence.
- Committed: `f5c1224`.

## Phase 9 — Hinglish/Devanagari rules (bilingual layer)
- Status: IN_PROGRESS
- Root causes fixed during verification:
  - Python `re` treats Devanagari matras as non-word; trailing `\b` fails on
    tokens like "केवाईसी". All hinglish boundaries now use a unified wrapper
    (`(?<![\w\u0900-\u097F])…(?![\w\u0900-\u097F])`).
  - Window clipping could cut a negator in half ("Never" -> "er"); negation
    now checked in the original text at absolute verb positions.
  - URL fragments ("/otp/verify") could trigger credential solicitation;
    URLs are masked (position-preserving) before solicitation analysis.
- Added: `app/analyzers/hinglish_rules.py` (11 rules IN-H-*), router wiring,
  strong-rule set extension in `app/verdict.py`, `tests/test_hinglish.py`
  (22 tests), 19 new labelled samples (v1.1: 14 scam, 5 hard negatives incl.
  Devanagari bank warning, postal pin code, benign meeting).
- Verified:
  - `ruff check .` -> `All checks passed!`
  - eval: accuracy=1.0, 27 TP / 0 FP / 0 FN / 13 TN (40 samples)
  - full `pytest` -> `143 passed, 1 warning in 0.87s`
  - live E2E on 8765: hinglish KYC -> suspicious; hinglish OTP -> highly_suspicious
- Committed: `7b93b35`.

## Phase 10 — Offline QR-code analysis
- Status: IN_PROGRESS
- Added `app/analyzers/qr_analysis.py`: base64 image -> zxing-cpp local QR
  decode (QRCode/MicroQR/RMQR only, 2 MB byte limit, 25 MP pixel limit,
  max 8 payloads). Decoded payloads flow through the SAME validation/rule
  pipeline as typed text. New rules: `QR-IMG-001` (observed/check_failed),
  `IN-QR-UPI-001` (medium; upi:// payloads).
- API: `POST /api/analyze` now accepts optional `image_b64` with `text`;
  text or image required; oversize -> 422; undecodable/invalid base64 ->
  CHECK_FAILED finding so the verdict honestly reads UNABLE_TO_DETERMINE.
- Router: `run_analysis`/`build_case_file` accept optional image; case
  identity for image-only submissions: input_type=image, sha256 of image
  bytes. `models.InputType` gained `IMAGE`.
- Frontend: QR screenshot file picker (PNG/JPEG/WebP, 2 MB client cap),
  remove button, works with or without text.
- Pinned `zxing-cpp==3.1.1`, `Pillow==13.0.0` in requirements.txt.
- Verified:
  - `ruff check .` -> `All checks passed!`
  - full `pytest` -> `157 passed` (14 new QR tests incl. offline-pure decode
    fixtures generated in-process)
  - `npm run build` clean (frontend)
  - live E2E on 8765: UPI QR -> suspicious; OTP-text QR -> highly_suspicious;
    garbage image -> unable_to_determine; health ok
- Scope note: general OCR of text inside images is NOT implemented (needs a
  native OCR engine; deferred as D-029).
- Committed: `7fd3d30`.

## Phase 11 — Production packaging
- Status: IN_PROGRESS
- Added `app/serve.py` (`python -m app.serve`): uvicorn with loopback-only
  bind (127.0.0.1 default), no reload/dev features, optional --host/--port.
- `app/main.py`: security headers on every response (CSP default-src 'self'
  + frame-ancestors 'none', nosniff, DENY, no-referrer); frontend/dist
  mounted at "/" with html=True when built; /api router takes precedence.
- Added `tests/test_serve.py` (5 tests: headers on API + analyze,
  index served, API reachable under mount, unknown path -> 404; static
  tests skip cleanly when frontend is not built).
- Verified:
  - `ruff check .` -> `All checks passed!`
  - full `pytest` -> `162 passed`
  - `npm run build` clean
  - live: `python -m app.serve --port 8766` -> / serves index (root div),
    /api/health ok, analyze verdicts correct, headers present
