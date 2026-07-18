-- ──────────────────────────────────────────────────────
-- Website Services catalog + Service Requests
-- ──────────────────────────────────────────────────────

-- 1. website_services table
CREATE TABLE IF NOT EXISTS public.website_services (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     TEXT        NOT NULL,
  name_en     TEXT        NOT NULL,
  desc_ar     TEXT        NOT NULL DEFAULT '',
  desc_en     TEXT        NOT NULL DEFAULT '',
  category    TEXT        NOT NULL DEFAULT 'tech',
  color       TEXT        NOT NULL DEFAULT '#D4A017',
  icon_name   TEXT        NOT NULL DEFAULT 'Layers',
  features_ar TEXT[]      NOT NULL DEFAULT '{}',
  features_en TEXT[]      NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      UUID        REFERENCES public.website_services(id) ON DELETE SET NULL,
  service_name_ar TEXT,
  service_name_en TEXT,
  full_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  phone           TEXT,
  company         TEXT,
  message         TEXT,
  status          TEXT        NOT NULL DEFAULT 'new',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_website_services_updated_at ON public.website_services;
CREATE TRIGGER trg_website_services_updated_at
  BEFORE UPDATE ON public.website_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. RLS
ALTER TABLE public.website_services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests   ENABLE ROW LEVEL SECURITY;

-- website_services: public read, admin write
DROP POLICY IF EXISTS "ws_public_select"  ON public.website_services;
DROP POLICY IF EXISTS "ws_admin_all"      ON public.website_services;
CREATE POLICY "ws_public_select" ON public.website_services
  FOR SELECT USING (true);
CREATE POLICY "ws_admin_all" ON public.website_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role::text IN ('admin','superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role::text IN ('admin','superadmin'))
  );

-- service_requests: public insert, admin read/manage
DROP POLICY IF EXISTS "sr_public_insert"  ON public.service_requests;
DROP POLICY IF EXISTS "sr_admin_all"      ON public.service_requests;
CREATE POLICY "sr_public_insert" ON public.service_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "sr_admin_all" ON public.service_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role::text IN ('admin','superadmin'))
  );

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_ws_category   ON public.website_services(category);
CREATE INDEX IF NOT EXISTS idx_ws_sort_order ON public.website_services(sort_order);
CREATE INDEX IF NOT EXISTS idx_ws_is_active  ON public.website_services(is_active);
CREATE INDEX IF NOT EXISTS idx_sr_service_id ON public.service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_sr_status     ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_sr_created_at ON public.service_requests(created_at DESC);

-- ──────────────────────────────────────────────────────
-- 6. SEED DATA — 38 services
-- ──────────────────────────────────────────────────────
INSERT INTO public.website_services
  (name_ar, name_en, desc_ar, desc_en, category, color, icon_name, features_ar, features_en, sort_order)
VALUES

-- ── Original 10 Platform Services ──────────────────
(
  'ERP والمالية',
  'ERP & Finance',
  'دفتر أستاذ عام كامل، امتثال ضريبي، قيود يومية، وتقارير الربح والخسارة الفورية.',
  'Complete general ledger, tax compliance, journal entries, and real-time P&L reporting.',
  'business', '#D4A017', 'BarChart3',
  ARRAY['دفتر الأستاذ','الامتثال الضريبي','القيود المحاسبية','تقارير الربح والخسارة'],
  ARRAY['General Ledger','Tax Compliance','Journal Entries','P&L Reports'],
  10
),
(
  'الموارد البشرية والحضور',
  'HR & Attendance',
  'حضور QR، مزامنة بيومترية، كشوف رواتب، ملفات موظفين، وإدارة الإجازات.',
  'QR-based attendance, biometric sync, payroll, employee profiles, and leave management.',
  'business', '#8B5CF6', 'Users',
  ARRAY['حضور QR','مزامنة بيومترية','كشوف الرواتب','إدارة الإجازات'],
  ARRAY['QR Attendance','Biometric Sync','Payroll','Leave Management'],
  20
),
(
  'البائع والتجارة',
  'Vendor & Commerce',
  'مجموعة تجارة إلكترونية كاملة مع محفظة، خصم رسوم تلقائي، طلبات دفع، وتتبع SKU.',
  'Full e-commerce suite with wallet, automatic fee deduction, payout requests, and SKU tracking.',
  'commerce', '#F97316', 'Wallet',
  ARRAY['محفظة البائع','خصم رسوم تلقائي','طلبات الدفع','تتبع SKU'],
  ARRAY['Vendor Wallet','Auto Fee Deduction','Payout Requests','SKU Tracking'],
  30
),
(
  'التسويق وإدارة العملاء',
  'Marketing & CRM',
  'خط عملاء Kanban، مدير حملات، تحليلات ROI، ودعم متعدد القنوات.',
  'Kanban lead pipeline, campaign manager, ROI analytics, and multi-channel support.',
  'marketing', '#EC4899', 'BarChart3',
  ARRAY['خط العملاء','مدير الحملات','تحليلات ROI','متعدد القنوات'],
  ARRAY['Lead Pipeline','Campaign Manager','ROI Analytics','Multi-channel'],
  40
),
(
  'وكلاء المحادثة الذكية',
  'AI Chat Agents',
  'وكلاء AI مدعومون بـGPT-4 مخصصون لكل براند مع تاريخ جلسات وتقييم رسائل وتدفق.',
  'GPT-4 powered brand-specific AI agents with session history, message rating, and streaming.',
  'tech', '#06B6D4', 'Bot',
  ARRAY['وكلاء مخصصون','تاريخ الجلسات','تقييم الرسائل','تدفق فوري'],
  ARRAY['Brand-specific Agents','Session History','Message Rating','Streaming'],
  50
),
(
  'بيئات عمل الشركاء',
  'Partner Workspaces',
  'بيئات عمل معزولة متعددة المستأجرين مع تفعيل قطاعات، إدارة فريق، وتشارك إيرادات.',
  'Isolated multi-tenant workspaces with sector activation, team management, and revenue sharing.',
  'business', '#6366F1', 'Building2',
  ARRAY['بيئة معزولة','تفعيل القطاعات','إدارة الفريق','تشارك الإيرادات'],
  ARRAY['Isolated Workspace','Sector Activation','Team Management','Revenue Sharing'],
  60
),
(
  'شبكة الوكلاء',
  'Agent Network',
  'تتبع العملاء، إدارة العمولات، خط حالة، ولوحة تحليلات الوكيل.',
  'Client tracking, commission management, status pipeline, and agent analytics dashboard.',
  'sales', '#10B981', 'Users',
  ARRAY['تتبع العملاء','إدارة العمولات','خط الحالة','التحليلات'],
  ARRAY['Client Tracking','Commission Mgmt','Status Pipeline','Analytics'],
  70
),
(
  'الأمان والامتثال',
  'Security & Compliance',
  'أمان على مستوى الصف (RLS)، توثيق متعدد الأدوار، سجلات التدقيق، القائمة البيضاء، SSO، و2FA.',
  'Row Level Security (RLS), multi-role auth, audit logs, IP whitelist, SSO, and 2FA.',
  'tech', '#EF4444', 'Shield',
  ARRAY['أمان RLS','توثيق متعدد الأدوار','سجلات التدقيق','SSO + 2FA'],
  ARRAY['Row Level Security','Multi-role Auth','Audit Logs','SSO + 2FA'],
  80
),
(
  'القطاعات الديناميكية',
  'Dynamic Sectors',
  'مصنع قطاعات يتحكم به المشرف لتفعيل/تعطيل وحدات الصناعات المتخصصة فوراً.',
  'Admin-controlled sector factory to activate/deactivate specialized industry modules instantly.',
  'business', '#F59E0B', 'Layers',
  ARRAY['مصنع القطاعات','تفعيل ديناميكي','وحدات الصناعات','تحكم إداري'],
  ARRAY['Sector Factory','Dynamic Activation','Industry Modules','Admin Control'],
  90
),
(
  'APIs مفتوحة وتكامل',
  'Open APIs & Integrations',
  'REST API، webhooks، وظائف Supabase edge، ونقاط نهاية مزامنة الأجهزة البيومترية.',
  'REST API, webhooks, Supabase edge functions, and biometric hardware sync endpoints.',
  'tech', '#A855F7', 'Code2',
  ARRAY['REST API','Webhooks','وظائف Edge','مزامنة بيومترية'],
  ARRAY['REST API','Webhooks','Edge Functions','Biometric Sync'],
  100
),

-- ── From Law 72/2017 ────────────────────────────────
(
  'صناعة تكنولوجيا المعلومات',
  'IT Industry Manufacturing',
  'تصنيع وتطوير المعدات الإلكترونية، إنشاء مراكز البيانات، وتقديم الحلول التقنية المتكاملة.',
  'Manufacturing and developing electronic equipment, establishing data centers, and providing integrated technology solutions.',
  'tech', '#3B82F6', 'Server',
  ARRAY['معدات إلكترونية','مراكز البيانات','حلول تقنية','بنية تحتية رقمية'],
  ARRAY['Electronic Equipment','Data Centers','Tech Solutions','Digital Infrastructure'],
  110
),
(
  'تطوير البرمجيات وقواعد البيانات',
  'Software & Database Development',
  'تطوير البرمجيات بمختلف أنواعها، بناء قواعد البيانات، وتطوير التطبيقات والتدريب عليها.',
  'Developing all types of software, building databases, app development and training.',
  'tech', '#8B5CF6', 'FileCode',
  ARRAY['تطوير البرمجيات','قواعد البيانات','تطبيقات الويب','تدريب تقني'],
  ARRAY['Software Dev','Database Design','Web Applications','Technical Training'],
  120
),
(
  'تصميم وإنتاج التطبيقات',
  'App Design & Production',
  'تصميم وإنتاج البرامج والتطبيقات المخصصة لقواعد البيانات ونظم المعلومات الإلكترونية.',
  'Custom design and production of software, apps, and electronic information systems.',
  'tech', '#06B6D4', 'Monitor',
  ARRAY['تطبيقات مخصصة','نظم المعلومات','واجهات المستخدم','تطوير موبايل'],
  ARRAY['Custom Apps','Information Systems','UI/UX Design','Mobile Development'],
  130
),
(
  'إنتاج المحتوى الرقمي',
  'Digital Content Production',
  'إنتاج المحتوى الإلكتروني بصوره المختلفة من صوت وصورة وبيانات ونصوص رقمية.',
  'Producing digital content in various forms including audio, video, data, and digital text.',
  'media', '#EC4899', 'Film',
  ARRAY['محتوى صوتي','محتوى مرئي','نصوص رقمية','وسائط متعددة'],
  ARRAY['Audio Content','Video Content','Digital Text','Multimedia'],
  140
),
(
  'إدخال البيانات الإلكترونية',
  'Electronic Data Entry',
  'خدمات إدخال البيانات على الحاسبات وبالوسائل الإلكترونية بدقة وكفاءة عالية.',
  'Professional data entry services for computers and electronic media with high accuracy.',
  'tech', '#F59E0B', 'Database',
  ARRAY['إدخال دقيق','معالجة البيانات','تحويل الوثائق','أرشفة إلكترونية'],
  ARRAY['Accurate Entry','Data Processing','Document Conversion','Digital Archiving'],
  150
),
(
  'تصميم نظم الحاسبات',
  'Computer Systems Design',
  'التوصيف والتصميم الشامل لنظم الحاسبات بمختلف أنواعها وتطبيقاتها.',
  'Comprehensive specification and design of computer systems of all types and applications.',
  'tech', '#10B981', 'Cpu',
  ARRAY['تصميم النظم','توصيف المعدات','تكامل الأجهزة','تحسين الأداء'],
  ARRAY['System Design','Hardware Spec','Hardware Integration','Performance Optimization'],
  160
),
(
  'النظم المدمجة والمضمنة',
  'Embedded & Integrated Systems',
  'إنتاج وتطوير النظم المدمجة والمضمنة وتشغيلها والتدريب عليها لمختلف التطبيقات.',
  'Production, development, and operation of embedded systems with technical training.',
  'tech', '#F97316', 'HardDrive',
  ARRAY['نظم مدمجة','برمجة الأجهزة','IoT','أتمتة صناعية'],
  ARRAY['Embedded Systems','Hardware Programming','IoT','Industrial Automation'],
  170
),
(
  'تصميم شبكات البيانات',
  'Data Network Design',
  'توصيف وتصميم شبكات نقل وتداول البيانات وفق أحدث المعايير التقنية.',
  'Specification and design of data transmission networks according to latest technical standards.',
  'telecom', '#6366F1', 'Network',
  ARRAY['تصميم الشبكات','هندسة الشبكات','بروتوكولات النقل','معايير تقنية'],
  ARRAY['Network Design','Network Architecture','Transfer Protocols','Technical Standards'],
  180
),
(
  'تنفيذ وإدارة شبكات البيانات',
  'Data Network Management',
  'تنفيذ وإدارة شبكات نقل وتداول البيانات مع ضمان الأداء العالي والأمان.',
  'Implementing and managing data transfer networks with guaranteed performance and security.',
  'telecom', '#14B8A6', 'Wifi',
  ARRAY['إدارة الشبكات','مراقبة الأداء','صيانة الشبكات','حماية البيانات'],
  ARRAY['Network Management','Performance Monitoring','Maintenance','Data Protection'],
  190
),
(
  'خدمات الاتصالات والانترنت',
  'Telecom & Internet Services',
  'تقديم خدمات الاتصالات والإنترنت الشاملة بأعلى معايير الجودة والموثوقية.',
  'Comprehensive telecom and internet services with the highest quality and reliability standards.',
  'telecom', '#3B82F6', 'Globe',
  ARRAY['خدمات إنترنت','اتصالات صوتية','بنية تحتية','دعم 24/7'],
  ARRAY['Internet Services','Voice Telecom','Infrastructure','24/7 Support'],
  200
),
(
  'حماية الملكية الفكرية والابتكار',
  'Intellectual Property & Innovation',
  'الاستثمار في تطوير حقوق الملكية الفكرية بما فيها براءات الاختراع والنماذج والرسوم الصناعية.',
  'Investing in intellectual property development including patents, models, and industrial designs.',
  'legal', '#EF4444', 'Award',
  ARRAY['براءات اختراع','حماية العلامات','الملكية الرقمية','استشارات قانونية'],
  ARRAY['Patents','Trademark Protection','Digital IP','Legal Consulting'],
  210
),
(
  'شبكات الاتصالات المتقدمة',
  'Advanced Telecom Networks',
  'إقامة وصيانة محطات وشبكات الاتصالات السلكية واللاسلكية وخدمات الإذاعة والتلفزيون.',
  'Establishing and maintaining wired/wireless telecom stations, networks, and broadcast services.',
  'telecom', '#A855F7', 'Wifi',
  ARRAY['شبكات لاسلكية','محطات اتصالات','بث إذاعي','تلفزيون رقمي'],
  ARRAY['Wireless Networks','Telecom Stations','Radio Broadcasting','Digital TV'],
  220
),
(
  'البحث والتطوير التقني',
  'Technology R&D',
  'أعمال البحث العلمي في التكنولوجيا الحديثة بما فيها علوم الفضاء والاستشعار عن بعد.',
  'Scientific research in modern technology including space sciences and remote sensing.',
  'tech', '#F59E0B', 'Search',
  ARRAY['بحث علمي','تطوير تقني','علوم الفضاء','استشعار عن بعد'],
  ARRAY['Scientific Research','Tech Development','Space Sciences','Remote Sensing'],
  230
),
(
  'مراكز التدريب التقني',
  'Technical Training Centers',
  'إنشاء وإدارة مراكز التدريب المتخصصة في مجالات تكنولوجيا المعلومات والاتصالات.',
  'Establishing and managing specialized training centers in IT and communications fields.',
  'business', '#10B981', 'BookOpen',
  ARRAY['تدريب تقني','شهادات معتمدة','مناهج متخصصة','تطوير مهني'],
  ARRAY['Technical Training','Certified Programs','Specialized Curriculum','Professional Development'],
  240
),
(
  'مراكز الأعمال التكنولوجية',
  'Technology Business Centers',
  'إنشاء وإدارة مراكز الأعمال التكنولوجية لدعم الشركات الناشئة والمؤسسات التقنية.',
  'Establishing and managing technology business centers to support startups and tech organizations.',
  'business', '#6366F1', 'Building2',
  ARRAY['بيئة أعمال','دعم الشركات الناشئة','خدمات إدارية','شبكات أعمال'],
  ARRAY['Business Environment','Startup Support','Admin Services','Business Networks'],
  250
),
(
  'تحويل المحتوى الرقمي',
  'Digital Content Conversion',
  'الأنشطة المتعلقة بتحويل المحتوى الرقمي من صور ونصوص وملفات سمعية بصرية.',
  'Activities related to converting digital content in visual, textual, and audio-visual forms.',
  'media', '#EC4899', 'Settings2',
  ARRAY['تحويل رقمي','معالجة ملفات','تحويل الصيغ','أرشفة رقمية'],
  ARRAY['Digital Conversion','File Processing','Format Conversion','Digital Archiving'],
  260
),

-- ── Outside Law 72 ──────────────────────────────────
(
  'التسويق الإلكتروني',
  'Digital Marketing',
  'خدمات التسويق الرقمي الشاملة عبر منصات التواصل الاجتماعي، محركات البحث، والبريد الإلكتروني.',
  'Comprehensive digital marketing services across social media, search engines, and email.',
  'marketing', '#EC4899', 'Megaphone',
  ARRAY['تسويق رقمي','إدارة حملات','SEO/SEM','تسويق بالمحتوى'],
  ARRAY['Digital Marketing','Campaign Management','SEO/SEM','Content Marketing'],
  270
),
(
  'إدارة المواقع الإلكترونية',
  'Website Management',
  'إنشاء وإدارة وصيانة المواقع الإلكترونية الاحترافية مع تحسين محركات البحث وتجربة المستخدم.',
  'Creating, managing, and maintaining professional websites with SEO and user experience optimization.',
  'tech', '#06B6D4', 'Globe',
  ARRAY['تصميم مواقع','صيانة وتطوير','تحسين SEO','تجربة مستخدم'],
  ARRAY['Web Design','Maintenance & Dev','SEO Optimization','User Experience'],
  280
),
(
  'التجارة الإلكترونية',
  'E-Commerce Solutions',
  'حلول التجارة الإلكترونية الشاملة من تصميم متجر إلى بوابات دفع وإدارة مخزون.',
  'Comprehensive e-commerce solutions from store design to payment gateways and inventory management.',
  'commerce', '#F97316', 'Package',
  ARRAY['متجر إلكتروني','بوابات دفع','إدارة مخزون','تتبع الطلبات'],
  ARRAY['Online Store','Payment Gateways','Inventory Management','Order Tracking'],
  290
),
(
  'خدمات التصدير والاستيراد',
  'Export & Import Services',
  'خدمات الاستيراد والتصدير الشاملة مع التخليص الجمركي وتوثيق الصفقات التجارية الدولية.',
  'Comprehensive import/export services with customs clearance and international trade documentation.',
  'commerce', '#D4A017', 'Truck',
  ARRAY['تصدير','استيراد','تخليص جمركي','توثيق تجاري'],
  ARRAY['Export','Import','Customs Clearance','Trade Documentation'],
  300
),
(
  'الإنتاج الفني والسينمائي والتلفزيوني',
  'Film, TV & Artistic Production',
  'الإنتاج الفني والتوزيع للأفلام السينمائية والتلفزيونية والمسرحية والمسلسلات والإعلانات.',
  'Artistic production and distribution of cinematic films, TV shows, theater, series, and commercials.',
  'media', '#A855F7', 'Film',
  ARRAY['إنتاج أفلام','إنتاج تلفزيوني','مسرح','إعلانات'],
  ARRAY['Film Production','TV Production','Theater','Commercials'],
  310
),
(
  'الأعمال الفنية والإبداعية',
  'Creative & Artistic Services',
  'الأعمال الفنية الشاملة من تصوير وصوت وميكساج ودوبلاج ومونتاج وتصحيح ألوان.',
  'Comprehensive artistic services including photography, sound, mixing, dubbing, editing, and color correction.',
  'media', '#EC4899', 'Camera',
  ARRAY['تصوير احترافي','مكساج صوتي','مونتاج','تصحيح ألوان'],
  ARRAY['Professional Photography','Audio Mixing','Video Editing','Color Correction'],
  320
),
(
  'التصوير والمؤثرات البصرية',
  'Photography & Visual Effects',
  'خدمات التصوير الاحترافي والتعديل والنسخ والمؤثرات البصرية لمختلف التطبيقات.',
  'Professional photography, editing, reproduction, and visual effects services for various applications.',
  'media', '#F59E0B', 'Camera',
  ARRAY['تصوير فوتوغرافي','تعديل صور','مؤثرات بصرية','ريتاشينج'],
  ARRAY['Photography','Photo Editing','Visual Effects','Retouching'],
  330
),

-- ── التوكيلات التجارية ──────────────────────────────
(
  'وكالة توزيع المنتجات',
  'Product Distribution Agency',
  'خدمات وكالة توزيع المنتجات المحلية والدولية مع شبكة موزعين معتمدين وتتبع لوجستي متكامل.',
  'Local and international product distribution agency with certified distributor network and integrated logistics tracking.',
  'agency', '#10B981', 'Package',
  ARRAY['توزيع محلي','توزيع دولي','شبكة موزعين','تتبع لوجستي'],
  ARRAY['Local Distribution','International Distribution','Distributor Network','Logistics Tracking'],
  340
),
(
  'وكالة التجارة الدولية',
  'International Trade Agency',
  'وكالة متخصصة في التجارة الدولية والتمثيل التجاري للشركات الأجنبية في السوق المصري.',
  'Agency specializing in international trade and commercial representation for foreign companies in the Egyptian market.',
  'agency', '#D4A017', 'Globe',
  ARRAY['تمثيل تجاري','تسويق دولي','إدارة العقود','استشارات تصدير'],
  ARRAY['Commercial Representation','International Marketing','Contract Management','Export Consulting'],
  350
),
(
  'وكالة الخدمات اللوجستية',
  'Logistics Services Agency',
  'وكالة شحن ولوجستيات متكاملة تشمل النقل البري والبحري والجوي وخدمات التخزين.',
  'Integrated shipping and logistics agency including land, sea, and air transport and storage services.',
  'agency', '#3B82F6', 'Truck',
  ARRAY['شحن دولي','نقل بري','تخزين','تتبع الشحنات'],
  ARRAY['International Shipping','Land Transport','Storage','Shipment Tracking'],
  360
),
(
  'وكالة التسويق والإعلان',
  'Marketing & Advertising Agency',
  'وكالة إبداعية متخصصة في التسويق والإعلان الرقمي والتقليدي وبناء الهوية البصرية.',
  'Creative agency specializing in digital and traditional marketing, advertising, and visual identity building.',
  'agency', '#EC4899', 'Megaphone',
  ARRAY['هوية بصرية','إعلانات رقمية','تسويق تقليدي','إدارة علامة تجارية'],
  ARRAY['Visual Identity','Digital Advertising','Traditional Marketing','Brand Management'],
  370
),
(
  'وكالة البرمجيات والتقنية',
  'Software & Technology Agency',
  'وكالة حصرية لتمثيل وتوزيع حلول البرمجيات والتقنية العالمية في السوق المصري والعربي.',
  'Exclusive agency for representing and distributing global software and technology solutions in the Egyptian and Arab market.',
  'agency', '#8B5CF6', 'Code2',
  ARRAY['توزيع برمجيات','دعم تقني','تمثيل حصري','تدريب وتنفيذ'],
  ARRAY['Software Distribution','Technical Support','Exclusive Representation','Training & Implementation'],
  380
)

ON CONFLICT DO NOTHING;
