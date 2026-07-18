-- ──────────────────────────────────────────────────────────────────
-- website_projects: Public Projects Portfolio Catalog
-- Migration: 20260620000004_website_projects.sql
-- ──────────────────────────────────────────────────────────────────

-- 1. set_updated_at trigger function (idempotent — shared across tables)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 2. Main table
CREATE TABLE IF NOT EXISTS public.website_projects (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  brand_name     TEXT        NOT NULL,
  sector         TEXT,
  execution_type TEXT,
  description    TEXT        NOT NULL DEFAULT '',
  image_url      TEXT,
  project_order  INTEGER     NOT NULL DEFAULT 0,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Updated-at trigger
DROP TRIGGER IF EXISTS trg_website_projects_updated_at ON public.website_projects;
CREATE TRIGGER trg_website_projects_updated_at
  BEFORE UPDATE ON public.website_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Row Level Security
ALTER TABLE public.website_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wp_proj_public_select" ON public.website_projects;
CREATE POLICY "wp_proj_public_select"
  ON public.website_projects FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "wp_proj_admin_all" ON public.website_projects;
CREATE POLICY "wp_proj_admin_all"
  ON public.website_projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- 5. Seed data — 18 projects across 6 brands (idempotent via ON CONFLICT)
INSERT INTO public.website_projects
  (id, title, brand_name, sector, execution_type, description, project_order, is_active)
VALUES

  -- ── FOR HER ───────────────────────────────────────────────────────
  ('11000000-0000-0000-0000-000000000001',
   'نظام إدارة مجموعات الأزياء المحتشمة',
   'For Her', 'Fashion & Modest Styling', 'Hybrid',
   'نظام متكامل لإدارة مجموعات الأزياء المحتشمة يشمل إدارة المخزون بالمقاسات والألوان، تصنيف القطع الفنية، ونشر الكتالوجات تلقائياً عبر قنوات المبيعات المتعددة مع إشعارات النفاد الآني وتحليلات الأداء.',
   10, true),

  ('11000000-0000-0000-0000-000000000002',
   'مساعد التنسيق الأزيائي بالذكاء الاصطناعي',
   'For Her', 'AI Styling', 'AI Agents',
   'وكيل ذكاء اصطناعي مخصص يقدم توصيات تنسيق الأزياء بناءً على تفضيلات العميلة والمناسبة ومتطلبات اللباس المحتشم، يعمل عبر دردشة تفاعلية بالعربية والإنجليزية على مدار الساعة دون أي تدخل بشري.',
   20, true),

  ('11000000-0000-0000-0000-000000000003',
   'دليل المقاسات الديناميكي والذكي',
   'For Her', 'Fashion & Modest Styling', 'Technical Infrastructure',
   'أداة تفاعلية ذكية لتوجيه العميلات نحو المقاس الأنسب وفق قياساتهن الحقيقية، مما يقلل معدل الإرجاع بنسبة تصل إلى 60% ويحسن رضا العملاء من خلال توصيات دقيقة ومحدّثة باستمرار.',
   30, true),

  -- ── JUST CLICK STORE ──────────────────────────────────────────────
  ('22000000-0000-0000-0000-000000000001',
   'منصة التجزئة متعددة البائعين',
   'Just Click Store', 'E-commerce & Smart Logistics', 'Technical Infrastructure',
   'متجر تجزئة مركزي يجمع شبكة موردين متعددين في واجهة عرض موحدة مع نظام إدارة المخزون الآني والتسعير التنافسي والمزامنة الكاملة مع أنظمة نقاط البيع وبوابات الدفع الإلكتروني المختلفة.',
   10, true),

  ('22000000-0000-0000-0000-000000000002',
   'محرك الشحن والتسليم الآلي',
   'Just Click Store', 'E-commerce & Smart Logistics', 'AI Agents',
   'نظام ربط آلي متكامل مع شركات الشحن عبر Webhooks، يُنشئ بوليصات الشحن فور تأكيد الطلب ويتتبع الشحنات في الوقت الفعلي مع إشعارات تلقائية للعملاء عبر SMS والبريد الإلكتروني.',
   20, true),

  ('22000000-0000-0000-0000-000000000003',
   'بوابة إدارة شبكة الموردين',
   'Just Click Store', 'Supply Chain', 'Hybrid',
   'بوابة موردين متكاملة لرفع المنتجات والفواتير وتتبع الطلبات وإدارة العقود مع آليات تقييم الأداء وضمان الجودة وقنوات تواصل مباشرة مع فريق الشراء ومدير الحسابات.',
   30, true),

  -- ── YOUKA'S CORE ──────────────────────────────────────────────────
  ('33000000-0000-0000-0000-000000000001',
   'مسرّع الشركات الناشئة المتكامل',
   'Youka''s Core', 'Business Incubators & Marketing Hub', 'Hybrid',
   'برنامج تسريع شامل للشركات الناشئة يشمل التقييم المبدئي والتوجيه الاستراتيجي وربط المشاريع بالممولين إلى جانب الدعم القانوني والمحاسبي من خلال شبكة خبراء مؤهلين ومعتمدين.',
   10, true),

  ('33000000-0000-0000-0000-000000000002',
   'منظومة تتبع دعوات HR Hub',
   'Youka''s Core', 'HR Management', 'Technical Infrastructure',
   'نظام رقمي متكامل لإدارة وتتبع دعوات الانضمام لبوابة الموارد البشرية يشمل رموز الدعوة المخصصة ولوحات التتبع التفاعلية وتقارير قبول الدعوات مع ربط كامل بنظام ERP.',
   20, true),

  ('33000000-0000-0000-0000-000000000003',
   'مركز المنهجيات التسويقية الذكي',
   'Youka''s Core', 'Marketing Hub', 'Hybrid',
   'منصة تعليمية وتطبيقية للمنهجيات التسويقية الحديثة تدمج خطط التسويق المخصصة وتحليلات الأداء وأدوات إنشاء المحتوى وتتبع معدلات العائد على الاستثمار في بيئة عمل تعاونية.',
   30, true),

  -- ── GROWVANCE ─────────────────────────────────────────────────────
  ('44000000-0000-0000-0000-000000000001',
   'منصة سير عمل الإنتاج الإعلامي',
   'GrowVance', 'Media, Production & Arts Distribution', 'Technical Infrastructure',
   'نظام إدارة مشاريع الإنتاج الإعلامي من الفكرة حتى التوزيع يشمل جدولة التصوير وإدارة فريق الإنتاج ومراحل المراجعة والاعتماد وأرشفة المشاريع المكتملة وتتبع التكاليف التشغيلية.',
   10, true),

  ('44000000-0000-0000-0000-000000000002',
   'نظام إدارة التراخيص والحقوق الإعلامية',
   'GrowVance', 'Media Licensing', 'Hybrid',
   'منظومة متكاملة لإدارة حقوق الملكية الفكرية والتراخيص الإعلامية تشمل تسجيل الأعمال وعقود التوزيع وتتبع الاستخدام وجمع المستحقات المالية من المنصات الرقمية المختلفة.',
   20, true),

  ('44000000-0000-0000-0000-000000000003',
   'خط إنتاج الفيديو والمحتوى الصوتي',
   'GrowVance', 'Production Pipeline', 'Hybrid',
   'خط إنتاج رقمي متكامل يربط فريق الإبداع بأدوات التحرير والمؤثرات البصرية والتوزيع مع نظام مراجعة ذكي يستخدم الذكاء الاصطناعي لاقتراح تحسينات على المحتوى الإعلامي قبل نشره.',
   30, true),

  -- ── AGENTIC ───────────────────────────────────────────────────────
  ('55000000-0000-0000-0000-000000000001',
   'شبكة وكلاء الذكاء الاصطناعي المخصصة',
   'Agentic', 'AI Operations & Digital Labor System', 'AI Agents',
   'بناء وتشغيل شبكة متكاملة من وكلاء الذكاء الاصطناعي المخصصين لأتمتة العمليات التشغيلية تشمل وكلاء خدمة العملاء والجدولة الذكية وتحليل البيانات وإدارة الطلبات دون أي تدخل بشري.',
   10, true),

  ('55000000-0000-0000-0000-000000000002',
   'محرر خرائط سير العمل التفاعلي',
   'Agentic', 'Workflow Automation', 'AI Agents',
   'أداة بصرية متطورة بالسحب والإفلات لتصميم مسارات العمل الآلية تدعم الشروط المنطقية المتقدمة (condition_expr) والتكامل الكامل مع n8n وتصحيح الأخطاء الفوري في بيئة الإنتاج.',
   20, true),

  ('55000000-0000-0000-0000-000000000003',
   'تنسيق وإدارة شبكات n8n المؤسسية',
   'Agentic', 'Digital Infrastructure', 'Technical Infrastructure',
   'تصميم وتشغيل ومراقبة شبكات أتمتة n8n الكاملة للمؤسسات تشمل ربط الأنظمة المختلفة ومعالجة البيانات الضخمة وتشغيل العمليات المعقدة متعددة الخطوات بموثوقية وأمان عاليين.',
   30, true),

  -- ── COMMERCIAL AGENCIES ───────────────────────────────────────────
  ('66000000-0000-0000-0000-000000000001',
   'نظام حوكمة عقود التوكيلات التجارية',
   'Commercial Agencies', 'Contract Governance', 'Technical Infrastructure',
   'منظومة قانونية تقنية متكاملة لإدارة عقود التوكيلات التجارية متعددة المستأجرين تشمل إنشاء العقود الرقمية والتوقيع الإلكتروني ومتابعة صلاحية البنود والتنبيهات التلقائية قبل انتهاء العقد.',
   10, true),

  ('66000000-0000-0000-0000-000000000002',
   'منصة شبكة الموردين الدوليين',
   'Commercial Agencies', 'International Trade', 'Hybrid',
   'منصة ربط احترافية بين الموردين الدوليين والسوق المحلية تشمل إجراءات التخليص الجمركي الرقمي وإدارة الفواتير الدولية وتتبع الشحنات عبر الحدود والامتثال للوائح الاستيراد والتصدير.',
   20, true),

  ('66000000-0000-0000-0000-000000000003',
   'نظام التوزيع اللوجستي العالمي',
   'Commercial Agencies', 'Global Logistics', 'Hybrid',
   'شبكة توزيع عالمية متكاملة تدعم التخطيط اللوجستي المتقدم وإدارة المستودعات الموزعة وتحسين مسارات الشحن والتكامل مع شركاء التوزيع الدوليين لضمان وصول فعّال للأسواق المستهدفة.',
   30, true)

ON CONFLICT (id) DO UPDATE SET
  title          = EXCLUDED.title,
  brand_name     = EXCLUDED.brand_name,
  sector         = EXCLUDED.sector,
  execution_type = EXCLUDED.execution_type,
  description    = EXCLUDED.description,
  project_order  = EXCLUDED.project_order,
  is_active      = EXCLUDED.is_active,
  updated_at     = now();
