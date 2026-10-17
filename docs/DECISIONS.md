# Decisions

Record of significant technical decisions (ADR-style, lightweight).

| ID | Decision | Rationale | Phase |
|----|----------|-----------|-------|
| D-001 | Project root is `D:\innotech` | User-selected clean, empty directory | 0 |
| D-002 | Independent Git repository for the project | Parent repo exists at `D:\.git` (owned by SYSTEM); isolation avoids interference | 0 |
| D-003 | Backend-first, Python-only start | Node.js/npm not installed; defer frontend to a later phase | 0 |
| D-004 | Local `.venv` virtual environment | Avoid polluting the global Python environment | 1 |
| D-005 | Verdicts are categorical, not numeric | Arbitrary risk scores rejected unless validated and approved | 0 |
| D-006 | Core analysis fully offline | Offline-first requirement; no external API/LLM dependency | 0 |
