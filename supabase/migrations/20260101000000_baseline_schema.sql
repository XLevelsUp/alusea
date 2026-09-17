-- Baseline: the schema as it stood in production before migrations were tracked. See docs/database.md.
-- Idempotent throughout, so it is safe to run against the existing database to bring it under version control.

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
CREATE POLICY "Allow public read access on categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON public.categories;
CREATE POLICY "Allow authenticated users to insert categories" ON public.categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON public.categories;
CREATE POLICY "Allow authenticated users to update categories" ON public.categories
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON public.categories;
CREATE POLICY "Allow authenticated users to delete categories" ON public.categories
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================
-- PRODUCTS
-- ============================================================
-- Reconstructed from application code: this table was created by hand in the Supabase dashboard and never had a migration.
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    image_urls TEXT[] DEFAULT '{}',
    specs JSONB DEFAULT '{}',
    price_per_sqft NUMERIC NOT NULL DEFAULT 1500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products(created_at DESC);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON public.products;
CREATE POLICY "Allow authenticated users to insert products" ON public.products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update products" ON public.products;
CREATE POLICY "Allow authenticated users to update products" ON public.products
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON public.products;
CREATE POLICY "Allow authenticated users to delete products" ON public.products
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================
-- PAGE MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page TEXT NOT NULL,
    section TEXT NOT NULL,
    title TEXT,
    description TEXT,
    action_text TEXT,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.page_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on page_media" ON public.page_media;
CREATE POLICY "Allow public read access on page_media" ON public.page_media
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert page_media" ON public.page_media;
CREATE POLICY "Allow authenticated users to insert page_media" ON public.page_media
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update page_media" ON public.page_media;
CREATE POLICY "Allow authenticated users to update page_media" ON public.page_media
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete page_media" ON public.page_media;
CREATE POLICY "Allow authenticated users to delete page_media" ON public.page_media
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================
-- BLOG CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on blog_categories" ON public.blog_categories;
CREATE POLICY "Allow public read access on blog_categories" ON public.blog_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert blog_categories" ON public.blog_categories;
CREATE POLICY "Allow authenticated users to insert blog_categories" ON public.blog_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update blog_categories" ON public.blog_categories;
CREATE POLICY "Allow authenticated users to update blog_categories" ON public.blog_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete blog_categories" ON public.blog_categories;
CREATE POLICY "Allow authenticated users to delete blog_categories" ON public.blog_categories
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================
-- BLOG POSTS
-- ============================================================
-- Fixed-template content lives in JSONB so the admin form can edit it without extra join tables. Shapes are documented in docs/database.md.
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,

    featured_image_url TEXT NOT NULL,
    featured_image_alt TEXT NOT NULL,
    featured_image_fit TEXT NOT NULL DEFAULT 'cover' CHECK (featured_image_fit IN ('cover', 'contain')),

    category TEXT NOT NULL REFERENCES public.blog_categories(name) ON UPDATE CASCADE,
    tags TEXT[] DEFAULT '{}',
    author TEXT NOT NULL DEFAULT 'Alusea Team',
    reading_time_minutes INTEGER NOT NULL DEFAULT 5,

    intro_html TEXT NOT NULL,

    second_image_url TEXT,
    second_image_alt TEXT,
    second_image_fit TEXT NOT NULL DEFAULT 'cover' CHECK (second_image_fit IN ('cover', 'contain')),

    sections JSONB NOT NULL DEFAULT '[]',
    qa JSONB NOT NULL DEFAULT '[]',
    cta JSONB NOT NULL DEFAULT '{}',

    published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON public.blog_posts(published_at DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on blog_posts" ON public.blog_posts;
CREATE POLICY "Allow public read access on blog_posts" ON public.blog_posts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert blog_posts" ON public.blog_posts;
CREATE POLICY "Allow authenticated users to insert blog_posts" ON public.blog_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update blog_posts" ON public.blog_posts;
CREATE POLICY "Allow authenticated users to update blog_posts" ON public.blog_posts
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete blog_posts" ON public.blog_posts;
CREATE POLICY "Allow authenticated users to delete blog_posts" ON public.blog_posts
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================
-- BLOG COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_comments_post_id_idx ON public.blog_comments(post_id);
CREATE INDEX IF NOT EXISTS blog_comments_status_idx ON public.blog_comments(status);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Visitors only ever see approved comments; the insert policy pins new rows to 'pending'.
DROP POLICY IF EXISTS "Allow public read access to approved blog_comments" ON public.blog_comments;
CREATE POLICY "Allow public read access to approved blog_comments" ON public.blog_comments
    FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Allow public insert on blog_comments" ON public.blog_comments;
CREATE POLICY "Allow public insert on blog_comments" ON public.blog_comments
    FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Allow authenticated users to read all blog_comments" ON public.blog_comments;
CREATE POLICY "Allow authenticated users to read all blog_comments" ON public.blog_comments
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update blog_comments" ON public.blog_comments;
CREATE POLICY "Allow authenticated users to update blog_comments" ON public.blog_comments
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete blog_comments" ON public.blog_comments;
CREATE POLICY "Allow authenticated users to delete blog_comments" ON public.blog_comments
    FOR DELETE USING (auth.role() = 'authenticated');
