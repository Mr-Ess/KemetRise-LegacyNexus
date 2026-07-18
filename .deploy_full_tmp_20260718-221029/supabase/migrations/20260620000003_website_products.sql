-- ══════════════════════════════════════════════════════════════════
--  website_products  — Public product & service catalog
--  Mirrors the ALL_ITEMS data in PublicProducts.tsx so the content
--  can be managed from the admin panel without code changes.
-- ══════════════════════════════════════════════════════════════════

-- 1. TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_products (
  id                  TEXT         PRIMARY KEY,
  type                TEXT         NOT NULL
                        CHECK (type IN ('digital','physical','virtual','service','subscription')),
  category            TEXT         NOT NULL,
  category_ar         TEXT         NOT NULL,
  sub_category        TEXT,
  sub_category_ar     TEXT,
  name                TEXT         NOT NULL,
  name_ar             TEXT         NOT NULL,
  description         TEXT         NOT NULL DEFAULT '',
  description_ar      TEXT         NOT NULL DEFAULT '',
  price_cents         INTEGER,
  compare_price_cents INTEGER,
  pricing_model       TEXT         CHECK (pricing_model IN ('monthly','annual','one_time')),
  icon                TEXT         NOT NULL DEFAULT '📦',
  color               TEXT         NOT NULL DEFAULT '#94a3b8',
  rating              NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  reviews_count       INTEGER      NOT NULL DEFAULT 0,
  is_featured         BOOLEAN      NOT NULL DEFAULT false,
  is_new              BOOLEAN      NOT NULL DEFAULT false,
  is_active           BOOLEAN      NOT NULL DEFAULT true,
  sort_order          INTEGER      NOT NULL DEFAULT 0,
  features            TEXT[]       NOT NULL DEFAULT '{}',
  features_ar         TEXT[]       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. INDEXES ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wp_type       ON public.website_products (type);
CREATE INDEX IF NOT EXISTS idx_wp_active     ON public.website_products (is_active);
CREATE INDEX IF NOT EXISTS idx_wp_sort       ON public.website_products (sort_order);
CREATE INDEX IF NOT EXISTS idx_wp_featured   ON public.website_products (is_featured) WHERE is_featured = true;

-- 3. UPDATED_AT TRIGGER ────────────────────────────────────────────
-- Reuse function from website_services migration if it exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_website_products_updated_at ON public.website_products;
CREATE TRIGGER trg_website_products_updated_at
  BEFORE UPDATE ON public.website_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. RLS ───────────────────────────────────────────────────────────
ALTER TABLE public.website_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wp_public_select"  ON public.website_products;
DROP POLICY IF EXISTS "wp_admin_all"      ON public.website_products;

-- Anyone can read active products
CREATE POLICY "wp_public_select" ON public.website_products
  FOR SELECT USING (is_active = true);

-- Admins can do everything (including inactive)
CREATE POLICY "wp_admin_all" ON public.website_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','manager')
    )
  );

-- 5. SEED DATA ─────────────────────────────────────────────────────
-- Uses ON CONFLICT DO UPDATE so the migration is idempotent.

INSERT INTO public.website_products (
  id, type, category, category_ar, sub_category, sub_category_ar,
  name, name_ar, description, description_ar,
  price_cents, compare_price_cents, pricing_model,
  icon, color, rating, reviews_count,
  is_featured, is_new, is_active, sort_order,
  features, features_ar
) VALUES

-- ── DIGITAL › Software ────────────────────────────────────────────
('d1','digital','Software','برمجيات','ERP','ERP والمالية',
 'Enterprise ERP License','رخصة ERP المؤسسي',
 'Full ERP: finance, HR, inventory, CRM & analytics.',
 'ERP كامل: مالية، موارد بشرية، مخزون، CRM وتحليلات.',
 99900,NULL,'annual','⚡','#f59e0b',4.9,128,true,false,true,1,
 ARRAY['Finance Module','HR & Payroll','Inventory & WMS','CRM Pipeline','Advanced Reports','Multi-branch'],
 ARRAY['وحدة المالية','الموارد البشرية والرواتب','المخزون والمستودعات','خط CRM','تقارير متقدمة','متعدد الفروع']),

('d3','digital','Software','برمجيات','HR','موارد بشرية',
 'HR & Attendance Module','وحدة الموارد البشرية والحضور',
 'QR biometric attendance, payroll, leave & shifts.',
 'حضور QR البيومتري، رواتب، إجازات وورديات.',
 29900,39900,'annual','👥','#8b5cf6',4.7,74,false,false,true,2,
 ARRAY['QR Attendance','Payroll Processing','Leave Management','Shift Scheduling','Employee Portal','Payslips'],
 ARRAY['حضور QR','معالجة الرواتب','إدارة الإجازات','جدولة الورديات','بوابة الموظفين','قسائم الرواتب']),

('d9','digital','Software','برمجيات','Inventory','مخزون ومستودعات',
 'Inventory & Warehouse Module','وحدة المخزون والمستودع',
 'SKU management, barcode, low-stock alerts & multi-location.',
 'إدارة SKU، باركود، تنبيهات وتتبع متعدد.',
 34900,NULL,'annual','📦','#6366f1',4.5,57,false,false,true,3,
 ARRAY['SKU Management','Barcode Scanning','Low-stock Alerts','Multi-location','Transfer Orders','Inventory Reports'],
 ARRAY['إدارة SKU','مسح الباركود','تنبيهات المخزون','متعدد المواقع','أوامر التحويل','تقارير المخزون']),

('d12','digital','Software','برمجيات','E-Commerce','تجارة إلكترونية',
 'E-commerce Storefront','واجهة المتجر الإلكتروني',
 'Full online store: catalog, payment, orders & shipping.',
 'متجر إلكتروني كامل: كتالوج، دفع، طلبات وشحن.',
 44900,NULL,'annual','🛍️','#22c55e',4.7,94,false,false,true,4,
 ARRAY['Product Catalog','Payment Gateway','Order Management','Shipping Integration','Coupon System','Analytics'],
 ARRAY['كتالوج المنتجات','بوابة الدفع','إدارة الطلبات','تكامل الشحن','نظام الكوبونات','التحليلات']),

-- ── DIGITAL › AI ──────────────────────────────────────────────────
('d2','digital','AI','ذكاء اصطناعي','Agents','وكلاء AI',
 'AI Agent Pack - 10 Agents','حزمة وكلاء AI — 10 وكلاء',
 'Deploy 10 custom AI agents powered by GPT-4.',
 'نشر 10 وكلاء AI مخصصين مدعومين بـ GPT-4.',
 49900,NULL,'annual','🤖','#06b6d4',4.8,89,false,true,true,5,
 ARRAY['10 AI Agents','Custom Training','Arabic + English','Chat & Voice','Analytics Dashboard','API Integration'],
 ARRAY['10 وكيل AI','تدريب مخصص','عربي وإنجليزي','دردشة وصوت','لوحة التحليلات','تكامل API']),

-- ── DIGITAL › Marketing ───────────────────────────────────────────
('d4','digital','Marketing','تسويق','CRM','CRM والعملاء',
 'Marketing Suite','حزمة التسويق',
 'CRM + campaign manager + lead pipeline + ROI analytics.',
 'CRM + مدير حملات + خط عملاء + تحليلات ROI.',
 14900,NULL,'monthly','📣','#ec4899',4.6,52,true,false,true,6,
 ARRAY['CRM System','Email Campaigns','Lead Pipeline','ROI Tracking','Social Scheduling','Automation Rules'],
 ARRAY['نظام CRM','حملات البريد','خط العملاء','تتبع ROI','جدولة السوشيال','قواعد الأتمتة']),

('d10','digital','Marketing','تسويق','Support','دعم العملاء',
 'Live Chat & Support Hub','حزمة الدعم والمحادثة المباشرة',
 'Multi-channel chat, tickets, SLA tracking.',
 'دردشة متعددة القنوات، تذاكر وتتبع SLA.',
 12900,NULL,'monthly','💬','#14b8a6',4.6,65,false,true,true,7,
 ARRAY['Live Chat','Ticket System','SLA Tracking','Multi-channel','Customer Surveys','Reporting'],
 ARRAY['دردشة مباشرة','نظام التذاكر','تتبع SLA','متعدد القنوات','استطلاعات العملاء','التقارير']),

-- ── DIGITAL › Platform ────────────────────────────────────────────
('d5','digital','Platform','المنصة','Sectors','حزم القطاعات',
 'Sector Activation Bundle','حزمة تفعيل القطاعات',
 'Unlock any 5 business sectors.',
 'افتح 5 قطاعات أعمال مخصصة.',
 19900,NULL,'one_time','🏗️','#f97316',4.5,210,true,false,true,8,
 ARRAY['5 Sectors Choice','Custom Modules','Sector Templates','Multi-location','Analytics','Priority Onboarding'],
 ARRAY['اختيار 5 قطاعات','وحدات مخصصة','قوالب القطاعات','متعدد المواقع','التحليلات','إعداد أولوية']),

('d8','digital','Platform','المنصة','Partner','بيئة عمل الشريك',
 'Partner Workspace Licence','رخصة بيئة عمل الشريك',
 'Isolated multi-tenant workspace with revenue sharing.',
 'بيئة عمل معزولة مع تشارك الإيرادات.',
 59900,79900,'annual','🤝','#10b981',4.7,33,true,false,true,9,
 ARRAY['Isolated Workspace','Team Management','Revenue Sharing','Custom Branding','Multi-brand','Partner Reports'],
 ARRAY['بيئة عمل معزولة','إدارة الفريق','تشارك الإيرادات','علامة تجارية مخصصة','متعدد العلامات','التقارير']),

('d11','digital','Platform','المنصة','Branding','العلامة البيضاء',
 'White Label Platform','منصة العلامة البيضاء',
 'Your own branded SaaS with custom domain and colors.',
 'منصة SaaS بعلامتك مع دومين مخصص.',
 149900,NULL,'annual','🎨','#a855f7',4.9,22,true,false,true,10,
 ARRAY['Custom Domain','Full Branding','Logo & Colors','Email Branding','Custom Login','White Label Reports'],
 ARRAY['دومين مخصص','علامة تجارية كاملة','شعار وألوان','بريد ذو علامة','تسجيل دخول مخصص','تقارير بعلامتك']),

-- ── DIGITAL › Tech ────────────────────────────────────────────────
('d6','digital','Tech','تقنية','API','API ومطورين',
 'API Access Token - Unlimited','رمز وصول API — غير محدود',
 'Unlimited REST API, webhooks, sandbox & developer portal.',
 'REST API غير محدود، Webhooks، Sandbox.',
 9900,NULL,'annual','🔑','#3b82f6',4.4,38,false,true,true,11,
 ARRAY['Unlimited API Calls','Webhooks','Sandbox Environment','Developer Portal','SDK Libraries','No Rate Limit'],
 ARRAY['طلبات API غير محدودة','Webhooks','بيئة Sandbox','بوابة المطورين','مكتبات SDK','بدون حد']),

('d7','digital','Tech','تقنية','Security','أمان وامتثال',
 'Security & Compliance Pack','حزمة الأمان والامتثال',
 'RLS, audit logs, IP whitelist, SSO + 2FA.',
 'RLS، سجلات تدقيق، قائمة IP، SSO + 2FA.',
 24900,NULL,'annual','🛡️','#ef4444',4.8,41,false,false,true,12,
 ARRAY['Row Level Security','Audit Logs','IP Whitelisting','SSO Integration','2FA Enforcement','Compliance Reports'],
 ARRAY['أمان RLS','سجلات التدقيق','قائمة IP البيضاء','تكامل SSO','فرض 2FA','تقارير الامتثال']),

-- ── PHYSICAL › Electronics ────────────────────────────────────────
('ph1','physical','Electronics','إلكترونيات','Tablets','أجهزة لوحية',
 'Smart Tablet 10.5 Pro','تابلت ذكي 10.5 بوصة Pro',
 'Octa-core, 6GB RAM, 128GB storage, stylus pen.',
 'ثماني النواة، 6 جيجا، 128 جيجا، قلم.',
 29900,NULL,'one_time','📱','#3b82f6',4.7,156,true,false,true,13,
 ARRAY['Octa-core Chip','6 GB RAM','128 GB Storage','Stylus Pen','10.5 Inch Screen','Fast Charge'],
 ARRAY['شريحة ثماني النواة','6 جيجا RAM','128 جيجا تخزين','قلم تحريري','شاشة 10.5 بوصة','شحن سريع']),

('ph2','physical','Electronics','إلكترونيات','Audio','صوتيات',
 'Wireless Noise-Cancel Headphones','سماعات لاسلكية عازلة للضوضاء',
 '40-hour battery, ANC, premium audio, USB-C.',
 'بطارية 40 ساعة، إلغاء ضوضاء، جودة ممتازة.',
 8900,NULL,'one_time','🎧','#8b5cf6',4.6,89,false,false,true,14,
 ARRAY['40-Hour Battery','Active Noise Cancel','Premium Audio','USB-C Charging','Multi-device Pair','Foldable'],
 ARRAY['بطارية 40 ساعة','إلغاء ضوضاء نشط','صوت ممتاز','شحن USB-C','ربط متعدد','تصميم قابل للطي']),

('ph4','physical','Electronics','إلكترونيات','Peripherals','ملحقات',
 'Wireless Keyboard & Mouse Set','لوحة مفاتيح وفأرة لاسلكية',
 'Multi-device, backlit keys, silent clicks.',
 'ربط متعدد، مفاتيح مضيئة، نقر صامت.',
 4900,NULL,'one_time','⌨️','#06b6d4',4.5,312,false,true,true,15,
 ARRAY['Multi-device Pair','Backlit Keys','Silent Clicks','Bluetooth','18-Month Battery','USB Receiver'],
 ARRAY['ربط متعدد الأجهزة','مفاتيح مضيئة','نقر صامت','بلوتوث','بطارية 18 شهر','مستقبل USB']),

-- ── PHYSICAL › Furniture ──────────────────────────────────────────
('ph3','physical','Furniture','أثاث','Chairs','كراسي',
 'Ergonomic Office Chair','كرسي مكتبي مريح',
 'Lumbar support, adjustable, breathable mesh, 5yr warranty.',
 'دعم قطني، ارتفاع قابل للتعديل، شبكة تنفس.',
 19900,NULL,'one_time','🪑','#f59e0b',4.8,203,false,false,true,16,
 ARRAY['Lumbar Support','Height Adjustable','Breathable Mesh','Armrests','5-Year Warranty','BIFMA Certified'],
 ARRAY['دعم قطني','ارتفاع قابل للتعديل','شبكة تنفس','مسندا الذراعين','ضمان 5 سنوات','شهادة BIFMA']),

-- ── PHYSICAL › Merchandise ────────────────────────────────────────
('ph5','physical','Merchandise','مستلزمات ترويجية','Bundles','حزم',
 'Branded Merchandise Bundle','حزمة المستلزمات الترويجية',
 '50 T-shirts, 50 caps, 100 pens + 2 banners.',
 '50 تيشيرت + 50 قبعة + 100 قلم + 2 لافتة.',
 12900,NULL,'one_time','👕','#10b981',4.7,44,true,false,true,17,
 ARRAY['50 Custom T-shirts','50 Caps','100 Branded Pens','2 Roll-up Banners','Brand Colors','Fast Delivery'],
 ARRAY['50 تيشيرت مخصص','50 قبعة','100 قلم بعلامتك','2 لافتة رول آب','ألوان العلامة','توصيل سريع']),

-- ── PHYSICAL › Equipment ──────────────────────────────────────────
('ph6','physical','Equipment','معدات','POS','نقاط البيع',
 'Barcode Label Printer','طابعة ملصقات باركود صناعية',
 '300 DPI, 150mm/s, USB+Ethernet, ERP-compatible.',
 '300 DPI، سرعة 150mm/ث، متوافق مع ERP.',
 14900,NULL,'one_time','🖨️','#64748b',4.6,65,false,false,true,18,
 ARRAY['300 DPI Resolution','150 mm/s Speed','USB + Ethernet','ERP Compatible','Auto-cutter','1-Year Warranty'],
 ARRAY['دقة 300 DPI','سرعة 150mm/ث','USB وEthernet','متوافق مع ERP','قاطع تلقائي','ضمان سنة']),

-- ── PHYSICAL › Security Hardware ─────────────────────────────────
('ph7','physical','Security Hardware','أجهزة أمان','Cameras','كاميرات',
 'Security Camera Kit (4 Cams)','طقم كاميرات مراقبة (4 كاميرات)',
 '4MP IP, night vision, motion detection, PoE, 2TB HDD.',
 '4 ميجابكسل، رؤية ليلية، كشف حركة، 2 تيرابايت.',
 15900,NULL,'one_time','📷','#374151',4.8,112,false,true,true,19,
 ARRAY['4MP Resolution','Night Vision','Motion Detection','PoE Powered','2TB HDD Included','Remote Viewing'],
 ARRAY['دقة 4 ميجابكسل','رؤية ليلية','كشف الحركة','يعمل بـ PoE','2 تيرابايت مضمنة','مشاهدة عن بعد']),

-- ── VIRTUAL › NFT ─────────────────────────────────────────────────
('v1','virtual','NFT','NFT','Founder','مؤسسون',
 'KemetRise Founder Pass (NFT)','بطاقة المؤسس كيمت رايز (NFT)',
 'Lifetime priority access, governance voting, profit sharing.',
 'وصول أولوية مدى الحياة، تصويت، مشاركة أرباح.',
 49900,NULL,'one_time','🏛️','#d97706',4.9,37,true,false,true,20,
 ARRAY['Lifetime Access','Governance Voting','Profit Sharing','Exclusive Events','Early Features','NFT Certificate'],
 ARRAY['وصول مدى الحياة','تصويت الحوكمة','مشاركة الأرباح','فعاليات حصرية','ميزات مبكرة','شهادة NFT']),

-- ── VIRTUAL › Gift Cards ──────────────────────────────────────────
('v2','virtual','Gift Card','بطاقة هدية','$50','50 دولار',
 'Gift Card - $50','بطاقة هدية — 50 دولار',
 'Redeemable on any product, service, or subscription.',
 'قابلة للاسترداد على أي منتج أو خدمة.',
 5000,NULL,'one_time','🎁','#f43f5e',4.8,290,false,true,true,21,
 ARRAY['$50 Value','Valid 2 Years','All Products','Instant Delivery','Transferable','No Expiry Fees'],
 ARRAY['قيمة 50 دولار','صالحة سنتين','كل المنتجات','توصيل فوري','قابلة للتحويل','بدون رسوم انتهاء']),

('v3','virtual','Gift Card','بطاقة هدية','$100','100 دولار',
 'Gift Card - $100','بطاقة هدية — 100 دولار',
 'Redeemable on any product or service.',
 'قابلة للاسترداد على أي منتج أو خدمة.',
 10000,NULL,'one_time','🎁','#ef4444',4.8,145,false,false,true,22,
 ARRAY['$100 Value','Valid 2 Years','All Products','Instant Delivery','Transferable','Priority Support'],
 ARRAY['قيمة 100 دولار','صالحة سنتين','كل المنتجات','توصيل فوري','قابلة للتحويل','دعم أولوية']),

-- ── VIRTUAL › License Keys ────────────────────────────────────────
('v4','virtual','License Key','مفتاح ترخيص','Enterprise','مؤسسي',
 'Enterprise License Key (1 Year)','مفتاح ترخيص مؤسسي (سنة)',
 'Activate any enterprise module for 12 months.',
 'تفعيل أي وحدة مؤسسية لمدة 12 شهراً.',
 19900,NULL,'annual','🔑','#3b82f6',4.7,88,false,false,true,23,
 ARRAY['12-Month Access','Any Module','Instant Activation','Transfer Once','API Enabled','Email Delivery'],
 ARRAY['وصول 12 شهر','أي وحدة','تفعيل فوري','تحويل مرة','API مفعّل','توصيل بالبريد']),

-- ── VIRTUAL › Digital Art ─────────────────────────────────────────
('v5','virtual','Digital Art','فن رقمي','Collection','مجموعة',
 'Digital Art Collection (10 Pieces)','مجموعة فنون رقمية (10 قطع)',
 'Exclusive Egyptian-themed digital artworks.',
 'أعمال فنية رقمية مصرية حصرية.',
 14900,NULL,'one_time','🎨','#8b5cf6',4.6,43,false,true,true,24,
 ARRAY['10 Original Artworks','High-res Files','Print License','Egyptian Theme','Artist Signed','Certificate'],
 ARRAY['10 أعمال أصلية','ملفات عالية الدقة','رخصة طباعة','موضوع مصري','توقيع الفنان','شهادة أصالة']),

-- ── VIRTUAL › Virtual Real Estate ────────────────────────────────
('v6','virtual','Virtual Real Estate','عقارات افتراضية','Platform Slot','موقع المنصة',
 'Virtual Real Estate - Platform Slot','عقار افتراضي — موقع في المنصة',
 'Own a prime slot in the KemetRise marketplace.',
 'امتلك موقعاً رئيسياً في سوق كيمت رايز.',
 29900,NULL,'annual','🏙️','#10b981',4.8,19,true,false,true,25,
 ARRAY['Prime Location','1-Year Slot','High Visibility','Featured Badge','Analytics Access','Renewable'],
 ARRAY['موقع رئيسي','مكان لمدة سنة','ظهور مرتفع','شارة مميزة','وصول التحليلات','قابل للتجديد']),

-- ── SERVICE › Technology ──────────────────────────────────────────
('s1','service','Technology','تقنية','ERP Systems','أنظمة ERP',
 'ERP Implementation','تطبيق نظام ERP',
 'Full ERP setup, customization, training and go-live support.',
 'تطبيق ERP كامل، تخصيص، تدريب ودعم الإطلاق.',
 NULL,NULL,NULL,'⚡','#f59e0b',4.9,64,false,false,true,26,
 ARRAY['Needs Analysis','System Config','Data Migration','Staff Training','Go-live Support','3-Month Post Support'],
 ARRAY['تحليل الاحتياجات','ضبط النظام','ترحيل البيانات','تدريب الموظفين','دعم الإطلاق','دعم 3 أشهر بعد']),

('s2','service','Technology','تقنية','Software Dev','تطوير البرمجيات',
 'Mobile App Development','تطوير تطبيق موبايل',
 'iOS & Android custom apps tailored to your brand.',
 'تطبيقات iOS وAndroid مخصصة لعلامتك.',
 NULL,NULL,NULL,'📱','#8b5cf6',4.8,55,false,false,true,27,
 ARRAY['iOS + Android','Custom UI/UX','Backend API','Push Notifications','App Store Publish','3-Month Support'],
 ARRAY['iOS وAndroid','واجهة مخصصة','Backend API','الإشعارات','نشر في المتاجر','دعم 3 أشهر']),

('s3','service','Technology','تقنية','Software Dev','تطوير البرمجيات',
 'Web & PWA Development','تطوير مواقع وتطبيقات PWA',
 'Fast, SEO-ready websites and progressive web apps.',
 'مواقع سريعة جاهزة للـ SEO وتطبيقات PWA.',
 NULL,NULL,NULL,'🌐','#06b6d4',4.7,78,false,false,true,28,
 ARRAY['Custom Design','SEO Optimized','PWA Ready','CMS Integration','Multi-language','Performance 95+'],
 ARRAY['تصميم مخصص','محسن للـ SEO','جاهز كـ PWA','تكامل CMS','متعدد اللغات','أداء 95+']),

('s4','service','Technology','تقنية','AI Services','خدمات AI',
 'AI Chatbot & Agent Setup','إعداد روبوت محادثة AI',
 'Custom AI chatbot trained on your data and products.',
 'وكيل AI مدرب على بياناتك ومنتجاتك.',
 NULL,NULL,NULL,'🤖','#06b6d4',4.8,43,false,true,true,29,
 ARRAY['Custom Training','Arabic + English','WhatsApp Integration','Website Widget','Analytics','Monthly Updates'],
 ARRAY['تدريب مخصص','عربي وإنجليزي','تكامل واتساب','ودجت الموقع','التحليلات','تحديثات شهرية']),

('s5','service','Technology','تقنية','Networks','الشبكات',
 'Network Design & Installation','تصميم وتركيب الشبكات',
 'Professional wired & wireless network infrastructure.',
 'بنية تحتية سلكية ولاسلكية احترافية.',
 NULL,NULL,NULL,'🌐','#14b8a6',4.7,39,false,false,true,30,
 ARRAY['Site Survey','Network Design','Equipment Supply','Installation','Configuration','Documentation'],
 ARRAY['مسح الموقع','تصميم الشبكة','توريد المعدات','التركيب','الضبط','التوثيق']),

('s6','service','Technology','تقنية','Cybersecurity','أمان سيبراني',
 'Cybersecurity Assessment','تقييم الأمان السيبراني',
 'Penetration testing, vulnerability assessment & remediation.',
 'اختبار اختراق، تقييم ثغرات ومعالجة.',
 NULL,NULL,NULL,'🛡️','#ef4444',4.9,28,false,false,true,31,
 ARRAY['Pen Testing','Vulnerability Scan','Risk Assessment','Remediation Plan','Compliance Check','Executive Report'],
 ARRAY['اختبار اختراق','مسح الثغرات','تقييم المخاطر','خطة المعالجة','فحص الامتثال','تقرير تنفيذي']),

-- ── SERVICE › Marketing ───────────────────────────────────────────
('s7','service','Marketing','تسويق','Digital Ads','إعلانات رقمية',
 'Digital Advertising Campaigns','الحملات الإعلانية الرقمية',
 'Facebook, Google, TikTok & Instagram ads management.',
 'إدارة إعلانات فيسبوك، جوجل، تيك توك وإنستقرام.',
 NULL,NULL,NULL,'📣','#ec4899',4.7,92,true,false,true,32,
 ARRAY['Multi-Platform Ads','Audience Targeting','Creative Design','A/B Testing','ROI Reporting','Monthly Optimization'],
 ARRAY['إعلانات متعددة المنصات','استهداف الجمهور','تصميم إبداعي','اختبار A/B','تقارير ROI','تحسين شهري']),

('s8','service','Marketing','تسويق','Content','إنتاج محتوى',
 'Social Media Content Production','إنتاج محتوى السوشيال ميديا',
 '30 posts/month: photography, copywriting & scheduling.',
 '30 منشور شهرياً: تصوير، كتابة وجدولة.',
 NULL,NULL,NULL,'📸','#f43f5e',4.6,67,false,false,true,33,
 ARRAY['30 Posts/Month','Professional Photos','Copywriting','Hashtag Strategy','Scheduling','Performance Report'],
 ARRAY['30 منشور شهرياً','تصوير احترافي','كتابة المحتوى','استراتيجية الهاشتاج','الجدولة','تقرير الأداء']),

('s9','service','Marketing','تسويق','SEO','تحسين محركات البحث',
 'SEO & Search Optimization','تحسين محركات البحث SEO',
 'On-page & off-page SEO + content strategy.',
 'SEO داخلي وخارجي + استراتيجية محتوى.',
 NULL,NULL,NULL,'🔍','#3b82f6',4.8,51,false,false,true,34,
 ARRAY['Technical SEO Audit','Keyword Research','On-page Optimization','Link Building','Local SEO','Monthly Reports'],
 ARRAY['مراجعة SEO التقني','بحث الكلمات المفتاحية','تحسين داخلي','بناء الروابط','SEO المحلي','تقارير شهرية']),

-- ── SERVICE › Business ────────────────────────────────────────────
('s10','service','Business','أعمال','Trade Agency','توكيلات تجارية',
 'Commercial Agency Representation','التمثيل التجاري والتوكيلات',
 'Exclusive distribution & representation contracts in Egypt.',
 'عقود توزيع وتمثيل حصرية في مصر.',
 NULL,NULL,NULL,'🤝','#10b981',4.8,34,true,false,true,35,
 ARRAY['Market Research','Legal Contracts','Distribution Network','Import Licensing','After-sale Support','Reports'],
 ARRAY['بحث السوق','العقود القانونية','شبكة التوزيع','ترخيص الاستيراد','دعم ما بعد البيع','التقارير']),

('s11','service','Business','أعمال','Logistics','لوجستيك',
 'Import & Export Logistics','لوجستيك الاستيراد والتصدير',
 'Full logistics: customs clearance, freight & last-mile.',
 'لوجستيك كامل: تخليص جمركي، شحن وتوصيل.',
 NULL,NULL,NULL,'🚢','#0ea5e9',4.7,48,false,false,true,36,
 ARRAY['Customs Clearance','Sea & Air Freight','Warehouse Storage','Last-mile Delivery','Documentation','Insurance'],
 ARRAY['تخليص جمركي','شحن بحري وجوي','تخزين','التوصيل الأخير','الوثائق','التأمين']),

('s12','service','Business','أعمال','Finance','خدمات مالية',
 'Financial Consulting & Reporting','الاستشارات والتقارير المالية',
 'Financial analysis, reports, tax & compliance advisory.',
 'تحليل مالي، تقارير، ضرائب واستشارات.',
 NULL,NULL,NULL,'📊','#6366f1',4.9,57,false,false,true,37,
 ARRAY['Financial Analysis','P&L Reporting','Tax Advisory','Budget Planning','Audit Prep','Cash Flow Mgmt'],
 ARRAY['التحليل المالي','تقارير الربح والخسارة','استشارات ضريبية','تخطيط الميزانية','إعداد التدقيق','إدارة التدفق']),

-- ── SERVICE › Media ───────────────────────────────────────────────
('s13','service','Media','إنتاج إعلامي','Video','إنتاج فيديو',
 'Video Production & TV Commercials','إنتاج الفيديو والإعلانات التلفزيونية',
 'Professional video for ads, corporate & social.',
 'إنتاج فيديو احترافي للإعلانات والمؤسسات.',
 NULL,NULL,NULL,'🎬','#ec4899',4.8,43,false,false,true,38,
 ARRAY['Script Writing','Professional Filming','Motion Graphics','Voice Over','Color Grading','4K Output'],
 ARRAY['كتابة السيناريو','تصوير احترافي','رسومات متحركة','تعليق صوتي','تدرج الألوان','إخراج 4K']),

('s14','service','Media','إنتاج إعلامي','Design','تصميم',
 'Visual Identity & Branding','الهوية البصرية والعلامة التجارية',
 'Complete brand identity: logo, colors, fonts & guidelines.',
 'هوية تجارية كاملة: شعار، ألوان، خطوط ودليل.',
 NULL,NULL,NULL,'🎨','#a855f7',4.9,85,true,false,true,39,
 ARRAY['Logo Design','Color Palette','Typography','Brand Guidelines','Business Cards','Social Templates'],
 ARRAY['تصميم الشعار','لوحة الألوان','الخطوط','دليل العلامة','بطاقات الأعمال','قوالب السوشيال']),

-- ── SERVICE › Training ────────────────────────────────────────────
('s15','service','Training','تدريب','Tech Training','تدريب تقني',
 'Certified Technical Training','التدريب التقني المعتمد',
 'Certified courses: programming, security, networking, cloud.',
 'دورات معتمدة: برمجة، أمان، شبكات وسحاب.',
 NULL,NULL,NULL,'🎓','#22c55e',4.8,120,false,false,true,40,
 ARRAY['Certified Courses','Hands-on Labs','Expert Instructors','On-site or Online','Group Discounts','Post Support'],
 ARRAY['دورات معتمدة','مختبرات عملية','مدربون خبراء','حضوري أو أونلاين','خصومات المجموعات','دعم بعد التدريب']),

-- ── SUBSCRIPTION › Plans ──────────────────────────────────────────
('sub1','subscription','Plans','الباقات','Starter','أساسية',
 'Starter Plan','الباقة الأساسية',
 'Perfect for small businesses just getting started.',
 'مثالية للشركات الصغيرة التي تبدأ رحلتها.',
 1900,NULL,'monthly','🌱','#10b981',4.5,234,false,false,true,41,
 ARRAY['1 User Account','3 Business Sectors','Basic ERP Modules','Email Support','2 GB Storage','Standard Reports'],
 ARRAY['حساب مستخدم واحد','3 قطاعات أعمال','وحدات ERP أساسية','دعم بالبريد','2 جيجا تخزين','تقارير قياسية']),

('sub2','subscription','Plans','الباقات','Business','أعمال',
 'Business Plan','باقة الأعمال',
 'Everything you need to grow and scale your business.',
 'كل ما تحتاجه لنمو وتوسيع أعمالك.',
 7900,NULL,'monthly','🚀','#6366f1',4.8,445,true,false,true,42,
 ARRAY['10 User Accounts','10 Business Sectors','Full ERP Suite','AI Assistant','Priority Support','50 GB Storage','Advanced Analytics','API Access'],
 ARRAY['10 حسابات مستخدمين','10 قطاعات أعمال','مجموعة ERP كاملة','مساعد AI','دعم أولوية','50 جيجا تخزين','تحليلات متقدمة','وصول API']),

('sub3','subscription','Plans','الباقات','Enterprise','مؤسسات',
 'Enterprise Plan','باقة المؤسسات',
 'Unlimited power for large organizations.',
 'قدرة غير محدودة للمنظمات الكبيرة.',
 24900,NULL,'monthly','🏛️','#f59e0b',4.9,188,false,false,true,43,
 ARRAY['Unlimited Users','All Sectors','Custom ERP','Dedicated AI Agents','24/7 Phone Support','Unlimited Storage','Custom BI','Full API','White Label'],
 ARRAY['مستخدمون غير محدودون','كل القطاعات','ERP مخصص','وكلاء AI مخصصون','دعم هاتفي 24/7','تخزين غير محدود','BI مخصص','API كامل','علامة بيضاء'])

ON CONFLICT (id) DO UPDATE SET
  type                = EXCLUDED.type,
  category            = EXCLUDED.category,
  category_ar         = EXCLUDED.category_ar,
  sub_category        = EXCLUDED.sub_category,
  sub_category_ar     = EXCLUDED.sub_category_ar,
  name                = EXCLUDED.name,
  name_ar             = EXCLUDED.name_ar,
  description         = EXCLUDED.description,
  description_ar      = EXCLUDED.description_ar,
  price_cents         = EXCLUDED.price_cents,
  compare_price_cents = EXCLUDED.compare_price_cents,
  pricing_model       = EXCLUDED.pricing_model,
  icon                = EXCLUDED.icon,
  color               = EXCLUDED.color,
  rating              = EXCLUDED.rating,
  reviews_count       = EXCLUDED.reviews_count,
  is_featured         = EXCLUDED.is_featured,
  is_new              = EXCLUDED.is_new,
  sort_order          = EXCLUDED.sort_order,
  features            = EXCLUDED.features,
  features_ar         = EXCLUDED.features_ar,
  updated_at          = now();
