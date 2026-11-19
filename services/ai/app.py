"""Vercel's entry point. Vercel finds `app` in this file and serves Sara with it. Locally, use `npm run dev:ai`."""
import sys
from pathlib import Path

# Sara's code is in src/. This makes it importable whether or not Vercel installs the project as a package.
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from alusea_ai_service.main import app  # noqa: E402

__all__ = ["app"]
