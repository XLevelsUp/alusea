-- Phases 6 and 7: employees and payroll. Salary is entered on each run rather than stored as a structure, per the decisions in docs/erp-implementation-plan.md.
-- Payslips freeze both the inputs and the computed outputs, so a reprinted payslip explains itself and cannot silently change.

-- ============================================================
-- ENUMS
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'worker_type') THEN
        CREATE TYPE public.worker_type AS ENUM ('monthly', 'daily');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_run_status') THEN
        CREATE TYPE public.payroll_run_status AS ENUM ('draft', 'approved', 'paid');
    END IF;
END $$;


-- ============================================================
-- EMPLOYEES
-- ============================================================
-- worker_type is the one payroll fact stored here, because it decides what the monthly amount means: 800 a day is not 800 a month.
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT '',

    worker_type public.worker_type NOT NULL DEFAULT 'monthly',
    -- Pre-fills the payroll row and stays editable there, so a month can differ without changing the default.
    default_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (default_amount_paise >= 0),

    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    joining_date DATE,

    bank_account_name TEXT NOT NULL DEFAULT '',
    bank_account_number TEXT NOT NULL DEFAULT '',
    bank_ifsc TEXT NOT NULL DEFAULT '',

    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS employees_active_idx ON public.employees(is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS employees_name_idx ON public.employees(full_name);

DROP TRIGGER IF EXISTS employees_touch_updated_at ON public.employees;
CREATE TRIGGER employees_touch_updated_at BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================
-- PAYROLL RUNS
-- ============================================================
-- One run per calendar month. period_month is stored as the first of the month so the unique constraint works on a plain date.
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    period_month DATE NOT NULL UNIQUE CHECK (EXTRACT(DAY FROM period_month) = 1),
    status public.payroll_run_status NOT NULL DEFAULT 'draft',

    -- Fixed 30-day divisor for monthly staff, per the agreed rule, kept per run so a later policy change does not rewrite history.
    days_in_period INTEGER NOT NULL DEFAULT 30 CHECK (days_in_period BETWEEN 1 AND 31),

    total_gross_paise BIGINT NOT NULL DEFAULT 0,
    total_net_paise BIGINT NOT NULL DEFAULT 0,
    employee_count INTEGER NOT NULL DEFAULT 0,

    notes TEXT NOT NULL DEFAULT '',

    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS payroll_runs_period_idx ON public.payroll_runs(period_month DESC);

DROP TRIGGER IF EXISTS payroll_runs_touch_updated_at ON public.payroll_runs;
CREATE TRIGGER payroll_runs_touch_updated_at BEFORE UPDATE ON public.payroll_runs
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================
-- PAYSLIPS
-- ============================================================
-- Stores the inputs as well as the outputs: the inputs make a payslip explainable ("30,000 / 30 x 26"), the frozen outputs mean a reprint never changes.
CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,

    -- Copied from the employee at generation time, so renaming someone later does not rewrite an old payslip.
    employee_code TEXT NOT NULL DEFAULT '',
    employee_name TEXT NOT NULL DEFAULT '',
    designation TEXT NOT NULL DEFAULT '',
    worker_type public.worker_type NOT NULL DEFAULT 'monthly',

    days_worked NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (days_worked >= 0 AND days_worked <= 31),
    entered_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (entered_amount_paise >= 0),

    base_paise BIGINT NOT NULL DEFAULT 0 CHECK (base_paise >= 0),
    overtime_paise BIGINT NOT NULL DEFAULT 0 CHECK (overtime_paise >= 0),
    bonus_paise BIGINT NOT NULL DEFAULT 0 CHECK (bonus_paise >= 0),

    gross_paise BIGINT NOT NULL DEFAULT 0,
    net_paise BIGINT NOT NULL DEFAULT 0,

    pdf_path TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT payslips_one_per_employee_per_run UNIQUE (run_id, employee_id),
    -- No deductions in this scope, so the two must agree; a mismatch means a calculation bug rather than a valid payslip.
    CONSTRAINT payslips_gross_equals_net CHECK (gross_paise = net_paise),
    CONSTRAINT payslips_components_sum CHECK (gross_paise = base_paise + overtime_paise + bonus_paise)
);

CREATE INDEX IF NOT EXISTS payslips_run_idx ON public.payslips(run_id);
CREATE INDEX IF NOT EXISTS payslips_employee_idx ON public.payslips(employee_id);

DROP TRIGGER IF EXISTS payslips_touch_updated_at ON public.payslips;
CREATE TRIGGER payslips_touch_updated_at BEFORE UPDATE ON public.payslips
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================
-- FREEZE APPROVED RUNS
-- ============================================================
-- An approved run is what people were actually paid, so its figures are frozen the way an issued invoice is.
CREATE OR REPLACE FUNCTION public.guard_approved_payroll()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IN ('approved', 'paid') AND NEW.status = 'draft' THEN
        RAISE EXCEPTION 'An approved payroll run cannot be reopened.';
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS payroll_runs_guard_approved ON public.payroll_runs;
CREATE TRIGGER payroll_runs_guard_approved BEFORE UPDATE ON public.payroll_runs
    FOR EACH ROW EXECUTE FUNCTION public.guard_approved_payroll();

CREATE OR REPLACE FUNCTION public.guard_approved_payslips()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status public.payroll_run_status;
    v_run UUID;
BEGIN
    v_run := COALESCE(NEW.run_id, OLD.run_id);
    SELECT status INTO v_status FROM public.payroll_runs WHERE id = v_run;

    -- The PDF path is written after approval, so that one column stays writable.
    IF v_status IN ('approved', 'paid') THEN
        IF TG_OP = 'UPDATE'
            AND NEW.gross_paise IS NOT DISTINCT FROM OLD.gross_paise
            AND NEW.net_paise IS NOT DISTINCT FROM OLD.net_paise
            AND NEW.base_paise IS NOT DISTINCT FROM OLD.base_paise
            AND NEW.days_worked IS NOT DISTINCT FROM OLD.days_worked
            AND NEW.entered_amount_paise IS NOT DISTINCT FROM OLD.entered_amount_paise
        THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'Payslips in an approved run cannot be changed.';
    END IF;

    RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS payslips_guard_approved ON public.payslips;
CREATE TRIGGER payslips_guard_approved BEFORE INSERT OR UPDATE OR DELETE ON public.payslips
    FOR EACH ROW EXECUTE FUNCTION public.guard_approved_payslips();


-- ============================================================
-- RLS
-- ============================================================
-- Payroll is the most sensitive data in the system: owner and hr only, with accounts able to see run totals but not individual pay.
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "HR reads employees" ON public.employees;
CREATE POLICY "HR reads employees" ON public.employees
    FOR SELECT TO authenticated USING (public.has_role('owner', 'hr'));

DROP POLICY IF EXISTS "HR writes employees" ON public.employees;
CREATE POLICY "HR writes employees" ON public.employees
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'hr'));

DROP POLICY IF EXISTS "HR updates employees" ON public.employees;
CREATE POLICY "HR updates employees" ON public.employees
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'hr')) WITH CHECK (public.has_role('owner', 'hr'));

-- No DELETE policy: employees are deactivated so their historical payslips keep a valid reference.

-- accounts can read run totals for cashflow, which is why this is wider than the payslip policy.
DROP POLICY IF EXISTS "Payroll runs readable by finance" ON public.payroll_runs;
CREATE POLICY "Payroll runs readable by finance" ON public.payroll_runs
    FOR SELECT TO authenticated USING (public.has_role('owner', 'hr', 'accounts'));

DROP POLICY IF EXISTS "HR writes payroll runs" ON public.payroll_runs;
CREATE POLICY "HR writes payroll runs" ON public.payroll_runs
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'hr'));

DROP POLICY IF EXISTS "HR updates payroll runs" ON public.payroll_runs;
CREATE POLICY "HR updates payroll runs" ON public.payroll_runs
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'hr')) WITH CHECK (public.has_role('owner', 'hr'));

DROP POLICY IF EXISTS "HR deletes draft payroll runs" ON public.payroll_runs;
CREATE POLICY "HR deletes draft payroll runs" ON public.payroll_runs
    FOR DELETE TO authenticated USING (public.has_role('owner', 'hr') AND status = 'draft');

-- Individual pay is narrower than run totals: accounts is deliberately excluded here.
DROP POLICY IF EXISTS "HR reads payslips" ON public.payslips;
CREATE POLICY "HR reads payslips" ON public.payslips
    FOR SELECT TO authenticated USING (public.has_role('owner', 'hr'));

DROP POLICY IF EXISTS "HR writes payslips" ON public.payslips;
CREATE POLICY "HR writes payslips" ON public.payslips
    FOR ALL TO authenticated USING (public.has_role('owner', 'hr')) WITH CHECK (public.has_role('owner', 'hr'));


-- ============================================================
-- SALARY HISTORY VIEW
-- ============================================================
-- Reads month-by-month pay out of existing payslips, so there is no separate salary history table to keep in step.
CREATE OR REPLACE VIEW public.employee_pay_history AS
SELECT
    p.employee_id,
    r.period_month,
    r.status AS run_status,
    p.worker_type,
    p.entered_amount_paise,
    p.days_worked,
    p.base_paise,
    p.overtime_paise,
    p.bonus_paise,
    p.net_paise
FROM public.payslips p
JOIN public.payroll_runs r ON r.id = p.run_id;

ALTER VIEW public.employee_pay_history SET (security_invoker = true);
