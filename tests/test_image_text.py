import base64
import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont

from app.analyzers import image_text
from app.main import create_app

FONT_PATH = "C:/Windows/Fonts/arial.ttf"


def text_png_b64(lines, size=30, width=640, height=None):
    height = height or 60 * len(lines) + 20
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, size)
    for index, line in enumerate(lines):
        draw.text((20, 20 + 60 * index), line, fill="black", font=font)
    out = io.BytesIO()
    img.save(out, format="PNG")
    return base64.b64encode(out.getvalue()).decode()


@pytest.fixture()
def client():
    return TestClient(create_app())


class FakeOutput:
    def __init__(self, txts, scores):
        self.txts = txts
        self.scores = scores


def test_ocr_extracts_english_text():
    text = image_text.extract_text(base64.b64decode(text_png_b64(["KYC expired, pay Rs 5000 now"])))
    assert text is not None
    assert "KYC" in text
    assert "5000" in text


def test_ocr_two_lines_are_joined_in_order():
    text = image_text.extract_text(
        base64.b64decode(text_png_b64(["Your KYC expired,", "pay Rs 5000 now"]))
    )
    assert text is not None
    assert "expired" in text and "5000" in text
    assert text.index("expired") < text.index("5000")


def test_ocr_blank_image_returns_none():
    blank = Image.new("RGB", (200, 120), "white")
    buf = io.BytesIO()
    blank.save(buf, format="PNG")
    assert image_text.extract_text(buf.getvalue()) is None


def test_ocr_engine_failure_returns_none(monkeypatch):
    def boom(_image_bytes):
        raise RuntimeError("engine exploded")

    monkeypatch.setattr(image_text, "_get_engine", boom)
    assert image_text.extract_text(b"\x89PNG...") is None


def test_ocr_drops_low_confidence_pieces(monkeypatch):
    monkeypatch.setattr(
        image_text,
        "_get_engine",
        lambda: lambda _b: FakeOutput(["Enter your UPI PIN", "noise!!!"], [0.95, 0.2]),
    )
    text = image_text.extract_text(b"fake")
    assert text == "Enter your UPI PIN"


def test_ocr_short_total_text_treated_as_nothing(monkeypatch):
    monkeypatch.setattr(
        image_text, "_get_engine", lambda: lambda _b: FakeOutput(["ab"], [0.9])
    )
    assert image_text.extract_text(b"fake") is None


def test_image_with_scam_text_is_highly_suspicious(client):
    response = client.post(
        "/api/analyze",
        json={"image_b64": text_png_b64(["Enter your UPI PIN to receive the money"])},
    )
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "highly_suspicious"
    rule_ids = [f["rule_id"] for f in case["findings"]]
    assert "IN-SECRET-001" in rule_ids


def test_image_with_hinglish_text_is_highly_suspicious(client):
    response = client.post(
        "/api/analyze",
        json={
            "image_b64": text_png_b64(
                ["Apna OTP share karein taaki delivery verify ho sake."]
            )
        },
    )
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "highly_suspicious"
    rule_ids = [f["rule_id"] for f in case["findings"]]
    assert "IN-H-SECRET-001" in rule_ids


def test_image_with_url_text_gets_url_checks(client):
    response = client.post(
        "/api/analyze",
        json={
            "image_b64": text_png_b64(
                ["kbc lottery win, click below", "http://kbc-lottery-winner.tk/claim"]
            )
        },
    )
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "suspicious"
    rule_ids = [f["rule_id"] for f in case["findings"]]
    assert any(rule.startswith("URL-") for rule in rule_ids)
    assert "IN-IMG-NO-CONTENT-001" not in rule_ids


def test_image_with_benign_text_is_clean(client):
    response = client.post(
        "/api/analyze",
        json={"image_b64": text_png_b64(["Team meeting at 6 pm today."])},
    )
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "no_strong_warning_signs_found"
    rule_ids = [f["rule_id"] for f in case["findings"]]
    assert "IN-IMG-NO-CONTENT-001" not in rule_ids


def test_text_and_image_combined_prefers_typed_text_findings(client):
    response = client.post(
        "/api/analyze",
        json={
            "text": "Enter your UPI PIN to receive the money.",
            "image_b64": text_png_b64(["Enter your UPI PIN to receive the money"]),
        },
    )
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "highly_suspicious"
    secret = [f for f in case["findings"] if f["rule_id"] == "IN-SECRET-001"]
    assert len(secret) == 1
