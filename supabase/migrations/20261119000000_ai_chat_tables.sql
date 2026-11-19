-- Tables for Sara, the AI sales assistant on alusea.in (services/ai).
-- They live in their own schema, "ai", owned by Sara's own login, "ai_service", which can't reach the public
-- schema (employees, payroll, invoices). The "ai" schema isn't exposed to the public API, so the anon key can't
-- read chats or customers' phone numbers.
--
-- This file never holds a password. The login is created without one, so nobody can sign in with it until it's
-- set once by hand in the SQL Editor:
--     ALTER ROLE ai_service PASSWORD 'a-long-random-password';
--
-- Sara's startup code (services/ai/src/alusea_ai_service/store.py) creates the same tables if they're missing,
-- so the two must stay the same: tests/test_migration.py checks that.

-- ============================================================
-- SARA'S LOGIN
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_service') THEN
        CREATE ROLE ai_service LOGIN;
    END IF;
END
$$;

-- On Supabase, "postgres" isn't a superuser, so it may only create things for ai_service while it's allowed to act
-- as ai_service. It keeps that permission, so the team can still manage Sara's tables from the dashboard (delete a
-- test lead, add a column in a later migration). This gives "postgres" nothing new: it could already grant itself
-- this, and ai_service still can't reach anything outside the "ai" schema.
GRANT ai_service TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;

-- ============================================================
-- SCHEMA
-- ============================================================
CREATE SCHEMA IF NOT EXISTS ai AUTHORIZATION ai_service;

-- Everything below is created as ai_service itself, so Sara owns her schema and tables from the start and nothing
-- has to change owner afterwards.
SET ROLE ai_service;

REVOKE ALL ON SCHEMA ai FROM PUBLIC, anon, authenticated;

-- ============================================================
-- CHAT HISTORY (deleted after 90 days by the daily cron)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai.messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    english TEXT,
    language TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_visitor_idx ON ai.messages (visitor_id, id);

-- ============================================================
-- DAILY USAGE LIMITS (only today's rows are kept)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai.limit_counts (
    period TEXT NOT NULL,
    kind TEXT NOT NULL,
    scope TEXT NOT NULL,
    key TEXT NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (period, kind, scope, key)
);

-- ============================================================
-- CALLBACK REQUESTS (also sent to the Google Sheet)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai.leads (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visitor_id TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    language TEXT,
    sheet_sent INTEGER NOT NULL DEFAULT 0,
    uid TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Back to the login running this file.
RESET ROLE;
