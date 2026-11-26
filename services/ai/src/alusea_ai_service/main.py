import asyncio
import hmac
import csv
import io
import os
import secrets
import time
import uuid
from contextlib import asynccontextmanager
from html import escape
from pathlib import Path
from typing import Literal
from alusea_ai_service.cards import present, present_many
from fastapi import Cookie, Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field

from alusea_ai_service.agent import generate_reply, reply_language
from alusea_ai_service.call import SpokenTurn, call_turn, is_noise, not_heard, start_call
from alusea_ai_service.limits import allow, give_back, is_callback_message, reached
from alusea_ai_service.safe_log import clean_error
from alusea_ai_service.small_talk import comparison, limit_message, small_talk, sorry_message
from alusea_ai_service.meter import Meter, call_meter, metering, summary
from alusea_ai_service.prompt import LANGUAGES as LANGUAGE_NAMES
from alusea_ai_service.store import ON_VERCEL, database_ok, delete_messages, delete_old_messages, init_db, last_language, load_for_model, load_leads, load_messages, save_exchange
from alusea_ai_service.sheet import as_text, in_india, resend_unsent_leads
from alusea_ai_service.translation import ENGLISH_LETTERS, language_in_letters, translate_reply
from alusea_ai_service.voice import MAX_SPOKEN_CHARACTERS, listen, speak

COOKIE_NAME = "alusea_chat_id"
COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60
# Enough that sizes, rooms and products given early in a chat are still seen by the AI later on.
HISTORY_SENT_TO_MODEL = 24
STATIC_DIR = Path(__file__).parent / "static"
# The same as the cookie, so nothing is kept after a visitor's chat would have been forgotten anyway.
CHAT_RETENTION_DAYS = int(os.getenv("CHAT_RETENTION_DAYS", "90"))
SECONDS_PER_DAY = 24 * 60 * 60
SHEET_RETRY_SECONDS = 15 * 60
# Browser protections. The page may only be framed by Alusea's own sites, and only it may use the microphone.
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "microphone=(self), camera=(), geolocation=()",
    "Content-Security-Policy": " ".join(
        ["frame-ancestors 'self' https://www.alusea.in https://alusea.in", *os.getenv("EXTRA_FRAME_ORIGINS", "").split()]
    )
    + "; object-src 'none'; base-uri 'self'",
}
# Set COOKIE_SECURE=true on the live site, which uses HTTPS. Local testing on http:// needs it off.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "").lower() == "true"
Language = Literal["en-IN", "ta-IN", "ml-IN", "te-IN", "kn-IN"]
# About 2 minutes of speech, which voice.py splits into parts for Sarvam. Vercel refuses requests over 4.5 MB.
MAX_SPEECH_BYTES = 4_000_000


async def delete_old_chats_daily() -> None:
    while True:
        deleted = await run_in_threadpool(delete_old_messages, CHAT_RETENTION_DAYS)
        if deleted:
            print(f"Deleted {deleted} chat messages older than {CHAT_RETENTION_DAYS} days.")
        await asyncio.sleep(SECONDS_PER_DAY)


async def resend_leads_regularly() -> None:
    while True:
        await run_in_threadpool(resend_unsent_leads)
        await asyncio.sleep(SHEET_RETRY_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # On Vercel, Sara only runs while answering, so these jobs run from Vercel's daily schedule instead (/cron/daily).
    tasks = [] if ON_VERCEL else [asyncio.create_task(delete_old_chats_daily()), asyncio.create_task(resend_leads_regularly())]
    yield
    for task in tasks:
        task.cancel()


# The automatic API pages are off, so the live site doesn't list its endpoints.
app = FastAPI(title="Alusea AI Service", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
team_login = HTTPBasic()


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.update(SECURITY_HEADERS)
    # Only over HTTPS, so local testing on http:// isn't affected.
    if COOKIE_SECURE:
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response


# Some browsers block the cookie inside the alusea.in panel. Sara's page then keeps the visitor's id in its own
# storage and sends it in this header, so the chat is still remembered.
VISITOR_HEADER = "x-visitor-id"


@app.middleware("http")
async def remember_visitor_without_cookie(request: Request, call_next):
    cookies = request.cookies
    given = valid_visitor_id(request.headers.get(VISITOR_HEADER))
    if given and not valid_visitor_id(cookies.get(COOKIE_NAME)):
        # Read as if the cookie had arrived, so every endpoint works the same way.
        headers = [(name, value) for name, value in request.scope["headers"] if name != b"cookie"]
        other = "; ".join(f"{name}={value}" for name, value in cookies.items() if name != COOKIE_NAME)
        headers.append((b"cookie", f"{other + '; ' if other else ''}{COOKIE_NAME}={given}".encode()))
        request.scope["headers"] = headers
    response = await call_next(request)
    # The page saves this, in case the cookie doesn't come back next time.
    issued = next((cookie.split("=", 1)[1].split(";", 1)[0] for cookie in response.headers.getlist("set-cookie") if cookie.startswith(f"{COOKIE_NAME}=")), None)
    visitor = valid_visitor_id(issued) or given or valid_visitor_id(cookies.get(COOKIE_NAME))
    if visitor:
        response.headers["X-Visitor-Id"] = visitor
    return response


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    language: Language = "en-IN"


class CallStartRequest(BaseModel):
    language: Language


class SpeakRequest(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_SPOKEN_CHARACTERS)
    language: Language


class CallRetryRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    language: Language
    understood: str | None = Field(default=None, max_length=8000)


def valid_visitor_id(value: str | None) -> str | None:
    """Accept only a real UUID from the cookie, and ignore anything else."""
    if not value:
        return None
    try:
        return str(uuid.UUID(value))
    except ValueError:
        return None


def remember_visitor(response: Response, visitor_id: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=visitor_id,
        max_age=COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
    )


def client_ip(request: Request) -> str:
    """The visitor's address. On Vercel it comes in a header Vercel sets itself. Elsewhere, uvicorn must run with
    --proxy-headers so this isn't the proxy's."""
    if ON_VERCEL and request.headers.get("x-real-ip"):
        return request.headers["x-real-ip"]
    return request.client.host if request.client else "unknown"


def require_allowance(kind: str, request: Request, visitor_id: str | None, detail: str = "Today's limit has been reached.") -> None:
    if not allow(kind, visitor_id, client_ip(request)):
        print(f"Limit reached: {kind}")
        raise HTTPException(status_code=429, detail=detail)


@app.get("/health")
def health() -> dict:
    """For uptime monitoring: says whether Sara is running and her database answers. It uses no paid services."""
    try:
        database_ok()
    except Exception as error:
        print(f"Health check failed: {clean_error(error)}")
        raise HTTPException(status_code=503, detail="The database isn't answering.")
    return {"ok": True}


@app.get("/cron/daily")
def daily_jobs(authorization: str | None = Header(default=None)) -> dict:
    """Vercel calls this once a day with CRON_SECRET: old chats are deleted and leads the sheet missed are sent again."""
    secret = os.getenv("CRON_SECRET", "")
    if not secret or not hmac.compare_digest((authorization or "").encode(), f"Bearer {secret}".encode()):
        raise HTTPException(status_code=404)
    deleted = delete_old_messages(CHAT_RETENTION_DAYS)
    resend_unsent_leads()
    return {"deleted_messages": deleted}


@app.get("/alusea-logo.svg")
def logo() -> FileResponse:
    return FileResponse(STATIC_DIR / "alusea-logo-dark.svg", media_type="image/svg+xml", headers={"Cache-Control": "public, max-age=86400"})


@app.get("/sara.webp")
def sara_picture() -> FileResponse:
    """Sara's picture for the call screen. The same file is in apps/marketing/public/sara.webp; keep the two the same."""
    return FileResponse(STATIC_DIR / "sara.webp", media_type="image/webp", headers={"Cache-Control": "public, max-age=86400"})


@app.get("/")
def home() -> FileResponse:
    # The browser checks for a newer page on every visit, so changes show without a hard refresh.
    return FileResponse(STATIC_DIR / "index.html", headers={"Cache-Control": "no-cache"})


@app.get("/chat")
def get_chat(alusea_chat_id: str | None = Cookie(default=None)) -> dict:
    visitor_id = valid_visitor_id(alusea_chat_id)
    if not visitor_id:
        return {"messages": []}
    saved = load_messages(visitor_id)
    shown = iter(present_many([item["content"] for item in saved if item["role"] == "assistant"]))
    return {
        "messages": [
            {"role": item["role"], **next(shown)} if item["role"] == "assistant"
            else {"role": item["role"], "content": item["content"], "products": []}
            for item in saved
        ]
    }


@app.post("/chat")
def post_chat(
    request: ChatRequest,
    http_request: Request,
    response: Response,
    alusea_chat_id: str | None = Cookie(default=None),
) -> dict:
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Please enter a message.")

    visitor_id = valid_visitor_id(alusea_chat_id) or str(uuid.uuid4())
    language = reply_language(message)
    limit_language = request.language if language == "en-IN" else language
    kind = "callback" if is_callback_message(message) else "message"
    require_allowance(kind, http_request, visitor_id, limit_message(limit_language))
    script = None
    if language == "en-IN":
        language = language_in_letters(message, request.language, last_language(visitor_id))
        script = None if language == "en-IN" else ENGLISH_LETTERS

    ready = comparison(message, request.language)
    if ready:
        # The "uPVC vs aluminium" suggestion: the same answer every time, in the menu's language.
        language, script = request.language, None
    try:
        # The ready-made small talk is in each language's script, so Tanglish starts from the English and gets translated.
        reply = ready or small_talk(message, "en-IN" if script else language)
        english = None
        if reply is None:
            history = load_for_model(visitor_id, limit=HISTORY_SENT_TO_MODEL)
            english = generate_reply(history, message, request.language, visitor_id=visitor_id)
            reply = translate_reply(english, language, script)
        elif script:
            english = reply
            reply = translate_reply(english, language, script)
        save_exchange(visitor_id, message, reply, english, language=language)
    except Exception as error:
        # Only the error itself: visitors' messages stay out of the logs.
        print(f"Chat failed: {clean_error(error)}")
        give_back(kind, visitor_id, client_ip(http_request))
        raise HTTPException(status_code=502, detail=sorry_message("en-IN" if script else language))

    remember_visitor(response, visitor_id)
    return present(reply)


@app.post("/call/start")
def post_call_start(
    request: CallStartRequest,
    http_request: Request,
    response: Response,
    alusea_chat_id: str | None = Cookie(default=None),
) -> dict:
    visitor_id = valid_visitor_id(alusea_chat_id) or str(uuid.uuid4())
    require_allowance("call", http_request, visitor_id)
    remember_visitor(response, visitor_id)
    # A new call's meter starts from zero.
    meter = call_meter(visitor_id, new_call=True)
    before = meter.snapshot()
    with metering(meter):
        reply = start_call(request.language)
    print(summary(before, meter.snapshot()))
    return reply


def check_speech_size(request: Request) -> None:
    """Refuse a recording that says it's too big before reading any of it."""
    declared = request.headers.get("content-length")
    if declared is not None and (not declared.isdigit() or int(declared) > MAX_SPEECH_BYTES):
        raise HTTPException(status_code=413, detail="That recording is empty or too long.")


async def read_speech(request: Request) -> bytes:
    """Read a recording, stopping as soon as it passes the size limit, so a huge upload can't fill the memory."""
    chunks = []
    size = 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > MAX_SPEECH_BYTES:
            raise HTTPException(status_code=413, detail="That recording is empty or too long.")
        chunks.append(chunk)
    if not size:
        raise HTTPException(status_code=413, detail="That recording is empty or too long.")
    return b"".join(chunks)


async def read_speech_or_give_back(request: Request, kind: str, visitor_id: str | None) -> bytes:
    """Read a recording. A refused one, empty or too big, doesn't use up the customer's limit."""
    try:
        return await read_speech(request)
    except HTTPException:
        give_back(kind, visitor_id, client_ip(request))
        raise


@app.post("/speech")
async def post_speech(request: Request, language: Language, alusea_chat_id: str | None = Cookie(default=None)) -> dict:
    """Write speech out in the customer's own language, so they can check it before sending."""
    check_speech_size(request)
    require_allowance("mic", request, valid_visitor_id(alusea_chat_id))
    speech = await read_speech_or_give_back(request, "mic", valid_visitor_id(alusea_chat_id))
    content_type = request.headers.get("content-type", "audio/wav")
    heard = await run_in_threadpool(listen, speech, content_type, language)
    if heard is None:
        give_back("mic", valid_visitor_id(alusea_chat_id), client_ip(request))
        raise HTTPException(status_code=502, detail="Speech to text failed.")
    return {"text": heard[0]}


@app.post("/speak")
def post_speak(request: SpeakRequest, http_request: Request, alusea_chat_id: str | None = Cookie(default=None)) -> dict:
    """Read a reply aloud in Sara's own voice, the same as on calls. Saved audio makes a repeat free."""
    require_allowance("listen", http_request, valid_visitor_id(alusea_chat_id))
    audio = speak(request.text, request.language)
    if audio is None:
        give_back("listen", valid_visitor_id(alusea_chat_id), client_ip(http_request))
        raise HTTPException(status_code=502, detail="Voice failed.")
    return {"audio": audio}


@app.post("/call/speech")
async def post_call_speech(
    request: Request,
    response: Response,
    language: Language,
    continues: bool = False,
    alusea_chat_id: str | None = Cookie(default=None),
) -> dict:
    """continues means this speech starts with the customer's previous, unanswered turn, because they paused and carried on."""
    check_speech_size(request)
    visitor_id = valid_visitor_id(alusea_chat_id) or str(uuid.uuid4())
    require_allowance("call_turn", request, visitor_id)
    speech = await read_speech_or_give_back(request, "call_turn", visitor_id)
    content_type = request.headers.get("content-type", "audio/wav")
    remember_visitor(response, visitor_id)
    meter = call_meter(visitor_id)
    before = meter.snapshot()
    started = time.perf_counter()
    with metering(meter):
        reply = await answer_speech(visitor_id, speech, content_type, language, meter, SpokenTurn(visitor_id, continues))
    meter.add(turn_wait=time.perf_counter() - started)
    print(summary(before, meter.snapshot()))
    return reply


async def answer_speech(
    visitor_id: str, speech: bytes, content_type: str, language: str, meter: Meter, turn: SpokenTurn
) -> dict:
    heard = await run_in_threadpool(listen, speech, content_type, language)
    if heard is None:
        return {"heard": "", **await run_in_threadpool(not_heard, language)}
    message, spoken_language = heard
    if not message:
        return {"heard": "", "content": "", "products": [], "audio": None}
    # Noise written down as dots or a lone letter gets no answer, so Sara doesn't talk over the customer.
    if is_noise(message):
        meter.add(noise_turns=1)
        print("A call turn was only noise, so Sara kept listening.")
        return {"heard": "", "content": "", "products": [], "audio": None}
    meter.add(turns=1)
    reply = await run_in_threadpool(call_turn, visitor_id, message, spoken_language, True, None, turn=turn)
    return {"heard": message, "language": spoken_language, **reply}


@app.post("/call/retry")
def post_call_retry(
    request: CallRetryRequest,
    http_request: Request,
    response: Response,
    alusea_chat_id: str | None = Cookie(default=None),
) -> dict:
    """Try a spoken message again after the AI's rate limit. Its words are already known, so nothing is heard twice."""
    visitor_id = valid_visitor_id(alusea_chat_id) or str(uuid.uuid4())
    require_allowance("call_turn", http_request, visitor_id)
    remember_visitor(response, visitor_id)
    meter = call_meter(visitor_id)
    before = meter.snapshot()
    with metering(meter):
        reply = call_turn(visitor_id, request.message, request.language, can_wait=False, understood=request.understood)
    print(summary(before, meter.snapshot()))
    return reply


def require_team(request: Request, credentials: HTTPBasicCredentials = Depends(team_login)) -> None:
    """Let in only someone with the leads password from .env. Without one set, the page stays off. Wrong passwords are limited."""
    password = os.getenv("LEADS_PASSWORD")
    if not password:
        raise HTTPException(status_code=404)
    ip = client_ip(request)
    if reached("leads_login", None, ip):
        raise HTTPException(status_code=429, detail="Too many wrong passwords today. Try again tomorrow.")
    if not secrets.compare_digest(credentials.password.encode(), password.encode()):
        allow("leads_login", None, ip)
        print("Wrong password on the leads page.")
        raise HTTPException(status_code=401, headers={"WWW-Authenticate": "Basic"})


@app.get("/leads", response_class=HTMLResponse)
def get_leads(_: None = Depends(require_team)) -> str:
    rows = "".join(
        f"<tr><td>{escape(in_india(lead['created_at']))} IST</td><td>{escape(lead['name'])}</td>"
        f"<td><a href=\"tel:{escape(lead['phone'])}\">{escape(lead['phone'])}</a></td>"
        f"<td>{escape(lead['note'])}</td><td>{escape(LANGUAGE_NAMES.get(lead['language'], lead['language'] or ''))}</td></tr>"
        for lead in load_leads()
    ) or '<tr><td colspan="5">No callback requests yet.</td></tr>'
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sara leads</title>
<style>body{{font-family:system-ui,sans-serif;margin:16px;color:#1f2933}}table{{border-collapse:collapse;width:100%}}
th,td{{border-bottom:1px solid #d9dee3;padding:8px;text-align:left;vertical-align:top}}a.button{{display:inline-block;margin:8px 0 16px;padding:8px 12px;background:#1f6feb;color:#fff;border-radius:6px;text-decoration:none}}</style>
</head><body><h1>Callback requests</h1><a class="button" href="/leads.csv">Download as spreadsheet</a>
<table><tr><th>When</th><th>Name</th><th>Phone</th><th>What they want</th><th>Language</th></tr>{rows}</table></body></html>"""


@app.get("/leads.csv")
def get_leads_spreadsheet(_: None = Depends(require_team)) -> Response:
    sheet = io.StringIO()
    writer = csv.writer(sheet)
    writer.writerow(["When (IST)", "Name", "Phone", "What they want", "Language"])
    for lead in load_leads():
        language = LANGUAGE_NAMES.get(lead["language"], lead["language"] or "")
        writer.writerow([as_text(value) for value in (in_india(lead["created_at"]), lead["name"], lead["phone"], lead["note"], language)])
    # The mark at the start lets Excel read Tamil and other scripts correctly.
    return Response(
        "﻿" + sheet.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="sara-leads.csv"', "Cache-Control": "no-store"},
    )


@app.delete("/chat")
def delete_chat(response: Response, alusea_chat_id: str | None = Cookie(default=None)) -> dict:
    visitor_id = valid_visitor_id(alusea_chat_id)
    # The visitor keeps their cookie, so a new chat doesn't reset their daily limits.
    if visitor_id:
        delete_messages(visitor_id)
    return {"ok": True}