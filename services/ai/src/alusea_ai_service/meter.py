"""Counts what each call spends, so the server log shows where the money goes.
Rupee amounts use Sarvam's pay-as-you-go prices. Groq's and Gemini's free tiers cost nothing, so they show amounts only."""
import threading
from collections import OrderedDict
from contextlib import contextmanager
from contextvars import ContextVar, copy_context

LISTEN_RUPEES_PER_MINUTE = 0.49
TRANSLATE_RUPEES_PER_1000_CHARACTERS = 2.0
VOICE_RUPEES_PER_1000_CHARACTERS = 3.0
LANGUAGE_CHECK_RUPEES_PER_1000_CHARACTERS = 0.35
# Enough for every call in a busy day. The oldest are forgotten after that.
MAX_METERS = 500

COUNTS = (
    "turns",
    "listen_seconds",
    "listen_requests",
    "empty_listens",
    "noise_turns",
    "failed_listens",
    "translate_characters",
    "translate_requests",
    "voice_characters",
    "gemini_voice_characters",
    "cached_voice_characters",
    "check_characters",
    "ai_requests",
    "ai_tokens",
    # Seconds spent waiting on each service, and on the whole turn.
    "listen_wait",
    "translate_wait",
    "ai_wait",
    "voice_wait",
    "turn_wait",
)


class Meter:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.counts = dict.fromkeys(COUNTS, 0)

    def add(self, **amounts: float) -> None:
        with self.lock:
            for name, amount in amounts.items():
                self.counts[name] += amount

    def snapshot(self) -> dict:
        with self.lock:
            return dict(self.counts)


def rupees(counts: dict) -> dict:
    return {
        "listening": counts["listen_seconds"] / 60 * LISTEN_RUPEES_PER_MINUTE,
        "translating": counts["translate_characters"] / 1000 * TRANSLATE_RUPEES_PER_1000_CHARACTERS,
        "voice": counts["voice_characters"] / 1000 * VOICE_RUPEES_PER_1000_CHARACTERS,
        "language check": counts["check_characters"] / 1000 * LANGUAGE_CHECK_RUPEES_PER_1000_CHARACTERS,
    }


def summary(before: dict, after: dict) -> str:
    """One line for the log: this turn's cost, then the call so far with the details."""
    turn = sum(rupees({name: after[name] - before[name] for name in COUNTS}).values())
    total = rupees(after)
    return (
        f"Call meter: this turn ₹{turn:.2f} | call so far ₹{sum(total.values()):.2f} over {after['turns']} turns"
        f" | listening {after['listen_seconds']:.0f}s in {after['listen_requests']} requests ₹{total['listening']:.2f}"
        f" ({after['empty_listens']} heard no words, {after['noise_turns']} only noise, {after['failed_listens']} failed)"
        f" | translating {after['translate_characters']:,} characters in {after['translate_requests']} requests ₹{total['translating']:.2f}"
        f" | voice: Gemini {after['gemini_voice_characters']:,} characters (free tier), Sarvam {after['voice_characters']:,} characters"
        f" ₹{total['voice']:.2f} (+{after['cached_voice_characters']:,} from saved audio, free)"
        f" | AI {after['ai_requests']} requests, {after['ai_tokens']:,} tokens"
        f" | this turn took {after['turn_wait'] - before['turn_wait']:.1f}s: listening {after['listen_wait'] - before['listen_wait']:.1f}s,"
        f" translating {after['translate_wait'] - before['translate_wait']:.1f}s, AI {after['ai_wait'] - before['ai_wait']:.1f}s,"
        f" voice {after['voice_wait'] - before['voice_wait']:.1f}s"
    )


current: ContextVar[Meter | None] = ContextVar("current_meter", default=None)
meters: OrderedDict[str, Meter] = OrderedDict()
meters_lock = threading.Lock()


def count(**amounts: float) -> None:
    """Add to the meter of the call being answered, if there is one."""
    meter = current.get()
    if meter:
        meter.add(**amounts)


def call_meter(visitor_id: str, new_call: bool = False) -> Meter:
    """Return this visitor's meter. A new call starts from zero."""
    with meters_lock:
        if new_call or visitor_id not in meters:
            meters[visitor_id] = Meter()
        meters.move_to_end(visitor_id)
        while len(meters) > MAX_METERS:
            meters.popitem(last=False)
        return meters[visitor_id]


@contextmanager
def metering(meter: Meter):
    token = current.set(meter)
    try:
        yield
    finally:
        current.reset(token)


def in_threads(pool, function, items):
    """Like pool.map, but each task still adds to the call's meter."""
    contexts = [copy_context() for _ in items]
    return pool.map(lambda pair: pair[0].run(function, pair[1]), zip(contexts, items))
