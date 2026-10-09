-- Aadhaar card scan per employee, kept in the private documents bucket under employees/<id>/ and never exposed by public URL.
-- Required by the app for every new employee; nullable only because employees added before this migration have none yet.

ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS aadhaar_path TEXT,
    ADD COLUMN IF NOT EXISTS aadhaar_file_name TEXT;

-- Identity documents are narrower than financial ones: only owner and HR, the same people who manage employees, can read them.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'HR reads employee documents') THEN
        CREATE POLICY "HR reads employee documents" ON storage.objects
            FOR SELECT TO authenticated
            USING (
                bucket_id = 'alusea-documents'
                AND (storage.foldername(name))[1] = 'employees'
                AND public.has_role('owner', 'hr')
            );
    END IF;

    -- HR replaces an old scan when uploading a new one, so it needs delete on this folder, not only owners.
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'HR deletes employee documents') THEN
        CREATE POLICY "HR deletes employee documents" ON storage.objects
            FOR DELETE TO authenticated
            USING (
                bucket_id = 'alusea-documents'
                AND (storage.foldername(name))[1] = 'employees'
                AND public.has_role('owner', 'hr')
            );
    END IF;
END $$;
