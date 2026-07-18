DROP POLICY IF EXISTS "agent_logs_owner_all" ON public.agent_logs;
DROP POLICY IF EXISTS "agent_logs_read_authenticated" ON public.agent_logs;
DROP POLICY IF EXISTS "agent_logs_read_all_authenticated" ON public.agent_logs;
DROP POLICY IF EXISTS "agent_logs_write_authenticated" ON public.agent_logs;
DROP POLICY IF EXISTS "agent_logs_update_authenticated" ON public.agent_logs;
DROP POLICY IF EXISTS "agent_logs_delete_authenticated" ON public.agent_logs;

CREATE POLICY "agent_logs_read_authenticated" ON public.agent_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "agent_logs_write_authenticated" ON public.agent_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "agent_logs_update_authenticated" ON public.agent_logs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "agent_logs_delete_authenticated" ON public.agent_logs
  FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS us_owner_all ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_read_authenticated" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_write_own" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_update_own" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_delete_own" ON public.user_sessions;

CREATE POLICY "user_sessions_read_authenticated" ON public.user_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "user_sessions_write_own" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sessions_update_own" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_delete_own" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);
