
CREATE TABLE IF NOT EXISTS public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  table_name text NOT NULL,
  field text NOT NULL,
  operator text NOT NULL DEFAULT 'lt',
  threshold numeric NOT NULL,
  channel text NOT NULL DEFAULT 'in_app',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nr_owner_all" ON public.notification_rules FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE POLICY "brands_public_read" ON public.brands FOR SELECT
  USING (is_public = true);
