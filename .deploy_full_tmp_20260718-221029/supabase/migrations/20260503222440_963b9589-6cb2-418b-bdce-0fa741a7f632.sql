
CREATE TABLE public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_table TEXT NOT NULL,
  trigger_event TEXT NOT NULL DEFAULT 'insert',
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  run_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auto_select_own" ON public.automations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "auto_insert_own" ON public.automations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auto_update_own" ON public.automations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "auto_delete_own" ON public.automations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_automations_user ON public.automations(user_id);
CREATE INDEX idx_automations_enabled ON public.automations(enabled);

CREATE TRIGGER trg_automations_updated
BEFORE UPDATE ON public.automations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'success',
  payload JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "runs_select_own" ON public.automation_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "runs_insert_own" ON public.automation_runs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_automation_runs_auto ON public.automation_runs(automation_id, created_at DESC);
