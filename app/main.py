"""FastAPI application entrypoint.

`create_app` wires the API router, security headers, and (when built) the
compiled frontend from frontend/dist at the root path. `python -m app.serve`
runs the hardened production configuration (loopback bind only).
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app import __version__
from app.api.routes import router

_FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": (
        "default-src 'self'; script-src 'self'; style-src 'self'; "
        "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; "
        "form-action 'self'; base-uri 'none'"
    ),
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for name, value in _SECURITY_HEADERS.items():
            response.headers.setdefault(name, value)
        return response


def create_app() -> FastAPI:
    application = FastAPI(
        title="ScamShield AI 2.0",
        description=(
            "Offline-first scam investigation platform. "
            "Don't Just Detect the Scam. Investigate the Evidence."
        ),
        version=__version__,
    )
    application.include_router(router)
    application.add_middleware(SecurityHeadersMiddleware)

    if _FRONTEND_DIST.is_dir():
        application.mount(
            "/", StaticFiles(directory=str(_FRONTEND_DIST), html=True), name="frontend"
        )

    return application


app = create_app()
