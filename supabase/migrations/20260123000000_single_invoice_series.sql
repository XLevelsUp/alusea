-- Invoices with and without GST now share one number series (ALU/2026-27/0001, 0002, …) instead of a separate ALU-B series for invoices without GST.
-- Invoices already issued keep the numbers they have; only invoices issued from now on are affected.

-- ============================================================
-- ISSUE: ONE SERIES FOR EVERY INVOICE
-- ============================================================
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

    -- The same series whether or not the invoice carries GST.
    v_number := public.allocate_invoice_number('invoice', v_invoice.issue_date, p_invoice_id);

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


-- ============================================================
-- RELEASE ON CANCEL: INTO THE ONE SERIES
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
        -- A number from the old ALU-B series is not handed out again, or a new invoice would be given the retired prefix.
        AND split_part(NEW.invoice_number, '/', 1) = (
            SELECT prefix FROM public.document_series WHERE doc_type = 'invoice' ORDER BY financial_year DESC LIMIT 1
        )
    THEN
        INSERT INTO public.released_invoice_numbers (doc_type, financial_year, invoice_number, sequence, released_from)
        VALUES (
            'invoice',
            public.financial_year_of(NEW.issue_date),
            NEW.invoice_number,
            substring(NEW.invoice_number FROM '([0-9]+)$')::INTEGER,
            NEW.id
        )
        ON CONFLICT (invoice_number) WHERE reused_by IS NULL DO NOTHING;
    END IF;

    RETURN NEW;
END $$;


-- ============================================================
-- TIDY UP THE RETIRED SERIES
-- ============================================================
-- Freed ALU-B numbers that were still waiting are dropped, since nothing will ever take them.
DELETE FROM public.released_invoice_numbers
WHERE doc_type = 'invoice_nogst' AND reused_by IS NULL;

-- The ALU-B counter is removed where it was never used; a year that did issue ALU-B invoices keeps its row as a record.
DELETE FROM public.document_series
WHERE doc_type = 'invoice_nogst' AND last_number = 0;
