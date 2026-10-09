-- Turns a party record into a hub: vendors get a type, clients get a services note, expenses can be tagged to the client they were incurred for, and a view totals each party's money.

-- ============================================================
-- PARTIES
-- ============================================================
-- vendor_type is text with a check rather than an enum, so a third kind can be added later without a type migration.
ALTER TABLE public.parties
    ADD COLUMN IF NOT EXISTS vendor_type TEXT,
    ADD COLUMN IF NOT EXISTS services_offered TEXT NOT NULL DEFAULT '';

-- Vendors that existed before the type did are local suppliers unless someone says otherwise.
UPDATE public.parties SET vendor_type = 'local' WHERE is_vendor AND vendor_type IS NULL;

ALTER TABLE public.parties DROP CONSTRAINT IF EXISTS parties_vendor_type_check;
ALTER TABLE public.parties ADD CONSTRAINT parties_vendor_type_check CHECK (
    (is_vendor AND vendor_type IN ('local', 'import_export'))
    OR (NOT is_vendor AND vendor_type IS NULL)
);

CREATE INDEX IF NOT EXISTS parties_vendor_type_idx ON public.parties(vendor_type) WHERE is_vendor;

-- Owners may delete a party outright; the app only offers it for a party with no invoices, quotes or expenses, and the invoice and quote foreign keys refuse it otherwise.
DROP POLICY IF EXISTS "Owners delete parties" ON public.parties;
CREATE POLICY "Owners delete parties" ON public.parties
    FOR DELETE TO authenticated USING (public.has_role('owner'));


-- ============================================================
-- EXPENSES
-- ============================================================
-- party_id is who was paid (the vendor); client_id is whose job the money was spent on, so one expense can carry both.
ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.parties(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS expenses_client_idx ON public.expenses(client_id) WHERE client_id IS NOT NULL;


-- ============================================================
-- PARTY FINANCIAL SUMMARY
-- ============================================================
-- One row per party. Totals follow the reporting rules: issued invoices and approved expenses only, so they agree with the profit-and-loss figures.
CREATE OR REPLACE VIEW public.party_financial_summary AS
SELECT
    p.id AS party_id,
    COALESCE(inv.invoice_count, 0)::INTEGER AS invoice_count,
    COALESCE(inv.invoiced_paise, 0)::BIGINT AS invoiced_paise,
    COALESCE(inv.collected_paise, 0)::BIGINT AS collected_paise,
    COALESCE(inv.outstanding_paise, 0)::BIGINT AS outstanding_paise,
    COALESCE(ce.expense_count, 0)::INTEGER AS client_expense_count,
    COALESCE(ce.expense_paise, 0)::BIGINT AS client_expense_paise,
    COALESCE(ve.expense_count, 0)::INTEGER AS vendor_expense_count,
    COALESCE(ve.expense_paise, 0)::BIGINT AS vendor_expense_paise
FROM public.parties p
LEFT JOIN (
    SELECT
        party_id,
        COUNT(*) AS invoice_count,
        SUM(total_paise) AS invoiced_paise,
        SUM(paid_paise) AS collected_paise,
        SUM(balance_paise) AS outstanding_paise
    FROM public.invoice_balances
    WHERE status = 'issued'
    GROUP BY party_id
) inv ON inv.party_id = p.id
LEFT JOIN (
    SELECT client_id, COUNT(*) AS expense_count, SUM(amount_paise) AS expense_paise
    FROM public.expenses
    WHERE status = 'approved' AND client_id IS NOT NULL
    GROUP BY client_id
) ce ON ce.client_id = p.id
LEFT JOIN (
    SELECT party_id, COUNT(*) AS expense_count, SUM(amount_paise) AS expense_paise
    FROM public.expenses
    WHERE status = 'approved' AND party_id IS NOT NULL
    GROUP BY party_id
) ve ON ve.party_id = p.id;

-- security_invoker so the view respects the querying user's RLS rather than the view owner's.
ALTER VIEW public.party_financial_summary SET (security_invoker = true);
