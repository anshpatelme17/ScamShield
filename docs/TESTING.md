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

- **180 passed** in ~26 s (single warning: starlette testclient deprecation,
  library-internal; timing dominated by OCR engine init and the 11 OCR-image
  samples in the evaluation gate).
- `tests/test_environment.py` â€” Python/dependency smoke.
- `tests/test_models.py` â€” evidence model integrity (unique ids, strict/frozen).
- `tests/test_validation.py` â€” input limits, control-character stripping,
  type/URL detection.
- `tests/test_extractors.py` â€” URL/UPI/phone/APK/amount extraction.
- `tests/test_analyzers.py` â€” India rules incl. the **hard negative** ("Never
  share your OTP or UPI PIN...") must produce zero findings.
- `tests/test_hinglish.py` â€” Hinglish/Devanagari rules incl. Devanagari bank
  warning hard negative, postal "pin code" guard, and negated-security
  variants ("share na karein" / "à¤¶à¥‡à¤¯à¤° à¤¨ à¤•à¤°à¥‡à¤‚").
- `tests/test_url_heuristics.py` â€” offline URL checks incl. `CHECK_FAILED`
  path for unparseable URLs.
- `tests/test_router.py` â€” sequential ids, dedupe by rule, verdict outcomes.
- `tests/test_verdict.py` â€” deterministic precedence incl. strong-rule
  dominance, check-failed -> UNABLE_TO_DETERMINE, weak-signal thresholds.
- `tests/test_explanations.py` â€” templates, actions, unverified lists,
  disclaimers.
- `tests/test_api.py` â€” FastAPI integration: valid/invalid inputs, 422s,
  verdicts, response shape.
- `tests/test_qr.py` â€” QR ingestion: generated QR fixtures decoded in-process
  (UPI payload -> suspicious, scam text payload via the text pipeline, benign
  payload clean, no-symbol observed, undecodable -> CHECK_FAILED ->
  unable_to_determine, oversize -> 422, text+image combined).
- `tests/test_serve.py` â€” production packaging: security headers on every
  response, built frontend served at "/", API reachable under the mount,
  unknown path -> 404 (static-content tests skip when frontend is unbuilt).
- `tests/test_eval.py` â€” labelled dataset gate: hard negatives must all pass,
  zero false positives, precision/recall >= 0.9, every scam category fully
  detected (executed metrics: 51/51 samples incl. the OCR-image channel,
  accuracy = precision = recall = F1 = 1.0; 32 scam / 19 hard negatives of
  which 6 are OCR-image hard negatives).
- `tests/test_offline.py` â€” **sockets are blocked** while the whole pipeline
  and the full evaluation run (prove R-015), plus a live OCR-based image
  analysis with sockets blocked (prove R-022 offline claim).
- `tests/test_redos.py` â€” 29 adversarial probes at the exact input-size limit
  (max length), each must finish analysis in < 5 s. Executed: all pass in
  ~0.3 s total, worst probe ~0.05 s.
- `tests/test_image_text.py` â€” local OCR of images: synthetic PNGs are read by
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

### Phone channel, universal input and i18n fallback policy (Phase 18)

- `tests/test_phone.py` (6 tests): URL beats phone classification, letters
  switch to text, "1930" stays text, valid +91-number format check produces
  an `observed` finding (verdict unchanged), invalid numbers flagged, long
  digit strings stay text. Category: format-only validation, no reputation
  data (documented limitation in the finding itself).
- `verdict_reason_specs` tested round-trip: every verdict branch emits
  machine-resolvable reason specs; API payload includes them.
- InputPanel tests rewritten for the universal input: no tabs, live
  "Detected input" chip (url / phone number / message), oversize rejection,
  audio/video rejection with explicit not-supported message, non-PNG/JPEG
  rejection, JPEG magic-byte acceptance, text+image combined submission,
  clear button, busy state. jsdom quirk note: magic-byte sniff runs on the
  data-URL base64 prefix (`iVBORw...` / `/9j/...`), so byte-backed `File`
  fixtures work there without string backing.
- i18n suite now: 16-language registry (Odia included), static-key parity
  enforced by `frontend/i18n-audit.mjs` (AUDIT OK), and the fallback-policy
  unit tests: full dynamic `rule.*` catalogs exist only for en/hi/bn; every
  other language must have zero rule keys and only the full statics set;
  `resolveFindingFields` marks untranslated rule text with
  `i18n.fallbackEnglish` for statics-only locales and no marker for
  en/hi/bn. History entries moved from raw English `label` to `label_key`
  (image / phone / pasted) so entries render in any selected language.
- **Translation quality policy**: long-form safety translations were only
  kept where they could be verified (en, hi, bn get the full dynamic
  catalogs). For the other 13 languages the rule-text fields intentionally
  remain English with the visible "(...)" no-translation marker in the
  selected language, instead of unverifiable script text.
- Executed results: backend 180 passed / ruff clean; frontend 67 passed;
  production build clean; live CDP session verified phone analysis, Hindi
  full UI, Telugu statics with marked-English rule sentences, and 3-width
  layout screenshots (1440/800/390).
