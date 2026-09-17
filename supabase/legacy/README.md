# Legacy SQL (historical reference only)

These are the ad-hoc `.sql` files that were run by hand against the Supabase
SQL Editor before migrations were tracked. They have all been folded into
`supabase/migrations/20260101000000_baseline_schema.sql` and its two
companions.

**Do not run these files.** They are kept only so the origin of the baseline
is auditable, and because the two blog seed files contain written content that
would be tedious to recover if it were ever needed again.

| File | Where it went |
|---|---|
| `create_categories_table.sql` | baseline schema + reference data |
| `create_page_media_table.sql` | baseline schema |
| `create_blog_tables.sql` | baseline schema + reference data |
| `add_blog_image_fit.sql` | folded into the `blog_posts` definition |
| `add_products_price.sql` | folded into the `products` definition |
| `setup_storage.sql` | baseline storage |
| `seed_products.sql` | **not replayed** — sample content, superseded by real data |
| `create_blog_posts_seed.sql` | **not replayed** — content seed |
| `create_blog_posts_seed_2.sql` | **not replayed** — content seed |

Note that no file here ever created the `products` table — it was made by hand
in the Supabase dashboard. Its definition in the baseline was reconstructed
from application code, which is why `docs/database.md` asks you to verify it
against production before trusting it.
