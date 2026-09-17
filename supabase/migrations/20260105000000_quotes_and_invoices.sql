-- Phase 5: quotations and invoices. All money is integer paise, never a decimal rupee column.
-- Tax amounts are stored, not recomputed at render time, so a reprinted invoice shows the tax actually charged rather than today's rate.

-- ============================================================
-- SHARED ENUMS
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
        CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE public.payment_method AS ENUM ('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other');
    END IF;
END $$;


-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    quote_number TEXT UNIQUE,
    status public.quote_status NOT NULL DEFAULT 'draft',

    party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE RESTRICT,

    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,

    -- GST is a per-document choice, and the rate applies to the whole document in v1.
    is_gst_applicable BOOLEAN NOT NULL DEFAULT true,
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18 CHECK (gst_rate >= 0 AND gst_rate <= 100),

    subtotal_paise BIGINT NOT NULL DEFAULT 0,
    igst_paise BIGINT NOT NULL DEFAULT 0,
    cgst_paise BIGINT NOT NULL DEFAULT 0,
    sgst_paise BIGINT NOT NULL DEFAULT 0,
    rounding_paise BIGINT NOT NULL DEFAULT 0,
    total_paise BIGINT NOT NULL DEFAULT 0,

    notes TEXT NOT NULL DEFAULT '',
    pdf_path TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- A quote only carries one kind of tax: inter-state uses IGST, intra-state uses CGST plus SGST.
    CONSTRAINT quotes_tax_shape CHECK (
        (igst_paise = 0 AND cgst_paise >= 0 AND sgst_paise >= 0)
        OR (igst_paise >= 0 AND cgst_paise = 0 AND sgst_paise = 0)
    )
);

CREATE INDEX IF NOT EXISTS quotes_party_idx ON public.quotes(party_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON public.quotes(status);
CREATE INDEX IF NOT EXISTS quotes_issue_date_idx ON public.quotes(issue_date DESC);

CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,

    position INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,

    -- Fabrication is quoted by area, so width and height are kept alongside the computed quantity to show the working.
    width_ft NUMERIC(10,2),
    height_ft NUMERIC(10,2),
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    unit TEXT NOT NULL DEFAULT 'sq ft',

    rate_paise BIGINT NOT NULL DEFAULT 0 CHECK (rate_paise >= 0),
    amount_paise BIGINT NOT NULL DEFAULT 0,

    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_items_quote_idx ON public.quote_items(quote_id, position);


-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Null while a draft: the number is allocated only on issue, so drafts never consume one.
    invoice_number TEXT UNIQUE,
    status public.invoice_status NOT NULL DEFAULT 'draft',

    party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE RESTRICT,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,

    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,

    is_gst_applicable BOOLEAN NOT NULL DEFAULT true,
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18 CHECK (gst_rate >= 0 AND gst_rate <= 100),

    -- Frozen at issue time so a reprint cannot change, even if the party record is later edited.
    place_of_supply_state TEXT NOT NULL DEFAULT '',
    place_of_supply_code TEXT NOT NULL DEFAULT '',
    party_snapshot JSONB NOT NULL DEFAULT '{}',

    subtotal_paise BIGINT NOT NULL DEFAULT 0,
    igst_paise BIGINT NOT NULL DEFAULT 0,
    cgst_paise BIGINT NOT NULL DEFAULT 0,
    sgst_paise BIGINT NOT NULL DEFAULT 0,
    rounding_paise BIGINT NOT NULL DEFAULT 0,
    total_paise BIGINT NOT NULL DEFAULT 0,

    notes TEXT NOT NULL DEFAULT '',
    pdf_path TEXT NOT NULL DEFAULT '',

    issued_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT invoices_tax_shape CHECK (
        (igst_paise = 0 AND cgst_paise >= 0 AND sgst_paise >= 0)
        OR (igst_paise >= 0 AND cgst_paise = 0 AND sgst_paise = 0)
    ),
    -- An issued invoice must carry a number; a draft must not.
    CONSTRAINT invoices_number_matches_status CHECK (
        (status = 'draft' AND invoice_number IS NULL)
        OR (status <> 'draft' AND invoice_number IS NOT NULL)
    ),
    CONSTRAINT invoices_cancelled_has_reason CHECK (
        status <> 'cancelled' OR btrim(cancellation_reason) <> ''
    )
);

CREATE INDEX IF NOT EXISTS invoices_party_idx ON public.invoices(party_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);
CREATE INDEX IF NOT EXISTS invoices_issue_date_idx ON public.invoices(issue_date DESC);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,

    position INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,

    width_ft NUMERIC(10,2),
    height_ft NUMERIC(10,2),
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    unit TEXT NOT NULL DEFAULT 'sq ft',

    rate_paise BIGINT NOT NULL DEFAULT 0 CHECK (rate_paise >= 0),
    amount_paise BIGINT NOT NULL DEFAULT 0,

    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON public.invoice_items(invoice_id, position);


-- ============================================================
-- PAYMENTS
-- ============================================================
-- Invoice status derives from payments rather than being set by hand, so paid-ness cannot drift from the money received.
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,

    paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    method public.payment_method NOT NULL DEFAULT 'bank_transfer',
    reference TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS payments_invoice_idx ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS payments_paid_on_idx ON public.payments(paid_on DESC);


-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS quotes_touch_updated_at ON public.quotes;
CREATE TRIGGER quotes_touch_updated_at BEFORE UPDATE ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS invoices_touch_updated_at ON public.invoices;
CREATE TRIGGER invoices_touch_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- An issued invoice is a legal record: it is amended by cancelling, never by editing the figures.
CREATE OR REPLACE FUNCTION public.guard_issued_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'issued' AND NEW.status = 'issued' THEN
        IF NEW.subtotal_paise IS DISTINCT FROM OLD.subtotal_paise
            OR NEW.total_paise IS DISTINCT FROM OLD.total_paise
            OR NEW.igst_paise IS DISTINCT FROM OLD.igst_paise
            OR NEW.cgst_paise IS DISTINCT FROM OLD.cgst_paise
            OR NEW.sgst_paise IS DISTINCT FROM OLD.sgst_paise
            OR NEW.gst_rate IS DISTINCT FROM OLD.gst_rate
            OR NEW.is_gst_applicable IS DISTINCT FROM OLD.is_gst_applicable
            OR NEW.party_id IS DISTINCT FROM OLD.party_id
            OR NEW.invoice_number IS DISTINCT FROM OLD.invoice_number
            OR NEW.issue_date IS DISTINCT FROM OLD.issue_date
        THEN
            RAISE EXCEPTION 'An issued invoice cannot be edited. Cancel it and raise a new one.';
        END IF;
    END IF;

    IF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
        RAISE EXCEPTION 'A cancelled invoice cannot be reopened.';
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS invoices_guard_issued ON public.invoices;
CREATE TRIGGER invoices_guard_issued BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.guard_issued_invoice();

-- Line items of an issued invoice are equally frozen.
CREATE OR REPLACE FUNCTION public.guard_issued_invoice_items()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status public.invoice_status;
    v_invoice UUID;
BEGIN
    v_invoice := COALESCE(NEW.invoice_id, OLD.invoice_id);
    SELECT status INTO v_status FROM public.invoices WHERE id = v_invoice;

    IF v_status IN ('issued', 'cancelled') THEN
        RAISE EXCEPTION 'Line items of an issued invoice cannot be changed.';
    END IF;

    RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS invoice_items_guard_issued ON public.invoice_items;
CREATE TRIGGER invoice_items_guard_issued BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_items
    FOR EACH ROW EXECUTE FUNCTION public.guard_issued_invoice_items();


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Quotes belong to sales; accounts can see them for context.
DROP POLICY IF EXISTS "ERP users read quotes" ON public.quotes;
CREATE POLICY "ERP users read quotes" ON public.quotes
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts', 'sales'));

DROP POLICY IF EXISTS "Sales write quotes" ON public.quotes;
CREATE POLICY "Sales write quotes" ON public.quotes
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'sales'));

DROP POLICY IF EXISTS "Sales update quotes" ON public.quotes;
CREATE POLICY "Sales update quotes" ON public.quotes
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'sales')) WITH CHECK (public.has_role('owner', 'sales'));

DROP POLICY IF EXISTS "Sales delete draft quotes" ON public.quotes;
CREATE POLICY "Sales delete draft quotes" ON public.quotes
    FOR DELETE TO authenticated USING (public.has_role('owner', 'sales') AND status = 'draft');

DROP POLICY IF EXISTS "ERP users read quote_items" ON public.quote_items;
CREATE POLICY "ERP users read quote_items" ON public.quote_items
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts', 'sales'));

DROP POLICY IF EXISTS "Sales write quote_items" ON public.quote_items;
CREATE POLICY "Sales write quote_items" ON public.quote_items
    FOR ALL TO authenticated USING (public.has_role('owner', 'sales')) WITH CHECK (public.has_role('owner', 'sales'));

-- Invoices belong to accounts; sales can read them but not change them.
DROP POLICY IF EXISTS "ERP users read invoices" ON public.invoices;
CREATE POLICY "ERP users read invoices" ON public.invoices
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts', 'sales'));

DROP POLICY IF EXISTS "Accounts write invoices" ON public.invoices;
CREATE POLICY "Accounts write invoices" ON public.invoices
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'accounts'));

DROP POLICY IF EXISTS "Accounts update invoices" ON public.invoices;
CREATE POLICY "Accounts update invoices" ON public.invoices
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'accounts')) WITH CHECK (public.has_role('owner', 'accounts'));

-- Only drafts can be deleted; an issued invoice is cancelled instead, keeping its number.
DROP POLICY IF EXISTS "Accounts delete draft invoices" ON public.invoices;
CREATE POLICY "Accounts delete draft invoices" ON public.invoices
    FOR DELETE TO authenticated USING (public.has_role('owner', 'accounts') AND status = 'draft');

DROP POLICY IF EXISTS "ERP users read invoice_items" ON public.invoice_items;
CREATE POLICY "ERP users read invoice_items" ON public.invoice_items
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts', 'sales'));

DROP POLICY IF EXISTS "Accounts write invoice_items" ON public.invoice_items;
CREATE POLICY "Accounts write invoice_items" ON public.invoice_items
    FOR ALL TO authenticated USING (public.has_role('owner', 'accounts')) WITH CHECK (public.has_role('owner', 'accounts'));

DROP POLICY IF EXISTS "ERP users read payments" ON public.payments;
CREATE POLICY "ERP users read payments" ON public.payments
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts', 'sales'));

DROP POLICY IF EXISTS "Accounts write payments" ON public.payments;
CREATE POLICY "Accounts write payments" ON public.payments
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'accounts'));

DROP POLICY IF EXISTS "Accounts update payments" ON public.payments;
CREATE POLICY "Accounts update payments" ON public.payments
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'accounts')) WITH CHECK (public.has_role('owner', 'accounts'));

DROP POLICY IF EXISTS "Accounts delete payments" ON public.payments;
CREATE POLICY "Accounts delete payments" ON public.payments
    FOR DELETE TO authenticated USING (public.has_role('owner', 'accounts'));


-- ============================================================
-- RECEIVABLES VIEW
-- ============================================================
-- Payment status is derived, never stored, so it cannot drift from the payments actually recorded.
CREATE OR REPLACE VIEW public.invoice_balances AS
SELECT
    i.id AS invoice_id,
    i.invoice_number,
    i.party_id,
    i.status,
    i.issue_date,
    i.due_date,
    i.total_paise,
    COALESCE(p.paid_paise, 0) AS paid_paise,
    i.total_paise - COALESCE(p.paid_paise, 0) AS balance_paise,
    CASE
        WHEN i.status = 'cancelled' THEN 'cancelled'
        WHEN i.status = 'draft' THEN 'draft'
        WHEN COALESCE(p.paid_paise, 0) >= i.total_paise THEN 'paid'
        WHEN COALESCE(p.paid_paise, 0) > 0 THEN 'part_paid'
        WHEN i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE THEN 'overdue'
        ELSE 'unpaid'
    END::TEXT AS payment_status,
    CASE
        WHEN i.due_date IS NULL OR i.status <> 'issued' THEN NULL
        ELSE GREATEST(0, CURRENT_DATE - i.due_date)
    END AS days_overdue
FROM public.invoices i
LEFT JOIN (
    SELECT invoice_id, SUM(amount_paise) AS paid_paise
    FROM public.payments
    GROUP BY invoice_id
) p ON p.invoice_id = i.id;

-- security_invoker so the view respects the querying user's RLS rather than the view owner's.
ALTER VIEW public.invoice_balances SET (security_invoker = true);
