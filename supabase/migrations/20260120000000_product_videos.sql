-- Product films: each product can carry videos alongside its photos, shown in the same gallery on the website.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_urls TEXT[] NOT NULL DEFAULT '{}';
