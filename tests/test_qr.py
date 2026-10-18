import base64
import io

import pytest
import zxingcpp
from fastapi.testclient import TestClient
from PIL import Image

import app.router as router_mod
from app.main import create_app
from app.validation import normalize_input
from app.verdict import determine_verdict


def qr_png_b64(payload: str, scale: int = 8) -> str:
    barcode = zxingcpp.create_barcode(payload, zxingcpp.BarcodeFormat.QRCode)
    img = zxingcpp.write_barcode_to_image(barcode, scale=scale)
    buf = bytes(img)
    height, width = img.shape
    gray = Image.frombuffer("L", (width, height), buf, "raw", "L", 0, 1)
    out = io.BytesIO()
    gray.save(out, format="PNG")
    return base64.b64encode(out.getvalue()).decode()


SUSPICIOUS_QR_PAYLOAD = (
    "KYC khatam hone wala hai. Turant update karein: http://sbi-kyc-update.top/verify"
)
UPI_QR_PAYLOAD = "upi://pay?pa=scammer@ybl&pn=Fraud+Friend"
BENIGN_QR_PAYLOAD = "team lunch: Friday at 1 pm, cafeteria"


@pytest.fixture()
def client():
    return TestClient(create_app())


def _post(client, text=None, image_b64=None):
    payload = {}
    if text is not None and text != "":
        payload["text"] = text
    if image_b64 is not None:
        payload["image_b64"] = image_b64
    return client.post("/api/analyze", json=payload)


def test_qr_upi_payload_is_suspicious(client):
    response = _post(client, image_b64=qr_png_b64(UPI_QR_PAYLOAD))
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "suspicious"
    rule_ids = [f["rule_id"] for f in case["findings"]]
    assert "QR-IMG-001" in rule_ids
    assert "IN-QR-UPI-001" in rule_ids


def test_qr_scam_text_payload_analyzed_as_text(client):
    response = _post(client, image_b64=qr_png_b64(SUSPICIOUS_QR_PAYLOAD))
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "suspicious"
    rule_ids = [f["rule_id"] for f in case["findings"]]
    assert "IN-H-KYC-001" in rule_ids
    assert any(r.startswith("URL-") for r in rule_ids)


def test_qr_highly_suspicious_payload_via_text_pipeline(client):
    response = _post(
        client, image_b64=qr_png_b64("Apna OTP share karein taaki delivery verify ho sake.")
    )
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "highly_suspicious"


def test_qr_benign_payload_is_not_flagged(client):
    response = _post(client, image_b64=qr_png_b64(BENIGN_QR_PAYLOAD))
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "no_strong_warning_signs_found"
    rule_ids = [f["rule_id"] for f in case["findings"]]
    assert rule_ids == ["QR-IMG-001"]


def test_qr_image_without_symbol_is_observed(client):
    blank = Image.new("L", (120, 120), color=255)
    out = io.BytesIO()
    blank.save(out, format="PNG")
    response = _post(client, image_b64=base64.b64encode(out.getvalue()).decode())
    assert response.status_code == 200
    case = response.json()["case_file"]
    rule_ids = [f["rule_id"] for f in case["findings"]]
    assert rule_ids == ["QR-IMG-001"]
    statuses = [f["status"] for f in case["findings"]]
    assert statuses == ["observed"]
    assert case["verdict"] == "no_strong_warning_signs_found"


def test_qr_undecodable_image_yields_check_failed_and_unable(client):
    garbage = base64.b64encode(b"not-really-an-image-at-all").decode()
    response = _post(client, image_b64=garbage)
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "unable_to_determine"
    first = case["findings"][0]
    assert first["rule_id"] == "QR-IMG-001"
    assert first["status"] == "check_failed"


def test_qr_invalid_base64_fails_gracefully(client):
    response = _post(client, image_b64="@@not-base64@@")
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "unable_to_determine"


def test_qr_oversized_image_rejected(client):
    from app.config import MAX_IMAGE_BYTES

    big = b"\x00" * (MAX_IMAGE_BYTES + 100)
    response = _post(client, image_b64=base64.b64encode(big).decode())
    assert response.status_code == 422


def test_text_and_image_combined(client):
    response = _post(
        client,
        text="Enter your UPI PIN to receive the money.",
        image_b64=qr_png_b64(BENIGN_QR_PAYLOAD),
    )
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["verdict"] == "highly_suspicious"
    rule_ids = [f["rule_id"] for f in case["findings"]]
    assert "IN-SECRET-001" in rule_ids
    assert "QR-IMG-001" in rule_ids
    assert case["input_type"] == "image"


def test_text_only_request_unchanged(client):
    response = _post(client, text="Your account will be suspended soon.")
    assert response.status_code == 200
    case = response.json()["case_file"]
    assert case["input_type"] == "text"


def test_empty_request_rejected(client):
    response = _post(client)
    assert response.status_code == 422


def test_build_case_file_image_only_identity():
    from app.router import build_case_file

    case = build_case_file(image_b64=qr_png_b64(BENIGN_QR_PAYLOAD))
    assert case.input_type.value == "image"
    assert case.input_sha256 and len(case.input_sha256) == 64
    verdict_result = determine_verdict(tuple(case.findings))
    assert verdict_result.verdict.value == "no_strong_warning_signs_found"


def test_run_analysis_without_sources_raises():
    with pytest.raises(ValueError):
        router_mod.run_analysis()


def test_exact_input_image_identity_normalization():
    normalized = normalize_input("hello")
    assert normalized.input_type.value == "text"
