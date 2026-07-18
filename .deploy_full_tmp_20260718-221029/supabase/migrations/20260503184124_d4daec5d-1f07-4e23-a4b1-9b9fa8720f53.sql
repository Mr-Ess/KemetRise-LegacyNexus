
-- Phase A: 2FA + Backups + Webhooks Deliveries + Saved Views + Team + Push subs

-- 2FA
CREATE TABLE public.user_2fa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  backup_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "u2fa_owner_all" ON public.user_2fa FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER u2fa_updated BEFORE UPDATE ON public.user_2fa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backups
CREATE TABLE public.backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  size_bytes bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "backups_owner_all" ON public.backups FOR ALL USING (auth.uid() = user_id OR has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_backups_user ON public.backups(user_id, created_at DESC);

-- Webhook deliveries
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  webhook_id uuid NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_status integer,
  response_body text,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wd_owner_select" ON public.webhook_deliveries FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "wd_owner_insert" ON public.webhook_deliveries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_wd_user ON public.webhook_deliveries(user_id, created_at DESC);
CREATE INDEX idx_wd_webhook ON public.webhook_deliveries(webhook_id);

-- Saved views
CREATE TABLE public.saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page text NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sv_owner_all" ON public.saved_views FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_sv_user_page ON public.saved_views(user_id, page);

-- Brand members (team collab)
CREATE TABLE public.brand_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, user_id)
);
ALTER TABLE public.brand_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bm_select" ON public.brand_members FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM brands b WHERE b.id = brand_id AND b.user_id = auth.uid()));
CREATE POLICY "bm_owner_manage" ON public.brand_members FOR ALL USING (EXISTS (SELECT 1 FROM brands b WHERE b.id = brand_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM brands b WHERE b.id = brand_id AND b.user_id = auth.uid()));

-- Brand invitations
CREATE TABLE public.brand_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'member',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_brand_owner" ON public.brand_invitations FOR ALL USING (EXISTS (SELECT 1 FROM brands b WHERE b.id = brand_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM brands b WHERE b.id = brand_id AND b.user_id = auth.uid()));
CREATE POLICY "bi_public_read_by_token" ON public.brand_invitations FOR SELECT USING (true);

-- Push subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_owner_all" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
