# Questions for our CA — GST setup for the new invoicing system

We're building an in-house invoicing system and need to configure it with the
correct tax treatment. Below is what we need confirmed, and why each one
matters to how the software is built.

> **Where we've started.** Version 1 issues a straightforward invoice: line
> items, one GST rate for the whole invoice, both GSTINs, IGST or CGST+SGST
> chosen by comparing our state with the client's billing state, amount in
> words, and an auto-generated number in the form `ALU/2026-27/0020` that
> resets each April. We have deliberately left out HSN/SAC codes, per-line
> rates, and a separate installation-site address for now.
>
> **The one answer we need soon** is Q3 — which GST rate to set as our
> default. Everything else below shapes a later version, so please take the
> time you need.

---

## 1. Classification — is our work a works contract?

We fabricate and install aluminium windows, doors, sliding systems, facades
and balustrades. Most jobs are supply **plus** installation at the client's
site; some are supply only.

- Is our normal supply-and-install job treated as a **works contract**
  (composite supply of goods and services)?
- If yes, does that classification apply to every job, or does it depend on
  the contract terms?
- For supply-only jobs with no installation, is the treatment different?

**Why it matters:** this decides whether an invoice line carries an HSN code
(goods) or a SAC code (services), and therefore which rate applies.

## 2. HSN / SAC codes

Please give us the exact codes to preload:

- The **SAC code** for our installation / works contract service
- The **HSN code(s)** for the aluminium products themselves, if we ever
  invoice goods separately
- Whether different product categories (windows vs doors vs facades vs
  balustrades) need different codes, or all sit under one

Also: how many digits must we show on the invoice — 4, 6 or 8? We understand
this depends on turnover slab, so please confirm which applies to us.

## 3. GST rates

For each code above, the applicable rate — and whether any of our work
attracts a **concessional rate** rather than the standard one. We understand
certain construction and affordable-housing work can differ. Please flag any
case where we'd need to charge something other than our default rate, so we
can build it as a selectable option rather than a hardcoded value.

## 4. Composite supply — one line or two?

When a job is supply + installation on a single contract:

- Do we invoice it as **one line** at the works-contract rate?
- Or do we **split** goods and services into separate lines at separate rates?

**Why it matters:** this determines the shape of our invoice line items. It is
awkward to change after we've issued invoices, so we want it right first time.

## 5. Place of supply — immovable property

Our installation work happens at the client's site.

- For installation at a site, is the place of supply the **site location**,
  rather than the client's registered address?
- So if a client is registered in one state but we install in another, which
  determines **IGST vs CGST+SGST**?

**Why it matters:** the system picks IGST or CGST+SGST automatically by
comparing states. We need to know which address to compare — the client's
billing address or the installation site. If it's the site, we'll capture
site address separately on every invoice.

## 6. Invoice numbering

We're generating invoice numbers automatically.

- Any required or preferred format (prefix, financial-year marker)?
- Must the series be **strictly gapless**? (We plan to never delete an
  invoice — cancellations stay in the series marked cancelled — but please
  confirm that's the right approach.)
- If we issue both GST and non-GST invoices, should they be in **separate
  number series**, or one combined series? We'd prefer separate as it seems
  cleaner at filing time — please confirm that's acceptable.

## 7. Non-GST invoices

Our system has a per-invoice toggle for GST.

- In what situations, if any, should we legitimately issue an invoice
  **without** GST? (Unregistered clients, exempt supplies, below-threshold,
  or never?)
- If we should always charge GST on taxable supplies, tell us plainly and
  we'll treat the toggle as an exception rather than a routine choice.
- Should non-GST documents be labelled something specific — "Bill of Supply"
  rather than "Tax Invoice"?

## 8. Mandatory invoice fields

Please confirm our invoice includes everything legally required, and flag
anything missing. We're planning:

- Supplier name, address, GSTIN
- Invoice number and date
- Client name, address, GSTIN (where registered)
- Place of supply, with state code
- Description, HSN/SAC, quantity, unit, rate, taxable value per line
- CGST / SGST / IGST shown separately with rates
- Total tax, total invoice value
- **Amount in words**
- Whether **reverse charge** applies
- Signature or digital signature
- Any declaration text you want printed on every invoice

Also: do we need to show a **due date** or payment terms, and is there any
wording you'd like as a standard footer?

## 9. Rounding

- Round off to the nearest rupee on the invoice total?
- Show the rounding adjustment as its own line?
- Per-line or only on the grand total?

## 10. E-invoicing and e-way bills

- Does our turnover put us in scope for **e-invoicing (IRN/QR code)**? If not
  yet, at what threshold would we cross into it?
- Do our deliveries require **e-way bills**, and should the invoicing system
  be capturing the data needed for them?

**Why it matters:** if e-invoicing is coming for us, we'd rather structure the
data for it now than retrofit later.

## 11. Advances

We often take an advance before starting work.

- How should advances be treated — receipt voucher, GST payable on receipt?
- Should the invoicing system issue a separate document for an advance, and
  adjust it against the final invoice?

## 12. Reports for filing

What should the system export each month to make your filing work easier?
We can produce whatever format you prefer — tell us the columns you want and
we'll build the export to match, rather than you re-keying from PDFs.

---

## What we'll do with the answers

Answers to 2, 3 and 9 get loaded into the system as presets. Answers to 1, 4
and 5 shape the invoice structure itself. Answers to 10 and 11 tell us
whether to plan more work now. Answer to 12 becomes a monthly export built to
your spec.
