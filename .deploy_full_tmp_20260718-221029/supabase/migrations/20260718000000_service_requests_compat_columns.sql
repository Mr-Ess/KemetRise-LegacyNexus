-- Ensure service_requests supports all website lead payload variants.
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS service_name text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS country text;
