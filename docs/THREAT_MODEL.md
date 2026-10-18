# Threat Model

Status: `IMPLEMENTED` (audited and tested in Phase 8).

All submitted messages, URLs, files, and extracted content are treated as
**untrusted**.

## Trust boundaries

```
Browser (untrusted input)  ->  vite dev proxy  ->  FastAPI (untrusted input)
                                        ->  validation  ->  analyzers  ->  artifacts out
```

- The user's browser and everything the user types are outside the trust boundary.
- Submissions are only ever data to the rule engine; they never become code.
- No component fetches remote content on behalf of the user.

## Controls and their status

| Threat / requirement | Control | Status |
|---|---|---|
| Oversized payloads / denial of service | Input capped at 10,000 chars, enforced at Pydantic layer and again after control-character stripping (`app/config.py`, `app/validation.py`, `app/api/routes.py`) | TESTED |
| Malformed input | Strict type/emptiness checks; all rejections return 422 without echoing content | TESTED |
| ReDoS | All regexes use bounded quantifiers or simple alternations with no nested or unbounded ambiguity; adversarial probe suite (`tests/test_redos.py`, 29 probes) completes full analysis in < 0.1 s per probe | TESTED |
| SSRF via URL analysis | URLs are parsed with `urlsplit` only — never resolved, fetched, or opened | Implemented, no network primitives exist (`tests/test_offline.py` blocks sockets) |
| Malicious file execution | No file upload/execution exists; APK text is analyzed as text only | Implemented (feature absent) |
| Leakage of user content into logs | No logging at all; submitted text never written anywhere | Audited (grep over `app/`) |
| Prompt injection | Core analysis is deterministic Python rules, not an LLM. Text with instructions in it cannot alter behavior; it can only match pre-built patterns | By design |
| XSS via extracted evidence | React escapes all rendered text; no `dangerouslySetInnerHTML` anywhere in the frontend | Implemented |
| Verdict gaming / false sense of safety | `NO_STRONG_WARNING_SIGNS_FOUND` explicitly disclaims safety; disclaimer + reporting guidance are always included | TESTED |
| XSS / UI tampering via HTTP layer | Security headers on every response: CSP `default-src 'self'`, `X-Frame-Options: DENY` (also CSP `frame-ancestors 'none'`), `nosniff`, `no-referrer` (`app/main.py`) | TESTED |
| Exposure to network peers | Production launcher binds to 127.0.0.1 only (`app/serve.py`); no NAT traversal or `--host` public overwrites unless the operator explicitly asks for it | TESTED |
| Correlated indicator inflation | Router emits each rule at most once; verdict counts distinct rule ids | TESTED |
| Unavailable dependencies / services | Analysis has no external dependencies or services; API errors map to clean 4xx/5xx without leaking internals | Implemented |
| Trusted feedback | No user-feedback or voting feature exists | Implemented (feature absent) |

## Privacy posture

- Submitted text is processed in memory only and **not stored, logged, or persisted**.
- The case file references a submission by SHA-256 and length only.
- No third-party services, telemetry, or analytics exist in either component.
- If persistence or external services are added later, this document and the
  UI disclosures must be updated first.

## Residual risks / accepted limits

1. **Scam wording evolves** — scam messages that paraphrase or avoid the
   pattern vocabulary will not match rules. This is accepted because the
   product never claims safety when nothing matches.
2. **English-only patterns** — Hindi/Hinglish variations are not yet covered.
3. **No rate limiting / authentication** — the API is intended for local
   single-user or LAN-of-trust deployment. Do NOT expose the current API
   publicly without adding rate limiting, authentication, and a security
   review of deployment settings.
4. **Dev proxy is development-only** — production deployment needs a static
   build behind a proper web server with hardened TLS configuration.
5. **Offline URL heuristics are structural only** — domains can look benign
   while serving fraud; contrary to #1, verdicts are never "safe".

## Verification summary (evidence)

- `pytest` — 121 passed, including 29 ReDoS probes at the max input length.
- `tests/test_offline.py` — analysis completes with sockets blocked (proves no
  network use).
- `tests/test_api.py` — malformed/oversized/non-string inputs rejected 422.
- Code audit — no logging, no secrets, no HTTP client, no `subprocess`,
  no `eval`/`exec` in `app/`.
