-- ═══════════════════════════════════════════════════════════════════════
-- KemetRise: Legacy Nexus — Enterprise Full Schema
-- 8 Interconnected Portals: Admin | Partner | Agent | Vendor
--                           Marketing | Chat | Public | ERP/HR
-- ═══════════════════════════════════════════════════════════════════════

-- ── Extend user_profiles roles ────────────────────────────────────────
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin','superadmin','provider','partner','agent','vendor','marketing','user'));

-- ── 1. DYNAMIC SECTOR FACTORY ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sectors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  name_ar      TEXT NOT NULL,
  icon         TEXT NOT NULL DEFAULT 'building-2',
  color        TEXT NOT NULL DEFAULT '#D4A017',
  is_active    BOOLEAN NOT NULL DEFAULT false,
  modules      JSONB NOT NULL DEFAULT '[]',
  config       JSONB NOT NULL DEFAULT '{}',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pre-seed core sectors
INSERT INTO sectors (code,name,name_ar,icon,color,modules,sort_order) VALUES
  ('medical',    'Medical & Healthcare',    'الطب والرعاية الصحية',   'stethoscope',    '#EF4444', '["appointments","patients","prescriptions","labs","billing"]', 1),
  ('sports',     'Sports & Fitness',        'الرياضة واللياقة',       'dumbbell',       '#10B981', '["memberships","trainers","sessions","facilities","nutrition"]', 2),
  ('legal',      'Legal & Compliance',      'القانون والامتثال',      'scale',          '#6366F1', '["cases","contracts","clients","hearings","billing"]', 3),
  ('financial',  'Financial Services',      'الخدمات المالية',        'landmark',       '#F59E0B', '["accounts","investments","loans","insurance","reports"]', 4),
  ('tourism',    'Tourism & Hospitality',   'السياحة والضيافة',       'map-pin',        '#14B8A6', '["bookings","packages","guides","transport","reviews"]', 5),
  ('education',  'Education & Courses',     'التعليم والدورات',       'graduation-cap', '#8B5CF6', '["courses","students","exams","certificates","live_classes"]', 6),
  ('retail',     'Retail & E-Commerce',     'تجزئة والتجارة الإلكترونية','shopping-cart','#F97316', '["products","inventory","orders","returns","analytics"]', 7),
  ('services',   'Professional Services',   'الخدمات المهنية',        'briefcase',      '#EC4899', '["bookings","staff","packages","crm","invoicing"]', 8)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sectors_read"  ON sectors FOR SELECT USING (true);
CREATE POLICY "sectors_admin" ON sectors FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- ── 2. FRANCHISE & PARTNER WORKSPACES (Multi-Tenant) ─────────────────
CREATE TABLE IF NOT EXISTS partner_workspaces (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  workspace_code   TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  name_ar          TEXT,
  logo_url         TEXT,
  cover_url        TEXT,
  sector_ids       UUID[] NOT NULL DEFAULT '{}',
  country          TEXT,
  city             TEXT,
  address          TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  plan_tier        TEXT NOT NULL DEFAULT 'starter',
  revenue_share    NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  is_approved      BOOLEAN NOT NULL DEFAULT false,
  approval_date    TIMESTAMPTZ,
  approved_by      UUID REFERENCES auth.users(id),
  settings         JSONB NOT NULL DEFAULT '{}',
  total_revenue    BIGINT NOT NULL DEFAULT 0,
  total_partners   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE partner_workspaces ENABLE ROW LEVEL SECURITY;
-- Partners see ONLY their own workspace (strict isolation)
CREATE POLICY "pw_own"        ON partner_workspaces FOR ALL  USING (user_id = auth.uid());
CREATE POLICY "pw_admin_all"  ON partner_workspaces FOR ALL  USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- ── 3. AGENTS & AGENTIC WORKSPACE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  agent_code       TEXT NOT NULL UNIQUE,
  full_name        TEXT NOT NULL,
  phone            TEXT,
  regions          TEXT[] NOT NULL DEFAULT '{}',
  assigned_branches UUID[] NOT NULL DEFAULT '{}',
  commission_rate  NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  total_clients    INTEGER NOT NULL DEFAULT 0,
  total_commissions BIGINT NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  client_user_id  UUID REFERENCES auth.users(id),
  client_name     TEXT NOT NULL,
  client_email    TEXT,
  client_phone    TEXT,
  client_company  TEXT,
  status          TEXT NOT NULL DEFAULT 'onboarding'
                    CHECK (status IN ('onboarding','active','inactive','converted','lost')),
  estimated_value BIGINT NOT NULL DEFAULT 0,
  onboarded_at    TIMESTAMPTZ,
  notes           TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_commissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES agent_clients(id),
  source_type   TEXT NOT NULL,
  source_ref    TEXT,
  amount_cents  BIGINT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  rate_used     NUMERIC(5,2),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  approved_by   UUID REFERENCES auth.users(id),
  paid_at       TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agent_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ap_own"         ON agent_profiles   FOR ALL USING (user_id = auth.uid());
CREATE POLICY "ap_admin"       ON agent_profiles   FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "ac_own"         ON agent_clients     FOR ALL USING (EXISTS (SELECT 1 FROM agent_profiles WHERE id = agent_id AND user_id = auth.uid()));
CREATE POLICY "ac_admin"       ON agent_clients     FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "acom_own"       ON agent_commissions FOR ALL USING (EXISTS (SELECT 1 FROM agent_profiles WHERE id = agent_id AND user_id = auth.uid()));
CREATE POLICY "acom_admin"     ON agent_commissions FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));

-- ── 4. VENDOR WALLET & SETTLEMENT MATRIX ────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_wallets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance_cents       BIGINT NOT NULL DEFAULT 0,
  pending_cents       BIGINT NOT NULL DEFAULT 0,
  total_earned_cents  BIGINT NOT NULL DEFAULT 0,
  total_fees_cents    BIGINT NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'USD',
  is_frozen           BOOLEAN NOT NULL DEFAULT false,
  freeze_reason       TEXT,
  payout_method       TEXT NOT NULL DEFAULT 'bank_transfer',
  payout_details      JSONB NOT NULL DEFAULT '{}',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_user_id  UUID NOT NULL REFERENCES auth.users(id),
  wallet_id       UUID REFERENCES vendor_wallets(id),
  order_id        UUID,
  type            TEXT NOT NULL CHECK (type IN ('sale','refund','fee','payout','adjustment','bonus')),
  gross_cents     BIGINT NOT NULL DEFAULT 0,
  fee_cents       BIGINT NOT NULL DEFAULT 0,
  net_cents       BIGINT NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  balance_after   BIGINT NOT NULL DEFAULT 0,
  description     TEXT,
  reference       TEXT,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','reversed')),
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_user_id  UUID NOT NULL REFERENCES auth.users(id),
  wallet_id       UUID REFERENCES vendor_wallets(id),
  amount_cents    BIGINT NOT NULL,
  fee_cents       BIGINT NOT NULL DEFAULT 0,
  net_cents       BIGINT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  method          TEXT NOT NULL,
  destination     JSONB NOT NULL DEFAULT '{}',
  reference       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','reversed')),
  processed_by    UUID REFERENCES auth.users(id),
  processed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_fee_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  applies_to    TEXT NOT NULL CHECK (applies_to IN ('vendor','partner','agent','all')),
  fee_type      TEXT NOT NULL CHECK (fee_type IN ('percent','flat')),
  fee_value     NUMERIC(10,4) NOT NULL,
  min_fee_cents BIGINT NOT NULL DEFAULT 0,
  max_fee_cents BIGINT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO platform_fee_config (name,applies_to,fee_type,fee_value,min_fee_cents) VALUES
  ('Vendor Platform Fee',   'vendor',  'percent', 10.00, 50),
  ('Partner Revenue Share', 'partner', 'percent', 20.00, 100),
  ('Agent Commission Base', 'agent',   'percent', 5.00,  0)
ON CONFLICT DO NOTHING;

ALTER TABLE vendor_wallets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payouts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_config  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vw_own"    ON vendor_wallets      FOR ALL   USING (user_id = auth.uid());
CREATE POLICY "vw_admin"  ON vendor_wallets      FOR ALL   USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "vt_own"    ON vendor_transactions FOR SELECT USING (vendor_user_id = auth.uid());
CREATE POLICY "vt_admin"  ON vendor_transactions FOR ALL   USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "vp_own"    ON vendor_payouts      FOR ALL   USING (vendor_user_id = auth.uid());
CREATE POLICY "vp_admin"  ON vendor_payouts      FOR ALL   USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "pfc_read"  ON platform_fee_config FOR SELECT USING (true);
CREATE POLICY "pfc_admin" ON platform_fee_config FOR ALL   USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));

-- ── 5. MARKETING & SALES HUB ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  name_ar          TEXT,
  type             TEXT NOT NULL DEFAULT 'digital'
                     CHECK (type IN ('digital','email','social','sms','event','referral','other')),
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','active','paused','completed','cancelled')),
  budget_cents     BIGINT NOT NULL DEFAULT 0,
  spent_cents      BIGINT NOT NULL DEFAULT 0,
  target_leads     INTEGER NOT NULL DEFAULT 0,
  actual_leads     INTEGER NOT NULL DEFAULT 0,
  conversions      INTEGER NOT NULL DEFAULT 0,
  roi_percent      NUMERIC(7,2) NOT NULL DEFAULT 0,
  channels         JSONB NOT NULL DEFAULT '[]',
  target_audience  JSONB NOT NULL DEFAULT '{}',
  start_date       DATE,
  end_date         DATE,
  created_by       UUID REFERENCES auth.users(id),
  assigned_to      UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      UUID REFERENCES marketing_campaigns(id),
  assigned_to      UUID REFERENCES auth.users(id),
  name             TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  company          TEXT,
  position         TEXT,
  source           TEXT NOT NULL DEFAULT 'organic'
                     CHECK (source IN ('organic','paid_ad','referral','social','event','cold_call','email','other')),
  status           TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','contacted','qualified','proposal','negotiation','won','lost')),
  score            INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  estimated_value  BIGINT NOT NULL DEFAULT 0,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  notes            TEXT,
  next_follow_up   TIMESTAMPTZ,
  converted_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id),
  type        TEXT NOT NULL CHECK (type IN ('call','email','meeting','note','status_change','score_change')),
  title       TEXT NOT NULL,
  description TEXT,
  outcome     TEXT,
  duration_min INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_status_idx   ON marketing_leads(status);
CREATE INDEX IF NOT EXISTS leads_assigned_idx ON marketing_leads(assigned_to);
CREATE INDEX IF NOT EXISTS leads_campaign_idx ON marketing_leads(campaign_id);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_leads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mc_read"  ON marketing_campaigns FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','marketing'))
);
CREATE POLICY "mc_write" ON marketing_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','marketing'))
);
CREATE POLICY "ml_read"  ON marketing_leads FOR SELECT USING (
  assigned_to = auth.uid() OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','marketing'))
);
CREATE POLICY "ml_write" ON marketing_leads FOR ALL USING (
  assigned_to = auth.uid() OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','marketing'))
);
CREATE POLICY "la_write" ON lead_activities FOR ALL USING (
  EXISTS (SELECT 1 FROM marketing_leads WHERE id = lead_id AND (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','marketing'))
  ))
);

-- ── 6. AI CHAT ENGINE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_brand_agents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id       UUID,
  owner_user_id  UUID NOT NULL REFERENCES auth.users(id),
  agent_name     TEXT NOT NULL,
  agent_name_ar  TEXT,
  agent_type     TEXT NOT NULL DEFAULT 'general'
                   CHECK (agent_type IN ('general','social','financial','legal','support','sales','fashion','research','custom')),
  system_prompt  TEXT NOT NULL DEFAULT 'You are a helpful AI assistant for KemetRise.',
  avatar_url     TEXT,
  color          TEXT DEFAULT '#D4A017',
  model          TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperature    NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  max_tokens     INTEGER NOT NULL DEFAULT 2048,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  is_public      BOOLEAN NOT NULL DEFAULT false,
  config         JSONB NOT NULL DEFAULT '{}',
  total_messages INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id         UUID NOT NULL REFERENCES ai_brand_agents(id),
  brand_id         UUID,
  title            TEXT DEFAULT 'New Chat',
  message_count    INTEGER NOT NULL DEFAULT 0,
  total_tokens     INTEGER NOT NULL DEFAULT 0,
  last_message_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_archived      BOOLEAN NOT NULL DEFAULT false,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content      TEXT NOT NULL,
  tokens_used  INTEGER NOT NULL DEFAULT 0,
  model_used   TEXT,
  latency_ms   INTEGER,
  is_liked     BOOLEAN,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_sessions_user_idx    ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id);

ALTER TABLE ai_brand_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aba_own"    ON ai_brand_agents FOR ALL   USING (owner_user_id = auth.uid());
CREATE POLICY "aba_public" ON ai_brand_agents FOR SELECT USING (is_public = true);
CREATE POLICY "aba_admin"  ON ai_brand_agents FOR ALL   USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "cs_own"     ON chat_sessions   FOR ALL   USING (user_id = auth.uid());
CREATE POLICY "cm_own"     ON chat_messages   FOR ALL   USING (EXISTS (SELECT 1 FROM chat_sessions WHERE id = session_id AND user_id = auth.uid()));

-- ── 7. HR & ATTENDANCE ENGINE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_employees (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id),
  employee_code        TEXT NOT NULL UNIQUE,
  full_name            TEXT NOT NULL,
  full_name_ar         TEXT,
  department           TEXT,
  position             TEXT,
  phone                TEXT,
  email                TEXT,
  national_id          TEXT,
  hire_date            DATE,
  end_date             DATE,
  salary_cents         BIGINT NOT NULL DEFAULT 0,
  currency             TEXT NOT NULL DEFAULT 'USD',
  work_hours_per_day   NUMERIC(4,2) NOT NULL DEFAULT 8.0,
  work_days            TEXT[] NOT NULL DEFAULT '{"Mon","Tue","Wed","Thu","Fri"}',
  qr_secret            TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active            BOOLEAN NOT NULL DEFAULT true,
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hr_qr_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  action        TEXT NOT NULL CHECK (action IN ('check_in','check_out')),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT now() + interval '5 minutes',
  used_at       TIMESTAMPTZ,
  ip_address    INET,
  user_agent    TEXT,
  is_used       BOOLEAN NOT NULL DEFAULT false,
  is_valid      BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hr_attendance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  check_in     TIMESTAMPTZ,
  check_out    TIMESTAMPTZ,
  hours_worked NUMERIC(5,2),
  overtime_hrs NUMERIC(5,2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'present'
                 CHECK (status IN ('present','absent','late','half_day','leave','holiday')),
  source       TEXT NOT NULL DEFAULT 'qr'
                 CHECK (source IN ('qr','biometric','manual','mobile')),
  verified_by  UUID REFERENCES auth.users(id),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Biometric sync API endpoint data
CREATE TABLE IF NOT EXISTS hr_biometric_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID REFERENCES hr_employees(id),
  device_id    TEXT NOT NULL,
  action       TEXT NOT NULL CHECK (action IN ('check_in','check_out')),
  fingerprint_hash TEXT,
  confidence   NUMERIC(5,2),
  status       TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed','duplicate')),
  raw_payload  JSONB NOT NULL DEFAULT '{}',
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hr_employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_qr_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_biometric_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_emp_admin"  ON hr_employees      FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "hr_emp_self"   ON hr_employees      FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "hr_qr_admin"   ON hr_qr_sessions    FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "hr_att_admin"  ON hr_attendance     FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "hr_att_self"   ON hr_attendance     FOR SELECT USING (EXISTS (SELECT 1 FROM hr_employees WHERE id = employee_id AND user_id = auth.uid()));
CREATE POLICY "hr_bio_admin"  ON hr_biometric_logs FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));

-- ── 8. ERP FINANCIAL LEDGER ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp_ledger (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number   TEXT NOT NULL UNIQUE,
  type           TEXT NOT NULL CHECK (type IN ('income','expense','transfer','tax','fee','adjustment','opening')),
  category       TEXT,
  description    TEXT NOT NULL,
  debit_cents    BIGINT NOT NULL DEFAULT 0,
  credit_cents   BIGINT NOT NULL DEFAULT 0,
  balance_cents  BIGINT NOT NULL DEFAULT 0,
  tax_cents      BIGINT NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'USD',
  exchange_rate  NUMERIC(12,6) NOT NULL DEFAULT 1.000000,
  reference_type TEXT,
  reference_id   UUID,
  entity_type    TEXT,
  entity_id      UUID,
  invoice_data   JSONB NOT NULL DEFAULT '{}',
  tax_data       JSONB NOT NULL DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft','posted','void','reconciled')),
  created_by     UUID REFERENCES auth.users(id),
  posted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_tax_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id       UUID NOT NULL REFERENCES erp_ledger(id) ON DELETE CASCADE,
  tax_type        TEXT NOT NULL CHECK (tax_type IN ('vat','income_tax','withholding','customs','other')),
  rate            NUMERIC(5,2) NOT NULL,
  base_amount     BIGINT NOT NULL,
  tax_amount      BIGINT NOT NULL,
  tax_authority   TEXT,
  period          TEXT,
  e_invoice_ref   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','filed','paid','overdue')),
  filed_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate entry_number
CREATE OR REPLACE FUNCTION generate_ledger_entry_number() RETURNS TRIGGER AS $$
BEGIN
  NEW.entry_number := 'JE-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('erp_ledger_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS erp_ledger_seq START 1;
DROP TRIGGER IF EXISTS erp_ledger_number ON erp_ledger;
CREATE TRIGGER erp_ledger_number
  BEFORE INSERT ON erp_ledger
  FOR EACH ROW WHEN (NEW.entry_number IS NULL OR NEW.entry_number = '')
  EXECUTE FUNCTION generate_ledger_entry_number();

ALTER TABLE erp_ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_tax_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "el_admin"  ON erp_ledger      FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
CREATE POLICY "ete_admin" ON erp_tax_entries FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));

-- ── 9. PUBLIC MARKETPLACE & PRODUCTS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_user_id  UUID REFERENCES auth.users(id),
  name            TEXT NOT NULL,
  name_ar         TEXT,
  description     TEXT,
  description_ar  TEXT,
  product_type    TEXT NOT NULL DEFAULT 'digital'
                    CHECK (product_type IN ('digital','physical','subscription','course','service')),
  price_cents     BIGINT NOT NULL,
  sale_price_cents BIGINT,
  currency        TEXT NOT NULL DEFAULT 'USD',
  sku             TEXT,
  stock_qty       INTEGER NOT NULL DEFAULT -1,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  images          JSONB NOT NULL DEFAULT '[]',
  features        JSONB NOT NULL DEFAULT '[]',
  tags            TEXT[] NOT NULL DEFAULT '{}',
  category        TEXT,
  sector_code     TEXT REFERENCES sectors(code),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  total_sold      INTEGER NOT NULL DEFAULT 0,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  meta            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pp_active_idx   ON public_products(is_active, is_featured);
CREATE INDEX IF NOT EXISTS pp_category_idx ON public_products(category, sector_code);

ALTER TABLE public_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pp_read"        ON public_products FOR SELECT USING (is_active = true);
CREATE POLICY "pp_vendor_own"  ON public_products FOR ALL   USING (vendor_user_id = auth.uid());
CREATE POLICY "pp_admin"       ON public_products FOR ALL   USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));

-- ── 10. BUSINESS UPGRADE REQUESTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS business_upgrade_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  requested_role  TEXT NOT NULL CHECK (requested_role IN ('partner','agent','vendor','marketing')),
  business_name   TEXT,
  business_type   TEXT,
  website         TEXT,
  social_links    JSONB NOT NULL DEFAULT '{}',
  reason          TEXT,
  documents       JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','under_review','approved','rejected')),
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE business_upgrade_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bur_own"   ON business_upgrade_requests FOR ALL   USING (user_id = auth.uid());
CREATE POLICY "bur_admin" ON business_upgrade_requests FOR ALL   USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));

-- ── Auto-create vendor wallet on vendor profile ──────────────────────
CREATE OR REPLACE FUNCTION handle_vendor_wallet() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('vendor','provider') THEN
    INSERT INTO vendor_wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vendor_role ON user_profiles;
CREATE TRIGGER on_vendor_role
  AFTER INSERT OR UPDATE OF role ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_vendor_wallet();

-- ── Updated_at triggers ──────────────────────────────────────────────
DO $$ DECLARE tbl TEXT; BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'sectors','partner_workspaces','agent_profiles','agent_clients',
    'marketing_campaigns','marketing_leads','ai_brand_agents',
    'hr_employees','public_products'
  ]) LOOP
    EXECUTE FORMAT('
      DROP TRIGGER IF EXISTS %I_updated ON %I;
      CREATE TRIGGER %I_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    ', tbl||'_ts', tbl, tbl||'_ts', tbl);
  END LOOP;
END $$;
