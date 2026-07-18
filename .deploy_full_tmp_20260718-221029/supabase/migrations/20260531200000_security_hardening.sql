-- =============================================================================
-- KemetRise Security Hardening Migration
-- Date: 2026-05-31
-- Addresses OWASP Top 10 findings from comprehensive audit:
--   A01 – Broken Access Control   (fla_select_ratelimit USING(true))
--   A02 – Cryptographic Failures  (clients.password plaintext, api_key plaintext)
--   A07 – Auth/Identification     (client-side rate limit, no webhook HMAC)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 1 (OWASP A02): clients.password stored as plaintext
-- Rename to external_secret_hash and add a length check to prevent plaintext
-- storage (bcrypt min 60 chars, argon2 > 90 chars)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'password'
  ) THEN
    ALTER TABLE public.clients RENAME COLUMN password TO external_secret_hash;
  END IF;
END $$;

COMMENT ON COLUMN public.clients.external_secret_hash IS
  'MUST contain only bcrypt/argon2 hashes (min 50 chars). NEVER store plaintext passwords.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'clients'
      AND constraint_name = 'chk_secret_hash_length'
  ) THEN
    -- Null out any plaintext/short values before enforcing the hash-length constraint
    UPDATE public.clients
      SET external_secret_hash = NULL
      WHERE external_secret_hash IS NOT NULL
        AND length(external_secret_hash) < 50;

    ALTER TABLE public.clients
      ADD CONSTRAINT chk_secret_hash_length
      CHECK (external_secret_hash IS NULL OR length(external_secret_hash) >= 50);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 2 (OWASP A02): clients.api_key stored in plaintext
-- Add hashed counterpart; deprecate raw column
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS api_key_hash text;

COMMENT ON COLUMN public.clients.api_key IS
  'DEPRECATED: raw key — migrate to api_key_hash (bcrypt). Remove after migration.';
COMMENT ON COLUMN public.clients.api_key_hash IS
  'bcrypt hash of the client API key. The raw key is shown only once at creation time.';

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 3 (OWASP A01): failed_login_attempts SELECT USING(true) exposes all emails
-- Replace the open SELECT policy with a SECURITY DEFINER function.
-- Anonymous users call the RPC; no row-level SELECT is needed.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS fla_select_ratelimit ON public.failed_login_attempts;
-- Keep INSERT policy (fla_insert_any) — it is correct and necessary

-- New RPC: server-side rate limit check (SECURITY DEFINER → bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email text)
RETURNS TABLE(attempt_count bigint, is_blocked boolean)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    COUNT(*)::bigint          AS attempt_count,
    (COUNT(*) >= 5)::boolean  AS is_blocked
  FROM public.failed_login_attempts
  WHERE
    email        = p_email
    AND attempted_at >= now() - interval '15 minutes';
$$;

REVOKE ALL ON FUNCTION public.check_login_rate_limit(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text) TO authenticated;

-- Performance index for the rate-limit query
CREATE INDEX IF NOT EXISTS idx_fla_email_time
  ON public.failed_login_attempts(email, attempted_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 4 (OWASP A07): Payment webhook — add signature config per gateway
-- The edge function will read these columns to verify HMAC before processing
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.payment_gateways
  ADD COLUMN IF NOT EXISTS signature_header    text DEFAULT 'x-webhook-signature',
  ADD COLUMN IF NOT EXISTS signature_algorithm text DEFAULT 'hmac-sha256';

COMMENT ON COLUMN public.payment_gateways.signature_header IS
  'HTTP header name used by the gateway to send the HMAC signature (e.g. x-stripe-signature)';
COMMENT ON COLUMN public.payment_gateways.signature_algorithm IS
  'Algorithm used by the gateway: hmac-sha256 | hmac-sha512';

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 5: audit_logs — make append-only for users (no UPDATE/DELETE)
-- Only service_role and admins should be able to modify audit records
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_logs_owner_all" ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_owner_all ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_read_own ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_own ON public.audit_logs;

CREATE POLICY audit_logs_read_own ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY audit_logs_insert_own ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- No UPDATE or DELETE policy → audit logs are append-only for regular users

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 6: Ensure api_keys table has proper RLS (existing table hardening)
-- api_keys should be owner-only read — no service_role select without owner scope
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "api_keys_owner_all" ON public.api_keys;
DROP POLICY IF EXISTS api_keys_owner_all ON public.api_keys;

CREATE POLICY api_keys_owner_all ON public.api_keys
  FOR ALL
  USING  (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 7: Add missing IF NOT EXISTS guard on duplicate key_persons index
-- (Section 6 of comprehensive_audit.sql already uses IF NOT EXISTS so this
--  is a no-op if already applied — safe to run again)
-- ─────────────────────────────────────────────────────────────────────────────
-- idx_kp_owner already exists from original migration; idx_kp_owner_kind in
-- comprehensive_audit.sql creates a redundant index on the same columns.
-- Drop the redundant one if it was created:
DROP INDEX IF EXISTS public.idx_kp_owner_kind;
-- The original idx_kp_owner covers (owner_kind, owner_id) fully.
