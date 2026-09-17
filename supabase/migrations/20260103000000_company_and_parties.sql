-- Phase 2: company identity and the shared client/vendor master. First ERP tables, so they deny public access by default rather than following the CMS public-read pattern.

-- ============================================================
-- COMPANY PROFILE
-- ============================================================
-- Single-row table holding everything the invoice and payslip PDFs print. The id check keeps it to one row.
CREATE TABLE IF NOT EXISTS public.company_profile (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),

    legal_name TEXT NOT NULL DEFAULT '',
    trade_name TEXT NOT NULL DEFAULT '',

    address_line1 TEXT NOT NULL DEFAULT '',
    address_line2 TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    state_code TEXT NOT NULL DEFAULT '',
    pincode TEXT NOT NULL DEFAULT '',

    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',

    gstin TEXT NOT NULL DEFAULT '',
    pan TEXT NOT NULL DEFAULT '',

    bank_name TEXT NOT NULL DEFAULT '',
    bank_account_name TEXT NOT NULL DEFAULT '',
    bank_account_number TEXT NOT NULL DEFAULT '',
    bank_ifsc TEXT NOT NULL DEFAULT '',
    bank_branch TEXT NOT NULL DEFAULT '',

    logo_url TEXT NOT NULL DEFAULT '',
    invoice_terms TEXT NOT NULL DEFAULT '',
    invoice_footer TEXT NOT NULL DEFAULT '',

    default_gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;

-- Every ERP user reads it (invoices and payslips print it); only owners change it.
DROP POLICY IF EXISTS "ERP users read company_profile" ON public.company_profile;
CREATE POLICY "ERP users read company_profile" ON public.company_profile
    FOR SELECT TO authenticated USING (public.is_active_user());

DROP POLICY IF EXISTS "Owners insert company_profile" ON public.company_profile;
CREATE POLICY "Owners insert company_profile" ON public.company_profile
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner'));

DROP POLICY IF EXISTS "Owners update company_profile" ON public.company_profile;
CREATE POLICY "Owners update company_profile" ON public.company_profile
    FOR UPDATE TO authenticated USING (public.has_role('owner')) WITH CHECK (public.has_role('owner'));

DROP TRIGGER IF EXISTS company_profile_touch_updated_at ON public.company_profile;
CREATE TRIGGER company_profile_touch_updated_at
    BEFORE UPDATE ON public.company_profile
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seeds the single row so the settings form always has something to edit.
INSERT INTO public.company_profile (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PARTIES
-- ============================================================
-- One master for clients and vendors, since a party is often both. state_code drives the IGST vs CGST+SGST decision on every invoice.
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    name TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',

    is_client BOOLEAN NOT NULL DEFAULT true,
    is_vendor BOOLEAN NOT NULL DEFAULT false,

    contact_person TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',

    billing_address_line1 TEXT NOT NULL DEFAULT '',
    billing_address_line2 TEXT NOT NULL DEFAULT '',
    billing_city TEXT NOT NULL DEFAULT '',
    billing_state TEXT NOT NULL DEFAULT '',
    billing_state_code TEXT NOT NULL DEFAULT '',
    billing_pincode TEXT NOT NULL DEFAULT '',

    gstin TEXT NOT NULL DEFAULT '',
    pan TEXT NOT NULL DEFAULT '',

    payment_terms_days INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT parties_is_client_or_vendor CHECK (is_client OR is_vendor)
);

CREATE INDEX IF NOT EXISTS parties_name_idx ON public.parties(name);
CREATE INDEX IF NOT EXISTS parties_is_client_idx ON public.parties(is_client) WHERE is_client;
CREATE INDEX IF NOT EXISTS parties_is_vendor_idx ON public.parties(is_vendor) WHERE is_vendor;

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ERP users read parties" ON public.parties;
CREATE POLICY "ERP users read parties" ON public.parties
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts', 'sales'));

DROP POLICY IF EXISTS "Sales and accounts insert parties" ON public.parties;
CREATE POLICY "Sales and accounts insert parties" ON public.parties
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'accounts', 'sales'));

DROP POLICY IF EXISTS "Sales and accounts update parties" ON public.parties;
CREATE POLICY "Sales and accounts update parties" ON public.parties
    FOR UPDATE TO authenticated
    USING (public.has_role('owner', 'accounts', 'sales'))
    WITH CHECK (public.has_role('owner', 'accounts', 'sales'));

-- No DELETE policy: parties are deactivated, so invoices and expenses keep a valid reference.

DROP TRIGGER IF EXISTS parties_touch_updated_at ON public.parties;
CREATE TRIGGER parties_touch_updated_at
    BEFORE UPDATE ON public.parties
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================
-- TAX RATES
-- ============================================================
-- GST rate presets for the invoice dropdown. No HSN/SAC columns in v1, per the scope in docs/erp-implementation-plan.md.
CREATE TABLE IF NOT EXISTS public.tax_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL UNIQUE,
    rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
    is_default BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Partial unique index: at most one default, enforced by the database rather than by application code.
CREATE UNIQUE INDEX IF NOT EXISTS tax_rates_single_default_idx ON public.tax_rates(is_default) WHERE is_default;

ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ERP users read tax_rates" ON public.tax_rates;
CREATE POLICY "ERP users read tax_rates" ON public.tax_rates
    FOR SELECT TO authenticated USING (public.is_active_user());

DROP POLICY IF EXISTS "Owners manage tax_rates insert" ON public.tax_rates;
CREATE POLICY "Owners manage tax_rates insert" ON public.tax_rates
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner'));

DROP POLICY IF EXISTS "Owners manage tax_rates update" ON public.tax_rates;
CREATE POLICY "Owners manage tax_rates update" ON public.tax_rates
    FOR UPDATE TO authenticated USING (public.has_role('owner')) WITH CHECK (public.has_role('owner'));

INSERT INTO public.tax_rates (label, rate, is_default, sort_order) VALUES
    ('GST 5%', 5, false, 1),
    ('GST 12%', 12, false, 2),
    ('GST 18%', 18, true, 3),
    ('GST 28%', 28, false, 4)
ON CONFLICT (label) DO NOTHING;
