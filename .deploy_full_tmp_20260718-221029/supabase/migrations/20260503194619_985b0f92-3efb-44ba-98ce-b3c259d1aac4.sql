
-- ============= EXTEND EXISTING TABLES =============

-- brands
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS human_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_count INTEGER NOT NULL DEFAULT 0;

-- branches
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS branch_type TEXT NOT NULL DEFAULT 'Main',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC,
  ADD COLUMN IF NOT EXISTS manager_id UUID;

-- employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_type TEXT NOT NULL DEFAULT 'Human',
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS branch_id UUID;

-- projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'USD';

-- tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';

-- profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS social_website TEXT,
  ADD COLUMN IF NOT EXISTS social_linkedin TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- ============= NEW TABLES =============

-- Helper: standard owner-based RLS pattern
-- All new tables follow: user_id uuid + owner_select/insert/update/delete

-- 1. Brand owners
CREATE TABLE IF NOT EXISTS public.brand_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT, email TEXT, whatsapp TEXT, position TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.brand_owners FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 2. Brand renewals
CREATE TABLE IF NOT EXISTS public.brand_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  alert_before_days INTEGER DEFAULT 30,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_renewals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.brand_renewals FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 3. Project team
CREATE TABLE IF NOT EXISTS public.project_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  employee_id UUID,
  member_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.project_team FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 4. Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  current_stock NUMERIC DEFAULT 0,
  min_stock_level NUMERIC DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.materials FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 5. Inventory
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  branch_id UUID,
  material_id UUID,
  quantity NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.inventory FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 6. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT, email TEXT, phone TEXT, category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.suppliers FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 7. Logistics shipping
CREATE TABLE IF NOT EXISTS public.logistics_shipping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  tracking_number TEXT, carrier TEXT,
  status TEXT DEFAULT 'In Transit',
  estimated_delivery DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.logistics_shipping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.logistics_shipping FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 8. Import/export
CREATE TABLE IF NOT EXISTS public.import_export (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT, country_of_origin TEXT,
  status TEXT DEFAULT 'Under Review',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.import_export ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.import_export FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 9. Artistic production
CREATE TABLE IF NOT EXISTS public.artistic_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID,
  project_name TEXT NOT NULL,
  media_type TEXT,
  production_status TEXT DEFAULT 'Drafting',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.artistic_production ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.artistic_production FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 10. Finance analytics
CREATE TABLE IF NOT EXISTS public.finance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month_year TEXT,
  total_revenue NUMERIC(14,2),
  total_expenses NUMERIC(14,2),
  net_profit NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.finance_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.finance_analytics FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 11. Payment gateways
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID,
  gateway_name TEXT,
  api_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.payment_gateways FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 12. Assets
CREATE TABLE IF NOT EXISTS public.assets_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asset_name TEXT NOT NULL,
  purchase_date DATE,
  value NUMERIC(14,2),
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.assets_management ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.assets_management FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 13. Clients (separate from customers)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT, phone TEXT,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.clients FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 14. Affiliated agents
CREATE TABLE IF NOT EXISTS public.affiliated_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  commission_rate NUMERIC DEFAULT 0.05,
  total_sales NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.affiliated_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.affiliated_agents FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 15. CRM interactions
CREATE TABLE IF NOT EXISTS public.crm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  agent_id UUID,
  notes TEXT,
  interaction_date TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.crm_interactions FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 16. Marketing campaigns
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID,
  campaign_name TEXT,
  budget NUMERIC,
  leads_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.marketing_campaigns FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 17. Heirs
CREATE TABLE IF NOT EXISTS public.heirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  email TEXT,
  access_level TEXT NOT NULL DEFAULT 'View Only',
  is_golden_heir BOOLEAN DEFAULT FALSE,
  heartbeat_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.heirs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.heirs FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 18. Heir-brand mapping
CREATE TABLE IF NOT EXISTS public.heir_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  heir_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(heir_id, brand_id)
);
ALTER TABLE public.heir_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.heir_brands FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 19. Vault settings
CREATE TABLE IF NOT EXISTS public.vault_settings (
  user_id UUID PRIMARY KEY,
  emergency_mode BOOLEAN NOT NULL DEFAULT FALSE,
  auto_emergency BOOLEAN NOT NULL DEFAULT TRUE,
  threat_lock_pct INTEGER NOT NULL DEFAULT 80,
  current_threat_pct INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.vault_settings FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 20. Heartbeats
CREATE TABLE IF NOT EXISTS public.heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_deadline TIMESTAMPTZ NOT NULL,
  warned_3d BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE public.heartbeats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.heartbeats FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 21. Legal vault
CREATE TABLE IF NOT EXISTS public.legal_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  doc_title TEXT NOT NULL,
  expiry_date DATE,
  file_url TEXT,
  is_encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.legal_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.legal_vault FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- 22. System alerts
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  module TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.system_alerts FOR ALL USING (auth.uid()=user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=user_id);

-- ============= INDEXES =============
CREATE INDEX IF NOT EXISTS idx_brand_owners_brand ON public.brand_owners(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_renewals_brand ON public.brand_renewals(brand_id);
CREATE INDEX IF NOT EXISTS idx_project_team_project ON public.project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch ON public.inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_heir_brands_heir ON public.heir_brands(heir_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON public.employees(branch_id);
