# AGENTS.md: Sara (services/ai)

Instructions for AI coding agents (Claude Code, Codex, Cursor and others) and developers working on Sara, Alusea's AI
sales assistant. Read this before changing anything in `services/ai`. Customer-facing behaviour is described in
`README.md`; deployment is in `../../docs/deployment.md`.

## What Sara is

A FastAPI service that helps customers choose Alusea's aluminium doors and windows, by typed chat or voice call, in
English, Tamil, Malayalam, Telugu and Kannada. She shows real products and starting prices from the Alusea catalogue
(Supabase), works out estimates, and takes callback requests for the sales team.

- Live at `ai.alusea.in` as its own Vercel project (Root Directory `services/ai`).
- Shown on alusea.in as an iframe panel: `apps/marketing/src/components/ui/SaraChat.tsx` loads `${NEXT_PUBLIC_AI_URL}/?embed=1`.
- Python 3.13, managed with `uv`. It is **not** part of the npm workspaces.

## Commands

Run from `services/ai` unless noted.

| Task | Command |
|---|---|
| Install | `uv sync` |
| Run locally | `uv run uvicorn alusea_ai_service.main:app --reload` (or `npm run dev:ai` from the repo root) |
| Run with the website | Repo root: `npm run dev:ai` and `npm run dev:marketing`, then open http://localhost:3000 |
| Tests | `uv run pytest` (must pass before every commit; CI runs them on every push touching `services/ai`) |
| One test file | `uv run pytest tests/test_language_and_store.py -q` |
| Check the lock file | `uv lock --check` |

`check_bot.py` asks the **real** AI questions and spends Groq tokens. Don't run it unless asked.

## Layout

```
app.py                    Vercel entry point (imports main.app)
vercel.json               Daily cron (/cron/daily) and files left out of the bundle
google_sheet_script.gs    Apps Script that receives leads in the Google Sheet (deployed by hand)
src/alusea_ai_service/
  main.py                 Routes, limits, security headers, /leads page, cron
  agent.py                Groq requests, tool calls, backup model, reply clean-up
  prompt.py               Sara's instructions for chat and calls, language_rule()
  tools.py                Catalogue lookups, prices, estimates, budgets, callbacks
  cards.py                [product:…] / [estimate:…] / [budget:…] markers → product cards
  translation.py          Sarvam translation and typed-language detection
  voice.py                Sarvam speech-to-text, spoken-language detection, text-to-speech
  call.py                 Voice call turns, ready-made spoken lines, noise detection
  small_talk.py           Greetings and fixed replies (e.g. uPVC vs aluminium) that need no AI
  store.py                Database: SQLite locally, Postgres (Supabase) when DATABASE_URL is set
  limits.py, meter.py     Daily limits; per-call cost meter
  sheet.py                Sends leads to the Google Sheet; IST times
  static/index.html       The whole customer page: chat, calls, mic, labels in 5 languages
tests/                    pytest; conftest.py fakes every outside service
```

The Supabase migration for Sara's tables is at `../../supabase/migrations/20261119000000_ai_chat_tables.sql`.

## Rules that must not be broken

1. **The AI never sees or states prices.** Prices and estimates are worked out in `tools.py` from the catalogue, and
   reach the customer through markers that `cards.py` turns into cards. Never add prices to the prompt, and never
   let model text be the source of a rupee amount.
2. **The AI writes English only.** Sarvam translates replies into the customer's language (`translation.py`).
   `language_rule()` tells the AI which language the customer reads; it must never tell the customer it is using
   English.
3. **Tests never touch real services.** `tests/conftest.py` sets fake settings (`example.supabase.co`, `test-key`)
   before Sara is imported and blocks the network. New tests must fake Groq, Sarvam, Supabase and the Google Sheet.
   Never point tests at the live database.
4. **The migration and `store.py` must describe the same tables.** Sara creates her tables at startup if they're
   missing (`create_postgres_tables`), and the migration creates them on Supabase. If you change a table, change
   both, and add an `ALTER TABLE` for existing databases. `tests/test_migration.py` checks they match.
5. **Sara's tables live in the `ai` schema**, owned by the limited login `ai_service`, which can't reach `public`
   (employees, payroll, invoices). Never move them to `public`, and never make Sara connect as `postgres`.
6. **Keys go through `keys.py`.** Groq, Sarvam and Gemini can each have several keys (`GROQ_API_KEYS=k1,k2`), used
   in order. A key at its limit (429) rests, one out of Sarvam credit (402) rests an hour, a refused one (401/403) is
   left out until restart. Groq rests are per model. Call providers through `post_with_keys` or `groq_client`, never
   with a key read straight from the environment, and log keys by number only.
7. **No secrets in Git.** `.env`, `chat.db`, `limits.secret` and `voice_cache/` stay local. Only `.env.example` is
   committed, with empty values. Never print keys, `DATABASE_URL` or customers' phone numbers in logs.

## How the main parts work

### A typed message (`POST /chat`)
1. `require_allowance` takes one use from the daily limits (one database trip).
2. Fixed replies come first: `comparison()` (uPVC vs aluminium), then `small_talk()`. These need no AI.
3. The language is found (see below) and the history is loaded. The message goes to the AI as typed, not translated.
4. `agent.generate_reply` asks Groq, which may call tools; markers in the reply become cards.
5. The reply is translated back, and the question and answer are saved together in one statement.

### Typed-language detection (`translation.language_in_letters`)
1. Indian script letters decide straight away (`agent.reply_language`).
2. Everyday words typed in English letters (`ROMAN_WORDS`: Tanglish, Manglish, Tenglish, Kanglish) decide next.
   If the visitor chose an Indian language in the menu, the menu wins. A word on one list must never be on another
   (a test checks this), so leave out words the languages share.
3. Sizes (`MEASUREMENT`) and place or brand names (`NAMES`) are removed. If fewer than 4 real words remain, the
   chat keeps its language. This stops a name like "Logesh" switching the chat.
4. Otherwise Sarvam's `text-lid` decides, and the menu still wins over a different Indian language.

Voice calls use Sarvam speech-to-text's own language detection instead (`voice.py`).

### Voice calls
- Speech-to-text: Sarvam `saaras:v4` with `KEY_TERMS` (English words, sent for **every** language) plus
  `LANGUAGE_KEY_TERMS[language]` (extra words in that language's script; English has none).
- Text-to-speech: Gemini (`GEMINI_TTS_MODEL`, default `gemini-3.1-flash-tts-preview`, voice `GEMINI_TTS_VOICE`, default
  `Kore`) when `GEMINI_API_KEY` is set. Sarvam `bulbul:v3`, speaker `ritu`, takes over when Gemini has no key or fails,
  and for 60 seconds after Gemini's limit is hit. Each is one voice for all five languages.
- "Thinking" fillers are shown **on screen only**, in the call's language (`callFillers` in `index.html`); they are
  never spoken.
- `call.is_noise()` ignores turns with no real words, but keeps short answers such as "hmm" and "ok".
- `call.is_goodbye()` spots "bye" in any of the five languages. Sara then says a short goodbye, the reply carries
  `end_call`, and the page hangs up once it has been spoken.
- A pause of `CALL_PAUSE_MS` ends a turn. If the customer carries on before the answer comes back, the page sends all
  their unanswered speech again with `continues=1`, so a long sentence gets one answer. `call.SpokenTurn` then skips
  the older turn, or deletes its answer if it was already saved, so the AI never keeps half a question.

### Database (`store.py`)
- Queries use `?` for values and `{s}` before table names; `Database.run` converts them for Postgres (`%s`, `ai.`).
- Supabase is in Sydney, so every trip costs about 0.15 s from Vercel's Mumbai region (more from a laptop). Keep
  each operation to **one trip**: connections run in autocommit, multi-row work goes in one statement, and the
  daily-limit check is a single request. Use `database(transaction=True)` only when statements must succeed or fail
  together.
- Chats are deleted after 90 days by `/cron/daily`; leads are kept. Times are stored in UTC and shown in IST.

## Coding style

- Write comments and docstrings in plain English that say **why**, not what. Match the existing tone.
- Keep functions small and named for what they do (`language_from_words`, `take_allowance`).
- Use type hints. Don't add dependencies unless there's no simple way without them; update `uv.lock` if you do.
- Customer-visible text exists in 5 languages. When you add or change a label or fixed reply, update all of them
  (`LABELS` in `index.html`, `COMPARISON` in `small_talk.py`, and so on), and say in your summary that a native
  speaker should check the translations.
- Every behaviour change gets a test. Run the full suite before you finish.

## Before you finish a change

- [ ] `uv run pytest` passes.
- [ ] If tables changed: the migration, `store.py` and an `ALTER TABLE` for existing data are all updated.
- [ ] If customer text changed: all 5 languages are updated.
- [ ] No secrets, `.env` values or real customer data in the diff.
- [ ] Commit or push only when the user asks.
