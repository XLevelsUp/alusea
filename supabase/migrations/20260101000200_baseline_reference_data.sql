-- Baseline: reference rows the apps expect to exist. Content seeds (products, blog posts) stay in supabase/legacy and are not replayed.

INSERT INTO public.categories (name, sort_order) VALUES
    ('Windows', 1),
    ('Doors', 2),
    ('Sliding Systems', 3),
    ('Specialty', 4)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.blog_categories (name, slug, sort_order) VALUES
    ('Windows', 'windows', 1),
    ('Doors', 'doors', 2),
    ('Sliding Systems', 'sliding-systems', 3),
    ('Aluminium Balustrade', 'aluminium-balustrade', 4),
    ('Commercial Curtain Wall', 'commercial-curtain-wall', 5),
    ('Modern Facade System', 'modern-facade-system', 6),
    ('Others', 'others', 7)
ON CONFLICT (name) DO NOTHING;
