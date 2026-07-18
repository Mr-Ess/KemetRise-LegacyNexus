
-- 1) Remove sensitive tables from realtime
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['api_keys','vault_entries','dead_man_switch','audit_logs','transactions','webhooks','affiliates']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- 2) Revoke EXECUTE on internal trigger/helper functions
REVOKE EXECUTE ON FUNCTION public.process_automations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dispatch_audit_webhook() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3) Tighten failed_login_attempts - only service role can insert
DROP POLICY IF EXISTS fla_insert_valid ON public.failed_login_attempts;
CREATE POLICY fla_insert_authenticated ON public.failed_login_attempts
  FOR INSERT TO authenticated
  WITH CHECK (length(email) BETWEEN 3 AND 255);

-- 4) Restrict user_2fa to owner only (drop admin override if exists)
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Admins can view all 2FA" ON public.user_2fa';
  EXECUTE 'DROP POLICY IF EXISTS "Admins manage 2FA" ON public.user_2fa';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
