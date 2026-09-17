-- Aligns the schema with what the apps have always assumed: these columns are read as non-null everywhere and have no null-handling in the UI.
-- Backfills first so the NOT NULL constraints can be applied to existing rows.

-- products.description renders directly in catalogue cards and is sent to Meta's catalog, which rejects a null description.
UPDATE public.products SET description = '' WHERE description IS NULL;
ALTER TABLE public.products ALTER COLUMN description SET DEFAULT '';
ALTER TABLE public.products ALTER COLUMN description SET NOT NULL;

UPDATE public.products SET image_urls = '{}' WHERE image_urls IS NULL;
ALTER TABLE public.products ALTER COLUMN image_urls SET NOT NULL;

UPDATE public.products SET specs = '{}' WHERE specs IS NULL;
ALTER TABLE public.products ALTER COLUMN specs SET NOT NULL;

UPDATE public.products SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.products ALTER COLUMN created_at SET NOT NULL;

-- page_media.sort_order drives ordering in the media manager and is read as a number.
UPDATE public.page_media SET sort_order = 0 WHERE sort_order IS NULL;
ALTER TABLE public.page_media ALTER COLUMN sort_order SET NOT NULL;

UPDATE public.page_media SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.page_media ALTER COLUMN created_at SET NOT NULL;

UPDATE public.categories SET sort_order = 0 WHERE sort_order IS NULL;
ALTER TABLE public.categories ALTER COLUMN sort_order SET NOT NULL;

UPDATE public.categories SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.categories ALTER COLUMN created_at SET NOT NULL;

UPDATE public.blog_categories SET sort_order = 0 WHERE sort_order IS NULL;
ALTER TABLE public.blog_categories ALTER COLUMN sort_order SET NOT NULL;

UPDATE public.blog_categories SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.blog_categories ALTER COLUMN created_at SET NOT NULL;

UPDATE public.blog_posts SET tags = '{}' WHERE tags IS NULL;
ALTER TABLE public.blog_posts ALTER COLUMN tags SET NOT NULL;

UPDATE public.blog_posts SET published_at = now() WHERE published_at IS NULL;
ALTER TABLE public.blog_posts ALTER COLUMN published_at SET NOT NULL;

UPDATE public.blog_posts SET updated_at = now() WHERE updated_at IS NULL;
ALTER TABLE public.blog_posts ALTER COLUMN updated_at SET NOT NULL;

UPDATE public.blog_posts SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.blog_posts ALTER COLUMN created_at SET NOT NULL;

UPDATE public.blog_comments SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.blog_comments ALTER COLUMN created_at SET NOT NULL;
