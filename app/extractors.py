"""Indicator extraction from untrusted text.

Patterns use simple, bounded constructs to avoid catastrophic backtracking.
No network access is performed; extraction is purely local.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

URL_PATTERN = re.compile(r"(?i)(?:https?://|www\.)[^\s<>\"'\)\]]+")
_UPI_PATTERN = re.compile(r"\b([A-Za-z0-9._-]{2,64})@([A-Za-z]{2,32})\b")
_PHONE_PATTERN = re.compile(r"(?:(?:\+|00)91[\s-]?)?\b[6-9]\d{9}\b")
_APK_PATTERN = re.compile(r"(?i)\b[\w.-]{1,80}\.apk\b")
_AMOUNT_PATTERN = re.compile(r"(?i)(?:rs\.?|inr|₹)\s?(\d[\d,]*(?:\.\d{1,2})?)")

_UPI_HANDLES = frozenset(
    {
        "ybl", "oksbi", "okhdfcbank", "okicici", "okaxis", "paytm", "apl", "ibl",
        "axl", "upi", "yapl", "rapl", "fbl", "waaxis", "waicici", "wahdfcbank",
        "wasbi", "axisb", "icici", "hdfcbank", "sbi", "kotak", "pnb", "barodampay",
    }
)
_TRAILING_PUNCT = ".,;:!?)]}"


@dataclass(frozen=True)
class ExtractedIndicators:
    urls: tuple[str, ...] = ()
    upi_ids: tuple[str, ...] = ()
    phone_numbers: tuple[str, ...] = ()
    apk_references: tuple[str, ...] = ()
    amounts_inr: tuple[str, ...] = ()


def extract_urls(text: str) -> tuple[str, ...]:
    found = []
    for match in URL_PATTERN.finditer(text):
        candidate = match.group(0).rstrip(_TRAILING_PUNCT)
        if candidate and candidate not in found:
            found.append(candidate)
    return tuple(found)


def extract_indicators(text: str) -> ExtractedIndicators:
    upi_ids, phones, apks, amounts = [], [], [], []
    for match in _UPI_PATTERN.finditer(text):
        if match.group(2).lower() in _UPI_HANDLES and match.group(0) not in upi_ids:
            upi_ids.append(match.group(0))
    for match in _PHONE_PATTERN.finditer(text):
        if match.group(0) not in phones:
            phones.append(match.group(0))
    for match in _APK_PATTERN.finditer(text):
        if match.group(0) not in apks:
            apks.append(match.group(0))
    for match in _AMOUNT_PATTERN.finditer(text):
        value = match.group(1)
        if value not in amounts:
            amounts.append(value)

    return ExtractedIndicators(
        urls=extract_urls(text),
        upi_ids=tuple(upi_ids),
        phone_numbers=tuple(phones),
        apk_references=tuple(apks),
        amounts_inr=tuple(amounts),
    )
