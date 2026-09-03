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

INSERT INTO public.blog_categories (name, slug, sort_order) VALUES
    ('Windows', 'windows', 1),
    ('Doors', 'doors', 2),
    ('Sliding Systems', 'sliding-systems', 3),
    ('Aluminium Balustrade', 'aluminium-balustrade', 4),
    ('Commercial Curtain Wall', 'commercial-curtain-wall', 5),
    ('Modern Facade System', 'modern-facade-system', 6),
    ('Others', 'others', 7)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on blog_categories" ON public.blog_categories
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert blog_categories" ON public.blog_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update blog_categories" ON public.blog_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete blog_categories" ON public.blog_categories
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================
-- BLOG POSTS
-- ============================================================
-- Structured content lives in JSONB so the fixed template shape
-- (sections -> subsections, Q&A list, CTA buttons) can be edited
-- from the admin form without needing extra join tables:
--
-- sections: [{ heading: string, body_html: string, subsections: [{ heading: string, body_html: string }] }]
-- qa:       [{ question: string, answer: string }]
-- cta:      { intro: string, buttons: [{ label: string, href: string }] }
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

CREATE POLICY "Allow public read access on blog_posts" ON public.blog_posts
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert blog_posts" ON public.blog_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update blog_posts" ON public.blog_posts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete blog_posts" ON public.blog_posts
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================
-- BLOG COMMENTS (moderated)
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

-- Visitors can only ever see approved comments
CREATE POLICY "Allow public read access to approved blog_comments" ON public.blog_comments
    FOR SELECT USING (status = 'approved');

-- Anyone can submit a comment, but it always lands as 'pending'
-- (enforced server-side too — the insert action never trusts a client-supplied status)
CREATE POLICY "Allow public insert on blog_comments" ON public.blog_comments
    FOR INSERT WITH CHECK (status = 'pending');

-- Marketing/admin (authenticated) can see every comment regardless of status, for moderation
CREATE POLICY "Allow authenticated users to read all blog_comments" ON public.blog_comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update blog_comments" ON public.blog_comments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete blog_comments" ON public.blog_comments
    FOR DELETE USING (auth.role() = 'authenticated');
