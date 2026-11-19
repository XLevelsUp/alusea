import os
import sqlite3
import threading
import uuid
from collections.abc import Iterator
from contextlib import closing, contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

# On Vercel, only /tmp can be written to, and it's wiped. There, chats and leads go to Postgres (DATABASE_URL),
# and /tmp only holds the voice cache.
ON_VERCEL = bool(os.getenv("VERCEL"))
# Where the local database and saved audio live. On a server with a disk, set DATA_DIR to a folder that is backed up.
DATA_DIR = Path(os.getenv("DATA_DIR") or ("/tmp/alusea-ai" if ON_VERCEL else Path(__file__).resolve().parents[2]))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "chat.db"
# A Postgres connection string, such as Supabase's transaction pooler. Without it, the local SQLite file is used.
DATABASE_URL = os.getenv("DATABASE_URL", "")
# Sara's tables in Postgres are kept in their own schema, which Supabase doesn't share through its public API.
SCHEMA = "sara"
# A copy to the Google Sheet is tried again for this long, then left to the leads page.
SHEET_RETRY_DAYS = 7
SHEET_RETRY_AFTER_MINUTES = 2

pool = None
pool_lock = threading.Lock()


class Database:
    """One connection, written for both SQLite and Postgres. Queries use ? for values and {s} before table names."""

    def __init__(self, connection, postgres: bool):
        self.connection = connection
        self.postgres = postgres

    def run(self, query: str, values: tuple = ()):
        query = query.replace("{s}", f"{SCHEMA}." if self.postgres else "")
        if self.postgres:
            query = query.replace("?", "%s")
        return self.connection.execute(query, values)

    def ago(self, **amount: float):
        """A moment in the past, in the form this database compares with its saved times."""
        moment = datetime.now(timezone.utc) - timedelta(**amount)
        return moment if self.postgres else moment.strftime("%Y-%m-%d %H:%M:%S")


def postgres_pool():
    """Connections are kept open between requests. Prepared statements are off, as the transaction pooler can't keep them."""
    global pool
    with pool_lock:
        if pool is None:
            from psycopg.rows import dict_row
            from psycopg_pool import ConnectionPool

            pool = ConnectionPool(
                DATABASE_URL,
                min_size=1,
                max_size=5,
                max_idle=60,
                kwargs={"prepare_threshold": None, "row_factory": dict_row, "connect_timeout": 10},
                check=ConnectionPool.check_connection,
                open=True,
            )
    return pool


@contextmanager
def database() -> Iterator[Database]:
    """Changes are saved together at the end, or all undone if anything fails."""
    if DATABASE_URL:
        with postgres_pool().connection() as connection:
            yield Database(connection, postgres=True)
    else:
        with closing(sqlite3.connect(DB_PATH)) as connection, connection:
            connection.row_factory = sqlite3.Row
            yield Database(connection, postgres=False)


def plain_row(row) -> dict:
    """A row as a dict, with its time written the same way for both databases, in UTC."""
    row = dict(row)
    if isinstance(row.get("created_at"), datetime):
        row["created_at"] = row["created_at"].astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    return row


def database_ok() -> None:
    """Run the simplest query, so a broken or missing database raises an error."""
    with database() as db:
        db.run("SELECT 1 FROM {s}messages LIMIT 1").fetchall()


def init_db() -> None:
    """Create the tables the first time the service runs."""
    with database() as db:
        if db.postgres:
            create_postgres_tables(db)
        else:
            create_sqlite_tables(db.connection)


def create_postgres_tables(db: Database) -> None:
    # Several copies of Sara can start at once, so one makes the tables while the others wait.
    db.run("SELECT pg_advisory_xact_lock(hashtext('sara-tables'))")
    # On the live site the schema is made once by hand and owned by Sara's limited login, which may not create
    # schemas. Postgres checks that permission even with IF NOT EXISTS, so the schema is only created when missing.
    if not db.run("SELECT 1 FROM pg_namespace WHERE nspname = ?", (SCHEMA,)).fetchone():
        db.run(f"CREATE SCHEMA {SCHEMA}")
    db.run(
        """
        CREATE TABLE IF NOT EXISTS {s}messages (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            visitor_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            english TEXT,
            language TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    db.run("CREATE INDEX IF NOT EXISTS messages_visitor_idx ON {s}messages (visitor_id, id)")
    db.run(
        """
        CREATE TABLE IF NOT EXISTS {s}limit_counts (
            period TEXT NOT NULL,
            kind TEXT NOT NULL,
            scope TEXT NOT NULL,
            key TEXT NOT NULL,
            count INTEGER NOT NULL,
            PRIMARY KEY (period, kind, scope, key)
        )
        """
    )
    db.run(
        """
        CREATE TABLE IF NOT EXISTS {s}leads (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            visitor_id TEXT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            language TEXT,
            sheet_sent INTEGER NOT NULL DEFAULT 0,
            uid TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )


def create_sqlite_tables(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.execute("CREATE INDEX IF NOT EXISTS messages_visitor_idx ON messages (visitor_id, id)")
    # Databases made before replies were translated don't have this column yet.
    columns = [row["name"] for row in connection.execute("PRAGMA table_info(messages)")]
    if "english" not in columns:
        connection.execute("ALTER TABLE messages ADD COLUMN english TEXT")
    if "language" not in columns:
        connection.execute("ALTER TABLE messages ADD COLUMN language TEXT")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS limit_counts (
            period TEXT NOT NULL,
            kind TEXT NOT NULL,
            scope TEXT NOT NULL,
            key TEXT NOT NULL,
            count INTEGER NOT NULL,
            PRIMARY KEY (period, kind, scope, key)
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            language TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    # Leads saved before this column existed had already gone to the sheet, so they count as sent.
    lead_columns = [row["name"] for row in connection.execute("PRAGMA table_info(leads)")]
    if "sheet_sent" not in lead_columns:
        connection.execute("ALTER TABLE leads ADD COLUMN sheet_sent INTEGER NOT NULL DEFAULT 1")
    # A unique id the Google Sheet uses to skip a lead it already has. Lead numbers start again in a new database, so they can't do this.
    if "uid" not in lead_columns:
        connection.execute("ALTER TABLE leads ADD COLUMN uid TEXT")


def count_of(db: Database, period: str, kind: str, scope: str, key: str) -> int:
    row = db.run(
        "SELECT count FROM {s}limit_counts WHERE period = ? AND kind = ? AND scope = ? AND key = ?",
        (period, kind, scope, key),
    ).fetchone()
    return row["count"] if row else 0


def limit_reached(counters: list[tuple[str, str, str, str, int]]) -> bool:
    """Say whether any counter has reached its limit, without counting a use."""
    with database() as db:
        return any(count_of(db, *counter[:4]) >= counter[4] for counter in counters)


def take_allowance(counters: list[tuple[str, str, str, str, int]], today: str) -> bool:
    """Add one to every counter, or to none of them if any has reached its limit. Earlier days are cleared."""
    with database() as db:
        # Only one check at a time, so two requests can't both take the last use.
        if db.postgres:
            db.run("SELECT pg_advisory_xact_lock(hashtext('sara-limits'))")
        else:
            db.run("BEGIN IMMEDIATE")
        db.run("DELETE FROM {s}limit_counts WHERE period < ?", (today,))
        if any(count_of(db, *counter[:4]) >= counter[4] for counter in counters):
            return False
        for counter in counters:
            db.run(
                """
                INSERT INTO {s}limit_counts AS counter (period, kind, scope, key, count) VALUES (?, ?, ?, ?, 1)
                ON CONFLICT (period, kind, scope, key) DO UPDATE SET count = counter.count + 1
                """,
                counter[:4],
            )
    return True


def return_allowance(counters: list[tuple[str, str, str, str, int]]) -> None:
    """Take one back from every counter, after a request that failed."""
    with database() as db:
        for counter in counters:
            db.run(
                """
                UPDATE {s}limit_counts SET count = CASE WHEN count > 0 THEN count - 1 ELSE 0 END
                WHERE period = ? AND kind = ? AND scope = ? AND key = ?
                """,
                counter[:4],
            )


def delete_old_messages(days: int) -> int:
    """Remove chat messages older than this many days, and say how many went. Leads are kept for the team."""
    with database() as db:
        return db.run("DELETE FROM {s}messages WHERE created_at < ?", (db.ago(days=days),)).rowcount


def save_lead(visitor_id: str | None, name: str, phone: str, note: str, language: str) -> tuple[int, str]:
    """Save a customer's callback request for the sales team, and return its number and unique id."""
    uid = uuid.uuid4().hex
    with database() as db:
        row = db.run(
            "INSERT INTO {s}leads (visitor_id, name, phone, note, language, sheet_sent, uid) VALUES (?, ?, ?, ?, ?, 0, ?) RETURNING id",
            (visitor_id, name, phone, note, language, uid),
        ).fetchone()
    return row["id"], uid


def recent_lead(visitor_id: str, minutes: int) -> tuple[int, str] | None:
    """Return the number and unique id of this visitor's lead from the last few minutes, if there is one."""
    with database() as db:
        row = db.run(
            "SELECT id, uid FROM {s}leads WHERE visitor_id = ? AND created_at > ? ORDER BY id DESC LIMIT 1",
            (visitor_id, db.ago(minutes=minutes)),
        ).fetchone()
    return (row["id"], row["uid"] or f"lead-{row['id']}") if row else None


def update_lead(lead_id: int, name: str, phone: str, note: str) -> None:
    """Correct a lead, and send it to the Google Sheet again so the sheet is corrected too."""
    with database() as db:
        db.run("UPDATE {s}leads SET name = ?, phone = ?, note = ?, sheet_sent = 0 WHERE id = ?", (name, phone, note, lead_id))


def mark_sheet_sent(lead_id: int) -> None:
    with database() as db:
        db.run("UPDATE {s}leads SET sheet_sent = 1 WHERE id = ?", (lead_id,))


def unsent_leads() -> list[dict]:
    """Recent leads the Google Sheet hasn't received. The newest are left alone, as they may still be on their way."""
    with database() as db:
        rows = db.run(
            """
            SELECT id, uid, created_at, name, phone, note, language FROM {s}leads
            WHERE sheet_sent = 0 AND created_at > ? AND created_at < ?
            ORDER BY id
            """,
            (db.ago(days=SHEET_RETRY_DAYS), db.ago(minutes=SHEET_RETRY_AFTER_MINUTES)),
        ).fetchall()
    return [plain_row(row) for row in rows]


def load_leads() -> list[dict]:
    """Return every callback request, newest first. Times are in UTC."""
    with database() as db:
        rows = db.run("SELECT created_at, name, phone, note, language FROM {s}leads ORDER BY id DESC").fetchall()
    return [plain_row(row) for row in rows]


def load_messages(visitor_id: str, limit: int = 50) -> list[dict]:
    """Return a visitor's most recent messages as they saw them, oldest first."""
    with database() as db:
        rows = db.run(
            "SELECT role, content FROM {s}messages WHERE visitor_id = ? ORDER BY id DESC LIMIT ?",
            (visitor_id, limit),
        ).fetchall()
    return [dict(row) for row in reversed(rows)]


def load_for_model(visitor_id: str, limit: int) -> list[dict]:
    """Return recent messages for the AI, using the English it wrote instead of the translation."""
    with database() as db:
        rows = db.run(
            "SELECT role, COALESCE(english, content) AS content FROM {s}messages WHERE visitor_id = ? ORDER BY id DESC LIMIT ?",
            (visitor_id, limit),
        ).fetchall()
    return [dict(row) for row in reversed(rows)]


def last_language(visitor_id: str) -> str | None:
    """Return the language of the visitor's last typed message, so a short reply can stay in it."""
    with database() as db:
        row = db.run(
            "SELECT language FROM {s}messages WHERE visitor_id = ? AND role = 'user' ORDER BY id DESC LIMIT 1",
            (visitor_id,),
        ).fetchone()
    return row["language"] if row else None


def save_exchange(
    visitor_id: str,
    question: str,
    answer: str,
    english: str | None = None,
    question_english: str | None = None,
    language: str | None = None,
) -> None:
    """Save a question and its answer together, so one is never saved without the other."""
    with database() as db:
        for row in [(visitor_id, "user", question, question_english, language), (visitor_id, "assistant", answer, english, None)]:
            db.run("INSERT INTO {s}messages (visitor_id, role, content, english, language) VALUES (?, ?, ?, ?, ?)", row)


def delete_messages(visitor_id: str) -> None:
    """Remove a visitor's chat when they start a new one."""
    with database() as db:
        db.run("DELETE FROM {s}messages WHERE visitor_id = ?", (visitor_id,))
