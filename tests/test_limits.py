import hashlib
import sqlite3
import threading

import alusea_ai_service.limits as limits
import alusea_ai_service.store as store


def uses(kind, visitor, ip, times):
    return [limits.allow(kind, visitor, ip) for _ in range(times)]


def test_each_visitor_gets_three_calls():
    assert uses("call", "v1", "1.1.1.1", 4) == [True, True, True, False]


def test_an_ip_address_gets_six_calls_across_visitors():
    for visitor in ("a", "b", "c"):
        uses("call", visitor, "1.1.1.1", 2)
    assert not limits.allow("call", "d", "1.1.1.1")


def test_the_site_stops_at_ten_calls():
    for number in range(10):
        assert limits.allow("call", f"v{number}", f"10.0.0.{number}")
    assert not limits.allow("call", "another", "10.0.1.1")


def test_a_refused_try_is_not_counted():
    uses("call", "v1", "1.1.1.1", 5)
    assert limits.allow("call", "v2", "1.1.1.1")


def test_typed_messages_are_limited_per_minute():
    assert uses("message", "v1", "1.1.1.1", 11) == [True] * 10 + [False]


def test_a_limit_can_be_changed_in_settings(monkeypatch):
    monkeypatch.setenv("LIMIT_CALL_VISITOR", "1")
    assert uses("call", "v1", "1.1.1.1", 2) == [True, False]


def test_a_failed_request_gives_its_use_back():
    uses("listen", "v1", "1.1.1.1", 10)
    limits.give_back("listen", "v1", "1.1.1.1")
    assert limits.allow("listen", "v1", "1.1.1.1")


def test_giving_back_nothing_is_harmless():
    limits.give_back("mic", "never", "9.9.9.9")
    assert limits.allow("mic", "never", "9.9.9.9")


def test_reached_checks_without_counting():
    uses("leads_login", None, "1.1.1.1", 10)
    assert limits.reached("leads_login", None, "1.1.1.1")
    assert not limits.reached("leads_login", None, "2.2.2.2")


def test_concurrent_requests_cannot_go_over_a_limit():
    results = []
    threads = [threading.Thread(target=lambda: results.append(limits.allow("call", "same", "1.1.1.1"))) for _ in range(20)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert results.count(True) == 3


def test_ip_addresses_are_hashed_with_a_secret_key():
    hashed = limits.hidden("2026-11-11", "1.2.3.4")
    assert hashed != hashlib.sha256(b"2026-11-11|1.2.3.4").hexdigest()[:32]
    assert limits.hidden("2026-11-11", "1.2.3.4") == hashed


def test_the_secret_key_is_made_once_even_when_requests_race(tmp_path, monkeypatch):
    # Repeated with a new key file each time, because a race may only show up now and then.
    for attempt in range(25):
        monkeypatch.setattr(limits, "SECRET_FILE", tmp_path / f"limits{attempt}.secret")
        keys = []
        threads = [threading.Thread(target=lambda: keys.append(limits.hash_key())) for _ in range(10)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        assert len(set(keys)) == 1 and len(keys[0]) == 64
    assert not list(tmp_path.glob("*.tmp"))


def test_a_key_made_by_another_process_is_used(tmp_path, monkeypatch):
    secret_file = tmp_path / "shared.secret"
    secret_file.write_text("a" * 64, encoding="ascii")
    monkeypatch.setattr(limits, "SECRET_FILE", secret_file)
    assert limits.hash_key() == b"a" * 64


def test_raw_ip_addresses_are_not_stored():
    limits.allow("call", "visitor-1", "6.6.6.6")
    keys = [row[0] for row in sqlite3.connect(store.DB_PATH).execute("SELECT key FROM limit_counts")]
    assert not any("6.6.6.6" in key or key == "visitor-1" for key in keys)


def test_earlier_days_are_cleared():
    connection = sqlite3.connect(store.DB_PATH)
    connection.execute("INSERT INTO limit_counts VALUES ('2020-01-01', 'call', 'site', 'old', 99)")
    connection.commit()
    limits.allow("listen", "v1", "1.1.1.1")
    assert connection.execute("SELECT COUNT(*) FROM limit_counts WHERE key = 'old'").fetchone()[0] == 0


def test_callback_messages_are_recognised():
    assert limits.is_callback_message("Call me back")
    assert limits.is_callback_message("எனக்கு call பண்ணுங்க")
    assert limits.is_callback_message("Ravi, 98765 43210")
    assert not limits.is_callback_message("8 by 10 feet sliding door")
