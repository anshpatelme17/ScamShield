# ScamShield AI 2.0

**"Don't Just Detect the Scam. Investigate the Evidence."**

An India-focused, offline-first scam investigation platform. It analyzes suspicious
messages and links and produces an **evidence-backed Scam Case File** rather than a
single opaque risk score.

# Status

All core phases complete (Phases 1-8): offline analysis engine, deterministic
verdict policy, evidence-backed Scam Case File, FastAPI backend, React
frontend, labelled evaluation dataset (21/21, zero false positives), and a
security audit suite with ReDoS probes. 121 automated tests pass locally.

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

# Run the API (port 8765; port 8000 is taken by Docker on this machine)
python -m uvicorn app.main:app --port 8765

# Run the frontend (in a second terminal, from the frontend/ folder)
# Node.js 22 is installed at %LOCALAPPDATA%\Programs\nodejs\node-v22.23.3-win-x64
cd frontend
npm install
npm run dev
```

Open `http://localhost:5175`. The vite dev server proxies `/api/*` to the
backend at `127.0.0.1:8765`.

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
