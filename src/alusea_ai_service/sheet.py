import os
import threading
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

from alusea_ai_service.prompt import LANGUAGES

load_dotenv()

# Google Apps Script answers through a redirect and can be slow to start, so this runs in the background.
SHEET_TIMEOUT_SECONDS = 20


def send_lead(name: str, phone: str, note: str, language: str) -> None:
    """Copy a new lead to the team's Google Sheet, if one is set up. The lead is already saved, so a failure loses nothing."""
    url = os.getenv("LEADS_SHEET_URL")
    secret = os.getenv("LEADS_SHEET_SECRET")
    if not url or not secret:
        return
    lead = {
        "secret": secret,
        "when": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "name": name,
        "phone": phone,
        "note": note,
        "language": LANGUAGES.get(language, language),
    }
    threading.Thread(target=post_lead, args=(url, lead), daemon=True).start()


def post_lead(url: str, lead: dict) -> None:
    try:
        response = httpx.post(url, json=lead, timeout=SHEET_TIMEOUT_SECONDS, follow_redirects=True)
        response.raise_for_status()
        if not response.json().get("ok"):
            print("The Google Sheet refused the lead. Check LEADS_SHEET_SECRET matches the script's SECRET.")
    except (httpx.HTTPError, ValueError) as error:
        # Only the error: the customer's name and number stay out of the logs.
        print(f"The lead couldn't be copied to the Google Sheet, but it's on the leads page: {type(error).__name__}")
