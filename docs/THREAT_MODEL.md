# Threat Model

Status: `NOT_STARTED` (initial notes below; expanded in Phase 8).

All submitted messages, URLs, files, and extracted content are treated as **untrusted**.

## Planned safeguards

- Input length limits.
- Strict input validation.
- Safe URL parsing.
- ReDoS-resistant regular expressions.
- File upload size and type restrictions if uploads are introduced.
- No automatic opening or fetching of arbitrary user-submitted URLs in the MVP.
- SSRF protection if remote fetching is introduced later.
- No execution of submitted APKs or other files.
- No raw suspicious messages in application logs by default.
- Clear privacy disclosures if data is stored or sent to third parties.
- Safe handling of prompt injection in submitted content.
- No automatic trust of user feedback.
- Graceful handling of missing dependencies and unavailable external services.
