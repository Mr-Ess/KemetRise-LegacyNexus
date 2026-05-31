-- Fix agent_logs RLS: allow any authenticated user to read all records.
-- This is a single-tenant system — the logged-in owner must see every row
-- regardless of which user_id was set when the row was inserted.

-- Drop the overly-restrictive policy
DROP POLICY IF EXISTS "agent_logs_owner_all" ON public.agent_logs;

-- Read: any authenticated user can see all rows (single-tenant owner access)
CREATE POLICY "agent_logs_read_authenticated" ON public.agent_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Write: users can only insert/update/delete their own rows
CREATE POLICY "agent_logs_write_own" ON public.agent_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_logs_update_own" ON public.agent_logs
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "agent_logs_delete_own" ON public.agent_logs
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Also fix user_sessions: allow owner to read all their sessions
DROP POLICY IF EXISTS us_owner_all ON public.user_sessions;

CREATE POLICY "user_sessions_read_authenticated" ON public.user_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "user_sessions_write_own" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sessions_update_own" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_delete_own" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);
