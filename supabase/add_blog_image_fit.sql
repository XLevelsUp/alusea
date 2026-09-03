-- Adds a per-image cover/contain choice for blog post images.
-- Run this once against a database that already has create_blog_tables.sql applied.

ALTER TABLE public.blog_posts
    ADD COLUMN IF NOT EXISTS featured_image_fit TEXT NOT NULL DEFAULT 'cover'
        CHECK (featured_image_fit IN ('cover', 'contain'));

ALTER TABLE public.blog_posts
    ADD COLUMN IF NOT EXISTS second_image_fit TEXT NOT NULL DEFAULT 'cover'
        CHECK (second_image_fit IN ('cover', 'contain'));
