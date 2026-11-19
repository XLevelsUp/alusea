"""Print a line in Sara's terminal for every call she makes to an outside service, such as Groq or Sarvam.

Every outside call goes through httpx, including the Groq library's, so watching httpx sees them all. Only the
service, the method and the path are printed: never keys, query strings or what was sent. Set LOG_API_CALLS=false
to turn this off."""
import os
import time
from urllib.parse import urlsplit

import httpx

SERVICES = {
    "api.groq.com": "Groq",
    "api.sarvam.ai": "Sarvam",
    "openrouter.ai": "OpenRouter",
    "script.google.com": "Google Sheet",
    "script.googleusercontent.com": "Google Sheet",
}
# The Google Sheet's address works like a password, so only the service is shown for it.
HIDDEN_PATHS = {"Google Sheet"}
installed = False


def service_name(host: str) -> str:
    if host.endswith(".supabase.co"):
        return "Supabase"
    return SERVICES.get(host, host)


def describe(request: httpx.Request) -> str:
    url = urlsplit(str(request.url))
    service = service_name(url.hostname or "")
    path = "" if service in HIDDEN_PATHS else url.path
    return f"{service:<12} {request.method:<6} {path}"


def report(request: httpx.Request, started: float, outcome: str) -> None:
    milliseconds = (time.perf_counter() - started) * 1000
    print(f"API  {describe(request)}  {outcome}  {milliseconds:.0f} ms", flush=True)


def install() -> None:
    """Wrap httpx so each outside call is printed with its result and time. Safe to call more than once."""
    global installed
    if installed or os.getenv("LOG_API_CALLS", "true").lower() == "false":
        return
    installed = True
    send = httpx.Client.send

    def logged_send(self, request, *args, **kwargs):
        started = time.perf_counter()
        try:
            response = send(self, request, *args, **kwargs)
        except Exception as error:
            report(request, started, f"failed ({type(error).__name__})")
            raise
        report(request, started, str(response.status_code))
        return response

    httpx.Client.send = logged_send
