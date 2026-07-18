-- Fix: add created_at to tables that are missing it
-- These tables are queried by extApi which defaults to ORDER BY created_at

ALTER TABLE public.inventory         ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.affiliated_agents ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.import_export     ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.assets_management ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Also ensure commonly queried columns exist
ALTER TABLE public.affiliated_agents ADD COLUMN IF NOT EXISTS status       text DEFAULT 'active';
ALTER TABLE public.affiliated_agents ADD COLUMN IF NOT EXISTS affiliate_id uuid;
ALTER TABLE public.affiliated_agents ADD COLUMN IF NOT EXISTS notes        text;

-- Index for affiliated_agents lookups
CREATE INDEX IF NOT EXISTS idx_affiliated_agents_status ON public.affiliated_agents(status);
