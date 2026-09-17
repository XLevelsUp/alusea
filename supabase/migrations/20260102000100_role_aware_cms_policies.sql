-- Phase 1: replaces "any authenticated user can write anything" with role-aware policies on the CMS tables.
-- Public SELECT stays as-is: the marketing site reads these anonymously and must keep working.

-- Content roles: owner and sales manage the catalogue and blog. accounts and hr get no write access to marketing content.

-- ============================================================
-- CATEGORIES
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON public.categories;

CREATE POLICY "Content managers insert categories" ON public.categories
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers update categories" ON public.categories
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'sales')) WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers delete categories" ON public.categories
    FOR DELETE TO authenticated USING (public.has_role('owner', 'sales'));


-- ============================================================
-- PRODUCTS
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON public.products;

CREATE POLICY "Content managers insert products" ON public.products
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers update products" ON public.products
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'sales')) WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers delete products" ON public.products
    FOR DELETE TO authenticated USING (public.has_role('owner', 'sales'));


-- ============================================================
-- PAGE MEDIA
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to insert page_media" ON public.page_media;
DROP POLICY IF EXISTS "Allow authenticated users to update page_media" ON public.page_media;
DROP POLICY IF EXISTS "Allow authenticated users to delete page_media" ON public.page_media;

CREATE POLICY "Content managers insert page_media" ON public.page_media
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers update page_media" ON public.page_media
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'sales')) WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers delete page_media" ON public.page_media
    FOR DELETE TO authenticated USING (public.has_role('owner', 'sales'));


-- ============================================================
-- BLOG CATEGORIES
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to insert blog_categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Allow authenticated users to update blog_categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete blog_categories" ON public.blog_categories;

CREATE POLICY "Content managers insert blog_categories" ON public.blog_categories
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers update blog_categories" ON public.blog_categories
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'sales')) WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers delete blog_categories" ON public.blog_categories
    FOR DELETE TO authenticated USING (public.has_role('owner', 'sales'));


-- ============================================================
-- BLOG POSTS
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to insert blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to update blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to delete blog_posts" ON public.blog_posts;

CREATE POLICY "Content managers insert blog_posts" ON public.blog_posts
    FOR INSERT TO authenticated WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers update blog_posts" ON public.blog_posts
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'sales')) WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers delete blog_posts" ON public.blog_posts
    FOR DELETE TO authenticated USING (public.has_role('owner', 'sales'));


-- ============================================================
-- BLOG COMMENTS
-- ============================================================
-- Public insert stays: visitors submit comments, pinned to 'pending' by the existing policy.
DROP POLICY IF EXISTS "Allow authenticated users to read all blog_comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Allow authenticated users to update blog_comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Allow authenticated users to delete blog_comments" ON public.blog_comments;

CREATE POLICY "Content managers read all blog_comments" ON public.blog_comments
    FOR SELECT TO authenticated USING (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers update blog_comments" ON public.blog_comments
    FOR UPDATE TO authenticated USING (public.has_role('owner', 'sales')) WITH CHECK (public.has_role('owner', 'sales'));

CREATE POLICY "Content managers delete blog_comments" ON public.blog_comments
    FOR DELETE TO authenticated USING (public.has_role('owner', 'sales'));


-- ============================================================
-- STORAGE
-- ============================================================
-- Uploads are how content gets images, so the same content roles apply. Public read stays for the marketing site.
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

CREATE POLICY "Content managers can upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'alusea-assets' AND public.has_role('owner', 'sales'));

CREATE POLICY "Content managers can update objects" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'alusea-assets' AND public.has_role('owner', 'sales'));

CREATE POLICY "Content managers can delete objects" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'alusea-assets' AND public.has_role('owner', 'sales'));
