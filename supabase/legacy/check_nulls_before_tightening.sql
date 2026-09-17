-- Read-only preflight for 20260101000300. Counts the rows that migration would backfill. All zeros means it only adds constraints and touches no data.
-- Safe to run any time; it writes nothing.

SELECT 'products.description'      AS column_name, count(*) AS null_rows FROM public.products        WHERE description IS NULL
UNION ALL SELECT 'products.image_urls',      count(*) FROM public.products        WHERE image_urls IS NULL
UNION ALL SELECT 'products.specs',           count(*) FROM public.products        WHERE specs IS NULL
UNION ALL SELECT 'products.created_at',      count(*) FROM public.products        WHERE created_at IS NULL
UNION ALL SELECT 'page_media.sort_order',    count(*) FROM public.page_media      WHERE sort_order IS NULL
UNION ALL SELECT 'page_media.created_at',    count(*) FROM public.page_media      WHERE created_at IS NULL
UNION ALL SELECT 'categories.sort_order',    count(*) FROM public.categories      WHERE sort_order IS NULL
UNION ALL SELECT 'categories.created_at',    count(*) FROM public.categories      WHERE created_at IS NULL
UNION ALL SELECT 'blog_categories.sort_order', count(*) FROM public.blog_categories WHERE sort_order IS NULL
UNION ALL SELECT 'blog_categories.created_at', count(*) FROM public.blog_categories WHERE created_at IS NULL
UNION ALL SELECT 'blog_posts.tags',          count(*) FROM public.blog_posts      WHERE tags IS NULL
UNION ALL SELECT 'blog_posts.published_at',  count(*) FROM public.blog_posts      WHERE published_at IS NULL
UNION ALL SELECT 'blog_posts.updated_at',    count(*) FROM public.blog_posts      WHERE updated_at IS NULL
UNION ALL SELECT 'blog_posts.created_at',    count(*) FROM public.blog_posts      WHERE created_at IS NULL
UNION ALL SELECT 'blog_comments.created_at', count(*) FROM public.blog_comments   WHERE created_at IS NULL
ORDER BY null_rows DESC, column_name;
