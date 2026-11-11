import os
import re
import threading
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

from alusea_ai_service.prompt import LANGUAGES
from alusea_ai_service.store import mark_sheet_sent, unsent_leads

load_dotenv()

# Google Apps Script answers through a redirect and can be slow to start, so this runs in the background.
SHEET_TIMEOUT_SECONDS = 20
# A cell starting with one of these, even after spaces or control characters, could run as a formula in a spreadsheet.
RISKY_START = re.compile(r"^[\s\x00-\x1f]*[=+\-@]|^[\t\r]")


def as_text(value: object) -> str:
    """Keep a value as plain text in a spreadsheet, so it can never run as a formula."""
    text = str(value)
    return f"'{text}" if RISKY_START.match(text) else text


def sheet_settings() -> tuple[str, str] | None:
    url = os.getenv("LEADS_SHEET_URL")
    secret = os.getenv("LEADS_SHEET_SECRET")
    return (url, secret) if url and secret else None


def send_lead(lead_id: int, uid: str, name: str, phone: str, note: str, language: str) -> None:
    """Copy a new lead to the team's Google Sheet, if one is set up. The lead is already saved, so a failure loses nothing."""
    if not sheet_settings():
        return
    when = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    threading.Thread(target=post_lead, args=(lead_id, uid, when, name, phone, note, language), daemon=True).start()


def resend_unsent_leads() -> None:
    """Try again for recent leads the sheet missed, such as when the server stopped while sending."""
    if not sheet_settings():
        return
    for lead in unsent_leads():
        post_lead(lead["id"], lead["uid"] or f"lead-{lead['id']}", lead["created_at"], lead["name"], lead["phone"], lead["note"], lead["language"])


def post_lead(lead_id: int, uid: str, when: str, name: str, phone: str, note: str, language: str) -> None:
    url, secret = sheet_settings()
    lead = {
        "secret": secret,
        # If an earlier try reached the sheet but its answer was lost, the script sees this id and doesn't add the lead twice.
        "id": uid,
        "when": when,
        "name": as_text(name),
        "phone": as_text(phone),
        "note": as_text(note),
        "language": LANGUAGES.get(language, language),
    }
    try:
        response = httpx.post(url, json=lead, timeout=SHEET_TIMEOUT_SECONDS, follow_redirects=True)
        response.raise_for_status()
        if not response.json().get("ok"):
            print("The Google Sheet refused the lead. Check LEADS_SHEET_SECRET matches the script's SECRET.")
            return
        mark_sheet_sent(lead_id)
    except (httpx.HTTPError, ValueError) as error:
        # Only the error: the customer's name and number stay out of the logs.
        print(f"The lead couldn't be copied to the Google Sheet yet. It's on the leads page and will be tried again: {type(error).__name__}")
