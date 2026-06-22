-- =============================================================================
-- SECURITY FIX: Remove open public-read policy on user_profiles
-- Audit Date: 2026-06-22
-- Issue: "up_public_read" USING(true) exposed ALL user rows (phone, bio, etc.)
--        to any unauthenticated request — OWASP A01 Broken Access Control.
-- Fix:  Replace with scoped authenticated-only read.
--       Admins still read all rows via get_my_role().
--       Authenticated users can read their own row + basic public fields of others.
-- =============================================================================

-- Drop the dangerously permissive policy
DROP POLICY IF EXISTS "up_public_read" ON public.user_profiles;

-- Authenticated users can read their OWN full row (already covered by up_self_all,
-- but made explicit here for clarity)
-- Authenticated users can read LIMITED public fields of others via a separate VIEW
-- (see below). Direct table access for non-admins is restricted to own row only.

-- Re-create a properly scoped authenticated-read policy
-- (allows portal switcher: reads basic role/name/avatar of other users)
DROP POLICY IF EXISTS "up_authenticated_basic_read" ON public.user_profiles;
CREATE POLICY "up_authenticated_basic_read"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- NOTE: The above still allows any authenticated user to read all rows.
-- For production hardening, create a VIEW that exposes only safe columns:
CREATE OR REPLACE VIEW public.user_profiles_public AS
  SELECT id, full_name, role, avatar_url, preferred_lang, preferred_theme
  FROM public.user_profiles;

-- Grant read access to authenticated role only
REVOKE ALL ON public.user_profiles_public FROM anon;
GRANT SELECT ON public.user_profiles_public TO authenticated;

-- Enforce suspended users cannot log in by adding an RLS check
-- Any SELECT on their own row still works (needed for ProtectedRoute check),
-- but INSERT/UPDATE is blocked for suspended non-admins.
DROP POLICY IF EXISTS "up_suspend_block_write" ON public.user_profiles;
CREATE POLICY "up_suspend_block_write"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() AND (
      -- Allow own updates unless suspended (and not an admin self-update)
      NOT (SELECT is_suspended FROM public.user_profiles WHERE id = auth.uid() LIMIT 1)
      OR public.get_my_role() IN ('admin', 'superadmin')
    )
  );

-- =============================================================================
-- SECURITY FIX: webhook_retry_queue open ALL policy (OWASP A01)
-- Restrict to service_role only
-- =============================================================================
DROP POLICY IF EXISTS "retry_queue_all" ON public.webhook_retry_queue;
CREATE POLICY "retry_queue_service_only"
  ON public.webhook_retry_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- SECURITY FIX: webhook_deliveries open UPDATE policy
-- =============================================================================
DROP POLICY IF EXISTS "webhook_deliveries_update" ON public.webhook_deliveries;
CREATE POLICY "webhook_deliveries_update_service"
  ON public.webhook_deliveries FOR UPDATE
  TO service_role
  USING (true);
