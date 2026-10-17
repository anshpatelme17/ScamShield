# Requirements

Status vocabulary used throughout this document:

- `NOT_STARTED`
- `IN_PROGRESS`
- `IMPLEMENTED`
- `TESTED`
- `BLOCKED`
- `DEFERRED`

A requirement is marked `TESTED` only after the relevant test has been executed and
its result inspected.

| ID | Requirement | Status |
|----|-------------|--------|
| R-001 | Repository, tooling, and virtual environment skeleton | IN_PROGRESS |
| R-002 | Structured evidence model (Finding, Scam Case File) | TESTED |
| R-003 | Input validation and normalization with length limits | TESTED |
| R-004 | Indicator extraction (URLs, keywords, entities) | TESTED |
| R-005 | India-specific scam detection rules | TESTED |
| R-006 | Offline URL heuristics | TESTED |
| R-007 | Deterministic verdict policy (no arbitrary risk score) | TESTED |
| R-008 | Template-based explanations | TESTED |
| R-009 | Action recommendations and reporting guidance | TESTED |
| R-010 | FastAPI backend endpoint | TESTED |
| R-011 | Simple usable frontend | NOT_STARTED |
| R-012 | Automated tests, including hard negatives | NOT_STARTED |
| R-013 | Labelled India-focused evaluation dataset | NOT_STARTED |
| R-014 | Security and privacy safeguards | NOT_STARTED |
| R-015 | Offline operation for core analysis | NOT_STARTED |
