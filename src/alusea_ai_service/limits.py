"""Daily limits, so one person can't use up the credit for everyone. Any number can be changed in .env, such as LIMIT_CALL_VISITOR=5."""
import hashlib
import os
import re
from datetime import datetime, timedelta, timezone

from alusea_ai_service.store import return_allowance, take_allowance

INDIA = timezone(timedelta(hours=5, minutes=30))
SCOPES = ("visitor", "ip", "site")
# Uses per day for each visitor, each IP address and the whole site.
# A home or office can share one IP address, so its limit is higher than one visitor's.
DAILY_LIMITS = {
    "call": (3, 6, 10),
    # The calls above are only started by the page, so this stops speech being sent without one.
    "call_turn": (90, 180, 300),
    "message": (30, 60, 200),
    "listen": (10, 20, 50),
    "mic": (20, 40, 100),
    # Separate from messages, so a customer who has run out can still leave their number.
    "callback": (5, 10, 50),
}
# Typed messages per minute for each visitor and each IP address.
BURST_LIMITS = (10, 20)
CALL_ME_BACK_PHRASES = {
    "Call me back",
    "எனக்கு call பண்ணுங்க",
    "എന്നെ തിരിച്ചു വിളിക്കൂ",
    "నాకు call చేయండి",
    "ನನಗೆ call ಮಾಡಿ",
}
MIN_PHONE_DIGITS = 10


def setting(kind: str, scope: str, default: int) -> int:
    return int(os.getenv(f"LIMIT_{kind.upper()}_{scope.upper()}", default))


def is_callback_message(message: str) -> bool:
    """A request for a call back, or a message that gives a phone number."""
    return message.strip() in CALL_ME_BACK_PHRASES or len(re.sub(r"\D", "", message)) >= MIN_PHONE_DIGITS


def hidden(period: str, value: str) -> str:
    """Counters are stored under a hash, so the table doesn't keep anyone's IP address."""
    return hashlib.sha256(f"{period}|{value}".encode()).hexdigest()[:32]


def daily_counters(kind: str, visitor_id: str | None, ip: str, today: str) -> list[tuple[str, str, str, str, int]]:
    keys = {"visitor": visitor_id, "ip": ip, "site": "site"}
    return [
        (today, kind, scope, hidden(today, keys[scope]), setting(kind, scope, DAILY_LIMITS[kind][position]))
        for position, scope in enumerate(SCOPES)
        if keys[scope]
    ]


def give_back(kind: str, visitor_id: str | None, ip: str) -> None:
    """Return a use after Gayu failed, so a customer isn't charged for an apology. The per-minute limit stays."""
    return_allowance(daily_counters(kind, visitor_id, ip, datetime.now(INDIA).strftime("%Y-%m-%d")))


def allow(kind: str, visitor_id: str | None, ip: str) -> bool:
    """Count one use, or return False without counting if any limit has been reached."""
    now = datetime.now(INDIA)
    today = now.strftime("%Y-%m-%d")
    this_minute = now.strftime("%Y-%m-%d %H:%M")
    keys = {"visitor": visitor_id, "ip": ip}
    counters = daily_counters(kind, visitor_id, ip, today)
    if kind == "message":
        counters += [
            (this_minute, "burst", scope, hidden(this_minute, keys[scope]), setting("burst", scope, BURST_LIMITS[position]))
            for position, scope in enumerate(SCOPES[:2])
            if keys[scope]
        ]
    return take_allowance(counters, today)
