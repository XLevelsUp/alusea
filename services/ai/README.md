# Sara — Alusea's AI sales agent

Sara helps customers choose Alusea's aluminium doors and windows. Customers can type or talk to her on a voice call in English, Tamil, Malayalam, Telugu or Kannada. She shows real products and starting prices from the Alusea catalogue, works out estimates, and takes callback requests for the sales team.

## How it works

- **The page** (`src/alusea_ai_service/static/index.html`) is what customers see: chat, voice calls, the mic button and Listen.
- **The service** is a FastAPI app (`main.py`). It checks limits, then answers.
- **The AI** (Groq: Qwen, then `gpt-oss-120b` as a backup) only writes simple English and decides what to look up. It never sees prices.
- **The catalogue** comes from Alusea's Supabase. Prices and estimates are worked out by code.
- **Sarvam** writes down speech, translates replies, and speaks them in one voice (Kavitha).
- **SQLite** (`chat.db`) stores chats, leads and daily limit counts. Leads are also copied to a Google Sheet.

| File | What it does |
|---|---|
| `main.py` | Web routes, limits, leads page, security headers |
| `agent.py` | AI requests, tools and backup models |
| `prompt.py` | Sara's instructions for chat and calls |
| `call.py` | Voice call turns and ready-made spoken lines |
| `voice.py` | Hearing, language detection and Sara's voice |
| `translation.py` | Translation and the Tanglish language check |
| `tools.py`, `cards.py` | Catalogue lookups, estimates, budgets, cards and callback requests |
| `store.py` | The database |
| `limits.py`, `meter.py` | Daily limits and the per-call cost meter |
| `sheet.py`, `google_sheet_script.gs` | The Google Sheet copy of each lead |

## Running it on your computer

You need [uv](https://docs.astral.sh/uv/) and Python 3.13.

1. Copy `.env.example` to `.env` and fill in the keys. Never commit `.env`.
2. Start Sara from this folder:

   ```bash
   uv run uvicorn alusea_ai_service.main:app --reload
   ```

3. Open http://127.0.0.1:8000.

Calls and the mic need HTTPS on phones. To test on a phone, run `cloudflared tunnel --url http://127.0.0.1:8000` and open the `https://….trycloudflare.com` address it prints. Anyone with that link uses your credit, so stop it when you're done.

## Settings

All settings go in `.env`. See `.env.example` for the full list.

| Setting | Needed | What it does |
|---|---|---|
| `GROQ_API_KEY`, `GROQ_MODEL` | Yes | The AI. `GROQ_MODEL` is `qwen/qwen3.8-27b` |
| `ALUSEA_SUPABASE_URL`, `ALUSEA_ANON_KEY` | Yes | The product catalogue |
| `SARVAM_API_KEY` | Yes | Hearing, translation and voice |
| `LEADS_PASSWORD` | For the leads page | Turns on `/leads`. Without it, the page is off |
| `LEADS_SHEET_URL`, `LEADS_SHEET_SECRET` | For the Google Sheet | The Apps Script web app address and its secret code |
| `COOKIE_SECURE` | Live site | `true` on HTTPS. Leave it off for local testing |
| `DATA_DIR` | Live site | A backed-up folder for `chat.db`, voice clips and `limits.secret`. Created if missing |
| `HOST`, `PORT`, `FORWARDED_ALLOW_IPS` | Live site | Used by the start command below |
| `CHAT_RETENTION_DAYS` | No | Days to keep chats. Default 90. Leads are kept |
| `MAX_VOICE_CACHE_MB` | No | Size limit for saved voice clips. Default 500 |
| `LIMIT_<USE>_<VISITOR\|IP\|SITE>` | No | Changes a daily limit, such as `LIMIT_CALL_VISITOR=5` |
| `OPENROUTER_API_KEY` | No | A free last-resort backup model, for testing only. Leave it out for real customers |

### Daily limits

| Use | Each visitor | Each IP address | Whole site |
|---|---|---|---|
| Calls (5 minutes each) | 3 | 6 | 10 |
| Turns inside calls | 90 | 180 | 300 |
| Typed messages (also 10 a minute) | 30 | 60 | 200 |
| Listen plays | 10 | 20 | 50 |
| Mic button | 20 | 40 | 100 |
| Call me back, or sending a number | 5 | 10 | 50 |
| Wrong passwords on the leads page | — | 10 | 50 |

## Tests

```bash
uv run pytest
```

The tests use fake settings, a temporary database and fake services, and block the network, so they're free and never touch real customers. GitHub runs them on every upload (see the Actions tab).

`check_bot.py` is different: it asks the real AI a few questions, so it uses Groq tokens. Run it only when you mean to.

## Going live

- Run **one process** only. Call turns are kept in order within one process, and the limit counts and database are on one machine.
- Put a web server such as Caddy or nginx in front for HTTPS, and start Sara with:

  ```bash
  uv run alusea-ai-service
  ```

  This reads `HOST`, `PORT` and `FORWARDED_ALLOW_IPS`, and trusts the visitor addresses the web server passes on, so limits work per visitor.
- Set `COOKIE_SECURE=true`, set `DATA_DIR` to a backed-up folder, and remove `OPENROUTER_API_KEY`.
- Limit upload size at the web server too, to about 6 MB.
- Point an uptime monitor at `/health`. It checks the database and uses no paid services.
- Back up `DATA_DIR` every day. It holds chats, leads and the key used for limit counts.

### Google Sheet

1. In the sheet, open **Extensions → Apps Script** and paste `google_sheet_script.gs`.
2. Under **Project Settings → Script properties**, add `SECRET` with your secret code.
3. **Deploy → New deployment → Web app**, with **Execute as: Me** and **Who has access: Anyone**. Copy the web app address.
4. Put the address and secret code in `.env` as `LEADS_SHEET_URL` and `LEADS_SHEET_SECRET`.

When the script changes, paste it again and use **Deploy → Manage deployments → Edit → New version**, so the address stays the same. Updating the file here doesn't change the deployed script.

## When something goes wrong

| What you see | Likely cause | What to do |
|---|---|---|
| Customers get "Sorry" replies, and the log says `Groq couldn't answer` or `rate limit` | Groq is busy, slow or out of free tokens | Wait, or move to a paid Groq plan |
| Calls have no sound, and the log says `Voice failed` | Sarvam is slow or out of credit | Check Sarvam credit, and turn on its low-credit alerts |
| Speech isn't written down, and the log says `Speech to text failed` | Sarvam is down or out of credit | As above |
| `The Google Sheet refused the lead` | `LEADS_SHEET_SECRET` doesn't match the script's `SECRET` | Make them the same |
| `couldn't be copied to the Google Sheet yet` | Google was unreachable | Nothing. It retries every 15 minutes for 7 days, and the lead is on `/leads` |
| `Limit reached` | A visitor or the site hit a daily limit | Raise it with a `LIMIT_…` setting if needed |
| `/health` returns 503 | The database can't be read | Check `DATA_DIR` exists and has space |

Each call turn prints a `Call meter` line with its cost in listening, translation and voice, to help find what makes calls expensive.
