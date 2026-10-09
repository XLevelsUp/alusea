-- Cancelled invoice numbers are given again to the next invoice issued, so the issued invoices of a period stay one unbroken run (1, 2, 3 …).
-- Issuing also becomes a single database step, so a failure part-way can no longer use up a number without an invoice.

-- ============================================================
-- SETTING
-- ============================================================
-- On by default, as the business asked; the developer can switch it off in Document Numbering if the accountant prefers numbers never to repeat.
ALTER TABLE public.company_profile
    ADD COLUMN IF NOT EXISTS reuse_cancelled_invoice_numbers BOOLEAN NOT NULL DEFAULT true;


-- ============================================================
-- FREED NUMBERS
-- ============================================================
-- One row per number freed by a cancelled invoice. It waits until the next invoice of the same series and year takes it.
CREATE TABLE IF NOT EXISTS public.released_invoice_numbers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    doc_type TEXT NOT NULL,
    financial_year TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    sequence INTEGER NOT NULL,

    released_from UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    released_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    reused_by UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    reused_at TIMESTAMP WITH TIME ZONE
);

-- A number can wait to be reused only once at a time.
CREATE UNIQUE INDEX IF NOT EXISTS released_invoice_numbers_waiting
    ON public.released_invoice_numbers(invoice_number) WHERE reused_by IS NULL;

CREATE INDEX IF NOT EXISTS released_invoice_numbers_lookup
    ON public.released_invoice_numbers(doc_type, financial_year, sequence) WHERE reused_by IS NULL;

ALTER TABLE public.released_invoice_numbers ENABLE ROW LEVEL SECURITY;

-- Read-only from the app; rows are written only by the functions below.
DROP POLICY IF EXISTS "ERP users read released_invoice_numbers" ON public.released_invoice_numbers;
CREATE POLICY "ERP users read released_invoice_numbers" ON public.released_invoice_numbers
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts', 'sales'));


-- ============================================================
-- UNIQUENESS
-- ============================================================
-- A cancelled invoice keeps its number on record while a new invoice carries the same number, so only issued invoices must be unique.
-- The old rule was created without a name of its own, so it is found by what it covers rather than assumed.
DO $$
DECLARE
    v_name TEXT;
BEGIN
    FOR v_name IN
        SELECT c.conname
        FROM pg_constraint c
        WHERE c.conrelid = 'public.invoices'::regclass
          AND c.contype = 'u'
          AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.invoices'::regclass AND attname = 'invoice_number')]::SMALLINT[]
    LOOP
        EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT %I', v_name);
    END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_issued_number_unique
    ON public.invoices(invoice_number) WHERE status = 'issued';


-- ============================================================
-- RELEASE ON CANCEL
-- ============================================================
CREATE OR REPLACE FUNCTION public.release_cancelled_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status = 'issued' AND NEW.status = 'cancelled' AND NEW.invoice_number IS NOT NULL
        AND COALESCE((SELECT reuse_cancelled_invoice_numbers FROM public.company_profile WHERE id = 1), false)
    THEN
        INSERT INTO public.released_invoice_numbers (doc_type, financial_year, invoice_number, sequence, released_from)
        VALUES (
            CASE WHEN NEW.is_gst_applicable THEN 'invoice' ELSE 'invoice_nogst' END,
            public.financial_year_of(NEW.issue_date),
            NEW.invoice_number,
            substring(NEW.invoice_number FROM '([0-9]+)$')::INTEGER,
            NEW.id
        )
        ON CONFLICT (invoice_number) WHERE reused_by IS NULL DO NOTHING;
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS invoices_release_cancelled_number ON public.invoices;
CREATE TRIGGER invoices_release_cancelled_number
    AFTER UPDATE OF status ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.release_cancelled_invoice_number();

-- Invoices cancelled before this script ran free their numbers too, so the next invoice can take them straight away.
INSERT INTO public.released_invoice_numbers (doc_type, financial_year, invoice_number, sequence, released_from, released_at)
SELECT
    CASE WHEN i.is_gst_applicable THEN 'invoice' ELSE 'invoice_nogst' END,
    public.financial_year_of(i.issue_date),
    i.invoice_number,
    substring(i.invoice_number FROM '([0-9]+)$')::INTEGER,
    i.id,
    COALESCE(i.cancelled_at, now())
FROM public.invoices i
WHERE i.status = 'cancelled'
  AND i.invoice_number IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.invoices other WHERE other.status = 'issued' AND other.invoice_number = i.invoice_number)
  AND NOT EXISTS (SELECT 1 FROM public.released_invoice_numbers r WHERE r.released_from = i.id)
ON CONFLICT (invoice_number) WHERE reused_by IS NULL DO NOTHING;


-- ============================================================
-- ALLOCATION
-- ============================================================
-- The lowest freed number of the same series and year comes first; only when none is waiting does the counter move on.
CREATE OR REPLACE FUNCTION public.allocate_invoice_number(p_doc_type TEXT, p_date DATE, p_invoice_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id UUID;
    v_number TEXT;
BEGIN
    IF NOT public.has_role('owner', 'accounts') THEN
        RAISE EXCEPTION 'Not authorised to issue invoices';
    END IF;

    IF COALESCE((SELECT reuse_cancelled_invoice_numbers FROM public.company_profile WHERE id = 1), false) THEN
        -- Locked and skipped by anyone else issuing at the same moment, so two invoices can never take the same freed number.
        SELECT id, invoice_number INTO v_id, v_number
        FROM public.released_invoice_numbers
        WHERE doc_type = p_doc_type
          AND financial_year = public.financial_year_of(p_date)
          AND reused_by IS NULL
        ORDER BY sequence
        LIMIT 1
        FOR UPDATE SKIP LOCKED;

        IF FOUND THEN
            UPDATE public.released_invoice_numbers
            SET reused_by = p_invoice_id, reused_at = now()
            WHERE id = v_id;
            RETURN v_number;
        END IF;
    END IF;

    RETURN public.allocate_document_number(p_doc_type, p_date);
END $$;

REVOKE EXECUTE ON FUNCTION public.allocate_invoice_number(TEXT, DATE, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.allocate_invoice_number(TEXT, DATE, UUID) TO authenticated;


-- ============================================================
-- ISSUE IN ONE STEP
-- ============================================================
-- Takes the number and marks the invoice issued in the same transaction: if anything fails, both are undone and the number stays free.
-- Runs as the caller, so the usual invoice permissions still apply to the update.
CREATE OR REPLACE FUNCTION public.issue_invoice(
    p_invoice_id UUID,
    p_party_snapshot JSONB,
    p_place_of_supply_state TEXT,
    p_place_of_supply_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_invoice public.invoices%ROWTYPE;
    v_number TEXT;
BEGIN
    SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    IF v_invoice.status <> 'draft' THEN
        RAISE EXCEPTION 'This invoice has already been issued';
    END IF;

    v_number := public.allocate_invoice_number(
        CASE WHEN v_invoice.is_gst_applicable THEN 'invoice' ELSE 'invoice_nogst' END,
        v_invoice.issue_date,
        p_invoice_id
    );

    UPDATE public.invoices
    SET invoice_number = v_number,
        status = 'issued',
        issued_at = now(),
        place_of_supply_state = COALESCE(p_place_of_supply_state, ''),
        place_of_supply_code = COALESCE(p_place_of_supply_code, ''),
        party_snapshot = COALESCE(p_party_snapshot, '{}'::JSONB)
    WHERE id = p_invoice_id;

    RETURN v_number;
END $$;

REVOKE EXECUTE ON FUNCTION public.issue_invoice(UUID, JSONB, TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.issue_invoice(UUID, JSONB, TEXT, TEXT) TO authenticated;


-- ============================================================
-- PREVIEW
-- ============================================================
-- The "next number" shown in settings takes a waiting freed number into account, so it matches what Issue will really give.
CREATE OR REPLACE FUNCTION public.peek_document_number(
    p_doc_type TEXT,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_fy TEXT;
    v_prefix TEXT;
    v_padding INTEGER;
    v_last INTEGER;
    v_released TEXT;
BEGIN
    IF NOT public.has_role('owner', 'accounts', 'sales') THEN
        RAISE EXCEPTION 'Not authorised to read document numbers';
    END IF;

    v_fy := public.financial_year_of(p_date);

    IF p_doc_type IN ('invoice', 'invoice_nogst')
        AND COALESCE((SELECT reuse_cancelled_invoice_numbers FROM public.company_profile WHERE id = 1), false)
    THEN
        SELECT invoice_number INTO v_released
        FROM public.released_invoice_numbers
        WHERE doc_type = p_doc_type AND financial_year = v_fy AND reused_by IS NULL
        ORDER BY sequence
        LIMIT 1;

        IF v_released IS NOT NULL THEN
            RETURN v_released;
        END IF;
    END IF;

    SELECT prefix, padding, last_number INTO v_prefix, v_padding, v_last
    FROM public.document_series
    WHERE doc_type = p_doc_type AND financial_year = v_fy;

    IF NOT FOUND THEN
        SELECT prefix, padding INTO v_prefix, v_padding
        FROM public.document_series
        WHERE doc_type = p_doc_type
        ORDER BY financial_year DESC
        LIMIT 1;

        v_last := 0;
    END IF;

    RETURN COALESCE(v_prefix, 'ALU') || '/' || v_fy || '/' || lpad((COALESCE(v_last, 0) + 1)::TEXT, COALESCE(v_padding, 4), '0');
END $$;


-- ============================================================
-- INTEGRITY CHECK
-- ============================================================
-- Same checks as before; the duplicate-number check now looks only at issued invoices, since a cancelled one may share its number with its replacement.
CREATE OR REPLACE VIEW public.integrity_issues AS

SELECT
    'invoice'::TEXT AS record_type,
    i.id AS record_id,
    i.invoice_number AS reference,
    ('Line items total ' || COALESCE(SUM(li.amount_paise), 0) || ' but the invoice says ' || i.subtotal_paise)::TEXT AS issue
FROM public.invoices i
LEFT JOIN public.invoice_items li ON li.invoice_id = i.id
WHERE i.status <> 'draft'
GROUP BY i.id, i.invoice_number, i.subtotal_paise
HAVING COALESCE(SUM(li.amount_paise), 0) <> i.subtotal_paise

UNION ALL

SELECT
    'invoice',
    i.id,
    i.invoice_number,
    'Subtotal plus tax plus rounding does not equal the stored total'
FROM public.invoices i
WHERE i.status <> 'draft'
  AND i.subtotal_paise + i.igst_paise + i.cgst_paise + i.sgst_paise + i.rounding_paise <> i.total_paise

UNION ALL

SELECT
    'invoice',
    b.invoice_id,
    b.invoice_number,
    'Payments exceed the invoice total by ' || (-b.balance_paise)
FROM public.invoice_balances b
WHERE b.balance_paise < 0

UNION ALL

SELECT
    'payslip',
    p.id,
    p.employee_name,
    'Components do not sum to the gross pay'
FROM public.payslips p
WHERE p.base_paise + p.overtime_paise + p.bonus_paise <> p.gross_paise

UNION ALL

SELECT
    'payroll_run',
    r.id,
    to_char(r.period_month, 'Mon YYYY'),
    'Payslips total ' || COALESCE(SUM(p.net_paise), 0) || ' but the run says ' || r.total_net_paise
FROM public.payroll_runs r
LEFT JOIN public.payslips p ON p.run_id = r.id
WHERE r.status <> 'draft'
GROUP BY r.id, r.period_month, r.total_net_paise
HAVING COALESCE(SUM(p.net_paise), 0) <> r.total_net_paise

UNION ALL

SELECT
    'invoice',
    (ARRAY_AGG(i.id ORDER BY i.id::TEXT))[1],
    i.invoice_number,
    'Invoice number used ' || COUNT(*) || ' times'
FROM public.invoices i
WHERE i.status = 'issued'
GROUP BY i.invoice_number
HAVING COUNT(*) > 1;

ALTER VIEW public.integrity_issues SET (security_invoker = true);
