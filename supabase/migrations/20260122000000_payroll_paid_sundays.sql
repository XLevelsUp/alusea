-- Monthly staff are now paid salary ÷ 30.5 for each day worked plus each Sunday of the month. The Sundays paid are kept on the payslip so it always shows how its amount was reached.
-- Left empty on payslips made before this rule, which keep the amounts and the wording they were approved with.
ALTER TABLE public.payslips
    ADD COLUMN IF NOT EXISTS paid_sundays INTEGER CHECK (paid_sundays BETWEEN 0 AND 5);
