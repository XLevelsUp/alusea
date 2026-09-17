# Database

One Supabase project backs both apps. Schema changes are tracked as ordered
migration files in `supabase/migrations/` and applied with the Supabase CLI.

## Migrations

Files are named `<timestamp>_<description>.sql` and run in filename order.
The CLI records which have been applied, so re-running only applies new ones.

| Migration | What it does |
|---|---|
| `20260101000000_baseline_schema.sql` | All tables, indexes and RLS policies as they stood before tracking began |
| `20260101000100_baseline_storage.sql` | The public `alusea-assets` bucket and its policies |
| `20260101000200_baseline_reference_data.sql` | Category and blog-category rows the apps expect |
| `20260101000300_tighten_nullable_columns.sql` | Backfills and `NOT NULL` on columns the apps always treated as required |
| `20260102000000_roles_and_profiles.sql` | `profiles` table, `app_role` enum, RLS helper functions, auth triggers |
| `20260102000100_role_aware_cms_policies.sql` | Replaces blanket `authenticated` write access with role-aware policies |
| `20260103000000_company_and_parties.sql` | `company_profile`, `parties`, `tax_rates` |
| `20260103000100_document_numbering.sql` | `document_series` and the atomic allocation functions |
| `20260104000000_documents_storage.sql` | Private `alusea-documents` bucket for generated PDFs |
| `20260105000000_quotes_and_invoices.sql` | Quotes, invoices, line items, payments, and the receivables view |
| `20260106000000_employees_and_payroll.sql` | Employees, payroll runs, payslips, and the pay-history view |
| `20260107000000_expenses.sql` | Expense categories, expenses, receipts, and the monthly summary view |
| `20260108000000_reporting_views.sql` | Revenue, collections, payroll, P&L, GST and receivables-ageing views |
| `20260109000000_audit_and_integrity.sql` | Audit log, its triggers, and the integrity-issues view |

The baseline is idempotent — every statement is `IF NOT EXISTS` or guarded —
so applying it to the existing production database is safe and changes
nothing.

### Applying migrations

```bash
npx supabase login              # once
npx supabase link --project-ref <your-project-ref>
npm run db:push                 # applies pending migrations
```

The project ref is in your Supabase dashboard URL.

> **First run against production:** `db:push` will report the baseline
> migrations as pending even though the tables already exist. That is
> expected — they are written to be no-ops against the current schema. The
> one that does real work is `20260101000300`, which backfills nulls and adds
> `NOT NULL`. Review it before pushing, and take a backup first.

### Creating a new migration

```bash
npx supabase migration new add_something
# edit the generated file in supabase/migrations/
npm run db:push
```

If you change the schema through the Supabase dashboard instead, capture it
with `npm run db:diff -- <name>`, which writes the difference as a new
migration file.

## Generated types

`apps/*/src/lib/supabase/types.ts` describes every table for TypeScript, and
both Supabase clients are parameterised with it, so queries, inserts and
updates are all checked against the real schema.

Both apps need the same file. They cannot share one module because each app
builds from its own root directory on Vercel, so the file is duplicated and a
check keeps the copies identical:

```bash
npm run types:check    # fails if the two copies have drifted
```

### Regenerating

Requires either Docker (for `--local`) or a linked project (for `--linked`):

```bash
npm run types:db          # from the local stack
npm run types:db:remote   # from the linked hosted project
```

Both write the admin copy and then sync it to marketing.

> **Currently hand-maintained.** These types were written by hand to match the
> migrations, because generation needs Docker or a linked project and neither
> was available. Until someone regenerates them, **edit `types.ts` in the same
> commit as any migration that changes a table**, then run `npm run types:sync`.

### Narrowed types

Postgres stores some columns more loosely than the app treats them. `JSONB`
generates as `Json`, and a `CHECK`-constrained `TEXT` generates as `string`.
Rather than push those loose types into components, `types.ts` exports
narrowed rows that pages cast to at the query boundary:

| Type | Narrows |
|---|---|
| `ProductRow` | `specs` from `Json` to `Record<string, string>` |
| `BlogPostRow` | `*_image_fit` to `'cover' \| 'contain'`; `sections`, `qa`, `cta` to their real shapes |

These casts are assertions, not validation. They are safe as long as only the
admin app writes these columns, which is the case today. If untrusted input
ever reaches them, parse instead of casting.

## Schema notes

### `products`

Created by hand in the Supabase dashboard long before migrations existed, so
its definition in the baseline was **reconstructed from application code**
rather than copied from a migration. It matches every column the apps read
and write, but if you ever find a column in production that is not in the
baseline, the baseline is what is wrong.

### JSONB columns on `blog_posts`

`sections`, `qa` and `cta` hold the fixed blog template so the admin form can
edit it without extra join tables:

```
sections: [{ heading, body_html, subsections: [{ heading, body_html }] }]
qa:       [{ question, answer }]
cta:      { intro, buttons: [{ label, href }] }
```

### Roles and RLS

Every user has a row in `profiles` carrying one of five roles: `owner`,
`accounts`, `sales`, `hr`, `staff`. Policies call two helper functions
rather than inlining subqueries:

| Function | Returns |
|---|---|
| `auth_role()` | the caller's role, or null if signed out or deactivated |
| `has_role(variadic app_role[])` | whether the caller holds any of those roles |
| `is_active_user()` | whether the caller has an active profile |

All three are `SECURITY DEFINER` with a pinned `search_path`, so they can
read `profiles` without recursing through its own policies, and cannot be
hijacked by a caller-controlled search path.

**Reads stay public.** The marketing site fetches products and blog posts
anonymously, so `SELECT` on CMS tables is still `USING (true)`. What changed
is writes: `INSERT`/`UPDATE`/`DELETE` on every CMS table, and uploads to
`alusea-assets`, now require `owner` or `sales`.

ERP tables added from Phase 2 onward deny by default and grant by role, rather
than inheriting this public-read pattern.

### The three layers of access control

A page hiding a nav link is not security. Access is enforced three times:

1. **Navigation** — `navFor(role)` in `lib/auth/roles.ts` decides what is shown.
2. **Page and action guards** — `requireRole()` on pages, `assertRole()` in
   server actions. Both re-check independently of the UI.
3. **RLS** — the database refuses the write regardless of what the app did.

Layers 1 and 2 live in `lib/auth/`, layer 3 in the migrations. **Changing who
can do what means changing both**, or the UI and database will disagree.

### Not locking yourself out

`20260102000000` promotes every pre-existing user to `owner`, on the grounds
that they were all full admins before roles existed. It then raises an
exception if no active owner remains, failing the migration rather than
leaving an unmanageable database.

The app enforces the same invariant: an owner cannot change their own role or
deactivate themselves, and the last active owner cannot be deactivated at all.

## Document numbering

Invoice and quote numbers look like `ALU/2026-27/0020` and are allocated by
the database, never by application code.

```sql
SELECT allocate_document_number('invoice');   -- consumes the next number
SELECT peek_document_number('invoice');       -- shows it without consuming
```

`allocate_document_number` uses `INSERT ... ON CONFLICT DO UPDATE`, which takes
a row lock, so two people issuing invoices at the same instant are serialised
and cannot receive the same number. Allocating in application code — read the
counter, add one, write it back — produces duplicates under exactly that race,
which is a compliance problem rather than just a bug.

A rolled-back transaction leaves a **gap** rather than reusing the number.
Gaps are acceptable; duplicates are not.

The counter resets each 1 April via `financial_year_of()`, carrying the prefix
and padding forward from the previous year's series. GST and non-GST invoices
use separate series (`invoice`, `invoice_nogst`) so the two are easy to
separate at filing time.

## Money

Every monetary value in the ERP is stored as **integer paise**, never a decimal
or float rupee column. `lib/erp/money.ts` owns all conversion, arithmetic,
rounding and formatting, including `paiseToWords()` for the amount-in-words
line invoices carry, which uses Indian numbering — lakh and crore, not
millions.

Float rupees accumulate error that surfaces as invoices whose line items do not
sum to their stored total. The module has unit tests; run them with `npm test`.

## Generated documents

Invoices, quotations and payslips are rendered server-side with
`@react-pdf/renderer` and stored in **`alusea-documents`**, a bucket that is
deliberately **private**, unlike the public `alusea-assets` bucket used for
website images. An invoice must never be readable by URL alone.

Files are reached through signed URLs created server-side after a role check,
and those expire after ten minutes.

Paths are `<kind>/<id>/<filename>.pdf`, and the first segment carries the
access rule:

| Path prefix | Readable by |
|---|---|
| `invoices/`, `quotes/`, `expenses/` | owner, accounts, sales |
| `payslips/` | owner, hr |

Only owners can delete. Reissuing a document upserts, replacing the file
rather than accumulating copies.

`@react-pdf/renderer` was chosen over Puppeteer because it runs in Vercel's
serverless runtime without a headless Chromium binary. Templates use the
built-in Helvetica family, so rendering never depends on fetching a font.

## Invoices

An issued invoice is a legal record, so the database enforces what the UI
promises rather than trusting it:

- **Numbers are allocated only on issue.** A draft has `invoice_number NULL`,
  and a `CHECK` constraint makes that the only valid state for a draft, so a
  draft can never hold a number and an issued invoice can never lack one.
- **Issued invoices are frozen.** The `guard_issued_invoice` trigger raises an
  exception on any attempt to change the figures, party, number or date of an
  issued invoice, and `guard_issued_invoice_items` does the same for its
  lines. Amending means cancelling and raising a new invoice.
- **Cancelled stays cancelled.** A cancelled invoice cannot be reopened, keeps
  its number, and must carry a reason.
- **Only drafts can be deleted**, enforced in the RLS policy itself, so the
  number series never develops a hole from a deletion.

### Tax

`lib/erp/tax.ts` computes GST as pure functions, unit-tested, shared by quotes
and invoices. Comparing the company state code with the client state code
decides IGST versus CGST+SGST, and a `CHECK` constraint enforces that an
invoice carries one shape or the other, never both.

Tax amounts are **stored**, not recomputed at render time. Reprinting a
two-year-old invoice must show the tax actually charged, not the rate in force
today. The invoice also freezes a `party_snapshot`, so later edits to a client
record cannot change what an issued invoice says.

An unknown client state falls back to intra-state, which is the safer default:
it keeps the tax at home rather than wrongly claiming an inter-state supply.

### Payment status is derived

The `invoice_balances` view computes paid, balance and status from the
`payments` rows rather than storing a flag, so paid-ness cannot drift from the
money actually recorded. It is `security_invoker`, so it respects the querying
user RLS rather than the view owner.

## Payroll

Salary is **not** stored as a structure. Each run holds what was actually
entered that month, which is what the agreed scope asks for.

`employees.worker_type` is the one payroll fact kept on the employee record,
because it decides what an amount *means*: 800 a day is not 800 a month.
`default_amount_paise` pre-fills the payroll row and stays editable there, and
updating it is a separate explicit tick, so a one-off month never silently
becomes someone's new salary.

### Computation

`lib/erp/payroll.ts` is pure functions with unit tests. This is the one place
in the codebase where a silent bug pays a real person the wrong amount.

```
monthly:  round(amount / 30 * days_worked)
daily:    amount * days_worked
gross:    base + overtime + bonus
net:      gross
```

The 30-day divisor is fixed rather than the real month length, so a February
day is worth the same as a January day. One visible consequence: 31 days worked
pays slightly more than the monthly salary. That is the agreed rule working,
not a bug.

Rounding happens once, on the prorated base, so components always sum exactly
to the gross. Two `CHECK` constraints enforce that in the database as well:
`gross = base + overtime + bonus`, and `gross = net` since this scope has no
deductions.

### Frozen runs

An approved run is what people were actually paid, so it is frozen the way an
issued invoice is. `guard_approved_payroll` blocks reopening a run, and
`guard_approved_payslips` blocks changing any figure on its payslips. The PDF
path stays writable, so payslips can be regenerated without unfreezing
anything.

Payslips copy the employee name, code and designation at generation time, so
renaming someone later does not rewrite their old payslips.

### Who can see pay

Payroll is the most sensitive data in the system:

| Data | owner | hr | accounts |
|---|---|---|---|
| Employees | ✎ | ✎ | – |
| Payroll run totals | ✎ | ✎ | 👁 |
| Individual payslips | ✎ | ✎ | – |

`accounts` deliberately sees run totals for cashflow but never who was paid
what. That split is enforced by separate RLS policies on `payroll_runs` and
`payslips`, not by the UI.

### Pay history

`employee_pay_history` reads month-by-month pay straight out of existing
payslips, so there is no separate salary-history table to keep in step. The
employee page uses it to flag the months where the amount changed.

## Expenses

The only module any role can write to. Anyone with an active profile can file
an expense; approving one is restricted to owner and accounts.

### Row-level visibility

This is the first table where RLS filters **rows**, not just operations:

```sql
-- accounts and owner see everything
USING (public.has_role('owner', 'accounts'))
-- everyone else sees only what they filed
USING (created_by = auth.uid() AND public.is_active_user())
```

So a staff member opening /expenses sees their own submissions and nothing
else, without the page having to filter anything. The same pattern governs
`expense_attachments`, whose policies check the parent expense.

A submitter can still correct their own entry, but only while it is
unapproved. Once approved, `guard_approved_expense` freezes the amount, tax,
date and category, the way an issued invoice is frozen.

### Amount and tax

`amount_paise` is what was actually spent, and `tax_paise` is the GST portion
**inside** that amount, not added on top. A `CHECK` constraint enforces
`tax_paise <= amount_paise`. This shape is what makes the input-tax-credit
figure available for filing without a second calculation.

### Receipts

Uploads go to `expenses/<id>/` in the private `alusea-documents` bucket, so
they inherit the same storage policies as invoices. Files are reached through
signed URLs, and deleting an attachment removes the stored file too.

### Monthly summary

`expense_monthly_summary` groups **approved** expenses by month and category.
Draft and rejected entries are excluded, since neither is money the business
has accepted.

### CSV export

`/expenses/export` streams a CSV for the accountant, in rupees rather than
paise since a person reads it. Cells beginning `=`, `+`, `-` or `@` are
prefixed with an apostrophe, because Excel would otherwise execute them as
formulas.

## Reporting

Six views aggregate the whole system. They live in SQL rather than in the app,
so the definition of each figure exists in one place and the dashboard stays a
handful of queries rather than a fetch-everything-and-sum exercise.

| View | Answers |
|---|---|
| `revenue_monthly` | What did we bill, by month |
| `collections_monthly` | What did we actually receive |
| `payroll_monthly` | What did staff cost |
| `expense_monthly_summary` | What did we spend, by category |
| `profit_and_loss_monthly` | Revenue less expenses and payroll |
| `gst_summary_monthly` | Output tax against input tax |
| `receivables_ageing` | Who owes us, and for how long |

Every one is `security_invoker`, so the caller's RLS still applies. That
matters most for payroll: `accounts` can read run totals and therefore sees
payroll cost in the P&L, but still cannot see an individual payslip.

### What counts

The views apply consistent rules, so a figure means the same thing wherever it
appears:

- **Revenue** is issued invoices only. Drafts are not revenue, and cancelled
  invoices never were.
- **Expenses** are approved only. Draft and rejected entries are not money the
  business has accepted.
- **Payroll** is approved and paid runs only; a draft run is not a committed
  cost.
- **Revenue and expenses are both net of GST.** Tax collected is not income,
  and tax paid is not a cost — they net off in the GST summary instead.

`profit_and_loss_monthly` unions the months from all three sources, so a month
with expenses but no invoices still appears rather than vanishing from the
report.

### Ageing buckets

`receivables_ageing` buckets unpaid balances as current, 1–30, 31–60, 61–90
and over 90 days past due. Only issued invoices with a balance appear, so
drafts and fully paid invoices are excluded.

## Audit log

Every change to a financial record is logged by a **database trigger**, not by
application code. That distinction matters: a change made directly in the
Supabase SQL editor is recorded too, which would not be true of logging written
into server actions.

Fourteen tables are audited — invoices, invoice items, payments, quotes, quote
items, expenses, employees, payroll runs, payslips, parties, company profile,
document series, tax rates and profiles. Catalogue and blog content are
deliberately excluded: they are content, not money.

### What is stored

An update records only the fields that actually changed, as
`{field: {from, to}}`, so editing one column does not store the whole row
twice. `updated_at` and `created_at` are ignored, since they change on every
write and say nothing about intent. An update where nothing meaningful changed
writes no row at all.

The full old and new rows are kept alongside, so a deleted record can still be
reconstructed.

### Why it cannot be tampered with

`audit_log` has a `SELECT` policy for owners and **no INSERT, UPDATE or DELETE
policy at all**. Rows arrive only through the trigger, which runs
`SECURITY DEFINER`. An audit trail that can be edited is not an audit trail, so
not even an owner can alter it through the application.

## Integrity checks

`integrity_issues` surfaces financial records that disagree with themselves. An
empty result is the healthy state. It checks that:

- invoice line items sum to the stored subtotal
- subtotal plus tax plus rounding equals the stored total
- no invoice has received more than it is worth
- payslip components sum to the gross
- a payroll run total matches its payslips
- no invoice number is used twice

Several of these duplicate a `CHECK` constraint or unique index that should
already prevent the problem. They are checked anyway, because a constraint
proves what the database rejects going forward, not what is already stored —
and a wrong total reaching a client is expensive enough to be worth a second
look.

Settings → Data Health runs the view and offers CSV backups of every ERP table.

## Legacy SQL

`supabase/legacy/` holds the ad-hoc files that were run by hand before
migrations. They are reference only — never run them. See the README in that
folder for where each one ended up.
