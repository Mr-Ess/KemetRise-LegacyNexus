-- ══════════════════════════════════════════════════════
-- Marketplace: Dynamic Listing Type Sections
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mp_listing_types (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,
  label               TEXT NOT NULL,
  label_ar            TEXT NOT NULL DEFAULT '',
  icon                TEXT NOT NULL DEFAULT '📦',
  color               TEXT NOT NULL DEFAULT 'violet',
  sort_order          INTEGER DEFAULT 0,
  is_active           BOOLEAN DEFAULT true,
  is_built_in         BOOLEAN DEFAULT false,
  default_categories  TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 4 built-in types
INSERT INTO mp_listing_types
  (code, label, label_ar, icon, color, sort_order, is_active, is_built_in, default_categories)
VALUES
  ('digital',      'Digital Products',  'منتجات رقمية', '💾', 'violet',  1, true, true,
   ARRAY['Software','Templates','E-books','Online Courses','Plugins','UI Kits','Fonts','Audio','Video','Graphics']),
  ('physical',     'Physical Products', 'منتجات ملموسة', '📦', 'emerald', 2, true, true,
   ARRAY['Electronics','Fashion','Furniture','Food & Beverage','Handcraft','Books','Sports','Tools','Accessories','Art']),
  ('service',      'Services',          'خدمات',         '🛠️', 'amber',   3, true, true,
   ARRAY['Design','Development','Marketing','Writing & Translation','Consulting','Legal','Finance','Coaching','Photography','Videography']),
  ('subscription', 'Subscriptions',     'اشتراكات',      '♾️', 'pink',    4, true, true,
   ARRAY['SaaS Tools','Media Streaming','Education','Fitness','Business','Entertainment','News & Data','Cloud Storage'])
ON CONFLICT (code) DO NOTHING;

CREATE INDEX IF NOT EXISTS mp_listing_types_active_idx ON mp_listing_types(is_active);

ALTER TABLE mp_listing_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_listing_types_read"     ON mp_listing_types FOR SELECT USING (true);
CREATE POLICY "mp_listing_types_auth_all" ON mp_listing_types FOR ALL    USING (auth.uid() IS NOT NULL);

-- Drop old hardcoded CHECK on mp_listings.listing_type (allow dynamic types)
ALTER TABLE mp_listings DROP CONSTRAINT IF EXISTS mp_listings_listing_type_check;
