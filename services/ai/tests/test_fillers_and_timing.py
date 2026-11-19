"""How long each step of a call turn took. The "let me check" lines are only shown on the call screen, see test_page_script.py."""
import alusea_ai_service.agent as agent
import alusea_ai_service.call as call
from alusea_ai_service.meter import COUNTS, Meter, metering, summary
from conftest import ai_answer, fake_groq

WAV = {"headers": {"content-type": "audio/wav"}}


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


def test_the_page_shows_a_filler_only_when_the_reply_is_slow(client):
    page = client.get("/").text
    assert "FILLER_DELAY_MS = 1500" in page and "planFiller(callTurn + 1)" in page
    assert "callStatus.textContent = phrases[choice]" in page
    assert "callAudio.src = silentClip()" in page


def test_the_phone_layout_folds_the_header_into_a_menu_and_keeps_one_call_button(client):
    page = client.get("/").text
    assert 'id="menu-button"' in page and 'class="header-menu" id="header-menu"' in page
    assert ".chat:has(.welcome:not([hidden])) #call { display: none; }" in page
    assert 'id="send-label"' in page and "animation-name: slide-up" in page
