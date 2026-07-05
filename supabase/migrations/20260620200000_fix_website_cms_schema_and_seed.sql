-- ═══════════════════════════════════════════════════════════════════
--  KemetRise Website CMS — Schema Fix + Full Data Seed
--  Migration: 20260620200000
--  Fixes column mismatches between DB tables and WebsiteManager CMS
--  Seeds all static data from PublicAgents + PublicProjects pages
-- ═══════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. FIX: website_agents
--    Add bilingual + phone columns; keep legacy columns for public pages
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.website_agents
  ADD COLUMN IF NOT EXISTS name_ar      TEXT,
  ADD COLUMN IF NOT EXISTS name_en      TEXT,
  ADD COLUMN IF NOT EXISTS region_ar    TEXT,
  ADD COLUMN IF NOT EXISTS region_en    TEXT,
  ADD COLUMN IF NOT EXISTS country_ar   TEXT,
  ADD COLUMN IF NOT EXISTS country_en   TEXT,
  ADD COLUMN IF NOT EXISTS bio_ar       TEXT,
  ADD COLUMN IF NOT EXISTS bio_en       TEXT,
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS sort_order   INT NOT NULL DEFAULT 0;

-- Migrate any existing rows (legacy columns → new bilingual columns)
UPDATE public.website_agents SET
  name_ar    = COALESCE(name_ar,    name),
  region_ar  = COALESCE(region_ar,  region),
  country_ar = COALESCE(country_ar, country),
  bio_ar     = COALESCE(bio_ar,     coverage_scope),
  email      = COALESCE(email,      contact_email),
  sort_order = COALESCE(NULLIF(sort_order, 0), project_order)
WHERE name_ar IS NULL OR name_ar = '';

-- Fix RLS: add superadmin role
DROP POLICY IF EXISTS "wa_admin_all" ON public.website_agents;
CREATE POLICY "wa_admin_all" ON public.website_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'super_admin', 'manager')
    )
  );

-- Fix public select (show active agents only)
DROP POLICY IF EXISTS "wa_public_select" ON public.website_agents;
CREATE POLICY "wa_public_select" ON public.website_agents FOR SELECT
  USING (is_active = true);

-- ────────────────────────────────────────────────────────────────────
-- 2. FIX: website_projects
--    Add bilingual, status, cover_url, sort_order, is_featured columns
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.website_projects
  ADD COLUMN IF NOT EXISTS title_ar    TEXT,
  ADD COLUMN IF NOT EXISTS title_en    TEXT,
  ADD COLUMN IF NOT EXISTS desc_ar     TEXT,
  ADD COLUMN IF NOT EXISTS desc_en     TEXT,
  ADD COLUMN IF NOT EXISTS sector_ar   TEXT,
  ADD COLUMN IF NOT EXISTS sector_en   TEXT,
  ADD COLUMN IF NOT EXISTS brand       TEXT,
  ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS cover_url   TEXT,
  ADD COLUMN IF NOT EXISTS sort_order  INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing rows
UPDATE public.website_projects SET
  title_ar   = COALESCE(NULLIF(title_ar,''),  title),
  desc_ar    = COALESCE(NULLIF(desc_ar,''),   description),
  sector_ar  = COALESCE(NULLIF(sector_ar,''), sector),
  brand      = COALESCE(NULLIF(brand,''),     brand_name),
  cover_url  = COALESCE(NULLIF(cover_url,''), image_url),
  sort_order = COALESCE(NULLIF(sort_order,0), project_order),
  status     = COALESCE(NULLIF(status,''),    'live')
WHERE title_ar IS NULL OR title_ar = '';

-- Fix RLS
DROP POLICY IF EXISTS "wp_admin_all" ON public.website_projects;
CREATE POLICY "wp_admin_all" ON public.website_projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'super_admin', 'manager')
    )
  );
DROP POLICY IF EXISTS "wp_public_select" ON public.website_projects;
CREATE POLICY "wp_public_select" ON public.website_projects FOR SELECT
  USING (is_active = true);

-- ────────────────────────────────────────────────────────────────────
-- 3. FIX: website_products
--    Add name_en, desc_ar, desc_en, brand, image_url columns
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.website_products
  ADD COLUMN IF NOT EXISTS name_en   TEXT,
  ADD COLUMN IF NOT EXISTS desc_ar   TEXT,
  ADD COLUMN IF NOT EXISTS desc_en   TEXT,
  ADD COLUMN IF NOT EXISTS brand     TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Migrate existing rows
UPDATE public.website_products SET
  name_en  = COALESCE(NULLIF(name_en,''),  name),
  desc_ar  = COALESCE(NULLIF(desc_ar,''),  description_ar),
  desc_en  = COALESCE(NULLIF(desc_en,''),  description)
WHERE name_en IS NULL OR name_en = '';

-- Fix RLS
DROP POLICY IF EXISTS "wprod_admin_all" ON public.website_products;
CREATE POLICY "wprod_admin_all" ON public.website_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'super_admin', 'manager')
    )
  );

-- ────────────────────────────────────────────────────────────────────
-- 4. FIX: website_partners
--    Add bilingual name, desc, website_url, category, sort_order, is_featured
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.website_partners
  ADD COLUMN IF NOT EXISTS name_ar    TEXT,
  ADD COLUMN IF NOT EXISTS name_en    TEXT,
  ADD COLUMN IF NOT EXISTS desc_ar    TEXT,
  ADD COLUMN IF NOT EXISTS desc_en    TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS category   TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing rows
UPDATE public.website_partners SET
  name_ar  = COALESCE(NULLIF(name_ar,''),  partner_name),
  name_en  = COALESCE(NULLIF(name_en,''),  partner_name),
  category = COALESCE(NULLIF(category,''), partner_type)
WHERE name_ar IS NULL OR name_ar = '';

-- Fix RLS
DROP POLICY IF EXISTS "wpart_admin_all" ON public.website_partners;
CREATE POLICY "wpart_admin_all" ON public.website_partners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'super_admin', 'manager')
    )
  );

-- Fix RLS on other website tables
DROP POLICY IF EXISTS "ws_admin_all" ON public.website_services;
CREATE POLICY "ws_admin_all" ON public.website_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'super_admin', 'manager')
    )
  );

-- ────────────────────────────────────────────────────────────────────
-- 5. SEED: website_agents (10 agents)
-- ────────────────────────────────────────────────────────────────────
INSERT INTO public.website_agents
  (id, name, name_ar, name_en, region, region_ar, region_en, country, country_ar, country_en,
   coverage_scope, bio_ar, bio_en, contact_email, email, sort_order, project_order, is_active)
VALUES
  ('aa100000-0000-0000-0000-000000000001',
   'وكالة ليبانو للموضة والأزياء المحتشمة',
   'وكالة ليبانو للموضة والأزياء المحتشمة',
   'Lebanon Agency for Fashion & Modest Styling',
   'الشام','الشام','The Levant','لبنان','لبنان','Lebanon',
   'مسؤولة عن توزيع منتجات For Her في لبنان وإدارة شحنات Just Click Store إلى الأسواق اللبنانية والسورية، بما يشمل إدارة المخزون والتسليم اللوجستي الأخير.',
   'مسؤولة عن توزيع منتجات For Her في لبنان وإدارة شحنات Just Click Store إلى الأسواق اللبنانية والسورية، بما يشمل إدارة المخزون والتسليم اللوجستي الأخير.',
   'Responsible for distributing For Her products in Lebanon and managing Just Click Store shipments to Lebanese and Syrian markets, including inventory management and last-mile logistics.',
   'lebanon@kemetrise.com','lebanon@kemetrise.com', 10, 10, true),

  ('aa100000-0000-0000-0000-000000000002',
   'وكالة الأردن للشراكات التجارية والتوزيع',
   'وكالة الأردن للشراكات التجارية والتوزيع',
   'Jordan Agency for Commercial Partnerships & Distribution',
   'الشام','الشام','The Levant','الأردن','الأردن','Jordan',
   'إدارة شبكة الوكلاء التجاريين في الأردن وتطوير قنوات التوزيع مع التوكيلات التجارية الكبرى وتنسيق الشحن إلى الدول المجاورة.',
   'إدارة شبكة الوكلاء التجاريين في الأردن وتطوير قنوات التوزيع مع التوكيلات التجارية الكبرى وتنسيق الشحن إلى الدول المجاورة.',
   'Managing the commercial agent network in Jordan, developing distribution channels with major commercial agencies, and coordinating shipping to neighboring countries.',
   'jordan@kemetrise.com','jordan@kemetrise.com', 20, 20, true),

  ('aa200000-0000-0000-0000-000000000001',
   'وكالة الإمارات للتكنولوجيا والتجارة الإلكترونية',
   'وكالة الإمارات للتكنولوجيا والتجارة الإلكترونية',
   'UAE Agency for Technology & E-Commerce',
   'الخليج','الخليج','The GCC','الإمارات','الإمارات','UAE',
   'إدارة عمليات Just Click Store في منطقة الخليج، وتشغيل منظومة GrowVance الإعلامية، ودعم شبكة الموردين متعددي البائعين في دول مجلس التعاون.',
   'إدارة عمليات Just Click Store في منطقة الخليج، وتشغيل منظومة GrowVance الإعلامية، ودعم شبكة الموردين متعددي البائعين في دول مجلس التعاون.',
   'Managing Just Click Store operations across the Gulf region, operating the GrowVance media ecosystem, and supporting the multi-vendor supplier network across GCC countries.',
   'uae@kemetrise.com','uae@kemetrise.com', 30, 30, true),

  ('aa200000-0000-0000-0000-000000000002',
   'وكالة المملكة العربية السعودية للتحول الرقمي',
   'وكالة المملكة العربية السعودية للتحول الرقمي',
   'Saudi Arabia Agency for Digital Transformation',
   'الخليج','الخليج','The GCC','السعودية','السعودية','Saudi Arabia',
   'مسؤولة عن توسع Agentic في السوق السعودي وبناء منظومة التجارة الإلكترونية متعددة البائعين والتكامل مع بوابات الدفع المحلية ومنصة تحيا.',
   'مسؤولة عن توسع Agentic في السوق السعودي وبناء منظومة التجارة الإلكترونية متعددة البائعين والتكامل مع بوابات الدفع المحلية ومنصة تحيا.',
   'Responsible for Agentic''s expansion in the Saudi market, building the multi-vendor e-commerce ecosystem, and integrating with local payment gateways and the Tahya platform.',
   'ksa@kemetrise.com','ksa@kemetrise.com', 40, 40, true),

  ('aa300000-0000-0000-0000-000000000001',
   'وكالة برلين للإعلام والترخيص الإبداعي',
   'وكالة برلين للإعلام والترخيص الإبداعي',
   'Berlin Agency for Media & Creative Licensing',
   'أوروبا','أوروبا','Europe','ألمانيا','ألمانيا','Germany',
   'إدارة توزيع المحتوى الإبداعي لـ GrowVance في الأسواق الأوروبية وترخيص الأعمال الفنية وعقود الإنتاج المشترك مع شركاء الإنتاج الأوروبيين.',
   'إدارة توزيع المحتوى الإبداعي لـ GrowVance في الأسواق الأوروبية وترخيص الأعمال الفنية وعقود الإنتاج المشترك مع شركاء الإنتاج الأوروبيين.',
   'Managing GrowVance creative content distribution in European markets, licensing artistic works, and co-production agreements with European production partners.',
   'berlin@kemetrise.com','berlin@kemetrise.com', 50, 50, true),

  ('aa300000-0000-0000-0000-000000000002',
   'وكالة باريس للأزياء الراقية والعرض الدولي',
   'وكالة باريس للأزياء الراقية والعرض الدولي',
   'Paris Agency for Haute Couture & International Showcase',
   'أوروبا','أوروبا','Europe','فرنسا','فرنسا','France',
   'شراكات الأزياء الراقية لعلامة For Her وإدارة الحضور الأوروبي في معارض الأزياء الدولية وتنسيق الاستيراد والتصدير عبر الجمارك الأوروبية.',
   'شراكات الأزياء الراقية لعلامة For Her وإدارة الحضور الأوروبي في معارض الأزياء الدولية وتنسيق الاستيراد والتصدير عبر الجمارك الأوروبية.',
   'Haute couture partnerships for For Her brand, managing European presence at international fashion shows, and coordinating import/export through European customs.',
   'paris@kemetrise.com','paris@kemetrise.com', 60, 60, true),

  ('aa400000-0000-0000-0000-000000000001',
   'وكالة كاليفورنيا للذكاء الاصطناعي والبنية التقنية',
   'وكالة كاليفورنيا للذكاء الاصطناعي والبنية التقنية',
   'California Agency for AI & Technical Infrastructure',
   'أمريكا الشمالية','أمريكا الشمالية','North America','الولايات المتحدة','الولايات المتحدة','United States',
   'إدارة منظومة Agentic التقنية على المستوى العالمي وتطوير أطر العمل بالذكاء الاصطناعي وبناء الأنظمة متعددة المستأجرين وإدارة البنية التحتية السحابية.',
   'إدارة منظومة Agentic التقنية على المستوى العالمي وتطوير أطر العمل بالذكاء الاصطناعي وبناء الأنظمة متعددة المستأجرين وإدارة البنية التحتية السحابية.',
   'Managing the Agentic technical ecosystem globally, developing AI frameworks, building multi-tenant systems, and managing cloud infrastructure.',
   'california@kemetrise.com','california@kemetrise.com', 70, 70, true),

  ('aa400000-0000-0000-0000-000000000002',
   'وكالة كندا للتقنية الموزعة وحلول SaaS',
   'وكالة كندا للتقنية الموزعة وحلول SaaS',
   'Canada Agency for Distributed Tech & SaaS Solutions',
   'أمريكا الشمالية','أمريكا الشمالية','North America','كندا','كندا','Canada',
   'دعم البنية التحتية لـ Just Click Store في أمريكا الشمالية وإدارة حلول SaaS للسوق الكندي وتوفير خدمات الدعم الفني والاندماج مع الأنظمة المحلية.',
   'دعم البنية التحتية لـ Just Click Store في أمريكا الشمالية وإدارة حلول SaaS للسوق الكندي وتوفير خدمات الدعم الفني والاندماج مع الأنظمة المحلية.',
   'Supporting Just Click Store infrastructure in North America, managing SaaS solutions for the Canadian market, and providing technical support and local system integration.',
   'canada@kemetrise.com','canada@kemetrise.com', 80, 80, true),

  ('aa500000-0000-0000-0000-000000000001',
   'وكالة القاهرة للتوكيلات التجارية والحوكمة',
   'وكالة القاهرة للتوكيلات التجارية والحوكمة',
   'Cairo Agency for Commercial Agencies & Governance',
   'أفريقيا','أفريقيا','North Africa','مصر','مصر','Egypt',
   'مركز عمليات التوكيلات التجارية الإقليمية في مصر، وإدارة التخليص الجمركي وبناء شبكة الموردين وحوكمة سلسلة الإمداد على المستوى الأفريقي.',
   'مركز عمليات التوكيلات التجارية الإقليمية في مصر، وإدارة التخليص الجمركي وبناء شبكة الموردين وحوكمة سلسلة الإمداد على المستوى الأفريقي.',
   'The regional commercial agencies operations center in Egypt, managing customs clearance, building supplier networks, and supply chain governance at the African level.',
   'cairo@kemetrise.com','cairo@kemetrise.com', 90, 90, true),

  ('aa500000-0000-0000-0000-000000000002',
   'وكالة الدار البيضاء للإعلام وتوزيع المحتوى',
   'وكالة الدار البيضاء للإعلام وتوزيع المحتوى',
   'Casablanca Agency for Media & Content Distribution',
   'أفريقيا','أفريقيا','North Africa','المغرب','المغرب','Morocco',
   'توزيع محتوى GrowVance في منطقة المغرب العربي والشراكات مع قنوات الإعلام المحلية ومنصات البث الرقمي والمشاركة في معارض الإعلام الإقليمية.',
   'توزيع محتوى GrowVance في منطقة المغرب العربي والشراكات مع قنوات الإعلام المحلية ومنصات البث الرقمي والمشاركة في معارض الإعلام الإقليمية.',
   'Distributing GrowVance content across the Maghreb region, partnering with local media channels and digital streaming platforms, and participating in regional media exhibitions.',
   'morocco@kemetrise.com','morocco@kemetrise.com', 100, 100, true)

ON CONFLICT (id) DO UPDATE SET
  name_ar    = EXCLUDED.name_ar,
  name_en    = EXCLUDED.name_en,
  region_ar  = EXCLUDED.region_ar,
  region_en  = EXCLUDED.region_en,
  country_ar = EXCLUDED.country_ar,
  country_en = EXCLUDED.country_en,
  bio_ar     = EXCLUDED.bio_ar,
  bio_en     = EXCLUDED.bio_en,
  email      = EXCLUDED.email,
  sort_order = EXCLUDED.sort_order,
  is_active  = EXCLUDED.is_active;

-- ────────────────────────────────────────────────────────────────────
-- 6. SEED: website_projects (18 projects)
-- ────────────────────────────────────────────────────────────────────
INSERT INTO public.website_projects
  (id, title, title_ar, title_en, brand_name, brand, sector, sector_ar, sector_en,
   execution_type, status, description, desc_ar, desc_en,
   image_url, cover_url, project_order, sort_order, is_active, is_featured)
VALUES
  -- FOR HER
  ('e1001000-0000-0000-0000-000000000001',
   'نظام إدارة مجموعات الأزياء المحتشمة',
   'نظام إدارة مجموعات الأزياء المحتشمة',
   'Modest Fashion Collections Management System',
   'For Her','For Her','Fashion & Modest Styling','الأزياء المحتشمة','Fashion & Modest Styling',
   'Hybrid','live',
   'نظام متكامل لإدارة مجموعات الأزياء المحتشمة يشمل إدارة المخزون بالمقاسات والألوان، تصنيف القطع الفنية، ونشر الكتالوجات تلقائياً.',
   'نظام متكامل لإدارة مجموعات الأزياء المحتشمة يشمل إدارة المخزون بالمقاسات والألوان، تصنيف القطع الفنية، ونشر الكتالوجات تلقائياً.',
   'A complete system for managing modest fashion collections including size/color inventory management, artistic piece classification, and automated catalog publishing.',
   null,null, 10,10, true,false),

  ('e1001000-0000-0000-0000-000000000002',
   'مساعد التنسيق الأزيائي بالذكاء الاصطناعي',
   'مساعد التنسيق الأزيائي بالذكاء الاصطناعي',
   'AI Fashion Styling Assistant',
   'For Her','For Her','AI Styling','تنسيق ذكي','AI Styling',
   'AI Agents','live',
   'وكيل ذكاء اصطناعي مخصص يقدم توصيات تنسيق الأزياء بناءً على تفضيلات العميلة والمناسبة ومتطلبات اللباس المحتشم.',
   'وكيل ذكاء اصطناعي مخصص يقدم توصيات تنسيق الأزياء بناءً على تفضيلات العميلة والمناسبة ومتطلبات اللباس المحتشم.',
   'A custom AI agent providing outfit coordination recommendations based on client preferences, occasion, and modest dress requirements.',
   null,null, 20,20, true,true),

  ('e1001000-0000-0000-0000-000000000003',
   'دليل المقاسات الديناميكي والذكي',
   'دليل المقاسات الديناميكي والذكي',
   'Smart Dynamic Size Guide',
   'For Her','For Her','Fashion & Modest Styling','الأزياء المحتشمة','Fashion & Modest Styling',
   'Technical Infrastructure','live',
   'أداة تفاعلية ذكية لتوجيه العميلات نحو المقاس الأنسب وفق قياساتهن الحقيقية، مما يقلل معدل الإرجاع بنسبة تصل إلى 60%.',
   'أداة تفاعلية ذكية لتوجيه العميلات نحو المقاس الأنسب وفق قياساتهن الحقيقية، مما يقلل معدل الإرجاع بنسبة تصل إلى 60%.',
   'An intelligent interactive tool guiding customers to the best fit based on their actual measurements, reducing return rates by up to 60%.',
   null,null, 30,30, true,false),

  -- JUST CLICK STORE
  ('e1002000-0000-0000-0000-000000000001',
   'منصة التجزئة متعددة البائعين',
   'منصة التجزئة متعددة البائعين',
   'Multi-Vendor Retail Platform',
   'Just Click Store','Just Click Store','E-commerce & Smart Logistics','التجارة الإلكترونية','E-commerce & Smart Logistics',
   'Technical Infrastructure','live',
   'متجر تجزئة مركزي يجمع شبكة موردين متعددين في واجهة عرض موحدة مع نظام إدارة المخزون الآني والتسعير التنافسي.',
   'متجر تجزئة مركزي يجمع شبكة موردين متعددين في واجهة عرض موحدة مع نظام إدارة المخزون الآني والتسعير التنافسي.',
   'A centralized retail store aggregating multiple suppliers in a unified display with real-time inventory management and competitive pricing.',
   null,null, 40,40, true,true),

  ('e1002000-0000-0000-0000-000000000002',
   'محرك الشحن والتسليم الآلي',
   'محرك الشحن والتسليم الآلي',
   'Automated Shipping & Delivery Engine',
   'Just Click Store','Just Click Store','E-commerce & Smart Logistics','التجارة الإلكترونية','E-commerce & Smart Logistics',
   'AI Agents','live',
   'نظام ربط آلي متكامل مع شركات الشحن عبر Webhooks، يُنشئ بوليصات الشحن فور تأكيد الطلب ويتتبع الشحنات في الوقت الفعلي.',
   'نظام ربط آلي متكامل مع شركات الشحن عبر Webhooks، يُنشئ بوليصات الشحن فور تأكيد الطلب ويتتبع الشحنات في الوقت الفعلي.',
   'An automated integration system with shipping companies via Webhooks, generating shipping labels upon order confirmation and tracking shipments in real time.',
   null,null, 50,50, true,false),

  ('e1002000-0000-0000-0000-000000000003',
   'بوابة إدارة شبكة الموردين',
   'بوابة إدارة شبكة الموردين',
   'Supplier Network Management Portal',
   'Just Click Store','Just Click Store','Supply Chain','سلسلة الإمداد','Supply Chain',
   'Hybrid','live',
   'بوابة موردين متكاملة لرفع المنتجات والفواتير وتتبع الطلبات وإدارة العقود مع آليات تقييم الأداء وضمان الجودة.',
   'بوابة موردين متكاملة لرفع المنتجات والفواتير وتتبع الطلبات وإدارة العقود مع آليات تقييم الأداء وضمان الجودة.',
   'An integrated supplier portal for uploading products and invoices, tracking orders and managing contracts with performance evaluation and quality assurance.',
   null,null, 60,60, true,false),

  -- YOUKA'S CORE
  ('e1003000-0000-0000-0000-000000000001',
   'مسرّع الشركات الناشئة المتكامل',
   'مسرّع الشركات الناشئة المتكامل',
   'Integrated Startup Accelerator',
   'Youka''s Core','Youka''s Core','Business Incubators & Marketing Hub','حاضنات الأعمال','Business Incubators & Marketing Hub',
   'Hybrid','live',
   'برنامج تسريع شامل للشركات الناشئة يشمل التقييم المبدئي والتوجيه الاستراتيجي وربط المشاريع بالممولين إلى جانب الدعم القانوني والمحاسبي.',
   'برنامج تسريع شامل للشركات الناشئة يشمل التقييم المبدئي والتوجيه الاستراتيجي وربط المشاريع بالممولين إلى جانب الدعم القانوني والمحاسبي.',
   'A comprehensive startup acceleration program including initial assessment, strategic mentoring, connecting projects with investors, along with legal and accounting support.',
   null,null, 70,70, true,false),

  ('e1003000-0000-0000-0000-000000000002',
   'منظومة تتبع دعوات HR Hub',
   'منظومة تتبع دعوات HR Hub',
   'HR Hub Invitation Tracking System',
   'Youka''s Core','Youka''s Core','HR Management','إدارة الموارد البشرية','HR Management',
   'Technical Infrastructure','live',
   'نظام رقمي متكامل لإدارة وتتبع دعوات الانضمام لبوابة الموارد البشرية يشمل رموز الدعوة المخصصة ولوحات التتبع التفاعلية.',
   'نظام رقمي متكامل لإدارة وتتبع دعوات الانضمام لبوابة الموارد البشرية يشمل رموز الدعوة المخصصة ولوحات التتبع التفاعلية.',
   'An integrated digital system for managing and tracking HR portal join invitations, including custom invitation codes and interactive tracking dashboards.',
   null,null, 80,80, true,false),

  ('e1003000-0000-0000-0000-000000000003',
   'مركز المنهجيات التسويقية الذكي',
   'مركز المنهجيات التسويقية الذكي',
   'Smart Marketing Methodologies Hub',
   'Youka''s Core','Youka''s Core','Marketing Hub','محور التسويق','Marketing Hub',
   'Hybrid','live',
   'منصة تعليمية وتطبيقية للمنهجيات التسويقية الحديثة تدمج خطط التسويق المخصصة وتحليلات الأداء وأدوات إنشاء المحتوى.',
   'منصة تعليمية وتطبيقية للمنهجيات التسويقية الحديثة تدمج خطط التسويق المخصصة وتحليلات الأداء وأدوات إنشاء المحتوى.',
   'An educational and practical platform for modern marketing methodologies integrating customized marketing plans, performance analytics, and content creation tools.',
   null,null, 90,90, true,false),

  -- GROWVANCE
  ('e1004000-0000-0000-0000-000000000001',
   'منصة سير عمل الإنتاج الإعلامي',
   'منصة سير عمل الإنتاج الإعلامي',
   'Media Production Workflow Platform',
   'GrowVance','GrowVance','Media, Production & Arts Distribution','الإعلام والإنتاج','Media, Production & Arts Distribution',
   'Technical Infrastructure','live',
   'نظام إدارة مشاريع الإنتاج الإعلامي من الفكرة حتى التوزيع يشمل جدولة التصوير وإدارة فريق الإنتاج ومراحل المراجعة والاعتماد.',
   'نظام إدارة مشاريع الإنتاج الإعلامي من الفكرة حتى التوزيع يشمل جدولة التصوير وإدارة فريق الإنتاج ومراحل المراجعة والاعتماد.',
   'A media production project management system from concept to distribution, including shooting schedules, production team management, and review/approval stages.',
   null,null, 100,100, true,false),

  ('e1004000-0000-0000-0000-000000000002',
   'نظام إدارة التراخيص والحقوق الإعلامية',
   'نظام إدارة التراخيص والحقوق الإعلامية',
   'Media Licensing & Rights Management System',
   'GrowVance','GrowVance','Media Licensing','ترخيص إعلامي','Media Licensing',
   'Hybrid','live',
   'منظومة متكاملة لإدارة حقوق الملكية الفكرية والتراخيص الإعلامية تشمل تسجيل الأعمال وعقود التوزيع وتتبع الاستخدام وجمع المستحقات المالية.',
   'منظومة متكاملة لإدارة حقوق الملكية الفكرية والتراخيص الإعلامية تشمل تسجيل الأعمال وعقود التوزيع وتتبع الاستخدام وجمع المستحقات المالية.',
   'An integrated system for managing intellectual property rights and media licenses, including work registration, distribution contracts, and royalty collection.',
   null,null, 110,110, true,false),

  ('e1004000-0000-0000-0000-000000000003',
   'خط إنتاج الفيديو والمحتوى الصوتي',
   'خط إنتاج الفيديو والمحتوى الصوتي',
   'Video & Audio Content Production Pipeline',
   'GrowVance','GrowVance','Production Pipeline','خط الإنتاج','Production Pipeline',
   'Hybrid','live',
   'خط إنتاج رقمي متكامل يربط فريق الإبداع بأدوات التحرير والمؤثرات البصرية والتوزيع مع نظام مراجعة ذكي يستخدم الذكاء الاصطناعي.',
   'خط إنتاج رقمي متكامل يربط فريق الإبداع بأدوات التحرير والمؤثرات البصرية والتوزيع مع نظام مراجعة ذكي يستخدم الذكاء الاصطناعي.',
   'An integrated digital production pipeline connecting the creative team with editing tools, visual effects, and distribution, with an AI-powered review system.',
   null,null, 120,120, true,false),

  -- AGENTIC
  ('e1005000-0000-0000-0000-000000000001',
   'شبكة وكلاء الذكاء الاصطناعي المخصصة',
   'شبكة وكلاء الذكاء الاصطناعي المخصصة',
   'Custom AI Agents Network',
   'Agentic','Agentic','AI Operations & Digital Labor System','عمليات الذكاء الاصطناعي','AI Operations & Digital Labor System',
   'AI Agents','live',
   'بناء وتشغيل شبكة متكاملة من وكلاء الذكاء الاصطناعي المخصصين لأتمتة العمليات التشغيلية تشمل وكلاء خدمة العملاء والجدولة الذكية.',
   'بناء وتشغيل شبكة متكاملة من وكلاء الذكاء الاصطناعي المخصصين لأتمتة العمليات التشغيلية تشمل وكلاء خدمة العملاء والجدولة الذكية.',
   'Building and operating an integrated network of custom AI agents to automate operational processes, including customer service agents and smart scheduling.',
   null,null, 130,130, true,true),

  ('e1005000-0000-0000-0000-000000000002',
   'محرر خرائط سير العمل التفاعلي',
   'محرر خرائط سير العمل التفاعلي',
   'Interactive Workflow Map Editor',
   'Agentic','Agentic','Workflow Automation','أتمتة المهام','Workflow Automation',
   'AI Agents','live',
   'أداة بصرية متطورة بالسحب والإفلات لتصميم مسارات العمل الآلية تدعم الشروط المنطقية المتقدمة والتكامل الكامل مع n8n.',
   'أداة بصرية متطورة بالسحب والإفلات لتصميم مسارات العمل الآلية تدعم الشروط المنطقية المتقدمة والتكامل الكامل مع n8n.',
   'An advanced drag-and-drop visual tool for designing automated workflows supporting advanced logical conditions and full n8n integration.',
   null,null, 140,140, true,false),

  ('e1005000-0000-0000-0000-000000000003',
   'تنسيق وإدارة شبكات n8n المؤسسية',
   'تنسيق وإدارة شبكات n8n المؤسسية',
   'Enterprise n8n Network Orchestration & Management',
   'Agentic','Agentic','Digital Infrastructure','البنية الرقمية','Digital Infrastructure',
   'Technical Infrastructure','live',
   'تصميم وتشغيل ومراقبة شبكات أتمتة n8n الكاملة للمؤسسات تشمل ربط الأنظمة المختلفة ومعالجة البيانات الضخمة.',
   'تصميم وتشغيل ومراقبة شبكات أتمتة n8n الكاملة للمؤسسات تشمل ربط الأنظمة المختلفة ومعالجة البيانات الضخمة.',
   'Designing, operating, and monitoring complete enterprise n8n automation networks including system integrations and big data processing.',
   null,null, 150,150, true,false),

  -- COMMERCIAL AGENCIES
  ('e1006000-0000-0000-0000-000000000001',
   'نظام حوكمة عقود التوكيلات التجارية',
   'نظام حوكمة عقود التوكيلات التجارية',
   'Commercial Agency Contract Governance System',
   'Commercial Agencies','Commercial Agencies','Contract Governance','حوكمة العقود','Contract Governance',
   'Technical Infrastructure','live',
   'منظومة قانونية تقنية متكاملة لإدارة عقود التوكيلات التجارية متعددة المستأجرين تشمل إنشاء العقود الرقمية والتوقيع الإلكتروني.',
   'منظومة قانونية تقنية متكاملة لإدارة عقود التوكيلات التجارية متعددة المستأجرين تشمل إنشاء العقود الرقمية والتوقيع الإلكتروني.',
   'An integrated legal-tech system for managing multi-tenant commercial agency contracts, including digital contract creation and electronic signatures.',
   null,null, 160,160, true,false),

  ('e1006000-0000-0000-0000-000000000002',
   'منصة شبكة الموردين الدوليين',
   'منصة شبكة الموردين الدوليين',
   'International Supplier Network Platform',
   'Commercial Agencies','Commercial Agencies','International Trade','التجارة الدولية','International Trade',
   'Hybrid','live',
   'منصة ربط احترافية بين الموردين الدوليين والسوق المحلية تشمل إجراءات التخليص الجمركي الرقمي وإدارة الفواتير الدولية.',
   'منصة ربط احترافية بين الموردين الدوليين والسوق المحلية تشمل إجراءات التخليص الجمركي الرقمي وإدارة الفواتير الدولية.',
   'A professional platform connecting international suppliers with the local market, including digital customs clearance and international invoice management.',
   null,null, 170,170, true,false),

  ('e1006000-0000-0000-0000-000000000003',
   'نظام التوزيع اللوجستي العالمي',
   'نظام التوزيع اللوجستي العالمي',
   'Global Logistics Distribution System',
   'Commercial Agencies','Commercial Agencies','Global Logistics','لوجستيات عالمية','Global Logistics',
   'Hybrid','live',
   'شبكة توزيع عالمية متكاملة تدعم التخطيط اللوجستي المتقدم وإدارة المستودعات الموزعة وتحسين مسارات الشحن.',
   'شبكة توزيع عالمية متكاملة تدعم التخطيط اللوجستي المتقدم وإدارة المستودعات الموزعة وتحسين مسارات الشحن.',
   'An integrated global distribution network supporting advanced logistics planning, distributed warehouse management, and shipping route optimization.',
   null,null, 180,180, true,false)

ON CONFLICT (id) DO UPDATE SET
  title_ar   = EXCLUDED.title_ar,
  title_en   = EXCLUDED.title_en,
  brand      = EXCLUDED.brand,
  sector_ar  = EXCLUDED.sector_ar,
  sector_en  = EXCLUDED.sector_en,
  desc_ar    = EXCLUDED.desc_ar,
  desc_en    = EXCLUDED.desc_en,
  sort_order = EXCLUDED.sort_order,
  is_active  = EXCLUDED.is_active,
  status     = EXCLUDED.status;
