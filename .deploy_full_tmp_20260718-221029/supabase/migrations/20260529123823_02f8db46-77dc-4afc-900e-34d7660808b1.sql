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
CREATE POLICY av_owner_all ON public.archive_vault FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
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
CREATE POLICY cm_owner_all ON public.client_mapping FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
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
CREATE POLICY cba_owner_all ON public.client_brand_access FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
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
CREATE POLICY dept_owner_all ON public.departments FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
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
CREATE POLICY st_owner_all ON public.sub_tasks FOR ALL
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sub_tasks_parent ON public.sub_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_cba_client ON public.client_brand_access(client_id);
CREATE INDEX IF NOT EXISTS idx_cba_brand ON public.client_brand_access(brand_id);
CREATE INDEX IF NOT EXISTS idx_archive_table ON public.archive_vault(original_table_name);