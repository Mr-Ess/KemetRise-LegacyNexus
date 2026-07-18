-- ═══════════════════════════════════════════════════════════════════════════
-- KemetRise — Seed Demo Data
-- Idempotent: skips if data already exists
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Promote first user to superadmin ────────────────────────────────────
-- If no admin/superadmin exists, the oldest user becomes superadmin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE role IN ('admin', 'superadmin')
  ) THEN
    UPDATE user_profiles
    SET role = 'superadmin'
    WHERE id = (SELECT id FROM user_profiles ORDER BY created_at ASC LIMIT 1);
  END IF;
END $$;

-- ── 2. Seed mp_listing_types ────────────────────────────────────────────────
INSERT INTO mp_listing_types (code, label, label_ar, icon, color, sort_order, is_active, is_built_in, default_categories)
VALUES
  ('digital',      'Digital Products',   'منتجات رقمية',   '💾', 'violet',  1, true, true, ARRAY['Software','Templates','E-books','Online Courses','Plugins & Extensions','UI Kits & Design','Fonts','Audio','Video','Graphics','3D Assets','Games & Game Assets']),
  ('physical',     'Physical Products',  'منتجات ملموسة',  '📦', 'emerald', 2, true, true, ARRAY['Electronics','Fashion','Furniture','Food & Beverage','Books','Sports & Fitness','Beauty & Care','Home & Kitchen','Toys & Games','Health','Automotive','Art & Collectibles','Handcraft']),
  ('virtual',      'Virtual Goods',      'منتجات افتراضية','🎮', 'blue',    3, true, true, ARRAY['In-game Items','NFTs & Collectibles','Virtual Real Estate','Gift Cards','License Keys','Accounts & Access']),
  ('service',      'Services',           'خدمات',           '🛠️','amber',   4, true, true, ARRAY['Design','Development','Marketing','Writing & Translation','Photography & Video','Education & Coaching','Consulting','Engineering','Finance','Legal','Health & Wellness']),
  ('subscription', 'Subscriptions',      'اشتراكات',        '♾️','pink',    5, true, true, ARRAY['SaaS Tools','Media & Entertainment','Education Platforms','Cloud & Hosting','Business Tools','Security & Privacy','News & Research','Health & Fitness'])
ON CONFLICT (code) DO NOTHING;

-- ── 3. Seed mp_listings ─────────────────────────────────────────────────────
INSERT INTO mp_listings (listing_type, name, description, category, tags, price_cents, currency, pricing_model, publisher_name, rating, reviews_count, sales_count, is_featured, is_new, is_verified, is_active, meta)
SELECT * FROM (VALUES
  ('digital',      'Enterprise ERP Suite',          'Full ERP system — HR, finance, inventory, CRM in one platform.',                   'Software',       ARRAY['erp','enterprise','software'],        99900,  'USD', 'annual',    'KemetRise',            4.9, 128, 340,  true,  false, true, true, '{"version":"3.0","license_type":"Commercial"}'::jsonb),
  ('subscription', 'AI Agent Pack',                 '10 custom AI brand agents — ANUBIS, ISIS, HORUS & more.',                          'SaaS Tools',     ARRAY['ai','agents','automation'],           4900,   'USD', 'monthly',   'KemetRise AI',         4.8, 89,  210,  true,  true,  true, true, '{"agents":10,"models":"GPT-4o, Claude"}'::jsonb),
  ('service',      'Business Setup Consulting',     'End-to-end business setup, legal structure & digital presence.',                   'Consulting',     ARRAY['consulting','setup','business'],      49900,  'USD', 'one_time',  'KemetRise Pro',        4.7, 56,  95,   false, false, true, true, '{}'::jsonb),
  ('digital',      'HR & Attendance Module',        'Biometric QR attendance, payroll, leave management.',                              'Software',       ARRAY['hr','payroll','attendance'],          29900,  'USD', 'annual',    'KemetRise',            4.6, 42,  178,  false, false, true, true, '{"version":"2.1"}'::jsonb),
  ('subscription', 'Marketing Suite',               'CRM + campaigns + lead pipeline + analytics dashboard.',                           'SaaS Tools',     ARRAY['crm','campaigns','marketing'],        1900,   'USD', 'monthly',   'KemetRise Marketing',  4.5, 71,  290,  true,  false, true, true, '{}'::jsonb),
  ('digital',      'API Access Token',              'Unlimited REST API access for developers and integrations.',                        'Software',       ARRAY['api','developer','integration'],      9900,   'USD', 'annual',    'KemetRise Dev',        4.4, 33,  520,  false, true,  true, true, '{"version":"v2"}'::jsonb),
  ('service',      'Brand Identity Design',         'Logo, colour palette, typography, brand guidelines.',                              'Design',         ARRAY['brand','logo','design'],              19900,  'USD', 'one_time',  'KemetRise Studio',     4.8, 19,  67,   false, true,  true, true, '{}'::jsonb),
  ('subscription', 'Sector Activation Bundle',      'Activate any 5 business sectors in your dashboard.',                               'Business Tools', ARRAY['sectors','platform','bundle'],        0,      'USD', 'free',      'KemetRise',            4.3, 88,  1200, false, false, true, true, '{}'::jsonb),
  ('physical',     'Smart Attendance Terminal',     'QR & fingerprint attendance kiosk, plug & play setup.',                            'Electronics',    ARRAY['hardware','attendance','biometric'],  34900,  'USD', 'one_time',  'KemetRise Hardware',   4.7, 24,  88,   true,  false, true, true, '{"sku":"KR-HW-ATT-01"}'::jsonb),
  ('service',      'White-Label Platform Setup',    'Full white-label deployment of KemetRise under your brand.',                       'Development',    ARRAY['whitelabel','deployment','custom'],   149900, 'USD', 'one_time',  'KemetRise Pro',        5.0, 12,  18,   true,  false, true, true, '{}'::jsonb),
  ('digital',      'E-Commerce Starter Kit',        'Ready-made online store template with payment integration.',                       'Templates',      ARRAY['ecommerce','template','store'],       7900,   'USD', 'one_time',  'KemetRise Studio',     4.5, 61,  340,  false, false, true, true, '{}'::jsonb),
  ('subscription', 'Cloud Backup & Recovery',       'Automated daily backups, 99.9% uptime SLA, instant restore.',                     'Cloud & Hosting',ARRAY['backup','cloud','security'],          2900,   'USD', 'monthly',   'KemetRise Cloud',      4.6, 38,  165,  false, false, true, true, '{}'::jsonb)
) AS v(listing_type, name, description, category, tags, price_cents, currency, pricing_model, publisher_name, rating, reviews_count, sales_count, is_featured, is_new, is_verified, is_active, meta)
WHERE NOT EXISTS (SELECT 1 FROM mp_listings LIMIT 1);

-- ── 4. Seed mall_floors ─────────────────────────────────────────────────────
INSERT INTO mall_floors (name, name_ar, icon, color, sort_order, is_active)
VALUES
  ('Electronics & Tech',  'إلكترونيات وتقنية', '💻', 'blue',    1, true),
  ('Fashion & Apparel',   'أزياء وملابس',      '👗', 'pink',    2, true),
  ('Food & Beverages',    'أغذية ومشروبات',    '🍔', 'orange',  3, true),
  ('Home & Furniture',    'منزل وأثاث',         '🛋️','emerald', 4, true),
  ('Beauty & Health',     'جمال وصحة',          '💄', 'rose',    5, true),
  ('Books & Education',   'كتب وتعليم',         '📚', 'violet',  6, true),
  ('Sports & Fitness',    'رياضة ولياقة',       '⚽', 'amber',   7, true),
  ('Digital & Services',  'رقمي وخدمات',       '💾', 'purple',  8, true),
  ('Art & Handcraft',     'فن وحرف يدوية',      '🎨', 'teal',    9, true),
  ('Toys & Kids',         'ألعاب وأطفال',       '🧸', 'yellow', 10, true)
ON CONFLICT DO NOTHING;

-- ── 5. Seed mall_stores ─────────────────────────────────────────────────────
DO $$
DECLARE
  f_tech    uuid; f_fashion uuid; f_food    uuid; f_home  uuid;
  f_beauty  uuid; f_books   uuid; f_sports  uuid; f_digital uuid;
  f_art     uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM mall_stores LIMIT 1) THEN
    SELECT id INTO f_tech    FROM mall_floors WHERE sort_order = 1 LIMIT 1;
    SELECT id INTO f_fashion FROM mall_floors WHERE sort_order = 2 LIMIT 1;
    SELECT id INTO f_food    FROM mall_floors WHERE sort_order = 3 LIMIT 1;
    SELECT id INTO f_home    FROM mall_floors WHERE sort_order = 4 LIMIT 1;
    SELECT id INTO f_beauty  FROM mall_floors WHERE sort_order = 5 LIMIT 1;
    SELECT id INTO f_books   FROM mall_floors WHERE sort_order = 6 LIMIT 1;
    SELECT id INTO f_sports  FROM mall_floors WHERE sort_order = 7 LIMIT 1;
    SELECT id INTO f_digital FROM mall_floors WHERE sort_order = 8 LIMIT 1;
    SELECT id INTO f_art     FROM mall_floors WHERE sort_order = 9 LIMIT 1;

    INSERT INTO mall_stores (floor_id, name, name_ar, slug, description, owner_name, contact_email, cover_color, tags, rating, reviews_count, sales_count, products_count, followers_count, is_active, is_featured, is_verified, is_new, status)
    VALUES
      (f_tech,    'TechZone Egypt',   '',  'techzone-egypt',  'Latest electronics, phones, laptops & accessories.',                       'Ahmed Khalil',   'info@techzone.eg',       'blue',    ARRAY['electronics','tech'],       4.8, 234, 1870, 45,  892,  true, true,  true,  false, 'active'),
      (f_fashion, 'FashionHub',       '',  'fashionhub',      'Trendy clothing, shoes & accessories for all occasions.',                  'Sara Mohamed',   'hello@fashionhub.co',    'pink',    ARRAY['fashion','clothes'],        4.6, 189, 2340, 120, 1204, true, true,  true,  false, 'active'),
      (f_food,    'FoodCorner',       '',  'foodcorner',      'Fresh groceries, snacks, beverages & organic products.',                   'Omar Hassan',    'orders@foodcorner.eg',   'emerald', ARRAY['food','organic'],           4.5, 98,  760,  82,  430,  true, false, true,  true,  'active'),
      (f_tech,    'GadgetWorld',      '',  'gadgetworld',     'Smart gadgets, wearables, gaming & PC peripherals.',                      'Karim Nasser',   null,                     'violet',  ARRAY['gadgets','gaming'],         4.7, 156, 1120, 63,  671,  true, false, true,  false, 'active'),
      (f_home,    'HomeStyle',        '',  'homestyle',       'Furniture, décor, kitchen essentials & home improvement.',                 'Nour Ibrahim',   'support@homestyle.eg',   'amber',   ARRAY['furniture','home'],         4.4, 72,  480,  97,  320,  true, false, false, true,  'active'),
      (f_beauty,  'BeautyBox',        '',  'beautybox',       'Skincare, cosmetics, perfumes & wellness products.',                       'Aya Sayed',      'hello@beautybox.eg',     'rose',    ARRAY['beauty','skincare'],        4.9, 301, 2890, 144, 1560, true, true,  true,  false, 'active'),
      (f_books,   'BookNest',         '',  'booknest',        'Arabic & English books, e-books, courses & stationery.',                   'Hassan Ali',     null,                     'blue',    ARRAY['books','education'],        4.6, 88,  640,  280, 390,  true, false, true,  false, 'active'),
      (f_digital, 'KemetRise Store',  '',  'kemetrise-store', 'Official KemetRise software, licences & digital products.',               'KemetRise Team', 'store@kemetrise.com',    'amber',   ARRAY['software','erp'],           5.0, 47,  320,  18,  890,  true, true,  true,  false, 'active'),
      (f_sports,  'SportsPro',        '',  'sportspro',       'Premium sports equipment, gym gear & outdoor adventure.',                  'Mostafa Fathi',  'info@sportspro.eg',      'amber',   ARRAY['sports','gym','fitness'],   4.5, 63,  410,  55,  280,  true, false, true,  false, 'active'),
      (f_art,     'ArtisanCraft',     '',  'artisancraft',    'Handmade Egyptian art, pottery, textiles & collectibles.',                 'Mariam Adel',    'hello@artisancraft.eg',  'teal',    ARRAY['art','handcraft','egypt'],  4.8, 44,  190,  38,  210,  true, false, true,  true,  'active');
  END IF;
END $$;

-- ── 6. Seed mall_products ───────────────────────────────────────────────────
DO $$
DECLARE
  s_tech    uuid; s_fashion uuid; s_food  uuid;
  s_beauty  uuid; s_books   uuid; s_kr    uuid;
  s_gadget  uuid; s_sports  uuid; s_art   uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM mall_products LIMIT 1) THEN
    SELECT id INTO s_tech    FROM mall_stores WHERE slug = 'techzone-egypt'  LIMIT 1;
    SELECT id INTO s_fashion FROM mall_stores WHERE slug = 'fashionhub'      LIMIT 1;
    SELECT id INTO s_food    FROM mall_stores WHERE slug = 'foodcorner'      LIMIT 1;
    SELECT id INTO s_beauty  FROM mall_stores WHERE slug = 'beautybox'       LIMIT 1;
    SELECT id INTO s_books   FROM mall_stores WHERE slug = 'booknest'        LIMIT 1;
    SELECT id INTO s_kr      FROM mall_stores WHERE slug = 'kemetrise-store' LIMIT 1;
    SELECT id INTO s_gadget  FROM mall_stores WHERE slug = 'gadgetworld'     LIMIT 1;
    SELECT id INTO s_sports  FROM mall_stores WHERE slug = 'sportspro'       LIMIT 1;
    SELECT id INTO s_art     FROM mall_stores WHERE slug = 'artisancraft'    LIMIT 1;

    IF s_tech IS NOT NULL THEN
      INSERT INTO mall_products (store_id, name, description, category, tags, price_cents, currency, pricing_model, is_digital, is_featured, is_new, is_active, rating, reviews_count, sales_count, meta)
      VALUES
        (s_tech,    'iPhone 16 Pro',           'Latest Apple flagship with A18 Pro chip.',          'Phones & Tablets',   ARRAY['apple','iphone'],     129900, 'USD', 'one_time', false, true,  true,  true, 4.9, 87, 230,  '{}'::jsonb),
        (s_tech,    'MacBook Pro M4',           'Powerhouse laptop for creators & developers.',      'Laptops & PCs',      ARRAY['apple','laptop'],     249900, 'USD', 'one_time', false, true,  true,  true, 4.8, 42, 95,   '{}'::jsonb),
        (s_fashion, 'Egyptian Cotton Thobe',    'Premium Egyptian cotton, traditional cut.',          'Men''s Clothing',    ARRAY['cotton','mens'],      4900,   'USD', 'one_time', false, false, false, true, 4.7, 56, 340,  '{}'::jsonb),
        (s_fashion, 'Silk Evening Dress',       'Luxurious silk dress for special occasions.',        'Women''s Clothing',  ARRAY['silk','women'],       8900,   'USD', 'one_time', false, true,  false, true, 4.6, 91, 180,  '{}'::jsonb),
        (s_food,    'Organic Honey 1kg',        'Pure raw honey from Egyptian apiaries.',             'Organic Products',   ARRAY['honey','organic'],    2500,   'USD', 'one_time', false, false, false, true, 4.9, 34, 520,  '{}'::jsonb),
        (s_beauty,  'Argan Oil Serum',          'Moroccan argan oil anti-aging face serum.',          'Skincare',           ARRAY['argan','serum'],      3500,   'USD', 'one_time', false, true,  false, true, 4.8, 128,890,  '{}'::jsonb),
        (s_books,   'أسرار العقل المفكر',       'كتاب عربي في علم النفس وتطوير التفكير.',           'Non-fiction',        ARRAY['arabic','mindset'],   1500,   'USD', 'one_time', false, false, false, true, 4.5, 67, 430,  '{}'::jsonb),
        (s_kr,      'ERP Enterprise License',   'Full-platform annual licence with support.',         'Software',           ARRAY['erp','licence'],      99900,  'USD', 'annual',   true,  true,  false, true, 5.0, 23, 78,   '{}'::jsonb),
        (s_gadget,  'DJI Mini 4 Pro Drone',     '4K drone with obstacle avoidance & 34-min flight.', 'Gadgets',            ARRAY['drone','dji'],        75900,  'USD', 'one_time', false, true,  true,  true, 4.7, 19, 45,   '{}'::jsonb),
        (s_sports,  'Pro Treadmill X5',         'Commercial-grade treadmill, 22km/h max speed.',     'Gym Equipment',      ARRAY['treadmill','gym'],    89900,  'USD', 'one_time', false, false, false, true, 4.6, 31, 62,   '{}'::jsonb),
        (s_art,     'Handmade Pharaonic Vase',  'Hand-painted terracotta vase with pharaonic motifs.','Pottery & Ceramics', ARRAY['pottery','egypt'],    5900,   'USD', 'one_time', false, false, true,  true, 4.8, 12, 28,   '{}'::jsonb);
    END IF;
  END IF;
END $$;
