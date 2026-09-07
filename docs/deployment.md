# Deployment

This repo contains two independent Next.js apps that must be deployed
separately, as two different Vercel projects pointing at two different
domains.

| App | Folder | Domain | Purpose |
|---|---|---|---|
| Marketing | `apps/marketing` | `alusea.in` | Public website |
| Admin | `apps/admin` | `admin.alusea.in` | Internal CMS/admin panel |

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

## Ongoing: keeping secrets in sync

Because there are now two Vercel projects, any shared credential
(Supabase keys in particular) that gets rotated must be updated in **both**
projects' environment variable settings. There is no automatic sync between
them.

## Local development

```bash
npm install          # installs both apps' dependencies at once (npm workspaces)
npm run dev:marketing # runs the public site at http://localhost:3000
npm run dev:admin     # runs the admin panel at http://localhost:3001 (or next free port)
```

When running both locally, set `apps/admin/.env.local`'s
`NEXT_PUBLIC_MARKETING_URL` to `http://localhost:3000` so the admin's
"View live post" links open your local marketing site instead of production.

## Database migrations

SQL migration files live in `supabase/` at the repo root and are run
manually against the Supabase project via its SQL Editor — there is no
automated migration runner. Run them in the order they were created.
