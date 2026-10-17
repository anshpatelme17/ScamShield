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
| D-007 | Findings are immutable and reject extra fields | Evidence must be stable and schema-strict; prevents silent drift | 2 |
| D-008 | Finding status/source are explicit enums | Distinguish observed input, local rules, external intel, unverified claims, and failed checks | 2 |
| D-009 | Over-length input is rejected, not truncated | Avoid analyzing partial content that could mislead the verdict | 2 |
| D-010 | Store sha256 + length, not raw input, in the case file | Privacy: reference submissions without persisting raw content | 2 |
