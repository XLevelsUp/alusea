-- Phase 4: expense tracking. Money is integer paise throughout, matching invoices and payroll.
-- Staff can submit and see only their own expenses; accounts and owner see and approve everything.

-- ============================================================
-- ENUMS
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status') THEN
        CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
    END IF;
END $$;


-- ============================================================
-- EXPENSE CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Every ERP user reads categories, since staff need them to file an expense.
DROP POLICY IF EXISTS "ERP users read expense_categories" ON public.expense_categories;
CREATE POLICY "ERP users read expense_categories" ON public.expense_categories
    FOR SELECT TO authenticated USING (public.is_active_user());

DROP POLICY IF EXISTS "Accounts insert expense_categories" ON public.expense_categories;
CREATE POLICY "Accounts insert expense_categories" ON public.expense_categories
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'accounts'));

DROP POLICY IF EXISTS "Accounts update expense_categories" ON public.expense_categories;
CREATE POLICY "Accounts update expense_categories" ON public.expense_categories
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'accounts')) WITH CHECK (public.has_role('owner', 'accounts'));

INSERT INTO public.expense_categories (name, sort_order) VALUES
    ('Materials', 1),
    ('Labour', 2),
    ('Transport', 3),
    ('Fuel', 4),
    ('Rent', 5),
    ('Utilities', 6),
    ('Tools & Equipment', 7),
    ('Marketing', 8),
    ('Professional Fees', 9),
    ('Office & Admin', 10),
    ('Other', 99)
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    spent_on DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,

    description TEXT NOT NULL,

    -- Amount is what was actually spent; tax is the GST portion within it, recorded for input-credit purposes rather than added on top.
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),

    payment_method public.payment_method NOT NULL DEFAULT 'cash',
    reference TEXT NOT NULL DEFAULT '',
    project_tag TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',

    status public.expense_status NOT NULL DEFAULT 'submitted',
    rejection_reason TEXT NOT NULL DEFAULT '',

    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- The tax portion cannot exceed the amount it sits inside.
    CONSTRAINT expenses_tax_within_amount CHECK (tax_paise <= amount_paise),
    CONSTRAINT expenses_rejected_has_reason CHECK (
        status <> 'rejected' OR btrim(rejection_reason) <> ''
    )
);

CREATE INDEX IF NOT EXISTS expenses_spent_on_idx ON public.expenses(spent_on DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS expenses_status_idx ON public.expenses(status);
CREATE INDEX IF NOT EXISTS expenses_created_by_idx ON public.expenses(created_by);

DROP TRIGGER IF EXISTS expenses_touch_updated_at ON public.expenses;
CREATE TRIGGER expenses_touch_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- An approved expense has been accepted into the books, so its figures are frozen the way an issued invoice is.
CREATE OR REPLACE FUNCTION public.guard_approved_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'approved' AND NEW.status = 'approved' THEN
        IF NEW.amount_paise IS DISTINCT FROM OLD.amount_paise
            OR NEW.tax_paise IS DISTINCT FROM OLD.tax_paise
            OR NEW.spent_on IS DISTINCT FROM OLD.spent_on
            OR NEW.category_id IS DISTINCT FROM OLD.category_id
        THEN
            RAISE EXCEPTION 'An approved expense cannot be edited. Reject it first if it needs changing.';
        END IF;
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS expenses_guard_approved ON public.expenses;
CREATE TRIGGER expenses_guard_approved BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.guard_approved_expense();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Staff see only what they filed themselves; accounts and owner see everything.
DROP POLICY IF EXISTS "Accounts read all expenses" ON public.expenses;
CREATE POLICY "Accounts read all expenses" ON public.expenses
    FOR SELECT TO authenticated USING (public.has_role('owner', 'accounts'));

DROP POLICY IF EXISTS "Staff read own expenses" ON public.expenses;
CREATE POLICY "Staff read own expenses" ON public.expenses
    FOR SELECT TO authenticated USING (created_by = auth.uid() AND public.is_active_user());

DROP POLICY IF EXISTS "ERP users submit expenses" ON public.expenses;
CREATE POLICY "ERP users submit expenses" ON public.expenses
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND public.has_role('owner', 'accounts', 'sales', 'hr', 'staff')
    );

DROP POLICY IF EXISTS "Accounts update expenses" ON public.expenses;
CREATE POLICY "Accounts update expenses" ON public.expenses
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'accounts')) WITH CHECK (public.has_role('owner', 'accounts'));

-- A submitter can still correct their own entry, but only while it is unapproved.
DROP POLICY IF EXISTS "Submitters update own pending expenses" ON public.expenses;
CREATE POLICY "Submitters update own pending expenses" ON public.expenses
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid() AND status IN ('draft', 'submitted', 'rejected'))
    WITH CHECK (created_by = auth.uid() AND status IN ('draft', 'submitted', 'rejected'));

DROP POLICY IF EXISTS "Accounts delete expenses" ON public.expenses;
CREATE POLICY "Accounts delete expenses" ON public.expenses
    FOR DELETE TO authenticated USING (public.has_role('owner', 'accounts') AND status <> 'approved');

DROP POLICY IF EXISTS "Submitters delete own pending expenses" ON public.expenses;
CREATE POLICY "Submitters delete own pending expenses" ON public.expenses
    FOR DELETE TO authenticated USING (created_by = auth.uid() AND status IN ('draft', 'submitted', 'rejected'));


-- ============================================================
-- RECEIPTS
-- ============================================================
-- Files live in the private alusea-documents bucket under the expenses prefix; this table records what is attached to which expense.
CREATE TABLE IF NOT EXISTS public.expense_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,

    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL DEFAULT '',
    content_type TEXT NOT NULL DEFAULT '',
    size_bytes BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS expense_attachments_expense_idx ON public.expense_attachments(expense_id);

ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;

-- Attachment visibility follows the expense it belongs to.
DROP POLICY IF EXISTS "Read attachments of visible expenses" ON public.expense_attachments;
CREATE POLICY "Read attachments of visible expenses" ON public.expense_attachments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            WHERE e.id = expense_id
              AND (public.has_role('owner', 'accounts') OR e.created_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Attach receipts to own expenses" ON public.expense_attachments;
CREATE POLICY "Attach receipts to own expenses" ON public.expense_attachments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses e
            WHERE e.id = expense_id
              AND (public.has_role('owner', 'accounts') OR e.created_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Remove attachments from own expenses" ON public.expense_attachments;
CREATE POLICY "Remove attachments from own expenses" ON public.expense_attachments
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            WHERE e.id = expense_id
              AND (public.has_role('owner', 'accounts') OR e.created_by = auth.uid())
        )
    );


-- ============================================================
-- MONTHLY SUMMARY
-- ============================================================
-- Approved expenses only, since draft and rejected entries are not money the business has accepted.
CREATE OR REPLACE VIEW public.expense_monthly_summary AS
SELECT
    date_trunc('month', e.spent_on)::DATE AS period_month,
    e.category_id,
    c.name AS category_name,
    COUNT(*)::INTEGER AS entry_count,
    SUM(e.amount_paise)::BIGINT AS total_paise,
    SUM(e.tax_paise)::BIGINT AS tax_paise
FROM public.expenses e
JOIN public.expense_categories c ON c.id = e.category_id
WHERE e.status = 'approved'
GROUP BY 1, 2, 3;

ALTER VIEW public.expense_monthly_summary SET (security_invoker = true);
