-- Phase 3: private bucket for generated PDFs. Deliberately separate from the public alusea-assets bucket, since an invoice or payslip must never be readable by URL alone.
-- Files are reached through short-lived signed URLs created server-side after a role check.

INSERT INTO storage.buckets (id, name, public)
VALUES ('alusea-documents', 'alusea-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Paths are <kind>/<id>/<filename>, for example invoices/<uuid>/ALU-2026-27-0001.pdf, so the first path segment carries the access rule.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Accounts read financial documents') THEN
        CREATE POLICY "Accounts read financial documents" ON storage.objects
            FOR SELECT TO authenticated
            USING (
                bucket_id = 'alusea-documents'
                AND (storage.foldername(name))[1] IN ('invoices', 'quotes', 'expenses')
                AND public.has_role('owner', 'accounts', 'sales')
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'HR reads payroll documents') THEN
        CREATE POLICY "HR reads payroll documents" ON storage.objects
            FOR SELECT TO authenticated
            USING (
                bucket_id = 'alusea-documents'
                AND (storage.foldername(name))[1] = 'payslips'
                AND public.has_role('owner', 'hr')
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ERP users write documents') THEN
        CREATE POLICY "ERP users write documents" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (
                bucket_id = 'alusea-documents'
                AND public.has_role('owner', 'accounts', 'sales', 'hr')
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'ERP users replace documents') THEN
        CREATE POLICY "ERP users replace documents" ON storage.objects
            FOR UPDATE TO authenticated
            USING (
                bucket_id = 'alusea-documents'
                AND public.has_role('owner', 'accounts', 'sales', 'hr')
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Owners delete documents') THEN
        CREATE POLICY "Owners delete documents" ON storage.objects
            FOR DELETE TO authenticated
            USING (bucket_id = 'alusea-documents' AND public.has_role('owner'));
    END IF;
END $$;
