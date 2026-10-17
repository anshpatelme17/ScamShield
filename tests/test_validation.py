import hashlib

import pytest

from app.config import MAX_INPUT_LENGTH
from app.models import InputType
from app.validation import (
    InputValidationError,
    detect_input_type,
    normalize_input,
)


def test_normalize_strips_outer_whitespace():
    result = normalize_input("   hello world  ")
    assert result.text == "hello world"
    assert result.input_length == len("hello world")


def test_normalize_computes_sha256():
    result = normalize_input("hello")
    assert result.sha256 == hashlib.sha256(b"hello").hexdigest()


def test_normalize_rejects_non_string():
    with pytest.raises(InputValidationError):
        normalize_input(123)


def test_normalize_rejects_empty():
    with pytest.raises(InputValidationError):
        normalize_input("    \n\t  ")


def test_normalize_rejects_over_length():
    with pytest.raises(InputValidationError):
        normalize_input("a" * (MAX_INPUT_LENGTH + 1))


def test_normalize_accepts_max_length():
    result = normalize_input("a" * MAX_INPUT_LENGTH)
    assert result.input_length == MAX_INPUT_LENGTH


def test_normalize_removes_control_chars_but_keeps_newline_tab():
    result = normalize_input("line1\x00\x07\nline2\tend")
    assert result.text == "line1\nline2\tend"


def test_detect_input_type_url():
    assert detect_input_type("https://example.com/path") is InputType.URL
    assert detect_input_type("http://example.com") is InputType.URL
    assert detect_input_type("www.example.com") is InputType.URL


def test_detect_input_type_text():
    assert detect_input_type("hello there") is InputType.TEXT
    assert detect_input_type("https://example.com and more words") is InputType.TEXT
    assert detect_input_type("just-a-word") is InputType.TEXT
