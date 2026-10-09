-- Gives the developer role its access: everything an owner can do, plus the audit log, which becomes developer-only.
-- Also stops an owner from seeing, changing or creating developer accounts, and stops sign-up metadata from choosing a role.

-- ============================================================
-- A DEVELOPER COUNTS AS AN OWNER
-- ============================================================
-- One change here covers every existing policy that asks for 'owner', instead of rewriting each of them.
CREATE OR REPLACE FUNCTION public.has_role(VARIADIC allowed public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND is_active
          AND (role = ANY(allowed) OR (role = 'developer' AND 'owner' = ANY(allowed)))
    );
$$;


-- ============================================================
-- AUDIT LOG: DEVELOPER ONLY
-- ============================================================
DROP POLICY IF EXISTS "Owners read audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "Developers read audit_log" ON public.audit_log;
CREATE POLICY "Developers read audit_log" ON public.audit_log
    FOR SELECT TO authenticated USING (public.has_role('developer'));


-- ============================================================
-- PROFILES: OWNERS CANNOT SEE OR TOUCH DEVELOPER ACCOUNTS
-- ============================================================
-- has_role('owner') is true for a developer too, so the extra clause is what separates the two.
DROP POLICY IF EXISTS "Owners read all profiles" ON public.profiles;
CREATE POLICY "Owners read all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.has_role('owner') AND (role <> 'developer' OR public.has_role('developer')));

DROP POLICY IF EXISTS "Owners insert profiles" ON public.profiles;
CREATE POLICY "Owners insert profiles" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role('owner') AND (role <> 'developer' OR public.has_role('developer')));

-- USING hides developer rows from an owner's update; WITH CHECK stops an owner promoting anyone to developer.
DROP POLICY IF EXISTS "Owners update profiles" ON public.profiles;
CREATE POLICY "Owners update profiles" ON public.profiles
    FOR UPDATE TO authenticated
    USING (public.has_role('owner') AND (role <> 'developer' OR public.has_role('developer')))
    WITH CHECK (public.has_role('owner') AND (role <> 'developer' OR public.has_role('developer')));


-- ============================================================
-- NEW ACCOUNTS: ROLE COMES FROM SERVER-SET DATA ONLY
-- ============================================================
-- raw_user_meta_data is whatever the person signing up sends, so reading the role from it let a sign-up choose its own role.
-- raw_app_meta_data can only be written with the service key, which is what the Add User action uses.
-- Developer is never granted here at all: it is assigned by an existing developer, or once by hand in SQL.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_requested TEXT := NEW.raw_app_meta_data ->> 'role';
    v_role public.app_role := 'staff';
BEGIN
    IF v_requested IN ('owner', 'accounts', 'sales', 'hr', 'staff') THEN
        v_role := v_requested::public.app_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), v_role)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END $$;
