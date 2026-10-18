import base64
import io
import socket

import pytest
from PIL import Image, ImageDraw, ImageFont

from app.eval import evaluate, load_dataset
from app.router import build_case_file, run_analysis
from app.validation import normalize_input


@pytest.fixture(autouse=True)
def block_network(monkeypatch):
    def _deny(*args, **kwargs):
        raise AssertionError("network access attempted during analysis")

    monkeypatch.setattr(socket, "socket", _deny)
    monkeypatch.setattr(socket, "create_connection", _deny)


def test_analysis_runs_fully_offline():
    normalized = normalize_input("Enter your UPI PIN to receive money. http://1.2.3.4/otp")
    findings = run_analysis(normalized)
    assert findings


def test_full_evaluation_runs_fully_offline():
    report = evaluate(load_dataset())
    assert report.total >= 20


def test_image_ocr_runs_fully_offline():
    img = Image.new("RGB", (640, 80), "white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 30)
    draw.text((20, 25), "Enter your UPI PIN to receive the money", fill="black", font=font)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    case = build_case_file(image_b64=base64.b64encode(buf.getvalue()).decode())
    assert case.verdict.value == "highly_suspicious"
