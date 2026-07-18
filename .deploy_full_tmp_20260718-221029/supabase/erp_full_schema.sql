-- ═══ FILE: supabase/migrations/20260611000001_erp_core_tenants.sql ═══
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- KEMETRISE LEGACY NEXUS â€” ERP LAYER 1: MULTI-TENANT CORE ARCHITECTURE
-- Tenants Â· Workflow Registry Â· Sector Config Â· RLS Â· Helper Functions
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€â”€ SECTOR CODE TYPE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ TENANTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ TENANT MEMBERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ WORKFLOW REGISTRY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ SECTOR UI/FORM CONFIGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ INDEXES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_tenants_owner           ON public.tenants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_sector          ON public.tenants(sector_code);
CREATE INDEX IF NOT EXISTS idx_tenants_slug            ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user     ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant   ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tenant         ON public.workflow_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_code           ON public.workflow_registry(workflow_code);
CREATE INDEX IF NOT EXISTS idx_sector_config_tenant    ON public.sector_configs(tenant_id);

-- â”€â”€â”€ ROW LEVEL SECURITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_configs   ENABLE ROW LEVEL SECURITY;

-- TENANTS
CREATE POLICY "tenants_select" ON public.tenants FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "tenants_insert" ON public.tenants FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "tenants_update" ON public.tenants FOR UPDATE
  USING (
    owner_user_id = auth.uid()
    OR id IN (
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

CREATE POLICY "tenants_delete" ON public.tenants FOR DELETE
  USING (owner_user_id = auth.uid());

-- TENANT MEMBERS
CREATE POLICY "tenant_members_select" ON public.tenant_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR tenant_id IN (SELECT id FROM public.tenants WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "tenant_members_insert" ON public.tenant_members FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

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
CREATE POLICY "workflow_registry_select" ON public.workflow_registry FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

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
CREATE POLICY "sector_configs_all" ON public.sector_configs FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- â”€â”€â”€ HELPER: Get all tenant IDs accessible by the current user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ HELPER: Check if user is tenant admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ TRIGGER: Auto-create owner membership on tenant creation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ TRIGGER: Auto-seed workflow registry on tenant creation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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



-- ═══ FILE: supabase/migrations/20260611000002_erp_financial_engine.sql ═══
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- KEMETRISE â€” FINANCIAL & TAXATION ENGINE (Horizontal Module)
-- Ledger Â· Invoicing Â· Receipts Â· Multi-Currency Â· Tax Rules Â· E-Invoicing
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€â”€ CHART OF ACCOUNTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_accounts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id),
  account_code  text        NOT NULL,
  account_name  text        NOT NULL,
  account_type  text        NOT NULL,  -- asset, liability, equity, revenue, expense
  parent_id     uuid        REFERENCES public.fin_accounts(id),
  normal_balance text       NOT NULL DEFAULT 'debit', -- debit | credit
  is_active     boolean     DEFAULT true,
  description   text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (tenant_id, account_code)
);

-- â”€â”€â”€ GENERAL LEDGER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_ledger_entries (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code      text        NOT NULL DEFAULT 'CMP-01',
  user_id          uuid        NOT NULL REFERENCES auth.users(id),
  account_id       uuid        REFERENCES public.fin_accounts(id),
  transaction_ref  text        NOT NULL,
  entry_type       text        NOT NULL CHECK (entry_type IN ('debit','credit')),
  amount           numeric(15,4) NOT NULL CHECK (amount > 0),
  currency         text        NOT NULL DEFAULT 'USD',
  amount_base      numeric(15,4),   -- amount in tenant default currency
  exchange_rate    numeric(12,6)  DEFAULT 1.0,
  description      text,
  entry_date       date        NOT NULL DEFAULT CURRENT_DATE,
  fiscal_year      int         NOT NULL DEFAULT EXTRACT(YEAR FROM now())::int,
  fiscal_month     int         NOT NULL DEFAULT EXTRACT(MONTH FROM now())::int,
  source_type      text,        -- invoice, payment, payroll, manual, order
  source_id        uuid,
  is_reconciled    boolean     DEFAULT false,
  reconciled_at    timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- â”€â”€â”€ INVOICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_invoices (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code      text        NOT NULL DEFAULT 'CMP-01',
  user_id          uuid        NOT NULL REFERENCES auth.users(id),
  invoice_number   text        NOT NULL,
  invoice_type     text        NOT NULL DEFAULT 'standard', -- standard, proforma, credit_note, debit_note, recurring
  client_id        uuid,
  client_name      text,
  client_tax_id    text,
  client_email     text,
  client_address   jsonb       DEFAULT '{}',
  issue_date       date        NOT NULL DEFAULT CURRENT_DATE,
  due_date         date,
  currency         text        NOT NULL DEFAULT 'USD',
  exchange_rate    numeric(12,6) DEFAULT 1.0,
  subtotal         numeric(15,4) NOT NULL DEFAULT 0,
  tax_amount       numeric(15,4) DEFAULT 0,
  discount_amount  numeric(15,4) DEFAULT 0,
  total_amount     numeric(15,4) NOT NULL DEFAULT 0,
  paid_amount      numeric(15,4) DEFAULT 0,
  balance_due      numeric(15,4) DEFAULT 0,
  status           text        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','paid','partial','overdue','cancelled','void')),
  payment_terms    text,
  notes            text,
  footer_text      text,
  -- E-Invoicing compliance fields (Egypt ETA / KSA ZATCA / etc.)
  einvoice_uuid    text,
  einvoice_status  text        DEFAULT 'pending',
  einvoice_hash    text,
  einvoice_qr      text,        -- QR code data for embedded e-invoice
  einvoice_response jsonb      DEFAULT '{}',
  einvoice_authority text      DEFAULT 'ETA',
  metadata         jsonb       DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

-- â”€â”€â”€ INVOICE LINE ITEMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_invoice_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid        NOT NULL REFERENCES public.fin_invoices(id) ON DELETE CASCADE,
  tenant_id    uuid        NOT NULL,
  description  text        NOT NULL,
  quantity     numeric(10,3) NOT NULL DEFAULT 1,
  unit_price   numeric(15,4) NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) DEFAULT 0,
  tax_rate     numeric(5,2) DEFAULT 0,
  tax_amount   numeric(15,4) DEFAULT 0,
  line_total   numeric(15,4) NOT NULL DEFAULT 0,
  product_id   uuid,
  sku          text,
  unit         text        DEFAULT 'unit',
  sort_order   int         DEFAULT 0
);

-- â”€â”€â”€ RECEIPTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_receipts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code     text        NOT NULL DEFAULT 'CMP-01',
  user_id         uuid        NOT NULL REFERENCES auth.users(id),
  receipt_number  text        NOT NULL,
  invoice_id      uuid        REFERENCES public.fin_invoices(id),
  client_id       uuid,
  client_name     text,
  amount          numeric(15,4) NOT NULL,
  currency        text        NOT NULL DEFAULT 'USD',
  exchange_rate   numeric(12,6) DEFAULT 1.0,
  payment_method  text        NOT NULL DEFAULT 'cash',
                   -- cash | card | bank_transfer | stripe | paymob | instapay | cheque
  gateway_ref     text,
  gateway_payload jsonb       DEFAULT '{}',
  payment_date    date        NOT NULL DEFAULT CURRENT_DATE,
  notes           text,
  status          text        DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at      timestamptz DEFAULT now(),
  UNIQUE (tenant_id, receipt_number)
);

-- â”€â”€â”€ MULTI-CURRENCY RATES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_currency_rates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  base_currency   text        NOT NULL DEFAULT 'USD',
  target_currency text        NOT NULL,
  rate            numeric(14,8) NOT NULL,
  source          text        DEFAULT 'manual', -- manual, ecb, openexchange, cboe
  rate_date       date        NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (tenant_id, base_currency, target_currency, rate_date)
);

-- â”€â”€â”€ TAX RULES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_tax_rules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_name       text        NOT NULL,
  tax_code        text,        -- e.g. EGY-VAT-14, KSA-VAT-15
  tax_type        text        NOT NULL DEFAULT 'vat',
                  -- vat, sales_tax, withholding, income, customs, stamp_duty
  rate            numeric(6,4) NOT NULL,
  country_code    text,
  is_default      boolean     DEFAULT false,
  is_active       boolean     DEFAULT true,
  applies_to      text[]      DEFAULT '{}',  -- product, service, digital, physical
  authority_code  text,        -- National tax authority registration code
  description     text,
  created_at      timestamptz DEFAULT now()
);

-- â”€â”€â”€ E-INVOICE WEBHOOK LOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_einvoice_webhooks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id    uuid        REFERENCES public.fin_invoices(id),
  event_type    text        NOT NULL, -- submission, acceptance, rejection, cancellation, query
  authority     text        NOT NULL DEFAULT 'ETA',  -- ETA, ZATCA, FDMS, etc.
  payload       jsonb       NOT NULL DEFAULT '{}',
  response      jsonb       DEFAULT '{}',
  status        text        DEFAULT 'pending' CHECK (status IN ('pending','success','error','retrying')),
  attempts      int         DEFAULT 0,
  max_attempts  int         DEFAULT 3,
  retry_delay_ms int        DEFAULT 5000,
  next_retry_at timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- â”€â”€â”€ PAYMENT GATEWAY CONFIGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_gateway_configs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  gateway_name  text        NOT NULL, -- stripe, paymob, instapay, paypal, fawry
  is_active     boolean     DEFAULT true,
  is_default    boolean     DEFAULT false,
  config_enc    jsonb       DEFAULT '{}',  -- encrypted gateway credentials
  webhook_secret text,
  supported_currencies text[] DEFAULT '{"USD"}',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (tenant_id, gateway_name)
);

-- â”€â”€â”€ INDEXES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_fin_ledger_tenant_date    ON public.fin_ledger_entries(tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_fin_ledger_sector         ON public.fin_ledger_entries(sector_code);
CREATE INDEX IF NOT EXISTS idx_fin_ledger_source         ON public.fin_ledger_entries(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_fin_invoices_tenant_status ON public.fin_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fin_invoices_sector       ON public.fin_invoices(sector_code);
CREATE INDEX IF NOT EXISTS idx_fin_invoices_due_date     ON public.fin_invoices(due_date) WHERE status NOT IN ('paid','cancelled','void');
CREATE INDEX IF NOT EXISTS idx_fin_receipts_tenant       ON public.fin_receipts(tenant_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_fin_einvoice_status       ON public.fin_einvoice_webhooks(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_fin_currency_date         ON public.fin_currency_rates(tenant_id, rate_date DESC);

-- â”€â”€â”€ ROW LEVEL SECURITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.fin_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_ledger_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_invoice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_receipts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_currency_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_tax_rules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_einvoice_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_gateway_configs   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_accounts_all"          ON public.fin_accounts          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "fin_ledger_all"            ON public.fin_ledger_entries    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "fin_invoices_all"          ON public.fin_invoices          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "fin_invoice_items_all"     ON public.fin_invoice_items     FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "fin_receipts_all"          ON public.fin_receipts          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "fin_currency_rates_all"    ON public.fin_currency_rates    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "fin_tax_rules_all"         ON public.fin_tax_rules         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "fin_einvoice_webhooks_all" ON public.fin_einvoice_webhooks FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "fin_gateway_configs_all"   ON public.fin_gateway_configs   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- â”€â”€â”€ FUNCTION: Auto-calculate invoice totals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.fn_sync_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.fin_invoices
  SET
    subtotal    = items.subtotal,
    tax_amount  = items.tax_total,
    total_amount= items.subtotal + items.tax_total - COALESCE(discount_amount, 0),
    balance_due = items.subtotal + items.tax_total - COALESCE(discount_amount, 0) - COALESCE(paid_amount, 0),
    updated_at  = now()
  FROM (
    SELECT
      SUM(quantity * unit_price * (1 - discount_pct/100)) AS subtotal,
      SUM(tax_amount)                                      AS tax_total
    FROM public.fin_invoice_items WHERE invoice_id = NEW.invoice_id
  ) items
  WHERE id = NEW.invoice_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_invoice_items_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.fin_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_invoice_totals();

-- â”€â”€â”€ FUNCTION: Auto-update balance_due when paid_amount changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.fn_invoice_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.balance_due := GREATEST(0, NEW.total_amount - NEW.paid_amount);
  NEW.status := CASE
    WHEN NEW.paid_amount >= NEW.total_amount THEN 'paid'
    WHEN NEW.paid_amount > 0                THEN 'partial'
    ELSE NEW.status
  END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_invoice_balance
  BEFORE UPDATE OF paid_amount ON public.fin_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_invoice_balance();

-- â”€â”€â”€ FUNCTION: Create ledger entry on receipt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.fn_receipt_to_ledger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.fin_ledger_entries
      (tenant_id, sector_code, user_id, transaction_ref, entry_type, amount, currency, description, source_type, source_id)
    VALUES
      (NEW.tenant_id, NEW.sector_code, NEW.user_id, NEW.receipt_number, 'debit',
       NEW.amount, NEW.currency, 'Receipt: ' || COALESCE(NEW.receipt_number,''), 'receipt', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_receipt_ledger
  AFTER INSERT ON public.fin_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_receipt_to_ledger();



-- ═══ FILE: supabase/migrations/20260611000003_erp_commerce_store.sql ═══
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- KEMETRISE â€” ADVANCED REVENUE ENGINE & MULTI-COMMERCE STORE
-- Products (Digital+Physical) Â· Orders Â· Inventory Â· Payment Gateway Mapping
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€â”€ PRODUCT CATALOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.com_products (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code      text        NOT NULL DEFAULT 'CMP-01',
  user_id          uuid        NOT NULL REFERENCES auth.users(id),
  name             text        NOT NULL,
  slug             text        NOT NULL,
  description      text,
  product_type     text        NOT NULL DEFAULT 'physical',
                   -- physical, digital, service, subscription, bundle
  sku              text,
  barcode          text,
  price            numeric(12,4) NOT NULL DEFAULT 0,
  compare_price    numeric(12,4),
  cost_price       numeric(12,4),
  currency         text        NOT NULL DEFAULT 'USD',
  tax_rule_id      uuid        REFERENCES public.fin_tax_rules(id),
  category         text,
  tags             text[]      DEFAULT '{}',
  -- Physical goods
  weight_kg        numeric(8,3),
  dimensions       jsonb       DEFAULT '{}',  -- {length, width, height}
  requires_shipping boolean    DEFAULT false,
  -- Digital goods
  file_url         text,        -- secure signed URL
  download_limit   int         DEFAULT -1,   -- -1 = unlimited
  license_type     text        DEFAULT 'single', -- single, multi, enterprise
  -- Stock
  track_inventory  boolean     DEFAULT false,
  stock_qty        int         DEFAULT 0,
  low_stock_alert  int         DEFAULT 5,
  allow_backorder  boolean     DEFAULT false,
  -- Status
  is_active        boolean     DEFAULT true,
  is_featured      boolean     DEFAULT false,
  images           jsonb       DEFAULT '[]',
  metadata         jsonb       DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- â”€â”€â”€ LICENSE KEYS (Digital Products) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.com_license_keys (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES public.com_products(id),
  license_key  text        NOT NULL,
  order_id     uuid,
  buyer_email  text,
  activated_at timestamptz,
  expires_at   timestamptz,
  usage_count  int         DEFAULT 0,
  max_uses     int         DEFAULT 1,
  status       text        DEFAULT 'available', -- available, assigned, activated, revoked
  created_at   timestamptz DEFAULT now(),
  UNIQUE (tenant_id, license_key)
);

-- â”€â”€â”€ WAREHOUSE / INVENTORY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.com_warehouses (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  code       text        NOT NULL,
  address    jsonb       DEFAULT '{}',
  is_active  boolean     DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS public.com_inventory (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES public.com_products(id) ON DELETE CASCADE,
  warehouse_id uuid        REFERENCES public.com_warehouses(id),
  qty_on_hand  int         NOT NULL DEFAULT 0,
  qty_reserved int         DEFAULT 0,
  qty_available int        GENERATED ALWAYS AS (qty_on_hand - qty_reserved) STORED,
  reorder_point int        DEFAULT 5,
  reorder_qty  int         DEFAULT 10,
  last_updated timestamptz DEFAULT now(),
  UNIQUE (tenant_id, product_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS public.com_inventory_movements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES public.com_products(id),
  warehouse_id uuid        REFERENCES public.com_warehouses(id),
  movement_type text       NOT NULL, -- in, out, adjustment, transfer, return
  qty          int         NOT NULL,
  reference    text,
  source_type  text,        -- order, purchase_order, adjustment, transfer
  source_id    uuid,
  notes        text,
  performed_by uuid        REFERENCES auth.users(id),
  created_at   timestamptz DEFAULT now()
);

-- â”€â”€â”€ ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.com_orders (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code    text        NOT NULL DEFAULT 'CMP-01',
  user_id        uuid        NOT NULL REFERENCES auth.users(id),
  order_number   text        NOT NULL,
  customer_id    uuid,
  customer_name  text,
  customer_email text,
  customer_phone text,
  shipping_address jsonb     DEFAULT '{}',
  billing_address  jsonb     DEFAULT '{}',
  order_type     text        NOT NULL DEFAULT 'standard', -- standard, subscription, digital, wholesale
  status         text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  fulfillment_status text    DEFAULT 'unfulfilled', -- unfulfilled, partial, fulfilled
  payment_status text        DEFAULT 'unpaid', -- unpaid, paid, partial, refunded
  currency       text        NOT NULL DEFAULT 'USD',
  exchange_rate  numeric(12,6) DEFAULT 1.0,
  subtotal       numeric(15,4) DEFAULT 0,
  tax_amount     numeric(15,4) DEFAULT 0,
  shipping_cost  numeric(10,4) DEFAULT 0,
  discount_amount numeric(15,4) DEFAULT 0,
  total_amount   numeric(15,4) NOT NULL DEFAULT 0,
  paid_amount    numeric(15,4) DEFAULT 0,
  gateway        text,        -- stripe, paymob, instapay, cash
  gateway_ref    text,
  gateway_payload jsonb      DEFAULT '{}',
  coupon_code    text,
  notes          text,
  metadata       jsonb       DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE (tenant_id, order_number)
);

-- â”€â”€â”€ ORDER LINE ITEMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.com_order_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid        NOT NULL REFERENCES public.com_orders(id) ON DELETE CASCADE,
  tenant_id       uuid        NOT NULL,
  product_id      uuid        REFERENCES public.com_products(id),
  product_name    text        NOT NULL,
  sku             text,
  product_type    text        DEFAULT 'physical',
  quantity        int         NOT NULL DEFAULT 1,
  unit_price      numeric(12,4) NOT NULL,
  discount_pct    numeric(5,2) DEFAULT 0,
  tax_rate        numeric(5,2) DEFAULT 0,
  tax_amount      numeric(12,4) DEFAULT 0,
  line_total      numeric(12,4) NOT NULL,
  -- Fulfillment
  fulfillment_status text     DEFAULT 'unfulfilled',
  shipped_qty     int         DEFAULT 0,
  -- Digital delivery
  download_url    text,
  license_key_id  uuid        REFERENCES public.com_license_keys(id),
  download_expires_at timestamptz,
  sort_order      int         DEFAULT 0
);

-- â”€â”€â”€ COUPONS & PROMOTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.com_coupons (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code             text        NOT NULL,
  description      text,
  discount_type    text        NOT NULL DEFAULT 'percent', -- percent, fixed
  discount_value   numeric(10,4) NOT NULL,
  min_order_amount numeric(10,4) DEFAULT 0,
  max_uses         int         DEFAULT -1,
  used_count       int         DEFAULT 0,
  applies_to       text        DEFAULT 'all', -- all, category, product
  applicable_ids   uuid[]      DEFAULT '{}',
  valid_from       timestamptz DEFAULT now(),
  valid_until      timestamptz,
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- â”€â”€â”€ PAYMENT TRANSACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.com_payment_transactions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id         uuid        REFERENCES public.com_orders(id),
  invoice_id       uuid        REFERENCES public.fin_invoices(id),
  transaction_type text        NOT NULL DEFAULT 'charge',  -- charge, refund, chargeback, payout
  gateway          text        NOT NULL,
  gateway_txn_id   text,
  gateway_order_id text,
  amount           numeric(15,4) NOT NULL,
  currency         text        NOT NULL DEFAULT 'USD',
  status           text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed','cancelled','refunded')),
  gateway_response jsonb       DEFAULT '{}',
  error_code       text,
  error_message    text,
  processed_at     timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- â”€â”€â”€ INDEXES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_com_products_tenant       ON public.com_products(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_com_products_type         ON public.com_products(product_type);
CREATE INDEX IF NOT EXISTS idx_com_inventory_product     ON public.com_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_com_orders_tenant_status  ON public.com_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_com_orders_sector         ON public.com_orders(sector_code);
CREATE INDEX IF NOT EXISTS idx_com_orders_customer       ON public.com_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_com_txns_order            ON public.com_payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_com_txns_status           ON public.com_payment_transactions(status);

-- â”€â”€â”€ ROW LEVEL SECURITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.com_products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_license_keys          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_warehouses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_inventory             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_inventory_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_coupons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_payment_transactions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "com_products_all"             ON public.com_products             FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "com_license_keys_all"         ON public.com_license_keys         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "com_warehouses_all"           ON public.com_warehouses           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "com_inventory_all"            ON public.com_inventory            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "com_inventory_movements_all"  ON public.com_inventory_movements  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "com_orders_all"               ON public.com_orders               FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "com_order_items_all"          ON public.com_order_items          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "com_coupons_all"              ON public.com_coupons              FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "com_payment_transactions_all" ON public.com_payment_transactions FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- â”€â”€â”€ FUNCTION: Deduct inventory on order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.fn_order_deduct_inventory()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.fulfillment_status = 'fulfilled' AND OLD.fulfillment_status <> 'fulfilled' THEN
    UPDATE public.com_inventory
    SET qty_on_hand   = qty_on_hand - NEW.quantity,
        qty_reserved  = GREATEST(0, qty_reserved - NEW.quantity),
        last_updated  = now()
    WHERE product_id = NEW.product_id AND tenant_id = NEW.tenant_id;

    INSERT INTO public.com_inventory_movements
      (tenant_id, product_id, movement_type, qty, source_type, source_id)
    VALUES
      (NEW.tenant_id, NEW.product_id, 'out', NEW.quantity, 'order', NEW.order_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_order_deduct_inventory
  AFTER UPDATE OF fulfillment_status ON public.com_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_order_deduct_inventory();

-- â”€â”€â”€ FUNCTION: Auto-deliver digital license on payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.fn_assign_license_key()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_key_id uuid;
BEGIN
  IF NEW.product_type = 'digital' AND NEW.fulfillment_status = 'unfulfilled' THEN
    SELECT id INTO v_key_id
    FROM public.com_license_keys
    WHERE product_id = NEW.product_id
      AND status = 'available'
    LIMIT 1;

    IF v_key_id IS NOT NULL THEN
      UPDATE public.com_license_keys
      SET status = 'assigned', order_id = NEW.order_id, activated_at = now()
      WHERE id = v_key_id;

      UPDATE public.com_order_items
      SET license_key_id = v_key_id, fulfillment_status = 'fulfilled',
          download_expires_at = now() + interval '7 days'
      WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_assign_license_key
  AFTER INSERT ON public.com_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_assign_license_key();



-- ═══ FILE: supabase/migrations/20260611000004_erp_hr_advanced.sql ═══
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- KEMETRISE â€” ADVANCED HR & ATTENDANCE SYSTEM (Horizontal Module)
-- Payroll Automation Â· QR Attendance Â· Biometric Integration Â· Deduction Rules
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€â”€ DEDUCTION RULE ENGINE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.hr_deduction_rules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_name       text        NOT NULL,
  rule_type       text        NOT NULL DEFAULT 'fixed',
                  -- fixed, percentage, bracket, absence_penalty, session_fee
  applies_to      text        NOT NULL DEFAULT 'all', -- all, department, employee_type, individual
  target_ids      uuid[]      DEFAULT '{}',
  amount          numeric(10,4),
  percentage      numeric(5,2),
  bracket_table   jsonb       DEFAULT '[]',  -- [{min, max, rate}]
  trigger_event   text,        -- monthly, per_absence, per_late_minute, per_missed_session
  max_deduction   numeric(10,4),
  is_active       boolean     DEFAULT true,
  description     text,
  created_at      timestamptz DEFAULT now()
);

-- â”€â”€â”€ ATTENDANCE QR TOKENS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Each employee has a rotating encrypted QR code for attendance scanning
CREATE TABLE IF NOT EXISTS public.hr_qr_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid        NOT NULL,
  user_id     uuid        REFERENCES auth.users(id),
  token_hash  text        NOT NULL,  -- bcrypt hash of the QR payload
  payload     text        NOT NULL,  -- encrypted payload for QR generation
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_used     boolean     DEFAULT false,
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (tenant_id, employee_id, token_hash)
);

-- â”€â”€â”€ ATTENDANCE EVENTS (QR + Biometric) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.hr_attendance_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code     text        NOT NULL DEFAULT 'CMP-01',
  employee_id     uuid        NOT NULL,
  user_id         uuid        REFERENCES auth.users(id),
  event_date      date        NOT NULL DEFAULT CURRENT_DATE,
  event_type      text        NOT NULL, -- check_in, check_out, break_start, break_end
  scan_method     text        NOT NULL DEFAULT 'qr', -- qr, fingerprint, facial, rfid, manual
  scan_timestamp  timestamptz NOT NULL DEFAULT now(),
  location_lat    numeric(10,7),
  location_lng    numeric(10,7),
  device_id       text,        -- Biometric device identifier
  qr_token_id     uuid        REFERENCES public.hr_qr_tokens(id),
  is_valid        boolean     DEFAULT true,
  override_reason text,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- â”€â”€â”€ DAILY ATTENDANCE SUMMARY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.hr_attendance_summary (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id       uuid        NOT NULL,
  summary_date      date        NOT NULL,
  status            text        NOT NULL DEFAULT 'present',
                    -- present, absent, late, half_day, on_leave, holiday, remote
  check_in          timestamptz,
  check_out         timestamptz,
  work_minutes      int         DEFAULT 0,
  overtime_minutes  int         DEFAULT 0,
  late_minutes      int         DEFAULT 0,
  early_leave_mins  int         DEFAULT 0,
  break_minutes     int         DEFAULT 0,
  deduction_amount  numeric(10,4) DEFAULT 0,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (tenant_id, employee_id, summary_date)
);

-- â”€â”€â”€ BIOMETRIC DEVICE INTEGRATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.hr_biometric_devices (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  device_name  text        NOT NULL,
  device_type  text        NOT NULL DEFAULT 'fingerprint', -- fingerprint, facial, iris, rfid
  device_serial text,
  ip_address   text,
  location     text,
  api_endpoint text,        -- Device's HTTP API for polling events
  api_key_enc  text,        -- Encrypted API key
  webhook_url  text,        -- Our endpoint to receive device pushes
  is_active    boolean     DEFAULT true,
  last_sync_at timestamptz,
  sync_status  text        DEFAULT 'idle', -- idle, syncing, error
  created_at   timestamptz DEFAULT now()
);

-- â”€â”€â”€ BIOMETRIC RAW EVENTS (from device push) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.hr_biometric_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  device_id       uuid        REFERENCES public.hr_biometric_devices(id),
  device_serial   text,
  employee_ref    text        NOT NULL,  -- Device-side employee ID / fingerprint ID
  employee_id     uuid,        -- Mapped to our employee record
  event_type      text        NOT NULL,  -- check_in, check_out
  raw_timestamp   timestamptz NOT NULL,
  raw_payload     jsonb       DEFAULT '{}',
  processed       boolean     DEFAULT false,
  processed_at    timestamptz,
  mapping_status  text        DEFAULT 'pending', -- pending, mapped, unmatched
  created_at      timestamptz DEFAULT now()
);

-- â”€â”€â”€ ENHANCED PAYROLL CYCLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.hr_payroll_cycles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cycle_name      text        NOT NULL,  -- e.g. "June 2026"
  pay_period_start date       NOT NULL,
  pay_period_end  date        NOT NULL,
  pay_date        date        NOT NULL,
  status          text        NOT NULL DEFAULT 'draft',
                  -- draft, processing, approved, paid, cancelled
  total_gross     numeric(15,4) DEFAULT 0,
  total_deductions numeric(15,4) DEFAULT 0,
  total_net       numeric(15,4) DEFAULT 0,
  processed_by    uuid        REFERENCES auth.users(id),
  processed_at    timestamptz,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- â”€â”€â”€ PAYROLL ENTRIES (per employee per cycle) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.hr_payroll_entries (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cycle_id             uuid        NOT NULL REFERENCES public.hr_payroll_cycles(id) ON DELETE CASCADE,
  employee_id          uuid        NOT NULL,
  base_salary          numeric(12,4) DEFAULT 0,
  hourly_rate          numeric(10,4),
  hours_worked         numeric(8,2)  DEFAULT 0,
  overtime_hours       numeric(8,2)  DEFAULT 0,
  overtime_rate_mult   numeric(4,2)  DEFAULT 1.5,
  gross_pay            numeric(12,4) DEFAULT 0,
  -- Deductions breakdown
  tax_deduction        numeric(12,4) DEFAULT 0,
  social_insurance     numeric(12,4) DEFAULT 0,
  absence_deduction    numeric(12,4) DEFAULT 0,
  late_deduction       numeric(12,4) DEFAULT 0,
  session_deduction    numeric(12,4) DEFAULT 0,  -- Education sector
  other_deductions     numeric(12,4) DEFAULT 0,
  total_deductions     numeric(12,4) DEFAULT 0,
  -- Additions
  bonuses              numeric(12,4) DEFAULT 0,
  commissions          numeric(12,4) DEFAULT 0,
  allowances           numeric(12,4) DEFAULT 0,
  total_additions      numeric(12,4) DEFAULT 0,
  net_pay              numeric(12,4) DEFAULT 0,
  -- Attendance stats for this cycle
  days_present         int           DEFAULT 0,
  days_absent          int           DEFAULT 0,
  days_late            int           DEFAULT 0,
  overtime_minutes     int           DEFAULT 0,
  payment_method       text          DEFAULT 'bank_transfer',
  payment_ref          text,
  status               text          DEFAULT 'pending', -- pending, approved, paid
  paid_at              timestamptz,
  notes                text,
  deduction_breakdown  jsonb         DEFAULT '[]',  -- [{rule_id, name, amount}]
  created_at           timestamptz   DEFAULT now()
);

-- â”€â”€â”€ INDEXES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_hr_qr_tokens_employee        ON public.hr_qr_tokens(tenant_id, employee_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_events_date    ON public.hr_attendance_events(tenant_id, event_date);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_events_emp     ON public.hr_attendance_events(employee_id, event_date);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_summary_date   ON public.hr_attendance_summary(tenant_id, summary_date);
CREATE INDEX IF NOT EXISTS idx_hr_biometric_events_proc     ON public.hr_biometric_events(tenant_id, processed, created_at);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_entries_cycle     ON public.hr_payroll_entries(cycle_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_entries_employee  ON public.hr_payroll_entries(employee_id, tenant_id);

-- â”€â”€â”€ ROW LEVEL SECURITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.hr_deduction_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_qr_tokens            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance_summary   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_biometric_devices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_biometric_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll_cycles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll_entries      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_deduction_rules_all"   ON public.hr_deduction_rules   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "hr_qr_tokens_all"         ON public.hr_qr_tokens         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "hr_attendance_events_all" ON public.hr_attendance_events  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "hr_attendance_summary_all" ON public.hr_attendance_summary FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "hr_biometric_devices_all" ON public.hr_biometric_devices  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "hr_biometric_events_all"  ON public.hr_biometric_events   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "hr_payroll_cycles_all"    ON public.hr_payroll_cycles     FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "hr_payroll_entries_all"   ON public.hr_payroll_entries    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- â”€â”€â”€ FUNCTION: Generate encrypted QR token â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.fn_generate_qr_token(
  p_tenant_id   uuid,
  p_employee_id uuid,
  p_user_id     uuid DEFAULT NULL
)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_payload  text;
  v_hash     text;
  v_token_id uuid;
BEGIN
  -- Expire previous tokens for this employee
  UPDATE public.hr_qr_tokens
  SET is_used = true
  WHERE tenant_id = p_tenant_id
    AND employee_id = p_employee_id
    AND is_used = false
    AND expires_at > now();

  -- Build payload: tenant:employee:timestamp:nonce
  v_payload := encode(
    convert_to(
      p_tenant_id::text || ':' || p_employee_id::text || ':' || extract(epoch from now())::text || ':' || gen_random_uuid()::text,
      'UTF8'
    ),
    'base64'
  );
  v_hash := encode(sha256(convert_to(v_payload, 'UTF8')), 'hex');

  INSERT INTO public.hr_qr_tokens (tenant_id, employee_id, user_id, token_hash, payload, expires_at)
  VALUES (p_tenant_id, p_employee_id, p_user_id, v_hash, v_payload, now() + interval '24 hours')
  RETURNING id INTO v_token_id;

  RETURN v_payload;
END;
$$;

-- â”€â”€â”€ FUNCTION: Process QR scan attendance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.fn_process_qr_scan(
  p_tenant_id   uuid,
  p_qr_payload  text,
  p_event_type  text DEFAULT 'check_in'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token       record;
  v_event_id    uuid;
BEGIN
  -- Validate QR token
  SELECT * INTO v_token
  FROM public.hr_qr_tokens
  WHERE tenant_id = p_tenant_id
    AND payload = p_qr_payload
    AND is_used = false
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_or_expired_token');
  END IF;

  -- Record attendance event
  INSERT INTO public.hr_attendance_events
    (tenant_id, employee_id, user_id, event_type, scan_method, qr_token_id)
  VALUES
    (p_tenant_id, v_token.employee_id, v_token.user_id, p_event_type, 'qr', v_token.id)
  RETURNING id INTO v_event_id;

  -- Mark token as used if check_out (one scan per day per direction)
  IF p_event_type = 'check_out' THEN
    UPDATE public.hr_qr_tokens SET is_used = true WHERE id = v_token.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', v_event_id,
    'employee_id', v_token.employee_id,
    'event_type', p_event_type,
    'timestamp', now()
  );
END;
$$;

-- â”€â”€â”€ FUNCTION: Auto-calculate payroll entry deductions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.fn_calculate_payroll_entry()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.total_deductions := COALESCE(NEW.tax_deduction, 0)
                        + COALESCE(NEW.social_insurance, 0)
                        + COALESCE(NEW.absence_deduction, 0)
                        + COALESCE(NEW.late_deduction, 0)
                        + COALESCE(NEW.session_deduction, 0)
                        + COALESCE(NEW.other_deductions, 0);

  NEW.total_additions := COALESCE(NEW.bonuses, 0)
                       + COALESCE(NEW.commissions, 0)
                       + COALESCE(NEW.allowances, 0);

  NEW.gross_pay := COALESCE(NEW.base_salary, 0)
                 + COALESCE(NEW.total_additions, 0);

  NEW.net_pay := GREATEST(0, NEW.gross_pay - NEW.total_deductions);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_calculate_payroll_entry
  BEFORE INSERT OR UPDATE ON public.hr_payroll_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_calculate_payroll_entry();



-- ═══ FILE: supabase/migrations/20260611000005_erp_sector_schemas.sql ═══
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- KEMETRISE â€” VERTICAL SECTOR EXTRACTION LAYERS
-- EDU-01 Â· MED-01 Â· SPT-01 Â· LEG-01 Â· TUR-01 Â· CMP-01
-- Dynamically loaded based on tenant.sector_code
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- [EDU-01] EDUCATION & COURSES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE TABLE IF NOT EXISTS public.edu_instructors (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id       uuid        REFERENCES auth.users(id),
  employee_id   uuid,
  full_name     text        NOT NULL,
  specialization text,
  bio           text,
  hourly_rate   numeric(10,4) DEFAULT 0,
  rating        numeric(3,2) DEFAULT 0,
  is_active     boolean     DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edu_courses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  instructor_id   uuid        REFERENCES public.edu_instructors(id),
  title           text        NOT NULL,
  code            text        NOT NULL,
  description     text,
  category        text,
  level           text        DEFAULT 'beginner', -- beginner, intermediate, advanced
  duration_hours  numeric(6,2) DEFAULT 0,
  sessions_count  int         DEFAULT 0,
  price           numeric(10,4) DEFAULT 0,
  currency        text        DEFAULT 'USD',
  max_students    int         DEFAULT 30,
  is_active       boolean     DEFAULT true,
  materials_url   text,
  syllabus        jsonb       DEFAULT '[]',
  created_at      timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS public.edu_class_schedules (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id     uuid        NOT NULL REFERENCES public.edu_courses(id) ON DELETE CASCADE,
  instructor_id uuid        REFERENCES public.edu_instructors(id),
  session_date  date        NOT NULL,
  start_time    time        NOT NULL,
  end_time      time        NOT NULL,
  room          text,
  online_url    text,
  session_type  text        DEFAULT 'in_person', -- in_person, online, hybrid
  status        text        DEFAULT 'scheduled', -- scheduled, completed, cancelled
  notes         text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edu_enrollments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id       uuid        NOT NULL REFERENCES public.edu_courses(id),
  student_name    text        NOT NULL,
  student_email   text,
  student_phone   text,
  customer_id     uuid,
  enrollment_date date        NOT NULL DEFAULT CURRENT_DATE,
  status          text        DEFAULT 'active', -- active, completed, suspended, refunded
  -- Subscription balance deduction model
  balance_sessions int        DEFAULT 0,   -- Prepaid session credits
  sessions_used    int        DEFAULT 0,
  session_fee      numeric(10,4) DEFAULT 0, -- Fee deducted per session attended
  total_paid       numeric(10,4) DEFAULT 0,
  total_deducted   numeric(10,4) DEFAULT 0,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edu_session_attendance (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  schedule_id    uuid        NOT NULL REFERENCES public.edu_class_schedules(id),
  enrollment_id  uuid        NOT NULL REFERENCES public.edu_enrollments(id),
  attended       boolean     DEFAULT false,
  check_in_time  timestamptz,
  fee_deducted   numeric(10,4) DEFAULT 0,
  balance_before int,
  balance_after  int,
  notes          text,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (schedule_id, enrollment_id)
);

-- Auto-deduct session fee on attendance
CREATE OR REPLACE FUNCTION public.fn_edu_deduct_session_fee()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_enrollment record;
BEGIN
  IF NEW.attended = true AND (OLD.attended = false OR OLD.attended IS NULL) THEN
    SELECT * INTO v_enrollment FROM public.edu_enrollments WHERE id = NEW.enrollment_id;

    IF v_enrollment.balance_sessions > 0 THEN
      NEW.fee_deducted   := v_enrollment.session_fee;
      NEW.balance_before := v_enrollment.balance_sessions;
      NEW.balance_after  := v_enrollment.balance_sessions - 1;

      UPDATE public.edu_enrollments
      SET balance_sessions = balance_sessions - 1,
          sessions_used    = sessions_used + 1,
          total_deducted   = total_deducted + v_enrollment.session_fee
      WHERE id = NEW.enrollment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_edu_deduct_session_fee
  BEFORE INSERT OR UPDATE OF attended ON public.edu_session_attendance
  FOR EACH ROW EXECUTE FUNCTION public.fn_edu_deduct_session_fee();

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- [MED-01] MEDICAL & HEALTHCARE
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE TABLE IF NOT EXISTS public.med_patients (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_number   text        NOT NULL,
  full_name        text        NOT NULL,
  date_of_birth    date,
  gender           text        CHECK (gender IN ('male','female','other','unknown')),
  blood_type       text,
  national_id      text,
  insurance_id     text,
  insurance_provider text,
  phone            text,
  email            text,
  address          jsonb       DEFAULT '{}',
  emergency_contact jsonb      DEFAULT '{}',
  allergies        text[]      DEFAULT '{}',
  chronic_conditions text[]    DEFAULT '{}',
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, patient_number)
);

CREATE TABLE IF NOT EXISTS public.med_doctors (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id    uuid,
  full_name      text        NOT NULL,
  specialization text        NOT NULL,
  license_number text,
  consultation_fee numeric(10,4) DEFAULT 0,
  currency       text        DEFAULT 'USD',
  schedule       jsonb       DEFAULT '{}',  -- weekly availability
  is_active      boolean     DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_appointments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id     uuid        NOT NULL REFERENCES public.med_patients(id),
  doctor_id      uuid        REFERENCES public.med_doctors(id),
  appointment_date date      NOT NULL,
  start_time     time        NOT NULL,
  end_time       time,
  appointment_type text      DEFAULT 'consultation', -- consultation, follow_up, procedure, emergency
  status         text        DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
  chief_complaint text,
  notes          text,
  fee            numeric(10,4) DEFAULT 0,
  is_billed      boolean     DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_ehr_records (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id        uuid        NOT NULL REFERENCES public.med_patients(id),
  appointment_id    uuid        REFERENCES public.med_appointments(id),
  doctor_id         uuid        REFERENCES public.med_doctors(id),
  visit_date        date        NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint   text,
  diagnosis         text,
  icd_codes         text[]      DEFAULT '{}',
  treatment_plan    text,
  clinical_notes    text,
  vital_signs       jsonb       DEFAULT '{}',  -- {bp, pulse, temp, weight, height, spo2}
  lab_results       jsonb       DEFAULT '{}',
  imaging_refs      text[]      DEFAULT '{}',
  follow_up_date    date,
  is_confidential   boolean     DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_prescriptions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id       uuid        NOT NULL REFERENCES public.med_patients(id),
  ehr_id           uuid        REFERENCES public.med_ehr_records(id),
  doctor_id        uuid        REFERENCES public.med_doctors(id),
  prescription_date date       NOT NULL DEFAULT CURRENT_DATE,
  medications      jsonb       NOT NULL DEFAULT '[]',
                   -- [{name, dosage, frequency, duration, instructions}]
  notes            text,
  is_dispensed     boolean     DEFAULT false,
  dispensed_at     timestamptz,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_billing_categories (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  code         text        NOT NULL,
  category     text        DEFAULT 'consultation', -- consultation, lab, imaging, procedure, medication, room
  default_price numeric(10,4) DEFAULT 0,
  currency     text        DEFAULT 'USD',
  insurance_code text,
  is_active    boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- [SPT-01] SPORTS & GYMS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE TABLE IF NOT EXISTS public.spt_membership_plans (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_name      text        NOT NULL,
  plan_code      text        NOT NULL,
  duration_days  int         NOT NULL DEFAULT 30,
  price          numeric(10,4) NOT NULL,
  currency       text        DEFAULT 'USD',
  access_zones   text[]      DEFAULT '{}',  -- gym, pool, sauna, classes, etc.
  sessions_included int      DEFAULT -1,   -- -1 = unlimited
  freeze_days_allowed int    DEFAULT 0,
  is_active      boolean     DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (tenant_id, plan_code)
);

CREATE TABLE IF NOT EXISTS public.spt_members (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_number    text        NOT NULL,
  full_name        text        NOT NULL,
  email            text,
  phone            text,
  date_of_birth    date,
  gender           text,
  photo_url        text,
  rfid_card        text,        -- RFID card number for access gate
  emergency_contact jsonb      DEFAULT '{}',
  customer_id      uuid,
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, member_number)
);

CREATE TABLE IF NOT EXISTS public.spt_subscriptions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id         uuid        NOT NULL REFERENCES public.spt_members(id),
  plan_id           uuid        NOT NULL REFERENCES public.spt_membership_plans(id),
  start_date        date        NOT NULL DEFAULT CURRENT_DATE,
  end_date          date        NOT NULL,
  status            text        DEFAULT 'active', -- active, expired, frozen, cancelled
  sessions_used     int         DEFAULT 0,
  freeze_days_used  int         DEFAULT 0,
  freeze_until      date,
  amount_paid       numeric(10,4) DEFAULT 0,
  trainer_id        uuid,
  invoice_id        uuid        REFERENCES public.fin_invoices(id),
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spt_trainers (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id    uuid,
  full_name      text        NOT NULL,
  specialization text,
  hourly_rate    numeric(10,4) DEFAULT 0,
  assigned_members_count int DEFAULT 0,
  certifications text[]      DEFAULT '{}',
  is_active      boolean     DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spt_access_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id      uuid        REFERENCES public.spt_members(id),
  gate_id        text,
  access_type    text        DEFAULT 'entry', -- entry, exit
  access_method  text        DEFAULT 'rfid',  -- rfid, qr, facial, manual
  access_time    timestamptz NOT NULL DEFAULT now(),
  was_granted    boolean     DEFAULT true,
  denial_reason  text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spt_session_bookings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id      uuid        NOT NULL REFERENCES public.spt_members(id),
  trainer_id     uuid        REFERENCES public.spt_trainers(id),
  session_date   date        NOT NULL,
  start_time     time        NOT NULL,
  end_time       time,
  session_type   text        DEFAULT 'personal', -- personal, group, class
  status         text        DEFAULT 'booked', -- booked, completed, cancelled, no_show
  notes          text,
  created_at     timestamptz DEFAULT now()
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- [LEG-01] LEGAL SERVICES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE TABLE IF NOT EXISTS public.leg_cases (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_number      text        NOT NULL,
  title            text        NOT NULL,
  case_type        text,        -- civil, criminal, commercial, family, labour, administrative
  client_id        uuid,
  client_name      text,
  opposing_party   text,
  court_name       text,
  judge_name       text,
  assigned_lawyer_id uuid,
  open_date        date        NOT NULL DEFAULT CURRENT_DATE,
  close_date       date,
  status           text        DEFAULT 'open', -- open, pending, closed, won, lost, settled, dropped
  priority         text        DEFAULT 'normal', -- low, normal, high, urgent
  description      text,
  outcome          text,
  retention_contract_id uuid,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, case_number)
);

CREATE TABLE IF NOT EXISTS public.leg_documents (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id        uuid        REFERENCES public.leg_cases(id),
  title          text        NOT NULL,
  doc_type       text        DEFAULT 'pleading', -- pleading, evidence, contract, court_order, correspondence, template
  file_url       text,
  file_hash      text,        -- SHA-256 for tamper evidence
  version        int         DEFAULT 1,
  is_confidential boolean    DEFAULT false,
  filed_date     date,
  expiry_date    date,
  tags           text[]      DEFAULT '{}',
  uploaded_by    uuid        REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leg_lawyers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id      uuid,
  full_name        text        NOT NULL,
  bar_number       text,
  specializations  text[]      DEFAULT '{}',
  hourly_rate      numeric(10,4) DEFAULT 0,
  court_rate       numeric(10,4) DEFAULT 0,   -- Per court session fee
  currency         text        DEFAULT 'USD',
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leg_appointments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id         uuid        REFERENCES public.leg_cases(id),
  lawyer_id       uuid        REFERENCES public.leg_lawyers(id),
  client_id       uuid,
  appt_date       date        NOT NULL,
  start_time      time        NOT NULL,
  appt_type       text        DEFAULT 'client_meeting', -- client_meeting, court_hearing, deposition
  status          text        DEFAULT 'scheduled',
  location        text,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leg_contracts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id         uuid        REFERENCES public.leg_cases(id),
  client_id       uuid,
  client_name     text,
  contract_type   text        DEFAULT 'retainer', -- retainer, contingency, fixed_fee, hourly
  start_date      date        NOT NULL DEFAULT CURRENT_DATE,
  end_date        date,
  retainer_amount numeric(12,4) DEFAULT 0,
  hourly_rate     numeric(10,4) DEFAULT 0,
  currency        text        DEFAULT 'USD',
  status          text        DEFAULT 'active',
  terms           text,
  signed_at       timestamptz,
  file_url        text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leg_billing_timesheets (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id        uuid        REFERENCES public.leg_cases(id),
  lawyer_id      uuid        REFERENCES public.leg_lawyers(id),
  entry_date     date        NOT NULL DEFAULT CURRENT_DATE,
  entry_type     text        NOT NULL DEFAULT 'hourly', -- hourly, court_session, flat
  hours          numeric(6,2),
  rate           numeric(10,4),
  court_sessions int         DEFAULT 0,
  court_rate     numeric(10,4),
  amount         numeric(12,4) NOT NULL DEFAULT 0,
  currency       text        DEFAULT 'USD',
  description    text,
  is_billed      boolean     DEFAULT false,
  invoice_id     uuid        REFERENCES public.fin_invoices(id),
  created_at     timestamptz DEFAULT now()
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- [TUR-01] TOURISM & TRAVEL
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE TABLE IF NOT EXISTS public.tur_destinations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  country_code text,
  region       text,
  description  text,
  images       jsonb       DEFAULT '[]',
  is_active    boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tur_trips (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  trip_code         text        NOT NULL,
  title             text        NOT NULL,
  destination_id    uuid        REFERENCES public.tur_destinations(id),
  trip_type         text        DEFAULT 'group', -- group, private, corporate, hajj_umrah
  departure_date    date        NOT NULL,
  return_date       date        NOT NULL,
  departure_airport text,
  price_per_person  numeric(10,4) NOT NULL,
  currency          text        DEFAULT 'USD',
  max_capacity      int         DEFAULT 20,
  booked_count      int         DEFAULT 0,
  includes          jsonb       DEFAULT '[]',  -- ['flight','hotel','visa','transport']
  excludes          jsonb       DEFAULT '[]',
  itinerary         jsonb       DEFAULT '[]',
  status            text        DEFAULT 'active', -- active, full, completed, cancelled
  created_at        timestamptz DEFAULT now(),
  UNIQUE (tenant_id, trip_code)
);

CREATE TABLE IF NOT EXISTS public.tur_hotel_allotments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hotel_name        text        NOT NULL,
  destination_id    uuid        REFERENCES public.tur_destinations(id),
  room_type         text        NOT NULL, -- single, double, triple, suite
  total_rooms       int         NOT NULL DEFAULT 0,
  available_rooms   int         NOT NULL DEFAULT 0,
  cost_per_night    numeric(10,4) DEFAULT 0,
  sell_price        numeric(10,4) DEFAULT 0,
  currency          text        DEFAULT 'USD',
  check_in_date     date,
  check_out_date    date,
  contract_ref      text,
  is_active         boolean     DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tur_bookings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_number   text        NOT NULL,
  trip_id          uuid        REFERENCES public.tur_trips(id),
  customer_id      uuid,
  customer_name    text        NOT NULL,
  customer_email   text,
  customer_phone   text,
  passenger_count  int         NOT NULL DEFAULT 1,
  passengers       jsonb       DEFAULT '[]',  -- [{name, passport, dob, nationality}]
  hotel_id         uuid        REFERENCES public.tur_hotel_allotments(id),
  room_count       int         DEFAULT 1,
  total_amount     numeric(14,4) NOT NULL,
  paid_amount      numeric(14,4) DEFAULT 0,
  currency         text        DEFAULT 'USD',
  agent_id         uuid,        -- External agent / affiliate
  commission_rate  numeric(5,2) DEFAULT 0,
  commission_amount numeric(12,4) DEFAULT 0,
  status           text        DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  visa_status      text        DEFAULT 'not_required',
  notes            text,
  invoice_id       uuid        REFERENCES public.fin_invoices(id),
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, booking_number)
);

CREATE TABLE IF NOT EXISTS public.tur_agent_commissions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_id     uuid        NOT NULL REFERENCES public.tur_bookings(id),
  agent_id       uuid,
  agent_name     text,
  booking_amount numeric(12,4) NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  commission_amount numeric(12,4) NOT NULL,
  currency       text        DEFAULT 'USD',
  status         text        DEFAULT 'pending', -- pending, approved, paid
  paid_at        timestamptz,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- [CMP-01] COMPANIES & PROFESSIONAL SERVICES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE TABLE IF NOT EXISTS public.cmp_projects (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_code     text        NOT NULL,
  title            text        NOT NULL,
  client_id        uuid,
  client_name      text,
  project_manager_id uuid,
  start_date       date,
  end_date         date,
  status           text        DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
  priority         text        DEFAULT 'normal',
  budget           numeric(14,4) DEFAULT 0,
  currency         text        DEFAULT 'USD',
  spent_amount     numeric(14,4) DEFAULT 0,
  completion_pct   numeric(5,2) DEFAULT 0,
  description      text,
  tags             text[]      DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, project_code)
);

CREATE TABLE IF NOT EXISTS public.cmp_milestones (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id     uuid        NOT NULL REFERENCES public.cmp_projects(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  description    text,
  due_date       date,
  completion_date date,
  status         text        DEFAULT 'pending', -- pending, in_progress, completed, delayed, cancelled
  payment_amount numeric(12,4) DEFAULT 0,   -- Milestone-based billing amount
  is_billed      boolean     DEFAULT false,
  invoice_id     uuid        REFERENCES public.fin_invoices(id),
  sort_order     int         DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cmp_service_tickets (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ticket_number    text        NOT NULL,
  project_id       uuid        REFERENCES public.cmp_projects(id),
  client_id        uuid,
  client_name      text,
  subject          text        NOT NULL,
  description      text,
  ticket_type      text        DEFAULT 'support', -- support, bug, feature, inquiry, change_request
  priority         text        DEFAULT 'normal', -- low, normal, high, urgent, critical
  status           text        DEFAULT 'open', -- open, in_progress, pending_client, resolved, closed
  assigned_to      uuid        REFERENCES auth.users(id),
  sla_policy_id    uuid,
  sla_due_at       timestamptz,
  sla_breached     boolean     DEFAULT false,
  first_response_at timestamptz,
  resolved_at      timestamptz,
  closed_at        timestamptz,
  tags             text[]      DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, ticket_number)
);

CREATE TABLE IF NOT EXISTS public.cmp_sla_policies (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  policy_name           text        NOT NULL,
  priority_level        text        NOT NULL, -- low, normal, high, urgent, critical
  first_response_hours  numeric(6,2) NOT NULL DEFAULT 4,
  resolution_hours      numeric(6,2) NOT NULL DEFAULT 24,
  escalation_hours      numeric(6,2),
  business_hours_only   boolean     DEFAULT true,
  notification_emails   text[]      DEFAULT '{}',
  is_active             boolean     DEFAULT true,
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cmp_timesheets (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id     uuid        REFERENCES public.cmp_projects(id),
  ticket_id      uuid        REFERENCES public.cmp_service_tickets(id),
  employee_id    uuid,
  user_id        uuid        REFERENCES auth.users(id),
  entry_date     date        NOT NULL DEFAULT CURRENT_DATE,
  start_time     time,
  end_time       time,
  hours          numeric(6,2) NOT NULL DEFAULT 0,
  hourly_rate    numeric(10,4) DEFAULT 0,
  billable_amount numeric(12,4) DEFAULT 0,
  is_billable    boolean     DEFAULT true,
  description    text,
  status         text        DEFAULT 'pending', -- pending, approved, rejected, billed
  approved_by    uuid        REFERENCES auth.users(id),
  approved_at    timestamptz,
  invoice_id     uuid        REFERENCES public.fin_invoices(id),
  created_at     timestamptz DEFAULT now()
);

-- â”€â”€â”€ BULK RLS FOR ALL SECTOR TABLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.edu_instructors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_courses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_class_schedules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_enrollments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_session_attendance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_patients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_doctors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_ehr_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_prescriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_billing_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_membership_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_trainers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_access_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_session_bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_cases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_lawyers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_contracts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_billing_timesheets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_destinations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_trips                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_hotel_allotments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_agent_commissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_milestones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_service_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_sla_policies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_timesheets           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edu_instructors_all"        ON public.edu_instructors        FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_courses_all"            ON public.edu_courses            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_class_schedules_all"    ON public.edu_class_schedules    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_enrollments_all"        ON public.edu_enrollments        FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_session_attendance_all" ON public.edu_session_attendance FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_patients_all"           ON public.med_patients           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_doctors_all"            ON public.med_doctors            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_appointments_all"       ON public.med_appointments       FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_ehr_records_all"        ON public.med_ehr_records        FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_prescriptions_all"      ON public.med_prescriptions      FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_billing_categories_all" ON public.med_billing_categories FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_membership_plans_all"   ON public.spt_membership_plans   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_members_all"            ON public.spt_members            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_subscriptions_all"      ON public.spt_subscriptions      FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_trainers_all"           ON public.spt_trainers           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_access_logs_all"        ON public.spt_access_logs        FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_session_bookings_all"   ON public.spt_session_bookings   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_cases_all"              ON public.leg_cases              FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_documents_all"          ON public.leg_documents          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_lawyers_all"            ON public.leg_lawyers            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_appointments_all"       ON public.leg_appointments       FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_contracts_all"          ON public.leg_contracts          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_billing_timesheets_all" ON public.leg_billing_timesheets FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_destinations_all"       ON public.tur_destinations       FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_trips_all"              ON public.tur_trips              FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_hotel_allotments_all"   ON public.tur_hotel_allotments   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_bookings_all"           ON public.tur_bookings           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_agent_commissions_all"  ON public.tur_agent_commissions  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_projects_all"           ON public.cmp_projects           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_milestones_all"         ON public.cmp_milestones         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_service_tickets_all"    ON public.cmp_service_tickets    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_sla_policies_all"       ON public.cmp_sla_policies       FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_timesheets_all"         ON public.cmp_timesheets         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- â”€â”€â”€ SECTOR INDEXES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_edu_courses_tenant       ON public.edu_courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edu_enrollments_course   ON public.edu_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_edu_attendance_schedule  ON public.edu_session_attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_med_patients_tenant      ON public.med_patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_med_appointments_date    ON public.med_appointments(tenant_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_spt_members_tenant       ON public.spt_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_spt_subscriptions_status ON public.spt_subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_spt_access_logs_time     ON public.spt_access_logs(tenant_id, access_time DESC);
CREATE INDEX IF NOT EXISTS idx_leg_cases_status         ON public.leg_cases(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leg_documents_case       ON public.leg_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_tur_bookings_status      ON public.tur_bookings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tur_trips_dates          ON public.tur_trips(departure_date, return_date);
CREATE INDEX IF NOT EXISTS idx_cmp_projects_status      ON public.cmp_projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cmp_tickets_status       ON public.cmp_service_tickets(tenant_id, status, sla_due_at);
CREATE INDEX IF NOT EXISTS idx_cmp_timesheets_project   ON public.cmp_timesheets(project_id, entry_date);



-- ═══ FILE: supabase/migrations/20260611000006_erp_telemetry.sql ═══
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- KEMETRISE â€” TELEMETRY, OBSERVABILITY & WEBHOOK ORCHESTRATION
-- Central Router Manager Â· Event Bus Â· Auto-Retry Queue Â· KemetRise Nervous System
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€â”€ TELEMETRY EVENTS (immutable audit ledger) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text        NOT NULL,   -- text to allow system-level events without FK
  sector_code     text        NOT NULL    DEFAULT 'SYSTEM',
  active_agent_id text        NOT NULL    DEFAULT 'A-AGENT-SYS',
  event_category  text        NOT NULL,   -- transaction, attendance, invoice, order, system, security
  event_name      text        NOT NULL,   -- invoice.created, qr.scan, order.placed, login.failed, etc.
  status          text        NOT NULL    DEFAULT 'success' CHECK (status IN ('success','error','warning','info')),
  source_table    text,
  source_id       text,
  user_id         text,
  ip_address      inet,
  user_agent      text,
  payload         jsonb       DEFAULT '{}',
  error_message   text,
  duration_ms     int,
  timestamp       timestamptz NOT NULL    DEFAULT now()
);

-- Partition hint: large table, time-series oriented
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_ts      ON public.telemetry_events(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_event_name     ON public.telemetry_events(event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_status         ON public.telemetry_events(status, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_agent          ON public.telemetry_events(active_agent_id);

-- â”€â”€â”€ WEBHOOK ENDPOINT REGISTRY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Tenants register their external endpoints to receive system events.
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  url             text        NOT NULL,
  secret          text,        -- HMAC secret for signature verification
  events          text[]      NOT NULL DEFAULT '{}',  -- event names to filter
  is_active       boolean     DEFAULT true,
  retry_attempts  int         DEFAULT 3,
  retry_delay_ms  int         DEFAULT 5000,
  timeout_ms      int         DEFAULT 10000,
  headers         jsonb       DEFAULT '{}',  -- extra headers to send
  format          text        DEFAULT 'json', -- json, form
  created_at      timestamptz DEFAULT now()
);

-- â”€â”€â”€ WEBHOOK DELIVERY LOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Table may already exist from earlier migrations â€” use ALTER to add ERP columns.
DO $erp_wd$ BEGIN
  -- Create fresh if not exists
  CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    status          text        NOT NULL DEFAULT 'pending',
    created_at      timestamptz DEFAULT now()
  );
END $erp_wd$;

-- Add ERP columns idempotently
ALTER TABLE public.webhook_deliveries
  ADD COLUMN IF NOT EXISTS endpoint_id      uuid        REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id        uuid,
  ADD COLUMN IF NOT EXISTS event_name       text,
  ADD COLUMN IF NOT EXISTS event_id         uuid,
  ADD COLUMN IF NOT EXISTS payload          jsonb       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS response_status  int,
  ADD COLUMN IF NOT EXISTS response_body    text,
  ADD COLUMN IF NOT EXISTS response_headers jsonb       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attempt_number   int         DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_attempts     int         DEFAULT 3,
  ADD COLUMN IF NOT EXISTS next_retry_at    timestamptz,
  ADD COLUMN IF NOT EXISTS duration_ms      int,
  ADD COLUMN IF NOT EXISTS error_message    text,
  ADD COLUMN IF NOT EXISTS sent_at          timestamptz;

-- Add CHECK constraint only if it doesn't exist
DO $wd_check$ BEGIN
  ALTER TABLE public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_status_check
    CHECK (status IN ('pending','success','failed','retrying','abandoned'));
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL;
END $wd_check$;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status    ON public.webhook_deliveries(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant    ON public.webhook_deliveries(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint  ON public.webhook_deliveries(endpoint_id, created_at DESC);

-- â”€â”€â”€ CENTRAL ROUTER OUTBOX (n8n integration) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- All system mutations emit to this outbox; n8n polls and routes to workflows.
CREATE TABLE IF NOT EXISTS public.central_router_outbox (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text        NOT NULL,
  sector_code     text        NOT NULL,
  active_agent_id text        NOT NULL,
  workflow_code   text,
  event_name      text        NOT NULL,
  status          text        NOT NULL DEFAULT 'success',
  payload         jsonb       NOT NULL DEFAULT '{}',
  timestamp       timestamptz NOT NULL DEFAULT now(),
  processed       boolean     DEFAULT false,
  processed_at    timestamptz,
  retry_count     int         DEFAULT 0,
  last_error      text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_central_router_unprocessed ON public.central_router_outbox(processed, created_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_central_router_tenant      ON public.central_router_outbox(tenant_id, created_at DESC);

-- â”€â”€â”€ RETRY QUEUE (auto-retry with exponential backoff) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.webhook_retry_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id     uuid        REFERENCES public.webhook_deliveries(id) ON DELETE CASCADE,
  tenant_id       uuid,
  attempt_number  int         NOT NULL DEFAULT 1,
  scheduled_at    timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz,
  status          text        DEFAULT 'pending', -- pending, processing, done, failed
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retry_queue_scheduled ON public.webhook_retry_queue(scheduled_at) WHERE status = 'pending';

-- â”€â”€â”€ ROW LEVEL SECURITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.telemetry_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.central_router_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_retry_queue   ENABLE ROW LEVEL SECURITY;

-- Telemetry: tenant-scoped read (text comparison for tenant_id)
CREATE POLICY "telemetry_select" ON public.telemetry_events FOR SELECT
  USING (
    tenant_id = auth.uid()::text
    OR tenant_id IN (
      SELECT id::text FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT t.id::text FROM public.tenant_members tm
      JOIN public.tenants t ON t.id = tm.tenant_id
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
  );

-- Service accounts / edge functions can insert telemetry
CREATE POLICY "telemetry_insert" ON public.telemetry_events FOR INSERT
  WITH CHECK (true);  -- Controlled by edge function auth

CREATE POLICY "webhook_endpoints_all"     ON public.webhook_endpoints     FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries    FOR SELECT USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "webhook_deliveries_insert" ON public.webhook_deliveries    FOR INSERT WITH CHECK (true);
CREATE POLICY "webhook_deliveries_update" ON public.webhook_deliveries    FOR UPDATE USING (true);
CREATE POLICY "central_router_select"     ON public.central_router_outbox FOR SELECT USING (
  tenant_id IN (
    SELECT id::text FROM public.tenants WHERE owner_user_id = auth.uid()
    UNION
    SELECT t.id::text FROM public.tenant_members tm
    JOIN public.tenants t ON t.id = tm.tenant_id
    WHERE tm.user_id = auth.uid() AND tm.is_active = true
  )
);
CREATE POLICY "central_router_insert"     ON public.central_router_outbox FOR INSERT WITH CHECK (true);
CREATE POLICY "retry_queue_all"           ON public.webhook_retry_queue   FOR ALL USING (true);

-- â”€â”€â”€ MASTER EMIT FUNCTION: Routes all ERP events to Central Router â”€â”€â”€â”€â”€â”€â”€â”€
-- Called by any table trigger or application code to emit a standardized payload.
CREATE OR REPLACE FUNCTION public.fn_emit_telemetry(
  p_tenant_id       text,
  p_sector_code     text,
  p_active_agent_id text,
  p_event_name      text,
  p_status          text     DEFAULT 'success',
  p_source_table    text     DEFAULT NULL,
  p_source_id       text     DEFAULT NULL,
  p_payload         jsonb    DEFAULT '{}',
  p_workflow_code   text     DEFAULT NULL,
  p_error_message   text     DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_outbox_id uuid;
BEGIN
  -- 1. Write to immutable telemetry ledger
  INSERT INTO public.telemetry_events
    (tenant_id, sector_code, active_agent_id, event_name, status,
     source_table, source_id, payload, error_message)
  VALUES
    (p_tenant_id, p_sector_code, p_active_agent_id, p_event_name, p_status,
     p_source_table, p_source_id, p_payload, p_error_message)
  RETURNING id INTO v_event_id;

  -- 2. Write to Central Router outbox for n8n pickup
  INSERT INTO public.central_router_outbox
    (tenant_id, sector_code, active_agent_id, workflow_code, event_name, status, payload)
  VALUES (
    p_tenant_id,
    p_sector_code,
    p_active_agent_id,
    p_workflow_code,
    p_event_name,
    p_status,
    jsonb_build_object(
      'tenant_id',       p_tenant_id,
      'sector_code',     p_sector_code,
      'active_agent_id', p_active_agent_id,
      'event_name',      p_event_name,
      'status',          p_status,
      'timestamp',       now(),
      'source_table',    p_source_table,
      'source_id',       p_source_id,
      'data',            p_payload
    )
  )
  RETURNING id INTO v_outbox_id;

  -- 3. Fan-out to registered tenant webhook endpoints
  INSERT INTO public.webhook_deliveries
    (endpoint_id, tenant_id, event_name, event_id, payload, status, max_attempts, next_retry_at)
  SELECT
    we.id,
    we.tenant_id,
    p_event_name,
    v_event_id,
    jsonb_build_object(
      'tenant_id',       p_tenant_id,
      'sector_code',     p_sector_code,
      'active_agent_id', p_active_agent_id,
      'status',          p_status,
      'timestamp',       now()::text
    ),
    'pending',
    we.retry_attempts,
    now()
  FROM public.webhook_endpoints we
  WHERE we.tenant_id::text = p_tenant_id
    AND we.is_active = true
    AND (we.events = '{}' OR p_event_name = ANY(we.events));

  RETURN v_event_id;
END;
$$;

-- â”€â”€â”€ TRIGGER HELPER: Generic table mutation telemetry emitter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Attach this to any table with tenant_id + sector_code columns.
CREATE OR REPLACE FUNCTION public.fn_table_telemetry_emit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_name  text;
  v_tenant_id   text;
  v_sector_code text;
  v_source_id   text;
BEGIN
  v_event_name  := TG_TABLE_NAME || '.' || lower(TG_OP);
  v_tenant_id   := COALESCE(NEW.tenant_id::text, OLD.tenant_id::text, 'unknown');
  v_sector_code := COALESCE(NEW.sector_code, 'SYSTEM');
  v_source_id   := COALESCE(NEW.id::text, OLD.id::text);

  PERFORM public.fn_emit_telemetry(
    v_tenant_id, v_sector_code, 'A-AGENT-SYS',
    v_event_name, 'success',
    TG_TABLE_NAME, v_source_id,
    jsonb_build_object('op', TG_OP)
  );
  RETURN NEW;
END;
$$;

-- â”€â”€â”€ WIRE TELEMETRY TRIGGERS ON KEY TABLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE TRIGGER trg_tel_fin_invoices
  AFTER INSERT OR UPDATE ON public.fin_invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_table_telemetry_emit();

CREATE OR REPLACE TRIGGER trg_tel_com_orders
  AFTER INSERT OR UPDATE ON public.com_orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_table_telemetry_emit();

CREATE OR REPLACE TRIGGER trg_tel_hr_attendance
  AFTER INSERT ON public.hr_attendance_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_table_telemetry_emit();

CREATE OR REPLACE TRIGGER trg_tel_hr_payroll_cycles
  AFTER UPDATE OF status ON public.hr_payroll_cycles
  FOR EACH ROW EXECUTE FUNCTION public.fn_table_telemetry_emit();

-- â”€â”€â”€ FUNCTION: Retry failed webhook deliveries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Called by pg_cron or edge function on a schedule.
CREATE OR REPLACE FUNCTION public.fn_retry_webhook_deliveries()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
  v_rec   record;
BEGIN
  FOR v_rec IN
    SELECT id, attempt_number, max_attempts, endpoint_id
    FROM public.webhook_deliveries
    WHERE status IN ('failed', 'retrying')
      AND next_retry_at <= now()
      AND attempt_number < max_attempts
  LOOP
    UPDATE public.webhook_deliveries
    SET
      status         = 'retrying',
      attempt_number = attempt_number + 1,
      next_retry_at  = now() + (5000 * attempt_number || ' milliseconds')::interval
    WHERE id = v_rec.id;

    INSERT INTO public.webhook_retry_queue (delivery_id, tenant_id, attempt_number, scheduled_at)
    SELECT v_rec.id, tenant_id, v_rec.attempt_number + 1, now()
    FROM public.webhook_deliveries WHERE id = v_rec.id;

    v_count := v_count + 1;
  END LOOP;

  -- Mark permanently failed (exceeded max_attempts)
  UPDATE public.webhook_deliveries
  SET status = 'abandoned'
  WHERE status = 'retrying'
    AND attempt_number >= max_attempts
    AND next_retry_at <= now();

  RETURN v_count;
END;
$$;



-- ═══ FILE: supabase/migrations/20260611000007_erp_fix_rls_recursion.sql ═══
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- KEMETRISE ERP â€” FIX: Infinite RLS recursion on tenants / tenant_members
--
-- Root cause:
--   tenants_select  â†’ queries tenant_members
--   tenant_members_select â†’ queries tenants   (LOOP)
--
-- Also: get_user_tenant_ids() queries tenants while tenants RLS is active
--
-- Fix strategy:
--   1. Rebuild get_user_tenant_ids() with SET row_security = off
--   2. Simplify tenant_members policies to NEVER query tenants
--   3. Simplify tenants policies to NEVER query tenant_members via subquery
--      that itself triggers tenant_members RLS that re-queries tenants
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€â”€ 1. REBUILD HELPER FUNCTIONS WITH row_security = off â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- This breaks the recursion: inside these SECURITY DEFINER functions,
-- RLS is bypassed so they can safely query tenants & tenant_members directly.

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
  UNION
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id AND owner_user_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$;

-- â”€â”€â”€ 2. DROP ALL EXISTING POLICIES on tenants & tenant_members â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

DROP POLICY IF EXISTS "tenants_select"          ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert"          ON public.tenants;
DROP POLICY IF EXISTS "tenants_update"          ON public.tenants;
DROP POLICY IF EXISTS "tenants_delete"          ON public.tenants;
DROP POLICY IF EXISTS "tenant_members_select"   ON public.tenant_members;
DROP POLICY IF EXISTS "tenant_members_insert"   ON public.tenant_members;
DROP POLICY IF EXISTS "tenant_members_update"   ON public.tenant_members;
DROP POLICY IF EXISTS "workflow_registry_select" ON public.workflow_registry;
DROP POLICY IF EXISTS "workflow_registry_write"  ON public.workflow_registry;
DROP POLICY IF EXISTS "sector_configs_all"       ON public.sector_configs;

-- â”€â”€â”€ 3. TENANTS â€” safe non-recursive policies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Uses get_user_tenant_ids() which has row_security=off, breaking the loop.

CREATE POLICY "erp_tenants_select" ON public.tenants FOR SELECT
  USING ( id IN (SELECT public.get_user_tenant_ids()) );

CREATE POLICY "erp_tenants_insert" ON public.tenants FOR INSERT
  WITH CHECK ( owner_user_id = auth.uid() );

CREATE POLICY "erp_tenants_update" ON public.tenants FOR UPDATE
  USING ( public.is_tenant_admin(id) );

CREATE POLICY "erp_tenants_delete" ON public.tenants FOR DELETE
  USING ( owner_user_id = auth.uid() );

-- â”€â”€â”€ 4. TENANT MEMBERS â€” never cross-reference tenants in policy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Simple rule: you can see rows where you are the member OR any row in
-- a tenant you own. We check ownership via get_user_tenant_ids() (row_security=off).

CREATE POLICY "erp_tenant_members_select" ON public.tenant_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR tenant_id IN (SELECT public.get_user_tenant_ids())
  );

CREATE POLICY "erp_tenant_members_insert" ON public.tenant_members FOR INSERT
  WITH CHECK (
    public.is_tenant_admin(tenant_id)
  );

CREATE POLICY "erp_tenant_members_update" ON public.tenant_members FOR UPDATE
  USING (
    public.is_tenant_admin(tenant_id)
  );

CREATE POLICY "erp_tenant_members_delete" ON public.tenant_members FOR DELETE
  USING (
    public.is_tenant_admin(tenant_id)
  );

-- â”€â”€â”€ 5. WORKFLOW REGISTRY & SECTOR CONFIGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE POLICY "erp_workflow_registry_select" ON public.workflow_registry FOR SELECT
  USING ( tenant_id IN (SELECT public.get_user_tenant_ids()) );

CREATE POLICY "erp_workflow_registry_write" ON public.workflow_registry FOR ALL
  USING ( public.is_tenant_admin(tenant_id) );

CREATE POLICY "erp_sector_configs_all" ON public.sector_configs FOR ALL
  USING ( tenant_id IN (SELECT public.get_user_tenant_ids()) );



-- ═══ FILE: supabase/migrations/20260611000008_erp_dynamic_sectors.sql ═══
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- KEMETRISE ERP â€” Migration 008
-- Dynamic Sector Registry, Education Module, HR QR Sessions,
-- Finance Tax Rules, Commerce product_type columns
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€â”€ 1. DYNAMIC SECTOR REGISTRY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.erp_sector_registry (
  code        text PRIMARY KEY,
  label       text NOT NULL,
  icon        text NOT NULL DEFAULT 'ðŸ¢',
  color       text NOT NULL DEFAULT '#6366f1',
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  config      jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_sector_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sectors_read_all" ON public.erp_sector_registry
  FOR SELECT USING (true);

CREATE POLICY "sectors_manage" ON public.erp_sector_registry
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

INSERT INTO public.erp_sector_registry (code, label, icon, color, description, sort_order) VALUES
  ('EDU-01', 'Education & Courses',   'ðŸŽ“', '#6366f1', 'Online/offline education, courses, student tracking',  1),
  ('MED-01', 'Medical & Healthcare',  'ðŸ¥', '#ef4444', 'Clinics, hospitals, patient management, appointments', 2),
  ('SPT-01', 'Sports & Gyms',         'ðŸ‹ï¸', '#f97316', 'Gym management, memberships, training sessions',      3),
  ('LEG-01', 'Legal Services',        'âš–ï¸', '#8b5cf6', 'Law firms, case management, client billing',           4),
  ('TUR-01', 'Tourism & Travel',      'âœˆï¸', '#06b6d4', 'Travel agencies, bookings, tour packages',             5),
  ('CMP-01', 'Companies & Services',  'ðŸ¢', '#10b981', 'General business, B2B services, consulting',           6),
  ('RET-01', 'Retail & E-Commerce',   'ðŸ›’', '#f59e0b', 'Retail stores, online shops, inventory management',    7),
  ('MULTI',  'Multi-Sector',          'ðŸŒ', '#64748b', 'Multi-sector tenant spanning several industries',       8)
ON CONFLICT (code) DO NOTHING;

-- â”€â”€â”€ 2. EDUCATION MODULE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.edu_courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  instructor_name text,
  price           numeric(12,2) NOT NULL DEFAULT 0,
  max_students    integer DEFAULT 30,
  is_active       boolean NOT NULL DEFAULT true,
  start_date      date,
  end_date        date,
  schedule_info   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edu_enrollments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES public.edu_courses(id) ON DELETE CASCADE,
  student_name    text NOT NULL,
  student_email   text,
  student_phone   text,
  enrolled_at     timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','dropped','suspended')),
  paid_amount     numeric(12,2) NOT NULL DEFAULT 0,
  balance_due     numeric(12,2) NOT NULL DEFAULT 0,
  notes           text
);

CREATE TABLE IF NOT EXISTS public.edu_attendance (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enrollment_id   uuid NOT NULL REFERENCES public.edu_enrollments(id) ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES public.edu_courses(id) ON DELETE CASCADE,
  attended_at     timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'present'
    CHECK (status IN ('present','absent','late','excused'))
);

ALTER TABLE public.edu_courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_attendance  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edu_courses_all"     ON public.edu_courses
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_enrollments_all" ON public.edu_enrollments
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_attendance_all"  ON public.edu_attendance
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- â”€â”€â”€ 3. HR QR SESSIONS + ATTENDANCE LOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.hr_qr_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  label       text,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  scans_count integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_attendance_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  employee_id   text,
  check_type    text NOT NULL DEFAULT 'in' CHECK (check_type IN ('in','out')),
  source        text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','qr','biometric','app')),
  qr_session_id uuid REFERENCES public.hr_qr_sessions(id) ON DELETE SET NULL,
  device_id     text,
  recorded_at   timestamptz NOT NULL DEFAULT now(),
  notes         text
);

ALTER TABLE public.hr_qr_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_qr_all"  ON public.hr_qr_sessions
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "hr_att_all" ON public.hr_attendance_log
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Function to generate QR session
CREATE OR REPLACE FUNCTION public.fn_create_qr_session(
  p_tenant_id uuid,
  p_label     text DEFAULT NULL,
  p_minutes   integer DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_session public.hr_qr_sessions;
BEGIN
  INSERT INTO public.hr_qr_sessions (tenant_id, label, expires_at)
  VALUES (p_tenant_id, p_label, now() + (p_minutes || ' minutes')::interval)
  RETURNING * INTO v_session;
  RETURN row_to_json(v_session);
END;
$$;
GRANT EXECUTE ON FUNCTION public.fn_create_qr_session TO authenticated;

-- â”€â”€â”€ 4. FINANCE TAX RULES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.fin_tax_rules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  rate_pct   numeric(6,4) NOT NULL DEFAULT 0,
  tax_type   text NOT NULL DEFAULT 'vat'
    CHECK (tax_type IN ('vat','income','withholding','custom')),
  authority  text,
  is_default boolean NOT NULL DEFAULT false,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_tax_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_tax_all" ON public.fin_tax_rules
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- â”€â”€â”€ 5. COMMERCE: digital product columns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.com_products ADD COLUMN IF NOT EXISTS
  file_url text;
ALTER TABLE public.com_products ADD COLUMN IF NOT EXISTS
  download_limit integer;
ALTER TABLE public.com_products ADD COLUMN IF NOT EXISTS
  low_stock_threshold integer NOT NULL DEFAULT 5;

-- â”€â”€â”€ 6. HR EMPLOYEES table (if not exists from migration 004) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.hr_employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  employee_code   text,
  department      text,
  position        text,
  email           text,
  phone           text,
  hire_date       date,
  base_salary     numeric(12,2) DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_employees_all" ON public.hr_employees
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));



