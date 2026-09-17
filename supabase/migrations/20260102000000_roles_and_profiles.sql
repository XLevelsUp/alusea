-- Phase 1: role-based access control. Adds a profile per auth user and the helper functions RLS policies use.
-- Existing users are promoted to owner at the end so nobody is locked out of an admin panel they already use.

-- ============================================================
-- ROLES
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('owner', 'accounts', 'sales', 'hr', 'staff');
    END IF;
END $$;


-- ============================================================
-- PROFILES
-- ============================================================
-- One row per auth.users row. Holds the role and the display name shown across the admin UI.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role public.app_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
-- SECURITY DEFINER so policies can read profiles without recursing through the profiles policies themselves.
-- search_path is pinned because SECURITY DEFINER functions otherwise inherit the caller's, which is a privilege-escalation path.
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(VARIADIC allowed public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_active AND role = ANY(allowed)
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active);
$$;

REVOKE EXECUTE ON FUNCTION public.auth_role() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(VARIADIC public.app_role[]) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM public, anon;

GRANT EXECUTE ON FUNCTION public.auth_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(VARIADIC public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;


-- ============================================================
-- PROFILE POLICIES
-- ============================================================
-- Everyone signed in reads their own profile; only owners see and manage the rest.
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Owners read all profiles" ON public.profiles;
CREATE POLICY "Owners read all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (public.has_role('owner'));

DROP POLICY IF EXISTS "Owners insert profiles" ON public.profiles;
CREATE POLICY "Owners insert profiles" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner'));

DROP POLICY IF EXISTS "Owners update profiles" ON public.profiles;
CREATE POLICY "Owners update profiles" ON public.profiles
    FOR UPDATE TO authenticated USING (public.has_role('owner')) WITH CHECK (public.has_role('owner'));

-- No DELETE policy: profiles are deactivated, never deleted, so payroll and audit history keep their author.


-- ============================================================
-- KEEP PROFILES IN STEP WITH auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Role comes from the invite metadata an owner sets; anyone arriving without it lands as staff, the lowest role.
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'staff')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.profiles SET email = NEW.email, updated_at = now() WHERE id = NEW.id;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.handle_user_email_change();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================
-- BACKFILL
-- ============================================================
-- Every account that exists before roles did was a full admin, so each becomes an owner rather than being locked out.
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data ->> 'full_name', ''), 'owner'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles SET role = 'owner' WHERE email = 'mahalaxmim860@gmail.com';

-- Fails the migration rather than leaving a database nobody can administer.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'owner' AND is_active) THEN
        RAISE EXCEPTION 'No active owner after backfill - aborting so the admin panel stays reachable';
    END IF;
END $$;
