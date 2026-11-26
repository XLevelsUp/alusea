import re
import time
from concurrent.futures import ThreadPoolExecutor

import httpx
from dotenv import load_dotenv

from alusea_ai_service.agent import REPEATING_WORDS
from alusea_ai_service.cards import markers_in, remove_markers
from alusea_ai_service.keys import SARVAM_KEYS, post_with_keys
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
# Sizes like "8ft" or "6 x 10 ft" belong to no language, and they make the check read English as Telugu.
MEASUREMENT = re.compile(r"\d+(\.\d+)?\s*(sq\.?\s*(ft|feet)|sqft|ft|feet|foot|inch(es)?|in|mm|cm|m|x|×|by)?\b|\b(ft|feet|sq|sqft|x|×)\b", re.IGNORECASE)
# Place and brand names belong to no language either: Sarvam read "RS Puram showroom address" as Tamil.
NAMES = re.compile(
    r"\b(alusea|sara|coimbatore|kovai|rs\s*puram|sundarapuram|gandhipuram|peelamedu|saibaba\s*colony|singanallur|"
    r"vadavalli|ganapathy|ramanathapuram|saravanampatti|pollachi|tiruppur|erode|salem|madurai|trichy|chennai|"
    r"bangalore|bengaluru|mysore|mysuru|hyderabad|kochi|cochin|palakkad|thrissur|kerala|tamil\s*nadu|karnataka)\b",
    re.IGNORECASE,
)
# Common words each language uses when typed in English letters (Tanglish, Manglish, Tenglish, Kanglish). A word on
# one list is never on another, and words the languages share, such as "peru", "illa", "ithu" and "eppo", are left
# out, so one word can't pull a chat into the wrong language. The test checks the lists never overlap.
ROMAN_WORDS = {
    "ta-IN": {
        "ku", "la", "venum", "venu", "venuu", "enna", "evlo", "evvlo", "iruku", "irukku", "irukum", "irukkum", "erukanu",
        "paakanu", "paakka", "paaka", "panna", "pannu", "pannunga", "pannuviyaa", "enga", "unga", "enaku", "enakku",
        "seri", "aagum", "vaanga", "eppadi", "epdi", "kammi", "naan", "naanga", "ennoda", "enoda", "ungaluku",
        "ungalukku", "ungaloda", "romba", "rombha", "konjam", "sollunga", "sollu", "solla", "sollreenga", "pesunga",
        "pesu", "pesraa", "pesringa", "pesureenga", "theriyum", "theriyala", "puriyala", "puriyalai", "vendam",
        "vendaam", "nandri", "vanakkam", "aama", "aamaa", "idhu", "adhu", "inga", "anga", "apram", "appuram",
        "kudunga", "kodunga", "paarunga", "vilai", "kathavu", "jannal", "neenga", "nenga", "innaikku", "naalaikku",
        "veetuku", "veettukku", "veettula", "panreenga", "panringa", "irukkanga", "irukkeenga", "mattum", "thaan",
    },
    "ml-IN": {
        "njan", "njaan", "ente", "enikku", "enikk", "ningal", "ningalude", "ningalkku", "venam", "venda", "undo",
        "alle", "aano", "aanu", "evide", "enthu", "enthanu", "engane", "ippol", "kollam", "nokkam", "parayu",
        "paranju", "cheyyam", "cheyyan", "sheri", "illallo", "kittum", "vila", "vathil", "vaathil", "janala",
        "veettil", "tharumo", "kurachu", "valare", "nannayi", "thaangal", "thaangalude", "kodukkam",
        "ariyilla", "manassilayilla", "vilikkam", "vilikku",
    },
    "te-IN": {
        "nenu", "naaku", "naku", "meeru", "meeku", "kavali", "kaavali", "kavalanu", "undi", "ledu", "ledhu", "enti",
        "emiti", "cheppandi", "cheyandi", "chesthara", "ivvandi", "dhara", "ekkada", "ippudu", "bagundi", "manchidi",
        "thalupu", "thalupulu", "kitiki", "kitikilu", "intlo", "intiki", "memu", "andi", "garu", "avunu", "kaadu",
        "chudandi", "telusu", "teliyadu", "cheyyandi", "mee",
    },
    "kn-IN": {
        "naanu", "nanage", "nange", "neevu", "nimma", "nimage", "beku", "bekagide", "beda", "ide", "yenu", "hege",
        "hegide", "yaavdu", "yavudu", "bagilu", "kitaki", "mane", "maneya", "manege", "maadi", "heli", "helri", "ondu",
        "eshtu", "estu", "chennagide", "banni", "houdu", "illri", "swalpa", "svalpa", "gottilla", "artha",
    },
}


def language_from_words(message: str) -> str | None:
    """The language whose everyday words the message uses most, or None if there are none or it's a tie."""
    words = re.findall(r"[a-z]+", message.lower())
    hits = {language: sum(word in listed for word in words) for language, listed in ROMAN_WORDS.items()}
    best = max(hits.values())
    winners = [language for language, count in hits.items() if count == best]
    return winners[0] if best and len(winners) == 1 else None


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
        response = post_with_keys(
            SARVAM_KEYS,
            SARVAM_TRANSLATE_URL,
            "api-subscription-key",
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
    """Find the language of a message typed in English letters, so Tanglish gets Tanglish back.

    A short message, such as a name, a phone number or "ok", stays in the chat's language, or the menu's at the start.
    Sarvam guesses wildly on one or two words: it once read the name "Logesh" as Malayalam and switched the chat."""
    found = language_from_words(message)
    if found:
        return menu if menu != "en-IN" else found
    # Sizes and names don't count: "8 x 10 ft sliding door price" leaves three words, too few for Sarvam to judge.
    if len(re.findall(r"[^\W\d_]+", language_words(message))) < MIN_WORDS_TO_CHANGE_LANGUAGE:
        return earlier or menu
    return checked_language(message, menu)


def language_words(message: str) -> str:
    """The message without sizes and place or brand names, which belong to no language."""
    return " ".join(NAMES.sub(" ", MEASUREMENT.sub(" ", message)).split())


def checked_language(message: str, menu: str) -> str:
    """Everyday words decide straight away, because Sarvam's check reads Tanglish like "kitchen ku paakanu" as Malayalam.
    A chosen menu language still wins over another Indian language. If unsure, it's English."""
    found = language_from_words(message)
    if found:
        return menu if menu != "en-IN" else found
    words = language_words(message)
    if not re.search(r"[^\W\d_]", words):
        return "en-IN"
    try:
        response = post_with_keys(
            SARVAM_KEYS,
            SARVAM_CHECK_URL,
            "api-subscription-key",
            json={"input": words[:MAX_CHECK_CHARACTERS]},
            timeout=CHECK_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        count(check_characters=len(words[:MAX_CHECK_CHARACTERS]))
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
