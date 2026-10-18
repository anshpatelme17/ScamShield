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
| D-017 | Request text is never logged | Avoids persisting untrusted/raw suspicious content (privacy + security) | 5 |
| D-018 | Input limits enforced at both Pydantic and normalizer layers | Defense in depth; either layer rejects oversized input | 5 |
| D-019 | Dataset lives in `tests/data/` with exact-verdict expectations | Harness checks binary detection AND exact deterministic verdict | 6 |
| D-020 | Offline is enforced by a socket-blocking test | Proves R-015 instead of assuming it | 6 |
| D-021 | Backend on 8765, frontend dev on 5175 | Docker Desktop occupies 8000/5173 on this machine; avoid collision | 7 |
| D-022 | Vite dev proxy instead of CORS config | Frontend proxies `/api` to localhost in dev; browser setup stays simple and local | 7 |
| D-023 | No rate limiting/auth in MVP | Single-user local deployment; documented as residual risk, required before any public exposure (THREAT_MODEL) | 8 |
| D-024 | Input is data, never instructions | Deterministic rules cannot be reprogrammed by submitted text; LLM prompt injection is structurally impossible in core | 8 |
| D-025 | ReDoS guarded by bounded probes at max length | Patterns are simple, but the guarantee is enforced by tests, not assumptions | 8 |
| D-026 | Hinglish/Devanagari boundaries via lookaround, not `\b` | Python `re` treats matras as non-word; a unified `[\w\u0900-\u097F]` boundary wrapper passes tokens like "केवाईसी" | 9 |
| D-027 | Solicitation negation checked at absolute text positions around the verb | Hindi word order puts verb after secret and negator after verb; clipped windows cut negators in half | 9 |
| D-028 | URLs masked before credential-solicitation analysis | URL path fragments ("/otp/verify") are handled by URL heuristics, not text rules | 9 |
| D-029 | QR decoding supported; general OCR deferred | QR payloads are structured text and pipeline cleanly; OCR needs a native engine (native vendor trust + size) and is documented as future work | 10 |
| D-030 | Undecodable QR images are CHECK_FAILED evidence, not errors | Honesty: the verdict says UNABLE_TO_DETERMINE instead of pretending the image was analyzed | 10 |
