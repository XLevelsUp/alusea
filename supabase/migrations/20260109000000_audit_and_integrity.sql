-- Phase 9: audit logging and integrity checks. Closes the cross-cutting rule that every financial mutation is audit-logged.
-- Logging happens in database triggers rather than application code, so a change made directly in the SQL editor is recorded too.

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    table_name TEXT NOT NULL,
    record_id UUID,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),

    -- Only the fields that actually changed, so an update to one column does not store the whole row twice.
    changed_fields JSONB NOT NULL DEFAULT '{}',
    old_values JSONB,
    new_values JSONB,

    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_table_record_idx ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON public.audit_log(actor_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Read-only to the application. Rows are written by triggers running as the table owner, never by a client.
DROP POLICY IF EXISTS "Owners read audit_log" ON public.audit_log;
CREATE POLICY "Owners read audit_log" ON public.audit_log
    FOR SELECT TO authenticated USING (public.has_role('owner'));

-- No INSERT, UPDATE or DELETE policy at all: an audit trail that can be edited is not an audit trail.


-- ============================================================
-- AUDIT TRIGGER
-- ============================================================
-- Columns that change on every write and say nothing about intent.
CREATE OR REPLACE FUNCTION public.audit_ignored_columns()
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT ARRAY['updated_at', 'created_at'];
$$;

CREATE OR REPLACE FUNCTION public.record_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_old JSONB;
    v_new JSONB;
    v_changed JSONB := '{}'::JSONB;
    v_key TEXT;
    v_record_id TEXT;
    v_email TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_new := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_old := NULL;
        v_new := to_jsonb(NEW);
    ELSE
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);

        -- Build a map of just the fields whose value actually changed.
        FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
            IF v_key <> ALL(public.audit_ignored_columns())
                AND v_new -> v_key IS DISTINCT FROM v_old -> v_key
            THEN
                v_changed := v_changed || jsonb_build_object(
                    v_key,
                    jsonb_build_object('from', v_old -> v_key, 'to', v_new -> v_key)
                );
            END IF;
        END LOOP;

        -- Nothing meaningful changed, so there is nothing worth recording.
        IF v_changed = '{}'::JSONB THEN
            RETURN NEW;
        END IF;
    END IF;

    -- company_profile keys on an integer rather than a UUID, so the id is captured only when it is one.
    v_record_id := NULLIF(COALESCE(v_new ->> 'id', v_old ->> 'id'), '');
    IF v_record_id IS NOT NULL AND length(v_record_id) <> 36 THEN
        v_record_id := NULL;
    END IF;

    SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();

    INSERT INTO public.audit_log (
        table_name, record_id, operation, changed_fields, old_values, new_values, actor_id, actor_email
    ) VALUES (
        TG_TABLE_NAME,
        v_record_id::UUID,
        TG_OP,
        v_changed,
        v_old,
        v_new,
        auth.uid(),
        COALESCE(v_email, '')
    );

    RETURN COALESCE(NEW, OLD);
END $$;


-- ============================================================
-- WHAT GETS AUDITED
-- ============================================================
-- Financial records and the settings that shape them. Catalogue and blog content are deliberately excluded: they are not money.
DO $$
DECLARE
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY ARRAY[
        'invoices', 'invoice_items', 'payments',
        'quotes', 'quote_items',
        'expenses',
        'employees', 'payroll_runs', 'payslips',
        'parties', 'company_profile', 'document_series', 'tax_rates',
        'profiles'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'audit_' || v_table, v_table);
        EXECUTE format(
            'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.record_audit()',
            'audit_' || v_table,
            v_table
        );
    END LOOP;
END $$;


-- ============================================================
-- INTEGRITY CHECKS
-- ============================================================
-- Flags financial records whose stored totals disagree with their parts. An empty result is the healthy state.
CREATE OR REPLACE VIEW public.integrity_issues AS

-- An invoice whose line items do not sum to its stored subtotal.
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

-- An invoice whose parts do not reconcile to its stored total.
SELECT
    'invoice',
    i.id,
    i.invoice_number,
    'Subtotal plus tax plus rounding does not equal the stored total'
FROM public.invoices i
WHERE i.status <> 'draft'
  AND i.subtotal_paise + i.igst_paise + i.cgst_paise + i.sgst_paise + i.rounding_paise <> i.total_paise

UNION ALL

-- More money received than the invoice is worth.
SELECT
    'invoice',
    b.invoice_id,
    b.invoice_number,
    'Payments exceed the invoice total by ' || (-b.balance_paise)
FROM public.invoice_balances b
WHERE b.balance_paise < 0

UNION ALL

-- A payslip whose components do not sum to its gross, which the CHECK constraint should already prevent.
SELECT
    'payslip',
    p.id,
    p.employee_name,
    'Components do not sum to the gross pay'
FROM public.payslips p
WHERE p.base_paise + p.overtime_paise + p.bonus_paise <> p.gross_paise

UNION ALL

-- A payroll run whose stored total disagrees with its payslips.
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

-- A duplicate invoice number, which the unique index should already prevent but which would be serious enough to surface anyway.
SELECT
    'invoice',
    (ARRAY_AGG(i.id ORDER BY i.id::TEXT))[1],
    i.invoice_number,
    'Invoice number used ' || COUNT(*) || ' times'
FROM public.invoices i
WHERE i.invoice_number IS NOT NULL
GROUP BY i.invoice_number
HAVING COUNT(*) > 1;

ALTER VIEW public.integrity_issues SET (security_invoker = true);
