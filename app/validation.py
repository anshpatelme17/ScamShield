"""Input validation and normalization.

Submitted content is untrusted: it is length-limited, type-checked, and
stripped of control characters before any analysis. Raw input is never logged.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from urllib.parse import urlsplit

from app.config import MAX_INPUT_LENGTH
from app.models import InputType

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class InputValidationError(ValueError):
    """Raised when submitted input is missing, malformed, or too large."""


@dataclass(frozen=True)
class NormalizedInput:
    text: str
    input_type: InputType
    input_length: int
    sha256: str


def normalize_input(raw: object) -> NormalizedInput:
    if not isinstance(raw, str):
        raise InputValidationError("input must be a string")

    cleaned = _CONTROL_CHARS.sub("", raw).strip()
    if not cleaned:
        raise InputValidationError("input must not be empty")
    if len(cleaned) > MAX_INPUT_LENGTH:
        raise InputValidationError(
            f"input exceeds maximum length of {MAX_INPUT_LENGTH} characters"
        )

    return NormalizedInput(
        text=cleaned,
        input_type=detect_input_type(cleaned),
        input_length=len(cleaned),
        sha256=hashlib.sha256(cleaned.encode("utf-8")).hexdigest(),
    )


def detect_input_type(text: str) -> InputType:
    candidate = text.strip()
    if not candidate or any(ch.isspace() for ch in candidate):
        return InputType.TEXT

    parsed = urlsplit(candidate)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return InputType.URL
    if candidate.lower().startswith("www."):
        return InputType.URL
    return InputType.TEXT
