"""The fixes from the first real test call: cost, phone numbers by voice, corrections, understanding and cards."""
import sqlite3

import httpx

import alusea_ai_service.agent as agent
import alusea_ai_service.call as call
import alusea_ai_service.main as main
import alusea_ai_service.prompt as prompt
import alusea_ai_service.store as store
import alusea_ai_service.tools as tools
import alusea_ai_service.voice as voice
from alusea_ai_service.tools import request_callback

WAV = {"headers": {"content-type": "audio/wav"}}


def test_a_spoken_phone_number_does_not_switch_the_call_to_english(monkeypatch):
    answers = iter([{"transcript": "92, 93, 94, 95.", "language_code": "en-IN", "language_probability": 1.0}, {"transcript": "92, 93, 94, 95.", "language_code": "ta-IN"}])
    monkeypatch.setattr(voice, "write_part", lambda audio, content_type, language_code, terms_language: next(answers))
    assert voice.listen(b"x", "audio/wav", "ta-IN")[1] == "ta-IN"


def test_an_english_sentence_still_switches_the_call_to_english(monkeypatch):
    monkeypatch.setattr(voice, "write_part", lambda *args: {"transcript": "Can someone call me back please", "language_code": "en-IN", "language_probability": 1.0})
    assert voice.listen(b"x", "audio/wav", "ta-IN")[1] == "en-IN"


def test_an_overtaken_reply_is_shown_but_not_voiced(client, fake_services, monkeypatch):
    voiced = []
    monkeypatch.setattr(call, "speak", lambda text, language: voiced.append(text) or "audio")
    still = {"wanted": True}
    reply = call.call_turn("v1", "I want a door for my balcony please", "en-IN", still_wanted=lambda: still["wanted"])
    assert reply["audio"] == "audio" and len(voiced) == 1
    still["wanted"] = False
    reply = call.call_turn("v1", "Show me a window for my kitchen please", "en-IN", still_wanted=lambda: still["wanted"])
    assert reply["audio"] is None and reply["content"] and len(voiced) == 1


def test_only_the_newest_spoken_turn_is_voiced():
    first = main.newest_turn_check("visitor")
    assert first()
    second = main.newest_turn_check("visitor")
    assert not first() and second()


def test_the_customers_own_words_go_to_the_ai_with_the_english(fake_services, monkeypatch):
    asked = []
    monkeypatch.setattr(call, "to_english", lambda text, language: "Is the sliding door in good condition?")
    monkeypatch.setattr(call, "generate_reply", lambda history, message, language, call=False, visitor_id=None: asked.append(message) or "Yes.")
    call.call_turn("v1", "ஸ்லைடிங் டோர் நல்லா இருக்குமா?", "ta-IN")
    assert asked[0] == "Is the sliding door in good condition?\n(Their own words: ஸ்லைடிங் டோர் நல்லா இருக்குமா?)"
    assert store.load_for_model("v1", 2)[0]["content"] == "Is the sliding door in good condition?"


def test_calls_send_less_history_to_the_ai():
    assert call.CALL_HISTORY_SENT_TO_MODEL == 8


def test_a_corrected_name_updates_the_same_lead():
    first = request_callback("Gopi Kumar", "9894939295", "sliding door", "v1", "ta-IN")
    second = request_callback("Kokki Kumar", "9894939295", "sliding door", "v1", "ta-IN", correction=True)
    leads = store.load_leads()
    assert first == {"saved": True, "updated": False} and second == {"saved": True, "updated": True}
    assert len(leads) == 1 and leads[0]["name"] == "Kokki Kumar"


def test_a_corrected_lead_goes_to_the_sheet_again_with_the_same_id(monkeypatch):
    sent = []
    monkeypatch.setattr(tools, "send_lead", lambda lead_id, uid, *rest: sent.append(uid))
    request_callback("Gopi Kumar", "9894939295", "", "v1", "ta-IN")
    request_callback("Kokki Kumar", "9894939295", "", "v1", "ta-IN", correction=True)
    assert len(sent) == 2 and sent[0] == sent[1]
    assert sqlite3.connect(store.DB_PATH).execute("SELECT sheet_sent FROM leads").fetchone()[0] == 0


def test_a_separate_enquiry_within_the_hour_is_a_new_lead():
    request_callback("Ravi", "9876543210", "sliding door for the balcony", "v1", "en-IN")
    second = request_callback("Ravi", "9876543210", "window for the kitchen", "v1", "en-IN")
    assert second == {"saved": True, "updated": False}
    assert sorted(lead["note"] for lead in store.load_leads()) == ["sliding door for the balcony", "window for the kitchen"]


def test_a_correction_is_passed_from_the_ai_tool(monkeypatch):
    received = []
    monkeypatch.setattr(agent, "request_callback", lambda *args: received.append(args) or {"saved": True})
    agent.run_tool("request_callback", '{"name": "Kokki Kumar", "phone": "9894939295", "correction": true}', "v1", "ta-IN")
    agent.run_tool("request_callback", '{"name": "Ravi", "phone": "9876543210"}', "v1", "ta-IN")
    assert received[0][-1] is True and received[1][-1] is False


def test_a_different_visitor_or_a_later_request_is_a_new_lead():
    request_callback("Ravi", "9876543210", "", "v1", "en-IN")
    request_callback("Priya", "9876543211", "", "v2", "en-IN", correction=True)
    connection = sqlite3.connect(store.DB_PATH)
    connection.execute("UPDATE leads SET created_at = datetime('now', '-2 hours')")
    connection.commit()
    request_callback("Ravi", "9876543210", "", "v1", "en-IN", correction=True)
    assert len(store.load_leads()) == 3


def test_a_door_search_can_leave_out_windows(monkeypatch):
    rows = [{"id": "1", "name": "Panoramic Sliding System"}, {"id": "2", "name": "Motorized Vertical Sliding Window"}, {"id": "3", "name": "Horizon Fold System"}]
    monkeypatch.setattr(httpx, "get", lambda *args, **kwargs: type("Answer", (), {"url": "test", "status_code": 200, "raise_for_status": lambda self: None, "json": lambda self: rows})())
    assert [product["name"] for product in tools.get_products("Sliding", exclude="window")] == ["Panoramic Sliding System", "Horizon Fold System"]


def test_leaving_out_windows_alone_searches_doors(monkeypatch):
    searched = []
    monkeypatch.setattr(agent, "get_products", lambda *args: searched.append(args) or [])
    agent.run_tool("get_products", '{"exclude": "window"}')
    assert searched[0][0] == "Doors" and searched[0][4] == "window"


def test_the_cards_follow_the_filtered_search():
    assert agent.filtered_matches("get_products", '{"exclude": "window"}', {"products": [{"id": "a"}]}) == ["a"]


def test_the_instructions_cover_the_call_fixes():
    instructions = prompt.call_prompt("ta-IN")
    assert "never ask them to type" in instructions
    assert "two groups of five" in instructions
    assert "about 150 characters" in instructions
    assert "exclude set to window" in instructions
    assert "high quality" in instructions
    assert "updates the same request" in instructions
    assert "one or two short sentences" in prompt.CALL_REMINDER
    assert "about 70 days" in instructions and "about 70 days" in prompt.SYSTEM_PROMPT


def test_the_page_shows_an_overtaken_reply_and_waits_longer_in_a_pause(client):
    page = client.get("/").text
    assert "if (data.late)" in page and "keepLate = false" in page
    assert "redemptionMs: CALL_PAUSE_MS" in page and "CALL_PAUSE_MS = 1300" in page
