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
| R-001 | Repository, tooling, and virtual environment skeleton | TESTED |
| R-002 | Structured evidence model (Finding, Scam Case File) | TESTED |
| R-003 | Input validation and normalization with length limits | TESTED |
| R-004 | Indicator extraction (URLs, keywords, entities) | TESTED |
| R-005 | India-specific scam detection rules | TESTED |
| R-006 | Offline URL heuristics | TESTED |
| R-007 | Deterministic verdict policy (no arbitrary risk score) | TESTED |
| R-008 | Template-based explanations | TESTED |
| R-009 | Action recommendations and reporting guidance | TESTED |
| R-010 | FastAPI backend endpoint | TESTED |
| R-011 | Simple usable frontend | TESTED |
| R-012 | Automated tests, including hard negatives | TESTED |
| R-013 | Labelled India-focused evaluation dataset | TESTED |
| R-014 | Security and privacy safeguards | TESTED |
| R-015 | Offline operation for core analysis | TESTED |
| R-016 | Bilingual Hinglish and Devanagari scam rules with hard negatives | TESTED |
| R-017 | Offline QR-code submission (base64 image) with payload analysis | TESTED |
| R-018 | Frontend QR screenshot attachment | TESTED |
| R-019 | Production packaging: static frontend served by backend with hardened defaults | TESTED |
| R-020 | Frontend build-out: component structure, input tabs, history, case export | TESTED |
| R-021 | Frontend component/integration test layer (Vitest + Testing Library) | TESTED |
| R-022 | OCR of Latin-script text inside images via local rapidocr; image with neither QR nor readable text is CHECK_FAILED -> UNABLE_TO_DETERMINE | TESTED |
