-- Finances no longer loads the whole ledger: it loads the months on screen and asks the database for the balance carried in.
-- This returns money in minus money out for every ledger movement before a date, so the running balance still starts from the right figure.

CREATE OR REPLACE FUNCTION public.ledger_balance_before(p_before DATE)
RETURNS BIGINT
LANGUAGE sql
STABLE
-- Runs as the caller, so it adds up only what that person's row-level rules let them read, exactly like the view itself.
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount_paise ELSE -amount_paise END), 0)::BIGINT
    FROM public.general_ledger
    WHERE entry_date < p_before;
$$;

REVOKE ALL ON FUNCTION public.ledger_balance_before(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ledger_balance_before(DATE) TO authenticated;
