# Deployment

This repo contains three independently deployed services: two Next.js apps
and Sara, the Python AI sales agent, all on Vercel.

| App | Folder | Domain | Host | Purpose |
|---|---|---|---|---|
| Marketing | `apps/marketing` | `alusea.in` | Vercel | Public website |
| Admin | `apps/admin` | `admin.alusea.in` | Vercel | Internal CMS/admin panel |
| AI (Sara) | `services/ai` | `ai.alusea.in` | Vercel | AI sales agent: chat and voice calls |

Sara runs on Vercel as a Python function. Vercel doesn't keep files, so on
Vercel her chats, leads and daily limits are saved in the Supabase database
(schema `ai`, created automatically), and her two background jobs run from
a daily Vercel cron. Locally, without `DATABASE_URL`, she still uses `chat.db`.

## One-time setup

### 1. Marketing deployment (likely already exists)

- Vercel project → **Root Directory** set to `apps/marketing`
- Domain: `alusea.in` / `www.alusea.in`
- Environment variables (see `apps/marketing/.env.example` for the full list):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`, `WHATSAPP_PHONE_NUMBER_ID`,
  `WHATSAPP_RECIPIENT_NUMBER`, `WHATSAPP_ACCESS_TOKEN`,
  `WHATSAPP_TEMPLATE_NAME`, `INSTAGRAM_ACCESS_TOKEN`,
  `NEXT_PUBLIC_CLARITY_PROJECT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`

### 2. Admin deployment (new)

- Create a **new** Vercel project from the same GitHub repo
- Set its **Root Directory** to `apps/admin`
- Add a DNS record for `admin.alusea.in` pointing at this new project,
  then attach that domain to the project in Vercel
- Environment variables (see `apps/admin/.env.example`):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_MARKETING_URL` (set to `https://www.alusea.in` in production —
  this is what powers the "View live post" links in the blog admin)

Both apps share the same Supabase project/database — they are two frontends
for one backend, not two separate databases.

### 3. AI deployment (`ai.alusea.in`)

Create a **third Vercel project** from this repo:

- **Root Directory:** `services/ai`. Vercel finds `app.py` and the FastAPI
  app in it, installs `pyproject.toml`, and reads `vercel.json` (the daily
  cron and excluded files).
- **Ignored Build Step:** `git diff --quiet HEAD^ HEAD -- .`, so website
  changes don't redeploy Sara.
- **Custom domain:** add `ai.alusea.in` in the project's Domains settings and
  create the DNS record it shows. HTTPS is required for calls and the mic.
- **Environment variables** (see `services/ai/.env.example`):
  - `GROQ_API_KEY`, `GROQ_MODEL`, `ALUSEA_SUPABASE_URL`, `ALUSEA_ANON_KEY`,
    `SARVAM_API_KEY`, `LEADS_PASSWORD`, `LEADS_SHEET_URL`, `LEADS_SHEET_SECRET`
  - `DATABASE_URL`: Supabase → **Connect** → **Transaction pooler** (port
    6543) connection string, logging in as Sara's own limited user (below),
    not `postgres`.
  - `LIMIT_HASH_SECRET`: a long random value. Required with `DATABASE_URL`.
  - `CRON_SECRET`: a long random value. Vercel sends it to `/cron/daily`.
  - `COOKIE_SECURE=true`
  - Don't set `OPENROUTER_API_KEY` or `EXTRA_FRAME_ORIGINS` in production.

**Sara's own database login (do this once, before the first deploy).** The
`postgres` login from the Connect page can read and change every table,
including employees' Aadhaar numbers, payroll and invoices. Sara only needs her
own `ai` schema, so she gets a login that can reach nothing else.

The migration `supabase/migrations/20261119000000_ai_chat_tables.sql` creates
the `ai_service` login (without a password), the `ai` schema and its three
tables (`ai.messages`, `ai.limit_counts`, `ai.leads`), owned by `ai_service`.
Apply it with the other migrations (`supabase db push`), or paste it into the
SQL Editor. Then set the login's password once, by hand, in the SQL Editor:

```sql
ALTER ROLE ai_service PASSWORD 'a-long-random-password';
```

The password never goes in a migration file. Sara's startup code creates the
same tables if they're missing, so she also works without the migration; a test
checks the two describe the same tables. Build `DATABASE_URL` from the
Transaction pooler string, replacing the user with `ai_service.<project-ref>`
and the password with the one above.
She still reads products through the public API with `ALUSEA_ANON_KEY`.

To read Sara's data as a developer: Supabase → **Table Editor**, schema
dropdown → `ai`, or query `ai.messages` in the SQL Editor. Chats are kept
for 90 days; leads are kept until deleted. The `ai` schema isn't exposed to
the public API, so the website's anon key can't read it.

What's different on Vercel:

- The daily cron (`/cron/daily`, 03:00 IST) deletes chats older than
  `CHAT_RETENTION_DAYS` and resends leads the Google Sheet missed. On the
  Hobby plan crons run once a day, so a missed sheet copy can take up to a
  day; the leads page (`/leads`) always has every lead straight away.
- Voice clips are cached in `/tmp` per instance, so a few common phrases are
  voiced again more often than on a single server.
- Recordings are capped at 2 minutes (Vercel refuses uploads over 4.5 MB).
- Several instances can run at once. Limits are shared through the database;
  only the rare "skip a reply that a newer one overtook" check is per instance.

To test the database code against Supabase before going live:
`$env:TEST_DATABASE_URL="<pooler string>"; npm run test:ai`. It uses a
throwaway schema and deletes it afterwards.

`ALUSEA_SUPABASE_URL` / `ALUSEA_ANON_KEY` point at the same Supabase project
as the two apps, so a rotated anon key must be updated here too.

The `Dockerfile` still works for a host with a disk (Railway, Render), using
`chat.db` on a volume at `/data`, if Sara ever needs to move off Vercel.

## Ongoing: keeping secrets in sync

Because there are now three Vercel projects, any shared
credential (Supabase keys in particular) that gets rotated must be updated
in **all three** places' environment variable settings. There is no automatic sync between
them.

## Local development

```bash
npm install          # installs both apps' dependencies at once (npm workspaces)
npm run dev:marketing # runs the public site at http://localhost:3000
npm run dev:admin     # runs the admin panel at http://localhost:3001 (or next free port)
npm run dev:ai        # runs Sara at http://127.0.0.1:8000 (needs uv and services/ai/.env)
npm run test:ai       # runs Sara's tests
```

When running both locally, set `apps/admin/.env.local`'s
`NEXT_PUBLIC_MARKETING_URL` to `http://localhost:3000` so the admin's
"View live post" links open your local marketing site instead of production.

## Database migrations

Schema changes are tracked as ordered migration files in
`supabase/migrations/` and applied with the Supabase CLI:

```bash
npx supabase link --project-ref <your-project-ref>   # once
npm run db:push
```

Both apps share one Supabase project, so a migration affects both. See
[database.md](./database.md) for the full workflow, including how to
regenerate the TypeScript types after a schema change.

The old hand-run `.sql` files now live in `supabase/legacy/` for reference
and should not be run.
