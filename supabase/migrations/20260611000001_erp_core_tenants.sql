-- ═══════════════════════════════════════════════════════════════════════════
-- KEMETRISE LEGACY NEXUS — ERP LAYER 1: MULTI-TENANT CORE ARCHITECTURE
-- Tenants · Workflow Registry · Sector Config · RLS · Helper Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── SECTOR CODE TYPE ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.erp_sector_code AS ENUM (
    'EDU-01',   -- Education & Courses
    'MED-01',   -- Medical & Healthcare
    'SPT-01',   -- Sports & Gyms
    'LEG-01',   -- Legal Services
    'TUR-01',   -- Tourism & Travel
    'CMP-01',   -- Companies & Professional Services
    'RET-01',   -- Retail (General)
    'MULTI'     -- Multi-sector tenant
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TENANTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  slug              text        UNIQUE NOT NULL,
  sector_code       public.erp_sector_code NOT NULL DEFAULT 'CMP-01',
  subscription_plan text        NOT NULL DEFAULT 'starter',  -- starter, growth, enterprise
  is_active         boolean     NOT NULL DEFAULT true,
  logo_url          text,
  primary_color     text        DEFAULT '#6366f1',
  timezone          text        DEFAULT 'UTC',
  default_currency  text        DEFAULT 'USD',
  country_code      text        DEFAULT 'US',
  tax_id            text,
  legal_name        text,
  address           jsonb       DEFAULT '{}',
  metadata          jsonb       DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ─── TENANT MEMBERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'member',  -- owner, admin, manager, member, viewer
  permissions jsonb       DEFAULT '[]',
  is_active   boolean     DEFAULT true,
  invited_by  uuid        REFERENCES auth.users(id),
  joined_at   timestamptz DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- ─── WORKFLOW REGISTRY ─────────────────────────────────────────────────────
-- Maps which automation workflows are active per tenant and their configuration.
CREATE TABLE IF NOT EXISTS public.workflow_registry (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workflow_code   text        NOT NULL,  -- FIN-001, COM-001, HR-001, EDU-001, etc.
  workflow_name   text        NOT NULL,
  module_layer    text        NOT NULL DEFAULT 'horizontal', -- horizontal | vertical
  sector_code     text,
  is_enabled      boolean     DEFAULT true,
  priority        int         DEFAULT 0,
  trigger_event   text,        -- invoice.created, attendance.scan, order.placed, etc.
  config          jsonb       DEFAULT '{}',
  n8n_webhook_url text,        -- n8n pipeline endpoint
  active_agent_id text,        -- A-AGENT-X identifier for telemetry
  retry_attempts  int         DEFAULT 3,
  retry_delay_ms  int         DEFAULT 5000,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (tenant_id, workflow_code)
);

-- ─── SECTOR UI/FORM CONFIGS ────────────────────────────────────────────────
-- Stores per-tenant sector-specific UI widget layouts and form schemas.
CREATE TABLE IF NOT EXISTS public.sector_configs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code   text        NOT NULL,
  ui_widgets    jsonb       DEFAULT '[]',   -- Dashboard widget layout order/config
  form_schemas  jsonb       DEFAULT '{}',   -- Dynamic form field definitions
  report_pipelines jsonb    DEFAULT '[]',   -- Analytics query definitions
  nav_overrides jsonb       DEFAULT '{}',   -- Sidebar navigation overrides
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (tenant_id, sector_code)
);

-- ─── INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tenants_owner           ON public.tenants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_sector          ON public.tenants(sector_code);
CREATE INDEX IF NOT EXISTS idx_tenants_slug            ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user     ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant   ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tenant         ON public.workflow_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_code           ON public.workflow_registry(workflow_code);
CREATE INDEX IF NOT EXISTS idx_sector_config_tenant    ON public.sector_configs(tenant_id);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────
ALTER TABLE public.tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_configs   ENABLE ROW LEVEL SECURITY;

-- TENANTS
DROP POLICY IF EXISTS "tenants_select" ON 
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
CREATE POLICY "tenants_select" ON public.tenants FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "tenants_insert" ON 
DROP POLICY IF EXISTS "tenants_insert" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert" ON public.tenants;
CREATE POLICY "tenants_insert" ON public.tenants FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "tenants_update" ON 
DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
CREATE POLICY "tenants_update" ON public.tenants FOR UPDATE
  USING (
    owner_user_id = auth.uid()
    OR id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

DROP POLICY IF EXISTS "tenants_delete" ON 
DROP POLICY IF EXISTS "tenants_delete" ON public.tenants;
DROP POLICY IF EXISTS "tenants_delete" ON public.tenants;
CREATE POLICY "tenants_delete" ON public.tenants FOR DELETE
  USING (owner_user_id = auth.uid());

-- TENANT MEMBERS
DROP POLICY IF EXISTS "tenant_members_select" ON 
DROP POLICY IF EXISTS "tenant_members_select" ON public.tenant_members;
DROP POLICY IF EXISTS "tenant_members_select" ON public.tenant_members;
CREATE POLICY "tenant_members_select" ON public.tenant_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR tenant_id IN (SELECT id FROM public.tenants WHERE owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tenant_members_insert" ON 
DROP POLICY IF EXISTS "tenant_members_insert" ON public.tenant_members;
DROP POLICY IF EXISTS "tenant_members_insert" ON public.tenant_members;
CREATE POLICY "tenant_members_insert" ON public.tenant_members FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

DROP POLICY IF EXISTS "tenant_members_update" ON 
DROP POLICY IF EXISTS "tenant_members_update" ON public.tenant_members;
DROP POLICY IF EXISTS "tenant_members_update" ON public.tenant_members;
CREATE POLICY "tenant_members_update" ON public.tenant_members FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- WORKFLOW REGISTRY
DROP POLICY IF EXISTS "workflow_registry_select" ON 
DROP POLICY IF EXISTS "workflow_registry_select" ON public.workflow_registry;
DROP POLICY IF EXISTS "workflow_registry_select" ON public.workflow_registry;
CREATE POLICY "workflow_registry_select" ON public.workflow_registry FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "workflow_registry_write" ON 
DROP POLICY IF EXISTS "workflow_registry_write" ON public.workflow_registry;
DROP POLICY IF EXISTS "workflow_registry_write" ON public.workflow_registry;
CREATE POLICY "workflow_registry_write" ON public.workflow_registry FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- SECTOR CONFIGS
DROP POLICY IF EXISTS "sector_configs_all" ON 
DROP POLICY IF EXISTS "sector_configs_all" ON public.sector_configs;
DROP POLICY IF EXISTS "sector_configs_all" ON public.sector_configs;
CREATE POLICY "sector_configs_all" ON public.sector_configs FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ─── HELPER: Get all tenant IDs accessible by the current user ─────────────
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
  UNION
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = auth.uid() AND is_active = true;
$$;

-- ─── HELPER: Check if user is tenant admin ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id AND owner_user_id = auth.uid()
    UNION
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$;

-- ─── TRIGGER: Auto-create owner membership on tenant creation ───────────────
CREATE OR REPLACE FUNCTION public.fn_create_owner_tenant_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (NEW.id, NEW.owner_user_id, 'owner')
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenant_owner_member ON public.tenants;
CREATE TRIGGER trg_tenant_owner_member
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_create_owner_tenant_member();

-- ─── TRIGGER: Auto-seed workflow registry on tenant creation ───────────────
CREATE OR REPLACE FUNCTION public.fn_seed_workflow_registry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Seed all horizontal (core) workflows for every tenant
  INSERT INTO public.workflow_registry (tenant_id, workflow_code, workflow_name, module_layer, trigger_event, active_agent_id)
  VALUES
    (NEW.id, 'FIN-001', 'Invoice Lifecycle Manager',      'horizontal', 'invoice.created',     'A-AGENT-FIN'),
    (NEW.id, 'FIN-002', 'Tax Compliance Webhook',         'horizontal', 'invoice.submitted',   'A-AGENT-TAX'),
    (NEW.id, 'FIN-003', 'Multi-Currency Rate Sync',       'horizontal', 'rate.sync',           'A-AGENT-FX'),
    (NEW.id, 'COM-001', 'Order Fulfillment Router',       'horizontal', 'order.placed',        'A-AGENT-COM'),
    (NEW.id, 'COM-002', 'Digital License Delivery',       'horizontal', 'order.digital.paid',  'A-AGENT-DIG'),
    (NEW.id, 'COM-003', 'Stock Alert Notifier',           'horizontal', 'inventory.low',       'A-AGENT-INV'),
    (NEW.id, 'HR-001',  'QR Attendance Scanner',          'horizontal', 'attendance.qr.scan',  'A-AGENT-HR'),
    (NEW.id, 'HR-002',  'Payroll Auto-Calculator',        'horizontal', 'payroll.run',         'A-AGENT-PAY'),
    (NEW.id, 'HR-003',  'Biometric Integration Relay',    'horizontal', 'biometric.event',     'A-AGENT-BIO')
  ON CONFLICT (tenant_id, workflow_code) DO NOTHING;

  -- Seed vertical workflows based on sector_code
  IF NEW.sector_code = 'EDU-01' THEN
    INSERT INTO public.workflow_registry (tenant_id, workflow_code, workflow_name, module_layer, sector_code, trigger_event, active_agent_id)
    VALUES
      (NEW.id, 'EDU-001', 'Auto-Deduct Session Fees',    'vertical', 'EDU-01', 'session.attended',    'A-AGENT-EDU'),
      (NEW.id, 'EDU-002', 'Enrollment Confirmation',     'vertical', 'EDU-01', 'student.enrolled',    'A-AGENT-EDU'),
      (NEW.id, 'EDU-003', 'Schedule Reminder Dispatch',  'vertical', 'EDU-01', 'class.upcoming',      'A-AGENT-EDU')
    ON CONFLICT (tenant_id, workflow_code) DO NOTHING;

  ELSIF NEW.sector_code = 'MED-01' THEN
    INSERT INTO public.workflow_registry (tenant_id, workflow_code, workflow_name, module_layer, sector_code, trigger_event, active_agent_id)
    VALUES
      (NEW.id, 'MED-001', 'Appointment Reminder',        'vertical', 'MED-01', 'appointment.upcoming','A-AGENT-MED'),
      (NEW.id, 'MED-002', 'Prescription Digital Delivery','vertical','MED-01', 'prescription.issued', 'A-AGENT-MED'),
      (NEW.id, 'MED-003', 'Medical Billing Processor',   'vertical', 'MED-01', 'bill.generated',      'A-AGENT-MED')
    ON CONFLICT (tenant_id, workflow_code) DO NOTHING;

  ELSIF NEW.sector_code = 'SPT-01' THEN
    INSERT INTO public.workflow_registry (tenant_id, workflow_code, workflow_name, module_layer, sector_code, trigger_event, active_agent_id)
    VALUES
      (NEW.id, 'SPT-001', 'Member Access Gate Control',  'vertical', 'SPT-01', 'access.scan',         'A-AGENT-SPT'),
      (NEW.id, 'SPT-002', 'Subscription Renewal Alert',  'vertical', 'SPT-01', 'subscription.expiring','A-AGENT-SPT'),
      (NEW.id, 'SPT-003', 'Session Booking Confirmation','vertical', 'SPT-01', 'session.booked',       'A-AGENT-SPT')
    ON CONFLICT (tenant_id, workflow_code) DO NOTHING;

  ELSIF NEW.sector_code = 'LEG-01' THEN
    INSERT INTO public.workflow_registry (tenant_id, workflow_code, workflow_name, module_layer, sector_code, trigger_event, active_agent_id)
    VALUES
      (NEW.id, 'LEG-001', 'Case Status Notifier',        'vertical', 'LEG-01', 'case.updated',        'A-AGENT-LEG'),
      (NEW.id, 'LEG-002', 'Document Vault Alert',        'vertical', 'LEG-01', 'document.uploaded',   'A-AGENT-LEG'),
      (NEW.id, 'LEG-003', 'Hourly Billing Auto-Timer',   'vertical', 'LEG-01', 'timesheet.entry',     'A-AGENT-LEG')
    ON CONFLICT (tenant_id, workflow_code) DO NOTHING;

  ELSIF NEW.sector_code = 'TUR-01' THEN
    INSERT INTO public.workflow_registry (tenant_id, workflow_code, workflow_name, module_layer, sector_code, trigger_event, active_agent_id)
    VALUES
      (NEW.id, 'TUR-001', 'Booking Confirmation Engine', 'vertical', 'TUR-01', 'booking.confirmed',   'A-AGENT-TUR'),
      (NEW.id, 'TUR-002', 'Agent Commission Calculator', 'vertical', 'TUR-01', 'trip.completed',      'A-AGENT-TUR'),
      (NEW.id, 'TUR-003', 'Allotment Sync Webhook',      'vertical', 'TUR-01', 'allotment.updated',   'A-AGENT-TUR')
    ON CONFLICT (tenant_id, workflow_code) DO NOTHING;

  ELSIF NEW.sector_code = 'CMP-01' THEN
    INSERT INTO public.workflow_registry (tenant_id, workflow_code, workflow_name, module_layer, sector_code, trigger_event, active_agent_id)
    VALUES
      (NEW.id, 'CMP-001', 'Milestone Progress Tracker',  'vertical', 'CMP-01', 'milestone.updated',   'A-AGENT-CMP'),
      (NEW.id, 'CMP-002', 'SLA Breach Alert',            'vertical', 'CMP-01', 'ticket.sla_breach',   'A-AGENT-CMP'),
      (NEW.id, 'CMP-003', 'Timesheet Approval Router',   'vertical', 'CMP-01', 'timesheet.submitted', 'A-AGENT-CMP')
    ON CONFLICT (tenant_id, workflow_code) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_workflow_registry ON public.tenants;
CREATE TRIGGER trg_seed_workflow_registry
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_seed_workflow_registry();
