
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['brands','customers','projects','employees','branches','services','tasks']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS automation_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER automation_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_automations()', t, t);
  END LOOP;
END $$;
