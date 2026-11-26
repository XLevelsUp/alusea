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
    first = call.SpokenTurn("visitor")
    assert first.still_wanted()
    second = call.SpokenTurn("visitor")
    assert not first.still_wanted() and second.still_wanted()


def test_a_turn_carried_on_by_a_newer_one_is_neither_answered_nor_kept(client, fake_services):
    """The customer paused mid-sentence and carried on, so the newer turn asks the whole sentence. One answer is kept."""
    first = call.SpokenTurn("v-carry")
    call.SpokenTurn("v-carry", continues=True)
    assert call.call_turn("v-carry", "I want a door", "en-IN", turn=first) == call.CARRIED_ON
    assert store.load_messages("v-carry") == []


def test_an_answer_saved_before_the_customer_carried_on_is_removed(client, fake_services):
    first = call.SpokenTurn("v-late")
    call.call_turn("v-late", "Hello there I want a door", "en-IN", turn=first)
    assert len(store.load_messages("v-late")) == 2
    whole = call.SpokenTurn("v-late", continues=True)
    call.call_turn("v-late", "Hello there I want a door for my balcony please", "en-IN", turn=whole)
    saved = store.load_messages("v-late")
    assert [item["content"] for item in saved if item["role"] == "user"] == ["Hello there I want a door for my balcony please"]


def test_a_new_question_after_an_answer_keeps_the_earlier_one(client, fake_services):
    call.call_turn("v-next", "Hello there I want a door", "en-IN", turn=call.SpokenTurn("v-next"))
    call.call_turn("v-next", "Show me a window for my kitchen please", "en-IN", turn=call.SpokenTurn("v-next"))
    assert len(store.load_messages("v-next")) == 4


def test_the_customers_own_words_go_to_the_ai_with_the_english(fake_services, monkeypatch):
    asked = []
    monkeypatch.setattr(call, "to_english", lambda text, language: "Is the sliding door in good condition?")
    monkeypatch.setattr(call, "generate_reply", lambda history, message, language, call=False, visitor_id=None: asked.append(message) or "Yes.")
    call.call_turn("v1", "ஸ்லைடிங் டோர் நல்லா இருக்குமா?", "ta-IN")
    assert asked[0] == "Is the sliding door in good condition?\n(Their own words: ஸ்லைடிங் டோர் நல்லா இருக்குமா?)"
    assert store.load_for_model("v1", 2)[0]["content"] == "Is the sliding door in good condition?"


def test_the_ai_sees_enough_history_to_remember_a_size_given_early():
    """20 call messages used up Groq's per-minute tokens on one key; 12 still holds sizes and rooms given early."""
    assert call.CALL_HISTORY_SENT_TO_MODEL == 12 and main.HISTORY_SENT_TO_MODEL == 24


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


def test_the_page_joins_only_a_short_pause_and_shows_an_earlier_answer_as_text(client):
    """Speech joined to every unanswered turn grew to 104 seconds while Sara was slow, and she never got to answer.
    Only a pause of a moment joins now; later speech is a new question, and the earlier answer shows without being spoken."""
    page = client.get("/").text
    assert "speechStartedAt - lastSpeechEndAt <= JOIN_WITHIN_MS" in page and '"&continues=1"' in page
    assert "joinSpeech(unansweredSpeech).slice(-MAX_JOINED_SECONDS * SPEECH_SAMPLE_RATE)" in page
    assert "if (!request.carried) showAsText(data);" in page
    # The call follows the language just spoken even when the answer comes back late and isn't spoken.
    assert page.index("if (data.language && request.number > languageFromRequest) {") < page.index("if (data.late) {")
    # An older answer arriving after a newer one doesn't take the language back.
    assert "const request = { carried: false, number: ++speechRequests };" in page
    assert "redemptionMs: CALL_PAUSE_MS" in page and "CALL_PAUSE_MS = 1300" in page


def test_a_sentence_sent_again_with_continues_keeps_one_question_and_answer(client, fake_services, monkeypatch):
    heard = iter([("I want a door", "en-IN"), ("I want a door for my balcony please", "en-IN")])
    monkeypatch.setattr(main, "listen", lambda speech, content_type, language: next(heard))
    client.post("/call/speech?language=en-IN", content=b"x", **WAV)
    data = client.post("/call/speech?language=en-IN&continues=1", content=b"xy", **WAV).json()
    assert data["heard"] == "I want a door for my balcony please" and data["audio"] == "audio"
    visitor = client.cookies.get(main.COOKIE_NAME)
    assert [item["content"] for item in store.load_messages(visitor) if item["role"] == "user"] == ["I want a door for my balcony please"]


def test_a_note_the_ai_wrote_to_itself_is_taken_out_of_its_reply():
    reply = "Could you tell me the width and height? Once they give the size, we should continue. Tell me and I'll find the door."
    assert agent.drop_planning_notes(reply) == "Could you tell me the width and height? Tell me and I'll find the door."
    for kept in ("Our team will call you once they confirm the slot.", "Which room is this for? It helps me pick the right door."):
        assert agent.drop_planning_notes(kept) == kept


def test_a_goodbye_ends_the_call_after_saras_reply(client, fake_services, monkeypatch):
    """The customer said "bye bye" and Sara said goodbye, but the call stayed open waiting for more speech."""
    asked = []
    monkeypatch.setattr(call, "generate_reply", lambda history, message, language, call=False, visitor_id=None: asked.append(message) or "Thank you, see you at the showroom. Bye!")
    reply = call.call_turn("v-bye", "I don't need anything else. Bye bye.", "en-IN")
    assert reply["end_call"] is True and "the call ends after your reply" in asked[0]
    assert call.call_turn("v-bye", "I want a door for my bike shed please", "en-IN")["end_call"] is False
    for spoken in ("சரி பை பை", "ok బై", "ಸರಿ ಬೈ ಬೈ", "goodbye Sara"):
        assert call.is_goodbye(spoken), spoken
    for other in ("பை எடுத்துட்டு வரேன்", "ബൈക്ക് വെക്കാൻ", "nearby showroom", "buy a door"):
        assert not call.is_goodbye(other), other


def test_the_page_hangs_up_after_saras_goodbye(client):
    page = client.get("/").text
    assert page.count("if (data.end_call) return endCall();") == 2
