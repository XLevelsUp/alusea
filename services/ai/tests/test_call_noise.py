"""Noise on a call that speech-to-text writes down as dots or a lone letter gets no answer, so Sara keeps listening."""
import pytest

import alusea_ai_service.main as main
from alusea_ai_service.call import is_noise

WAV = {"headers": {"content-type": "audio/wav"}}


@pytest.mark.parametrize("heard", ["", "...", "?!", "a", "I."])
def test_noise_is_recognised(heard):
    assert is_noise(heard)


@pytest.mark.parametrize("heard", ["hmm", "Hmm.", "ம்ம்", "హ్మ్", "yes", "ok", "no", "door", "8", "8 feet", "balcony", "ஆமா"])
def test_real_answers_and_hmm_are_never_noise(heard):
    """"Hmm" often means yes in India, so it always goes to Sara."""
    assert not is_noise(heard)


def test_a_noise_turn_gets_no_reply(client, fake_services, monkeypatch):
    monkeypatch.setattr(main, "listen", lambda speech, content_type, language: ("...", "en-IN"))
    data = client.post("/call/speech?language=en-IN", content=b"x", **WAV).json()
    assert data == {"heard": "", "content": "", "products": [], "audio": None}


def test_hmm_is_answered(client, fake_services, monkeypatch):
    monkeypatch.setattr(main, "listen", lambda speech, content_type, language: ("hmm", "en-IN"))
    data = client.post("/call/speech?language=en-IN", content=b"x", **WAV).json()
    assert data["heard"] == "hmm" and data["content"]
