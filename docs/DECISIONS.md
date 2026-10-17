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
| D-011 | India rules are contextual, not keyword-only | Negated security warnings must not be flagged (hard-negative requirement) | 3 |
| D-012 | Each rule fires at most once per analysis | Prevent correlated indicators from being counted repeatedly | 3 |
| D-013 | URLs are parsed, never fetched | Offline MVP; avoids SSRF and malicious-content risks | 3 |
| D-014 | Verdict precedence order is fixed and categorical | Strong evidence > incomplete analysis > medium patterns > weak signals; no numeric score | 4 |
| D-015 | Strong rules are a curated, explicit set | Only near-uniquely-scam indicators (PIN/OTP solicitation, collect request, digital arrest, sextortion, APK) escalate to HIGHLY_SUSPICIOUS | 4 |
| D-016 | Weak signals never produce SUSPICIOUS alone | Single weak signal keeps verdict at NO_STRONG_WARNING_SIGNS_FOUND, with disclaimer | 4 |
