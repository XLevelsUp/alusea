-- Phase 2: atomic document numbering. Produces ALU/2026-27/0020 and resets each 1 April.
-- Allocation happens in the database under a row lock: doing it in application code produces duplicate invoice numbers under concurrent use, which is a compliance problem rather than just a bug.

-- ============================================================
-- DOCUMENT SERIES
-- ============================================================
-- One row per document type per financial year. last_number is the highest number issued so far.
CREATE TABLE IF NOT EXISTS public.document_series (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    doc_type TEXT NOT NULL,
    financial_year TEXT NOT NULL,

    prefix TEXT NOT NULL DEFAULT 'ALU',
    padding INTEGER NOT NULL DEFAULT 4 CHECK (padding BETWEEN 1 AND 10),
    last_number INTEGER NOT NULL DEFAULT 0 CHECK (last_number >= 0),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT document_series_unique UNIQUE (doc_type, financial_year)
);

ALTER TABLE public.document_series ENABLE ROW LEVEL SECURITY;

-- Read-only from the app. Numbers are allocated through the function below, never by a direct UPDATE.
DROP POLICY IF EXISTS "ERP users read document_series" ON public.document_series;
CREATE POLICY "ERP users read document_series" ON public.document_series
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts', 'sales'));

DROP POLICY IF EXISTS "Owners update document_series" ON public.document_series;
CREATE POLICY "Owners update document_series" ON public.document_series
    FOR UPDATE TO authenticated USING (public.has_role('owner')) WITH CHECK (public.has_role('owner'));

DROP TRIGGER IF EXISTS document_series_touch_updated_at ON public.document_series;
CREATE TRIGGER document_series_touch_updated_at
    BEFORE UPDATE ON public.document_series
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================
-- FINANCIAL YEAR
-- ============================================================
-- Indian financial year runs 1 April to 31 March, so a date in Jan-Mar belongs to the year that started the previous April.
CREATE OR REPLACE FUNCTION public.financial_year_of(on_date DATE)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN EXTRACT(MONTH FROM on_date) >= 4
            THEN EXTRACT(YEAR FROM on_date)::INT || '-' || right((EXTRACT(YEAR FROM on_date)::INT + 1)::TEXT, 2)
        ELSE (EXTRACT(YEAR FROM on_date)::INT - 1) || '-' || right(EXTRACT(YEAR FROM on_date)::TEXT, 2)
    END;
$$;


-- ============================================================
-- ALLOCATION
-- ============================================================
-- Returns the next number for a document type and marks it used, in one atomic step.
-- INSERT ... ON CONFLICT DO UPDATE takes a row lock, so two concurrent callers are serialised and can never receive the same number.
-- A rolled-back transaction leaves a gap rather than reusing the number; gaps are acceptable, duplicates are not.
CREATE OR REPLACE FUNCTION public.allocate_document_number(
    p_doc_type TEXT,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_fy TEXT;
    v_prefix TEXT;
    v_padding INTEGER;
    v_next INTEGER;
BEGIN
    IF NOT public.has_role('owner', 'accounts', 'sales') THEN
        RAISE EXCEPTION 'Not authorised to allocate document numbers';
    END IF;

    IF p_doc_type IS NULL OR btrim(p_doc_type) = '' THEN
        RAISE EXCEPTION 'Document type is required';
    END IF;

    v_fy := public.financial_year_of(p_date);

    -- Carries prefix and padding forward from the previous year's series so settings survive the 1 April rollover.
    SELECT prefix, padding INTO v_prefix, v_padding
    FROM public.document_series
    WHERE doc_type = p_doc_type
    ORDER BY financial_year DESC
    LIMIT 1;

    INSERT INTO public.document_series (doc_type, financial_year, prefix, padding, last_number)
    VALUES (p_doc_type, v_fy, COALESCE(v_prefix, 'ALU'), COALESCE(v_padding, 4), 1)
    ON CONFLICT (doc_type, financial_year)
    DO UPDATE SET last_number = public.document_series.last_number + 1, updated_at = now()
    RETURNING last_number, prefix, padding INTO v_next, v_prefix, v_padding;

    RETURN v_prefix || '/' || v_fy || '/' || lpad(v_next::TEXT, v_padding, '0');
END $$;

REVOKE EXECUTE ON FUNCTION public.allocate_document_number(TEXT, DATE) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.allocate_document_number(TEXT, DATE) TO authenticated;


-- ============================================================
-- PREVIEW
-- ============================================================
-- Shows what the next number would look like without consuming it, for settings screens and drafts.
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
BEGIN
    IF NOT public.has_role('owner', 'accounts', 'sales') THEN
        RAISE EXCEPTION 'Not authorised to read document numbers';
    END IF;

    v_fy := public.financial_year_of(p_date);

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

REVOKE EXECUTE ON FUNCTION public.peek_document_number(TEXT, DATE) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.peek_document_number(TEXT, DATE) TO authenticated;


-- ============================================================
-- SEED
-- ============================================================
-- GST and non-GST invoices get separate series so the two are easy to separate at filing time.
INSERT INTO public.document_series (doc_type, financial_year, prefix, padding, last_number)
VALUES
    ('invoice',     public.financial_year_of(CURRENT_DATE), 'ALU',    4, 0),
    ('invoice_nogst', public.financial_year_of(CURRENT_DATE), 'ALU-B',  4, 0),
    ('quote',       public.financial_year_of(CURRENT_DATE), 'ALU-Q',  4, 0)
ON CONFLICT (doc_type, financial_year) DO NOTHING;
