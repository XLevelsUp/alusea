import base64
import hashlib
import io
import json
import os
import wave
from array import array
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx
from dotenv import load_dotenv

from alusea_ai_service.meter import count, in_threads

load_dotenv()

SARVAM_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_LISTEN_URL = "https://api.sarvam.ai/speech-to-text"
LISTEN_MODEL = "saaras:v4"
# Sarvam accepts up to 30 seconds per request.
MAX_PART_SECONDS = 28
CUT_SEARCH_SECONDS = 4
MAX_PARTS_AT_ONCE = 4
# A customer on a call can't wait long, and this usually takes a second or two.
LISTEN_TIMEOUT_SECONDS = 10
LISTEN_TRIES = 2
# Words Sarvam should listen out for, which fixed mishearings such as "showroom" as "rice" in Malayalam.
KEY_TERMS = ["aluminium", "door", "window", "sliding door", "showroom", "Coimbatore", "balcony", "square feet", "partition", "feet"]
LANGUAGE_KEY_TERMS = {
    "en-IN": [],
    "ta-IN": ["கதவு", "ஜன்னல்", "ஷோரூம்", "கோயம்புத்தூர்", "ஸ்லைடிங்", "அலுமினியம்", "பால்கனி", "அடி"],
    "ml-IN": ["വാതിൽ", "ജനൽ", "ഷോറൂം", "കോയമ്പത്തൂർ", "സ്ലൈഡിങ്", "അലുമിനിയം", "ബാൽക്കണി", "അടി"],
    "te-IN": ["తలుపు", "కిటికీ", "షోరూమ్", "కోయంబత్తూరు", "స్లైడింగ్", "అల్యూమినియం", "బాల్కనీ", "అడుగులు"],
    "kn-IN": ["ಬಾಗಿಲು", "ಕಿಟಕಿ", "ಶೋರೂಮ್", "ಕೊಯಮತ್ತೂರು", "ಸ್ಲೈಡಿಂಗ್", "ಅಲ್ಯೂಮಿನಿಯಂ", "ಬಾಲ್ಕನಿ", "ಅಡಿ"],
}
SURE_OF_LANGUAGE = 0.9
# A short answer like "yes" or "8 feet" is English in any language, so it doesn't change the language.
MIN_WORDS_TO_SWITCH_TO_ENGLISH = 3
# Saved audio means a repeated sentence is only paid for once.
CACHE_DIR = Path(__file__).parents[2] / "voice_cache"
MAX_SPOKEN_CHARACTERS = 1500
# When the saved audio passes this size, the clips not played for longest are deleted.
MAX_VOICE_CACHE_BYTES = int(os.getenv("MAX_VOICE_CACHE_MB", "500")) * 1_000_000

# The only file that knows the voice provider. Gayu sounds the same in every language.
VOICE_MODEL = "bulbul:v3"
VOICE_SPEAKER = "kavitha"


def quietest_point(samples: array, start: int, end: int, window: int) -> int:
    """Find the quietest moment in a stretch of audio, so a cut is less likely to split a word."""
    return min(
        range(start, end - window, window),
        key=lambda position: sum(abs(sample) for sample in samples[position : position + window : 8]),
    )


def split_speech(audio: bytes) -> list[bytes]:
    """Split long WAV speech into parts within Sarvam's limit. Other audio is sent as it is."""
    try:
        with wave.open(io.BytesIO(audio)) as recording:
            rate = recording.getframerate()
            if recording.getnchannels() != 1 or recording.getsampwidth() != 2:
                return [audio]
            samples = array("h", recording.readframes(recording.getnframes()))
    except (wave.Error, EOFError):
        return [audio]

    limit = MAX_PART_SECONDS * rate
    if len(samples) <= limit:
        return [audio]

    parts = []
    start = 0
    while start < len(samples):
        end = start + limit
        if end < len(samples):
            end = quietest_point(samples, end - CUT_SEARCH_SECONDS * rate, end, rate // 10)
        else:
            end = len(samples)
        part = io.BytesIO()
        with wave.open(part, "wb") as writer:
            writer.setnchannels(1)
            writer.setsampwidth(2)
            writer.setframerate(rate)
            writer.writeframes(samples[start:end].tobytes())
        parts.append(part.getvalue())
        start = end
    return parts


def chosen_language(found: str | None, sure: float | None, word_count: int, current: str) -> str:
    """Decide the language of what was said. Detection can mix up Indian languages even when it's sure, so it never moves between them."""
    if found == current or (sure or 0) < SURE_OF_LANGUAGE:
        return current
    if current == "en-IN" and found in LANGUAGE_KEY_TERMS:
        return found
    if found == "en-IN" and word_count >= MIN_WORDS_TO_SWITCH_TO_ENGLISH:
        return found
    return current


def listen(audio: bytes, content_type: str, language: str) -> tuple[str, str] | None:
    """Write speech of any allowed length in its own script, and say which language it's in. None means Sarvam couldn't be reached."""
    parts = split_speech(audio)
    heard = write_parts(parts, content_type, "unknown", language)
    if heard is None:
        return None
    text = joined_text(heard)
    if not text:
        return "", language
    first = next(part for part in heard if part["transcript"])
    spoken = chosen_language(first.get("language_code"), first.get("language_probability"), len(text.split()), language)
    if spoken == first.get("language_code"):
        return text, spoken
    # Detection picked a language we don't trust, so its words are wrong too. This time Sarvam is told the language.
    heard = write_parts(parts, content_type, spoken, language)
    return None if heard is None else (joined_text(heard), spoken)


def joined_text(heard: list[dict]) -> str:
    return " ".join(part["transcript"] for part in heard if part["transcript"])


def write_parts(parts: list[bytes], content_type: str, language_code: str, terms_language: str) -> list[dict] | None:
    """Write every part of the speech, keeping them in order. None means every part failed."""
    with ThreadPoolExecutor(max_workers=MAX_PARTS_AT_ONCE) as pool:
        heard = list(in_threads(pool, lambda part: write_part(part, content_type, language_code, terms_language), parts))
    written = [part for part in heard if part is not None]
    return written or None


def speech_seconds(audio: bytes) -> float:
    """How long a WAV recording is, which is what Sarvam charges for. Other formats count as 0."""
    try:
        with wave.open(io.BytesIO(audio)) as recording:
            return recording.getnframes() / recording.getframerate()
    except (wave.Error, EOFError):
        return 0


def write_part(audio: bytes, content_type: str, language_code: str, terms_language: str) -> dict | None:
    """Turn one part of speech into text. An empty transcript means no words were heard, and None means Sarvam failed."""
    for _ in range(LISTEN_TRIES):
        try:
            response = httpx.post(
                SARVAM_LISTEN_URL,
                headers={"api-subscription-key": os.environ["SARVAM_API_KEY"]},
                data={
                    "model": LISTEN_MODEL,
                    "mode": "transcribe",
                    "language_code": language_code,
                    "keyterms": json.dumps([*KEY_TERMS, *LANGUAGE_KEY_TERMS[terms_language]], ensure_ascii=False),
                },
                files={"file": ("speech", audio, content_type)},
                timeout=LISTEN_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            answer = response.json()
            transcript = (answer.get("transcript") or "").strip()
            count(listen_requests=1, listen_seconds=speech_seconds(audio), empty_listens=0 if transcript else 1)
            return {**answer, "transcript": transcript}
        except (httpx.HTTPError, ValueError) as error:
            print(f"Speech to text failed: {error}")
            count(failed_listens=1)
    return None


def speak(text: str, language: str) -> str | None:
    """Return the spoken text as base64 WAV audio, or None so the call can carry on as text."""
    text = text[:MAX_SPOKEN_CHARACTERS]
    name = hashlib.sha256(f"{VOICE_MODEL}|{VOICE_SPEAKER}|{language}|{text}".encode()).hexdigest()
    saved = CACHE_DIR / f"{name}.txt"
    if saved.exists():
        count(cached_voice_characters=len(text))
        saved.touch()
        return saved.read_text(encoding="ascii")

    try:
        response = httpx.post(
            SARVAM_URL,
            headers={"api-subscription-key": os.environ["SARVAM_API_KEY"]},
            json={"text": text, "language_code": language, "model": VOICE_MODEL, "speaker": VOICE_SPEAKER},
            timeout=30,
        )
        response.raise_for_status()
        # Joining and re-encoding gives one clean audio string, even if Sarvam sends parts.
        audio = base64.b64encode(base64.b64decode("".join(response.json()["audios"]))).decode("ascii")
    except (httpx.HTTPError, KeyError, ValueError) as error:
        print(f"Voice failed: {error}")
        return None

    count(voice_characters=len(text))
    CACHE_DIR.mkdir(exist_ok=True)
    saved.write_text(audio, encoding="ascii")
    trim_voice_cache()
    return audio


def trim_voice_cache() -> None:
    """Keep the saved audio within its limit, so the server's disk can't fill up."""
    clips = sorted(CACHE_DIR.glob("*.txt"), key=lambda clip: clip.stat().st_mtime)
    total = sum(clip.stat().st_size for clip in clips)
    for clip in clips:
        if total <= MAX_VOICE_CACHE_BYTES:
            return
        total -= clip.stat().st_size
        clip.unlink(missing_ok=True)
