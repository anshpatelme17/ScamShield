"""Offline QR-code analysis.

A submitted image (base64-encoded PNG/JPEG) is decoded locally with
zxing-cpp. Decoded payloads are untrusted text: they flow through the same
validation and rule pipeline as typed text. Nothing here touches the
network, and image data is never logged.

OCR of arbitrary text inside images is out of scope: it would require a
native OCR engine (see docs/DECISIONS.md D-029).
"""

from __future__ import annotations

import base64
import binascii
import hashlib
import io
import re
from dataclasses import dataclass

import zxingcpp
from PIL import Image, UnidentifiedImageError

from app.analyzers.base import make_finding, snippet
from app.config import MAX_IMAGE_BYTES, MAX_PAYLOADS_PER_SCHEME
from app.models import Finding, FindingCategory, FindingStatus
from app.validation import InputValidationError

_MAX_IMAGE_B64_LENGTH = (MAX_IMAGE_BYTES * 4 + 3) // 3

_DATA_URI_PREFIX = re.compile(r"(?i)^data:[^;,]{0,100};base64,")
_QR_FORMATS = (zxingcpp.QRCode, zxingcpp.MicroQRCode, zxingcpp.RMQRCode)
_MAX_PIXELS = 25_000_000

_DECODE_FAILED_NOTE = (
    "image could not be decoded; accepted formats are PNG and JPEG"
)


class QRSubmissionError(ValueError):
    """Raised when the submitted image is malformed or oversized."""


@dataclass(frozen=True)
class QRSubmission:
    sha256: str
    byte_length: int
    payloads: tuple[str, ...]
    decode_failed: bool
    error_note: str | None
    format_names: tuple[str, ...] = ()


def _failed_submission(
    image_bytes: bytes, error_note: str
) -> QRSubmission:
    return QRSubmission(
        sha256=hashlib.sha256(image_bytes).hexdigest(),
        byte_length=len(image_bytes),
        payloads=(),
        decode_failed=True,
        error_note=error_note,
    )


def prepare_qr_submission(image_b64: str) -> QRSubmission:
    raw = image_b64.strip()
    if len(raw) > _MAX_IMAGE_B64_LENGTH:
        raise InputValidationError(
            f"image exceeds maximum size of {MAX_IMAGE_BYTES} bytes"
        )

    data_uri_match = _DATA_URI_PREFIX.match(raw)
    if data_uri_match:
        raw = raw[data_uri_match.end() :]

    try:
        image_bytes = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        return QRSubmission(
            sha256=hashlib.sha256(raw.encode("utf-8")).hexdigest(),
            byte_length=0,
            payloads=(),
            decode_failed=True,
            error_note="image is not valid base64 data",
        )
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise InputValidationError(
            f"image exceeds maximum size of {MAX_IMAGE_BYTES} bytes"
        )
    if not image_bytes:
        return _failed_submission(image_bytes, "image payload is empty")

    try:
        with Image.open(io.BytesIO(image_bytes)) as opened:
            width, height = opened.size
            frame = opened.convert("RGB")
    except (UnidentifiedImageError, OSError):
        return _failed_submission(image_bytes, _DECODE_FAILED_NOTE)

    if width * height > _MAX_PIXELS:
        frame.close()
        raise QRSubmissionError("image dimensions exceed the pixel limit")

    try:
        results = zxingcpp.read_barcodes(frame, _QR_FORMATS)
    except Exception:
        frame.close()
        return _failed_submission(image_bytes, "local QR decoder failed on this image")

    frame.close()

    payloads: list[str] = []
    format_names: list[str] = []
    for found in results:
        text = found.text
        if not text:
            continue
        if text not in payloads:
            payloads.append(text)
        if found.format.name not in format_names:
            format_names.append(found.format.name)
        if len(payloads) >= MAX_PAYLOADS_PER_SCHEME:
            break

    return QRSubmission(
        sha256=hashlib.sha256(image_bytes).hexdigest(),
        byte_length=len(image_bytes),
        payloads=tuple(payloads),
        decode_failed=False,
        error_note=None,
        format_names=tuple(format_names),
    )


def analyze_qr_submission(submission: QRSubmission) -> tuple[Finding, ...]:
    findings: list[Finding] = []

    if submission.decode_failed:
        findings.append(
            make_finding(
                rule_id="QR-IMG-001",
                category=FindingCategory.OTHER,
                title="QR code submitted but could not be decoded",
                evidence=submission.error_note or "decode failed",
                status=FindingStatus.CHECK_FAILED,
                limitations=(
                    "The local decoder could not read this image; its QR payload "
                    "is unanalyzed and the verdict reflects that incompleteness."
                ),
            )
        )
        return tuple(findings)

    if not submission.payloads:
        findings.append(
            make_finding(
                rule_id="QR-IMG-001",
                category=FindingCategory.OTHER,
                title="QR code image submitted; no QR symbol found",
                evidence="image decoded, but no QR/2D symbol found",
                status=FindingStatus.OBSERVED,
                limitations=(
                    "No QR symbol was detected; verify visually whether the "
                    "image actually contains a QR code."
                ),
            )
        )
        return tuple(findings)

    evidence = (
        f"{len(submission.payloads)} QR/2D payload(s) decoded locally "
        f"({', '.join(submission.format_names)}); payloads analyzed as text."
    )
    findings.append(
        make_finding(
            rule_id="QR-IMG-001",
            category=FindingCategory.OTHER,
            title="QR code image submitted; payload decoded",
            evidence=evidence,
            status=FindingStatus.OBSERVED,
            limitations=(
                "Decoded payload text comes from an image provided by the sender; "
                "its authenticity is not verified."
            ),
        )
    )

    for payload in submission.payloads:
        if payload.lower().startswith("upi://"):
            findings.append(
                make_finding(
                    rule_id="IN-QR-UPI-001",
                    category=FindingCategory.UPI_COLLECT_REQUEST,
                    title="UPI payment QR payload (upi://)",
                    evidence=snippet(payload),
                    limitations=(
                        "A QR that opens a UPI payment screen is legitimate for "
                        "purchases you initiate; scam messages also embed UPI "
                        "QR codes to start collect or debit flows."
                    ),
                    recommended_action=(
                        "Scan UPI QR codes only via your bank app's own scanner "
                        "and only for payments you initiated. Do not scan QR "
                        "codes sent in unsolicited messages."
                    ),
                )
            )

    return tuple(findings)
