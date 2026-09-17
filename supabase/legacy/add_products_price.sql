-- Adds a starting price for the Meta Commerce Catalog (WhatsApp product
-- catalog) integration. Alusea prices per project, not per fixed unit, so
-- this is a flat "starting from" floor price in INR per square foot,
-- applied uniformly across all products rather than a real fixed price.
--
-- Run this once against a database that already has the products table.

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS price_per_sqft NUMERIC NOT NULL DEFAULT 1500;
