"""What changes when Sara runs on Vercel: the daily jobs, and where the visitor's address comes from."""
import alusea_ai_service.main as main
import alusea_ai_service.store as store


def test_daily_jobs_need_the_cron_secret(client, monkeypatch):
    assert client.get("/cron/daily").status_code == 404  # No secret set, so the jobs can't be run at all.
    monkeypatch.setenv("CRON_SECRET", "a-long-random-secret")
    assert client.get("/cron/daily", headers={"Authorization": "Bearer wrong"}).status_code == 404
    store.save_exchange("v1", "old question", "old answer")
    with store.database() as db:
        db.run("UPDATE messages SET created_at = datetime('now', '-100 days')")
    answer = client.get("/cron/daily", headers={"Authorization": "Bearer a-long-random-secret"})
    assert answer.status_code == 200 and answer.json() == {"deleted_messages": 2}


def test_visitor_address_comes_from_vercel_only_on_vercel(monkeypatch):
    request = type("Request", (), {"headers": {"x-real-ip": "203.0.113.7"}, "client": type("Client", (), {"host": "10.0.0.1"})()})()
    assert main.client_ip(request) == "10.0.0.1"  # Off Vercel, anyone could send this header, so it's ignored.
    monkeypatch.setattr(main, "ON_VERCEL", True)
    assert main.client_ip(request) == "203.0.113.7"


def test_chat_is_remembered_when_the_cookie_is_blocked(client, fake_services):
    """Some browsers block Sara's cookie inside the alusea.in panel. The id the page saves keeps the chat."""
    first = client.post("/chat", json={"message": "Hello", "language": "en-IN"})
    visitor = first.headers["X-Visitor-Id"]
    client.cookies.clear()  # The browser didn't keep the cookie.
    client.post("/chat", json={"message": "A door please", "language": "en-IN"}, headers={"X-Visitor-Id": visitor})
    client.cookies.clear()
    history = client.get("/chat", headers={"X-Visitor-Id": visitor}).json()
    said = [message["content"] for message in history["messages"] if message["role"] == "user"]
    assert said == ["Hello", "A door please"]


def test_a_made_up_visitor_header_is_ignored(client, fake_services):
    answer = client.get("/chat", headers={"X-Visitor-Id": "not-a-real-id"})
    assert answer.status_code == 200 and "X-Visitor-Id" not in answer.headers
