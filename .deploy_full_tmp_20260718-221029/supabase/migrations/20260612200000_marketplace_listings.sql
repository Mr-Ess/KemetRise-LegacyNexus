-- ════════════════════════════════════════════════════════════════════════════
-- Marketplace: Multi-type listings (digital, physical, service, subscription)
-- ════════════════════════════════════════════════════════════════════════════

-- ── Core listings table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type    TEXT NOT NULL CHECK (listing_type IN ('digital','physical','service','subscription')),
  name            TEXT NOT NULL,
  slug            TEXT,
  description     TEXT,
  long_description TEXT,
  thumbnail_url   TEXT,
  gallery_urls    TEXT[],
  category        TEXT,
  sub_category    TEXT,
  tags            TEXT[] DEFAULT '{}',
  price_cents     INTEGER NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  pricing_model   TEXT NOT NULL DEFAULT 'free'
                    CHECK (pricing_model IN ('free','one_time','monthly','annual','contact')),
  publisher_name  TEXT,
  publisher_avatar TEXT,
  publisher_user_id UUID,
  rating          NUMERIC(2,1) DEFAULT 0,
  reviews_count   INTEGER DEFAULT 0,
  sales_count     INTEGER DEFAULT 0,
  is_featured     BOOLEAN DEFAULT false,
  is_new          BOOLEAN DEFAULT false,
  is_verified     BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  -- type-specific metadata stored as JSONB:
  -- digital:      { file_size, file_type, version, compatibility, license_type, demo_url }
  -- physical:     { weight_kg, dimensions, stock_qty, sku, shipping_zones, material, brand }
  -- service:      { delivery_days, revisions, packages: [{name,price_cents,features[]}], availability }
  -- subscription: { billing_cycle, max_users, storage_gb, features: string[], trial_days }
  meta            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Purchases ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_purchases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES mp_listings(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  amount_cents  INTEGER NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'USD',
  status        TEXT NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('pending','completed','refunded','cancelled')),
  purchased_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Wishlist ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_wishlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES mp_listings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, user_id)
);

-- ── Reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES mp_listings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, user_id)
);

-- ── Listing Requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_listing_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  listing_type TEXT NOT NULL DEFAULT 'digital',
  description  TEXT NOT NULL,
  contact      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS mp_listings_type_idx       ON mp_listings(listing_type);
CREATE INDEX IF NOT EXISTS mp_listings_category_idx   ON mp_listings(category);
CREATE INDEX IF NOT EXISTS mp_listings_active_idx     ON mp_listings(is_active);
CREATE INDEX IF NOT EXISTS mp_listings_featured_idx   ON mp_listings(is_featured);
CREATE INDEX IF NOT EXISTS mp_purchases_user_idx      ON mp_purchases(user_id);
CREATE INDEX IF NOT EXISTS mp_purchases_listing_idx   ON mp_purchases(listing_id);
CREATE INDEX IF NOT EXISTS mp_wishlist_user_idx       ON mp_wishlist(user_id);
CREATE INDEX IF NOT EXISTS mp_reviews_listing_idx     ON mp_reviews(listing_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE mp_listings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_purchases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_wishlist         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_listing_requests ENABLE ROW LEVEL SECURITY;

-- mp_listings: anyone can read active listings
CREATE POLICY "mp_listings_read" ON mp_listings
  FOR SELECT USING (is_active = true);

-- mp_listings: publishers can manage their own
CREATE POLICY "mp_listings_owner_all" ON mp_listings
  FOR ALL USING (publisher_user_id = auth.uid());

-- mp_purchases: users see their own
CREATE POLICY "mp_purchases_own" ON mp_purchases
  FOR ALL USING (user_id = auth.uid());

-- mp_wishlist: users manage their own
CREATE POLICY "mp_wishlist_own" ON mp_wishlist
  FOR ALL USING (user_id = auth.uid());

-- mp_reviews: users see all, manage their own
CREATE POLICY "mp_reviews_read" ON mp_reviews
  FOR SELECT USING (true);

CREATE POLICY "mp_reviews_own" ON mp_reviews
  FOR ALL USING (user_id = auth.uid());

-- mp_listing_requests: anyone can insert
CREATE POLICY "mp_listing_requests_insert" ON mp_listing_requests
  FOR INSERT WITH CHECK (true);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mp_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS mp_listings_updated_at ON mp_listings;
CREATE TRIGGER mp_listings_updated_at
  BEFORE UPDATE ON mp_listings
  FOR EACH ROW EXECUTE FUNCTION mp_set_updated_at();

-- ── Auto-recalculate listing rating on review insert/update/delete ────────────
CREATE OR REPLACE FUNCTION mp_refresh_listing_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE lid UUID;
BEGIN
  lid := COALESCE(NEW.listing_id, OLD.listing_id);
  UPDATE mp_listings SET
    rating        = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM mp_reviews WHERE listing_id = lid), 0),
    reviews_count = (SELECT COUNT(*) FROM mp_reviews WHERE listing_id = lid)
  WHERE id = lid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mp_reviews_rating_sync ON mp_reviews;
CREATE TRIGGER mp_reviews_rating_sync
  AFTER INSERT OR UPDATE OR DELETE ON mp_reviews
  FOR EACH ROW EXECUTE FUNCTION mp_refresh_listing_rating();

-- ── Auto-increment sales_count on completed purchase ─────────────────────────
CREATE OR REPLACE FUNCTION mp_increment_sales()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE mp_listings SET sales_count = sales_count + 1 WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mp_purchases_sales_sync ON mp_purchases;
CREATE TRIGGER mp_purchases_sales_sync
  AFTER INSERT ON mp_purchases
  FOR EACH ROW EXECUTE FUNCTION mp_increment_sales();
