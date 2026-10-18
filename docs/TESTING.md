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

- **174 passed** in ~22 s (single warning: starlette testclient deprecation,
  library-internal; timing dominated by OCR engine init and the 11 OCR-image
  samples in the evaluation gate).
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
- `tests/test_qr.py` — QR ingestion: generated QR fixtures decoded in-process
  (UPI payload -> suspicious, scam text payload via the text pipeline, benign
  payload clean, no-symbol observed, undecodable -> CHECK_FAILED ->
  unable_to_determine, oversize -> 422, text+image combined).
- `tests/test_serve.py` — production packaging: security headers on every
  response, built frontend served at "/", API reachable under the mount,
  unknown path -> 404 (static-content tests skip when frontend is unbuilt).
- `tests/test_eval.py` — labelled dataset gate: hard negatives must all pass,
  zero false positives, precision/recall >= 0.9, every scam category fully
  detected (executed metrics: 51/51 samples incl. the OCR-image channel,
  accuracy = precision = recall = F1 = 1.0; 32 scam / 19 hard negatives of
  which 6 are OCR-image hard negatives).
- `tests/test_offline.py` — **sockets are blocked** while the whole pipeline
  and the full evaluation run (prove R-015), plus a live OCR-based image
  analysis with sockets blocked (prove R-022 offline claim).
- `tests/test_redos.py` — 29 adversarial probes at the exact input-size limit
  (max length), each must finish analysis in < 5 s. Executed: all pass in
  ~0.3 s total, worst probe ~0.05 s.
- `tests/test_image_text.py` — local OCR of images: synthetic PNGs are read by
  rapidocr (English/Hinglish scam text -> strong verdicts, URL lines -> URL
  checks, benign text -> clean, blank -> CHECK_FAILED
  IN-IMG-NO-CONTENT-001 -> UNABLE_TO_DETERMINE); unit tests cover score
  filtering, short-text rejection, engine-failure path, and typed-vs-OCR
  dedupe. Executed: 11 passed (~8 s, engine initialized once per process).

### Frontend (Phases 12-13)

- Component + integration tests via **Vitest** + Testing Library (jsdom;
  `npm test`). **56 passed** in ~5 s across 5 files, using real backend
  payloads (generated from the live pipeline) as fixtures:
  - presentation: VerdictBadge, FindingCard, FindingsList, VerdictSummary,
    ExplanationPanel (incl. empty states / style fallbacks).
  - actions: CaseFileActions clipboard copy + JSON download via blob anchor.
  - history lib: newest-first, 30-entry cap, dedupe on re-analysis, single
    delete, storage-unavailable and corrupt-storage resilience.
  - HistoryPanel: restore/delete/clear, collapse/expand, privacy note.
  - InputPanel: tab switching, character counter, disabled submit, oversize
    image rejection, preview + remove, data-URL submission, busy state.
  - App integration (mocked fetch): full result render, pending-skeleton flow,
    API error surfacing, restore-from-history without a network call, delete.
  - i18n (`src/test/i18n.test.jsx`): pure helpers (resolve fallback,
    interpolation, 15-language registry with ltr/rtl flags), header language
    dropdown (15 options), Hindi header/placeholder switch, Bengali results
    headings, stable finding id across languages, localStorage persistence +
    restore, invalid-value fallback to English, RTL `dir` on `<main>` for
    Arabic/Urdu and back to LTR, user input + results preserved across a
    language switch, provider baseline render.
- Known quirk: jsdom + vitest hang when dispatching a change event with a
  `Uint8Array`-backed `File`; string-backed `File` objects are safe (fixture
  content type chosen accordingly).
- End-to-end verified via production build + live server checks (see PROGRESS
  Phase 12).

## Policy

- A requirement is only marked `TESTED` after the relevant test is executed and
  its result inspected.
- Hard negatives must remain in the suite; removing one is a regression.
- New rules must ship with: matching positive test, at least one hard-negative
  guard, and a dataset sample if India-category specific.
