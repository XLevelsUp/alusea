import json
import os
from types import SimpleNamespace

import httpx
from dotenv import load_dotenv

from alusea_ai_service.safe_log import clean_error

load_dotenv()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# For test conversations only, because this free model's data terms haven't been checked.
# Remove OPENROUTER_API_KEY from .env to turn the backup off before real customers use the service.
BACKUP_MODEL = os.getenv("BACKUP_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
BACKUP_TIMEOUT_SECONDS = 30


def ask_backup(messages: list[dict], request: dict) -> SimpleNamespace | None:
    """Ask the free backup model, in the same form as a Groq answer. None means it can't help right now."""
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        return None
    body = {
        "model": BACKUP_MODEL,
        "messages": messages,
        "tools": request["tools"],
        "tool_choice": request["tool_choice"],
        "temperature": request["temperature"],
        "max_tokens": request["max_completion_tokens"],
    }
    try:
        response = httpx.post(
            OPENROUTER_URL,
            headers={"Authorization": f"Bearer {key}"},
            json=body,
            timeout=BACKUP_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        answer = response.json()
        for choice in answer["choices"]:
            choice["message"].setdefault("content", None)
            choice["message"].setdefault("tool_calls", None)
        return json.loads(json.dumps(answer), object_hook=lambda item: SimpleNamespace(**item))
    except (httpx.HTTPError, KeyError, ValueError) as error:
        print(f"The backup model failed: {clean_error(error)}")
        return None
