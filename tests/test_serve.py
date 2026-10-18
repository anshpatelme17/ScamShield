import pytest
from fastapi.testclient import TestClient

from app.main import _FRONTEND_DIST, create_app


@pytest.fixture()
def client():
    return TestClient(create_app())


def test_security_headers_on_api_responses(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    for name, value in {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
    }.items():
        assert response.headers.get(name) == value
    csp = response.headers.get("Content-Security-Policy", "")
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp


def test_security_headers_do_not_break_analyze(client):
    response = client.post("/api/analyze", json={"text": "Enter your UPI PIN to receive money."})
    assert response.status_code == 200
    assert response.json()["case_file"]["verdict"] == "highly_suspicious"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"


@pytest.mark.skipif(not _FRONTEND_DIST.is_dir(), reason="frontend not built")
def test_built_index_served_at_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert '<div id="root">' in response.text
    assert response.headers.get("X-Frame-Options") == "DENY"


@pytest.mark.skipif(not _FRONTEND_DIST.is_dir(), reason="frontend not built")
def test_api_still_reachable_with_frontend_mounted(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.skipif(not _FRONTEND_DIST.is_dir(), reason="frontend not built")
def test_unknown_path_returns_404(client):
    assert client.get("/no-such-page").status_code == 404
