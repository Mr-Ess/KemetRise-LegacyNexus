
-- Performance: indexes on the most queried columns (user_id + brand_id + created_at)
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
CREATE INDEX IF NOT EXISTS idx_branches_user_id ON public.branches(user_id);
CREATE INDEX IF NOT EXISTS idx_branches_brand_id ON public.branches(brand_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_brand_id ON public.employees(brand_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON public.chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON public.chat_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_user ON public.materials(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_user ON public.marketing_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_logistics_user ON public.logistics_shipping(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_vault_user ON public.legal_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user ON public.assets_management(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_user ON public.finance_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_heirs_user ON public.heirs(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_members_brand ON public.brand_members(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_members_user ON public.brand_members(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_invitations_token ON public.brand_invitations(token);
CREATE INDEX IF NOT EXISTS idx_entity_files_owner ON public.entity_files(owner_kind, owner_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_featured ON public.marketplace_apps(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(published, published_at DESC) WHERE published = true;
