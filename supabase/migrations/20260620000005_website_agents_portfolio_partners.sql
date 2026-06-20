-- ══════════════════════════════════════════════════════════════════
-- Migration: 20260620000005_website_agents_portfolio_partners.sql
-- Creates: website_agents | website_portfolio | website_partners
-- ══════════════════════════════════════════════════════════════════

-- Shared updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ──────────────────────────────────────────────────────────────────
-- TABLE 1: website_agents
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_agents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  region          TEXT        NOT NULL,
  country         TEXT        NOT NULL,
  coverage_scope  TEXT,
  contact_email   TEXT,
  project_order   INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_website_agents_updated_at ON public.website_agents;
CREATE TRIGGER trg_website_agents_updated_at
  BEFORE UPDATE ON public.website_agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.website_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wa_public_select" ON public.website_agents;
CREATE POLICY "wa_public_select"
  ON public.website_agents FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "wa_admin_all" ON public.website_agents;
CREATE POLICY "wa_admin_all"
  ON public.website_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- ──────────────────────────────────────────────────────────────────
-- TABLE 2: website_portfolio
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_portfolio (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  category        TEXT,
  description     TEXT        NOT NULL DEFAULT '',
  image_url       TEXT,
  project_order   INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_website_portfolio_updated_at ON public.website_portfolio;
CREATE TRIGGER trg_website_portfolio_updated_at
  BEFORE UPDATE ON public.website_portfolio
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.website_portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wpo_public_select" ON public.website_portfolio;
CREATE POLICY "wpo_public_select"
  ON public.website_portfolio FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "wpo_admin_all" ON public.website_portfolio;
CREATE POLICY "wpo_admin_all"
  ON public.website_portfolio FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- ──────────────────────────────────────────────────────────────────
-- TABLE 3: website_partners
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_partners (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name    TEXT        NOT NULL,
  logo_url        TEXT,
  partner_type    TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_website_partners_updated_at ON public.website_partners;
CREATE TRIGGER trg_website_partners_updated_at
  BEFORE UPDATE ON public.website_partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.website_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wpa_public_select" ON public.website_partners;
CREATE POLICY "wpa_public_select"
  ON public.website_partners FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "wpa_admin_all" ON public.website_partners;
CREATE POLICY "wpa_admin_all"
  ON public.website_partners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- SEED DATA — website_agents (10 agents, idempotent)
-- ══════════════════════════════════════════════════════════════════
INSERT INTO public.website_agents
  (id, name, region, country, coverage_scope, contact_email, project_order, is_active)
VALUES

  -- ── بلاد الشام ────────────────────────────────────────────────
  ('aa100000-0000-0000-0000-000000000001',
   'وكالة ليبانو للموضة والأزياء المحتشمة',
   'الشام', 'لبنان',
   'مسؤولة عن توزيع منتجات For Her في لبنان وإدارة شحنات Just Click Store إلى الأسواق اللبنانية والسورية، بما يشمل إدارة المخزون والتسليم اللوجستي الأخير.',
   'lebanon@kemetrise.com', 10, true),

  ('aa100000-0000-0000-0000-000000000002',
   'وكالة الأردن للشراكات التجارية والتوزيع',
   'الشام', 'الأردن',
   'إدارة شبكة الوكلاء التجاريين في الأردن وتطوير قنوات التوزيع مع التوكيلات التجارية الكبرى وتنسيق الشحن إلى الدول المجاورة.',
   'jordan@kemetrise.com', 20, true),

  -- ── الخليج العربي ─────────────────────────────────────────────
  ('aa200000-0000-0000-0000-000000000001',
   'وكالة الإمارات للتكنولوجيا والتجارة الإلكترونية',
   'الخليج', 'الإمارات',
   'إدارة عمليات Just Click Store في منطقة الخليج، وتشغيل منظومة GrowVance الإعلامية، ودعم شبكة الموردين متعددي البائعين في دول مجلس التعاون.',
   'uae@kemetrise.com', 30, true),

  ('aa200000-0000-0000-0000-000000000002',
   'وكالة المملكة العربية السعودية للتحول الرقمي',
   'الخليج', 'السعودية',
   'مسؤولة عن توسع Agentic في السوق السعودي وبناء منظومة التجارة الإلكترونية متعددة البائعين والتكامل مع بوابات الدفع المحلية ومنصة تحيا.',
   'ksa@kemetrise.com', 40, true),

  -- ── أوروبا ────────────────────────────────────────────────────
  ('aa300000-0000-0000-0000-000000000001',
   'وكالة برلين للإعلام والترخيص الإبداعي',
   'أوروبا', 'ألمانيا',
   'إدارة توزيع المحتوى الإبداعي لـ GrowVance في الأسواق الأوروبية وترخيص الأعمال الفنية وعقود الإنتاج المشترك مع شركاء الإنتاج الأوروبيين.',
   'berlin@kemetrise.com', 50, true),

  ('aa300000-0000-0000-0000-000000000002',
   'وكالة باريس للأزياء الراقية والعرض الدولي',
   'أوروبا', 'فرنسا',
   'شراكات الأزياء الراقية لعلامة For Her وإدارة الحضور الأوروبي في معارض الأزياء الدولية وتنسيق الاستيراد والتصدير عبر الجمارك الأوروبية.',
   'paris@kemetrise.com', 60, true),

  -- ── أمريكا الشمالية ──────────────────────────────────────────
  ('aa400000-0000-0000-0000-000000000001',
   'وكالة كاليفورنيا للذكاء الاصطناعي والبنية التقنية',
   'أمريكا الشمالية', 'الولايات المتحدة',
   'إدارة منظومة Agentic التقنية على المستوى العالمي وتطوير أطر العمل بالذكاء الاصطناعي وبناء الأنظمة متعددة المستأجرين وإدارة البنية التحتية السحابية.',
   'california@kemetrise.com', 70, true),

  ('aa400000-0000-0000-0000-000000000002',
   'وكالة كندا للتقنية الموزعة وحلول SaaS',
   'أمريكا الشمالية', 'كندا',
   'دعم البنية التحتية لـ Just Click Store في أمريكا الشمالية وإدارة حلول SaaS للسوق الكندي وتوفير خدمات الدعم الفني والاندماج مع الأنظمة المحلية.',
   'canada@kemetrise.com', 80, true),

  -- ── شمال أفريقيا ─────────────────────────────────────────────
  ('aa500000-0000-0000-0000-000000000001',
   'وكالة القاهرة للتوكيلات التجارية والحوكمة',
   'أفريقيا', 'مصر',
   'مركز عمليات التوكيلات التجارية الإقليمية في مصر، وإدارة التخليص الجمركي وبناء شبكة الموردين وحوكمة سلسلة الإمداد على المستوى الأفريقي.',
   'cairo@kemetrise.com', 90, true),

  ('aa500000-0000-0000-0000-000000000002',
   'وكالة الدار البيضاء للإعلام وتوزيع المحتوى',
   'أفريقيا', 'المغرب',
   'توزيع محتوى GrowVance في منطقة المغرب العربي والشراكات مع قنوات الإعلام المحلية ومنصات البث الرقمي والمشاركة في معارض الإعلام الإقليمية.',
   'morocco@kemetrise.com', 100, true)

ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  coverage_scope = EXCLUDED.coverage_scope,
  contact_email  = EXCLUDED.contact_email,
  project_order  = EXCLUDED.project_order,
  updated_at     = now();

-- ══════════════════════════════════════════════════════════════════
-- SEED DATA — website_portfolio (6 showcase items, idempotent)
-- ══════════════════════════════════════════════════════════════════
INSERT INTO public.website_portfolio
  (id, title, category, description, project_order, is_active)
VALUES

  ('bb100000-0000-0000-0000-000000000001',
   'منصة الأزياء المحتشمة الذكية — For Her',
   'Fashion Tech',
   'منصة متكاملة لإدارة مجموعات الأزياء المحتشمة مع مساعد الذكاء الاصطناعي للتنسيق، دليل المقاسات الديناميكي، وشبكة توزيع دولية.',
   10, true),

  ('bb100000-0000-0000-0000-000000000002',
   'متجر Just Click Store متعدد البائعين',
   'E-commerce Platform',
   'منصة تجزئة مركزية تجمع مئات الموردين في واجهة موحدة مع نظام مخزون آني، إدارة الشحن اللوجستي، وبوابات دفع متكاملة.',
   20, true),

  ('bb100000-0000-0000-0000-000000000003',
   'منظومة Agentic للوكلاء الذكيين',
   'AI & Automation',
   'إطار عمل متكامل لبناء ونشر وكلاء الذكاء الاصطناعي المستقلين في بيئات B2B مع أدوات المراقبة والتحكم بالمهام الآلية.',
   30, true),

  ('bb100000-0000-0000-0000-000000000004',
   'استوديو GrowVance للإنتاج الإعلامي',
   'Media Production',
   'منظومة إنتاج إعلامي متكاملة تشمل إدارة مشاريع الفيديو، الترخيص الإبداعي، وشبكة توزيع المحتوى عبر 12 سوقاً دولية.',
   40, true),

  ('bb100000-0000-0000-0000-000000000005',
   'شبكة التوكيلات التجارية الإقليمية',
   'Commercial Agencies',
   'شبكة وكلاء تجاريين متخصصين تغطي 5 مناطق جغرافية لإدارة العمليات اللوجستية، التخليص الجمركي، وحوكمة سلسلة الإمداد.',
   50, true),

  ('bb100000-0000-0000-0000-000000000006',
   'نظام ERP + SaaS متعدد المستأجرين',
   'Enterprise SaaS',
   'منصة ERP سحابية تجمع ثمانية بوابات في نظام واحد مع إدارة العملاء، المحاسبة، المشاريع، والتقارير التنفيذية اللحظية.',
   60, true)

ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  category      = EXCLUDED.category,
  description   = EXCLUDED.description,
  project_order = EXCLUDED.project_order,
  updated_at    = now();

-- ══════════════════════════════════════════════════════════════════
-- SEED DATA — website_partners (8 partners, idempotent)
-- ══════════════════════════════════════════════════════════════════
INSERT INTO public.website_partners
  (id, partner_name, logo_url, partner_type, is_active)
VALUES

  ('cc100000-0000-0000-0000-000000000001',
   'Supabase',               NULL, 'Cloud Database & Auth',      true),
  ('cc100000-0000-0000-0000-000000000002',
   'Vercel',                 NULL, 'Deployment & Edge Network',  true),
  ('cc100000-0000-0000-0000-000000000003',
   'Stripe',                 NULL, 'Payment Infrastructure',     true),
  ('cc100000-0000-0000-0000-000000000004',
   'Aramex',                 NULL, 'Shipping Provider',          true),
  ('cc100000-0000-0000-0000-000000000005',
   'DHL Express',            NULL, 'International Courier',      true),
  ('cc100000-0000-0000-0000-000000000006',
   'OpenAI',                 NULL, 'AI Infrastructure',          true),
  ('cc100000-0000-0000-0000-000000000007',
   'Cloudflare',             NULL, 'CDN & Security',             true),
  ('cc100000-0000-0000-0000-000000000008',
   'AWS',                    NULL, 'Cloud Infrastructure',       true)

ON CONFLICT (id) DO UPDATE SET
  partner_name  = EXCLUDED.partner_name,
  partner_type  = EXCLUDED.partner_type,
  updated_at    = now();
