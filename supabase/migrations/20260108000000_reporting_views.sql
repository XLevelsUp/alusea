-- Phase 8: reporting views. Aggregation happens in SQL rather than in the app, so the dashboard stays fast and the definition of each figure lives in one place.
-- Every view is security_invoker, so the caller's RLS still applies: accounts sees payroll totals, staff sees only their own expenses.

-- ============================================================
-- REVENUE BY MONTH
-- ============================================================
-- Issued invoices only. Drafts are not revenue, and cancelled invoices never were.
CREATE OR REPLACE VIEW public.revenue_monthly AS
SELECT
    date_trunc('month', i.issue_date)::DATE AS period_month,
    COUNT(*)::INTEGER AS invoice_count,
    SUM(i.subtotal_paise)::BIGINT AS net_revenue_paise,
    SUM(i.igst_paise + i.cgst_paise + i.sgst_paise)::BIGINT AS output_tax_paise,
    SUM(i.total_paise)::BIGINT AS gross_revenue_paise
FROM public.invoices i
WHERE i.status = 'issued'
GROUP BY 1;

ALTER VIEW public.revenue_monthly SET (security_invoker = true);


-- ============================================================
-- COLLECTIONS BY MONTH
-- ============================================================
-- Money actually received, which is a different question from revenue billed.
CREATE OR REPLACE VIEW public.collections_monthly AS
SELECT
    date_trunc('month', p.paid_on)::DATE AS period_month,
    COUNT(*)::INTEGER AS payment_count,
    SUM(p.amount_paise)::BIGINT AS collected_paise
FROM public.payments p
GROUP BY 1;

ALTER VIEW public.collections_monthly SET (security_invoker = true);


-- ============================================================
-- PAYROLL COST BY MONTH
-- ============================================================
-- Approved and paid runs only; a draft run is not yet a committed cost.
CREATE OR REPLACE VIEW public.payroll_monthly AS
SELECT
    r.period_month,
    r.status,
    r.employee_count,
    r.total_net_paise AS payroll_paise
FROM public.payroll_runs r
WHERE r.status IN ('approved', 'paid');

ALTER VIEW public.payroll_monthly SET (security_invoker = true);


-- ============================================================
-- PROFIT AND LOSS
-- ============================================================
-- Revenue is net of output GST, and expenses net of input GST, because tax collected and tax paid are not income or cost.
-- Months with any activity appear, so a month with expenses but no invoices is still visible.
CREATE OR REPLACE VIEW public.profit_and_loss_monthly AS
WITH months AS (
    SELECT period_month FROM public.revenue_monthly
    UNION
    SELECT period_month FROM public.expense_monthly_summary
    UNION
    SELECT period_month FROM public.payroll_monthly
),
expenses AS (
    SELECT
        period_month,
        SUM(total_paise)::BIGINT AS gross_paise,
        SUM(tax_paise)::BIGINT AS tax_paise
    FROM public.expense_monthly_summary
    GROUP BY 1
),
payroll AS (
    SELECT period_month, SUM(payroll_paise)::BIGINT AS payroll_paise
    FROM public.payroll_monthly
    GROUP BY 1
)
SELECT
    m.period_month,
    COALESCE(r.net_revenue_paise, 0) AS revenue_paise,
    COALESCE(r.output_tax_paise, 0) AS output_tax_paise,
    COALESCE(e.gross_paise - e.tax_paise, 0) AS expenses_paise,
    COALESCE(e.tax_paise, 0) AS input_tax_paise,
    COALESCE(p.payroll_paise, 0) AS payroll_paise,
    COALESCE(r.net_revenue_paise, 0)
        - COALESCE(e.gross_paise - e.tax_paise, 0)
        - COALESCE(p.payroll_paise, 0) AS profit_paise
FROM months m
LEFT JOIN public.revenue_monthly r ON r.period_month = m.period_month
LEFT JOIN expenses e ON e.period_month = m.period_month
LEFT JOIN payroll p ON p.period_month = m.period_month;

ALTER VIEW public.profit_and_loss_monthly SET (security_invoker = true);


-- ============================================================
-- GST SUMMARY
-- ============================================================
-- Output tax charged against input tax paid. The difference is the rough liability, for the accountant to verify rather than to file directly.
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


-- ============================================================
-- RECEIVABLES AGEING
-- ============================================================
-- Buckets unpaid balances by how long they have been outstanding, which is the question "who owes us and for how long".
CREATE OR REPLACE VIEW public.receivables_ageing AS
SELECT
    b.party_id,
    b.invoice_id,
    b.invoice_number,
    b.issue_date,
    b.due_date,
    b.balance_paise,
    CASE
        WHEN b.due_date IS NULL THEN 'current'
        WHEN CURRENT_DATE <= b.due_date THEN 'current'
        WHEN CURRENT_DATE - b.due_date <= 30 THEN '1_30'
        WHEN CURRENT_DATE - b.due_date <= 60 THEN '31_60'
        WHEN CURRENT_DATE - b.due_date <= 90 THEN '61_90'
        ELSE 'over_90'
    END::TEXT AS ageing_bucket
FROM public.invoice_balances b
WHERE b.status = 'issued' AND b.balance_paise > 0;

ALTER VIEW public.receivables_ageing SET (security_invoker = true);
