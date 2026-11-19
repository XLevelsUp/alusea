"""The Supabase migration and Sara's startup code both create the "ai" tables, so they must describe the same tables."""

import re
from pathlib import Path

from alusea_ai_service import store

ROOT = Path(__file__).resolve().parents[3]
MIGRATION = ROOT / "supabase" / "migrations" / "20261119000000_ai_chat_tables.sql"
STORE = Path(store.__file__)


def tables_in(sql: str, prefix: str) -> dict[str, list[str]]:
    """Each table's column lines, with spacing tidied, keyed by table name."""
    tables = {}
    for name, body in re.findall(rf"CREATE TABLE IF NOT EXISTS {re.escape(prefix)}(\w+) \((.*?)\n\s*\)", sql, re.DOTALL):
        tables[name] = [" ".join(line.split()).rstrip(",") for line in body.strip().splitlines()]
    return tables


def test_the_migration_matches_the_startup_code():
    code = STORE.read_text(encoding="utf-8")
    start = code.index("def create_postgres_tables")
    postgres_part = code[start : code.index("\ndef ", start + 1)]
    migration = tables_in(MIGRATION.read_text(encoding="utf-8"), "ai.")
    startup = tables_in(postgres_part, "{s}")
    assert set(migration) == {"messages", "limit_counts", "leads"}
    assert migration == startup


def test_the_schema_names_match():
    assert store.SCHEMA == "ai"
    assert "CREATE SCHEMA IF NOT EXISTS ai AUTHORIZATION ai_service" in MIGRATION.read_text(encoding="utf-8")


def test_the_migration_has_no_password():
    assert "PASSWORD" not in re.sub(r"--.*", "", MIGRATION.read_text(encoding="utf-8"))
