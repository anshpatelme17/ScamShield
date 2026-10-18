"""Offline OCR of text inside images.

Screenshots of scam SMS/WhatsApp messages are a common scam channel. The
bundled rapidocr models (PNG/JPEG decode, detection, recognition) run fully
locally via onnxruntime; nothing here touches the network. OCR output is
untrusted text: it flows through the same validation and rule pipeline as
typed text.

Limitation: the bundled recognition model reads Latin-script text only
(English and Hinglish written in Latin letters). Devanagari text inside
images is not recognized (see docs/DECISIONS.md D-032); typed and QR-payload
text are unaffected.
"""

from __future__ import annotations

import threading

from app.config import MAX_INPUT_LENGTH

_OCR_MIN_SCORE = 0.5
_MIN_TEXT_CHARS = 3

_engine_lock = threading.Lock()
_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        with _engine_lock:
            if _engine is None:
                from rapidocr import RapidOCR

                _engine = RapidOCR()
    return _engine


def extract_text(image_bytes: bytes) -> str | None:
    """Run local OCR on image bytes; return cleaned text, or None."""
    try:
        out = _get_engine()(image_bytes)
    except Exception:
        return None
    if out is None or not out.txts:
        return None
    pieces = [
        box_text.strip()
        for box_text, score in zip(out.txts, out.scores)
        if score >= _OCR_MIN_SCORE and box_text.strip()
    ]
    text = " ".join(pieces)
    text = " ".join(text.split())
    if len(text) < _MIN_TEXT_CHARS:
        return None
    return text[:MAX_INPUT_LENGTH]
