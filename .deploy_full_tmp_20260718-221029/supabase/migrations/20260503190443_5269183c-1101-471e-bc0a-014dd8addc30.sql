
-- 1) Foreign keys (only when columns exist & no FK yet)
ALTER TABLE public.branches  DROP CONSTRAINT IF EXISTS branches_brand_id_fkey;
ALTER TABLE public.branches  ADD CONSTRAINT branches_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_brand_id_fkey;
ALTER TABLE public.employees ADD CONSTRAINT employees_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.projects  DROP CONSTRAINT IF EXISTS projects_brand_id_fkey;
ALTER TABLE public.projects  ADD CONSTRAINT projects_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.services  DROP CONSTRAINT IF EXISTS services_brand_id_fkey;
ALTER TABLE public.services  ADD CONSTRAINT services_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.brand_members DROP CONSTRAINT IF EXISTS brand_members_brand_id_fkey;
ALTER TABLE public.brand_members ADD CONSTRAINT brand_members_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;
ALTER TABLE public.brand_invitations DROP CONSTRAINT IF EXISTS brand_invitations_brand_id_fkey;
ALTER TABLE public.brand_invitations ADD CONSTRAINT brand_invitations_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 2) Helper: is user a member of a brand?
CREATE OR REPLACE FUNCTION public.is_brand_member(_brand uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.brand_members WHERE brand_id = _brand AND user_id = _user)
      OR EXISTS (SELECT 1 FROM public.brands WHERE id = _brand AND user_id = _user);
$$;

-- 3) Extend RLS for team members on brand-scoped tables
DO $$ BEGIN
  CREATE POLICY team_select_branches ON public.branches FOR SELECT
    USING (brand_id IS NOT NULL AND public.is_brand_member(brand_id, auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY team_modify_branches ON public.branches FOR UPDATE
    USING (brand_id IS NOT NULL AND public.is_brand_member(brand_id, auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY team_select_employees ON public.employees FOR SELECT
    USING (brand_id IS NOT NULL AND public.is_brand_member(brand_id, auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY team_modify_employees ON public.employees FOR UPDATE
    USING (brand_id IS NOT NULL AND public.is_brand_member(brand_id, auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY team_select_projects ON public.projects FOR SELECT
    USING (brand_id IS NOT NULL AND public.is_brand_member(brand_id, auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY team_modify_projects ON public.projects FOR UPDATE
    USING (brand_id IS NOT NULL AND public.is_brand_member(brand_id, auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY team_select_services ON public.services FOR SELECT
    USING (brand_id IS NOT NULL AND public.is_brand_member(brand_id, auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY team_modify_services ON public.services FOR UPDATE
    USING (brand_id IS NOT NULL AND public.is_brand_member(brand_id, auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Webhook auto-dispatch trigger on audit_logs
CREATE OR REPLACE FUNCTION public.dispatch_audit_webhook()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  wh RECORD;
  ev_name text;
BEGIN
  ev_name := lower(split_part(NEW.action,' ',1)) || '.' || NEW.table_name;
  FOR wh IN SELECT * FROM public.webhooks WHERE user_id = NEW.user_id AND active = true LOOP
    IF wh.events ? ev_name OR wh.events ? '*' THEN
      INSERT INTO public.webhook_deliveries (user_id, webhook_id, event, payload, status)
      VALUES (NEW.user_id, wh.id, ev_name, jsonb_build_object('audit', to_jsonb(NEW)), 'pending');
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_webhook ON public.audit_logs;
CREATE TRIGGER trg_audit_webhook AFTER INSERT ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.dispatch_audit_webhook();

-- 5) Allow webhook_deliveries updates by owner (for status updates from edge fn / retries)
DO $$ BEGIN
  CREATE POLICY wd_owner_update ON public.webhook_deliveries FOR UPDATE
    USING ((auth.uid() = user_id) OR has_role(auth.uid(),'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6) pg_cron + pg_net for DMS hourly check
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
