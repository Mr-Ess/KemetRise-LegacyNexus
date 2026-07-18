-- ══════════════════════════════════════════════════════════════════
-- Digital Mall — Full Schema
-- Multi-tenant online mall: stores, products, orders, reviews, ads
-- ══════════════════════════════════════════════════════════════════

-- ── Mall Floors (category groups like a real mall) ─────────────────
CREATE TABLE IF NOT EXISTS mall_floors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  name_ar     TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '🏬',
  color       TEXT NOT NULL DEFAULT 'violet',
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Stores (tenant storefronts) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS mall_stores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  floor_id          UUID REFERENCES mall_floors(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  name_ar           TEXT NOT NULL DEFAULT '',
  slug              TEXT UNIQUE,
  description       TEXT NOT NULL DEFAULT '',
  description_ar    TEXT NOT NULL DEFAULT '',
  long_description  TEXT,
  logo_url          TEXT,
  banner_url        TEXT,
  cover_color       TEXT NOT NULL DEFAULT 'violet',
  owner_name        TEXT NOT NULL DEFAULT '',
  owner_avatar      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  website_url       TEXT,
  social_links      JSONB DEFAULT '{}',
  tags              TEXT[] DEFAULT '{}',
  rating            NUMERIC(3,2) DEFAULT 0,
  reviews_count     INTEGER DEFAULT 0,
  products_count    INTEGER DEFAULT 0,
  sales_count       INTEGER DEFAULT 0,
  followers_count   INTEGER DEFAULT 0,
  is_featured       BOOLEAN DEFAULT false,
  is_verified       BOOLEAN DEFAULT false,
  is_new            BOOLEAN DEFAULT true,
  is_active         BOOLEAN DEFAULT true,
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','suspended','rejected')),
  meta              JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Store Products ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mall_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES mall_stores(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  name_ar         TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  long_description TEXT,
  thumbnail_url   TEXT,
  images          TEXT[] DEFAULT '{}',
  category        TEXT NOT NULL DEFAULT '',
  sub_category    TEXT,
  tags            TEXT[] DEFAULT '{}',
  price_cents     INTEGER NOT NULL DEFAULT 0,
  compare_price_cents INTEGER,
  currency        TEXT NOT NULL DEFAULT 'USD',
  pricing_model   TEXT NOT NULL DEFAULT 'one_time'
    CHECK (pricing_model IN ('free','one_time','monthly','annual','contact')),
  stock_qty       INTEGER,
  sku             TEXT,
  weight_kg       NUMERIC(8,3),
  is_digital      BOOLEAN DEFAULT false,
  is_featured     BOOLEAN DEFAULT false,
  is_new          BOOLEAN DEFAULT true,
  is_active       BOOLEAN DEFAULT true,
  rating          NUMERIC(3,2) DEFAULT 0,
  reviews_count   INTEGER DEFAULT 0,
  sales_count     INTEGER DEFAULT 0,
  views_count     INTEGER DEFAULT 0,
  meta            JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Mall Banners / Promotions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS mall_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  image_url   TEXT,
  link_url    TEXT,
  link_type   TEXT DEFAULT 'store' CHECK (link_type IN ('store','product','floor','external')),
  link_id     UUID,
  color       TEXT NOT NULL DEFAULT 'violet',
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Store Reviews ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mall_store_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES mall_stores(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer    TEXT NOT NULL DEFAULT 'Anonymous',
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Product Reviews ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mall_product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES mall_products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer    TEXT NOT NULL DEFAULT 'Anonymous',
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Store Followers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mall_store_followers (
  store_id    UUID NOT NULL REFERENCES mall_stores(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, user_id)
);

-- ── Mall Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mall_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES mall_stores(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES mall_products(id) ON DELETE CASCADE,
  buyer_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name      TEXT NOT NULL DEFAULT '',
  buyer_email     TEXT,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  total_cents     INTEGER NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  note            TEXT,
  meta            JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Store Application (request to open a store) ───────────────────
CREATE TABLE IF NOT EXISTS mall_store_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  store_name      TEXT NOT NULL,
  floor_id        UUID REFERENCES mall_floors(id) ON DELETE SET NULL,
  description     TEXT NOT NULL DEFAULT '',
  contact_name    TEXT NOT NULL DEFAULT '',
  contact_email   TEXT NOT NULL DEFAULT '',
  contact_phone   TEXT,
  website_url     TEXT,
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  reviewed_at     TIMESTAMPTZ,
  reviewer_notes  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS mall_stores_floor_idx    ON mall_stores(floor_id);
CREATE INDEX IF NOT EXISTS mall_stores_owner_idx    ON mall_stores(owner_user_id);
CREATE INDEX IF NOT EXISTS mall_stores_status_idx   ON mall_stores(status);
CREATE INDEX IF NOT EXISTS mall_stores_active_idx   ON mall_stores(is_active);
CREATE INDEX IF NOT EXISTS mall_products_store_idx  ON mall_products(store_id);
CREATE INDEX IF NOT EXISTS mall_products_active_idx ON mall_products(is_active);
CREATE INDEX IF NOT EXISTS mall_orders_store_idx    ON mall_orders(store_id);
CREATE INDEX IF NOT EXISTS mall_orders_buyer_idx    ON mall_orders(buyer_user_id);

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE mall_floors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_stores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_banners              ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_store_reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_product_reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_store_followers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_store_applications   ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "mall_floors_read"    ON mall_floors    FOR SELECT USING (true);
CREATE POLICY "mall_stores_read"    ON mall_stores    FOR SELECT USING (is_active = true);
CREATE POLICY "mall_products_read"  ON mall_products  FOR SELECT USING (is_active = true);
CREATE POLICY "mall_banners_read"   ON mall_banners   FOR SELECT USING (is_active = true);
CREATE POLICY "mall_store_reviews_read"   ON mall_store_reviews   FOR SELECT USING (true);
CREATE POLICY "mall_product_reviews_read" ON mall_product_reviews FOR SELECT USING (true);

-- Auth write
CREATE POLICY "mall_stores_auth"    ON mall_stores    FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mall_products_auth"  ON mall_products  FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mall_banners_auth"   ON mall_banners   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mall_floors_auth"    ON mall_floors    FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mall_store_reviews_auth"   ON mall_store_reviews   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mall_product_reviews_auth" ON mall_product_reviews FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mall_followers_auth"       ON mall_store_followers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mall_orders_auth"          ON mall_orders          FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mall_applications_auth"    ON mall_store_applications FOR ALL USING (auth.uid() IS NOT NULL);

-- ── Seed default floors ───────────────────────────────────────────
INSERT INTO mall_floors (name, name_ar, icon, color, sort_order) VALUES
  ('Electronics & Tech',   'إلكترونيات وتقنية',    '💻', 'blue',    1),
  ('Fashion & Apparel',    'أزياء وملابس',          '👗', 'pink',    2),
  ('Food & Beverages',     'أغذية ومشروبات',        '🍔', 'orange',  3),
  ('Home & Furniture',     'منزل وأثاث',             '🛋️','emerald', 4),
  ('Beauty & Health',      'جمال وصحة',              '💄', 'rose',    5),
  ('Books & Education',    'كتب وتعليم',             '📚', 'violet',  6),
  ('Sports & Fitness',     'رياضة ولياقة',           '⚽', 'amber',   7),
  ('Digital & Services',   'رقمي وخدمات',            '💾', 'purple',  8),
  ('Art & Handcraft',      'فن وحرف يدوية',          '🎨', 'teal',    9),
  ('Toys & Kids',          'ألعاب وأطفال',           '🧸', 'yellow', 10)
ON CONFLICT DO NOTHING;
