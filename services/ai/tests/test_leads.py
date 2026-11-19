import io
import json
import shutil
import sqlite3
import subprocess
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest

import alusea_ai_service.agent as agent
import alusea_ai_service.sheet as sheet
import alusea_ai_service.store as store
from alusea_ai_service.tools import request_callback

PROJECT = Path(__file__).parents[1]


def test_a_mobile_number_is_saved_in_one_format():
    assert request_callback("Ravi", "98765 43210", "door", "v1", "en-IN")["saved"]
    assert request_callback("Priya", "+91-98765-43211", "", "v2", "en-IN")["saved"]
    assert request_callback("Anu", "09876543212", "", "v3", "en-IN")["saved"]
    assert sorted(lead["phone"] for lead in store.load_leads()) == ["+919876543210", "+919876543211", "+919876543212"]


@pytest.mark.parametrize("name, phone", [("Ravi", "98765"), ("Ravi", "0422 2345678"), ("", "9876543210")])
def test_a_bad_name_or_number_is_refused(name, phone):
    assert "error" in request_callback(name, phone, "", "v1", "en-IN")


def test_names_and_numbers_stay_out_of_the_log():
    printed = io.StringIO()
    with redirect_stdout(printed):
        agent.run_tool("request_callback", '{"name": "Kumar", "phone": "9876543214"}', "v1", "ta-IN")
    assert "Kumar" not in printed.getvalue() and "9876543214" not in printed.getvalue()


def test_the_leads_page_is_off_without_a_password(client):
    assert client.get("/leads", auth=("team", "anything")).status_code == 404


def test_the_leads_page_and_spreadsheet_need_the_password(client, monkeypatch):
    monkeypatch.setenv("LEADS_PASSWORD", "test-password")
    request_callback("=HYPERLINK(\"x\")<b>", "9876543213", "<script>", "v1", "en-IN")
    assert client.get("/leads").status_code == 401
    page = client.get("/leads", auth=("team", "test-password"))
    assert page.status_code == 200 and "&lt;script&gt;" in page.text and "<script>" not in page.text
    sheet_file = client.get("/leads.csv", auth=("team", "test-password"))
    assert sheet_file.text.startswith("﻿") and "'=HYPERLINK" in sheet_file.text and "'+919876543213" in sheet_file.text


def test_wrong_passwords_lock_the_leads_page_for_the_day(client, monkeypatch):
    monkeypatch.setenv("LEADS_PASSWORD", "test-password")
    assert [client.get("/leads", auth=("team", f"guess{number}")).status_code for number in range(11)] == [401] * 10 + [429]
    assert client.get("/leads", auth=("team", "test-password")).status_code == 429


@pytest.mark.parametrize("value", ["=1+1", " =1+1", "\t=1+1", "\r@x", "+919876543210", "-5", "\x00=x"])
def test_risky_spreadsheet_values_become_plain_text(value):
    assert sheet.as_text(value).startswith("'")


def test_normal_text_is_unchanged():
    assert sheet.as_text("Ravi, sliding door 8x10") == "Ravi, sliding door 8x10"


@pytest.fixture
def google_sheet(monkeypatch):
    monkeypatch.setenv("LEADS_SHEET_URL", "https://script.google.com/macros/s/test/exec")
    monkeypatch.setenv("LEADS_SHEET_SECRET", "test-secret")
    state = {"fail": False, "posts": []}

    def post(url, json, timeout, follow_redirects):
        state["posts"].append(json)
        if state["fail"]:
            raise httpx.ConnectError("down")
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: {"ok": True})

    monkeypatch.setattr(httpx, "post", post)
    return state


def test_each_lead_reaches_the_sheet_with_a_unique_id(google_sheet):
    first = store.save_lead("v1", "=Ravi", "+919876543210", "door", "ta-IN")
    second = store.save_lead("v2", "Priya", "+919876543211", "window", "en-IN")
    assert first[1] != second[1]
    sheet.post_lead(first[0], first[1], "2026-11-11 10:00:00", "=Ravi", "+919876543210", "door", "ta-IN")
    sent = google_sheet["posts"][-1]
    assert sent["id"] == first[1] and sent["name"] == "'=Ravi" and sent["language"] == "Tamil"


def test_a_failed_copy_is_retried_once_and_not_repeated(google_sheet):
    google_sheet["fail"] = True
    lead_id, uid = store.save_lead("v1", "Ravi", "+919876543210", "door", "en-IN")
    with redirect_stdout(io.StringIO()):
        sheet.post_lead(lead_id, uid, "2026-11-11 10:00:00", "Ravi", "+919876543210", "door", "en-IN")
    connection = sqlite3.connect(store.DB_PATH)
    connection.execute("UPDATE leads SET created_at = datetime('now', '-10 minutes')")
    connection.commit()
    google_sheet["fail"] = False
    sheet.resend_unsent_leads()
    sheet.resend_unsent_leads()
    assert len(google_sheet["posts"]) == 2
    assert connection.execute("SELECT sheet_sent FROM leads").fetchone()[0] == 1


def test_leads_from_before_the_retry_feature_are_not_resent(google_sheet, tmp_path, monkeypatch):
    old_database = tmp_path / "old.db"
    connection = sqlite3.connect(old_database)
    connection.execute("CREATE TABLE leads (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT, name TEXT NOT NULL, phone TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', language TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
    connection.execute("INSERT INTO leads (name, phone, created_at) VALUES ('Old', '+919876543211', datetime('now', '-1 hour'))")
    connection.commit()
    monkeypatch.setattr(store, "DB_PATH", old_database)
    store.init_db()
    sheet.resend_unsent_leads()
    assert google_sheet["posts"] == []


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js isn't installed")
def test_the_google_script_skips_duplicates_and_wrong_secrets(tmp_path):
    harness = tmp_path / "sheet_test.js"
    harness.write_text(r"""
const fs = require("fs");
const rows = [];
const cell = (row, column) => ({
  getValue: () => (rows[row - 1] || [])[column - 1] ?? "",
  setValue: (value) => { while (rows.length < row) rows.push([]); rows[row - 1][column - 1] = value; },
});
const sheet = {
  getLastRow: () => rows.length,
  appendRow: (values) => rows.push([...values]),
  getRange: (row, column, numRows = 1) => ({
    ...cell(row, column),
    setValues: (values) => { rows[row - 1] = [...values[0]]; },
    createTextFinder: (text) => ({ matchEntireCell: () => ({ findNext: () => {
      const index = rows.slice(row - 1, row - 1 + numRows).findIndex((r) => r[column - 1] === text);
      return index < 0 ? null : { getRow: () => row + index };
    } }) }),
  }),
};
const SpreadsheetApp = { getActiveSpreadsheet: () => ({ getSheets: () => [sheet] }) };
const LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
const PropertiesService = { getScriptProperties: () => ({ getProperty: () => "secret" }) };
const ContentService = { MimeType: { JSON: "json" }, createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }) };
eval(fs.readFileSync(process.argv[2], "utf8"));
const send = (body) => doPost({ postData: { contents: JSON.stringify(body) } });
const lead = { secret: "secret", id: "abc123", when: "2026-11-11", name: "=Ravi", phone: "+919876543210", note: "door", language: "Tamil" };
const results = [send(lead), send(lead), send({ ...lead, name: "Kokki Kumar" }), send({ ...lead, id: "def456" }), send({ ...lead, secret: "wrong", id: "x" })];
console.log(JSON.stringify({ results, rows }));
""", encoding="utf-8")
    output = subprocess.run(["node", str(harness), str(PROJECT / "google_sheet_script.gs")], capture_output=True, text=True, check=True)
    outcome = json.loads(output.stdout)
    assert outcome["results"] == [{"ok": True}, {"ok": True, "updated": True}, {"ok": True, "updated": True}, {"ok": True}, {"ok": False}]
    assert len(outcome["rows"]) == 3
    assert outcome["rows"][1][1] == "Kokki Kumar"
    assert outcome["rows"][2][1] == "'=Ravi"


def test_lead_times_are_shown_in_indian_time():
    from alusea_ai_service.sheet import in_india
    assert in_india("2026-11-19 10:42:00") == "2026-11-19 16:12"
    assert in_india("2026-11-19 20:00:00") == "2026-11-20 01:30"  # The date moves on after 6:30 pm UTC.
    assert in_india("not a time") == "not a time"
