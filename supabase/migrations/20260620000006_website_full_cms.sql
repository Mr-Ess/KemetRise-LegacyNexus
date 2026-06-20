-- ═══════════════════════════════════════════════════════════════════
--  KemetRise Website CMS – Full content tables
--  Migration: 20260620000006
-- ═══════════════════════════════════════════════════════════════════

-- ── website_settings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,
  value_ar    TEXT,
  value_en    TEXT,
  value_json  JSONB,
  category    TEXT DEFAULT 'general',  -- general | nav | footer | contact | seo
  is_active   BOOLEAN DEFAULT TRUE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── website_hero ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_hero (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_ar       TEXT DEFAULT 'منصة الأعمال الرقمية الشاملة',
  badge_en       TEXT DEFAULT 'The Unified Digital Business Platform',
  title_ar       TEXT DEFAULT 'ارتقِ بأعمالك إلى مستوى الحضارة',
  title_en       TEXT DEFAULT 'Elevate Your Business to Civilization Level',
  subtitle_ar    TEXT DEFAULT 'منصة SaaS + ERP متكاملة',
  subtitle_en    TEXT DEFAULT 'Unified SaaS + ERP Platform',
  cta_primary_ar TEXT DEFAULT 'ابدأ الآن',
  cta_primary_en TEXT DEFAULT 'Get Started',
  cta_secondary_ar TEXT DEFAULT 'تعرف على خدماتنا',
  cta_secondary_en TEXT DEFAULT 'Explore Services',
  bg_video_url   TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.website_hero (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- ── website_stats ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_stats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value      TEXT NOT NULL,
  label_ar   TEXT NOT NULL,
  label_en   TEXT NOT NULL,
  icon_name  TEXT DEFAULT 'Globe',
  sort_order INT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE
);
INSERT INTO public.website_stats (value, label_ar, label_en, icon_name, sort_order) VALUES
  ('6',    'علامات تجارية',        'Brand Companies',  'Briefcase', 1),
  ('10+',  'وكيل إقليمي',          'Regional Agents',  'Users',     2),
  ('5',    'مناطق جغرافية',        'Global Regions',   'Globe',     3),
  ('50+',  'خدمة ومنتج رقمي',      'Digital Services', 'Package',   4),
  ('24/7', 'دعم فني متاح',         'Support Coverage', 'Shield',    5),
  ('99%',  'ضمان استمرارية التشغيل','Uptime SLA',       'Zap',       6)
ON CONFLICT DO NOTHING;

-- ── website_features ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar    TEXT NOT NULL,
  title_en    TEXT NOT NULL,
  desc_ar     TEXT,
  desc_en     TEXT,
  icon_name   TEXT DEFAULT 'Zap',
  color       TEXT DEFAULT '#f59e0b',
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE
);
INSERT INTO public.website_features (title_ar, title_en, desc_ar, desc_en, icon_name, color, sort_order) VALUES
  ('ERP متكامل',             'Integrated ERP',        'مالية وموارد بشرية ومخزون في مكان واحد',     'Finance, HR, inventory in one place',        'BarChart3',  '#f59e0b', 1),
  ('وكلاء AI',               'AI Agents',             'أتمتة ذكية لكل عملياتك التجارية',             'Smart automation for all your operations',   'Bot',        '#06b6d4', 2),
  ('تجارة متعددة البائعين',  'Multi-Vendor Commerce', 'سوق إلكتروني متكامل مع إدارة المتجر',         'Full marketplace with store management',      'ShoppingBag','#10b981', 3),
  ('بنية تحتية آمنة',        'Secure Infrastructure', 'تشفير كامل وحماية على مستوى الصف',            'Full encryption and row-level security',      'Shield',     '#ef4444', 4),
  ('تقارير وتحليلات',        'Reports & Analytics',   'لوحات BI تفاعلية ومؤشرات الأداء الرئيسية',    'Interactive BI dashboards and KPI tracking',  'BarChart3',  '#8b5cf6', 5),
  ('شبكة وكلاء عالمية',      'Global Agent Network',  'وكلاء إقليميون في 5 مناطق حول العالم',         'Regional agents across 5 global territories', 'Network',    '#3b82f6', 6)
ON CONFLICT DO NOTHING;

-- ── website_how_it_works ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_how_it_works (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INT NOT NULL,
  title_ar    TEXT NOT NULL,
  title_en    TEXT NOT NULL,
  desc_ar     TEXT,
  desc_en     TEXT,
  icon_name   TEXT DEFAULT 'Circle',
  is_active   BOOLEAN DEFAULT TRUE
);
INSERT INTO public.website_how_it_works (step_number, title_ar, title_en, desc_ar, desc_en, icon_name) VALUES
  (1, 'سجّل حسابك',        'Create Your Account',   'أنشئ حسابك في دقيقة واحدة',           'Sign up in under a minute',               'UserPlus'),
  (2, 'اختر خطتك',         'Choose Your Plan',      'حدد الخطة المناسبة لحجم أعمالك',       'Select the right plan for your business', 'Layers'),
  (3, 'أعدّ بيئة عملك',    'Setup Your Workspace',  'خصّص فريقك وعلامتك التجارية',          'Customize your team and brand',           'Settings2'),
  (4, 'ابدأ النمو',         'Start Growing',         'إطلق عملياتك وراقب نموك لحظة بلحظة',  'Launch operations and track growth live', 'TrendingUp')
ON CONFLICT DO NOTHING;

-- ── website_testimonials ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_testimonials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  role_ar     TEXT,
  role_en     TEXT,
  company     TEXT,
  avatar      TEXT DEFAULT '👤',
  text_ar     TEXT NOT NULL,
  text_en     TEXT NOT NULL,
  rating      INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 0
);
INSERT INTO public.website_testimonials (name_ar, name_en, role_ar, role_en, company, avatar, text_ar, text_en, rating, sort_order) VALUES
  ('سارة المنصوري',  'Sarah Al-Mansouri',  'مديرة عمليات', 'Operations Director', 'Al Nour Group',    '👩',
   'حوّلت KemetRise طريقة إدارة أعمالنا بالكامل. الـ ERP والذكاء الاصطناعي معاً في منصة واحدة يوفران ساعات عمل يومياً.',
   'KemetRise transformed how we run our business. Having ERP and AI together saves us hours every day.', 5, 1),
  ('أحمد الزعبي',   'Ahmed Al-Zuabi',      'مؤسس ومدير',   'Founder & CEO',       'ZeeTech Solutions',  '👨',
   'الدعم الفني ممتاز والمنصة سهلة الاستخدام. نظام الوكلاء الإقليميين ساعدنا في التوسع بشكل كبير.',
   'Outstanding support and easy to use. The regional agents network helped us scale significantly.',  5, 2),
  ('ندى القحطاني',  'Nada Al-Qahtani',    'مديرة تسويق',  'Marketing Director',  'StyleForward Co.',  '👩‍💼',
   'أفضل قرار اتخذناه هو الانضمام لـ KemetRise. منصة For Her بالذكاء الاصطناعي غيّرت تجربتنا مع العملاء.',
   'Best decision we made was joining KemetRise. The For Her AI platform changed our customer experience.', 5, 3),
  ('خالد برهان',    'Khalid Burhan',       'رئيس تقني',     'CTO',                 'GrowVance MENA',    '👨‍💻',
   'البنية التقنية متينة جداً والـ API سهل التكامل. فريق الدعم يتجاوب في دقائق.',
   'Very solid infrastructure and easy API integration. Support team responds within minutes.',           5, 4)
ON CONFLICT DO NOTHING;

-- ── website_faqs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  answer_ar   TEXT NOT NULL,
  answer_en   TEXT NOT NULL,
  category    TEXT DEFAULT 'general',  -- general | pricing | technical | agents
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE
);
INSERT INTO public.website_faqs (question_ar, question_en, answer_ar, answer_en, category, sort_order) VALUES
  ('ما هي KemetRise؟',
   'What is KemetRise?',
   'KemetRise هي منصة SaaS + ERP متكاملة تضم 6 علامات تجارية متخصصة لتغطية كل احتياجات الأعمال الرقمية والمادية.',
   'KemetRise is a unified SaaS + ERP platform with 6 specialized brands covering all digital and physical business needs.',
   'general', 1),
  ('كيف أبدأ استخدام المنصة؟',
   'How do I get started?',
   'سجّل حساباً مجانياً، اختر خطتك أو تواصل معنا لعرض مخصص، وسيتواصل معك فريقنا خلال 24 ساعة.',
   'Create a free account, choose your plan or contact us for a custom quote, and our team will reach out within 24 hours.',
   'general', 2),
  ('هل يمكنني طلب عرض سعر مخصص؟',
   'Can I request a custom quote?',
   'نعم، تواصل مع فريقنا من خلال صفحة التواصل وسنرسل لك عرضاً مفصلاً خلال 48 ساعة عمل.',
   'Yes, contact our team through the Contact page and we will send you a detailed proposal within 48 business hours.',
   'pricing', 3),
  ('ما هي لغات المنصة؟',
   'What languages does the platform support?',
   'المنصة تدعم اللغتين العربية والإنجليزية بشكل كامل مع واجهة RTL للعربية.',
   'The platform fully supports Arabic and English with RTL interface for Arabic.',
   'technical', 4),
  ('هل البيانات آمنة؟',
   'Is our data secure?',
   'نعم، نستخدم تشفير AES-256 ومصادقة ثنائية وأمان على مستوى الصف (RLS) مع Supabase.',
   'Yes, we use AES-256 encryption, two-factor authentication, and Row Level Security (RLS) with Supabase.',
   'technical', 5),
  ('من هم الوكلاء الإقليميون؟',
   'Who are the regional agents?',
   'وكلاؤنا شركاء معتمدون في 5 مناطق (الشام، الخليج، أوروبا، أمريكا الشمالية، شمال أفريقيا) يقدمون الدعم المحلي.',
   'Our agents are certified partners in 5 regions (Levant, GCC, Europe, North America, North Africa) providing local support.',
   'agents', 6)
ON CONFLICT DO NOTHING;

-- ── website_about ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_about (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,   -- mission | vision | values | team_intro | story
  title_ar    TEXT NOT NULL,
  title_en    TEXT NOT NULL,
  content_ar  TEXT,
  content_en  TEXT,
  image_url   TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.website_about (section_key, title_ar, title_en, content_ar, content_en, sort_order) VALUES
  ('mission', 'رسالتنا', 'Our Mission',
   'تمكين الشركات والأفراد من بناء مشاريع رقمية متكاملة باستخدام أحدث تقنيات الذكاء الاصطناعي ومنصات SaaS المتطورة.',
   'Empowering businesses and individuals to build fully integrated digital enterprises using cutting-edge AI and advanced SaaS platforms.',
   1),
  ('vision', 'رؤيتنا', 'Our Vision',
   'أن نكون المنصة الرقمية الأولى في منطقة الشرق الأوسط وشمال أفريقيا وأوروبا لإدارة الأعمال المتكاملة.',
   'To become the leading integrated business platform in the Middle East, North Africa, and Europe.',
   2),
  ('values', 'قيمنا', 'Our Values',
   'الابتكار المستمر، النزاهة في التعامل، الشراكة الحقيقية، والتميز في التنفيذ.',
   'Continuous innovation, integrity in dealings, genuine partnership, and excellence in execution.',
   3),
  ('story', 'قصتنا', 'Our Story',
   'بدأت KemetRise برؤية بسيطة: توحيد كل أدوات الأعمال الرقمية في منصة واحدة. اليوم نمت إلى منظومة من 6 علامات تجارية متخصصة.',
   'KemetRise started with a simple vision: unify all digital business tools in one platform. Today it has grown into an ecosystem of 6 specialized brands.',
   4)
ON CONFLICT DO NOTHING;

-- ── website_news ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_news (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar    TEXT NOT NULL,
  title_en    TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  excerpt_ar  TEXT,
  excerpt_en  TEXT,
  content_ar  TEXT,
  content_en  TEXT,
  cover_url   TEXT,
  category    TEXT DEFAULT 'news',   -- news | blog | announcement | update
  tags        TEXT[] DEFAULT '{}',
  author_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT 'KemetRise Team',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  views       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.website_news (title_ar, title_en, slug, excerpt_ar, excerpt_en, category, is_published, published_at) VALUES
  ('إطلاق منصة KemetRise 2.0',
   'Launching KemetRise 2.0',
   'launching-kemetrise-2-0',
   'نعلن بكل فخر عن إطلاق النسخة الثانية من منصتنا مع تحسينات جوهرية في الأداء والذكاء الاصطناعي.',
   'We proudly announce the launch of KemetRise 2.0 with major performance and AI improvements.',
   'announcement', TRUE, NOW() - INTERVAL '7 days'),
  ('انضمام وكلاء جدد في منطقة الخليج العربي',
   'New Agents Joining the GCC Region',
   'new-agents-gcc-region',
   'توسيع شبكة وكلائنا في الخليج العربي بإضافة شركاء جدد في الإمارات والسعودية والكويت.',
   'Expanding our GCC agent network with new partners in UAE, Saudi Arabia, and Kuwait.',
   'news', TRUE, NOW() - INTERVAL '14 days'),
  ('إضافة وحدة الذكاء الاصطناعي لـ For Her',
   'AI Module Added to For Her Brand',
   'ai-module-for-her',
   'أطلقنا مساعد التنسيق الأزيائي بالذكاء الاصطناعي لمنصة For Her — تجربة تسوق مخصصة لكل عميلة.',
   'We launched the AI fashion styling assistant for For Her — a personalized shopping experience for every customer.',
   'update', TRUE, NOW() - INTERVAL '21 days')
ON CONFLICT DO NOTHING;

-- ── website_contact_submissions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_contact_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  company     TEXT,
  subject     TEXT,
  message     TEXT NOT NULL,
  inquiry_type TEXT DEFAULT 'general',  -- general | partnership | agent | sales | support
  status      TEXT DEFAULT 'new',       -- new | read | replied | closed
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes       TEXT,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── website_plans ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  name_ar      TEXT NOT NULL,
  name_en      TEXT NOT NULL,
  tagline_ar   TEXT,
  tagline_en   TEXT,
  icon_name    TEXT DEFAULT 'Zap',
  gradient     TEXT DEFAULT 'from-primary/15 to-transparent',
  border_color TEXT DEFAULT 'border-primary/40',
  is_highlighted BOOLEAN DEFAULT FALSE,
  features_ar  TEXT[] DEFAULT '{}',
  features_en  TEXT[] DEFAULT '{}',
  limits       JSONB DEFAULT '{}',
  sort_order   INT DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE
);
INSERT INTO public.website_plans (code, name_ar, name_en, tagline_ar, tagline_en, icon_name, sort_order, features_ar, features_en, limits) VALUES
  ('starter',    'المبتدئ',  'Starter',    'استكشف المنصة مجاناً',      'Explore the platform at no cost', 'Zap',      1,
   ARRAY['بيئة عمل براند واحدة','حتى 5 مستخدمين','وحدات ERP أساسية','دعم المجتمع'],
   ARRAY['1 Brand workspace','Up to 5 users','Basic ERP modules','Community support'],
   '{"storage":"1 GB","api":"1K/mo","reports":"5"}'),
  ('business',   'الأعمال', 'Business',   'للشركات النامية',            'For growing businesses',          'BarChart3', 2,
   ARRAY['5 بيئات عمل براند','حتى 50 مستخدماً','حزمة ERP كاملة','دعم أولوية','5 وكلاء AI','تحليلات متقدمة'],
   ARRAY['5 Brand workspaces','Up to 50 users','Full ERP suite','Priority support','5 AI Agents','Advanced Analytics'],
   '{"storage":"50 GB","api":"100K/mo","reports":"Unlimited"}'),
  ('enterprise', 'المؤسسي', 'Enterprise', 'للمؤسسات الكبيرة',           'For large organisations',         'Crown',    3,
   ARRAY['بيئات عمل غير محدودة','مستخدمون غير محدودون','ERP كامل + وحدات مخصصة','دعم 24/7','وكلاء AI غير محدودين','White Label'],
   ARRAY['Unlimited workspaces','Unlimited users','Full ERP + custom modules','24/7 support','Unlimited AI Agents','White Label'],
   '{"storage":"1 TB+","api":"Unlimited","reports":"Unlimited"}')
ON CONFLICT DO NOTHING;

-- ── RLS Policies ──────────────────────────────────────────────────
ALTER TABLE public.website_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_hero               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_stats              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_features           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_how_it_works       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_testimonials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_faqs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_about              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_news               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_plans              ENABLE ROW LEVEL SECURITY;

-- Public read access for website content
CREATE POLICY "public_read_settings"    ON public.website_settings    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_hero"        ON public.website_hero         FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_stats"       ON public.website_stats        FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_features"    ON public.website_features     FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_hiw"         ON public.website_how_it_works FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_testimonials" ON public.website_testimonials FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_faqs"        ON public.website_faqs         FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_about"       ON public.website_about        FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_news"        ON public.website_news         FOR SELECT USING (is_published = TRUE);
CREATE POLICY "public_read_plans"       ON public.website_plans        FOR SELECT USING (is_active = TRUE);

-- Anyone can submit contact form
CREATE POLICY "public_insert_contact"   ON public.website_contact_submissions FOR INSERT WITH CHECK (TRUE);

-- Admin full access
CREATE POLICY "admin_all_settings"    ON public.website_settings            FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_hero"        ON public.website_hero                FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_stats"       ON public.website_stats               FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_features"    ON public.website_features            FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_hiw"         ON public.website_how_it_works        FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_testimonials" ON public.website_testimonials       FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_faqs"        ON public.website_faqs                FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_about"       ON public.website_about               FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_news"        ON public.website_news                FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_contact"     ON public.website_contact_submissions FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
CREATE POLICY "admin_all_plans"       ON public.website_plans               FOR ALL USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
