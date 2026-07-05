-- ══════════════════════════════════════════════════════════════════════
-- Migration: 20260621100000_partners_tech_stack_cms.sql
-- 1. Extend website_partners with category_ar + specialization icon
-- 2. Create website_tech_stack table
-- 3. Seed business partner companies (Egyptian/MENA companies by spec)
-- 4. Seed tech stack items
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Extend website_partners ──────────────────────────────────────
ALTER TABLE public.website_partners
  ADD COLUMN IF NOT EXISTS category_ar TEXT,
  ADD COLUMN IF NOT EXISTS spec_icon   TEXT NOT NULL DEFAULT '🏢';

-- Back-fill Arabic category labels for existing rows
UPDATE public.website_partners SET category_ar = category WHERE category_ar IS NULL;

-- ── 2. website_tech_stack ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_tech_stack (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en      TEXT        NOT NULL,
  name_ar      TEXT        NOT NULL,
  icon         TEXT        NOT NULL DEFAULT '⚙️',
  category     TEXT        NOT NULL,
  category_ar  TEXT        NOT NULL,
  tier         TEXT        NOT NULL DEFAULT 'silver' CHECK (tier IN ('platinum','gold','silver')),
  color        TEXT        NOT NULL DEFAULT 'primary',
  desc_en      TEXT        NOT NULL DEFAULT '',
  desc_ar      TEXT        NOT NULL DEFAULT '',
  website_url  TEXT,
  sort_order   INT         NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_website_tech_stack_updated_at ON public.website_tech_stack;
CREATE TRIGGER trg_website_tech_stack_updated_at
  BEFORE UPDATE ON public.website_tech_stack
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.website_tech_stack ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wts_public_select" ON public.website_tech_stack;
CREATE POLICY "wts_public_select"
  ON public.website_tech_stack FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "wts_admin_all" ON public.website_tech_stack;
CREATE POLICY "wts_admin_all"
  ON public.website_tech_stack FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'super_admin', 'manager')
    )
  );

-- ── 3. Seed website_partners — Business Companies by Specialization ──
ALTER TABLE public.website_partners ALTER COLUMN partner_name SET DEFAULT '';

INSERT INTO public.website_partners
  (id, partner_name, name_ar, name_en, desc_ar, desc_en, website_url, category, category_ar, spec_icon, sort_order, is_featured, is_active)
VALUES
  -- ── Logistics & Delivery ─────────────────────────────────────────
  ('bb100000-0000-0000-0000-000000000001', 'Aramex Egypt',
   'أراميكس مصر', 'Aramex Egypt',
   'خدمات الشحن والتوصيل الدولي والمحلي بكفاءة عالية.',
   'International and domestic shipping and delivery services with high efficiency.',
   'https://aramex.com',
   'Logistics & Delivery', 'اللوجستيات والتوصيل', '🚛', 10, true, true),

  ('bb100000-0000-0000-0000-000000000002', 'Bosta',
   'بوسطة', 'Bosta',
   'شركة توصيل سريع مصرية تربط الشركات بعملائها في كل أنحاء مصر.',
   'Egyptian last-mile delivery company connecting businesses with their customers across Egypt.',
   'https://bosta.co',
   'Logistics & Delivery', 'اللوجستيات والتوصيل', '🚛', 20, false, true),

  ('bb100000-0000-0000-0000-000000000003', 'J&T Express Egypt',
   'جيه آند تي إكسبريس مصر', 'J&T Express Egypt',
   'شبكة توصيل سريعة النمو مع تغطية واسعة في مصر.',
   'Fast-growing delivery network with wide coverage across Egypt.',
   'https://jtexpress.eg',
   'Logistics & Delivery', 'اللوجستيات والتوصيل', '🚛', 30, false, true),

  ('bb100000-0000-0000-0000-000000000004', 'Mylerz',
   'مايلرز', 'Mylerz',
   'حلول لوجستية متكاملة للتجارة الإلكترونية في مصر والمنطقة.',
   'Integrated logistics solutions for e-commerce in Egypt and the region.',
   'https://mylerz.com',
   'Logistics & Delivery', 'اللوجستيات والتوصيل', '🚛', 40, false, true),

  -- ── Payments & Fintech ───────────────────────────────────────────
  ('bb200000-0000-0000-0000-000000000001', 'Fawry',
   'فوري', 'Fawry',
   'بوابة الدفع الإلكتروني الأولى في مصر مع شبكة تغطية تتجاوز 300,000 نقطة بيع.',
   'Egypt''s leading electronic payment gateway with a network exceeding 300,000 POS points.',
   'https://fawry.com',
   'Payments & Fintech', 'المدفوعات والتقنية المالية', '💳', 10, true, true),

  ('bb200000-0000-0000-0000-000000000002', 'Paymob',
   'باي موب', 'Paymob',
   'منصة مدفوعات رقمية متكاملة للشركات في منطقة الشرق الأوسط وأفريقيا.',
   'Integrated digital payments platform for businesses across the Middle East and Africa.',
   'https://paymob.com',
   'Payments & Fintech', 'المدفوعات والتقنية المالية', '💳', 20, false, true),

  ('bb200000-0000-0000-0000-000000000003', 'Kashier',
   'كاشير', 'Kashier',
   'بوابة دفع متكاملة مصممة خصيصاً لدعم التجارة الإلكترونية في مصر.',
   'Integrated payment gateway designed specifically to support e-commerce in Egypt.',
   'https://kashier.io',
   'Payments & Fintech', 'المدفوعات والتقنية المالية', '💳', 30, false, true),

  -- ── Telecom & ICT ────────────────────────────────────────────────
  ('bb300000-0000-0000-0000-000000000001', 'Vodafone Egypt',
   'فودافون مصر', 'Vodafone Egypt',
   'أكبر مزود خدمات اتصالات في مصر مع حلول B2B متكاملة للشركات.',
   'Egypt''s largest telecom provider with integrated B2B solutions for enterprises.',
   'https://vodafone.com.eg',
   'Telecom & ICT', 'الاتصالات وتكنولوجيا المعلومات', '📡', 10, true, true),

  ('bb300000-0000-0000-0000-000000000002', 'Orange Egypt',
   'أورنچ مصر', 'Orange Egypt',
   'مزود خدمات اتصالات وحلول رقمية متكاملة للأفراد والشركات.',
   'Telecom and integrated digital solutions provider for individuals and enterprises.',
   'https://orange.eg',
   'Telecom & ICT', 'الاتصالات وتكنولوجيا المعلومات', '📡', 20, false, true),

  ('bb300000-0000-0000-0000-000000000003', 'e& Egypt',
   'إي آند مصر', 'e& Egypt',
   'شبكة اتصالات متطورة وخدمات تقنية B2B على مستوى المؤسسات.',
   'Advanced telecom network and enterprise-grade B2B technology services.',
   NULL,
   'Telecom & ICT', 'الاتصالات وتكنولوجيا المعلومات', '📡', 30, false, true),

  -- ── Consulting & Enterprise ──────────────────────────────────────
  ('bb400000-0000-0000-0000-000000000001', 'EY Egypt',
   'إرنست ويونغ مصر', 'EY Egypt',
   'خدمات استشارية وتدقيق ومالية وضريبية للشركات الكبرى في مصر.',
   'Advisory, audit, financial and tax services for large enterprises in Egypt.',
   'https://ey.com/eg',
   'Consulting & Enterprise', 'الاستشارات والمؤسسات', '💼', 10, false, true),

  ('bb400000-0000-0000-0000-000000000002', 'Deloitte Egypt',
   'ديلويت مصر', 'Deloitte Egypt',
   'استشارات إدارة وتدقيق وتكنولوجيا وخبرة معمقة في التحول الرقمي.',
   'Management consulting, audit, technology and deep expertise in digital transformation.',
   NULL,
   'Consulting & Enterprise', 'الاستشارات والمؤسسات', '💼', 20, false, true),

  ('bb400000-0000-0000-0000-000000000003', 'KPMG Egypt',
   'KPMG مصر', 'KPMG Egypt',
   'خدمات التدقيق والاستشارات والضرائب مع خبرة قطاعية واسعة.',
   'Audit, advisory and tax services with broad sector expertise.',
   NULL,
   'Consulting & Enterprise', 'الاستشارات والمؤسسات', '💼', 30, false, true),

  -- ── Training & Education ─────────────────────────────────────────
  ('bb500000-0000-0000-0000-000000000001', 'ITI Egypt',
   'معهد تكنولوجيا المعلومات ITI', 'ITI Egypt',
   'المعهد القومي لتكنولوجيا المعلومات والاتصالات لتأهيل الكوادر التقنية في مصر.',
   'National institute for ICT training and qualification of technical professionals in Egypt.',
   'https://iti.gov.eg',
   'Training & Education', 'التدريب والتأهيل التقني', '🎓', 10, true, true),

  ('bb500000-0000-0000-0000-000000000002', 'Orange Digital Center Egypt',
   'أورنچ ديجيتال سنتر', 'Orange Digital Center Egypt',
   'مركز تدريب تقني متخصص في مجالات الترميز والابتكار الرقمي.',
   'Technical training center specialized in coding and digital innovation.',
   NULL,
   'Training & Education', 'التدريب والتأهيل التقني', '🎓', 20, false, true),

  ('bb500000-0000-0000-0000-000000000003', 'ITIDA',
   'جهاز تنمية صناعة تقنية المعلومات ITIDA', 'ITIDA',
   'الجهة الحكومية المسؤولة عن تطوير صناعة تكنولوجيا المعلومات في مصر.',
   'Government agency responsible for developing the ICT industry in Egypt.',
   'https://itida.gov.eg',
   'Training & Education', 'التدريب والتأهيل التقني', '🎓', 30, false, true),

  -- ── E-commerce & Distribution ────────────────────────────────────
  ('bb600000-0000-0000-0000-000000000001', 'Jumia Egypt',
   'جوميا مصر', 'Jumia Egypt',
   'أكبر سوق إلكتروني في أفريقيا مع ملايين المستخدمين في مصر.',
   'Africa''s largest e-commerce marketplace with millions of users in Egypt.',
   'https://jumia.com.eg',
   'E-commerce & Distribution', 'التجارة الإلكترونية والتوزيع', '🛍️', 10, false, true),

  ('bb600000-0000-0000-0000-000000000002', 'Noon Egypt',
   'نون مصر', 'Noon Egypt',
   'منصة تجارة إلكترونية رائدة في الشرق الأوسط تدعم الموردين المحليين.',
   'Leading e-commerce platform in the Middle East supporting local suppliers.',
   'https://noon.com/egypt-en',
   'E-commerce & Distribution', 'التجارة الإلكترونية والتوزيع', '🛍️', 20, false, true),

  ('bb600000-0000-0000-0000-000000000003', 'Amazon Egypt',
   'أمازون مصر', 'Amazon Egypt',
   'المنصة العالمية للتجارة الإلكترونية مع حضور متنامٍ في مصر.',
   'Global e-commerce platform with a growing presence in Egypt.',
   'https://amazon.eg',
   'E-commerce & Distribution', 'التجارة الإلكترونية والتوزيع', '🛍️', 30, false, true)

ON CONFLICT (id) DO UPDATE SET
  partner_name = EXCLUDED.name_en,
  name_ar      = EXCLUDED.name_ar,
  name_en      = EXCLUDED.name_en,
  desc_ar      = EXCLUDED.desc_ar,
  desc_en      = EXCLUDED.desc_en,
  website_url  = EXCLUDED.website_url,
  category     = EXCLUDED.category,
  category_ar  = EXCLUDED.category_ar,
  spec_icon    = EXCLUDED.spec_icon,
  sort_order   = EXCLUDED.sort_order,
  is_featured  = EXCLUDED.is_featured,
  is_active    = EXCLUDED.is_active;

-- ── 4. Seed website_tech_stack ───────────────────────────────────────
INSERT INTO public.website_tech_stack
  (id, name_en, name_ar, icon, category, category_ar, tier, color, desc_en, desc_ar, website_url, sort_order, is_active)
VALUES
  -- Platinum
  ('cc100001-0000-0000-0000-000000000001',
   'Supabase', 'سوبابيس', '☁️',
   'Cloud & Database', 'سحابة وقاعدة بيانات', 'platinum', 'emerald',
   'Primary backend — real-time PostgreSQL, auth, storage and edge functions powering every KemetRise deployment.',
   'القاعدة الخلفية الأساسية — PostgreSQL الفوري، المصادقة، التخزين والوظائف الحدية تدعم كل نشر لـ KemetRise.',
   'https://supabase.com', 10, true),

  ('cc100001-0000-0000-0000-000000000002',
   'Vite + React', 'فايت + ريأكت', '⚡',
   'Frontend Infrastructure', 'بنية الواجهة الأمامية', 'platinum', 'violet',
   'React 18 + TypeScript + Vite — ultra-fast build tooling and best-in-class developer experience.',
   'React 18 + TypeScript + Vite — أدوات بناء فائقة السرعة وتجربة مطور بلا منافس.',
   NULL, 20, true),

  ('cc100001-0000-0000-0000-000000000003',
   'OpenAI / Claude', 'أوبن إيه آي / كلود', '🤖',
   'AI Infrastructure', 'بنية الذكاء الاصطناعي', 'platinum', 'cyan',
   'Powering ANUBIS, ISIS, HORUS and 10+ AI agents across the platform with GPT-4o and Claude Sonnet models.',
   'تشغيل أنوبيس وإيزيس وحورس وأكثر من 10 وكلاء AI عبر المنصة بنماذج GPT-4o وClaude Sonnet.',
   'https://openai.com', 30, true),

  -- Gold
  ('cc200001-0000-0000-0000-000000000001',
   'Stripe / Fawry', 'سترايب / فوري', '💳',
   'Payment Gateway', 'بوابة الدفع', 'gold', 'indigo',
   'Secure payments in 135+ currencies with local Egyptian methods: Fawry, Meeza and EasyPay.',
   'مدفوعات آمنة بأكثر من 135 عملة مع طرق الدفع المصرية المحلية: فوري وميزة وإيزي باي.',
   'https://stripe.com', 40, true),

  ('cc200001-0000-0000-0000-000000000002',
   'Resend / SendGrid', 'ريسيند / سيندجريد', '📧',
   'Communication', 'التواصل والإشعارات', 'gold', 'blue',
   'Transactional email, SMS notifications and marketing campaigns with high deliverability rates.',
   'بريد إلكتروني معاملاتي وإشعارات SMS وحملات تسويقية بمعدلات توصيل عالية.',
   NULL, 50, true),

  ('cc200001-0000-0000-0000-000000000003',
   'Auth0 / Supabase Auth', 'مصادقة سوبابيس', '🔐',
   'Identity & Security', 'الهوية والأمان', 'gold', 'red',
   'Enterprise-grade SSO, MFA, OAuth and RBAC ensuring every tenant''s data stays isolated and protected.',
   'أمان SSO وMFA وOAuth وRBAC بمستوى المؤسسات يضمن عزل وحماية بيانات كل مستأجر.',
   NULL, 60, true),

  -- Silver
  ('cc300001-0000-0000-0000-000000000001',
   'Recharts / Chart.js', 'ريتشارتس / تشارت جي إس', '📊',
   'Data Visualization', 'تصور البيانات', 'silver', 'orange',
   'Interactive BI dashboards and real-time analytics rendered with React-based charting libraries.',
   'لوحات ذكاء أعمال تفاعلية وتحليلات فورية بمكتبات الرسوم البيانية المبنية على React.',
   NULL, 70, true),

  ('cc300001-0000-0000-0000-000000000002',
   'Cloudflare', 'كلاودفلير', '🌐',
   'CDN & Security', 'CDN والأمان', 'silver', 'amber',
   'Global CDN, DDoS protection and edge caching ensuring sub-100ms load times across MENA and beyond.',
   'شبكة CDN عالمية وحماية DDoS وتخزين مؤقت على الحافة لضمان أوقات تحميل دون 100ms في منطقة MENA.',
   'https://cloudflare.com', 80, true),

  ('cc300001-0000-0000-0000-000000000003',
   'Tailwind CSS + shadcn/ui', 'تيلويند + شادسن', '🎨',
   'Design System', 'نظام التصميم', 'silver', 'pink',
   'Egyptian-themed gold palette, Orbitron/Rajdhani typography and dark/light modes built on Tailwind CSS.',
   'لوحة ذهبية ذات طابع مصري وخطوط Orbitron/Rajdhani ووضعي الإضاءة المبنية على Tailwind CSS.',
   NULL, 90, true)

ON CONFLICT (id) DO UPDATE SET
  name_en     = EXCLUDED.name_en,
  name_ar     = EXCLUDED.name_ar,
  icon        = EXCLUDED.icon,
  category    = EXCLUDED.category,
  category_ar = EXCLUDED.category_ar,
  tier        = EXCLUDED.tier,
  color       = EXCLUDED.color,
  desc_en     = EXCLUDED.desc_en,
  desc_ar     = EXCLUDED.desc_ar,
  website_url = EXCLUDED.website_url,
  sort_order  = EXCLUDED.sort_order,
  is_active   = EXCLUDED.is_active;
