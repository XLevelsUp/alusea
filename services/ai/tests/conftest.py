"""Shared test setup. Every test runs with fake settings, a temporary database and folders, and no network, so tests are free and never touch real customers or services."""
import os
import tempfile
from types import SimpleNamespace

import httpx
import pytest

# Set before Sara is imported, so .env can't fill these in. An empty value turns that feature off.
os.environ.update(
    GROQ_API_KEY="test-key",
    GROQ_MODEL="qwen/qwen3.8-27b",
    ALUSEA_SUPABASE_URL="https://example.supabase.co",
    ALUSEA_ANON_KEY="test-key",
    SARVAM_API_KEY="test-key",
    OPENROUTER_API_KEY="",
    LEADS_PASSWORD="",
    LEADS_SHEET_URL="",
    LEADS_SHEET_SECRET="",
    COOKIE_SECURE="",
    LIMIT_HASH_SECRET="",
    DATA_DIR=tempfile.mkdtemp(),
)

import alusea_ai_service.agent as agent  # noqa: E402
import alusea_ai_service.call as call  # noqa: E402
import alusea_ai_service.limits as limits  # noqa: E402
import alusea_ai_service.main as main  # noqa: E402
import alusea_ai_service.store as store  # noqa: E402
import alusea_ai_service.voice as voice  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

# Any LIMIT_ setting from a developer's .env would change the numbers the tests expect.
for name in [name for name in os.environ if name.startswith("LIMIT_")]:
    del os.environ[name]


def blocked(*args, **kwargs):
    raise RuntimeError("Tests can't use the network. Replace this call with a fake.")


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    """A fresh database and folders for each test, and no real network or AI."""
    monkeypatch.setattr(store, "DB_PATH", tmp_path / "chat.db")
    monkeypatch.setattr(limits, "SECRET_FILE", tmp_path / "limits.secret")
    monkeypatch.setattr(voice, "CACHE_DIR", tmp_path / "voice_cache")
    monkeypatch.setattr(httpx, "post", blocked)
    monkeypatch.setattr(httpx, "get", blocked)
    monkeypatch.setattr(agent, "client", fake_groq(blocked))
    monkeypatch.setattr(main, "COOKIE_SECURE", False)
    store.init_db()
    call.turn_locks.clear()
    yield


def fake_groq(create):
    return SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))


def ai_answer(text, tool_calls=None, tokens=0):
    """A reply shaped like Groq's."""
    message = SimpleNamespace(content=text, tool_calls=tool_calls)
    return SimpleNamespace(choices=[SimpleNamespace(message=message)], usage=SimpleNamespace(total_tokens=tokens))


@pytest.fixture
def client():
    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture
def fake_services(monkeypatch):
    """Simple fakes for the AI, hearing, translation and voice used by chat and calls."""
    reply = {"text": "Which room is this for?"}
    monkeypatch.setattr(main, "generate_reply", lambda history, message, language, **context: reply["text"])
    monkeypatch.setattr(main, "language_in_letters", lambda message, menu, earlier=None: "en-IN")
    monkeypatch.setattr(main, "translate_reply", lambda english, language, script=None: english)
    monkeypatch.setattr(main, "speak", lambda text, language: "audio")
    monkeypatch.setattr(main, "listen", lambda speech, content_type, language: ("I want a door for my balcony please", "en-IN"))
    monkeypatch.setattr(call, "generate_reply", lambda history, message, language, call=False, visitor_id=None: reply["text"])
    monkeypatch.setattr(call, "to_english", lambda text, language: text)
    monkeypatch.setattr(call, "translate_reply", lambda english, language: english)
    monkeypatch.setattr(call, "speak", lambda text, language: "audio")
    return reply
