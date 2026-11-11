import sqlite3
from contextlib import closing
from pathlib import Path

# Keeps the database in the top project folder, wherever the service is started from.
DB_PATH = Path(__file__).resolve().parents[2] / "chat.db"


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    """Create the table the first time the service runs."""
    with closing(connect()) as connection, connection:
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
        connection.execute(
            "CREATE INDEX IF NOT EXISTS messages_visitor_idx ON messages (visitor_id, id)"
        )
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


def take_allowance(counters: list[tuple[str, str, str, str, int]], today: str) -> bool:
    """Add one to every counter, or to none of them if any has reached its limit. Earlier days are cleared."""
    with closing(connect()) as connection, connection:
        connection.execute("BEGIN IMMEDIATE")
        connection.execute("DELETE FROM limit_counts WHERE period < ?", (today,))
        for period, kind, scope, key, limit in counters:
            row = connection.execute(
                "SELECT count FROM limit_counts WHERE period = ? AND kind = ? AND scope = ? AND key = ?",
                (period, kind, scope, key),
            ).fetchone()
            if (row["count"] if row else 0) >= limit:
                return False
        connection.executemany(
            """
            INSERT INTO limit_counts (period, kind, scope, key, count) VALUES (?, ?, ?, ?, 1)
            ON CONFLICT (period, kind, scope, key) DO UPDATE SET count = count + 1
            """,
            [counter[:4] for counter in counters],
        )
    return True


def return_allowance(counters: list[tuple[str, str, str, str, int]]) -> None:
    """Take one back from every counter, after a request that failed."""
    with closing(connect()) as connection, connection:
        connection.executemany(
            "UPDATE limit_counts SET count = MAX(count - 1, 0) WHERE period = ? AND kind = ? AND scope = ? AND key = ?",
            [counter[:4] for counter in counters],
        )


def delete_old_messages(days: int) -> int:
    """Remove chat messages older than this many days, and say how many went. Leads are kept for the team."""
    with closing(connect()) as connection, connection:
        return connection.execute("DELETE FROM messages WHERE created_at < datetime('now', ?)", (f"-{days} days",)).rowcount


def save_lead(visitor_id: str | None, name: str, phone: str, note: str, language: str) -> None:
    """Save a customer's callback request for the sales team."""
    with closing(connect()) as connection, connection:
        connection.execute(
            "INSERT INTO leads (visitor_id, name, phone, note, language) VALUES (?, ?, ?, ?, ?)",
            (visitor_id, name, phone, note, language),
        )


def load_leads() -> list[dict]:
    """Return every callback request, newest first. Times are in UTC."""
    with closing(connect()) as connection:
        rows = connection.execute("SELECT created_at, name, phone, note, language FROM leads ORDER BY id DESC").fetchall()
    return [dict(row) for row in rows]


def load_messages(visitor_id: str, limit: int = 50) -> list[dict]:
    """Return a visitor's most recent messages as they saw them, oldest first."""
    with closing(connect()) as connection:
        rows = connection.execute(
            "SELECT role, content FROM messages WHERE visitor_id = ? ORDER BY id DESC LIMIT ?",
            (visitor_id, limit),
        ).fetchall()
    return [dict(row) for row in reversed(rows)]


def load_for_model(visitor_id: str, limit: int) -> list[dict]:
    """Return recent messages for the AI, using the English it wrote instead of the translation."""
    with closing(connect()) as connection:
        rows = connection.execute(
            "SELECT role, COALESCE(english, content) AS content FROM messages WHERE visitor_id = ? ORDER BY id DESC LIMIT ?",
            (visitor_id, limit),
        ).fetchall()
    return [dict(row) for row in reversed(rows)]


def last_language(visitor_id: str) -> str | None:
    """Return the language of the visitor's last typed message, so a short reply can stay in it."""
    with closing(connect()) as connection:
        row = connection.execute(
            "SELECT language FROM messages WHERE visitor_id = ? AND role = 'user' ORDER BY id DESC LIMIT 1",
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
    with closing(connect()) as connection, connection:
        connection.executemany(
            "INSERT INTO messages (visitor_id, role, content, english, language) VALUES (?, ?, ?, ?, ?)",
            [(visitor_id, "user", question, question_english, language), (visitor_id, "assistant", answer, english, None)],
        )


def delete_messages(visitor_id: str) -> None:
    """Remove a visitor's chat when they start a new one."""
    with closing(connect()) as connection, connection:
        connection.execute("DELETE FROM messages WHERE visitor_id = ?", (visitor_id,))