-- Merge heirs into digital_inheritance: drop the separate heirs tables
DROP TABLE IF EXISTS public.heir_brands CASCADE;
DROP TABLE IF EXISTS public.heirs CASCADE;