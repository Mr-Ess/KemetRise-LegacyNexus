-- ══════════════════════════════════════════════════════════════════
--  add_infra_products — 7 infrastructure / cloud / security items
--  Mirrors infra1–infra7 in PublicProducts.tsx ALL_ITEMS array.
--  Safe to run multiple times (ON CONFLICT DO UPDATE).
-- ══════════════════════════════════════════════════════════════════

INSERT INTO public.website_products
  (id, type, category, category_ar, sub_category, sub_category_ar,
   name, name_ar, description, description_ar,
   price_cents, pricing_model, icon, color,
   rating, reviews_count, is_featured, is_new,
   features, features_ar, sort_order, is_active)
VALUES

-- ── 1. Smart Shared Hosting ────────────────────────────────────────
( 'infra1', 'subscription', 'Cloud & Hosting', 'سحابة واستضافة',
  'Shared Hosting', 'استضافة مشتركة',
  'Smart Shared Hosting', 'الاستضافة المشتركة الذكية',
  'Feature-rich hosting for websites and emerging systems with flexible control panels, pre-wired for direct integration and rapid automation.',
  'استضافة متكاملة للمواقع والأنظمة الناشئة مع لوحات تحكم مرنة، مهيأة للربط المباشر والأتمتة السريعة.',
  1500, 'monthly', '🌐', '#06b6d4',
  4.6, 87, false, true,
  ARRAY['cPanel/DirectAdmin','Free SSL','Unlimited Email','1-Click WordPress','Daily Backup','99.9% Uptime SLA'],
  ARRAY['لوحة تحكم مرنة','SSL مجاني','بريد غير محدود','تثبيت WordPress بنقرة','نسخ احتياطي يومي','ضمان 99.9% تشغيل'],
  100, true ),

-- ── 2. Managed Cloud VPS ──────────────────────────────────────────
( 'infra2', 'virtual', 'Cloud & Hosting', 'سحابة واستضافة',
  'VPS', 'خوادم افتراضية',
  'Managed Cloud VPS', 'خوادم افتراضية سحابية مدارة',
  'Fully isolated virtual servers with dedicated resources and full root access, optimized for running digital workforce empires and enterprise-grade systems.',
  'خوادم افتراضية معزولة بالكامل بموارد مخصصة وصلاحيات root كاملة، مهيأة لتشغيل إمبراطورية العمالة الرقمية والأنظمة المركزية.',
  2900, 'monthly', '⚡', '#8b5cf6',
  4.7, 112, true, false,
  ARRAY['Dedicated vCPU & RAM','Full Root Access','SSD NVMe Storage','Managed Firewall','Auto-scaling','24/7 Monitoring'],
  ARRAY['موارد vCPU & RAM مخصصة','صلاحيات root كاملة','تخزين SSD NVMe','جدار حماية مُدار','توسع تلقائي','مراقبة 24/7'],
  101, true ),

-- ── 3. Dedicated Enterprise Servers ───────────────────────────────
( 'infra3', 'physical', 'Cloud & Hosting', 'سحابة واستضافة',
  'Dedicated Servers', 'خوادم مخصصة',
  'Dedicated Enterprise Servers', 'الخوادم الفيزيائية المخصصة',
  'Rent complete bare-metal servers inside data centers for maximum performance and privacy for large enterprises and business conglomerates.',
  'تأجير خوادم حقيقية كاملة داخل مراكز البيانات لضمان أعلى مستويات الأداء والخصوصية لبيانات الشركات الكبرى والتكتلات التجارية.',
  19900, 'monthly', '🖥️', '#f59e0b',
  4.8, 45, true, false,
  ARRAY['Bare Metal Hardware','Dedicated Bandwidth','RAID Storage','Hardware Firewall','Remote KVM Access','99.99% SLA'],
  ARRAY['عتاد خاص بالكامل','باندويث مخصص','تخزين RAID','جدار حماية عتادي','وصول KVM عن بُعد','ضمان 99.99%'],
  102, true ),

-- ── 4. Domain Name Hub ────────────────────────────────────────────
( 'infra4', 'subscription', 'Domains', 'النطاقات',
  'Domain Names', 'أسماء النطاقات',
  'Domain Name Hub', 'حجز وإدارة النطاقات الرقمية',
  'Register and secure domain names (international & local) with instant automated DNS server records binding.',
  'حجز وتأمين أسماء النطاقات والمواقع الرسمية (الدولية والمحلية) مع ربط فوري ومؤتمت بسجلات خوادم الأسماء.',
  1200, 'annual', '🌍', '#22c55e',
  4.5, 210, false, true,
  ARRAY['.com / .net / .org','.eg Local Domains','Free DNS Management','WHOIS Privacy','Auto-renewal','Domain Transfer In'],
  ARRAY['.com / .net / .org','نطاقات .eg المحلية','إدارة DNS مجانية','خصوصية WHOIS','تجديد تلقائي','نقل نطاق سهل'],
  103, true ),

-- ── 5. Business Email Suites ──────────────────────────────────────
( 'infra5', 'subscription', 'Email', 'البريد الإلكتروني',
  'Business Email', 'بريد الأعمال',
  'Business Email Suites', 'استضافة البريد الإلكتروني الاحترافي',
  'Dedicated, secure mail servers under your company name to boost credibility and enable automated messaging campaigns.',
  'سيرفرات بريد إلكتروني مستقلة ومحمية باسم شركتك لتعزيز الموثوقية وتسهيل حملات المراسلة المؤتمتة.',
  800, 'monthly', '📧', '#3b82f6',
  4.6, 178, false, false,
  ARRAY['Custom Domain Email','Anti-spam & Anti-virus','50 GB Mailbox','Email Forwarding','Webmail Access','SMTP/IMAP/POP3'],
  ARRAY['بريد بنطاقك الخاص','حماية من البريد المزعج','صندوق بريد 50 جيجا','إعادة توجيه البريد','Webmail متاح','دعم SMTP/IMAP/POP3'],
  104, true ),

-- ── 6. Cyber Security & SOC ───────────────────────────────────────
( 'infra6', 'service', 'Technology', 'تقنية',
  'SOC', 'مركز العمليات الأمنية',
  'Cyber Security & SOC Center', 'مركز العمليات الأمنية والدرع السيبراني',
  'Round-the-clock vulnerability monitoring and scanning to protect software and defend against DDoS attacks for complete digital sovereignty.',
  'مراقبة وفحص الثغرات على مدار الساعة لحماية البرمجيات وصد هجمات حجب الخدمة DDoS لضمان السيادة الرقمية الكاملة.',
  NULL, NULL, '🛡️', '#ef4444',
  4.9, 33, false, true,
  ARRAY['24/7 SOC Monitoring','DDoS Protection','Vulnerability Scanning','Incident Response','Threat Intelligence','Compliance Reports'],
  ARRAY['مراقبة SOC 24/7','حماية DDoS','فحص الثغرات','الاستجابة للحوادث','استخبارات التهديدات','تقارير الامتثال'],
  105, true ),

-- ── 7. Disaster Recovery & Backup ────────────────────────────────
( 'infra7', 'subscription', 'Cloud & Hosting', 'سحابة واستضافة',
  'Backup & DR', 'نسخ احتياطي وتعافٍ',
  'Disaster Recovery & Backup', 'النسخ الاحتياطي واستمرارية الأعمال',
  'Periodic encrypted backup systems ensuring instant data recovery in emergencies without any system downtime.',
  'أنظمة تأمين وحفظ نسخ احتياطية دورية مشفرة لضمان استرجاع البيانات الفوري في حالات الطوارئ دون توقف النظام.',
  2900, 'monthly', '🔒', '#14b8a6',
  4.8, 64, false, false,
  ARRAY['Encrypted Backups','Point-in-time Recovery','Automated Schedules','Cross-region Replication','Instant Failover','99.99% RPO SLA'],
  ARRAY['نسخ مشفرة','استرجاع لحظي','جداول تلقائية','نسخ متعدد المناطق','تحويل فوري','ضمان RPO 99.99%'],
  106, true )

ON CONFLICT (id) DO UPDATE SET
  type           = EXCLUDED.type,
  category       = EXCLUDED.category,
  category_ar    = EXCLUDED.category_ar,
  sub_category   = EXCLUDED.sub_category,
  sub_category_ar = EXCLUDED.sub_category_ar,
  name           = EXCLUDED.name,
  name_ar        = EXCLUDED.name_ar,
  description    = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  price_cents    = EXCLUDED.price_cents,
  pricing_model  = EXCLUDED.pricing_model,
  icon           = EXCLUDED.icon,
  color          = EXCLUDED.color,
  rating         = EXCLUDED.rating,
  reviews_count  = EXCLUDED.reviews_count,
  is_featured    = EXCLUDED.is_featured,
  is_new         = EXCLUDED.is_new,
  features       = EXCLUDED.features,
  features_ar    = EXCLUDED.features_ar,
  sort_order     = EXCLUDED.sort_order,
  is_active      = EXCLUDED.is_active,
  updated_at     = now();
