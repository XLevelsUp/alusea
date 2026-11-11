import os
import sqlite3
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest

import alusea_ai_service.store as store
import alusea_ai_service.translation as translation
import alusea_ai_service.voice as voice
from alusea_ai_service.cards import area_sq_ft, present
from alusea_ai_service.safe_log import clean_error

PROJECT = Path(__file__).parents[1]


def fake_language_check(monkeypatch, found):
    calls = []

    def post(url, headers, json, timeout):
        calls.append(url)
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"language_code": found})

    monkeypatch.setattr(httpx, "post", post)
    return calls


def test_common_tamil_words_mean_tamil_without_a_check(monkeypatch):
    calls = fake_language_check(monkeypatch, "ml-IN")
    assert translation.language_in_letters("kitchen ku paakanu", "en-IN") == "ta-IN"
    assert calls == []


def test_the_menu_language_wins_over_another_indian_language(monkeypatch):
    fake_language_check(monkeypatch, "ml-IN")
    assert translation.language_in_letters("enikku oru door venam", "ta-IN") == "ta-IN"


def test_short_messages_stay_in_the_chat_language(monkeypatch):
    fake_language_check(monkeypatch, "en-IN")
    assert translation.language_in_letters("10 feet height", "en-IN", "ta-IN") == "ta-IN"
    assert translation.language_in_letters("I want a sliding door for my kitchen", "en-IN", "ta-IN") == "en-IN"


def test_a_failed_check_means_english(monkeypatch):
    def down(*args, **kwargs):
        raise httpx.ConnectError("down")

    monkeypatch.setattr(httpx, "post", down)
    assert translation.language_in_letters("nanage ondu bagilu beku", "en-IN") == "en-IN"


def test_the_name_is_written_in_each_script():
    assert translation.MISSPELT_NAME.sub(translation.ASSISTANT_NAME["te-IN"], "నేను Saraని") == "నేను సారాని"
    assert translation.MISSPELT_NAME.sub(translation.ASSISTANT_NAME["ta-IN"], "Sarathy") == "Sarathy"


def test_a_translation_that_changes_a_number_falls_back_to_english(monkeypatch):
    monkeypatch.setattr(translation, "ask_sarvam", lambda *args, **kwargs: "Rs. 5,000")
    assert translation.translate_reply("The estimate is ₹1,20,000.", "ta-IN") == "The estimate is ₹1,20,000."


def test_product_markers_are_kept_through_translation(monkeypatch):
    monkeypatch.setattr(translation, "ask_sarvam", lambda *args, **kwargs: "Door venuma?")
    reply = translation.translate_reply("Do you want a door?\n\n[product:abc]", "ta-IN", translation.ENGLISH_LETTERS)
    assert reply == "Door venuma?\n\n[product:abc]"


def test_estimates_are_worked_out_by_code(monkeypatch):
    import alusea_ai_service.cards as cards

    product = "71fbe747-bfd7-4ac7-afcb-a9ff4d954232"
    monkeypatch.setattr(cards, "load_cards", lambda ids: [{"id": product, "name": "Door", "category": "Doors", "description": "", "price_per_sqft": 1500, "image_url": "", "url": ""}])
    shown = present(f"Here you go.\n\n[estimate:{product}:8:10:1]")
    assert shown["products"][0]["estimate"] == {"area_sq_ft": 80, "amount": 120000}
    assert area_sq_ft(6, 8, 2) == 96


def test_old_chats_are_deleted_and_leads_kept(client):
    store.save_exchange("new", "new question", "new answer")
    store.save_lead("old", "Ravi", "+919876543210", "door", "en-IN")
    connection = sqlite3.connect(store.DB_PATH)
    connection.execute("INSERT INTO messages (visitor_id, role, content, created_at) VALUES ('old', 'user', 'old question', '2020-01-01 10:00:00')")
    connection.execute("INSERT INTO messages (visitor_id, role, content, created_at) VALUES ('recent', 'user', '89 days old', datetime('now', '-89 days'))")
    connection.execute("UPDATE leads SET created_at = '2020-01-01 10:00:00'")
    connection.commit()
    assert store.delete_old_messages(90) == 1
    assert sorted(row[0] for row in connection.execute("SELECT content FROM messages")) == ["89 days old", "new answer", "new question"]
    assert len(store.load_leads()) == 1


def test_the_oldest_voice_clips_are_removed_over_the_limit(monkeypatch):
    voice.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(voice, "MAX_VOICE_CACHE_BYTES", 250)
    for number in range(4):
        clip = voice.CACHE_DIR / f"clip{number}.txt"
        clip.write_text("x" * 100)
        os.utime(clip, (time.time() - 100 + number, time.time() - 100 + number))
    voice.trim_voice_cache()
    assert sorted(path.name for path in voice.CACHE_DIR.glob("*.txt")) == ["clip2.txt", "clip3.txt"]


def test_logs_hide_the_organisation_numbers_and_failed_output():
    text = clean_error(Exception("limit in organization `org_01abc` 9876543210 'failed_generation': 'Ravi 9876543210'"))
    assert "org_01abc" not in text and "9876543210" not in text and "Ravi" not in text


def test_data_dir_is_used_and_created():
    folder = Path(tempfile.mkdtemp()) / "not" / "made" / "yet"
    probe = "import alusea_ai_service.store as store; store.init_db(); print(store.DB_PATH)"
    result = subprocess.run([sys.executable, "-c", probe], env={**os.environ, "DATA_DIR": str(folder)}, capture_output=True, text=True, check=True)
    assert Path(result.stdout.strip()) == folder / "chat.db" and (folder / "chat.db").exists()


@pytest.mark.skipif(not (PROJECT / ".env").exists(), reason="Needs a local .env file")
def test_env_is_loaded_before_any_setting_is_read():
    environment = {name: value for name, value in os.environ.items() if name not in ("SARVAM_API_KEY", "GROQ_MODEL")}
    probe = "import os, alusea_ai_service.store; print(bool(os.getenv('SARVAM_API_KEY')))"
    result = subprocess.run([sys.executable, "-c", probe], cwd=tempfile.mkdtemp(), env=environment, capture_output=True, text=True, check=True)
    assert result.stdout.strip() == "True"


def test_the_start_command_runs_sara_behind_a_proxy(monkeypatch):
    import uvicorn

    import alusea_ai_service

    started = {}
    monkeypatch.setattr(uvicorn, "run", lambda app, **options: started.update(app=app, **options))
    alusea_ai_service.serve()
    assert started["app"] == "alusea_ai_service.main:app" and started["proxy_headers"] is True


def test_env_example_has_no_secrets():
    example = (PROJECT / ".env.example").read_text(encoding="utf-8")
    for line in example.splitlines():
        if "=" in line and not line.startswith("#"):
            name, value = line.split("=", 1)
            if name.endswith(("KEY", "SECRET", "PASSWORD", "URL")):
                assert not value.strip(), name
