"""FastAPI application entrypoint."""

from __future__ import annotations

from fastapi import FastAPI

from app import __version__
from app.api.routes import router


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
    return application


app = create_app()
