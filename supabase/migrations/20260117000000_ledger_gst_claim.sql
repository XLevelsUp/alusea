-- GST claim on manual ledger entries: the GST inside a money-out entry, counted as input tax only when the claim box was ticked.
-- An entry without a claim keeps tax_paise at 0 and never reaches the GST summary.

ALTER TABLE public.ledger_entries
    ADD COLUMN IF NOT EXISTS tax_paise BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_tax_within_amount;
ALTER TABLE public.ledger_entries
    ADD CONSTRAINT ledger_entries_tax_within_amount CHECK (tax_paise >= 0 AND tax_paise <= amount_paise);

-- Input tax credit only exists on money spent, so money-in entries cannot carry a claim.
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_tax_only_on_out;
ALTER TABLE public.ledger_entries
    ADD CONSTRAINT ledger_entries_tax_only_on_out CHECK (tax_paise = 0 OR direction = 'out');


-- ============================================================
-- GST SUMMARY
-- ============================================================
-- Input tax now adds the GST claimed on approved manual entries to the GST paid on approved expenses.
CREATE OR REPLACE VIEW public.gst_summary_monthly AS
WITH ledger_tax AS (
    SELECT date_trunc('month', l.entry_date)::DATE AS period_month, SUM(l.tax_paise)::BIGINT AS tax_paise
    FROM public.ledger_entries l
    WHERE l.status = 'approved' AND l.tax_paise > 0
    GROUP BY 1
),
months AS (
    SELECT period_month FROM public.revenue_monthly
    UNION
    SELECT period_month FROM public.expense_monthly_summary
    UNION
    SELECT period_month FROM ledger_tax
),
input_tax AS (
    SELECT period_month, SUM(tax_paise)::BIGINT AS tax_paise
    FROM (
        SELECT period_month, tax_paise FROM public.expense_monthly_summary
        UNION ALL
        SELECT period_month, tax_paise FROM ledger_tax
    ) paid
    GROUP BY 1
)
SELECT
    m.period_month,
    COALESCE(r.net_revenue_paise, 0) AS taxable_sales_paise,
    COALESCE(r.output_tax_paise, 0) AS output_tax_paise,
    COALESCE(i.tax_paise, 0) AS input_tax_paise,
    COALESCE(r.output_tax_paise, 0) - COALESCE(i.tax_paise, 0) AS net_tax_paise
FROM months m
LEFT JOIN public.revenue_monthly r ON r.period_month = m.period_month
LEFT JOIN input_tax i ON i.period_month = m.period_month;

ALTER VIEW public.gst_summary_monthly SET (security_invoker = true);
