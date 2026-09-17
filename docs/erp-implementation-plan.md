# Alusea Internal ERP — Implementation Plan

Turning `admin.alusea.in` from a content CMS into an internal ERP covering
**Invoicing**, **Expense Tracking**, and **Automated Payroll**.

This document is the working plan. It is written to be executed phase by
phase, with each phase shippable on its own.

---

## 1. Where we are today

`apps/admin` is a Next.js 16 App Router app on Supabase, deployed to
`admin.alusea.in` as its own Vercel project. It shares one Supabase project
with the public marketing site.

What exists:

| Piece | Detail |
|---|---|
| Auth | Supabase email/password. `proxy.ts` refreshes the session; each page re-checks `getUser()` and redirects to `/login` |
| Data access | Server Components read directly via `@/lib/supabase/server`; writes go through `'use server'` actions in `actions.ts` files |
| Authorisation | **None beyond "is logged in"** — every authenticated user can do everything |
| RLS | Public `SELECT`, `authenticated` for write, on every table |
| Storage | One public bucket, `alusea-assets` |
| Migrations | Loose `.sql` files in `supabase/`, run by hand in the SQL Editor, no ordering or tracking |
| UI | Tailwind v4, sidebar shell in `layout.tsx`, table + modal CRUD pattern (see `catalogue/page.tsx`) |
| Modules | Catalogue, Categories, Page Media, Blog (+ comments) |

### The three things that must change structurally

These are the reason Phases 0–1 exist before any ERP feature gets built.

1. **Everything is public-readable.** Every table has
   `FOR SELECT USING (true)`. That is correct for products and blog posts,
   and catastrophic for salaries and invoices. ERP tables need the opposite
   default.
2. **Every logged-in user is an admin.** There is no role concept. Payroll
   cannot ship on top of this.
3. **Migrations are unordered and untracked.** Fine for 9 files, not for an
   ERP with dozens of tables and evolving schemas.

---

## 2. Decisions

All scope decisions are settled. They are recorded here because they are the
reason several parts of the plan are smaller than they might otherwise be.

### Access control — role-based

Roles: `owner`, `accounts`, `sales`, `hr`, `staff`, enforced at the database
level through RLS, not just hidden in the UI. Detailed in Phase 1.

### PDFs — generated server-side

Real PDF files, stored in a private bucket, so they can be emailed and sent
on WhatsApp. Detailed in Phase 3.

### Invoicing — simple, with basic GST

Deliberately scoped small for v1. An invoice has line items, a client, and a
GST toggle. Nothing more.

| In scope | Out of scope for now |
|---|---|
| GST toggle per invoice | HSN / SAC codes |
| **One GST rate for the whole invoice** | Per-line tax rates |
| IGST vs CGST+SGST split | Works-contract classification |
| Company + client GSTIN on the PDF | Separate site address |
| Amount in words | Reverse charge, e-invoicing, advances |
| Automatic numbering | Credit notes |

When the toggle is off, it's a plain invoice with no tax block. When on, one
rate — picked once on the invoice, not per line — applies to the whole
subtotal. IGST vs CGST+SGST is decided by comparing the company's state to
the client's billing state.

The schema still stores the computed tax **amounts** on the invoice (zeroed
when GST is off), so there's one code path and one PDF template with a
conditional tax block.

> **Deferred, not forgotten.** [docs/ca-questions-gst.md](./ca-questions-gst.md)
> holds the full question list for the CA. Four answers there would change
> structure rather than config, and are the likely triggers for a v2:
> place-of-supply for site installation (may need a separate site address),
> composite supply as one line or two, e-invoicing threshold, and GST on
> advances. None of them block a working v1.

### Invoice numbering — automatic

Format: **`ALU/2026-27/0020`** — prefix, financial year, zero-padded counter.

- Counter resets to `0001` each **1 April**, so the financial year is legible
  from any invoice number.
- Allocated by the database atomically on issue, never typed, never editable.
- GST and non-GST invoices use **separate series** (`ALU/…` and a distinct
  prefix), which keeps filing clean.
- Quotes get their own series with their own prefix.
- Cancelled invoices keep their number and are marked cancelled — numbers are
  never reused or deleted, so the series stays gapless.

### Payroll — monthly entry, no stored salary

The admin opens a payroll run, and for each employee enters **days worked**
plus the **amount** and any bonus or overtime. The payslip computes itself.

| Decision | Choice |
|---|---|
| Employee master stores | Name, details, worker type, **default amount** |
| Salary entered | Pre-filled from the default, editable every month |
| Worker type | **Stored** per employee: monthly-salary or daily-rate |
| Monthly proration | Fixed 30-day divisor — `amount ÷ 30 × days_worked` |
| Daily-rate calculation | `daily_rate × days_worked` |
| Overtime | Flat rupee amount, typed per row |
| Bonus / incentive | Flat rupee amount, typed per row |
| Statutory deductions | **None** — no PF, ESI, PT or TDS |
| Advances / loans | Not tracked |

Worker type is the one payroll fact stored on the employee, because it
decides what the monthly amount *means*. Without it, a ₹800 daily rate can be
entered against a monthly row and the worker gets paid ₹800 for the month.
The entry form therefore labels the column per row — "Monthly Salary" or
"Daily Rate" — and applies the matching formula.

The full computation:

```
gross = (monthly:  amount ÷ 30 × days_worked)
        (daily:    amount × days_worked)
      + overtime_amount
      + bonus_amount

net   = gross          ← no deductions in this scope
```

**Salary visibility.** Two additions close the history gap without adding an
effective-dating system:

1. **`default_amount` on the employee** — pre-fills the payroll row and stays
   editable for that month. Answers "what does this person earn" from the
   employee record, without opening a payroll run. Editing the row prompts
   "update the default going forward?", so a raise is one click rather than a
   separate screen.
2. **Salary history view** — a read-only page per employee showing every
   month's amount from existing payslips, with changes highlighted. No new
   table; payslips already store the amount entered.

> **Remaining limitation, accepted:** there's still no *dated, annotated*
> record of salary revisions — you can see that pay changed in March, not the
> reason. Full effective-dated `salary_history` was considered and dropped as
> more machinery than this team needs. It stays available later: because
> payslips freeze the amount entered, that table can be backfilled from
> existing payslips, recovering every amount and date (though not the
> reasons).

---

## 3. Target architecture

```
apps/admin/src/
  app/
    (cms)/            catalogue, categories, media, blog   ← existing, unchanged
    (erp)/
      dashboard/      cashflow + receivables overview
      parties/        clients & vendors (shared master)
      quotes/         quotations
      invoices/       invoices + payments received
      expenses/       expenses + vendor bills
      people/         employees (name, details, worker type)
      payroll/        payroll runs, entry grid, payslips
      settings/       company profile, tax rates, numbering series, users & roles
  lib/
    supabase/         existing clients + a new service-role client
    erp/
      money.ts        integer-paise arithmetic, formatting, number-to-words
      numbering.ts    document number series allocation
      tax.ts          GST computation (place-of-supply aware, toggleable)
      payroll.ts      gross/net computation from days worked
    pdf/
      templates/      invoice, quote, payslip
      render.ts       shared render + store-to-Supabase pipeline
```

### Cross-cutting rules

These apply to every ERP phase and are non-negotiable, because retrofitting
any of them is expensive.

**Money is stored as integer paise.** A `NUMERIC`/float rupee column will
produce rounding errors that show up as invoices that don't balance and
payslips off by a rupee. One helper module owns all money arithmetic,
rounding, and formatting.

**Financial records are immutable once issued.** An issued invoice is never
edited or deleted — it is amended by a credit note, or cancelled with a
reason and an audit trail. Same for a finalised payroll run. Drafts are
freely editable; issued documents are not.

**Document numbers are allocated atomically in the database**, via a
sequence/counter table inside a transaction. Allocating in application code
produces duplicate invoice numbers under concurrent use, which is a
compliance problem, not just a bug.

**Every ERP table denies public access by default.** New RLS policies are
written against roles, never `USING (true)`.

**Every financial mutation is audit-logged** — who, what, when, before/after.

**Comments and content strings in code are one line.** Any explanatory note
written between lines of code is a single line, never a paragraph block — in
TSX, in SQL, in migration headers. The same goes for user-facing copy in
code. Where something genuinely needs a longer explanation, it goes in
`docs/` with a one-line pointer at the code. Note that several existing files
(`supabase/create_blog_tables.sql`, `lib/supabase/server.ts`) carry
multi-line comment blocks; those are the pattern being retired, not a
precedent.

---

## 4. Phases

Each phase is independently shippable and leaves the app working.

---

### Phase 0 — Migration discipline ✅ DONE
*Foundation. No user-visible change.*

Before adding dozens of tables, the `supabase/` folder needs order.

- Adopt the Supabase CLI migration format: `supabase/migrations/` with
  timestamped, ordered files.
- Fold the 9 existing loose `.sql` files into a baseline migration
  representing current production state; keep the originals for reference.
- Document the apply process in `docs/deployment.md`.
- Generate TypeScript types from the schema into `apps/admin/src/lib/supabase/types.ts`
  and wire them into `createClient()`, so every query is type-checked.

**Done when:** a fresh Supabase project can be built from migrations alone,
and Supabase queries are typed end to end.

**Delivered.** Four ordered migrations in `supabase/migrations/`, the nine
loose files retired to `supabase/legacy/`, typed Supabase clients in both
apps, and [docs/database.md](./database.md). Two things surfaced along the
way: the `products` table had never had a migration at all (it was created by
hand in the dashboard, and its definition is reconstructed from application
code), and typing the queries exposed five places where the apps assumed a
column was non-null while the schema allowed null — fixed by tightening the
schema to match what the code always believed.

---

### Phase 1 — Roles, permissions, and the ERP shell ✅ DONE
*Foundation. Decided: role-based access.*

**Schema**
- `profiles` — one row per `auth.users` row, holding `full_name`, `role`,
  `is_active`, and an optional `employee_id` link.
- Roles: `owner`, `accounts`, `sales`, `hr`, `staff`.
- Helper SQL functions `auth_role()` and `has_role(variadic text[])`, marked
  `SECURITY DEFINER` and `STABLE`, so RLS policies stay short and fast.
- Trigger to auto-create a profile when a user signs up.
- A reusable RLS policy template for ERP tables that ERP phases apply.

**App**
- `requireRole()` helper used by every ERP page and server action. Server
  actions re-check independently — a hidden nav link is not access control.
- Rework `layout.tsx` into a grouped, role-filtered sidebar
  (Content / Sales / Money / People / Settings), collapsing the current flat
  list. Mobile gets a real nav rather than just a logout button.
- Settings → Users: invite users, assign roles, deactivate.

**Access matrix (starting point)**

| Module | owner | accounts | sales | hr | staff |
|---|---|---|---|---|---|
| Catalogue / Blog / Media | ✎ | – | ✎ | – | – |
| Parties | ✎ | ✎ | ✎ | – | – |
| Quotes | ✎ | 👁 | ✎ | – | – |
| Invoices | ✎ | ✎ | 👁 | – | – |
| Expenses | ✎ | ✎ | – | – | ✎ own |
| Employees / Salary | ✎ | 👁 | – | ✎ | 👁 own |
| Payroll runs | ✎ | 👁 | – | ✎ | 👁 own |
| Settings | ✎ | – | – | – | – |

`✎` edit · `👁` view · `–` no access

**Risk to handle:** the first migration must assign `owner` to your existing
account, or you lock yourself out of your own admin panel.

**Done when:** a `staff` user logging in sees a materially smaller app than
an `owner`, enforced at the database level — verifiable by querying directly
with that user's token, not just by the UI hiding things.

**Delivered.** Two migrations (`20260102000000`, `20260102000100`), a
`lib/auth/` module holding the role definitions and server guards, a grouped
role-filtered sidebar with working mobile navigation, a `/no-access` page, and
Settings → Users for inviting users and changing roles.

Access is enforced three times over: navigation filtering, `requireRole()` /
`assertRole()` on every page and action, and RLS at the database. All 13
previously bare `if (!user)` checks were replaced with role assertions.

Two guards protect against lockout: the migration aborts if no active owner
remains, and the app refuses to let an owner demote or deactivate themselves,
or to deactivate the last active owner.

Requires `SUPABASE_SERVICE_ROLE_KEY` in the admin app's environment — user
management creates accounts and reads all profiles, which RLS deliberately
forbids to a normal session.

---

### Phase 2 — Company settings & shared masters ✅ DONE
*Foundation for both invoicing and expenses.*

- `company_profile` — legal name, address, GSTIN/PAN, logo, bank details,
  invoice footer/terms. Everything the PDF templates need.
- `parties` — a single master for clients and vendors (a party can be both),
  with billing/shipping address, GSTIN, state code (needed for
  place-of-supply), contact details, payment terms.
- `document_series` — per document type and financial year: prefix, current
  counter, padding. With the atomic allocation function, and rollover on
  1 April.
- `tax_rates` — a short list of GST rate presets (5 / 12 / 18 / 28), with a
  configurable default. No HSN/SAC columns in v1.
- Settings UI + Parties CRUD, following the existing table + modal pattern.

**Done when:** company details and a client list are entered and reusable,
and allocating a number twice in parallel yields two different numbers.

**Delivered.** Two migrations (`20260103000000`, `20260103000100`) adding
`company_profile`, `parties`, `tax_rates` and `document_series`, plus the
atomic `allocate_document_number()` and `peek_document_number()` functions.

App side: Company Details and Document Numbering settings pages, a Clients &
Vendors module with search and client/vendor filtering, and a new `lib/erp/`
holding `money.ts` (integer paise, Indian amount-in-words), `states.ts` (GST
state codes, GSTIN/PAN validation) and `numbering.ts`.

**29 unit tests** now cover the money arithmetic and financial-year boundaries,
run with `npm test`. These are the first tests in the repo, added because a
silent rounding bug here would be invisible until it reached a client's
invoice.

Two validations worth noting: a GSTIN must agree with the selected state code,
since that pairing is what decides IGST versus CGST+SGST, and parties are
deactivated rather than deleted so historical invoices keep a valid reference.

---

### Phase 3 — PDF pipeline ✅ DONE
*Decided: server-side generation.*

Built before invoicing so invoices ship complete rather than needing a
retrofit.

- Choose the renderer: **`@react-pdf/renderer`** is the recommendation over
  Puppeteer — it runs in Vercel's serverless runtime without a headless
  Chromium binary, which Puppeteer needs and which pushes you into a heavier
  deployment setup.
- Shared document chrome: letterhead, logo, company block, footer.
- `render.ts` — render → store in a **private** Supabase Storage bucket
  (`alusea-documents`, explicitly not the public `alusea-assets` bucket) →
  return a signed, expiring URL.
- A preview route so templates can be iterated on quickly.

**Done when:** a sample document renders to a stored PDF that only an
authorised user can fetch.

**Delivered.** One migration (`20260104000000`) creating the private
`alusea-documents` bucket with per-prefix read policies, and a `lib/pdf/`
module holding the shared theme, document chrome, and the render-and-store
pipeline.

Two templates are already written rather than deferred to their own phases:
`InvoiceDocument` (both tax layouts plus the no-GST case) and
`PayslipDocument` (which shows its own working, "30,000 / 30 x 26"). Phases 5
and 7 supply real data to templates that already exist.

Settings → Document Templates previews all four variants against the real
company profile, and warns which company fields are still blank. Previews
consume no document number and store nothing.

Verified by rendering the actual `theme.ts` stylesheet through the renderer
outside Next.js and checking the `%PDF-` header on the output, so the pipeline
is known to work rather than merely known to compile.

---

### Phase 4 — Expense tracking ✅ DONE
*Was planned before invoicing, but built after it, so the dashboard in Phase 8
has expense data to report against.*

- `expense_categories` — seeded with sensible defaults (Materials, Labour,
  Transport, Fuel, Rent, Utilities, Tools, Marketing, Professional Fees).
- `expenses` — date, category, party/vendor, amount, tax, payment mode,
  reference, notes, receipt attachment, optional project tag, status.
- `expense_attachments` — receipt images/PDFs in the private bucket.
- Optional approval flow: `staff` submits, `accounts`/`owner` approves.
- List with date-range, category, and vendor filters; running totals.
- Monthly summary view; CSV export for your CA.

**Done when:** a month of real expenses can be entered, filtered, and
exported.

**Delivered.** One migration (`20260107000000`) adding three tables, thirteen
policies, two triggers and the `expense_monthly_summary` view, plus six routes.

This is the first module where RLS filters **rows** rather than operations: a
staff member sees only the expenses they filed, enforced in the policy rather
than by the page. Approving is restricted to owner and accounts, and an
approved expense is frozen the way an issued invoice is.

Receipts upload to the private documents bucket under an `expenses/` prefix,
reusing the Phase 3 storage policies. The CSV export writes rupees rather than
paise and neutralises cells that Excel would otherwise run as formulas.

It also gives `staff` their first reachable page — before this, that role had
nothing but `/no-access`.

---

### Phase 5 — Quotations & Invoicing ✅ DONE
*Largest phase; split into 5a/5b.*

**5a — Quotations**
- `quotes` + `quote_items`, priced from the existing `products` table
  (`price_per_sqft` is already there) with per-line width × height → sq ft
  computation, which matches how fabrication work is actually quoted.
- Statuses: draft → sent → accepted/rejected/expired.
- PDF + a "send on WhatsApp" action, reusing the marketing app's existing
  WhatsApp integration.

**5b — Invoices**
- `invoices` + `invoice_items` + `payments`.
- Convert an accepted quote into an invoice in one click.
- **GST toggle** — `is_gst_applicable` on the invoice. Off, tax is zero and
  the PDF hides its tax block. On, a **single rate for the whole invoice** is
  applied to the subtotal, and the company's state versus the client's
  billing state picks IGST or CGST+SGST.
- Tax is computed server-side and **stored on the invoice**, never recomputed
  at render time — a reissued PDF of an old invoice must show the tax that was
  actually charged, not today's rate.
- Amount in words on the PDF (`money.ts` owns the Indian-numbering
  conversion — lakhs and crores, not millions).
- **Automatic numbering** on issue: `ALU/2026-27/0020`, allocated from
  `document_series` inside a transaction, then the document freezes, the PDF
  renders, and the event is logged. Never editable.
- Payment recording with partial payments; invoice status derives from
  payments rather than being set by hand.
- Cancel (keeping the number, marked cancelled) instead of delete.
- Receivables ageing view (0–30 / 31–60 / 61–90 / 90+).

Deferred to a later phase, pending the CA's answers: HSN/SAC, per-line rates,
separate site address, credit notes, reverse charge, e-invoicing, advances.

**Done when:** a quote becomes an issued invoice with a correct PDF both with
and without GST, an inter-state client gets IGST while a local one gets
CGST+SGST, partial payments update the status, and totals reconcile to the
paise.

**Delivered.** One migration (`20260105000000`) adding five tables, sixteen
policies, four triggers and the `invoice_balances` view, plus ten new routes
covering quotations, invoices, payments and signed PDF downloads.

Invoicing rules are enforced in the database, not just the UI: an issued
invoice cannot be edited, a cancelled one cannot be reopened, only drafts can
be deleted, and a draft can never hold a number while an issued invoice can
never lack one.

`lib/erp/tax.ts` carries **20 new unit tests**, including an invariant that
the stored parts always reconcile to the stored total across a range of
amounts. That is the property a client would notice first if it broke.

The line editor prices by width times height for fabrication work, pulls rates
from the existing catalogue, and previews the tax split live as the client is
chosen — so the IGST versus CGST decision is visible before anything is saved.

---

### Phase 6 — Employees ✅ DONE
*Prerequisite for payroll. Small, because salary lives on the payroll run.*

- `employees` — employee code, name, phone, address, joining date,
  designation, **worker type** (`monthly` | `daily`), and **default_amount**
  (the monthly salary or daily rate that pre-fills payroll). Bank details
  optional, for transfer records.
- No salary structure table, no attendance table, no advances table — days
  worked are entered on the payroll run, and the amount pre-fills from the
  default while staying editable per month.
- Salary and personal fields (default_amount, phone, address, bank)
  restricted to `owner`/`hr` at the RLS level.
- **Salary history view** per employee: every month's amount read from
  existing payslips, with changes highlighted. Read-only, no new table.
- Simple list + add/edit modal, same pattern as Categories. An
  active/inactive flag so ex-employees drop out of new payroll runs without
  being deleted, which would orphan their historical payslips.

**Done when:** the workforce is listed with worker type and default amount
set, and an employee's month-by-month pay history is visible on one screen.

---

### Phase 7 — Automated payroll ✅ DONE

The core screen is a **single entry grid**: pick month → every active
employee appears as a row → type days worked and amount (plus optional
overtime and bonus) → totals compute live → generate payslips.

**Schema**
- `payroll_runs` — one per month. Lifecycle: draft → approved → paid.
  Approved runs are locked against edits.
- `payslips` — one row per employee per run, storing the **inputs**
  (worker type, amount entered, days worked, overtime, bonus) *and* the
  **computed outputs** (gross, net) frozen at generation time.

Storing both matters: the inputs make the payslip explainable ("₹30,000 ÷ 30
× 26"), and the frozen outputs mean a reprinted payslip never silently
changes because the formula was later adjusted.

**Calculation**

`lib/erp/payroll.ts`, written as **pure functions with unit tests**. The
formula is small enough to read in one screen, which is exactly why it's
worth testing — it is the one place where a silent bug pays a real person the
wrong amount.

```ts
monthly:  round(amount / 30 * days_worked)
daily:    amount * days_worked
gross:    base + overtime_amount + bonus_amount
net:      gross
```

Rounding happens once, at the paise level, on the prorated base only — so a
row's displayed components always sum exactly to its displayed gross.

**UI**
- Month picker; guard against creating two runs for the same month.
- Entry grid with the amount column **labelled per row** by worker type
  ("Monthly Salary" vs "Daily Rate"), which is what prevents a daily rate
  being read as a monthly salary.
- Live per-row net and a run total, so the total is visible before approving.
- Amounts **pre-fill from each employee's `default_amount`**, editable per
  row. Changing a row prompts "update this employee's default going forward?"
  so a raise is recorded in one click, without a separate screen.
- Validation: days worked within range, amount positive, no blank rows.
- Approve → lock the run, generate payslip PDFs in bulk.
- Payslip PDF per employee showing the breakdown; optional WhatsApp delivery
  reusing the same integration as invoices.
- Monthly payroll register export (CSV) for your records.

**Done when:** a month's payroll is entered in one screen, every payslip
reconciles against a hand-check, and an approved run cannot be edited.

**Delivered.** One migration (`20260106000000`) covering both phases: three
tables, nine policies, five triggers and the `employee_pay_history` view, plus
six new routes.

`lib/erp/payroll.ts` carries **26 unit tests**, including the case
`worker_type` exists to prevent: 800 a day and 800 a month must not produce the
same pay. Others cover half-days, the fixed 30-day divisor, negative input
being treated as zero rather than paying backwards, and the invariant that
components always sum exactly to the gross.

The entry grid labels each row per worker type, computes net pay live as days
are typed, and shows its own working under each figure. Changing an amount
offers a tick to update that employee's default, so a raise is one click while
a one-off month stays a one-off.

Approved runs are frozen by database triggers, and `accounts` sees run totals
for cashflow but never individual pay.

---

### Phase 8 — Dashboard & reporting ✅ DONE

- Home dashboard replacing today's redirect-to-catalogue: revenue this month,
  outstanding receivables, expenses by category, upcoming payroll liability,
  cash position.
- P&L-style summary (revenue − expenses − payroll) by period.
- GST summary for return filing, if applicable.
- CSV/Excel exports throughout for your CA.

**Delivered.** One migration (`20260108000000`) adding six reporting views, and
three routes: a dashboard, a reports page and a CSV export.

Aggregation happens in SQL rather than in the app, so each figure is defined
once and the dashboard is a handful of queries. Every view is
`security_invoker`, which is what lets `accounts` see payroll cost in the P&L
without being able to open a single payslip.

The dashboard now replaces the old redirect-to-catalogue for owner and
accounts: revenue against costs over six months, receivables bucketed by age,
what needs attention, and this month's P&L in full. Revenue and expenses are
both shown net of GST, since tax collected is not income and tax paid is not a
cost.

---

### Phase 9 — Hardening ✅ DONE

- Audit log UI.
- Backup/export of all ERP data.
- Financial-year rollover (new number series).
- Rate limiting on mutation-heavy actions.
- Reconciliation checks that flag invoices whose line items don't sum to
  their stored total.

**Delivered.** One migration (`20260109000000`) adding the `audit_log` table,
its trigger across fourteen tables, and the `integrity_issues` view, plus
three routes.

The audit log was not a viewer over existing data: the logging itself had not
been built, despite the cross-cutting rule calling for it. It now happens in
database triggers rather than server actions, so a change made in the Supabase
SQL editor is recorded too. The table has a read policy and **no write policy
at all**, so nothing can alter the trail, including an owner.

Financial-year rollover needed no work — `allocate_document_number` already
resets each 1 April and carries prefixes forward. Data Health surfaces the
current position rather than adding machinery.

Rate limiting was **not** built. Vercel applies platform-level limits, every
mutation already requires an authenticated session with a role, and the
realistic user count is single digits. Adding a limiter here would be
protection against a threat this deployment does not face.

---

## 5. Sequencing

```
Phase 0 ─ Migrations        ┐
Phase 1 ─ Roles & shell     ├─ Foundation. Must be first.
Phase 2 ─ Settings/masters  ┘
Phase 3 ─ PDF pipeline
Phase 4 ─ Expenses          ← first shippable ERP module
Phase 5 ─ Quotes & Invoices ← largest phase
Phase 6 ─ Employees         ┐
Phase 7 ─ Payroll           ┘ ← small, now that salary is entered monthly
Phase 8 ─ Dashboard
Phase 9 ─ Hardening
```

Nothing is blocked — every decision is settled, so this runs start to finish.

Phases 4, 5, and 6+7 are independent of each other once the foundation is in
place. Payroll is now small enough that if you want it early, moving 6+7 to
directly after Phase 3 is a reasonable reordering — it would give you a
working payroll month before invoicing is built. The one thing that cannot
move is the 0-1-2 foundation.

---

## 6. Recommended starting point

Start with **Phase 0 + Phase 1 together**, as one piece of work. They touch
the same files, neither is individually visible to a user, and together they
produce a real milestone: an admin panel where roles actually mean something
and the schema is under version control.

Nothing external is blocking. The CA questions in
[docs/ca-questions-gst.md](./ca-questions-gst.md) are worth sending whenever
convenient — the answers shape a v2 of invoicing, not v1, and the only one
needed soon is which **default GST rate** to preselect in Phase 2.
