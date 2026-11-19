import threading
import time

import alusea_ai_service.call as call
import alusea_ai_service.main as main
import alusea_ai_service.store as store
import alusea_ai_service.voice as voice

WAV = {"headers": {"content-type": "audio/wav"}}


def too_big():
    for _ in range(7):
        yield b"x" * 1_000_000


def test_a_recording_that_says_it_is_too_big_is_refused(client, fake_services):
    headers = {"content-type": "audio/wav", "content-length": str(main.MAX_SPEECH_BYTES + 1)}
    assert client.post("/speech?language=en-IN", content=b"x", headers=headers).status_code == 413


def test_a_too_big_upload_is_stopped_while_reading(client, fake_services):
    assert client.post("/speech?language=en-IN", content=too_big(), **WAV).status_code == 413


def test_refused_recordings_do_not_use_up_the_limit(client, fake_services, monkeypatch):
    monkeypatch.setenv("LIMIT_MIC_IP", "1")
    assert [client.post("/speech?language=en-IN", content=b"", **WAV).status_code for _ in range(3)] == [413, 413, 413]
    assert client.post("/speech?language=en-IN", content=b"x", **WAV).status_code == 200


def test_the_limit_is_checked_before_the_upload_is_read(client, fake_services, monkeypatch):
    monkeypatch.setenv("LIMIT_MIC_IP", "0")
    assert client.post("/speech?language=en-IN", content=b"x", **WAV).status_code == 429


def test_a_call_turn_shows_the_words_and_language(client, fake_services, monkeypatch):
    monkeypatch.setattr(main, "listen", lambda speech, content_type, language: ("எனக்கு கதவு வேணும் நண்பா", "ta-IN"))
    data = client.post("/call/speech?language=en-IN", content=b"x", **WAV).json()
    assert data["heard"] == "எனக்கு கதவு வேணும் நண்பா"
    assert data["language"] == "ta-IN"
    assert data["audio"] == "audio"


def test_three_calls_then_stopped(client, fake_services):
    assert [client.post("/call/start", json={"language": "en-IN"}).status_code for _ in range(4)] == [200, 200, 200, 429]


def test_a_failed_part_of_a_long_recording_fails_the_whole_message(monkeypatch):
    answers = iter([{"transcript": "first part", "language_code": "en-IN"}, None])
    monkeypatch.setattr(voice, "write_part", lambda audio, content_type, language_code, terms_language: next(answers))
    assert voice.write_parts([b"a", b"b"], "audio/wav", "en-IN", "en-IN") is None


def test_language_rules_for_speech():
    choose = voice.chosen_language
    assert choose("ta-IN", 1.0, 2, "en-IN") == "ta-IN"
    assert choose("en-IN", 1.0, 5, "ta-IN") == "en-IN"
    assert choose("en-IN", 1.0, 2, "ta-IN") == "ta-IN"
    assert choose("ta-IN", 1.0, 6, "ml-IN") == "ml-IN"
    assert choose("hi-IN", 1.0, 6, "en-IN") == "en-IN"
    assert choose("en-IN", 0.5, 6, "ta-IN") == "ta-IN"


def test_turns_for_one_visitor_run_one_at_a_time(fake_services, monkeypatch):
    running = {"now": 0, "most": 0}
    lock = threading.Lock()

    def slow(history, message, language, call=False, visitor_id=None):
        with lock:
            running["now"] += 1
            running["most"] = max(running["most"], running["now"])
        time.sleep(0.2)
        with lock:
            running["now"] -= 1
        return f"Reply to {message}"

    monkeypatch.setattr(call, "generate_reply", slow)
    threads = [threading.Thread(target=call.call_turn, args=("same", f"message {number} about a door", "en-IN")) for number in range(3)]
    for thread in threads:
        thread.start()
        time.sleep(0.03)
    for thread in threads:
        thread.join()
    saved = [row["content"] for row in store.load_messages("same")]
    assert running["most"] == 1
    assert all(saved[index + 1] == f"Reply to {saved[index]}" for index in range(0, len(saved), 2))


def test_a_lock_in_use_or_just_made_is_never_removed(monkeypatch):
    monkeypatch.setattr(call, "MAX_TURN_LOCKS", 2)
    busy = call.turn_lock("busy")
    busy.acquire()
    other = call.turn_lock("other")
    other.acquire()
    newest = call.turn_lock("newest")
    assert call.turn_locks.get("busy") is busy
    assert call.turn_locks.get("newest") is newest
    assert call.turn_lock("newest") is newest
    busy.release()
    other.release()


def test_only_hours_questions_get_the_hours_line():
    for question in ("what time are you open", "are you open today", "is the showroom open on sunday", "what are your timings"):
        assert "8 am" in (call.quick_reply(question, "en-IN", False) or ""), question
    for question in ("can this door open fully", "does the window open outwards"):
        assert call.quick_reply(question, "en-IN", False) is None, question
