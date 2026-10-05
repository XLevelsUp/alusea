-- GST claim as a tick box, as in the reference: a yes/no mark on each purchase saying its input credit has been claimed.
-- It is a checklist so nothing is missed or claimed twice at filing time; it carries no amount and changes no report.
-- NOT NULL DEFAULT false keeps it to two states, so every existing row starts as "not yet claimed".

ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS gst_claim BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.ledger_entries
    ADD COLUMN IF NOT EXISTS gst_claim BOOLEAN NOT NULL DEFAULT false;


-- ============================================================
-- REPLACES THE AMOUNT-BASED CLAIM
-- ============================================================
-- The previous migration stored a GST amount on manual entries and added it to input tax; the tick box replaces that.
-- The GST summary goes back to reading approved expenses only, and must be restored before the column it read is dropped.
CREATE OR REPLACE VIEW public.gst_summary_monthly AS
WITH months AS (
    SELECT period_month FROM public.revenue_monthly
    UNION
    SELECT period_month FROM public.expense_monthly_summary
),
input_tax AS (
    SELECT period_month, SUM(tax_paise)::BIGINT AS tax_paise
    FROM public.expense_monthly_summary
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

-- Any entry that already had an amount claimed keeps its claim as a tick.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ledger_entries' AND column_name = 'tax_paise'
    ) THEN
        UPDATE public.ledger_entries SET gst_claim = true WHERE tax_paise > 0;
    END IF;
END $$;

ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_tax_within_amount;
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_tax_only_on_out;
ALTER TABLE public.ledger_entries DROP COLUMN IF EXISTS tax_paise;

-- Input credit only exists on money spent, so a money-in entry can never be ticked.
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_gst_claim_only_on_out;
ALTER TABLE public.ledger_entries
    ADD CONSTRAINT ledger_entries_gst_claim_only_on_out CHECK (NOT gst_claim OR direction = 'out');
