# Architecture

Status: `IMPLEMENTED` (verified through Phases 1–8).

## Implemented flow

```
User Input (browser or API client; typed text and/or base64 image)
    -> Validation and Normalization      app/validation.py
    -> Input Classification              InputType (text | url | image)
    -> Indicator Extraction              app/extractors.py
    -> Small Analysis Router             app/router.py
    -> Relevant Local Analyzers
         India rules                      app/analyzers/india_rules.py
         Hinglish/Devanagari rules        app/analyzers/hinglish_rules.py
         QR analysis (local zxing-cpp)    app/analyzers/qr_analysis.py
         URL heuristics (offline)         app/analyzers/url_heuristics.py
         Text signals                     app/analyzers/text_signals.py
    -> Structured Evidence Findings      app/models.py (Finding)
    -> Scam Case File (+ sha256 only)    app/models.py (ScamCaseFile)
    -> Deterministic Verdict Policy      app/verdict.py
    -> Explanation and Action Guidance   app/explanations.py
    -> HTTP results                      app/api/routes.py + app/main.py
    -> Frontend results                  frontend/ (React 19 + Vite 6 + Tailwind 4)
```

No orchestration engine exists by design. Decoded QR payloads flow through
the same validation and rule pipeline as typed text.

## Components and verified versions

- Python 3.13.5, FastAPI 0.116.1, Pydantic 2.11.7, uvicorn 0.35.0, pytest 8.4.1,
  ruff 0.9.10 (all pinned in `requirements.txt`).
- Node.js v22.23.3 (portable), npm 10.9.9, React 19.x, Vite 6.4.4, Tailwind 4.x.
- Backend listens on port **8765**, frontend dev server on **5175** with an
  `/api` proxy (Docker Desktop occupies 8000/5173 on this machine).

## Principles

- Small, understandable architecture; each analyzer is an independent module
  returning structured `Finding` objects.
- Evidence is data; the verdict is a deterministic policy over that data.
- Core analysis is fully offline (enforced by `tests/test_offline.py`) and does
  not depend on an external API or LLM.
- The system never claims an input is safe merely because no indicators were
  found; the disclaimer travels with every artifact.
- Rule ids (`IN-*`, `URL-*`, `TXT-*`) are traceable from finding to reason.

## Extension points (deferred, not implemented)

- OCR / QR-code / APK file analysis (would join as additional analyzers).
- Optional external threat intelligence (must produce `external_intel`
  source findings and `unverified` status entries only).
- Local persistence (not present; privacy posture documented in
  `THREAT_MODEL.md`).
