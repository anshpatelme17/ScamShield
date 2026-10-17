# ScamShield AI 2.0

**"Don't Just Detect the Scam. Investigate the Evidence."**

An India-focused, offline-first scam investigation platform. It analyzes suspicious
messages and links and produces an **evidence-backed Scam Case File** rather than a
single opaque risk score.

## Status

Phase 1 (repository & tooling skeleton) — in progress.

## Project layout

```
app/        Backend analysis package (added in later phases)
tests/      Automated tests
data/rules/ Rule data (JSON)
docs/       Project documentation
frontend/   Web UI (added in a later phase)
```

## Development

The core analysis runs **fully offline** and does not depend on any external API or LLM.

```powershell
# Create and activate the virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Lint
ruff check .

# Run the API
python -m uvicorn app.main:app --reload
```

The API exposes:

- `GET /api/health` - service check
- `POST /api/analyze` with JSON body `{"text": "<message or URL>"}`
  - returns the Scam Case File (findings + verdict) and a plain-language
    explanation with recommended actions and reporting guidance.

## Documentation

- `docs/REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/THREAT_MODEL.md`
- `docs/TESTING.md`
- `docs/PROGRESS.md`
- `docs/DECISIONS.md`

## Guiding principle

The system must **never** claim a message or URL is safe simply because its current
checks found no suspicious indicators.
