
-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  level text NOT NULL DEFAULT 'info',
  module text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_owner_select" ON public.audit_logs FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "audit_owner_insert" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  kind text NOT NULL DEFAULT 'income', -- income | expense
  category text,
  description text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx_owner_all" ON public.transactions FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tx_updated BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  rec_id uuid;
  rec_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    uid := COALESCE((OLD).user_id, auth.uid());
    rec_id := (OLD).id;
    BEGIN rec_name := (OLD).name; EXCEPTION WHEN others THEN rec_name := NULL; END;
  ELSE
    uid := COALESCE((NEW).user_id, auth.uid());
    rec_id := (NEW).id;
    BEGIN rec_name := (NEW).name; EXCEPTION WHEN others THEN rec_name := NULL; END;
  END IF;
  IF uid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  INSERT INTO public.audit_logs(user_id, action, table_name, record_id, level, module, details)
  VALUES (
    uid,
    TG_OP || ' ' || TG_TABLE_NAME || COALESCE(' "' || rec_name || '"',''),
    TG_TABLE_NAME,
    rec_id,
    CASE WHEN TG_OP='DELETE' THEN 'warning' ELSE 'info' END,
    initcap(TG_TABLE_NAME),
    jsonb_build_object('op', TG_OP)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to all key tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['brands','branches','employees','customers','projects','services','affiliates','success_partners','tasks','vault_entries','dead_man_switch','digital_inheritance','legendary_journey','transactions','api_keys','webhooks']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$s;', t);
    EXECUTE format('CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();', t);
  END LOOP;
END $$;

-- Realtime
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.brands REPLICA IDENTITY FULL;
ALTER TABLE public.branches REPLICA IDENTITY FULL;
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.customers REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.affiliates REPLICA IDENTITY FULL;
ALTER TABLE public.success_partners REPLICA IDENTITY FULL;
ALTER TABLE public.api_keys REPLICA IDENTITY FULL;
ALTER TABLE public.webhooks REPLICA IDENTITY FULL;

DO $$ BEGIN
  PERFORM 1; 
EXCEPTION WHEN others THEN NULL; END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.branches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.success_partners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.api_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhooks;
