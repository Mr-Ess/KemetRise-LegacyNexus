
-- IP Whitelist
CREATE TABLE public.ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  ip_range TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ip_whitelist" ON public.ip_whitelist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- White Label
CREATE TABLE public.white_label (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  brand_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#d4af37',
  accent_color TEXT DEFAULT '#8b0000',
  custom_domain TEXT,
  hide_branding BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.white_label ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own white_label" ON public.white_label FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Marketplace Apps
CREATE TABLE public.marketplace_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  developer TEXT,
  price_cents INT DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  installs INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketplace public read" ON public.marketplace_apps FOR SELECT USING (true);

CREATE TABLE public.installed_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  app_id UUID NOT NULL REFERENCES public.marketplace_apps(id) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id)
);
ALTER TABLE public.installed_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own installs" ON public.installed_apps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Blog
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_url TEXT,
  author TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog public read" ON public.blog_posts FOR SELECT USING (published = true);

-- Referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  reward_amount NUMERIC DEFAULT 10,
  reward_currency TEXT DEFAULT 'USD',
  total_referred INT DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referrals" ON public.referrals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- seed marketplace
INSERT INTO public.marketplace_apps (slug, name, description, category, icon, developer, price_cents, rating, installs, featured) VALUES
('slack-sync', 'Slack Sync', 'Sync notifications to Slack channels', 'Communication', '💬', 'KemetRise', 0, 4.8, 1240, true),
('zapier', 'Zapier Connect', 'Connect to 5000+ apps via Zapier', 'Automation', '⚡', 'Zapier', 0, 4.9, 3200, true),
('mailchimp', 'Mailchimp', 'Email marketing campaigns', 'Marketing', '📧', 'Mailchimp', 1900, 4.5, 890, false),
('google-analytics', 'Google Analytics', 'Track website visitors', 'Analytics', '📊', 'Google', 0, 4.7, 5600, true),
('stripe', 'Stripe Payments', 'Accept payments globally', 'Payments', '💳', 'Stripe', 0, 5.0, 8900, true),
('hubspot', 'HubSpot CRM', 'Sync contacts and deals', 'CRM', '🎯', 'HubSpot', 2900, 4.6, 1500, false),
('notion', 'Notion Sync', 'Sync docs to Notion', 'Productivity', '📝', 'Notion', 0, 4.4, 720, false),
('twilio', 'Twilio SMS', 'Send SMS notifications', 'Communication', '📱', 'Twilio', 990, 4.7, 2100, false);

INSERT INTO public.blog_posts (slug, title, excerpt, content, author, published, published_at) VALUES
('welcome-to-kemetrise', 'Welcome to KemetRise', 'The Egyptian Cyberpunk OS for modern empires', '# Welcome\n\nKemetRise is a unified platform...', 'Pharaoh', true, now()),
('automation-guide', 'Automating your empire', 'How to leverage AI agents and webhooks', '# Automation\n\nLet AI handle the routine...', 'KEMET AI', true, now() - interval '2 days'),
('security-best-practices', 'Security Best Practices', '2FA, IP whitelisting, and SSO', '# Security\n\nProtect your kingdom...', 'Anubis', true, now() - interval '5 days');
