-- Records who approved and who paid each payroll run. The run already stores when (approved_at, paid_at) and who generated it (created_by).

ALTER TABLE public.payroll_runs
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
