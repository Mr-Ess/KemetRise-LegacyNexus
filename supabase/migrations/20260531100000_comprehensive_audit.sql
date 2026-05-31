-- =============================================================================
-- KemetRise Comprehensive Audit Migration
-- Date: 2026-05-31
-- Goals:
--   1) Dedicated tables for responsible_personnel and key_personnel
--   2) Payment gateway readiness (gateway config + transactions + split support)
--   3) Workflow map enhancements (visual graph fields, steps, conditions)
--   4) Permissions system (role_permissions covering all sectors)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: PERSONNEL TABLES
-- key_persons already exists (polymorphic). We add:
--   a) responsible_personnel  – single point of responsibility per entity/sector
--   b) personnel_contacts     – rich contact profile (linked from any table)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a) Responsible Personnel: one row per entity instance, rich contact info
CREATE TABLE IF NOT EXISTS public.responsible_personnel (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id         uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  client_id        uuid,
  -- polymorphic ownership (same pattern as key_persons)
  owner_kind       text        NOT NULL,   -- 'brand','project','service','employee','customer','branch','affiliate','success_partner','digital_inheritance','legendary_journey','department','warehouse','material','payment_gateway'
  owner_id         uuid        NOT NULL,
  -- personal details
  full_name        text        NOT NULL,
  title            text,                   -- e.g. "مدير التشغيل"
  department       text,
  phones           jsonb       NOT NULL DEFAULT '[]'::jsonb,
  emails           jsonb       NOT NULL DEFAULT '[]'::jsonb,
  whatsapp         text,
  socials          jsonb       NOT NULL DEFAULT '[]'::jsonb,
  national_id      text,
  notes            text,
  avatar_url       text,
  -- AI / system metadata
  ai_can_contact   boolean     NOT NULL DEFAULT false,   -- allow AI to auto-contact
  priority         smallint    NOT NULL DEFAULT 1,       -- 1=primary, 2=secondary, 3=backup
  is_active        boolean     NOT NULL DEFAULT true,
  metadata         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  user_name        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.responsible_personnel ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rp_owner_all ON public.responsible_personnel;
CREATE POLICY rp_owner_all ON public.responsible_personnel FOR ALL
  USING  (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_rp_owner       ON public.responsible_personnel(owner_kind, owner_id);
CREATE INDEX IF NOT EXISTS idx_rp_brand       ON public.responsible_personnel(brand_id);
CREATE INDEX IF NOT EXISTS idx_rp_user        ON public.responsible_personnel(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responsible_personnel TO authenticated;
GRANT ALL ON public.responsible_personnel TO service_role;
CREATE TRIGGER trg_rp_updated BEFORE UPDATE ON public.responsible_personnel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add responsible_person_id FK back to all major entity tables (optional, non-blocking)
ALTER TABLE public.brands       ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES public.responsible_personnel(id) ON DELETE SET NULL;
ALTER TABLE public.projects     ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES public.responsible_personnel(id) ON DELETE SET NULL;
ALTER TABLE public.services     ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES public.responsible_personnel(id) ON DELETE SET NULL;
ALTER TABLE public.employees    ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES public.responsible_personnel(id) ON DELETE SET NULL;
ALTER TABLE public.customers    ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES public.responsible_personnel(id) ON DELETE SET NULL;
ALTER TABLE public.branches     ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES public.responsible_personnel(id) ON DELETE SET NULL;
ALTER TABLE public.affiliates   ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES public.responsible_personnel(id) ON DELETE SET NULL;

-- 1b) Enhance key_persons: add brand_id, client_id, department, national_id
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS brand_id       uuid REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS client_id      uuid;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS department     text;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS title          text;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS whatsapp       text;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS national_id    text;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS notes          text;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS avatar_url     text;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS priority       smallint NOT NULL DEFAULT 1;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS ai_can_contact boolean  NOT NULL DEFAULT false;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS is_active      boolean  NOT NULL DEFAULT true;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS metadata       jsonb    NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_kp_brand  ON public.key_persons(brand_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: PAYMENT GATEWAY SYSTEM
-- Existing: payment_gateways (basic), payment_transactions (basic)
-- New:
--   a) Enhance payment_gateways with gateway_type, credentials, split_rules
--   b) Enhance payment_transactions with gateway_id, split_recipients, fees
--   c) payment_splits – record per-recipient share on a transaction
--   d) payment_methods – saved card/wallet info per customer
-- ─────────────────────────────────────────────────────────────────────────────

-- 2a) Enhance payment_gateways
ALTER TABLE public.payment_gateways
  ADD COLUMN IF NOT EXISTS gateway_type       text    DEFAULT 'card',           -- card | bank_transfer | e_wallet | crypto | pos
  ADD COLUMN IF NOT EXISTS provider_code      text,                             -- stripe | paymob | fawry | vodafone_cash | instapay | mada | benefit
  ADD COLUMN IF NOT EXISTS api_key_encrypted  text,                             -- store only encrypted / reference
  ADD COLUMN IF NOT EXISTS webhook_secret     text,
  ADD COLUMN IF NOT EXISTS supported_currencies text[] DEFAULT ARRAY['EGP','USD','SAR'],
  ADD COLUMN IF NOT EXISTS split_enabled      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS split_rules        jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS test_mode          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS description        text,
  ADD COLUMN IF NOT EXISTS client_id          uuid,
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

-- 2b) Enhance payment_transactions
ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS gateway_id         uuid    REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gateway_reference  text,   -- external TXN ID from gateway
  ADD COLUMN IF NOT EXISTS gateway_response   jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_method     text    DEFAULT 'card',           -- card | bank_transfer | e_wallet | cash
  ADD COLUMN IF NOT EXISTS provider_code      text,
  ADD COLUMN IF NOT EXISTS net_amount         numeric(14,4),
  ADD COLUMN IF NOT EXISTS fee_amount         numeric(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS split_processed    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS refunded_amount    numeric(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason     text,
  ADD COLUMN IF NOT EXISTS ip_address         text,
  ADD COLUMN IF NOT EXISTS device_fingerprint text,
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_ptx_gateway    ON public.payment_transactions(gateway_id);
CREATE INDEX IF NOT EXISTS idx_ptx_customer   ON public.payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_ptx_status     ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_ptx_brand      ON public.payment_transactions(brand_id);

-- 2c) Payment splits (per transaction, per recipient)
CREATE TABLE IF NOT EXISTS public.payment_splits (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id   uuid        NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  brand_id         uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  recipient_type   text        NOT NULL DEFAULT 'brand',  -- brand | affiliate | platform | tax
  recipient_id     uuid,
  recipient_name   text,
  amount           numeric(14,4) NOT NULL DEFAULT 0,
  percentage       numeric(7,4),
  currency         text        NOT NULL DEFAULT 'EGP',
  status           text        NOT NULL DEFAULT 'pending', -- pending | processed | failed
  processed_at     timestamptz,
  notes            text,
  user_name        text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS psplit_owner_all ON public.payment_splits;
CREATE POLICY psplit_owner_all ON public.payment_splits FOR ALL
  USING  (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ps_txn   ON public.payment_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ps_brand ON public.payment_splits(brand_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_splits TO authenticated;
GRANT ALL ON public.payment_splits TO service_role;

-- 2d) Payment methods (saved per customer)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id      uuid        REFERENCES public.customers(id) ON DELETE CASCADE,
  brand_id         uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  gateway_id       uuid        REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
  method_type      text        NOT NULL DEFAULT 'card',  -- card | bank_account | e_wallet | mobile_number
  provider_code    text,
  token            text,       -- gateway token (never store raw card data)
  display_name     text,       -- e.g. "Visa **** 4242"
  is_default       boolean     NOT NULL DEFAULT false,
  expires_at       date,
  metadata         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  user_name        text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pm_owner_all ON public.payment_methods;
CREATE POLICY pm_owner_all ON public.payment_methods FOR ALL
  USING  (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_pmethod_customer ON public.payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_pmethod_brand    ON public.payment_methods(brand_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: WORKFLOW MAP ENHANCEMENTS
-- Existing: workflow_map (from_agent, to_agent, dependency_type, description)
-- Add: workflow steps, conditions, triggers, visual layout
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a) Enhance workflow_map (graph edges) with visual / runtime fields
ALTER TABLE public.workflow_map
  ADD COLUMN IF NOT EXISTS brand_id           uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id          uuid,
  ADD COLUMN IF NOT EXISTS workflow_name      text,
  ADD COLUMN IF NOT EXISTS workflow_version   text DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS is_active          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS priority           smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS timeout_seconds    int,
  ADD COLUMN IF NOT EXISTS retry_count        smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS condition_expr     text,                           -- JS/JSON logic expression
  ADD COLUMN IF NOT EXISTS input_schema       jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS output_schema      jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata           jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pos_x              numeric DEFAULT 0,              -- visual canvas X
  ADD COLUMN IF NOT EXISTS pos_y              numeric DEFAULT 0,              -- visual canvas Y
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

-- 3b) Workflow steps (ordered list inside a named workflow)
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id         uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  client_id        uuid,
  workflow_name    text        NOT NULL,
  step_order       smallint    NOT NULL DEFAULT 1,
  step_label       text        NOT NULL,
  agent_code       text,
  action_type      text        NOT NULL DEFAULT 'task', -- task | decision | parallel | wait | notify | webhook
  action_config    jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- parameters for the action
  condition_expr   text,
  on_success_step  uuid,       -- FK to next step on success
  on_failure_step  uuid,       -- FK to next step on failure
  timeout_seconds  int,
  retry_count      smallint    DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  notes            text,
  user_name        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ws_owner_all ON public.workflow_steps;
CREATE POLICY ws_owner_all ON public.workflow_steps FOR ALL
  USING  (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_wfstep_name  ON public.workflow_steps(workflow_name);
CREATE INDEX IF NOT EXISTS idx_wfstep_brand ON public.workflow_steps(brand_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_steps TO authenticated;
GRANT ALL ON public.workflow_steps TO service_role;
CREATE TRIGGER trg_wfstep_updated BEFORE UPDATE ON public.workflow_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3c) Workflow executions (runtime audit trail)
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id         uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  client_id        uuid,
  workflow_name    text        NOT NULL,
  trigger_source   text,                              -- manual | automation | api | schedule
  trigger_payload  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status           text        NOT NULL DEFAULT 'running', -- running | completed | failed | cancelled
  started_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz,
  steps_log        jsonb       NOT NULL DEFAULT '[]'::jsonb,   -- [{step_id, status, output, error, duration_ms}]
  error_message    text,
  initiated_by     text,       -- user_name or agent_code
  user_name        text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wfe_owner_all ON public.workflow_executions;
CREATE POLICY wfe_owner_all ON public.workflow_executions FOR ALL
  USING  (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_wfe_name   ON public.workflow_executions(workflow_name);
CREATE INDEX IF NOT EXISTS idx_wfe_brand  ON public.workflow_executions(brand_id);
CREATE INDEX IF NOT EXISTS idx_wfe_status ON public.workflow_executions(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_executions TO authenticated;
GRANT ALL ON public.workflow_executions TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: PERMISSIONS SYSTEM
-- Existing: user_roles (admin|moderator|user), client_brand_access.permissions (jsonb)
-- New:
--   a) role_permissions – fine-grained RBAC per resource type
--   b) sector_permissions – per-brand sector-level access control
--   c) agent_permissions – what each AI agent is allowed to do
-- ─────────────────────────────────────────────────────────────────────────────

-- 4a) Role Permissions: maps app_role to allowed actions on resource types
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id         uuid        REFERENCES public.brands(id) ON DELETE CASCADE,
  role             text        NOT NULL,     -- admin | manager | staff | viewer | agent
  resource_type    text        NOT NULL,     -- brands | projects | services | employees | customers | branches | affiliates | materials | inventory | payments | workflows | reports | settings | api_keys | audit_logs
  can_read         boolean     NOT NULL DEFAULT true,
  can_create       boolean     NOT NULL DEFAULT false,
  can_update       boolean     NOT NULL DEFAULT false,
  can_delete       boolean     NOT NULL DEFAULT false,
  can_export       boolean     NOT NULL DEFAULT false,
  can_approve      boolean     NOT NULL DEFAULT false,   -- for financial approvals
  extra_perms      jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- e.g. {can_assign_agents: true}
  user_name        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, role, resource_type)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rolep_owner_all ON public.role_permissions;
CREATE POLICY rolep_owner_all ON public.role_permissions FOR ALL
  USING  (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_rolep_brand ON public.role_permissions(brand_id);
CREATE INDEX IF NOT EXISTS idx_rolep_role  ON public.role_permissions(role);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
CREATE TRIGGER trg_rolep_updated BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4b) Sector Permissions: per-brand, per-user, per-sector fine-grained access
CREATE TABLE IF NOT EXISTS public.sector_permissions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id         uuid        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  sector           text        NOT NULL,     -- brands | projects | services | employees | customers | branches | affiliates | success_partners | digital_inheritance | legendary_journey | inventory | materials | logistics | legal | finance | marketing | hr | ai_agents | settings
  can_read         boolean     NOT NULL DEFAULT true,
  can_write        boolean     NOT NULL DEFAULT false,
  can_delete       boolean     NOT NULL DEFAULT false,
  can_approve      boolean     NOT NULL DEFAULT false,
  can_export       boolean     NOT NULL DEFAULT false,
  branch_ids       uuid[]      DEFAULT NULL,   -- NULL = all branches; else restrict to listed
  ai_managed       boolean     NOT NULL DEFAULT false,  -- allow AI/NN to manage this sector
  ai_agent_codes   text[]      DEFAULT '{}',            -- which agent codes have access
  notes            text,
  user_name        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(target_user_id, brand_id, sector)
);
ALTER TABLE public.sector_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sectorp_owner_all ON public.sector_permissions;
CREATE POLICY sectorp_owner_all ON public.sector_permissions FOR ALL
  USING  (auth.uid() = user_id OR auth.uid() = target_user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_sectorp_brand  ON public.sector_permissions(brand_id);
CREATE INDEX IF NOT EXISTS idx_sectorp_target ON public.sector_permissions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_sectorp_sector ON public.sector_permissions(sector);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sector_permissions TO authenticated;
GRANT ALL ON public.sector_permissions TO service_role;
CREATE TRIGGER trg_sectorp_updated BEFORE UPDATE ON public.sector_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4c) Agent Permissions: what each AI agent is authorized to do
CREATE TABLE IF NOT EXISTS public.agent_permissions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id         uuid        REFERENCES public.employees(id) ON DELETE CASCADE,
  brand_id         uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  agent_code       text        NOT NULL,
  -- resource-level toggles
  allowed_tables   text[]      NOT NULL DEFAULT '{}',  -- explicit table whitelist
  allowed_actions  text[]      NOT NULL DEFAULT ARRAY['read'], -- read | create | update | delete | execute_workflow | trigger_payment | send_notification | export
  -- sector access (mirrors sector_permissions for AI)
  sector_access    jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- {sector: {read, write, approve}}
  -- limits
  max_daily_ops    int         DEFAULT 1000,
  max_spend_eur    numeric(14,4) DEFAULT 0,   -- spending cap for payment-triggering agents
  can_escalate     boolean     NOT NULL DEFAULT true,   -- can escalate to human
  requires_approval boolean    NOT NULL DEFAULT false,  -- every action needs human approval
  sandbox_mode     boolean     NOT NULL DEFAULT false,  -- dry-run only
  notes            text,
  user_name        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agentp_owner_all ON public.agent_permissions;
CREATE POLICY agentp_owner_all ON public.agent_permissions FOR ALL
  USING  (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_agentp_brand ON public.agent_permissions(brand_id);
CREATE INDEX IF NOT EXISTS idx_agentp_code  ON public.agent_permissions(agent_code);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_permissions TO authenticated;
GRANT ALL ON public.agent_permissions TO service_role;
CREATE TRIGGER trg_agentp_updated BEFORE UPDATE ON public.agent_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: SEED DEFAULT ROLE PERMISSIONS (admin + manager + staff + viewer)
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: seed default permissions for a given brand (called manually or by trigger)
CREATE OR REPLACE FUNCTION public.seed_default_role_permissions(p_brand_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  resources text[] := ARRAY['brands','projects','services','employees','customers','branches',
                             'affiliates','success_partners','digital_inheritance','legendary_journey',
                             'inventory','materials','logistics','legal','finance','marketing',
                             'ai_agents','settings','reports','payments','workflows','audit_logs'];
  r text;
BEGIN
  FOREACH r IN ARRAY resources LOOP
    -- admin: full access
    INSERT INTO public.role_permissions(user_id, brand_id, role, resource_type, can_read, can_create, can_update, can_delete, can_export, can_approve)
    VALUES (p_user_id, p_brand_id, 'admin', r, true, true, true, true, true, true)
    ON CONFLICT (brand_id, role, resource_type) DO NOTHING;

    -- manager: no delete on sensitive, can approve
    INSERT INTO public.role_permissions(user_id, brand_id, role, resource_type, can_read, can_create, can_update, can_delete, can_export, can_approve)
    VALUES (p_user_id, p_brand_id, 'manager', r, true, true, true,
            CASE WHEN r IN ('audit_logs','settings') THEN false ELSE true END,
            true,
            CASE WHEN r IN ('finance','payments') THEN true ELSE false END)
    ON CONFLICT (brand_id, role, resource_type) DO NOTHING;

    -- staff: read+write, no delete, no export sensitive
    INSERT INTO public.role_permissions(user_id, brand_id, role, resource_type, can_read, can_create, can_update, can_delete, can_export, can_approve)
    VALUES (p_user_id, p_brand_id, 'staff', r, true,
            CASE WHEN r IN ('settings','audit_logs','payments') THEN false ELSE true END,
            CASE WHEN r IN ('settings','audit_logs') THEN false ELSE true END,
            false,
            CASE WHEN r IN ('settings','audit_logs','finance','payments') THEN false ELSE true END,
            false)
    ON CONFLICT (brand_id, role, resource_type) DO NOTHING;

    -- viewer: read only
    INSERT INTO public.role_permissions(user_id, brand_id, role, resource_type, can_read, can_create, can_update, can_delete, can_export, can_approve)
    VALUES (p_user_id, p_brand_id, 'viewer', r, true, false, false, false, false, false)
    ON CONFLICT (brand_id, role, resource_type) DO NOTHING;

    -- agent: read only by default + workflows
    INSERT INTO public.role_permissions(user_id, brand_id, role, resource_type, can_read, can_create, can_update, can_delete, can_export, can_approve)
    VALUES (p_user_id, p_brand_id, 'agent', r, true,
            CASE WHEN r IN ('workflows','ai_agents') THEN true ELSE false END,
            CASE WHEN r IN ('workflows','ai_agents') THEN true ELSE false END,
            false, false, false)
    ON CONFLICT (brand_id, role, resource_type) DO NOTHING;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_wfmap_name      ON public.workflow_map(workflow_name);
CREATE INDEX IF NOT EXISTS idx_wfmap_brand     ON public.workflow_map(brand_id);
CREATE INDEX IF NOT EXISTS idx_wfmap_from      ON public.workflow_map(from_agent_code);
CREATE INDEX IF NOT EXISTS idx_kp_owner_kind   ON public.key_persons(owner_kind, owner_id);
CREATE INDEX IF NOT EXISTS idx_ptx_reference   ON public.payment_transactions(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_pg_provider     ON public.payment_gateways(provider_code);
