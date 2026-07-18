-- Manual all-in-one SQL apply script
-- 0) Compatibility helper for projects missing has_role()
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language plpgsql
stable
as $$
declare
  result boolean := false;
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'user_roles'
  ) then
    return false;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_roles' and column_name = 'user_id'
  ) then
    return false;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_roles' and column_name = 'role'
  ) then
    return false;
  end if;

  execute
    'select exists (
       select 1
       from public.user_roles ur
       where ur.user_id = $1 and ur.role::text = $2
     )'
    into result
    using _user_id, _role;

  return coalesce(result, false);
end;
$$;

-- 1) Base schema alignment

-- ====== Add missing columns to existing tables ======
ALTER TABLE public.affiliate_commissions ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.affiliated_agents ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.agent_logs ADD COLUMN IF NOT EXISTS agent_name text, ADD COLUMN IF NOT EXISTS status text, ADD COLUMN IF NOT EXISTS input_data jsonb, ADD COLUMN IF NOT EXISTS output_data jsonb, ADD COLUMN IF NOT EXISTS error_message text, ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone, ADD COLUMN IF NOT EXISTS parent_task_id uuid, ADD COLUMN IF NOT EXISTS source_workflow text, ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.artistic_production ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.assets_management ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.automation_runs ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.backups ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.brand_invitations ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.brand_members ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.brand_owners ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.brand_renewals ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS api_key text, ADD COLUMN IF NOT EXISTS telegram_id text, ADD COLUMN IF NOT EXISTS status text, ADD COLUMN IF NOT EXISTS user_name text, ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.crm_interactions ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.dashboard_layouts ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.dead_man_switch ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.digital_inheritance ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS instructions text, ADD COLUMN IF NOT EXISTS bio text, ADD COLUMN IF NOT EXISTS reports_to text, ADD COLUMN IF NOT EXISTS workflow_id text, ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.entity_files ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.exchange_rates ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.failed_login_attempts ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.finance_analytics ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.heartbeats ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.import_export ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.installed_apps ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.ip_whitelist ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.key_persons ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.legal_vault ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.legendary_journey ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.logistics_shipping ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.marketing_campaigns ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.marketplace_apps ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.notification_rules ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.payment_gateways ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.project_team ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.saved_views ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.success_partners ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.system_alerts ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ai_response text, ADD COLUMN IF NOT EXISTS action_taken text, ADD COLUMN IF NOT EXISTS log_details jsonb, ADD COLUMN IF NOT EXISTS output_data jsonb, ADD COLUMN IF NOT EXISTS error_message text, ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone, ADD COLUMN IF NOT EXISTS client_id text, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.user_2fa ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.vault_entries ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.vault_settings ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.webhook_deliveries ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.webhooks ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.white_label ADD COLUMN IF NOT EXISTS client_id uuid, ADD COLUMN IF NOT EXISTS brand_id uuid, ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.workflow_map ADD COLUMN IF NOT EXISTS task_type text, ADD COLUMN IF NOT EXISTS user_name text;

-- ====== Create 5 missing tables ======

CREATE TABLE IF NOT EXISTS public.archive_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  original_table_name text NOT NULL,
  original_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  user_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.archive_vault TO authenticated;
GRANT ALL ON public.archive_vault TO service_role;
ALTER TABLE public.archive_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_vault ADD COLUMN IF NOT EXISTS user_id uuid;
DROP POLICY IF EXISTS av_owner_all ON public.archive_vault;
CREATE POLICY av_owner_all ON public.archive_vault FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'))
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.client_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  identifier text,
  client_id text,
  client_name text,
  knowledge_table text,
  branch_id uuid,
  reports_to uuid,
  user_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_mapping TO authenticated;
GRANT ALL ON public.client_mapping TO service_role;
ALTER TABLE public.client_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_mapping ADD COLUMN IF NOT EXISTS user_id uuid;
DROP POLICY IF EXISTS cm_owner_all ON public.client_mapping;
CREATE POLICY cm_owner_all ON public.client_mapping FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'))
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.client_brand_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id text NOT NULL,
  brand_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  role text DEFAULT 'member',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_brand_access TO authenticated;
GRANT ALL ON public.client_brand_access TO service_role;
ALTER TABLE public.client_brand_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_brand_access ADD COLUMN IF NOT EXISTS user_id uuid;
DROP POLICY IF EXISTS cba_owner_all ON public.client_brand_access;
CREATE POLICY cba_owner_all ON public.client_brand_access FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'))
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dept_code text,
  manager_name text,
  system_prompt text,
  managed_agents text[] DEFAULT '{}',
  client_id uuid,
  brand_id uuid,
  user_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS user_id uuid;
DROP POLICY IF EXISTS dept_owner_all ON public.departments;
CREATE POLICY dept_owner_all ON public.departments FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'))
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.sub_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parent_task_id uuid,
  agent_code text,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  ai_output text,
  client_id uuid,
  brand_id uuid,
  user_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sub_tasks TO authenticated;
GRANT ALL ON public.sub_tasks TO service_role;
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_tasks ADD COLUMN IF NOT EXISTS user_id uuid;
DROP POLICY IF EXISTS st_owner_all ON public.sub_tasks;
CREATE POLICY st_owner_all ON public.sub_tasks FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'))
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sub_tasks_parent ON public.sub_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_cba_client ON public.client_brand_access(client_id);
CREATE INDEX IF NOT EXISTS idx_cba_brand ON public.client_brand_access(brand_id);
CREATE INDEX IF NOT EXISTS idx_archive_table ON public.archive_vault(original_table_name);

-- 2) Tenant relations + RLS hardening

-- Tenant relations + RLS hardening
-- This migration is idempotent and safe to run multiple times.

-- 1) Helper: add FK only when both tables/columns exist and constraint is missing
create or replace function public.try_add_fk(
  p_table text,
  p_column text,
  p_ref_table text,
  p_ref_column text,
  p_constraint text,
  p_on_delete text default 'set null'
)
returns void
language plpgsql
as $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = p_table and column_name = p_column
  ) then
    return;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = p_ref_table and column_name = p_ref_column
  ) then
    return;
  end if;

  if exists (
    select 1
    from information_schema.table_constraints tc
    where tc.table_schema = 'public'
      and tc.table_name = p_table
      and tc.constraint_name = p_constraint
      and tc.constraint_type = 'FOREIGN KEY'
  ) then
    return;
  end if;

  execute format(
    'alter table public.%I add constraint %I foreign key (%I) references public.%I(%I) on delete %s not valid',
    p_table, p_constraint, p_column, p_ref_table, p_ref_column, p_on_delete
  );
exception
  when others then
    -- Keep migration resilient even if one relation has dirty data/type drift.
    raise notice 'Skipping FK % on %.% -> %.%: %', p_constraint, p_table, p_column, p_ref_table, p_ref_column, sqlerrm;
end;
$$;

-- 2) Helper: add index if missing
create or replace function public.try_add_index(
  p_index text,
  p_table text,
  p_expr text
)
returns void
language plpgsql
as $$
begin
  if exists (select 1 from pg_indexes where schemaname = 'public' and indexname = p_index) then
    return;
  end if;

  execute format('create index %I on public.%I (%s)', p_index, p_table, p_expr);
exception
  when others then
    raise notice 'Skipping index % on % (%): %', p_index, p_table, p_expr, sqlerrm;
end;
$$;

-- 3) Strong graph links (brand/client relationships)
select public.try_add_fk('affiliate_commissions', 'brand_id', 'brands', 'id', 'fk_affiliate_commissions_brand_id');
select public.try_add_fk('affiliate_commissions', 'client_id', 'clients', 'id', 'fk_affiliate_commissions_client_id');
select public.try_add_fk('agent_logs', 'brand_id', 'brands', 'id', 'fk_agent_logs_brand_id');
select public.try_add_fk('agent_logs', 'client_id', 'clients', 'id', 'fk_agent_logs_client_id');
select public.try_add_fk('assets_management', 'brand_id', 'brands', 'id', 'fk_assets_management_brand_id');
select public.try_add_fk('assets_management', 'client_id', 'clients', 'id', 'fk_assets_management_client_id');
select public.try_add_fk('audit_logs', 'brand_id', 'brands', 'id', 'fk_audit_logs_brand_id');
select public.try_add_fk('audit_logs', 'client_id', 'clients', 'id', 'fk_audit_logs_client_id');
select public.try_add_fk('automation_runs', 'brand_id', 'brands', 'id', 'fk_automation_runs_brand_id');
select public.try_add_fk('automation_runs', 'client_id', 'clients', 'id', 'fk_automation_runs_client_id');
select public.try_add_fk('chat_conversations', 'brand_id', 'brands', 'id', 'fk_chat_conversations_brand_id');
select public.try_add_fk('chat_conversations', 'client_id', 'clients', 'id', 'fk_chat_conversations_client_id');
select public.try_add_fk('chat_messages', 'brand_id', 'brands', 'id', 'fk_chat_messages_brand_id');
select public.try_add_fk('chat_messages', 'client_id', 'clients', 'id', 'fk_chat_messages_client_id');
select public.try_add_fk('comments', 'brand_id', 'brands', 'id', 'fk_comments_brand_id');
select public.try_add_fk('comments', 'client_id', 'clients', 'id', 'fk_comments_client_id');
select public.try_add_fk('coupon_redemptions', 'brand_id', 'brands', 'id', 'fk_coupon_redemptions_brand_id');
select public.try_add_fk('coupon_redemptions', 'client_id', 'clients', 'id', 'fk_coupon_redemptions_client_id');
select public.try_add_fk('coupons', 'brand_id', 'brands', 'id', 'fk_coupons_brand_id');
select public.try_add_fk('coupons', 'client_id', 'clients', 'id', 'fk_coupons_client_id');
select public.try_add_fk('crm_interactions', 'brand_id', 'brands', 'id', 'fk_crm_interactions_brand_id');
select public.try_add_fk('crm_interactions', 'client_id', 'clients', 'id', 'fk_crm_interactions_client_id');
select public.try_add_fk('customers', 'brand_id', 'brands', 'id', 'fk_customers_brand_id');
select public.try_add_fk('customers', 'client_id', 'clients', 'id', 'fk_customers_client_id');
select public.try_add_fk('departments', 'brand_id', 'brands', 'id', 'fk_departments_brand_id');
select public.try_add_fk('departments', 'client_id', 'clients', 'id', 'fk_departments_client_id');
select public.try_add_fk('employees', 'brand_id', 'brands', 'id', 'fk_employees_brand_id');
select public.try_add_fk('employees', 'client_id', 'clients', 'id', 'fk_employees_client_id');
select public.try_add_fk('inventory', 'brand_id', 'brands', 'id', 'fk_inventory_brand_id');
select public.try_add_fk('inventory', 'client_id', 'clients', 'id', 'fk_inventory_client_id');
select public.try_add_fk('invoices', 'brand_id', 'brands', 'id', 'fk_invoices_brand_id');
select public.try_add_fk('invoices', 'client_id', 'clients', 'id', 'fk_invoices_client_id');
select public.try_add_fk('legal_vault', 'brand_id', 'brands', 'id', 'fk_legal_vault_brand_id');
select public.try_add_fk('legal_vault', 'client_id', 'clients', 'id', 'fk_legal_vault_client_id');
select public.try_add_fk('logistics_shipping', 'brand_id', 'brands', 'id', 'fk_logistics_shipping_brand_id');
select public.try_add_fk('logistics_shipping', 'client_id', 'clients', 'id', 'fk_logistics_shipping_client_id');
select public.try_add_fk('marketing_campaigns', 'brand_id', 'brands', 'id', 'fk_marketing_campaigns_brand_id');
select public.try_add_fk('marketing_campaigns', 'client_id', 'clients', 'id', 'fk_marketing_campaigns_client_id');
select public.try_add_fk('materials', 'brand_id', 'brands', 'id', 'fk_materials_brand_id');
select public.try_add_fk('materials', 'client_id', 'clients', 'id', 'fk_materials_client_id');
select public.try_add_fk('payment_transactions', 'brand_id', 'brands', 'id', 'fk_payment_transactions_brand_id');
select public.try_add_fk('payment_transactions', 'client_id', 'clients', 'id', 'fk_payment_transactions_client_id');
select public.try_add_fk('projects', 'brand_id', 'brands', 'id', 'fk_projects_brand_id');
select public.try_add_fk('projects', 'client_id', 'clients', 'id', 'fk_projects_client_id');
select public.try_add_fk('referrals', 'brand_id', 'brands', 'id', 'fk_referrals_brand_id');
select public.try_add_fk('referrals', 'client_id', 'clients', 'id', 'fk_referrals_client_id');
select public.try_add_fk('refund_requests', 'brand_id', 'brands', 'id', 'fk_refund_requests_brand_id');
select public.try_add_fk('refund_requests', 'client_id', 'clients', 'id', 'fk_refund_requests_client_id');
select public.try_add_fk('services', 'brand_id', 'brands', 'id', 'fk_services_brand_id');
select public.try_add_fk('services', 'client_id', 'clients', 'id', 'fk_services_client_id');
select public.try_add_fk('sub_tasks', 'brand_id', 'brands', 'id', 'fk_sub_tasks_brand_id');
select public.try_add_fk('sub_tasks', 'client_id', 'clients', 'id', 'fk_sub_tasks_client_id');
select public.try_add_fk('success_partners', 'brand_id', 'brands', 'id', 'fk_success_partners_brand_id');
select public.try_add_fk('success_partners', 'client_id', 'clients', 'id', 'fk_success_partners_client_id');
select public.try_add_fk('transactions', 'brand_id', 'brands', 'id', 'fk_transactions_brand_id');
select public.try_add_fk('transactions', 'client_id', 'clients', 'id', 'fk_transactions_client_id');
select public.try_add_fk('vault_entries', 'brand_id', 'brands', 'id', 'fk_vault_entries_brand_id');
select public.try_add_fk('vault_entries', 'client_id', 'clients', 'id', 'fk_vault_entries_client_id');
select public.try_add_fk('white_label', 'brand_id', 'brands', 'id', 'fk_white_label_brand_id');
select public.try_add_fk('white_label', 'client_id', 'clients', 'id', 'fk_white_label_client_id');

-- 4) Tenant indexes (fast reads for RLS + UI filters)
select public.try_add_index('idx_affiliate_commissions_tenant', 'affiliate_commissions', 'client_id, brand_id, user_name');
select public.try_add_index('idx_agent_logs_tenant', 'agent_logs', 'client_id, brand_id, user_name');
select public.try_add_index('idx_automation_runs_tenant', 'automation_runs', 'client_id, brand_id, user_name');
select public.try_add_index('idx_chat_conversations_tenant', 'chat_conversations', 'client_id, brand_id, user_name');
select public.try_add_index('idx_chat_messages_tenant', 'chat_messages', 'client_id, brand_id, user_name');
select public.try_add_index('idx_comments_tenant', 'comments', 'client_id, brand_id, user_name');
select public.try_add_index('idx_coupons_tenant', 'coupons', 'client_id, brand_id, user_name');
select public.try_add_index('idx_coupon_redemptions_tenant', 'coupon_redemptions', 'client_id, brand_id, user_name');
select public.try_add_index('idx_customers_tenant', 'customers', 'client_id, brand_id, user_name');
select public.try_add_index('idx_employees_tenant', 'employees', 'client_id, brand_id, user_name');
select public.try_add_index('idx_invoices_tenant', 'invoices', 'client_id, brand_id, user_name');
select public.try_add_index('idx_materials_tenant', 'materials', 'client_id, brand_id, user_name');
select public.try_add_index('idx_payment_transactions_tenant', 'payment_transactions', 'client_id, brand_id, user_name');
select public.try_add_index('idx_projects_tenant', 'projects', 'client_id, brand_id, user_name');
select public.try_add_index('idx_referrals_tenant', 'referrals', 'client_id, brand_id, user_name');
select public.try_add_index('idx_refund_requests_tenant', 'refund_requests', 'client_id, brand_id, user_name');
select public.try_add_index('idx_services_tenant', 'services', 'client_id, brand_id, user_name');
select public.try_add_index('idx_sub_tasks_tenant', 'sub_tasks', 'client_id, brand_id, user_name');
select public.try_add_index('idx_success_partners_tenant', 'success_partners', 'client_id, brand_id, user_name');
select public.try_add_index('idx_tasks_tenant', 'tasks', 'client_id, brand_id, user_name');
select public.try_add_index('idx_transactions_tenant', 'transactions', 'client_id, brand_id, user_name');
select public.try_add_index('idx_vault_entries_tenant', 'vault_entries', 'client_id, brand_id, user_name');
select public.try_add_index('idx_white_label_tenant', 'white_label', 'client_id, brand_id, user_name');

-- 5) Unified tenant RLS policy generation
--    Creates policy `tenant_isolation_all` on every table that has tenant/user columns.
do $$
declare
  r record;
  has_user_id boolean;
  has_user_name boolean;
  has_client_id boolean;
  has_brand_id boolean;
  using_expr text;
  check_expr text;
begin
  for r in
    select t.table_name
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and t.table_name not in ('schema_migrations')
  loop
    select exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = r.table_name and c.column_name = 'user_id'
    ) into has_user_id;

    select exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = r.table_name and c.column_name = 'user_name'
    ) into has_user_name;

    select exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = r.table_name and c.column_name = 'client_id'
    ) into has_client_id;

    select exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = r.table_name and c.column_name = 'brand_id'
    ) into has_brand_id;

    if r.table_name in ('clients', 'client_brand_access') then
      continue;
    end if;

    if not (has_user_id or has_user_name or has_client_id or has_brand_id) then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', r.table_name);

    using_expr := '';

    if has_user_id then
      using_expr := using_expr || ' (auth.uid() = user_id) OR';
    end if;

    if has_user_name and r.table_name <> 'clients' then
      using_expr := using_expr || ' exists (select 1 from public.clients c where c.user_id = auth.uid() and c.user_name = user_name) OR';
    end if;

    if has_client_id then
      using_expr := using_expr || ' exists (select 1 from public.client_brand_access cba where cba.user_id = auth.uid() and cba.client_id::text = client_id::text) OR';
    end if;

    if has_brand_id then
      using_expr := using_expr || ' exists (select 1 from public.client_brand_access cba where cba.user_id = auth.uid() and cba.brand_id::text = brand_id::text) OR';
    end if;

    using_expr := using_expr || ' (auth.role() = ''service_role'')';
    check_expr := using_expr;

    execute format('drop policy if exists tenant_isolation_all on public.%I', r.table_name);
    execute format(
      'create policy tenant_isolation_all on public.%I for all using (%s) with check (%s)',
      r.table_name,
      using_expr,
      check_expr
    );
  end loop;
end $$;

-- 5.1) Explicit non-recursive policy for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_all ON public.clients;
DROP POLICY IF EXISTS clients_owner_all ON public.clients;
CREATE POLICY clients_owner_all ON public.clients FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'))
  WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'));

-- 5.2) Explicit non-recursive policy for client_brand_access
ALTER TABLE public.client_brand_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_all ON public.client_brand_access;
DROP POLICY IF EXISTS cba_owner_all ON public.client_brand_access;
CREATE POLICY cba_owner_all ON public.client_brand_access FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'))
  WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin') OR (auth.role() = 'service_role'));

-- 6) Cleanup helper functions
-- Keep try_add_fk / try_add_index for future migrations.

-- 3) Backfill legacy tenant fields

-- Backfill tenant columns for legacy rows.
-- Safe/idempotent: only fills NULLs.

-- 1) user_name from clients by user_id where possible
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_id'
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_name'
      )
  LOOP
    EXECUTE format(
      'update public.%I t
         set user_name = c.user_name
        from public.clients c
       where t.user_name is null
         and t.user_id is not null
         and c.user_id = t.user_id
         and c.user_name is not null',
      r.table_name
    );
  END LOOP;
END $$;

-- 2) client_id / brand_id from client_brand_access for rows with user_id
DO $$
DECLARE
  r record;
  client_type text;
  brand_type text;
  set_parts text;
BEGIN
  FOR r IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_id'
      )
      AND (
        EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'client_id'
        )
        OR EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'brand_id'
        )
      )
  LOOP
    SELECT c.data_type INTO client_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = r.table_name AND c.column_name = 'client_id';

    SELECT c.data_type INTO brand_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = r.table_name AND c.column_name = 'brand_id';

    set_parts := '';

    IF client_type IS NOT NULL THEN
      IF client_type = 'uuid' THEN
        set_parts := set_parts ||
          'client_id = coalesce(t.client_id, case when cba.client_id ~ ''^[0-9a-fA-F-]{36}$'' then cba.client_id::uuid else null end),';
      ELSE
        set_parts := set_parts ||
          'client_id = coalesce(t.client_id, cba.client_id),';
      END IF;
    END IF;

    IF brand_type IS NOT NULL THEN
      IF brand_type = 'uuid' THEN
        set_parts := set_parts ||
          'brand_id = coalesce(t.brand_id, cba.brand_id),';
      ELSE
        set_parts := set_parts ||
          'brand_id = coalesce(t.brand_id, cba.brand_id::text),';
      END IF;
    END IF;

    IF set_parts = '' THEN
      CONTINUE;
    END IF;

    set_parts := left(set_parts, length(set_parts) - 1);

    EXECUTE format(
      'update public.%I t
          set %s
         from (
           select distinct on (cba.user_id)
                  cba.user_id,
                  cba.client_id,
                  cba.brand_id
             from public.client_brand_access cba
            where cba.user_id is not null
            order by cba.user_id, cba.is_primary desc nulls last, cba.created_at desc nulls last
         ) cba
        where t.user_id is not null
          and cba.user_id = t.user_id',
      r.table_name,
      set_parts
    );
  END LOOP;
END $$;

-- 3) user_name from clients by client_id (for rows without user_id path)
DO $$
DECLARE
  r record;
  client_type text;
BEGIN
  FOR r IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_name'
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'client_id'
      )
  LOOP
    SELECT c.data_type INTO client_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = r.table_name AND c.column_name = 'client_id';

    IF client_type = 'uuid' THEN
      EXECUTE format(
        'update public.%I t
            set user_name = c.user_name
           from public.clients c
          where t.user_name is null
            and t.client_id is not null
            and c.id = t.client_id
            and c.user_name is not null',
        r.table_name
      );
    ELSE
      EXECUTE format(
        'update public.%I t
            set user_name = c.user_name
           from public.clients c
          where t.user_name is null
            and t.client_id is not null
            and c.id::text = t.client_id::text
            and c.user_name is not null',
        r.table_name
      );
    END IF;
  END LOOP;
END $$;

-- 4) helper indexes for backfilled tenant filters on known heavy tables
create index if not exists idx_brands_user_name on public.brands(user_name);
create index if not exists idx_projects_user_name on public.projects(user_name);
create index if not exists idx_employees_user_name on public.employees(user_name);
create index if not exists idx_services_user_name on public.services(user_name);
create index if not exists idx_customers_user_name on public.customers(user_name);

-- Ensure normalized brand section tables exist before running backfill.
create table if not exists public.brand_team_members (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  position text,
  phone text,
  email text,
  whatsapp text,
  sort_order integer not null default 0,
  user_id uuid not null,
  user_name text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.brand_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  description text,
  attachment_name text,
  sort_order integer not null default 0,
  user_id uuid not null,
  user_name text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.brand_documents (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  doc_type text not null check (doc_type in ('legal', 'financial', 'company_profile')),
  name text not null,
  url text,
  sort_order integer not null default 0,
  user_id uuid not null,
  user_name text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.brand_marketing_plans (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  title text not null,
  description text,
  attachment_name text,
  sort_order integer not null default 0,
  user_id uuid not null,
  user_name text,
  created_at timestamp with time zone not null default now()
);

-- 4.2) Backfill legacy brand JSON sections into normalized tables.
-- Safe/idempotent: inserts only when target section table has no rows for that brand.
do $$
declare
  b record;
begin
  for b in
    select id, user_id, user_name, data
    from public.brands
  loop
    -- owners
    if not exists (select 1 from public.brand_owners bo where bo.brand_id = b.id) then
      insert into public.brand_owners (id, brand_id, name, phone, email, whatsapp, sort_order, user_id, user_name)
      select
        case
          when coalesce(o.elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (o.elem->>'id')::uuid
          else gen_random_uuid()
        end,
        b.id,
        nullif(trim(coalesce(o.elem->>'name', '')), ''),
        nullif(trim(coalesce(o.elem->>'phone', '')), ''),
        nullif(trim(coalesce(o.elem->>'email', '')), ''),
        nullif(trim(coalesce(o.elem->>'whatsapp', '')), ''),
        o.ord - 1,
        b.user_id,
        b.user_name
      from jsonb_array_elements(coalesce(b.data->'owners', '[]'::jsonb)) with ordinality as o(elem, ord)
      where nullif(trim(coalesce(o.elem->>'name', '')), '') is not null;
    end if;

    -- team
    if not exists (select 1 from public.brand_team_members tm where tm.brand_id = b.id) then
      insert into public.brand_team_members (id, brand_id, name, position, phone, email, whatsapp, sort_order, user_id, user_name)
      select
        case
          when coalesce(t.elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (t.elem->>'id')::uuid
          else gen_random_uuid()
        end,
        b.id,
        nullif(trim(coalesce(t.elem->>'name', '')), ''),
        nullif(trim(coalesce(t.elem->>'position', '')), ''),
        nullif(trim(coalesce(t.elem->>'phone', '')), ''),
        nullif(trim(coalesce(t.elem->>'email', '')), ''),
        nullif(trim(coalesce(t.elem->>'whatsapp', '')), ''),
        t.ord - 1,
        b.user_id,
        b.user_name
      from jsonb_array_elements(coalesce(b.data->'team', '[]'::jsonb)) with ordinality as t(elem, ord)
      where nullif(trim(coalesce(t.elem->>'name', '')), '') is not null;
    end if;

    -- products
    if not exists (select 1 from public.brand_products bp where bp.brand_id = b.id) then
      insert into public.brand_products (id, brand_id, name, description, attachment_name, sort_order, user_id, user_name)
      select
        case
          when coalesce(p.elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (p.elem->>'id')::uuid
          else gen_random_uuid()
        end,
        b.id,
        nullif(trim(coalesce(p.elem->>'name', '')), ''),
        nullif(trim(coalesce(p.elem->>'description', '')), ''),
        nullif(trim(coalesce(p.elem->>'attachmentName', '')), ''),
        p.ord - 1,
        b.user_id,
        b.user_name
      from jsonb_array_elements(coalesce(b.data->'products', '[]'::jsonb)) with ordinality as p(elem, ord)
      where nullif(trim(coalesce(p.elem->>'name', '')), '') is not null;
    end if;

    -- legal docs
    if not exists (
      select 1 from public.brand_documents bd
      where bd.brand_id = b.id and bd.doc_type = 'legal'
    ) then
      insert into public.brand_documents (id, brand_id, doc_type, name, url, sort_order, user_id, user_name)
      select
        case
          when coalesce(d.elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (d.elem->>'id')::uuid
          else gen_random_uuid()
        end,
        b.id,
        'legal',
        nullif(trim(coalesce(d.elem->>'name', '')), ''),
        nullif(trim(coalesce(d.elem->>'url', '')), ''),
        d.ord - 1,
        b.user_id,
        b.user_name
      from jsonb_array_elements(coalesce(b.data->'legalDocs', '[]'::jsonb)) with ordinality as d(elem, ord)
      where nullif(trim(coalesce(d.elem->>'name', '')), '') is not null;
    end if;

    -- financial docs
    if not exists (
      select 1 from public.brand_documents bd
      where bd.brand_id = b.id and bd.doc_type = 'financial'
    ) then
      insert into public.brand_documents (id, brand_id, doc_type, name, url, sort_order, user_id, user_name)
      select
        case
          when coalesce(d.elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (d.elem->>'id')::uuid
          else gen_random_uuid()
        end,
        b.id,
        'financial',
        nullif(trim(coalesce(d.elem->>'name', '')), ''),
        nullif(trim(coalesce(d.elem->>'url', '')), ''),
        d.ord - 1,
        b.user_id,
        b.user_name
      from jsonb_array_elements(coalesce(b.data->'financialDocs', '[]'::jsonb)) with ordinality as d(elem, ord)
      where nullif(trim(coalesce(d.elem->>'name', '')), '') is not null;
    end if;

    -- company profiles
    if not exists (
      select 1 from public.brand_documents bd
      where bd.brand_id = b.id and bd.doc_type = 'company_profile'
    ) then
      insert into public.brand_documents (id, brand_id, doc_type, name, url, sort_order, user_id, user_name)
      select
        case
          when coalesce(d.elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (d.elem->>'id')::uuid
          else gen_random_uuid()
        end,
        b.id,
        'company_profile',
        nullif(trim(coalesce(d.elem->>'name', '')), ''),
        nullif(trim(coalesce(d.elem->>'url', '')), ''),
        d.ord - 1,
        b.user_id,
        b.user_name
      from jsonb_array_elements(coalesce(b.data->'companyProfiles', '[]'::jsonb)) with ordinality as d(elem, ord)
      where nullif(trim(coalesce(d.elem->>'name', '')), '') is not null;
    end if;

    -- marketing plans
    if not exists (select 1 from public.brand_marketing_plans mp where mp.brand_id = b.id) then
      insert into public.brand_marketing_plans (id, brand_id, title, description, attachment_name, sort_order, user_id, user_name)
      select
        case
          when coalesce(m.elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (m.elem->>'id')::uuid
          else gen_random_uuid()
        end,
        b.id,
        nullif(trim(coalesce(m.elem->>'title', '')), ''),
        nullif(trim(coalesce(m.elem->>'description', '')), ''),
        nullif(trim(coalesce(m.elem->>'attachmentName', '')), ''),
        m.ord - 1,
        b.user_id,
        b.user_name
      from jsonb_array_elements(coalesce(b.data->'marketingPlans', '[]'::jsonb)) with ordinality as m(elem, ord)
      where nullif(trim(coalesce(m.elem->>'title', '')), '') is not null;
    end if;
  end loop;
end $$;

-- 4.1) Normalized brand profile sections (owners already exists as brand_owners)
create table if not exists public.brand_team_members (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  position text,
  phone text,
  email text,
  whatsapp text,
  sort_order integer not null default 0,
  user_id uuid not null,
  user_name text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.brand_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  description text,
  attachment_name text,
  sort_order integer not null default 0,
  user_id uuid not null,
  user_name text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.brand_documents (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  doc_type text not null check (doc_type in ('legal', 'financial', 'company_profile')),
  name text not null,
  url text,
  sort_order integer not null default 0,
  user_id uuid not null,
  user_name text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.brand_marketing_plans (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  title text not null,
  description text,
  attachment_name text,
  sort_order integer not null default 0,
  user_id uuid not null,
  user_name text,
  created_at timestamp with time zone not null default now()
);

grant select, insert, update, delete on public.brand_team_members to authenticated;
grant all on public.brand_team_members to service_role;
grant select, insert, update, delete on public.brand_products to authenticated;
grant all on public.brand_products to service_role;
grant select, insert, update, delete on public.brand_documents to authenticated;
grant all on public.brand_documents to service_role;
grant select, insert, update, delete on public.brand_marketing_plans to authenticated;
grant all on public.brand_marketing_plans to service_role;

alter table public.brand_team_members enable row level security;
alter table public.brand_products enable row level security;
alter table public.brand_documents enable row level security;
alter table public.brand_marketing_plans enable row level security;

drop policy if exists btm_owner_all on public.brand_team_members;
create policy btm_owner_all on public.brand_team_members for all
  using ((auth.uid() = user_id) or has_role(auth.uid(), 'admin') or (auth.role() = 'service_role'))
  with check ((auth.uid() = user_id) or has_role(auth.uid(), 'admin') or (auth.role() = 'service_role'));

drop policy if exists bp_owner_all on public.brand_products;
create policy bp_owner_all on public.brand_products for all
  using ((auth.uid() = user_id) or has_role(auth.uid(), 'admin') or (auth.role() = 'service_role'))
  with check ((auth.uid() = user_id) or has_role(auth.uid(), 'admin') or (auth.role() = 'service_role'));

drop policy if exists bd_owner_all on public.brand_documents;
create policy bd_owner_all on public.brand_documents for all
  using ((auth.uid() = user_id) or has_role(auth.uid(), 'admin') or (auth.role() = 'service_role'))
  with check ((auth.uid() = user_id) or has_role(auth.uid(), 'admin') or (auth.role() = 'service_role'));

drop policy if exists bmp_owner_all on public.brand_marketing_plans;
create policy bmp_owner_all on public.brand_marketing_plans for all
  using ((auth.uid() = user_id) or has_role(auth.uid(), 'admin') or (auth.role() = 'service_role'))
  with check ((auth.uid() = user_id) or has_role(auth.uid(), 'admin') or (auth.role() = 'service_role'));

create index if not exists idx_brand_team_members_brand on public.brand_team_members(brand_id, sort_order);
create index if not exists idx_brand_products_brand on public.brand_products(brand_id, sort_order);
create index if not exists idx_brand_documents_brand on public.brand_documents(brand_id, doc_type, sort_order);
create index if not exists idx_brand_marketing_plans_brand on public.brand_marketing_plans(brand_id, sort_order);
