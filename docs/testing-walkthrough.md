# Testing the ERP end to end

A one-sitting run through every module, with the specific things worth
checking at each step. Budget about 45 minutes.

Use real-ish data — a genuine client name, real prices. Fake data hides the
problems you actually care about.

---

## Before you start

### 1. Verify the database

Paste `supabase/verify_setup.sql` into the Supabase SQL editor. Every row
should read **PASS**, except the company profile which may say **TODO** until
you fill it in.

If anything says FAIL, stop and fix that first — the rest of the walkthrough
will produce confusing results on a half-applied schema.

### 2. Start the apps

```bash
npm run dev:marketing   # start this FIRST so it takes port 3000
npm run dev:admin       # lands on 3001
```

Order matters: `NEXT_PUBLIC_MARKETING_URL` is hardcoded to port 3000, so
starting admin first breaks the "view live post" links.

---

## Part 1 — Settings (5 min)

### Company details

Go to **Settings → Company Details**. Fill in at minimum:

- Legal name (invoicing is blocked without it)
- State (this decides IGST vs CGST+SGST on every invoice)
- GSTIN, if you have one
- Bank details and terms

**Check:** enter a GSTIN whose first two digits disagree with the state you
picked. It should refuse to save, because that pairing is what drives the tax
split.

### Document templates

Go to **Settings → Document Templates** and open all four previews.

**Check:** the invoice PDF shows your real company details, not placeholders.
This is the single thing a client will scrutinise hardest — look at it
properly now, while changing it is cheap.

### Numbering

Go to **Settings → Document Numbering**.

**Check:** the next invoice number reads `ALU/2026-27/0001`, and the financial
year matches the current one.

---

## Part 2 — A client and a quote (10 min)

### Add a client

**Clients & Vendors → Add Party.** Add a real client. Set their state to
**your own state** for now, and give them 30-day payment terms.

### Raise a quotation

**Quotations → New Quotation.** Pick the client, then add two lines:

| Line | Width | Height | Rate |
|---|---|---|---|
| Casement windows | 5 | 4 | 1500 |
| Installation | — | — | 25000 (qty 1) |

**Check these as you type:**

- Line 1 quantity computes to **20 sq ft** and locks itself, because width
  and height were given
- Line 2 keeps the quantity you typed, because they were not
- The total updates live
- Under the total it says **"Same-state supply, so CGST and SGST apply"**

**Now change the client's state.** Open the client in another tab, set them
to a different state, save, and reload the quote form.

**Check:** the tax block switches to a single IGST line, and the grand total
is unchanged — only the split differs.

### Send it

Save the quote, then **Mark as Sent**.

**Check:** it takes a number like `ALU-Q/2026-27/0001`, and an **Open PDF**
button appears. Open it — the layout should match the preview you saw
earlier.

---

## Part 3 — The invoice (10 min)

### Convert the quote

On the quotation, click **Convert to Invoice**.

**Check:** you land on a draft invoice with the same lines and totals, the
quote is marked accepted, and the invoice has **no number yet**. Drafts do not
consume numbers.

### Try to break it

Before issuing, this is worth doing deliberately:

1. Click **Edit** and change a line. It should save — drafts are editable.
2. Note the total.

### Issue it

Click **Issue Invoice** and confirm.

**Check:**
- It takes a number, `ALU/2026-27/0001`
- Status becomes **issued**
- A PDF appears — open it and confirm the tax split, the amount in words, and
  your bank details
- The **Edit** button is **gone**

Now try to edit it anyway by going directly to `/invoices/<id>/edit` in the
address bar.

**Check:** you are redirected back to the invoice. An issued invoice is frozen
in the database, not just hidden in the UI.

### Record a payment

Record a **partial** payment — say half the total.

**Check:**
- Status shows **part paid**
- The balance is correct
- Try to record more than the remaining balance: it should refuse

Record the rest.

**Check:** status becomes **paid**, balance reaches zero.

### The non-GST case

Raise a second invoice with the **GST toggle off**.

**Check:**
- It takes a number from a **different series** (`ALU-B/...`)
- The PDF has no tax block at all and says GST is not applicable

---

## Part 4 — Expenses (5 min)

**Expenses → Add Expense.** Record something real: materials, ₹12,000, with
₹1,830 GST inside it.

**Check:** the form shows "Net of GST: ₹10,170" as you type.

Save, then upload a receipt (any image or PDF).

**Check:** the receipt appears and opens via a signed link.

Approve the expense.

**Check:** the Edit button behaviour changes — an approved expense is frozen
the same way an issued invoice is.

### Export

Back on the expense list, click **Export CSV** and open it in Excel.

**Check:** amounts are in rupees, not paise, and nothing renders as a formula.

---

## Part 5 — Payroll (10 min)

### Add two employees

This is the important test. Add both:

| Code | Name | Type | Amount |
|---|---|---|---|
| EMP-001 | (a real name) | **Monthly salary** | 30000 |
| EMP-002 | (a real name) | **Daily rate** | 30000 |

Deliberately give them the **same amount** but different types.

### Run payroll

**Payroll → Start Payroll Run** for the current month. Enter **26 days** for
both.

**Check this carefully — it is the whole point of the worker-type design:**

- EMP-001 (monthly) gets **₹26,000** — that is 30,000 ÷ 30 × 26
- EMP-002 (daily) gets **₹7,80,000** — that is 30,000 × 26
- Under each figure, the working is spelled out

If both showed the same number, something is badly wrong. (You will want to
fix EMP-002's rate to something realistic like 800 before continuing.)

### The default-update prompt

Change EMP-001's amount to 32,000 in the grid.

**Check:** a tick appears offering to update their default. Leave it
unticked, save, then open the employee record.

**Check:** their stored default is still 30,000. A one-off month should not
silently become the new salary.

### Approve

Save, then **Approve Run**.

**Check:**
- Payslip PDFs generate
- Open one: it shows "30-day month, 26 days worked" rather than just a number
- The run can no longer be edited

---

## Part 6 — Reporting (5 min)

### Dashboard

Go to **Dashboard**.

**Check:**
- Revenue this month matches the invoices you issued, **net of GST**
- Outstanding matches what is unpaid
- Profit = revenue − expenses − payroll
- The receivables ageing section lists your unpaid invoice

### Reports

Go to **Reports**.

**Check:** the P&L and GST summary both show the current month, and the GST
summary's output tax matches what your invoices charged.

### Data health

Go to **Settings → Data Health**.

**Check:** it says **"Everything reconciles"** in green. If it lists problems,
those are real — every check compares a stored total against its own parts.

### Audit log

Go to **Settings → Audit Log**.

**Check:** every change you made during this walkthrough is listed, with your
email against it, showing what changed from what to what.

---

## Part 7 — Roles (5 min)

This is the test most worth doing, because role bugs are invisible until
someone sees something they should not.

**Settings → Users → Add User.** Create a test user with the **staff** role
and a password you will remember.

Open a **private browsing window** and sign in as them.

**Check:**
- They see only **Expenses** in the sidebar
- No dashboard, no invoices, no payroll
- They can file an expense
- They see **only their own** expenses, not yours

Now try to reach a restricted page directly by typing
`localhost:3001/payroll` in the address bar.

**Check:** you land on the no-access page, not the payroll screen.

When done, deactivate the test user.

**Check:** try to deactivate your own owner account — it should refuse. That
guard exists so you cannot lock yourself out.

---

## If something fails

| Symptom | Likely cause |
|---|---|
| "Company profile is missing" | Phase 2 migration not run |
| Cannot issue an invoice | Legal name blank in Settings → Company Details |
| Users page errors | `SUPABASE_SERVICE_ROLE_KEY` not set |
| PDF will not open | Storage bucket missing; re-run the Phase 3 migration |
| Wrong tax split | Client state code, or your own, not set |
| Audit log empty | Phase 9 migration not run |

Anything that looks wrong but is not in this table is worth reporting rather
than working around — most of these rules are enforced in the database, so a
surprise usually means a real bug.
