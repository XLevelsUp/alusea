-- Finances: money put into the business, manual ledger entries, and one ledger view that lists every money movement.
-- The ledger is one line per movement (money in or money out), not double-entry, by decision.
-- Owners and developers manage it; accounts can read it.

-- ============================================================
-- CAPITAL INFLOW
-- ============================================================
CREATE TABLE IF NOT EXISTS public.capital_inflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    received_on DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'owner_capital' CHECK (kind IN ('owner_capital', 'loan', 'investment', 'other')),
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT capital_inflows_source_present CHECK (btrim(source) <> '')
);

CREATE INDEX IF NOT EXISTS capital_inflows_received_idx ON public.capital_inflows(received_on DESC);

DROP TRIGGER IF EXISTS capital_inflows_touch_updated_at ON public.capital_inflows;
CREATE TRIGGER capital_inflows_touch_updated_at BEFORE UPDATE ON public.capital_inflows
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.capital_inflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance readers read capital_inflows" ON public.capital_inflows;
CREATE POLICY "Finance readers read capital_inflows" ON public.capital_inflows
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts'));

DROP POLICY IF EXISTS "Owners manage capital_inflows" ON public.capital_inflows;
CREATE POLICY "Owners manage capital_inflows" ON public.capital_inflows
    FOR ALL TO authenticated USING (public.has_role('owner')) WITH CHECK (public.has_role('owner'));


-- ============================================================
-- MANUAL LEDGER ENTRIES
-- ============================================================
-- For movements nothing else records: bank charges, owner drawings, loan repayments, opening balances.
-- They count in the ledger only once approved, as in the reference.
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    category TEXT NOT NULL DEFAULT 'other'
        CHECK (category IN ('opening_balance', 'bank_charges', 'owner_drawings', 'loan_repayment', 'interest', 'refund', 'other')),
    description TEXT NOT NULL,
    party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT ledger_entries_description_present CHECK (btrim(description) <> ''),
    CONSTRAINT ledger_entries_approval_recorded CHECK (status <> 'approved' OR approved_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ledger_entries_date_idx ON public.ledger_entries(entry_date DESC);

DROP TRIGGER IF EXISTS ledger_entries_touch_updated_at ON public.ledger_entries;
CREATE TRIGGER ledger_entries_touch_updated_at BEFORE UPDATE ON public.ledger_entries
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance readers read ledger_entries" ON public.ledger_entries;
CREATE POLICY "Finance readers read ledger_entries" ON public.ledger_entries
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts'));

DROP POLICY IF EXISTS "Owners manage ledger_entries" ON public.ledger_entries;
CREATE POLICY "Owners manage ledger_entries" ON public.ledger_entries
    FOR ALL TO authenticated USING (public.has_role('owner')) WITH CHECK (public.has_role('owner'));

-- Both are financial records, so they are audit-logged like invoices and expenses.
DROP TRIGGER IF EXISTS audit_capital_inflows ON public.capital_inflows;
CREATE TRIGGER audit_capital_inflows AFTER INSERT OR UPDATE OR DELETE ON public.capital_inflows
    FOR EACH ROW EXECUTE FUNCTION public.record_audit();

DROP TRIGGER IF EXISTS audit_ledger_entries ON public.ledger_entries;
CREATE TRIGGER audit_ledger_entries AFTER INSERT OR UPDATE OR DELETE ON public.ledger_entries
    FOR EACH ROW EXECUTE FUNCTION public.record_audit();


-- ============================================================
-- GENERAL LEDGER VIEW
-- ============================================================
-- Every money movement in one list, read from the records that already exist so nothing is typed twice.
-- Expenses count once approved, matching the profit-and-loss rule; payroll counts once a run is paid.
CREATE OR REPLACE VIEW public.general_ledger AS
SELECT
    'payment:' || p.id::TEXT AS entry_key,
    p.paid_on AS entry_date,
    'in'::TEXT AS direction,
    'invoice_payment'::TEXT AS source,
    'Payment for ' || COALESCE(i.invoice_number, 'invoice') AS description,
    i.party_id,
    p.amount_paise,
    p.id AS record_id,
    p.invoice_id AS parent_id
FROM public.payments p
JOIN public.invoices i ON i.id = p.invoice_id

UNION ALL
SELECT
    'expense:' || e.id::TEXT,
    e.spent_on,
    'out',
    'expense',
    e.description,
    e.party_id,
    e.amount_paise,
    e.id,
    NULL::UUID
FROM public.expenses e
WHERE e.status = 'approved'

UNION ALL
SELECT
    'payroll:' || r.id::TEXT,
    (r.paid_at AT TIME ZONE 'Asia/Kolkata')::DATE,
    'out',
    'payroll',
    'Salaries for ' || to_char(r.period_month, 'FMMonth YYYY'),
    NULL::UUID,
    r.total_net_paise,
    r.id,
    NULL::UUID
FROM public.payroll_runs r
WHERE r.status = 'paid' AND r.paid_at IS NOT NULL

UNION ALL
SELECT
    'capital:' || c.id::TEXT,
    c.received_on,
    'in',
    'capital',
    'Capital from ' || c.source,
    NULL::UUID,
    c.amount_paise,
    c.id,
    NULL::UUID
FROM public.capital_inflows c

UNION ALL
SELECT
    'manual:' || l.id::TEXT,
    l.entry_date,
    l.direction,
    'manual',
    l.description,
    l.party_id,
    l.amount_paise,
    l.id,
    NULL::UUID
FROM public.ledger_entries l
WHERE l.status = 'approved';

-- security_invoker so the view respects the querying user's RLS rather than the view owner's.
ALTER VIEW public.general_ledger SET (security_invoker = true);
