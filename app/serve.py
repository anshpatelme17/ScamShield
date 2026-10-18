"""Production launcher: `python -m app.serve`.

Serves the API and the compiled frontend (frontend/dist must exist; run
`npm run build` inside frontend/ first) on the loopback interface only.
No reload, no dev features, no telemetry.
"""

from __future__ import annotations

import argparse

import uvicorn

from app.main import app

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765


def main() -> None:
    parser = argparse.ArgumentParser(description="Run ScamShield AI 2.0")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    arguments = parser.parse_args()
    uvicorn.run(app, host=arguments.host, port=arguments.port, log_level="warning")


if __name__ == "__main__":
    main()
