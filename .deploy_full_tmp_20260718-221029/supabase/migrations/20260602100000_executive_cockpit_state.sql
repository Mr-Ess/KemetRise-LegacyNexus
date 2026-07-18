-- ============================================================
-- Executive Cockpit State Table
-- Run this in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.executive_cockpit_state (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name      text NOT NULL,
  department_code    text NOT NULL,
  current_status     text NOT NULL DEFAULT 'idle'
                     CHECK (current_status IN ('active','idle','warning','error','maintenance')),
  active_agent_id    uuid REFERENCES public.agent_logs(id) ON DELETE SET NULL,
  last_update        timestamptz NOT NULL DEFAULT now(),
  health_score       smallint NOT NULL DEFAULT 100
                     CHECK (health_score BETWEEN 0 AND 100),
  last_error_message text,
  CONSTRAINT executive_cockpit_dept_code_uq UNIQUE (department_code)
);

-- Ensure constraint exists even if table was created previously without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'executive_cockpit_dept_code_uq'
      AND conrelid = 'public.executive_cockpit_state'::regclass
  ) THEN
    ALTER TABLE public.executive_cockpit_state
      ADD CONSTRAINT executive_cockpit_dept_code_uq UNIQUE (department_code);
  END IF;
END;
$$;

-- Seed the 19 departments
INSERT INTO public.executive_cockpit_state
  (workflow_name, department_code, current_status, health_score)
VALUES
  ('Brands Hub',            'BRANDS',       'active', 100),
  ('Customers & CRM',       'CRM',          'active', 100),
  ('Finance & Revenue',     'FINANCE',      'active', 100),
  ('Operations Hub',        'OPS',          'active', 100),
  ('Marketing Campaigns',   'MARKETING',    'idle',   100),
  ('Human Resources',       'HR',           'active', 100),
  ('Logistics',             'LOGISTICS',    'active', 100),
  ('Inventory & Materials', 'INVENTORY',    'active', 100),
  ('Projects',              'PROJECTS',     'active', 100),
  ('Services',              'SERVICES',     'active', 100),
  ('Affiliates',            'AFFILIATES',   'active', 100),
  ('AI Agents',             'AI_AGENTS',    'active', 100),
  ('Legal Vault',           'LEGAL',        'idle',   100),
  ('Security & Audit',      'SECURITY',     'active', 100),
  ('Developer Hub',         'DEV',          'active', 100),
  ('Digital Inheritance',   'INHERITANCE',  'idle',   100),
  ('Artistic Production',   'ARTISTIC',     'idle',   100),
  ('Marketplace',           'MARKETPLACE',  'active', 100),
  ('Success Partners',      'PARTNERS',     'active', 100)
ON CONFLICT ON CONSTRAINT executive_cockpit_dept_code_uq DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.executive_cockpit_state ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users of the same tenant can read
DROP POLICY IF EXISTS "authenticated_read_cockpit" ON public.executive_cockpit_state;
CREATE POLICY "authenticated_read_cockpit"
  ON public.executive_cockpit_state
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: only service_role (backend / Edge Functions) can write
DROP POLICY IF EXISTS "service_role_write_cockpit" ON public.executive_cockpit_state;
CREATE POLICY "service_role_write_cockpit"
  ON public.executive_cockpit_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for this table (required for supabase.channel to work)
-- Run this separately if the above doesn't enable it automatically:
--   ALTER TABLE public.executive_cockpit_state REPLICA IDENTITY FULL;
ALTER TABLE public.executive_cockpit_state REPLICA IDENTITY FULL;

-- Function + Trigger: auto-update last_update on any row change
CREATE OR REPLACE FUNCTION public.cockpit_touch_last_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_update = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cockpit_last_update ON public.executive_cockpit_state;
CREATE TRIGGER trg_cockpit_last_update
  BEFORE UPDATE ON public.executive_cockpit_state
  FOR EACH ROW EXECUTE FUNCTION public.cockpit_touch_last_update();
