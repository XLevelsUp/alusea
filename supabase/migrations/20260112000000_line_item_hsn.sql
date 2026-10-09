-- HSN code per line item, chosen from a fixed list in the form and printed on tax invoices.
-- Added to quote lines too, because quotes and invoices share one line-item parser.

ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS hsn_code TEXT NOT NULL DEFAULT '';
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS hsn_code TEXT NOT NULL DEFAULT '';
