"""Several keys for each provider, used in order: a key at its limit rests, a key out of credit rests longer, a refused
key is left out, and a rested key is used again. Logs name keys by number, never by value."""
import base64

import httpx
from groq import RateLimitError

import alusea_ai_service.agent as agent
import alusea_ai_service.keys as keys
import alusea_ai_service.translation as translation
import alusea_ai_service.voice as voice
from conftest import ai_answer, fake_groq


class Answer:
    def __init__(self, status, body=None, headers=None):
        self.status_code = status
        self.body = body or {}
        self.headers = headers or {}

    def json(self):
        return self.body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("failed", request=httpx.Request("POST", "https://x"), response=self)


def only_keys(monkeypatch, provider, listed):
    """Use only the keys listed, without the single test key every test has."""
    monkeypatch.setenv(f"{provider}_API_KEYS", listed)
    monkeypatch.setenv(f"{provider}_API_KEY", "")


def sarvam_with(monkeypatch, statuses):
    """Sarvam's translation, answering with the status given for each key, and recording which keys were used."""
    used = []

    def post(url, headers, **request):
        key = headers["api-subscription-key"]
        used.append(key)
        status = statuses.get(key, 200)
        return Answer(status, {"translated_text": f"translated with {key}"}, {"retry-after": "30"} if status == 429 else {})

    monkeypatch.setattr(httpx, "post", post)
    return used


def test_keys_are_read_from_the_list_then_the_single_setting_without_repeats(monkeypatch):
    monkeypatch.setenv("SARVAM_API_KEYS", "one, two,,one")
    monkeypatch.setenv("SARVAM_API_KEY", "three")
    assert keys.SARVAM_KEYS.keys() == ["one", "two", "three"]


def test_a_key_at_its_limit_rests_and_the_next_key_answers(monkeypatch, capsys):
    only_keys(monkeypatch, "SARVAM", "first-secret,second-secret")
    used = sarvam_with(monkeypatch, {"first-secret": 429})
    assert translation.ask_sarvam("Hello", "en-IN", "ta-IN", "formal") == "translated with second-secret"
    assert translation.ask_sarvam("Hello", "en-IN", "ta-IN", "formal") == "translated with second-secret"
    assert used == ["first-secret", "second-secret", "second-secret"]
    log = capsys.readouterr().out
    assert "Sarvam key 1 reached its limit, so it rests for 30 seconds." in log and "secret" not in log


def test_a_rested_key_is_used_again(monkeypatch):
    only_keys(monkeypatch, "SARVAM", "a,b")
    clock = {"now": 1000.0}
    monkeypatch.setattr(keys.time, "time", lambda: clock["now"])
    statuses = {"a": 429}
    used = sarvam_with(monkeypatch, statuses)
    translation.ask_sarvam("Hello", "en-IN", "ta-IN", "formal")
    statuses.clear()
    clock["now"] += 31
    translation.ask_sarvam("Hello", "en-IN", "ta-IN", "formal")
    assert used == ["a", "b", "a"]


def test_a_key_out_of_credit_rests_an_hour_and_a_refused_key_is_left_out(monkeypatch):
    only_keys(monkeypatch, "SARVAM", "no-credit,refused,good")
    clock = {"now": 1000.0}
    monkeypatch.setattr(keys.time, "time", lambda: clock["now"])
    used = sarvam_with(monkeypatch, {"no-credit": 402, "refused": 401})
    translation.ask_sarvam("Hello", "en-IN", "ta-IN", "formal")
    clock["now"] += 30 * 60
    translation.ask_sarvam("Hello", "en-IN", "ta-IN", "formal")
    assert used == ["no-credit", "refused", "good", "good"]
    assert [number for number, key in keys.SARVAM_KEYS.available()] == [3]


def test_when_every_key_fails_the_last_answer_is_handled_as_before(monkeypatch):
    only_keys(monkeypatch, "SARVAM", "a,b")
    sarvam_with(monkeypatch, {"a": 429, "b": 429})
    assert translation.ask_sarvam("Hello", "en-IN", "ta-IN", "formal") is None
    # Both keys rest now, so no request is sent and the caller still gets its usual failure.
    assert translation.ask_sarvam("Hello", "en-IN", "ta-IN", "formal") is None


def test_gemini_moves_to_its_next_key_before_sarvam_speaks(monkeypatch):
    only_keys(monkeypatch, "GEMINI", "g1,g2")
    used = []

    def post(url, headers, **request):
        key = headers.get("x-goog-api-key", "sarvam")
        used.append(key)
        if key == "g1":
            return Answer(429)
        data = {"inlineData": {"mimeType": "audio/L16;rate=24000", "data": base64.b64encode(b"\x00\x01").decode()}}
        return Answer(200, {"candidates": [{"content": {"parts": [data]}}]})

    monkeypatch.setattr(httpx, "post", post)
    assert voice.speak("Which room is this for?", "en-IN")
    assert used == ["g1", "g2"]


class Limit(RateLimitError):
    def __init__(self):
        Exception.__init__(self, "Rate limit reached.")


def test_groq_tries_the_same_model_on_the_next_key_before_the_backup_model(monkeypatch):
    only_keys(monkeypatch, "GROQ", "k1,k2")
    tried = []

    def client_for(key):
        def create(**request):
            tried.append((key, request["model"]))
            if key == "k1" and request["model"] == agent.MODEL:
                raise Limit()
            return ai_answer(f"from {key}")
        return fake_groq(create)

    monkeypatch.setattr(agent, "groq_client", client_for)
    assert agent.generate_reply([], "Hello there friend") == "from k2"
    assert tried == [("k1", agent.MODEL), ("k2", agent.MODEL)]
    # Groq's limits are per model, so key 1 rests on the main model only.
    assert [key for _, key in keys.GROQ_KEYS.available(agent.MODEL)] == ["k2"]
    assert [key for _, key in keys.GROQ_KEYS.available(agent.GROQ_BACKUP_MODEL)] == ["k1", "k2"]


def test_a_key_at_its_daily_limit_rests_an_hour(monkeypatch, capsys):
    """Gemini's free tier ran out for the day, and Sara tried it again every minute."""
    only_keys(monkeypatch, "GEMINI", "g1")
    clock = {"now": 1000.0}
    monkeypatch.setattr(keys.time, "time", lambda: clock["now"])
    daily = Answer(429)
    daily.text = '{"error": {"details": [{"quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}}'
    monkeypatch.setattr(httpx, "post", lambda url, headers, **request: daily)
    keys.post_with_keys(keys.GEMINI_KEYS, "https://gemini", "x-goog-api-key")
    assert "reached its daily limit, so it rests for 3600 seconds" in capsys.readouterr().out
    clock["now"] += 30 * 60
    assert keys.GEMINI_KEYS.available() == []
