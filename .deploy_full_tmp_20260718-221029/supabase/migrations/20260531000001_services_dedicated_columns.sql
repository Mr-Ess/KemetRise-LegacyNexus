-- Add dedicated columns to services table so all form fields are stored
-- as proper queryable columns (not just buried in the JSONB data blob).

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS price TEXT,
  ADD COLUMN IF NOT EXISTS human_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsible_person TEXT;

-- Backfill from existing JSONB data
UPDATE public.services
SET
  description      = COALESCE(description,      (data->>'description')::TEXT),
  category         = COALESCE(category,          (data->>'category')::TEXT),
  price            = COALESCE(price,             (data->>'price')::TEXT),
  human_count      = COALESCE(human_count,       (data->>'humanCount')::INTEGER, 0),
  ai_count         = COALESCE(ai_count,          (data->>'aiCount')::INTEGER,    0),
  responsible_person = COALESCE(responsible_person, (data->>'responsiblePerson')::TEXT)
WHERE data IS NOT NULL AND data != '{}'::jsonb;

-- Indexes for common filter/search queries
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_human_count ON public.services(human_count);
CREATE INDEX IF NOT EXISTS idx_services_ai_count ON public.services(ai_count);
