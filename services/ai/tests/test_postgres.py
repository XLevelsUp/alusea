"""The same saving and limits, run against a real Postgres, such as Supabase. Skipped unless TEST_DATABASE_URL is set.

Run with:  $env:TEST_DATABASE_URL="postgresql://..."; uv run pytest tests/test_postgres.py
Everything goes into a throwaway schema, which is deleted afterwards, so Sara's real tables are never touched."""
import os
import uuid

import pytest

import alusea_ai_service.store as store

URL = os.getenv("TEST_DATABASE_URL", "")
pytestmark = pytest.mark.skipif(not URL, reason="TEST_DATABASE_URL isn't set")


@pytest.fixture
def postgres(monkeypatch):
    monkeypatch.setattr(store, "DATABASE_URL", URL)
    monkeypatch.setattr(store, "SCHEMA", f"sara_test_{uuid.uuid4().hex[:8]}")
    monkeypatch.setattr(store, "pool", None)
    store.init_db()
    store.init_db()  # A second start finds the tables already there.
    yield
    with store.database() as db:
        db.run(f"DROP SCHEMA {store.SCHEMA} CASCADE")
    store.pool.close()


def test_chat_is_saved_and_loaded(postgres):
    store.save_exchange("v1", "Namaste", "Hello!", english="Hello!", question_english="Hello", language="ta-IN")
    store.save_exchange("v1", "Door?", "Which room?")
    assert store.load_messages("v1") == [
        {"role": "user", "content": "Namaste"},
        {"role": "assistant", "content": "Hello!"},
        {"role": "user", "content": "Door?"},
        {"role": "assistant", "content": "Which room?"},
    ]
    assert store.load_for_model("v1", 2) == [{"role": "user", "content": "Door?"}, {"role": "assistant", "content": "Which room?"}]
    assert store.last_language("v1") is None
    store.database_ok()
    assert store.delete_old_messages(90) == 0
    store.delete_messages("v1")
    assert store.load_messages("v1") == []


def test_leads(postgres):
    lead_id, uid = store.save_lead("v1", "Ravi", "+919876543210", "door", "en-IN")
    assert store.recent_lead("v1", 5) == (lead_id, uid)
    store.update_lead(lead_id, "Ravi K", "+919876543210", "sliding door")
    [lead] = store.load_leads()
    assert lead["name"] == "Ravi K" and lead["note"] == "sliding door" and len(lead["created_at"]) == 19
    assert store.unsent_leads() == []  # Too new to send again yet.
    store.mark_sheet_sent(lead_id)


def test_limits_stop_at_the_limit_and_give_back(postgres):
    counters = [("2026-01-02", "message", "visitor", "key", 2)]
    assert store.take_allowance(counters, "2026-01-02")
    assert store.take_allowance(counters, "2026-01-02")
    assert not store.take_allowance(counters, "2026-01-02")
    assert store.limit_reached(counters)
    store.return_allowance(counters)
    assert not store.limit_reached(counters)
    # A new day clears the old counts.
    assert store.take_allowance([("2026-01-03", "message", "visitor", "key", 1)], "2026-01-03")
    assert not store.limit_reached(counters)
