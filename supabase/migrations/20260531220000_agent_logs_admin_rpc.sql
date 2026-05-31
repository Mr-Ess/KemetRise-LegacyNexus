-- RPC to fetch all agent_logs bypassing RLS (SECURITY DEFINER runs as postgres)
-- Safe because it requires authentication and only returns data (no mutations).
CREATE OR REPLACE FUNCTION public.get_all_agent_logs(p_limit int DEFAULT 500)
RETURNS SETOF public.agent_logs
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.agent_logs
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_agent_logs(int) TO authenticated;

-- Also fix the main RLS policy to allow any authenticated user to READ
-- (single-tenant system — the owner must see all records)
DROP POLICY IF EXISTS "agent_logs_owner_all" ON public.agent_logs;

CREATE POLICY "agent_logs_read_all_authenticated" ON public.agent_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "agent_logs_insert_own" ON public.agent_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_logs_update_own" ON public.agent_logs
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "agent_logs_delete_own" ON public.agent_logs
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Fix user_sessions the same way
DROP POLICY IF EXISTS us_owner_all ON public.user_sessions;

CREATE POLICY "user_sessions_read_authenticated" ON public.user_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "user_sessions_write_own" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sessions_update_own" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_delete_own" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);
