-- Adds the developer role. Kept in its own migration because Postgres will not let a new enum value be used in the same transaction that adds it.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
