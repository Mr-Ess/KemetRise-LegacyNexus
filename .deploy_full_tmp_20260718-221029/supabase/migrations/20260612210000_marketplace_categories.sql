-- Marketplace: Dynamic Categories (main + sub)
CREATE TABLE IF NOT EXISTS mp_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('digital','physical','service','subscription')),
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES mp_categories(id) ON DELETE CASCADE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_type, name, parent_id)
);

CREATE INDEX IF NOT EXISTS mp_categories_type_idx   ON mp_categories(listing_type);
CREATE INDEX IF NOT EXISTS mp_categories_parent_idx ON mp_categories(parent_id);

ALTER TABLE mp_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY "mp_categories_read" ON mp_categories FOR SELECT USING (true);
-- Authenticated users can manage categories
CREATE POLICY "mp_categories_auth_all" ON mp_categories FOR ALL USING (auth.uid() IS NOT NULL);
