-- ====================================================================
-- KemetRise Legacy Nexus — Phase 3: DB Optimization & Column Extensions
-- Migration: 20260601000000_db_optimization.sql
-- Run in Supabase SQL Editor at:
--   https://supabase.com/dashboard/project/eoxcpubjoaninjyxtfko/sql/new
-- ====================================================================

-- ── 1. ADD MISSING COLUMNS ─────────────────────────────────────────────────

-- tasks: priority, description, due_date (stored in metadata already, but
--         adding native columns enables fast indexed queries)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS priority       TEXT DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','critical')),
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS due_date       DATE,
  ADD COLUMN IF NOT EXISTS assignee_id    TEXT;

-- employees: ensure agent_type and status columns exist
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS agent_type     TEXT DEFAULT 'human'
    CHECK (agent_type IN ('human','ai')),
  ADD COLUMN IF NOT EXISTS status         TEXT DEFAULT 'active'
    CHECK (status IN ('active','inactive','busy','offline'));

-- referrals: columns already exist in DB (reward_amount, total_referred, total_earned, code)
-- No ALTER needed — confirmed from types.ts

-- ── 2. PERFORMANCE INDEXES ─────────────────────────────────────────────────

-- brand_members: composite lookup by user+brand (used in RLS and teamApi)
CREATE INDEX IF NOT EXISTS idx_brand_members_user_brand
  ON public.brand_members (user_id, brand_id);

-- tasks: filter by status + tenant columns
CREATE INDEX IF NOT EXISTS idx_tasks_status_user
  ON public.tasks (status, user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_brand_status
  ON public.tasks (brand_id, status) WHERE brand_id IS NOT NULL;

-- tasks: assignee lookup
CREATE INDEX IF NOT EXISTS idx_tasks_assignee
  ON public.tasks (assignee_id) WHERE assignee_id IS NOT NULL;

-- tasks: due_date range queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
  ON public.tasks (due_date) WHERE due_date IS NOT NULL;

-- chat_messages: ordered listing per conversation
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created
  ON public.chat_messages (conversation_id, created_at ASC);

-- employees: agent_type filter for ChatHub
CREATE INDEX IF NOT EXISTS idx_employees_agent_type
  ON public.employees (agent_type, user_id);

-- referrals: code unique lookup
CREATE INDEX IF NOT EXISTS idx_referrals_code
  ON public.referrals (code) WHERE code IS NOT NULL;

-- responsible_personnel: owner lookups (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'responsible_personnel') THEN
    IF NOT EXISTS (
      SELECT FROM pg_indexes WHERE tablename = 'responsible_personnel' AND indexname = 'idx_resp_personnel_owner'
    ) THEN
      EXECUTE 'CREATE INDEX idx_resp_personnel_owner ON public.responsible_personnel (owner_kind, owner_id)';
    END IF;
  END IF;
END$$;

-- role_permissions: role+resource composite
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_resource
  ON public.role_permissions (role, resource_type, brand_id);

-- audit_logs: brand+table+created_at for the AuditLogs page
CREATE INDEX IF NOT EXISTS idx_audit_logs_brand_created
  ON public.audit_logs (brand_id, created_at DESC) WHERE brand_id IS NOT NULL;

-- ── 3. get_invitation_by_token RPC (idempotent) ────────────────────────────
-- Used by teamApi.accept(token) in src/services/system.ts

DROP FUNCTION IF EXISTS public.get_invitation_by_token(TEXT);

CREATE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS SETOF public.brand_invitations
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.brand_invitations WHERE token = p_token AND accepted_at IS NULL LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_invitation_by_token IS
  'Returns pending invitation by token — used for accept-invite flow';

-- ── 4. Referral auto-credit trigger ────────────────────────────────────────
-- Increments referrer totals when a new referral_usage row is inserted.
-- Falls back gracefully if referral_usages table does not exist.

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'referral_usages'
  ) THEN
    -- Create or replace the trigger function
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.trg_credit_referrer()
      RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $inner$
      BEGIN
        UPDATE public.referrals
        SET
          total_referred = COALESCE(total_referred, 0) + 1,
          total_earned   = COALESCE(total_earned,   0) + COALESCE(reward_amount, 0)
        WHERE id = NEW.referral_id;
        RETURN NEW;
      END;
      $inner$
    $func$;

    DROP TRIGGER IF EXISTS trg_credit_referrer ON public.referral_usages;
    EXECUTE $trig$
      CREATE TRIGGER trg_credit_referrer
        AFTER INSERT ON public.referral_usages
        FOR EACH ROW EXECUTE FUNCTION public.trg_credit_referrer()
    $trig$;
  END IF;
END$$;

-- ── 5. VACUÜM / ANALYZE hints (advisory — not run automatically) ───────────
-- After running this migration, execute the following in Supabase SQL to
-- ensure query planner statistics are up to date:
--
--   ANALYZE public.tasks;
--   ANALYZE public.employees;
--   ANALYZE public.chat_messages;
--   ANALYZE public.referrals;
--   ANALYZE public.brand_members;
--   ANALYZE public.audit_logs;

-- ── 6. Update tasks rows to sync priority from metadata (one-time backfill) ─
UPDATE public.tasks
SET priority = COALESCE(
  (metadata->>'priority')::TEXT,
  'medium'
)
WHERE priority IS NULL OR priority = 'medium';

UPDATE public.tasks
SET description = (metadata->>'description')::TEXT
WHERE description IS NULL AND metadata->>'description' IS NOT NULL;

UPDATE public.tasks
SET due_date = (metadata->>'due_date')::DATE
WHERE due_date IS NULL
  AND metadata->>'due_date' IS NOT NULL
  AND (metadata->>'due_date') ~ '^\d{4}-\d{2}-\d{2}$';
