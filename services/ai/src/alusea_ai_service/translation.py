import os
import re
import time
from concurrent.futures import ThreadPoolExecutor

import httpx
from dotenv import load_dotenv

from alusea_ai_service.agent import REPEATING_WORDS
from alusea_ai_service.cards import markers_in, remove_markers
from alusea_ai_service.meter import count, in_threads
from alusea_ai_service.prompt import LANGUAGES

load_dotenv()

SARVAM_TRANSLATE_URL = "https://api.sarvam.ai/translate"
TRANSLATE_MODEL = "mayura:v1"
# Everyday spoken language. The first keeps the English words people really use, such as "budget" and "window".
TRANSLATE_MODES = ("modern-colloquial", "classic-colloquial")
UNDERSTANDING_MODE = "formal"
SARVAM_CHECK_URL = "https://api.sarvam.ai/text-lid"
CHECK_TIMEOUT_SECONDS = 5
MAX_CHECK_CHARACTERS = 1000
MIN_WORDS_TO_CHANGE_LANGUAGE = 4
# Common Tanglish words that the other languages don't use the same way.
TAMIL_WORDS = {
    "ku", "la", "venum", "venu", "venuu", "enna", "evlo", "evvlo", "iruku", "irukku", "irukum", "irukkum", "erukanu",
    "paakanu", "paakka", "paaka", "panna", "pannu", "pannunga", "pannuviyaa", "enga", "unga", "enaku", "enakku", "seri",
    "aagum", "vaanga", "eppadi", "epdi", "kammi",
}
# The whole reply in English letters, for customers who type that way.
ENGLISH_LETTERS = "roman"
# Sarvam accepts up to 1,000 characters per request.
MAX_PIECE_CHARACTERS = 900
MAX_PIECES_AT_ONCE = 4
# Indian-language text is about as long as its English, so far longer means the translation got stuck.
MAX_LENGTH_GROWTH = 3
LINK = re.compile(r"https?://[^\s<>()]+")
# Sarvam may leave the name in English letters or misspell it, so it always matches the rest of the page.
ASSISTANT_NAME = {"ta-IN": "சாரா", "ml-IN": "സാറാ", "te-IN": "సారా", "kn-IN": "ಸಾರಾ"}
MISSPELT_NAME = re.compile(r"(?<![A-Za-z])Sara(?![A-Za-z])")


def pieces_of(text: str) -> list[str]:
    """Split a reply at paragraphs, and long paragraphs at sentences, so each piece fits Sarvam's limit."""
    pieces = []
    for paragraph in re.split(r"\n\s*\n", text):
        current = ""
        for sentence in re.split(r"(?<=[.!?])\s+", paragraph.strip()):
            if current and len(current) + len(sentence) >= MAX_PIECE_CHARACTERS:
                pieces.append(current)
                current = ""
            current = f"{current} {sentence}".strip()
        if current:
            pieces.append(current)
    return pieces


def keeps_facts(english: str, translated: str) -> bool:
    """Check that sizes, phone numbers and links came through, and the translation didn't run away."""
    return (
        sorted(re.findall(r"\d", english)) == sorted(re.findall(r"\d", translated))
        and all(link.rstrip(".,;:!?'\"") in translated for link in LINK.findall(english))
        and len(translated) <= MAX_LENGTH_GROWTH * len(english) + 50
        and not REPEATING_WORDS.search(translated)
    )


def ask_sarvam(text: str, source: str, target: str, mode: str, script: str | None = None) -> str | None:
    started = time.perf_counter()
    try:
        response = httpx.post(
            SARVAM_TRANSLATE_URL,
            headers={"api-subscription-key": os.environ["SARVAM_API_KEY"]},
            json={
                "input": text,
                "source_language_code": source,
                "target_language_code": target,
                "model": TRANSLATE_MODEL,
                "mode": mode,
                "speaker_gender": "Female",
                **({"output_script": script} if script else {}),
            },
            timeout=15,
        )
        count(translate_wait=time.perf_counter() - started)
        response.raise_for_status()
        count(translate_requests=1, translate_characters=len(text))
        return response.json()["translated_text"].strip()
    except (httpx.HTTPError, KeyError, ValueError) as error:
        print(f"Translation failed: {error}")
        return None


def translate_piece(english: str, language: str, script: str | None = None) -> str:
    """Translate one piece. English is the fallback, because a customer can still act on it and its facts are right."""
    for mode in TRANSLATE_MODES:
        translated = ask_sarvam(english, "en-IN", language, mode, script)
        if translated and keeps_facts(english, translated):
            return translated if script else MISSPELT_NAME.sub(ASSISTANT_NAME[language], translated)
        print(f"The {mode} translation failed or changed something, so it wasn't used.")
    return english


def translate_reply(reply: str, language: str, script: str | None = None) -> str:
    """Turn the AI's English into the customer's spoken language, leaving product markers as they are."""
    if language == "en-IN":
        return reply
    pieces = pieces_of(remove_markers(reply).strip())
    with ThreadPoolExecutor(max_workers=MAX_PIECES_AT_ONCE) as pool:
        translated = list(in_threads(pool, lambda piece: translate_piece(piece, language, script), pieces))
    return "\n\n".join([*translated, *markers_in(reply)]).strip()


def language_in_letters(message: str, menu: str, earlier: str | None = None) -> str:
    """Find the language of a message typed in English letters, so Tanglish gets Tanglish back. A short message stays in the chat's language."""
    found = checked_language(message, menu)
    if earlier and earlier != "en-IN" and len(message.split()) < MIN_WORDS_TO_CHANGE_LANGUAGE:
        return earlier
    return found


def checked_language(message: str, menu: str) -> str:
    """Tamil words decide straight away, because Sarvam's check reads Tanglish like "kitchen ku paakanu" as Malayalam. If unsure, it's English."""
    if set(re.findall(r"[a-z]+", message.lower())) & TAMIL_WORDS:
        return menu if menu != "en-IN" else "ta-IN"
    try:
        response = httpx.post(
            SARVAM_CHECK_URL,
            headers={"api-subscription-key": os.environ["SARVAM_API_KEY"]},
            json={"input": message[:MAX_CHECK_CHARACTERS]},
            timeout=CHECK_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        count(check_characters=len(message[:MAX_CHECK_CHARACTERS]))
        found = response.json().get("language_code")
    except (httpx.HTTPError, ValueError) as error:
        print(f"Language check failed: {error}")
        return "en-IN"
    if found == "en-IN" or found not in LANGUAGES:
        return "en-IN"
    # It can mix up Indian languages on short messages, such as "seri thanks" as Malayalam, so a chosen menu language wins.
    return found if menu == "en-IN" else menu


def to_english(text: str, language: str) -> str:
    """Turn the customer's spoken words into English for the AI. It can also read their script, so that's the fallback."""
    if language == "en-IN":
        return text
    with ThreadPoolExecutor(max_workers=MAX_PIECES_AT_ONCE) as pool:
        english = in_threads(pool, lambda piece: ask_sarvam(piece, language, "en-IN", UNDERSTANDING_MODE) or piece, pieces_of(text))
    return " ".join(english)
