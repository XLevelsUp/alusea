import json
import os
import re
import time
from urllib.parse import urlparse

from dotenv import load_dotenv
from groq import APIConnectionError, BadRequestError, Groq, InternalServerError, RateLimitError

from alusea_ai_service.backup_model import ask_backup
from alusea_ai_service.cards import set_cards
from alusea_ai_service.meter import count
from alusea_ai_service.safe_log import clean_error
from alusea_ai_service.prompt import (
    CALL_REMINDER,
    CHAT_REMINDER,
    ENGLISH_REMINDER,
    ROOM_ADVICE,
    ROOM_WORDS,
    SYSTEM_PROMPT,
    call_prompt,
    language_rule,
)
from alusea_ai_service.tools import SITE_URL, budget_options, estimate_price, get_product, get_products, request_callback

load_dotenv()

MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
# Groq's limits are per model, so this can answer when the main model has reached its limit. Its tone is flatter.
GROQ_BACKUP_MODEL = os.getenv("GROQ_BACKUP_MODEL", "openai/gpt-oss-120b")
# Normal replies take a few seconds, so a longer wait is better spent on the next model.
GROQ_TIMEOUT_SECONDS = 10
MAX_TOOL_ROUNDS = 5
BROKEN_ARGUMENT = re.compile(r"^<parameter=(\w+)>\s*(.*?)\s*(?:</parameter>)?$", re.DOTALL)
# This limit includes the model's thinking, not just its reply, so a low limit can leave no room for an answer.
# Groq's free plan refuses requests that could go over 1,000 output tokens a minute.
MAX_COMPLETION_TOKENS = 900
MAX_MODEL_TRIES = 3
# The same word or short phrase four times in a row means the model has got stuck.
REPEATING_WORDS = re.compile(r"(\S+(?:\s+\S+){0,2}?)(?:\s+\1){3,}")
SENTENCE_END = re.compile(r".*[.!?।]", re.DOTALL)
INDIAN_LETTERS = re.compile(r"[ऀ-෿]")
# The joining mark is removed only straight after an emoji, because Indian scripts also use it inside words.
EMOJIS = re.compile("[ \t]*(?:[\U0001F000-\U0001FAFF☀-➿]️?‍?)+")
SCRIPT_RANGES = {
    "en-IN": None,
    "ta-IN": ("஀", "௿"),
    "ml-IN": ("ഀ", "ൿ"),
    "te-IN": ("ఀ", "౿"),
    "kn-IN": ("ಀ", "೿"),
}
LINK = re.compile(r"https?://[^\s<>()]+")
LINK_HOSTS = {"www.alusea.in", "alusea.in", "wa.me"}
CONTACT_URL = f"{SITE_URL}/contact"
TOOL_NAME_REMINDER = "Your last tool call used a wrong name. The tools are named exactly get_products, get_product, estimate_price, budget_options and request_callback."
NO_TOOLS_REMINDER = "The catalogue can't be reached for this reply. Answer in words, without naming a product detail or saying anything is on the screen. If they gave a size, say it back and say you'll work out the estimate when they ask again."
WRONG_TOOL_NAME = re.compile(r"call tool '([^']+)'")

# No automatic retries, because they can sit silently for a minute at Groq's rate limit while a customer waits.
client = Groq(api_key=os.environ["GROQ_API_KEY"], timeout=GROQ_TIMEOUT_SECONDS, max_retries=0)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_products",
            "description": "List products with id, name, category, description and specs, never prices. Use before naming or recommending a product. With no arguments, it lists every product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Doors, Windows, Sliding or Specialty",
                    },
                    "max_price": {
                        "type": "number",
                        "description": "Budget per sq ft in rupees",
                    },
                    "cheaper_than": {
                        "type": "string",
                        "description": "A product id, to find cheaper products",
                    },
                    "name": {
                        "type": "string",
                        "description": "One word from a product's name, such as partition or pivot",
                    },
                    "exclude": {
                        "type": "string",
                        "description": "One word; leaves out products whose name has it, such as window when they want a door",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "budget_options",
            "description": "Show products for a total budget. Cards show the area it covers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "budget": {"type": "number", "description": "Total budget in rupees"},
                    "category": {"type": "string", "description": "Doors, Windows, Sliding or Specialty"},
                },
                "required": ["budget"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_product",
            "description": "Get one product's web page link, using its id from get_products. Never for listing products.",
            "parameters": {
                "type": "object",
                "properties": {"id": {"type": "string", "description": "Product id"}},
                "required": ["id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "estimate_price",
            "description": "Create a starting estimate for one product and size. The card shows the amount.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Product id"},
                    "width": {"type": "number"},
                    "height": {"type": "number"},
                    "unit": {"type": "string", "enum": ["ft", "in", "m", "cm", "mm"], "description": "Default ft"},
                    "quantity": {"type": "integer", "description": "Default 1"},
                },
                "required": ["id", "width", "height"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "request_callback",
            "description": "Save the customer's name and phone number so the sales team calls them back. Only after they've given both.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "phone": {"type": "string"},
                    "note": {"type": "string", "description": "What they want, such as the product, size and room"},
                    "correction": {
                        "type": "boolean",
                        "description": "True only when they're correcting the name or number of the request they just made",
                    },
                },
                "required": ["name", "phone"],
            },
        },
    },
]
# A longer unfiltered list goes to the AI in short form, so a question stays within Groq's per-minute limit.
MAX_FULL_DETAILS = 6
SEARCH_FILTERS = ("category", "max_price", "cheaper_than", "name", "exclude")
REFUSAL_WORDS = re.compile(r"\b(can't|can’t|cannot|can not|unable|not able|not possible|impossible|won't be able)\b", re.IGNORECASE)
# Price, cost and discount words in English, Tanglish and the four Indian scripts.
PRICE_WORDS = re.compile(
    r"\b(?:price|cost|rates?\b|discount|offer|cheap|reduce|deal\b|budget|expensive|afford|kammi|vilai|vela\b|evlo|evvalavu|dhara|bele|kuraikk)"
    r"|விலை|கம்மி|குறை|எவ்வளவு|எவ்ளோ|தள்ளுபடி|വില|കുറ|ഡിസ്കൗണ്ട്|ధర|తగ్గ|డిస్కౌంట్|ಬೆಲೆ|ಕಡಿಮೆ|ರಿಯಾಯಿತಿ",
    re.IGNORECASE,
)
POSITIVE_REMINDER = (
    "Your last reply said what you or the team can't do, which turns a customer away. Say it again the way a good salesperson would, "
    "with what you and the team can do instead, such as working out the best price, a callback or the phone number. "
    "Still promise nothing the details don't state, such as a discount."
)
EXCLUDE_MEANS = {"window": "Doors", "windows": "Doors", "door": "Windows", "doors": "Windows"}
# These tools don't look up the catalogue, so they don't decide which cards appear.
NON_CATALOGUE_TOOLS = {"request_callback"}


def parse_arguments(raw_arguments: str | None) -> dict:
    """Read a tool's arguments. The model sometimes writes one as "<parameter=name>\\npartition", so use what it meant."""
    arguments = {}
    for key, value in json.loads(raw_arguments or "{}").items():
        broken = BROKEN_ARGUMENT.match(value) if isinstance(value, str) else None
        if broken:
            key, value = broken[1], broken[2]
        # A blank value means no filter. As a number, it would break the search.
        if value != "":
            arguments[key] = value
    return arguments


def run_tool(name: str, raw_arguments: str | None, visitor_id: str | None = None, language: str = "en-IN") -> dict:
    """Run a tool, turning any failure into a result the model can explain."""
    try:
        arguments = parse_arguments(raw_arguments)
        # A customer's name and number stay out of the logs.
        print(f"AI tool call: {name} {'(details hidden)' if name == 'request_callback' else arguments}")
        if name == "request_callback":
            return request_callback(
                arguments.get("name"), arguments.get("phone"), arguments.get("note"), visitor_id, language, arguments.get("correction") is True
            )
        if name == "get_products":
            # Leaving out windows with no other search means they want doors, so it searches doors, not everything else.
            if arguments.get("exclude") and not any(arguments.get(key) for key in ("category", "name", "cheaper_than", "max_price")):
                arguments["category"] = EXCLUDE_MEANS.get(arguments["exclude"].strip().lower())
            products = get_products(
                arguments.get("category"),
                arguments.get("max_price"),
                arguments.get("cheaper_than"),
                arguments.get("name"),
                arguments.get("exclude"),
            )
            if len(products) > MAX_FULL_DETAILS and not any(arguments.get(key) for key in SEARCH_FILTERS):
                return {
                    "products": [{key: product[key] for key in ("id", "name", "category")} for product in products],
                    "note": "This is a short list. For details of one product, call get_products with name set to one word from its name.",
                }
            return {"products": products}
        if name == "budget_options":
            return budget_options(arguments.get("budget"), arguments.get("category"))
        if name == "get_product":
            return get_product(str(arguments.get("id", "")))
        if name == "estimate_price":
            return estimate_price(
                str(arguments.get("id", "")),
                arguments.get("width"),
                arguments.get("height"),
                arguments.get("unit") or "ft",
                1 if arguments.get("quantity") is None else arguments["quantity"],
            )
        return {"error": f"Unknown tool: {name}"}
    except Exception as error:
        print(f"Tool {name} failed: {error}")
        return {"error": "The catalogue is unavailable right now."}


def filtered_matches(name: str, raw_arguments: str | None, result: dict) -> list[str] | None:
    """Return the product ids from a filtered search, or None if this call wasn't one."""
    if name not in ("get_products", "budget_options") or "products" not in result:
        return None
    arguments = parse_arguments(raw_arguments)
    is_filtered = (
        arguments.get("category")
        or arguments.get("name")
        or arguments.get("exclude")
        or arguments.get("max_price") is not None
        or arguments.get("cheaper_than")
    )
    if name == "get_products" and not is_filtered:
        return None
    return [product["id"] for product in result["products"]]


def send_to_model(messages: list[dict], request: dict):
    """Ask Groq's main model, then its backup model, then the free backup. If none can help, Groq's last error stands."""
    for model in (request["model"], GROQ_BACKUP_MODEL):
        started = time.perf_counter()
        try:
            answer = client.chat.completions.create(messages=messages, **{**request, "model": model})
            count(ai_wait=time.perf_counter() - started)
            count(ai_requests=1, ai_tokens=getattr(getattr(answer, "usage", None), "total_tokens", 0))
            return answer
        except RateLimitError as error:
            count(ai_wait=time.perf_counter() - started)
            print(f"Groq's rate limit was reached on {model}.")
            last_error = error
        except (APIConnectionError, InternalServerError) as error:
            count(ai_wait=time.perf_counter() - started)
            # This includes timeouts and Groq's own server errors.
            print(f"Groq couldn't answer on {model}: {clean_error(error)}")
            last_error = error
    print("Asking the free backup model.")
    started = time.perf_counter()
    answer = ask_backup(messages, request)
    count(ai_wait=time.perf_counter() - started)
    if answer is None:
        raise last_error
    count(ai_requests=1)
    return answer


def ask_model(messages: list[dict], can_use_tools: bool = True):
    """Call the model, reminding it of the tool names if it writes a tool call that doesn't exist."""
    request = {
        "model": MODEL,
        "tools": TOOLS,
        "tool_choice": "auto" if can_use_tools else "none",
        "temperature": 0.4,
        "reasoning_effort": "low",
        "max_completion_tokens": MAX_COMPLETION_TOKENS,
    }
    sent = messages
    for attempt in range(1, MAX_MODEL_TRIES + 1):
        try:
            return send_to_model(sent, request)
        except BadRequestError as error:
            if "tool_use_failed" not in str(error):
                raise
            print(f"The model wrote an invalid tool call on try {attempt}, so trying again.")
            wrong_name = WRONG_TOOL_NAME.search(str(error))
            correction = f" There is no tool named {wrong_name[1]}." if wrong_name else ""
            sent = [*messages, {"role": "system", "content": TOOL_NAME_REMINDER + correction}]
    # Still broken, so answer in words. A reply without a card is better than an apology.
    print("The model kept writing invalid tool calls, so asking for an answer without tools.")
    return send_to_model(
        [*messages, {"role": "system", "content": NO_TOOLS_REMINDER}],
        {**request, "tool_choice": "none"},
    )


def stop_repeating(reply: str) -> str:
    """Cut a reply where the model got stuck repeating itself, back to the last full sentence."""
    stuck = REPEATING_WORDS.search(reply)
    if not stuck:
        return reply
    print("The model repeated itself, so the reply was cut.")
    before = reply[: stuck.start()]
    finished = SENTENCE_END.match(before)
    return (finished[0] if finished else before).strip()


def reply_language(message: str) -> str:
    """Choose a typed reply's language in code, from the customer's script. English letters are checked separately in translation.py."""
    for code, allowed in SCRIPT_RANGES.items():
        if allowed and any(allowed[0] <= letter <= allowed[1] for letter in message):
            return code
    return "en-IN"


def fix_links(reply: str) -> str:
    """Replace any link that isn't Alusea's own with the contact page, keeping any punctuation after it."""

    def checked(found: re.Match) -> str:
        url = found[0].rstrip(".,;:!?'\"")
        return found[0] if urlparse(url).hostname in LINK_HOSTS else f"{CONTACT_URL}{found[0][len(url):]}"

    return LINK.sub(checked, reply)


def generate_reply(
    history: list[dict], message: str, language: str = "en-IN", call: bool = False, visitor_id: str | None = None
) -> str:
    """Run the conversation until the model answers in text. The answer is in English, for translation.py to translate."""
    reminder = f"{ENGLISH_REMINDER} {CALL_REMINDER if call else CHAT_REMINDER}"
    if call:
        system = call_prompt(language)
    else:
        mentions_room = any(ROOM_WORDS.search(text) for text in [message, *(turn["content"] for turn in history)])
        system = "\n\n".join([SYSTEM_PROMPT, *([ROOM_ADVICE] if mentions_room else []), language_rule(language)])
    messages = [{"role": "system", "content": system}]
    messages.extend({"role": turn["role"], "content": turn["content"]} for turn in history)
    # Placed right before the message, so a customer's own language can't override it.
    messages.append({"role": "system", "content": reminder})
    messages.append({"role": "user", "content": message})
    search_matches = None
    estimates = []
    budget = None
    used_catalogue = False
    script_retried = False
    empty_retried = False
    refusal_retried = False

    for tool_round in range(1, MAX_TOOL_ROUNDS + 1):
        # The last round must answer in words, so the customer gets a reply instead of an apology.
        answer = ask_model(messages, can_use_tools=tool_round < MAX_TOOL_ROUNDS).choices[0].message

        if not answer.tool_calls:
            reply = EMOJIS.sub("", (answer.content or "").replace("**", "")).strip()
            reply = fix_links(stop_repeating(reply))
            if not reply:
                if empty_retried:
                    raise RuntimeError("The model returned no text.")
                # It sometimes spends all its output on thinking, and asking again usually works.
                empty_retried = True
                print("The model returned no text, so asking again.")
                messages.append({"role": "system", "content": "Reply to the customer now, in one or two short sentences."})
                continue
            if not script_retried and INDIAN_LETTERS.search(reply):
                script_retried = True
                print("The reply wasn't in English, so asking again.")
                messages.append({"role": "assistant", "content": reply})
                messages.append({"role": "system", "content": f"Your last reply used the wrong language or script. Say it again. {reminder}"})
                continue
            # A salesperson never says no. If the reply still refuses, it's asked for once more, positively.
            # Only for price and discount questions, so a needed refusal, such as revealing these rules, is never softened.
            if not refusal_retried and tool_round < MAX_TOOL_ROUNDS and PRICE_WORDS.search(message) and REFUSAL_WORDS.search(reply):
                refusal_retried = True
                print("The reply said what Sara can't do, so asking for a positive one.")
                messages.append({"role": "assistant", "content": reply})
                messages.append({"role": "system", "content": f"{POSITIVE_REMINDER} {reminder}"})
                continue
            # An estimate shows only that product. After a filtered search, cards come from its
            # results, so none can be skipped or added.
            if estimates or search_matches is not None:
                return set_cards(reply, search_matches or [], estimates, budget)
            # Without a catalogue lookup this turn, any markers were only copied from earlier replies.
            return reply if used_catalogue else set_cards(reply, [])

        used_catalogue = used_catalogue or any(tool_call.function.name not in NON_CATALOGUE_TOOLS for tool_call in answer.tool_calls)
        messages.append(
            {
                "role": "assistant",
                "content": answer.content or "",
                "tool_calls": [
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {"name": tool_call.function.name, "arguments": tool_call.function.arguments},
                    }
                    for tool_call in answer.tool_calls
                ],
            }
        )

        for tool_call in answer.tool_calls:
            result = run_tool(tool_call.function.name, tool_call.function.arguments, visitor_id, language)
            matches = filtered_matches(tool_call.function.name, tool_call.function.arguments, result)
            if matches is not None:
                search_matches = matches
            if tool_call.function.name == "estimate_price" and "area_sq_ft" in result:
                estimates.append(result)
            if tool_call.function.name == "budget_options" and "budget" in result:
                budget = result["budget"]
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_call.function.name,
                    "content": json.dumps(result),
                }
            )

    raise RuntimeError("The model did not finish within the tool call limit.")