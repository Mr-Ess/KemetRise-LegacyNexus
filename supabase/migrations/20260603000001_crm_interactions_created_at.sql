-- Add created_at to crm_interactions (was originally created with interaction_date only)
ALTER TABLE public.crm_interactions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill: set created_at = interaction_date for existing rows
UPDATE public.crm_interactions
  SET created_at = interaction_date
  WHERE created_at IS DISTINCT FROM interaction_date
    AND interaction_date IS NOT NULL;
