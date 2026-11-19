import alusea_ai_service.cards as cards
import alusea_ai_service.main as main
import alusea_ai_service.store as store


def send(client, message, language="en-IN"):
    return client.post("/chat", json={"message": message, "language": language})


def test_a_message_gets_a_reply_and_is_saved(client, fake_services):
    response = send(client, "Show me doors for my balcony")
    assert response.status_code == 200
    assert response.json()["content"] == "Which room is this for?"
    visitor = client.cookies["alusea_chat_id"]
    assert [row["role"] for row in store.load_messages(visitor)] == ["user", "assistant"]


def test_thirty_messages_then_a_limit_message_in_the_menu_language(client, fake_services, monkeypatch):
    monkeypatch.setenv("LIMIT_BURST_VISITOR", "1000")
    monkeypatch.setenv("LIMIT_BURST_IP", "1000")
    codes = [send(client, f"Tell me about door {'x' * number}").status_code for number in range(31)]
    assert codes == [200] * 30 + [429]
    blocked = send(client, "Tell me more", "ta-IN").json()["detail"]
    assert "+91 96260 22722" in blocked and "limit" in blocked


def test_a_customer_over_the_limit_can_still_leave_a_number(client, fake_services, monkeypatch):
    monkeypatch.setenv("LIMIT_MESSAGE_VISITOR", "0")
    assert send(client, "Tell me about doors").status_code == 429
    assert send(client, "Call me back").status_code == 200
    assert send(client, "Ravi, 9876543210").status_code == 200


def test_a_failed_reply_does_not_use_up_the_limit(client, fake_services, monkeypatch):
    monkeypatch.setenv("LIMIT_MESSAGE_VISITOR", "1")

    def broken(*args, **kwargs):
        raise RuntimeError("the AI is down")

    monkeypatch.setattr(main, "generate_reply", broken)
    assert [send(client, f"Tell me about doors {number}").status_code for number in range(3)] == [502, 502, 502]
    monkeypatch.setattr(main, "generate_reply", lambda history, message, language, **context: "Fine.")
    assert send(client, "Tell me about windows").status_code == 200


def test_new_chat_clears_the_chat_but_keeps_the_visitor(client, fake_services, monkeypatch):
    monkeypatch.setenv("LIMIT_MESSAGE_VISITOR", "2")
    monkeypatch.setenv("LIMIT_MESSAGE_IP", "100")
    send(client, "Tell me about doors")
    visitor = client.cookies["alusea_chat_id"]
    response = client.delete("/chat")
    assert "set-cookie" not in response.headers
    assert store.load_messages(visitor) == []
    assert [send(client, f"Tell me about windows {number}").status_code for number in range(2)] == [200, 429]


def test_saved_chat_loads_its_cards_in_one_request(client, monkeypatch):
    requests = []
    product = "71fbe747-bfd7-4ac7-afcb-a9ff4d954232"
    monkeypatch.setattr(cards, "load_cards", lambda ids: requests.append(ids) or [
        {"id": product_id, "name": "Door", "category": "Doors", "description": "", "price_per_sqft": 1000, "image_url": "", "url": ""}
        for product_id in ids
    ])
    client.cookies.set("alusea_chat_id", "11111111-1111-1111-1111-111111111111")
    store.save_exchange("11111111-1111-1111-1111-111111111111", "first", f"Here.\n\n[product:{product}]")
    store.save_exchange("11111111-1111-1111-1111-111111111111", "second", f"Estimate.\n\n[estimate:{product}:8:10:1]")
    messages = client.get("/chat").json()["messages"]
    assert len(requests) == 1
    assert messages[3]["products"][0]["estimate"]["amount"] == 80000


def test_the_api_pages_are_off(client):
    assert [client.get(path).status_code for path in ("/docs", "/redoc", "/openapi.json")] == [404, 404, 404]


def test_security_headers_are_sent(client):
    headers = client.get("/").headers
    assert headers["x-content-type-options"] == "nosniff"
    assert "frame-ancestors" in headers["content-security-policy"]
    assert "microphone=(self)" in headers["permissions-policy"]
    assert "strict-transport-security" not in headers


def test_the_live_site_sends_a_secure_cookie_and_https_header(client, fake_services, monkeypatch):
    monkeypatch.setattr(main, "COOKIE_SECURE", True)
    response = send(client, "Hello there friend")
    assert "secure" in response.headers["set-cookie"].lower()
    assert "strict-transport-security" in response.headers


def test_health_check(client):
    assert client.get("/health").json() == {"ok": True}


def test_the_page_has_the_privacy_note_and_five_minute_calls(client):
    page = client.get("/").text
    assert "alusea.in/privacy-policy" in page
    assert "CALL_LIMIT_MS = 5 * 60 * 1000" in page
    assert page.count("privacyNote:") == 5
