# Testing

Status: `IN_PROGRESS` (tooling configured in Phase 1; tests added in later phases).

## Tooling

- Test runner: `pytest` (configured in `pyproject.toml`, `testpaths = ["tests"]`).
- Linter: `ruff`.

## Commands

```powershell
# Activate the virtual environment first
.\.venv\Scripts\Activate.ps1

pytest
ruff check .
```

## Policy

- A requirement is only marked `TESTED` after the relevant test is executed and its
  result inspected.
- Hard negatives (e.g. legitimate security warnings that mention OTP/UPI PIN) must be
  included in the test suite.
