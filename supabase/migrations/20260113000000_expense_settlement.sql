-- Tracks what happens to an expense after approval: a company-paid bill is marked paid, a person-paid one is marked reimbursed, each with who recorded it and when.
-- The status enum is left alone on purpose: 'approved' stays the accounting state, so reports and party totals need no change.

ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS paid_by TEXT NOT NULL DEFAULT 'company',
    ADD COLUMN IF NOT EXISTS paid_by_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS paid_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reimbursed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS reimbursed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_paid_by_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_paid_by_check CHECK (paid_by IN ('company', 'person'));

-- A person-paid expense has to say who the person is, or nobody knows who to pay back.
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_person_has_name;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_person_has_name CHECK (paid_by <> 'person' OR btrim(paid_by_name) <> '');

-- Settlement only means something once the expense is approved; un-approving clears it in the app.
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_settled_only_when_approved;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_settled_only_when_approved CHECK (
    status = 'approved' OR (paid_at IS NULL AND reimbursed_at IS NULL)
);

-- Finds what the company still owes people without scanning every expense.
CREATE INDEX IF NOT EXISTS expenses_to_reimburse_idx ON public.expenses(spent_on)
    WHERE status = 'approved' AND paid_by = 'person' AND reimbursed_at IS NULL;
