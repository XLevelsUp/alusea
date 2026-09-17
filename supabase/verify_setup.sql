-- Read-only check that every migration applied correctly. Writes nothing, safe to run any time.
-- Every row should say PASS. Anything else names what is missing.

-- ============================================================
-- 1. TABLES
-- ============================================================
SELECT
    'Tables' AS check_name,
    CASE WHEN COUNT(*) = 20 THEN 'PASS' ELSE 'FAIL - expected 20, found ' || COUNT(*) END AS result,
    string_agg(tablename, ', ' ORDER BY tablename) AS detail
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'categories', 'products', 'page_media', 'blog_categories', 'blog_posts', 'blog_comments',
    'profiles', 'company_profile', 'parties', 'tax_rates', 'document_series',
    'quotes', 'quote_items', 'invoices', 'invoice_items', 'payments',
    'employees', 'payroll_runs', 'payslips', 'expenses'
  )

UNION ALL

-- ============================================================
-- 2. VIEWS
-- ============================================================
SELECT
    'Views',
    CASE WHEN COUNT(*) = 10 THEN 'PASS' ELSE 'FAIL - expected 10, found ' || COUNT(*) END,
    string_agg(viewname, ', ' ORDER BY viewname)
FROM pg_views
WHERE schemaname = 'public'

UNION ALL

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
-- Every ERP table must have RLS on. A table without it is readable by anyone with the anon key.
SELECT
    'RLS enabled',
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL - ' || COUNT(*) || ' table(s) unprotected' END,
    COALESCE(string_agg(relname, ', ' ORDER BY relname), 'all protected')
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
  AND c.relname IN (
    'profiles', 'company_profile', 'parties', 'tax_rates', 'document_series',
    'quotes', 'quote_items', 'invoices', 'invoice_items', 'payments',
    'employees', 'payroll_runs', 'payslips', 'expenses', 'expense_categories',
    'expense_attachments', 'audit_log'
  )

UNION ALL

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================
SELECT
    'Role functions',
    CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL - found ' || COUNT(*) END,
    string_agg(proname, ', ' ORDER BY proname)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('auth_role', 'has_role', 'is_active_user')

UNION ALL

SELECT
    'Numbering functions',
    CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL - found ' || COUNT(*) END,
    string_agg(proname, ', ' ORDER BY proname)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('allocate_document_number', 'peek_document_number', 'financial_year_of')

UNION ALL

-- ============================================================
-- 5. AUDIT TRIGGERS
-- ============================================================
SELECT
    'Audit triggers',
    CASE WHEN COUNT(*) = 14 THEN 'PASS' ELSE 'FAIL - expected 14, found ' || COUNT(*) END,
    COUNT(*) || ' tables audited'
FROM pg_trigger
WHERE tgname LIKE 'audit_%' AND NOT tgisinternal

UNION ALL

-- ============================================================
-- 6. FREEZE TRIGGERS
-- ============================================================
-- These are what stop an issued invoice or approved payroll run being edited.
SELECT
    'Freeze triggers',
    CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL - found ' || COUNT(*) END,
    string_agg(tgname, ', ' ORDER BY tgname)
FROM pg_trigger
WHERE tgname IN (
    'invoices_guard_issued', 'invoice_items_guard_issued',
    'payroll_runs_guard_approved', 'payslips_guard_approved',
    'expenses_guard_approved'
  )
  AND NOT tgisinternal

UNION ALL

-- ============================================================
-- 7. STORAGE BUCKETS
-- ============================================================
-- alusea-documents must be private: invoices and payslips live in it.
SELECT
    'Documents bucket private',
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'alusea-documents') THEN 'FAIL - bucket missing'
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'alusea-documents' AND public) THEN 'FAIL - bucket is PUBLIC'
        ELSE 'PASS'
    END,
    'alusea-documents'

UNION ALL

-- ============================================================
-- 8. SEED DATA
-- ============================================================
SELECT
    'Expense categories',
    CASE WHEN COUNT(*) >= 11 THEN 'PASS' ELSE 'FAIL - found ' || COUNT(*) END,
    COUNT(*) || ' categories'
FROM public.expense_categories

UNION ALL

SELECT
    'Tax rates',
    CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL - found ' || COUNT(*) END,
    COUNT(*) || ' rates'
FROM public.tax_rates

UNION ALL

-- ============================================================
-- 9. OWNER ACCOUNT
-- ============================================================
-- Without an active owner, nobody can reach settings or user management.
SELECT
    'Active owner exists',
    CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL - you are locked out of settings' END,
    COALESCE(string_agg(email, ', '), 'none')
FROM public.profiles
WHERE role = 'owner' AND is_active

UNION ALL

-- ============================================================
-- 10. COMPANY PROFILE
-- ============================================================
-- Issuing an invoice is blocked without a legal name, and the tax split needs a state code.
SELECT
    'Company profile',
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM public.company_profile WHERE id = 1) THEN 'FAIL - row missing'
        WHEN EXISTS (SELECT 1 FROM public.company_profile WHERE id = 1 AND legal_name = '') THEN 'TODO - legal name is blank'
        WHEN EXISTS (SELECT 1 FROM public.company_profile WHERE id = 1 AND state_code = '') THEN 'TODO - state not set'
        ELSE 'PASS'
    END,
    COALESCE((SELECT NULLIF(legal_name, '') FROM public.company_profile WHERE id = 1), 'not filled in yet')

UNION ALL

-- ============================================================
-- 11. INTEGRITY
-- ============================================================
SELECT
    'Data integrity',
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL - ' || COUNT(*) || ' issue(s)' END,
    COALESCE(string_agg(issue, '; '), 'nothing broken')
FROM public.integrity_issues

ORDER BY 1;
