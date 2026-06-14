-- ═══════════════════════════════════════════════════════════════
-- KemetRise Unified Platform — User Roles & Portals
-- Three portals: admin | provider | user
-- ═══════════════════════════════════════════════════════════════

-- ── User Profiles (extends Supabase auth.users) ──────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'user'
                    CHECK (role IN ('admin', 'provider', 'user')),
  full_name       TEXT,
  avatar_url      TEXT,
  phone           TEXT,
  country         TEXT,
  preferred_lang  TEXT NOT NULL DEFAULT 'ar' CHECK (preferred_lang IN ('ar','en')),
  preferred_theme TEXT NOT NULL DEFAULT 'dark' CHECK (preferred_theme IN ('dark','light')),
  bio             TEXT,
  website         TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  is_suspended    BOOLEAN NOT NULL DEFAULT false,
  onboarding_done BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_self" ON user_profiles;
CREATE POLICY "user_profiles_self" ON user_profiles
  FOR ALL USING (id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;
CREATE POLICY "user_profiles_admin_all" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- Public read for basic info (name/avatar)
DROP POLICY IF EXISTS "user_profiles_public_read" ON user_profiles;
CREATE POLICY "user_profiles_public_read" ON user_profiles
  FOR SELECT USING (true);

-- ── Provider Profiles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name     TEXT NOT NULL,
  business_type     TEXT NOT NULL DEFAULT 'individual',
  category          TEXT,
  description       TEXT,
  logo_url          TEXT,
  cover_url         TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  address           TEXT,
  country           TEXT,
  social_links      JSONB NOT NULL DEFAULT '{}',
  is_approved       BOOLEAN NOT NULL DEFAULT false,
  approval_notes    TEXT,
  commission_rate   NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  total_revenue     BIGINT NOT NULL DEFAULT 0,
  total_orders      INTEGER NOT NULL DEFAULT 0,
  rating            NUMERIC(3,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "provider_profiles_own" ON provider_profiles;
CREATE POLICY "provider_profiles_own" ON provider_profiles
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "provider_profiles_public_read" ON provider_profiles;
CREATE POLICY "provider_profiles_public_read" ON provider_profiles
  FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "provider_profiles_admin" ON provider_profiles;
CREATE POLICY "provider_profiles_admin" ON provider_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Platform Financial Transactions (unified) ────────────────
CREATE TABLE IF NOT EXISTS platform_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES mp_orders(id) ON DELETE SET NULL,
  payer_user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gateway_id        UUID,
  type              TEXT NOT NULL DEFAULT 'purchase'
                      CHECK (type IN ('purchase','subscription','refund','payout','fee','commission')),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','processing','completed','failed','refunded','cancelled')),
  gross_amount      BIGINT NOT NULL DEFAULT 0,
  fee_amount        BIGINT NOT NULL DEFAULT 0,
  commission_amount BIGINT NOT NULL DEFAULT 0,
  net_amount        BIGINT NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'USD',
  payment_method    TEXT,
  gateway_reference TEXT,
  gateway_response  JSONB,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pt_payer_idx    ON platform_transactions(payer_user_id);
CREATE INDEX IF NOT EXISTS pt_provider_idx ON platform_transactions(provider_user_id);
CREATE INDEX IF NOT EXISTS pt_status_idx   ON platform_transactions(status);
CREATE INDEX IF NOT EXISTS pt_type_idx     ON platform_transactions(type);
CREATE INDEX IF NOT EXISTS pt_created_idx  ON platform_transactions(created_at DESC);

ALTER TABLE platform_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pt_payer" ON platform_transactions;
CREATE POLICY "pt_payer" ON platform_transactions
  FOR SELECT USING (payer_user_id = auth.uid());

DROP POLICY IF EXISTS "pt_provider" ON platform_transactions;
CREATE POLICY "pt_provider" ON platform_transactions
  FOR SELECT USING (provider_user_id = auth.uid());

DROP POLICY IF EXISTS "pt_admin" ON platform_transactions;
CREATE POLICY "pt_admin" ON platform_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Subscription Plans ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  description     TEXT,
  description_ar  TEXT,
  target_role     TEXT NOT NULL DEFAULT 'user' CHECK (target_role IN ('user','provider','both')),
  price_monthly   INTEGER NOT NULL DEFAULT 0,
  price_annual    INTEGER NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  features        JSONB NOT NULL DEFAULT '[]',
  limits          JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_read" ON subscription_plans;
CREATE POLICY "plans_read" ON subscription_plans FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "plans_admin" ON subscription_plans;
CREATE POLICY "plans_admin" ON subscription_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ── User Subscriptions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES subscription_plans(id),
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','cancelled','expired','past_due','trialing')),
  billing_cycle     TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end   TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days',
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  discount_percent  INTEGER NOT NULL DEFAULT 0,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subs_own" ON user_subscriptions;
CREATE POLICY "subs_own" ON user_subscriptions FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "subs_admin" ON user_subscriptions;
CREATE POLICY "subs_admin" ON user_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ── Auto-create profile on user signup ───────────────────────
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, avatar_url, preferred_lang)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'ar'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Default subscription plans ───────────────────────────────
INSERT INTO subscription_plans (code, name, name_ar, description, description_ar, target_role, price_monthly, price_annual, currency, features, sort_order)
VALUES
  ('free',     'Free',       'مجاني',       'Basic access',         'وصول أساسي',        'both',     0,    0,     'USD', '["marketplace_browse","basic_orders","profile"]', 0),
  ('starter',  'Starter',    'مبتدئ',       'For small sellers',    'للبائعين الصغار',   'provider', 999,  9990,  'USD', '["5_listings","order_management","basic_analytics"]', 1),
  ('pro',      'Pro',        'احترافي',     'For growing sellers',  'للبائعين النشطين',  'provider', 2999, 29990, 'USD', '["unlimited_listings","advanced_analytics","priority_support","api_access"]', 2),
  ('premium',  'Premium',    'بريميوم',     'For power users',      'للمستخدمين المميزين','user',    499,  4990,  'USD', '["vip_support","exclusive_deals","early_access"]', 3),
  ('enterprise','Enterprise','مؤسسي',       'Full platform access', 'وصول كامل للمنصة', 'both',     9999, 99990, 'USD', '["custom_domain","white_label","dedicated_support","unlimited_everything"]', 4)
ON CONFLICT (code) DO NOTHING;

-- ── Updated_at triggers ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS provider_profiles_updated_at ON provider_profiles;
CREATE TRIGGER provider_profiles_updated_at BEFORE UPDATE ON provider_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS pt_updated_at ON platform_transactions;
CREATE TRIGGER pt_updated_at BEFORE UPDATE ON platform_transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
