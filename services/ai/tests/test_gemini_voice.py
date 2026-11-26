"""Sara speaks with Gemini, and Sarvam's ritu takes over whenever Gemini can't, so a call never goes silent."""
import base64

import httpx

import alusea_ai_service.voice as voice

PCM = b"\x00\x01" * 240


class Answer:
    def __init__(self, status, body):
        self.status_code = status
        self.body = body

    def json(self):
        return self.body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("failed", request=httpx.Request("POST", "https://x"), response=self)


def fake_providers(monkeypatch, gemini_status=200):
    asked = []

    def post(url, **request):
        if "generativelanguage" in url:
            asked.append("gemini")
            data = {"inlineData": {"mimeType": "audio/L16;codec=pcm;rate=24000", "data": base64.b64encode(PCM).decode()}}
            return Answer(gemini_status, {"candidates": [{"content": {"parts": [data]}}]})
        asked.append("sarvam")
        return Answer(200, {"audios": [base64.b64encode(b"sarvam").decode()]})

    monkeypatch.setattr(httpx, "post", post)
    monkeypatch.setattr(voice, "gemini_paused_until", 0.0)
    return asked


def test_gemini_speaks_when_it_has_a_key_and_its_audio_is_wav(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    asked = fake_providers(monkeypatch)
    audio = base64.b64decode(voice.speak("Which room is this for?", "ta-IN"))
    assert asked == ["gemini"] and audio[:4] == b"RIFF" and audio.endswith(PCM)
    assert voice.speak("Which room is this for?", "ta-IN") and asked == ["gemini"]  # saved, so not paid for again


def test_sarvam_speaks_without_a_gemini_key(monkeypatch):
    asked = fake_providers(monkeypatch)
    assert base64.b64decode(voice.speak("Hello", "en-IN")) == b"sarvam" and asked == ["sarvam"]


def test_sarvam_takes_over_when_gemini_fails(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    asked = fake_providers(monkeypatch, gemini_status=500)
    assert base64.b64decode(voice.speak("Hello", "en-IN")) == b"sarvam" and asked == ["gemini", "sarvam"]


def test_after_geminis_limit_sarvam_speaks_for_a_while_without_asking_gemini_first(monkeypatch):
    monkeypatch.setenv("GEMINI_AI_API_KEY", "test-key")
    asked = fake_providers(monkeypatch, gemini_status=429)
    voice.speak("First sentence", "en-IN")
    voice.speak("Second sentence", "en-IN")
    assert asked == ["gemini", "sarvam", "sarvam"]
