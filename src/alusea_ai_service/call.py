import re

from groq import RateLimitError

from alusea_ai_service.agent import generate_reply
from alusea_ai_service.cards import present, set_cards
from alusea_ai_service.safe_log import clean_error
from alusea_ai_service.small_talk import not_heard_message, small_talk, sorry_message, wait_message
from alusea_ai_service.store import load_for_model, save_exchange
from alusea_ai_service.tools import get_products
from alusea_ai_service.translation import to_english, translate_reply
from alusea_ai_service.voice import speak

CALL_HISTORY_SENT_TO_MODEL = 12
SHORT_QUESTION_WORDS = 12
ENDING_QUESTION = re.compile(r"^(.*[.!])\s+([^.!?]+\?)$", re.DOTALL)
RETRY_WAIT = re.compile(r"try again in (?:(\d+)m)?([\d.]+)(ms|s)\b")
# Past the minute limit a call can still wait. A longer wait means the daily limit, so it gets the apology.
MAX_WAIT_SECONDS = 30
# Groq's wait only makes room for one more request, and a reply can need two.
RETRY_PADDING_SECONDS = 10

# Speech reaches the AI as English, except Indian-language words that stay untranslated.
DOOR_WORDS = ("door",)
WINDOW_WORDS = ("window",)
# A message using only these asks for doors or windows in general. Any other word, such as a room
# or "partition", is a detail the AI should use.
PLAIN_REQUEST_WORDS = {
    "i", "we", "want", "need", "am", "are", "looking", "for", "would", "like", "to", "see", "show", "me", "us",
    "a", "an", "some", "please", "door", "doors", "window", "windows",
}
# These need a real answer, so they go to the AI even in a short message.
SPECIFIC_WORDS = ("sliding", "pivot", "fold", "not ", "don't", "difference", "compare", "which", "best", "better", "why", "how")
ADDRESS_WORDS = ("where", "address", "location")
HOURS_WORDS = ("open", "timing", "hours", "holiday")

CALL_TEXT = {
    "en-IN": {
        "greeting": "Hi, this is Gayu from Alusea! I'm so glad you called. Tell me about your home or project.",
        "doors": "Sure, I'd love to help! Here are some doors on your screen. Which part of your home are they for?",
        "windows": "Sure, I'd love to help! Here are some windows on your screen. Which part of your home are they for?",
        "address": "Our showroom is at No 178, A Ramachandra Road, RS Puram, Coimbatore. Please call +91 96260 22722 to confirm timings before you visit.",
        "hours": "Please call +91 96260 22722 to confirm our timings before you visit.",
        "price_from": "Prices start from {price} per square foot.",
        "budget": "At starting prices, {amount} could cover up to about {area} square feet, depending on the product.",
        "estimate": "The starting estimate is {amount} for {area} square feet. Our team confirms the final price after measuring.",
    },
    "ta-IN": {
        "greeting": "வணக்கம், நான் Alusea-ல இருந்து காயு பேசறேன்! நீங்க phone பண்ணதுல ரொம்ப சந்தோஷம். உங்க வீடு இல்லன்னா project பத்தி கொஞ்சம் சொல்லுங்க.",
        "doors": "கண்டிப்பா உதவி பண்றேன்! உங்க screen-ல கொஞ்சம் doors இருக்கு பாருங்க. எந்த room-க்கு door வேணும்?",
        "windows": "கண்டிப்பா உதவி பண்றேன்! உங்க screen-ல கொஞ்சம் windows இருக்கு பாருங்க. எந்த room-க்கு window வேணும்?",
        "address": "எங்க showroom No 178, A Ramachandra Road, RS Puram, Coimbatore-ல இருக்கு. வர்றதுக்கு முன்னாடி +91 96260 22722-க்கு phone பண்ணி நேரத்த கேட்டுக்கோங்க.",
        "hours": "வர்றதுக்கு முன்னாடி +91 96260 22722-க்கு phone பண்ணி நேரத்த கேட்டுக்கோங்க.",
        "price_from": "விலை ஒரு square foot-க்கு {price}-ல இருந்து ஆரம்பிக்குது.",
        "budget": "ஆரம்ப விலையில, {amount}-க்கு சுமார் {area} square feet வரைக்கும் வரலாம். இது product-அ பொறுத்தது.",
        "estimate": "{area} square feet-க்கு ஆரம்ப estimate {amount}. அளந்து பாத்ததுக்கு அப்புறம் எங்க team final price-அ சொல்லுவாங்க.",
    },
    "ml-IN": {
        "greeting": "നമസ്കാരം, ഞാൻ Alusea-യിൽ നിന്നുള്ള ഗായു ആണ്! വിളിച്ചതിൽ വളരെ സന്തോഷം. നിങ്ങളുടെ വീടിനെക്കുറിച്ചോ project-നെക്കുറിച്ചോ ഒന്ന് പറയാമോ?",
        "doors": "തീർച്ചയായും സഹായിക്കാം! നിങ്ങളുടെ screen-ൽ കുറച്ച് doors ഉണ്ട്. ഏത് room-ലേക്കാണ് door വേണ്ടത്?",
        "windows": "തീർച്ചയായും സഹായിക്കാം! നിങ്ങളുടെ screen-ൽ കുറച്ച് windows ഉണ്ട്. ഏത് room-ലേക്കാണ് window വേണ്ടത്?",
        "address": "ഞങ്ങളുടെ showroom No 178, A Ramachandra Road, RS Puram, Coimbatore-ലാണ്. വരുന്നതിന് മുമ്പ് +91 96260 22722 എന്ന നമ്പറിൽ വിളിച്ച് സമയം ചോദിക്കണേ.",
        "hours": "വരുന്നതിന് മുമ്പ് +91 96260 22722 എന്ന നമ്പറിൽ വിളിച്ച് സമയം ചോദിക്കണേ.",
        "price_from": "വില ഒരു square foot-ന് {price} മുതൽ തുടങ്ങുന്നു.",
        "budget": "തുടക്ക വിലയിൽ, {amount}-ന് ഏകദേശം {area} square feet വരെ കിട്ടാം. ഇത് product-നെ ആശ്രയിച്ചിരിക്കും.",
        "estimate": "{area} square feet-ന് starting estimate {amount} ആണ്. അളന്നതിന് ശേഷം ഞങ്ങളുടെ team final price ഉറപ്പിക്കും.",
    },
    "te-IN": {
        "greeting": "నమస్కారం, నేను Alusea నుంచి గాయు మాట్లాడుతున్నాను! మీరు call చేసినందుకు చాలా సంతోషం. మీ ఇల్లు గురించి లేదా మీ project గురించి చెప్పండి.",
        "doors": "తప్పకుండా సహాయం చేస్తాను! మీ screen మీద కొన్ని doors ఉన్నాయి. ఏ room కోసం door కావాలి?",
        "windows": "తప్పకుండా సహాయం చేస్తాను! మీ screen మీద కొన్ని windows ఉన్నాయి. ఏ room కోసం window కావాలి?",
        "address": "మా showroom No 178, A Ramachandra Road, RS Puram, Coimbatore-లో ఉంది. మీరు వచ్చే ముందు +91 96260 22722-కి call చేసి timings కనుక్కోండి.",
        "hours": "మీరు వచ్చే ముందు +91 96260 22722-కి call చేసి timings కనుక్కోండి.",
        "price_from": "ధరలు square foot-కి {price} నుండి మొదలవుతాయి.",
        "budget": "మొదటి ధరల ప్రకారం, {amount}-కి సుమారు {area} square feet వరకు రావచ్చు. ఇది product-ని బట్టి ఉంటుంది.",
        "estimate": "{area} square feet-కి starting estimate {amount}. మా team కొలతలు తీసుకున్న తర్వాత final price confirm చేస్తుంది.",
    },
    "kn-IN": {
        "greeting": "ನಮಸ್ಕಾರ, ನಾನು Alusea-ದಿಂದ ಗಾಯು ಮಾತಾಡ್ತಿದ್ದೀನಿ! ನೀವು call ಮಾಡಿದ್ದಕ್ಕೆ ತುಂಬಾ ಖುಷಿ ಆಯ್ತು. ನಿಮ್ಮ ಮನೆ ಅಥವಾ project ಬಗ್ಗೆ ಹೇಳಿ.",
        "doors": "ಖಂಡಿತ ಸಹಾಯ ಮಾಡ್ತೀನಿ! ನಿಮ್ಮ screen ಮೇಲೆ ಕೆಲವು door-ಗಳು ಇವೆ. ಯಾವ room-ಗೆ door ಬೇಕು?",
        "windows": "ಖಂಡಿತ ಸಹಾಯ ಮಾಡ್ತೀನಿ! ನಿಮ್ಮ screen ಮೇಲೆ ಕೆಲವು window-ಗಳು ಇವೆ. ಯಾವ room-ಗೆ window ಬೇಕು?",
        "address": "ನಮ್ಮ showroom No 178, A Ramachandra Road, RS Puram, Coimbatore-ನಲ್ಲಿದೆ. ಬರೋಕೆ ಮುಂಚೆ +91 96260 22722-ಗೆ call ಮಾಡಿ timings ಕೇಳ್ಕೊಳ್ಳಿ.",
        "hours": "ಬರೋಕೆ ಮುಂಚೆ +91 96260 22722-ಗೆ call ಮಾಡಿ timings ಕೇಳ್ಕೊಳ್ಳಿ.",
        "price_from": "ಪ್ರತಿ square foot-ಗೆ price {price}-ರಿಂದ ಶುರು ಆಗುತ್ತೆ.",
        "budget": "ಶುರುವಿನ price-ನಲ್ಲಿ, {amount}-ಗೆ ಸುಮಾರು {area} square feet ವರೆಗೆ ಬರಬಹುದು. ಇದು product ಮೇಲೆ depend ಆಗುತ್ತೆ.",
        "estimate": "{area} square feet-ಗೆ starting estimate {amount}. ನಮ್ಮ team ಅಳತೆ ಮಾಡಿದ ಮೇಲೆ final price confirm ಮಾಡುತ್ತೆ.",
    },
}

def rupees(amount: float) -> str:
    """Write an amount with Indian commas, such as ₹1,20,000, so it is read out correctly."""
    digits = str(round(amount))
    head, tail = digits[:-3], digits[-3:]
    groups = []
    while head:
        groups.insert(0, head[-2:])
        head = head[:-2]
    return "₹" + ",".join([*groups, tail])


def has_word(text: str, words: tuple[str, ...]) -> bool:
    # Matching from the start of a word, so "door" finds "doors" but "how" doesn't find "showroom".
    return any(re.search(rf"\b{re.escape(word)}", text) for word in words)


def is_plain_request(text: str) -> bool:
    return set(re.findall(r"[a-z]+", text)) <= PLAIN_REQUEST_WORDS


def quick_reply(message: str, language: str, first_message: bool) -> str | None:
    """Answer common requests without the AI, which saves tokens and time. Anything else returns None."""
    text = message.lower()
    word_count = len(text.split())
    if re.search(r"\d", text) or has_word(text, SPECIFIC_WORDS):
        return None

    lines = CALL_TEXT[language]
    wants_doors = has_word(text, DOOR_WORDS)
    wants_windows = has_word(text, WINDOW_WORDS)
    # Later in a conversation, even "door" may be answering Gayu's question, so the AI needs to see it.
    if first_message and is_plain_request(text) and wants_doors != wants_windows:
        reply, category = (lines["doors"], "Doors") if wants_doors else (lines["windows"], "Windows")
        return set_cards(reply, [product["id"] for product in get_products(category)])
    if word_count <= SHORT_QUESTION_WORDS and has_word(text, ADDRESS_WORDS):
        return lines["address"]
    if word_count <= SHORT_QUESTION_WORDS and has_word(text, HOURS_WORDS):
        return lines["hours"]
    return None


def price_line(products: list[dict], language: str) -> str:
    """Build the spoken price from the catalogue, because the AI never receives prices."""
    lines = CALL_TEXT[language]
    for product in products:
        if product.get("estimate"):
            estimate = product["estimate"]
            return lines["estimate"].format(amount=rupees(estimate["amount"]), area=f"{estimate['area_sq_ft']:g}")
    covered = [product["budget"] for product in products if product.get("budget")]
    if covered:
        return lines["budget"].format(
            amount=rupees(covered[0]["amount"]),
            area=max(item["area_sq_ft"] for item in covered),
        )
    if products:
        return lines["price_from"].format(price=rupees(min(product["price_per_sqft"] for product in products)))
    return ""


def voiced(shown: dict, language: str) -> dict:
    """Add the audio. The screen shows the reply, and the voice also says the price."""
    price = price_line(shown["products"], language)
    # A closing question stays last, so the customer can answer it straight after hearing it.
    closing = ENDING_QUESTION.match(shown["content"])
    parts = (closing[1], price, closing[2]) if closing else (shown["content"], price)
    return {**shown, "audio": speak(" ".join(part for part in parts if part), language)}


def start_call(language: str) -> dict:
    return voiced({"content": CALL_TEXT[language]["greeting"], "products": []}, language)


def not_heard(language: str) -> dict:
    return voiced({"content": not_heard_message(language), "products": []}, language)


def retry_seconds(error: RateLimitError) -> float | None:
    """Read how long Groq asks us to wait. None means hours, or a wait it didn't state."""
    wait = RETRY_WAIT.search(str(error))
    if not wait:
        return None
    return int(wait[1] or 0) * 60 + float(wait[2]) / (1000 if wait[3] == "ms" else 1)


def call_turn(visitor_id: str, message: str, language: str, can_wait: bool = True, understood: str | None = None) -> dict:
    """Answer one spoken message, written in the customer's own script. A failed answer is spoken too, so the call can carry on."""
    try:
        history = load_for_model(visitor_id, limit=CALL_HISTORY_SENT_TO_MODEL)
        reply = small_talk(message, language)
        english = None
        if reply is None:
            # A retry already has this, so the words aren't paid for twice.
            understood = understood or to_english(message, language)
            reply = small_talk(understood, language) or quick_reply(understood, language, not history)
        if reply is None:
            english = generate_reply(history, understood, language, call=True, visitor_id=visitor_id)
            reply = translate_reply(english, language)
        save_exchange(visitor_id, message, reply, english, understood)
    except RateLimitError as error:
        print(f"Call turn hit the AI's rate limit: {clean_error(error)}")
        seconds = retry_seconds(error)
        if not can_wait or seconds is None or seconds > MAX_WAIT_SECONDS:
            return voiced({"content": sorry_message(language), "products": []}, language)
        # The page says this, waits, and sends the same words again.
        return {
            **voiced({"content": wait_message(language), "products": []}, language),
            "retry_after": seconds + RETRY_PADDING_SECONDS,
            "retry_message": message,
            "retry_understood": understood,
        }
    except Exception as error:
        # Only the error itself: visitors' messages stay out of the logs.
        print(f"Call turn failed: {clean_error(error)}")
        return voiced({"content": sorry_message(language), "products": []}, language)
    return voiced(present(reply), language)
