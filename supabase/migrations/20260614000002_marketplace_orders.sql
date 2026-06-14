-- ═══════════════════════════════════════════════════════════
-- Marketplace Full Orders System
-- ═══════════════════════════════════════════════════════════

-- ── Shopping Cart ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  listing_id  UUID NOT NULL REFERENCES mp_listings(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS mp_cart_user_idx ON mp_cart_items(user_id);
ALTER TABLE mp_cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mp_cart_own" ON mp_cart_items;
CREATE POLICY "mp_cart_own" ON mp_cart_items FOR ALL USING (user_id = auth.uid());

-- ── Orders (full lifecycle) ──────────────────────────────
CREATE TABLE IF NOT EXISTS mp_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT NOT NULL DEFAULT '',
  user_id          UUID,
  buyer_name       TEXT NOT NULL,
  buyer_email      TEXT NOT NULL,
  buyer_phone      TEXT,
  buyer_address    TEXT,
  payment_method   TEXT NOT NULL DEFAULT 'pending',
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','completed','cancelled','refunded','failed')),
  subtotal_cents   INTEGER NOT NULL DEFAULT 0,
  discount_cents   INTEGER NOT NULL DEFAULT 0,
  total_cents      INTEGER NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'USD',
  notes            TEXT,
  invoice_sent     BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mp_orders_user_idx    ON mp_orders(user_id);
CREATE INDEX IF NOT EXISTS mp_orders_status_idx  ON mp_orders(status);
CREATE INDEX IF NOT EXISTS mp_orders_number_idx  ON mp_orders(order_number);

ALTER TABLE mp_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mp_orders_buyer" ON mp_orders;
CREATE POLICY "mp_orders_buyer" ON mp_orders
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mp_orders_seller_view" ON mp_orders;
CREATE POLICY "mp_orders_seller_view" ON mp_orders
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT oi.order_id
      FROM mp_order_items oi
      JOIN mp_listings l ON l.id = oi.listing_id
      WHERE l.publisher_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "mp_orders_seller_update" ON mp_orders;
CREATE POLICY "mp_orders_seller_update" ON mp_orders
  FOR UPDATE USING (
    id IN (
      SELECT DISTINCT oi.order_id
      FROM mp_order_items oi
      JOIN mp_listings l ON l.id = oi.listing_id
      WHERE l.publisher_user_id = auth.uid()
    )
  );

-- ── Order Items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES mp_orders(id) ON DELETE CASCADE,
  listing_id    UUID REFERENCES mp_listings(id) ON DELETE SET NULL,
  listing_name  TEXT NOT NULL,
  listing_type  TEXT NOT NULL DEFAULT 'digital',
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit_price    INTEGER NOT NULL DEFAULT 0,
  total_price   INTEGER NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'USD',
  meta          JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS mp_order_items_order_idx   ON mp_order_items(order_id);
CREATE INDEX IF NOT EXISTS mp_order_items_listing_idx ON mp_order_items(listing_id);

ALTER TABLE mp_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mp_order_items_buyer" ON mp_order_items;
CREATE POLICY "mp_order_items_buyer" ON mp_order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM mp_orders WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "mp_order_items_seller" ON mp_order_items;
CREATE POLICY "mp_order_items_seller" ON mp_order_items
  FOR SELECT USING (
    listing_id IN (SELECT id FROM mp_listings WHERE publisher_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "mp_order_items_insert" ON mp_order_items;
CREATE POLICY "mp_order_items_insert" ON mp_order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM mp_orders WHERE user_id = auth.uid())
  );

-- ── Auto-generate order number ────────────────────────────
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(NEW.id::text, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mp_orders_number_gen ON mp_orders;
CREATE TRIGGER mp_orders_number_gen
  BEFORE INSERT ON mp_orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ── Updated_at trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION mp_set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mp_orders_updated_at ON mp_orders;
CREATE TRIGGER mp_orders_updated_at
  BEFORE UPDATE ON mp_orders
  FOR EACH ROW EXECUTE FUNCTION mp_set_updated_at();
