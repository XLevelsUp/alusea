import os
from pathlib import Path

from dotenv import load_dotenv

# Loaded here, before any other part of Sara is imported, so every setting in .env is seen, including DATA_DIR.
# The project's own .env is found by its path, wherever Sara is started from. Settings already set aren't replaced.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")
load_dotenv()

# Every call to an outside service (Groq, Sarvam, Supabase, the Google Sheet) is printed in Sara's terminal.
from alusea_ai_service.api_log import install as log_api_calls  # noqa: E402

log_api_calls()


def serve() -> None:
    """Start Sara for the live site. Behind a web server on the same machine, visitors' real addresses come through."""
    import uvicorn

    uvicorn.run(
        "alusea_ai_service.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        proxy_headers=True,
        forwarded_allow_ips=os.getenv("FORWARDED_ALLOW_IPS", "127.0.0.1"),
    )
