-- Add missing created_at / updated_at columns to CMS tables that lack them

ALTER TABLE public.website_faqs
  ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

ALTER TABLE public.website_stats
  ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

ALTER TABLE public.website_plans
  ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

ALTER TABLE public.website_contact_submissions
  ADD COLUMN IF NOT EXISTS sort_order  int DEFAULT 0;

ALTER TABLE public.website_settings
  ADD COLUMN IF NOT EXISTS sort_order  int DEFAULT 0;

ALTER TABLE public.website_testimonials
  ADD COLUMN IF NOT EXISTS sort_order  int DEFAULT 0;
