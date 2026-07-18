
-- 1) Login History
CREATE TABLE public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  location TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY lh_select_own ON public.login_history FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY lh_insert_own ON public.login_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_login_history_user ON public.login_history(user_id, created_at DESC);

-- 2) User Sessions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  device TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY us_owner_all ON public.user_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id, last_active DESC);

-- 3) Dashboard Layouts
CREATE TABLE public.dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY dl_owner_all ON public.dashboard_layouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_dl_updated BEFORE UPDATE ON public.dashboard_layouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Failed Login Attempts
CREATE TABLE public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY fla_admin ON public.failed_login_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY fla_insert_any ON public.failed_login_attempts FOR INSERT WITH CHECK (true);
CREATE INDEX idx_fla_email_time ON public.failed_login_attempts(email, attempted_at DESC);

-- 5) Automation processing function & generic trigger
CREATE OR REPLACE FUNCTION public.process_automations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a RECORD;
  rec_user uuid;
  payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    rec_user := COALESCE((OLD).user_id, auth.uid());
    payload := to_jsonb(OLD);
  ELSE
    rec_user := COALESCE((NEW).user_id, auth.uid());
    payload := to_jsonb(NEW);
  END IF;

  IF rec_user IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  FOR a IN
    SELECT * FROM public.automations
    WHERE enabled = true
      AND user_id = rec_user
      AND trigger_table = TG_TABLE_NAME
      AND trigger_event = lower(TG_OP)
  LOOP
    INSERT INTO public.automation_runs (user_id, automation_id, status, payload)
    VALUES (rec_user, a.id, 'queued', payload);
    UPDATE public.automations
    SET run_count = run_count + 1, last_run_at = now()
    WHERE id = a.id;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to common tables
CREATE TRIGGER trg_auto_brands AFTER INSERT OR UPDATE OR DELETE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.process_automations();
CREATE TRIGGER trg_auto_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.process_automations();
CREATE TRIGGER trg_auto_clients AFTER INSERT OR UPDATE OR DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.process_automations();
CREATE TRIGGER trg_auto_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.process_automations();
CREATE TRIGGER trg_auto_branches AFTER INSERT OR UPDATE OR DELETE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.process_automations();
CREATE TRIGGER trg_auto_marketing AFTER INSERT OR UPDATE OR DELETE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION public.process_automations();
CREATE TRIGGER trg_auto_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.process_automations();

-- 6) Performance indexes
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON public.automations(trigger_table, enabled);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON public.automation_runs(status, created_at DESC);
