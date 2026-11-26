"""Several API keys for each provider, used in order: key 1 until it hits a problem, then key 2, and so on.

A key that reaches its limit rests for a while and is then used again; a wrong or revoked key is left out until Sara
restarts. Each copy of Sara keeps its own record, so on Vercel a resting key may be tried once more by another copy.
Logs name keys by number ("Sarvam key 2"), never by value."""
import os
import threading
import time

import httpx

LIMIT_REST_SECONDS = 60
# Sarvam answers 402 when an account's credit has run out, which a short rest won't fix.
NO_CREDIT_REST_SECONDS = 60 * 60
MAX_REST_SECONDS = 24 * 60 * 60


class KeyRing:
    def __init__(self, provider: str, *names: str):
        """names are the settings to read, in order. A name ending in S holds several keys separated by commas."""
        self.provider = provider
        self.names = names
        self.lock = threading.Lock()
        self.resting: dict[tuple[str, str], float] = {}
        self.dropped: set[str] = set()

    def keys(self) -> list[str]:
        """Read at each use, so a key added to the settings needs no code change."""
        found = []
        for name in self.names:
            for key in os.getenv(name, "").split(","):
                key = key.strip()
                if key and key not in found:
                    found.append(key)
        return found

    def available(self, scope: str = "") -> list[tuple[int, str]]:
        """Numbered keys that can be used now, in order. scope is a model, for providers whose limits are per model."""
        now = time.time()
        with self.lock:
            return [
                (number, key)
                for number, key in enumerate(self.keys(), start=1)
                if key not in self.dropped and self.resting.get((key, scope), 0) <= now
            ]

    def rest(self, number: int, key: str, seconds: float, why: str, scope: str = "") -> None:
        seconds = min(max(seconds, 1), MAX_REST_SECONDS)
        with self.lock:
            self.resting[(key, scope)] = time.time() + seconds
        on = f" on {scope}" if scope else ""
        print(f"{self.provider} key {number} {why}{on}, so it rests for {seconds:.0f} seconds.")

    def drop(self, number: int, key: str, why: str) -> None:
        with self.lock:
            self.dropped.add(key)
        print(f"{self.provider} key {number} {why}, so it isn't used again until Sara restarts.")

    def reset(self) -> None:
        with self.lock:
            self.resting.clear()
            self.dropped.clear()


def wait_from(headers) -> float:
    """The provider's own wait, from a Retry-After header in seconds, or the usual rest."""
    try:
        return float(headers.get("retry-after"))
    except (TypeError, ValueError, AttributeError):
        return LIMIT_REST_SECONDS


def post_with_keys(ring: KeyRing, url: str, key_header: str, **request) -> httpx.Response:
    """POST with the first usable key, moving to the next when one is out of limit, credit or validity.
    Returns the last answer, so callers check it as before. Raises httpx.HTTPError if no key could be used."""
    answer = None
    headers = request.pop("headers", {})
    for number, key in ring.available():
        try:
            answer = httpx.post(url, headers={**headers, key_header: key}, **request)
        except httpx.ConnectError:
            # The provider couldn't be reached. Another key won't help with a timeout, but may with a refused connection.
            continue
        status = getattr(answer, "status_code", 200)
        if status == 429:
            ring.rest(number, key, wait_from(getattr(answer, "headers", {})), "reached its limit")
        elif status == 402:
            ring.rest(number, key, NO_CREDIT_REST_SECONDS, "has run out of credit")
        elif status in (401, 403):
            ring.drop(number, key, f"was refused ({status})")
        else:
            return answer
    if answer is None:
        raise httpx.ConnectError(f"No {ring.provider} key could be used.")
    return answer


GROQ_KEYS = KeyRing("Groq", "GROQ_API_KEYS", "GROQ_API_KEY")
SARVAM_KEYS = KeyRing("Sarvam", "SARVAM_API_KEYS", "SARVAM_API_KEY")
# GEMINI_AI_API_KEY is the name used in earlier local .env files.
GEMINI_KEYS = KeyRing("Gemini", "GEMINI_API_KEYS", "GEMINI_API_KEY", "GEMINI_AI_API_KEY")
ALL_RINGS = (GROQ_KEYS, SARVAM_KEYS, GEMINI_KEYS)
