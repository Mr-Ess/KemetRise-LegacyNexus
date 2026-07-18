-- ============================================================
-- KemetRise ERP Cockpit — Comprehensive ERP Tables Migration
-- Modules: Accounting, CRM, Procurement, Inventory, Projects,
--          Payroll, Assets, Maintenance, Quality
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. ACCOUNTING MODULE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS acc_chart_of_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  code             TEXT NOT NULL,
  name             TEXT NOT NULL,
  account_type     TEXT NOT NULL DEFAULT 'asset'
                   CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  normal_balance   TEXT NOT NULL DEFAULT 'debit' CHECK (normal_balance IN ('debit','credit')),
  description      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS acc_journal_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  ref_number       TEXT NOT NULL,
  description      TEXT NOT NULL,
  entry_date       DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','posted','voided')),
  total_debit      NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_credit     NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS acc_budget_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  account_name     TEXT NOT NULL,
  period_label     TEXT NOT NULL,
  budgeted_amount  NUMERIC(18,2) NOT NULL DEFAULT 0,
  actual_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
  variance         NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 2. CRM MODULE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  company          TEXT,
  source           TEXT,
  stage            TEXT NOT NULL DEFAULT 'new'
                   CHECK (stage IN ('new','contacted','qualified','proposal','negotiation','won','lost')),
  value            NUMERIC(18,2),
  assigned_to      TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  lead_id          UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  activity_type    TEXT NOT NULL DEFAULT 'call'
                   CHECK (activity_type IN ('call','email','meeting','task','note','demo')),
  subject          TEXT NOT NULL,
  due_date         DATE,
  is_done          BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  company          TEXT,
  contact_type     TEXT NOT NULL DEFAULT 'prospect'
                   CHECK (contact_type IN ('prospect','customer','partner','vendor','other')),
  tags             TEXT[],
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 3. PROCUREMENT MODULE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proc_suppliers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  contact_name     TEXT,
  email            TEXT,
  phone            TEXT,
  payment_terms    TEXT DEFAULT 'net30',
  currency         TEXT NOT NULL DEFAULT 'USD',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proc_purchase_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  po_number        TEXT NOT NULL,
  supplier_id      UUID REFERENCES proc_suppliers(id) ON DELETE SET NULL,
  supplier_name    TEXT,
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','confirmed','received','cancelled','partial')),
  order_date       DATE NOT NULL,
  delivery_date    DATE,
  total_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'USD',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proc_rfqs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  rfq_number       TEXT NOT NULL,
  title            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','closed','awarded','cancelled')),
  requested_by     TEXT,
  deadline         DATE,
  total_budget     NUMERIC(18,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 4. INVENTORY MODULE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inv_warehouses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  location         TEXT,
  manager          TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inv_stock_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  warehouse_id     UUID REFERENCES inv_warehouses(id) ON DELETE SET NULL,
  warehouse_name   TEXT,
  product_name     TEXT NOT NULL,
  sku              TEXT,
  category         TEXT,
  qty_on_hand      NUMERIC(18,3) NOT NULL DEFAULT 0,
  reorder_point    NUMERIC(18,3),
  unit_cost        NUMERIC(18,4),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inv_stock_moves (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  warehouse_id     UUID REFERENCES inv_warehouses(id) ON DELETE SET NULL,
  warehouse_name   TEXT,
  move_type        TEXT NOT NULL DEFAULT 'receipt'
                   CHECK (move_type IN ('receipt','delivery','adjustment','transfer','return','scrap')),
  product_name     TEXT NOT NULL,
  qty              NUMERIC(18,3) NOT NULL,
  ref_number       TEXT,
  move_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 5. PROJECTS MODULE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proj_projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'planning'
                   CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  priority         TEXT NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high','critical')),
  start_date       DATE,
  end_date         DATE,
  budget           NUMERIC(18,2),
  client_name      TEXT,
  manager          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proj_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES proj_projects(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  assignee         TEXT,
  status           TEXT NOT NULL DEFAULT 'todo'
                   CHECK (status IN ('todo','in_progress','review','done','blocked')),
  priority         TEXT NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high','critical')),
  due_date         DATE,
  estimated_hours  NUMERIC(8,2),
  actual_hours     NUMERIC(8,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proj_timesheets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES proj_tasks(id) ON DELETE SET NULL,
  project_id       UUID REFERENCES proj_projects(id) ON DELETE SET NULL,
  project_name     TEXT,
  employee_name    TEXT NOT NULL,
  work_date        DATE NOT NULL,
  hours            NUMERIC(6,2) NOT NULL,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 6. PAYROLL MODULE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_payroll_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  period_label     TEXT NOT NULL,
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','processing','approved','paid','cancelled')),
  total_gross      NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_net        NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(18,2) NOT NULL DEFAULT 0,
  processed_by     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pay_payslips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  run_id           UUID REFERENCES pay_payroll_runs(id) ON DELETE SET NULL,
  employee_id      UUID,
  employee_name    TEXT NOT NULL,
  employee_code    TEXT,
  department       TEXT,
  basic_salary     NUMERIC(18,2) NOT NULL DEFAULT 0,
  allowances       NUMERIC(18,2) NOT NULL DEFAULT 0,
  deductions       NUMERIC(18,2) NOT NULL DEFAULT 0,
  net_pay          NUMERIC(18,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','paid','rejected')),
  payment_date     DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 7. ASSETS MODULE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ast_fixed_assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  asset_code          TEXT,
  category            TEXT,
  purchase_date       DATE,
  purchase_cost       NUMERIC(18,2) NOT NULL DEFAULT 0,
  salvage_value       NUMERIC(18,2) NOT NULL DEFAULT 0,
  useful_life_years   INTEGER NOT NULL DEFAULT 5,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line'
                      CHECK (depreciation_method IN ('straight_line','declining_balance','units_of_production')),
  current_value       NUMERIC(18,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','maintenance','disposed','retired')),
  location            TEXT,
  assigned_to         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ast_depreciation_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  asset_id         UUID NOT NULL REFERENCES ast_fixed_assets(id) ON DELETE CASCADE,
  asset_name       TEXT,
  period_date      DATE NOT NULL,
  amount           NUMERIC(18,2) NOT NULL DEFAULT 0,
  book_value_after NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 8. MAINTENANCE MODULE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mnt_equipment (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  serial_number     TEXT,
  category          TEXT,
  location          TEXT,
  purchase_date     DATE,
  last_maintenance  DATE,
  next_maintenance  DATE,
  status            TEXT NOT NULL DEFAULT 'operational'
                    CHECK (status IN ('operational','maintenance','breakdown','decommissioned')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mnt_work_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  equipment_id     UUID REFERENCES mnt_equipment(id) ON DELETE SET NULL,
  equipment_name   TEXT,
  title            TEXT NOT NULL,
  description      TEXT,
  priority         TEXT NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high','critical')),
  status           TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','in_progress','pending_parts','completed','cancelled')),
  requested_by     TEXT,
  assigned_to      TEXT,
  scheduled_date   DATE,
  completed_date   DATE,
  cost             NUMERIC(18,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 9. QUALITY MODULE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qlt_checklists (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  category         TEXT,
  description      TEXT,
  version          TEXT DEFAULT '1.0',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qlt_inspections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  checklist_id     UUID REFERENCES qlt_checklists(id) ON DELETE SET NULL,
  checklist_name   TEXT,
  ref_number       TEXT NOT NULL,
  inspector        TEXT,
  inspection_date  DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','in_progress','passed','failed','conditional')),
  result           TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qlt_non_conformances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES erp_tenants(id) ON DELETE CASCADE,
  ref_number          TEXT NOT NULL,
  description         TEXT NOT NULL,
  severity            TEXT NOT NULL DEFAULT 'minor'
                      CHECK (severity IN ('minor','major','critical')),
  status              TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','under_review','resolved','closed')),
  raised_by           TEXT,
  raised_date         DATE NOT NULL,
  root_cause          TEXT,
  corrective_action   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- RLS POLICIES (enable & tenant-scoped)
-- ──────────────────────────────────────────────────────────
DO $$ 
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'acc_chart_of_accounts','acc_journal_entries','acc_budget_lines',
    'crm_leads','crm_activities','crm_contacts',
    'proc_suppliers','proc_purchase_orders','proc_rfqs',
    'inv_warehouses','inv_stock_items','inv_stock_moves',
    'proj_projects','proj_tasks','proj_timesheets',
    'pay_payroll_runs','pay_payslips',
    'ast_fixed_assets','ast_depreciation_log',
    'mnt_equipment','mnt_work_orders',
    'qlt_checklists','qlt_inspections','qlt_non_conformances'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_access_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "tenant_access_%s" ON %I USING (auth.uid() IS NOT NULL)', t, t);
  END LOOP;
END $$;
