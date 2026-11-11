"""Short "one moment" phrases while a slow call reply is on its way, and how long each step of a call turn took."""
import alusea_ai_service.agent as agent
import alusea_ai_service.call as call
from alusea_ai_service.meter import COUNTS, Meter, metering, summary
from conftest import ai_answer, fake_groq

WAV = {"headers": {"content-type": "audio/wav"}}


def test_every_language_has_short_positive_fillers():
    assert set(call.FILLERS) == {"en-IN", "ta-IN", "ml-IN", "te-IN", "kn-IN"}
    for phrases in call.FILLERS.values():
        assert len(phrases) == 3
        assert all(len(phrase) < 40 and "mudiyathu" not in phrase and "can't" not in phrase for phrase in phrases)


def test_the_page_gets_the_fillers_in_the_calls_language(client, monkeypatch):
    spoken = []
    monkeypatch.setattr(call, "speak", lambda text, language: spoken.append((text, language)) or "audio")
    data = client.get("/call/fillers?language=ta-IN").json()
    assert data == {"audio": ["audio"] * 3}
    assert spoken == [(phrase, "ta-IN") for phrase in call.FILLERS["ta-IN"]]


def test_a_filler_that_could_not_be_voiced_is_left_out(client, monkeypatch):
    monkeypatch.setattr(call, "speak", lambda text, language: None if text == "One moment, please." else "audio")
    assert client.get("/call/fillers?language=en-IN").json() == {"audio": ["audio"] * 2}


def test_an_unknown_language_gets_no_fillers(client):
    assert client.get("/call/fillers?language=fr-FR").status_code == 422


def test_the_meter_line_shows_how_long_each_step_took():
    before = dict.fromkeys(COUNTS, 0)
    after = {**before, "turn_wait": 4.2, "listen_wait": 0.8, "translate_wait": 0.6, "ai_wait": 2.1, "voice_wait": 0.7}
    assert "this turn took 4.2s: listening 0.8s, translating 0.6s, AI 2.1s, voice 0.7s" in summary(before, after)


def test_the_time_waiting_for_the_ai_is_counted(monkeypatch):
    monkeypatch.setattr(agent, "client", fake_groq(lambda **request: ai_answer("Hello", tokens=10)))
    meter = Meter()
    with metering(meter):
        agent.send_to_model([{"role": "user", "content": "Hi"}], {"model": agent.MODEL})
    assert meter.snapshot()["ai_wait"] > 0


def test_a_call_turn_prints_its_time(client, fake_services, capsys):
    client.post("/call/speech?language=en-IN", content=b"x", **WAV)
    assert "this turn took" in capsys.readouterr().out


def test_the_page_plays_a_filler_only_when_the_reply_is_slow(client):
    page = client.get("/").text
    assert "FILLER_DELAY_MS = 1500" in page and "planFiller(callTurn + 1)" in page
    assert 'fillerAudio.addEventListener("pause", playReply' in page
    assert "fillerAudio.src = silentClip()" in page


def test_the_phone_layout_folds_the_header_into_a_menu_and_keeps_one_call_button(client):
    page = client.get("/").text
    assert 'id="menu-button"' in page and 'class="header-menu" id="header-menu"' in page
    assert ".chat:has(.welcome:not([hidden])) #call { display: none; }" in page
    assert 'id="send-label"' in page and "animation-name: slide-up" in page
