-- Fix failed_login_attempts RLS to allow anonymous inserts and rate-limit selects
-- Previously only 'authenticated' users could insert, which breaks pre-login tracking

-- Allow anonymous users to insert failed login attempts (they're not logged in when failing)
DROP POLICY IF EXISTS fla_insert_authenticated ON public.failed_login_attempts;

CREATE POLICY fla_insert_any ON public.failed_login_attempts
  FOR INSERT
  WITH CHECK (length(email) BETWEEN 3 AND 255);

-- Allow anonymous users to SELECT for rate limiting checks (filtered by email in query)
DROP POLICY IF EXISTS fla_select_ratelimit ON public.failed_login_attempts;

CREATE POLICY fla_select_ratelimit ON public.failed_login_attempts
  FOR SELECT
  USING (true);
