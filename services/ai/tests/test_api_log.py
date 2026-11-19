"""Sara's terminal shows each outside call, without keys, query strings or the Google Sheet's private address."""
import httpx

from alusea_ai_service import api_log


def fake_transport(status):
    return httpx.MockTransport(lambda request: httpx.Response(status))


def test_each_outside_call_is_printed_without_secrets(capsys):
    api_log.install()
    with httpx.Client(transport=fake_transport(200)) as client:
        client.post("https://api.sarvam.ai/text-to-speech?api_key=secret", headers={"api-subscription-key": "secret"})
        client.get("https://abc.supabase.co/rest/v1/products?select=*")
        client.post("https://script.google.com/macros/s/PRIVATE-ID/exec")
    printed = capsys.readouterr().out
    assert "Sarvam       POST   /text-to-speech  200" in printed
    assert "Supabase     GET    /rest/v1/products  200" in printed
    assert "Google Sheet POST" in printed
    assert "secret" not in printed and "PRIVATE-ID" not in printed


def test_a_failed_call_is_printed_too(capsys):
    def refuse(request):
        raise httpx.ConnectError("no network", request=request)

    with httpx.Client(transport=httpx.MockTransport(refuse)) as client:
        try:
            client.get("https://api.groq.com/openai/v1/chat/completions")
        except httpx.ConnectError:
            pass
    assert "Groq         GET    /openai/v1/chat/completions  failed (ConnectError)" in capsys.readouterr().out
