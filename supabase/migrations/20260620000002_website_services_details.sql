-- ────────────────────────────────────────────────────────────
-- Update website_services with rich, detailed content
-- for all 38 services
-- ────────────────────────────────────────────────────────────

-- 1. ERP & Finance
UPDATE public.website_services SET
  desc_ar = 'نظام ERP مالي متكامل يوفر محاسبة احترافية كاملة للشركات بجميع أحجامها. يشمل دفتر الأستاذ العام، إدارة الفواتير والمدفوعات، التقارير الضريبية، تحليل التدفق النقدي، وتقارير الربح والخسارة الفورية. مثالي لمن يحتاج رقابة مالية دقيقة وتقارير لحظية.',
  desc_en = 'A fully integrated ERP finance system providing professional accounting for businesses of all sizes. Includes general ledger, invoice and payment management, tax reporting, cash flow analysis, and real-time P&L. Ideal for those needing precise financial oversight and instant reports.',
  features_ar = ARRAY[
    'دفتر الأستاذ العام مع قيود يومية',
    'فواتير البيع والشراء والمصروفات',
    'تقارير ضريبية ورقم استحقاق الضريبة',
    'تحليل التدفق النقدي والميزانية',
    'تقرير الربح والخسارة اليومي/الشهري/السنوي',
    'ميزان المراجعة والقوائم المالية',
    'إدارة مراكز التكلفة والمشاريع',
    'دعم العملات المتعددة والصرف الأجنبي'
  ],
  features_en = ARRAY[
    'General ledger with journal entries',
    'Sales, purchase & expense invoices',
    'Tax reports and VAT computation',
    'Cash flow analysis and budgeting',
    'Daily/monthly/annual P&L reports',
    'Trial balance and financial statements',
    'Cost center and project management',
    'Multi-currency and forex support'
  ]
WHERE name_en = 'ERP & Finance';

-- 2. HR & Attendance
UPDATE public.website_services SET
  desc_ar = 'نظام متكامل لإدارة الموارد البشرية والحضور والانصراف. يدعم تسجيل الحضور عبر QR Code والأجهزة البيومترية، إدارة كشوف الرواتب والخصومات والبدلات، إدارة الإجازات والغيابات، وتقييم أداء الموظفين. يوفر تقارير شاملة لإدارة القوى العاملة.',
  desc_en = 'An integrated HR, attendance, and payroll management system. Supports attendance via QR Code and biometric devices, payroll with deductions and allowances, leave and absence management, and employee performance evaluation. Provides comprehensive workforce management reports.',
  features_ar = ARRAY[
    'حضور وانصراف بكود QR أو بصمة',
    'كشوف الرواتب مع الخصومات والبدلات والمكافآت',
    'إدارة الإجازات السنوية والمرضية والطارئة',
    'ملف شامل لكل موظف مع تاريخ الترقيات',
    'تقارير الغيابات والتأخيرات اليومية والشهرية',
    'تقييم الأداء الدوري ووضع أهداف',
    'التكامل مع الأجهزة البيومترية',
    'نظام إشعارات للموظفين والمديرين'
  ],
  features_en = ARRAY[
    'QR code and biometric attendance',
    'Payroll with deductions, allowances & bonuses',
    'Annual, sick and emergency leave management',
    'Comprehensive employee profile with promotion history',
    'Daily/monthly absence and lateness reports',
    'Performance appraisal and goal setting',
    'Biometric device integration',
    'Employee and manager notification system'
  ]
WHERE name_en = 'HR & Attendance';

-- 3. Vendor & Commerce
UPDATE public.website_services SET
  desc_ar = 'منصة تجارة إلكترونية متكاملة للبائعين والموردين. تشمل محفظة إلكترونية للبائع مع خصم عمولات تلقائي، طلبات سحب الأرباح، إدارة المنتجات بكود SKU، تتبع المخزون، وإدارة الطلبات والشحنات. تمكّن البائع من إدارة متجره بشكل احترافي.',
  desc_en = 'Comprehensive e-commerce platform for vendors and suppliers. Includes vendor e-wallet with automatic commission deduction, profit withdrawal requests, SKU-based product management, inventory tracking, and order/shipment management. Empowers vendors to manage their store professionally.',
  features_ar = ARRAY[
    'محفظة إلكترونية للبائع مع كشف حساب',
    'خصم عمولة المنصة تلقائياً',
    'طلبات سحب أرباح مع نظام موافقة',
    'إدارة المنتجات بـ SKU وباركود',
    'تتبع المخزون وتنبيهات النفاد',
    'إدارة الطلبات من الاستلام حتى التسليم',
    'نظام تقييمات وتعليقات العملاء',
    'لوحة إحصائيات المبيعات التفصيلية'
  ],
  features_en = ARRAY[
    'Vendor e-wallet with account statements',
    'Automatic platform commission deduction',
    'Profit withdrawal requests with approval system',
    'SKU and barcode product management',
    'Inventory tracking with stock alerts',
    'Order management from receipt to delivery',
    'Customer reviews and ratings system',
    'Detailed sales analytics dashboard'
  ]
WHERE name_en = 'Vendor & Commerce';

-- 4. Marketing & CRM
UPDATE public.website_services SET
  desc_ar = 'نظام إدارة علاقات العملاء والتسويق المتكامل. يتضمن خط مبيعات Kanban لتتبع العملاء المحتملين، إدارة الحملات التسويقية متعددة القنوات، تحليلات ROI للحملات، وأتمتة رسائل المتابعة. يساعد فريق التسويق على زيادة المبيعات وتحسين معدلات التحويل.',
  desc_en = 'Integrated CRM and marketing management system. Includes Kanban sales pipeline for lead tracking, multi-channel campaign management, campaign ROI analytics, and follow-up message automation. Helps marketing teams increase sales and improve conversion rates.',
  features_ar = ARRAY[
    'خط مبيعات Kanban لإدارة العملاء المحتملين',
    'إدارة حملات تسويقية متعددة القنوات',
    'تحليلات ROI وتقييم أداء الحملات',
    'أتمتة رسائل المتابعة عبر البريد والواتساب',
    'تقسيم العملاء وبناء قوائم مستهدفة',
    'تتبع تاريخ التواصل مع كل عميل',
    'تقارير المبيعات والتوقعات المستقبلية',
    'نماذج جمع بيانات العملاء المحتملين'
  ],
  features_en = ARRAY[
    'Kanban pipeline for lead management',
    'Multi-channel campaign management',
    'Campaign ROI analytics and performance',
    'Follow-up automation via email and WhatsApp',
    'Customer segmentation and targeted lists',
    'Complete customer interaction history',
    'Sales reports and future forecasting',
    'Lead capture forms'
  ]
WHERE name_en = 'Marketing & CRM';

-- 5. AI Chat Agents
UPDATE public.website_services SET
  desc_ar = 'وكلاء محادثة ذكية مدعومون بتقنية GPT-4 مخصصون لكل علامة تجارية. يردون على استفسارات العملاء على مدار 24 ساعة، يحتفظون بتاريخ المحادثات، يدعمون اللغة العربية والإنجليزية، ويمكن تدريبهم على بيانات عملك الخاصة. يقلل من أعباء خدمة العملاء بنسبة تصل 70%.',
  desc_en = 'GPT-4 powered AI chat agents customized per brand. They respond to customer inquiries 24/7, maintain conversation history, support Arabic and English, and can be trained on your business-specific data. Reduces customer service workload by up to 70%.',
  features_ar = ARRAY[
    'وكيل AI مخصص لكل علامة تجارية',
    'دعم عملاء 24/7 بدون توقف',
    'تاريخ محادثات محفوظ لكل عميل',
    'دعم اللغة العربية والإنجليزية',
    'تدريب الوكيل على بيانات عملك',
    'تقييم جودة الردود من العملاء',
    'تدفق الردود فوري (Streaming)',
    'تحويل المحادثة لموظف بشري عند الحاجة'
  ],
  features_en = ARRAY[
    'AI agent customized per brand',
    '24/7 customer support without interruption',
    'Saved conversation history per customer',
    'Arabic and English language support',
    'Agent training on your business data',
    'Customer response quality rating',
    'Real-time response streaming',
    'Human handoff when needed'
  ]
WHERE name_en = 'AI Chat Agents';

-- 6. Partner Workspaces
UPDATE public.website_services SET
  desc_ar = 'بيئات عمل معزولة ومستقلة لكل شريك تجاري. كل شريك يحصل على مساحة عمل خاصة معزولة تماماً تشمل إدارة علاماته التجارية وفريق العمل والقطاعات المفعلة وتقارير الإيرادات. يدعم تعدد المستأجرين مع ضمان أمان وخصوصية بيانات كل شريك.',
  desc_en = 'Fully isolated and independent workspaces for each business partner. Each partner gets their own completely isolated workspace including brand management, team management, activated sectors, and revenue reports. Supports multi-tenancy with guaranteed data security and privacy for each partner.',
  features_ar = ARRAY[
    'بيئة عمل معزولة تماماً لكل شريك',
    'إدارة علامات تجارية متعددة',
    'تفعيل القطاعات المخصصة للشريك',
    'إدارة فريق العمل والصلاحيات',
    'تقارير إيرادات ومبيعات خاصة',
    'كود عمل فريد لكل شريك',
    'دعم متعدد المستأجرين (Multi-tenant)',
    'نظام موافقة وإدارة الشركاء'
  ],
  features_en = ARRAY[
    'Fully isolated workspace per partner',
    'Multiple brand management',
    'Partner-specific sector activation',
    'Team management and permissions',
    'Private revenue and sales reports',
    'Unique workspace code per partner',
    'Multi-tenant architecture',
    'Partner approval and management system'
  ]
WHERE name_en = 'Partner Workspaces';

-- 7. Agent Network
UPDATE public.website_services SET
  desc_ar = 'نظام متكامل لإدارة شبكة الوكلاء والمندوبين. يتيح تتبع عملاء كل وكيل، إدارة عمولاته وسحب أرباحه، متابعة خط سير الصفقات، وقياس أداء كل وكيل. مثالي للشركات التي تعمل بنظام الوكلاء والمندوبين الميدانيين.',
  desc_en = 'Comprehensive system for managing agent and representative networks. Enables tracking each agent''s clients, managing commissions and profit withdrawals, monitoring deal pipelines, and measuring each agent''s performance. Ideal for companies operating with field agents and representatives.',
  features_ar = ARRAY[
    'ملف شامل لكل وكيل ومنطقته',
    'تتبع عملاء كل وكيل ومتابعتهم',
    'حساب العمولات تلقائياً',
    'طلبات سحب أرباح الوكلاء',
    'خط مبيعات لمتابعة الصفقات',
    'تقارير أداء كل وكيل',
    'نظام إشعارات للوكلاء',
    'لوحة تحليلية لمقارنة أداء الوكلاء'
  ],
  features_en = ARRAY[
    'Comprehensive profile per agent and territory',
    'Client tracking and follow-up per agent',
    'Automatic commission calculation',
    'Agent profit withdrawal requests',
    'Sales pipeline for deal tracking',
    'Per-agent performance reports',
    'Agent notification system',
    'Analytics dashboard to compare agent performance'
  ]
WHERE name_en = 'Agent Network';

-- 8. Security & Compliance
UPDATE public.website_services SET
  desc_ar = 'منظومة أمان شاملة تحمي بيانات عملك. تشمل أمان على مستوى الصف (RLS)، توثيق متعدد العوامل 2FA، تسجيل دخول موحد SSO، قائمة IP البيضاء، سجلات تدقيق كاملة لكل عملية، وإدارة صلاحيات دقيقة لكل دور. متوافق مع معايير حماية البيانات الدولية.',
  desc_en = 'Comprehensive security system protecting your business data. Includes row-level security (RLS), two-factor authentication (2FA), single sign-on (SSO), IP whitelist, complete audit logs for every operation, and granular permission management per role. Compliant with international data protection standards.',
  features_ar = ARRAY[
    'أمان على مستوى الصف (Row Level Security)',
    'توثيق ثنائي العوامل (2FA)',
    'تسجيل دخول موحد (SSO)',
    'قائمة IP البيضاء والحظر التلقائي',
    'سجلات تدقيق كاملة لكل عملية',
    'إدارة أدوار وصلاحيات دقيقة',
    'تشفير البيانات في الراحة والنقل',
    'إشعارات فورية عند محاولات الاختراق'
  ],
  features_en = ARRAY[
    'Row Level Security (RLS)',
    'Two-factor authentication (2FA)',
    'Single sign-on (SSO)',
    'IP whitelist and auto-blocking',
    'Complete audit logs for all operations',
    'Granular role and permission management',
    'Data encryption at rest and in transit',
    'Instant alerts on breach attempts'
  ]
WHERE name_en = 'Security & Compliance';

-- 9. Dynamic Sectors
UPDATE public.website_services SET
  desc_ar = 'مصنع قطاعات ديناميكي يتيح للمشرف تفعيل وتعطيل وحدات صناعات متخصصة فوراً. سواء كنت في مجال التجزئة، المطاعم، العيادات، التعليم أو أي قطاع آخر - يمكنك تفعيل الوحدات المناسبة فقط. كل قطاع يأتي بأدوات وتقارير مخصصة لطبيعة نشاطه.',
  desc_en = 'A dynamic sector factory allowing admins to instantly activate/deactivate specialized industry modules. Whether in retail, restaurants, clinics, education, or any other sector — activate only the relevant modules. Each sector comes with dedicated tools and reports tailored to its nature.',
  features_ar = ARRAY[
    'تفعيل/تعطيل القطاعات فورياً',
    'وحدات مخصصة لكل صناعة',
    'قطاعات جاهزة: تجزئة، مطاعم، عيادات، تعليم',
    'أدوات وتقارير مخصصة لكل قطاع',
    'تحكم إداري كامل في إدارة القطاعات',
    'تخصيص القطاعات لكل شريك',
    'إضافة قطاعات جديدة بمرونة',
    'وحدات تكامل بين القطاعات المختلفة'
  ],
  features_en = ARRAY[
    'Instant sector activation/deactivation',
    'Modules customized per industry',
    'Ready sectors: retail, restaurants, clinics, education',
    'Dedicated tools and reports per sector',
    'Full admin control over sector management',
    'Sector customization per partner',
    'Flexible new sector addition',
    'Cross-sector integration modules'
  ]
WHERE name_en = 'Dynamic Sectors';

-- 10. Open APIs & Integrations
UPDATE public.website_services SET
  desc_ar = 'واجهات برمجية مفتوحة وشاملة لتكامل أنظمتك الخارجية مع المنصة. يدعم REST API كامل، Webhooks للأحداث الفورية، وظائف Supabase Edge للمعالجة المتقدمة، ومزامنة الأجهزة البيومترية. يمكّن المطورين من بناء تكاملات مخصصة بكل مرونة.',
  desc_en = 'Open and comprehensive APIs for integrating your external systems with the platform. Supports full REST API, webhooks for real-time events, Supabase Edge Functions for advanced processing, and biometric device synchronization. Empowers developers to build custom integrations with full flexibility.',
  features_ar = ARRAY[
    'REST API كامل مع توثيق تفاعلي',
    'Webhooks للأحداث الفورية',
    'وظائف Supabase Edge للمنطق المخصص',
    'مزامنة الأجهزة البيومترية',
    'مفاتيح API مع صلاحيات مخصصة',
    'سجل طلبات API والمراقبة',
    'دعم GraphQL وREST معاً',
    'SDK جاهز لـ JavaScript وPython'
  ],
  features_en = ARRAY[
    'Full REST API with interactive documentation',
    'Webhooks for real-time events',
    'Supabase Edge Functions for custom logic',
    'Biometric device synchronization',
    'API keys with custom permissions',
    'API request logging and monitoring',
    'GraphQL and REST support',
    'Ready SDK for JavaScript and Python'
  ]
WHERE name_en = 'Open APIs & Integrations';

-- 11. IT Industry Manufacturing
UPDATE public.website_services SET
  desc_ar = 'خدمات متكاملة في صناعة تكنولوجيا المعلومات تشمل تصنيع وتوريد المعدات الإلكترونية والأجهزة التقنية، تصميم وإنشاء مراكز البيانات والخوادم، وتقديم حلول البنية التحتية الرقمية الشاملة للشركات والمؤسسات الحكومية.',
  desc_en = 'Integrated IT industry services including manufacturing and supplying electronic equipment and technical devices, designing and building data centers and servers, and providing comprehensive digital infrastructure solutions for businesses and government institutions.',
  features_ar = ARRAY[
    'توريد وتصنيع المعدات الإلكترونية',
    'تصميم وإنشاء مراكز البيانات',
    'حلول خوادم وتخزين البيانات',
    'بنية تحتية شبكية متكاملة',
    'أنظمة تبريد وطاقة لمراكز البيانات',
    'خدمات صيانة وضمان المعدات',
    'استشارات الأجهزة والبنية التحتية',
    'حلول حماية ضد الكوارث (DR)'
  ],
  features_en = ARRAY[
    'Electronic equipment supply and manufacturing',
    'Data center design and construction',
    'Server and data storage solutions',
    'Integrated network infrastructure',
    'Cooling and power systems for data centers',
    'Equipment maintenance and warranty services',
    'Hardware and infrastructure consulting',
    'Disaster recovery (DR) solutions'
  ]
WHERE name_en = 'IT Industry Manufacturing';

-- 12. Software & Database Development
UPDATE public.website_services SET
  desc_ar = 'تطوير برمجيات مخصصة وبناء قواعد بيانات احترافية لجميع أنواع الأعمال. نقدم تطوير تطبيقات ويب وموبايل، تصميم قواعد بيانات عالية الأداء، تطوير أنظمة ERP وCRM مخصصة، ونقل وهجرة البيانات بين الأنظمة مع برامج تدريب وتأهيل الفريق.',
  desc_en = 'Custom software development and professional database building for all business types. We offer web and mobile application development, high-performance database design, custom ERP and CRM development, data migration between systems, and team training programs.',
  features_ar = ARRAY[
    'تطوير تطبيقات الويب والموبايل المخصصة',
    'تصميم قواعد بيانات عالية الأداء',
    'تطوير أنظمة ERP وCRM مخصصة',
    'نقل وهجرة البيانات بين الأنظمة',
    'تطوير واجهات برمجية (API)',
    'اختبار الجودة وضمان الأداء',
    'برامج تدريب وتأهيل الفريق التقني',
    'صيانة وتطوير مستمر للأنظمة'
  ],
  features_en = ARRAY[
    'Custom web and mobile app development',
    'High-performance database design',
    'Custom ERP and CRM development',
    'Data migration between systems',
    'API development',
    'Quality assurance and performance testing',
    'Technical team training programs',
    'Ongoing system maintenance and development'
  ]
WHERE name_en = 'Software & Database Development';

-- 13. App Design & Production
UPDATE public.website_services SET
  desc_ar = 'تصميم وإنتاج تطبيقات احترافية بتجربة مستخدم استثنائية. نقدم تصميم UI/UX متكامل، نماذج أولية تفاعلية، تطوير تطبيقات iOS وAndroid، تطبيقات الويب التقدمية (PWA)، وأنظمة إدارة المحتوى. نضمن أداءً عالياً وتجربة مستخدم سلسة.',
  desc_en = 'Professional app design and production with exceptional user experience. We offer complete UI/UX design, interactive prototypes, iOS and Android app development, Progressive Web Apps (PWA), and content management systems. We guarantee high performance and smooth user experience.',
  features_ar = ARRAY[
    'تصميم UI/UX متكامل واحترافي',
    'نماذج أولية تفاعلية (Prototypes)',
    'تطوير تطبيقات iOS وAndroid',
    'تطبيقات الويب التقدمية (PWA)',
    'أنظمة إدارة المحتوى (CMS)',
    'تحسين سرعة الأداء والاستجابة',
    'تصميم متوافق مع جميع الشاشات',
    'اختبار التطبيق على أجهزة حقيقية'
  ],
  features_en = ARRAY[
    'Complete and professional UI/UX design',
    'Interactive prototypes',
    'iOS and Android app development',
    'Progressive Web Apps (PWA)',
    'Content Management Systems (CMS)',
    'Performance and responsiveness optimization',
    'Cross-screen compatible design',
    'Real device app testing'
  ]
WHERE name_en = 'App Design & Production';

-- 14. Digital Content Production
UPDATE public.website_services SET
  desc_ar = 'إنتاج محتوى رقمي احترافي ومتنوع لجميع المنصات. نقدم كتابة محتوى نصي وتسويقي، تصميم إنفوغرافيك ورسوم متحركة، إنتاج فيديو وبودكاست، محتوى وسائل التواصل الاجتماعي، وترجمة ومراجعة المحتوى. محتوى يجذب جمهورك ويقوي حضورك الرقمي.',
  desc_en = 'Professional and diverse digital content production for all platforms. We offer copywriting and marketing content, infographic and animation design, video and podcast production, social media content, and translation and content review. Content that attracts your audience and strengthens your digital presence.',
  features_ar = ARRAY[
    'كتابة محتوى تسويقي ونصوص إعلانية',
    'تصميم إنفوغرافيك ورسوم متحركة',
    'إنتاج فيديوهات تعليمية وترويجية',
    'محتوى وسائل التواصل الاجتماعي',
    'إنتاج بودكاست وملفات صوتية',
    'ترجمة المحتوى عربي/إنجليزي',
    'تحرير ومراجعة المحتوى',
    'خطة محتوى شهرية متكاملة'
  ],
  features_en = ARRAY[
    'Copywriting and advertising texts',
    'Infographic and animation design',
    'Educational and promotional video production',
    'Social media content',
    'Podcast and audio file production',
    'Arabic/English content translation',
    'Content editing and review',
    'Integrated monthly content plan'
  ]
WHERE name_en = 'Digital Content Production';

-- 15. Electronic Data Entry
UPDATE public.website_services SET
  desc_ar = 'خدمات إدخال بيانات إلكترونية احترافية بدقة ومصداقية عالية. نقدم إدخال البيانات من الوثائق الورقية والمسح الضوئي، تحويل الملفات بين الصيغ المختلفة، أرشفة الوثائق إلكترونياً، معالجة البيانات الكبيرة، والتحقق من دقة البيانات. خدمة سريعة وسرية.',
  desc_en = 'Professional electronic data entry services with high accuracy and reliability. We offer data entry from paper documents and scanning, file format conversion, electronic document archiving, big data processing, and data accuracy verification. Fast and confidential service.',
  features_ar = ARRAY[
    'إدخال بيانات من وثائق ورقية ومسح ضوئي',
    'تحويل ملفات PDF إلى Excel وWord',
    'أرشفة وثائق إلكترونية منظمة',
    'معالجة قواعد البيانات الكبيرة',
    'التحقق من دقة البيانات ومراجعتها',
    'إدخال بيانات بالعربية والإنجليزية',
    'معالجة النماذج والاستبيانات',
    'سرية تامة وعدم إفشاء البيانات'
  ],
  features_en = ARRAY[
    'Data entry from paper documents and scanning',
    'PDF to Excel and Word conversion',
    'Organized electronic document archiving',
    'Large database processing',
    'Data accuracy verification and review',
    'Data entry in Arabic and English',
    'Form and survey processing',
    'Full confidentiality and data protection'
  ]
WHERE name_en = 'Electronic Data Entry';

-- 16. Computer Systems Design
UPDATE public.website_services SET
  desc_ar = 'تصميم وهندسة أنظمة الحاسبات الشاملة للمؤسسات والشركات. نقدم تصميم معمارية النظام، اختيار المواصفات التقنية المناسبة، تكامل الأجهزة والبرمجيات، تحسين الأداء والسعة، واستشارات التوسع والترقية. حلول مصممة لتلبية احتياجات عملك الآن وفي المستقبل.',
  desc_en = 'Comprehensive computer systems design and engineering for enterprises and businesses. We offer system architecture design, appropriate technical specification selection, hardware and software integration, performance and capacity optimization, and scaling and upgrade consulting. Solutions designed to meet your business needs now and in the future.',
  features_ar = ARRAY[
    'تصميم معمارية النظام الشامل',
    'اختيار المواصفات التقنية المناسبة',
    'تكامل الأجهزة والبرمجيات',
    'تحسين الأداء وزيادة السعة',
    'استشارات التوسع والترقية',
    'توثيق النظام والمخططات التقنية',
    'اختبار وقبول الأنظمة',
    'خطط صيانة وضمان الاستمرارية'
  ],
  features_en = ARRAY[
    'Comprehensive system architecture design',
    'Appropriate technical specification selection',
    'Hardware and software integration',
    'Performance optimization and capacity increase',
    'Scaling and upgrade consulting',
    'System documentation and technical diagrams',
    'System testing and acceptance',
    'Maintenance plans and continuity assurance'
  ]
WHERE name_en = 'Computer Systems Design';

-- 17. Embedded & Integrated Systems
UPDATE public.website_services SET
  desc_ar = 'تصميم وتطوير الأنظمة المدمجة وإنترنت الأشياء (IoT) للتطبيقات الصناعية والتجارية. نقدم برمجة المتحكمات الدقيقة، تصميم بروتوكولات الاتصال، أنظمة الأتمتة الصناعية، الأجهزة الذكية، وتكامل أجهزة الاستشعار. حلول تقنية متقدمة لتحديث عملياتك.',
  desc_en = 'Design and development of embedded systems and IoT for industrial and commercial applications. We offer microcontroller programming, communication protocol design, industrial automation systems, smart devices, and sensor integration. Advanced technical solutions to modernize your operations.',
  features_ar = ARRAY[
    'برمجة المتحكمات الدقيقة (Arduino, Raspberry Pi)',
    'تصميم بروتوكولات الاتصال (MQTT, Modbus)',
    'أنظمة أتمتة صناعية ومراقبة',
    'أجهزة IoT ذكية للمنازل والمصانع',
    'تكامل أجهزة الاستشعار والقياس',
    'واجهات تحكم وعرض مخصصة',
    'أنظمة تنبيه وإنذار مبكر',
    'تدريب الفريق على تشغيل الأنظمة'
  ],
  features_en = ARRAY[
    'Microcontroller programming (Arduino, Raspberry Pi)',
    'Communication protocol design (MQTT, Modbus)',
    'Industrial automation and monitoring systems',
    'Smart IoT devices for homes and factories',
    'Sensor and measurement device integration',
    'Custom control and display interfaces',
    'Alert and early warning systems',
    'Team training on system operation'
  ]
WHERE name_en = 'Embedded & Integrated Systems';

-- 18. Data Network Design
UPDATE public.website_services SET
  desc_ar = 'تصميم شبكات بيانات احترافية وفق أحدث المعايير التقنية العالمية. نقدم تصميم هندسة الشبكة، اختيار المعدات المناسبة، تخطيط الشبكات اللاسلكية والسلكية، تصميم شبكات WAN وLAN وVPN، وضمان الأمان والأداء الأمثل للشبكة.',
  desc_en = 'Professional data network design according to the latest international technical standards. We offer network architecture design, appropriate equipment selection, wireless and wired network planning, WAN, LAN, and VPN design, and guaranteed security and optimal network performance.',
  features_ar = ARRAY[
    'تصميم هندسة الشبكة الشاملة',
    'اختيار معدات الشبكة المناسبة',
    'تصميم شبكات LAN وWAN وVPN',
    'تخطيط الشبكات اللاسلكية (Wi-Fi)',
    'تصميم شبكات المنطقة الواسعة (MPLS, SD-WAN)',
    'أمان الشبكة والجدران النارية',
    'توثيق مخططات الشبكة',
    'اختبار الأداء والتحقق من التصميم'
  ],
  features_en = ARRAY[
    'Comprehensive network architecture design',
    'Appropriate network equipment selection',
    'LAN, WAN and VPN design',
    'Wireless network planning (Wi-Fi)',
    'Wide area network design (MPLS, SD-WAN)',
    'Network security and firewalls',
    'Network diagram documentation',
    'Performance testing and design verification'
  ]
WHERE name_en = 'Data Network Design';

-- 19. Data Network Management
UPDATE public.website_services SET
  desc_ar = 'إدارة وتشغيل شبكات البيانات بكفاءة عالية وأداء مضمون. نقدم مراقبة الشبكة على مدار الساعة، إدارة الأداء والسعة، صيانة دورية وطارئة، تحديث وترقية مكونات الشبكة، واستجابة سريعة للأعطال. نضمن استمرارية عمل شبكتك بنسبة 99.9%.',
  desc_en = 'Efficient and guaranteed data network management and operation. We offer 24/7 network monitoring, performance and capacity management, periodic and emergency maintenance, network component upgrades, and rapid fault response. We guarantee 99.9% network uptime.',
  features_ar = ARRAY[
    'مراقبة الشبكة 24/7 على مدار الساعة',
    'إدارة الأداء والسعة بشكل استباقي',
    'صيانة دورية ومجدولة للشبكة',
    'استجابة سريعة للأعطال والطوارئ',
    'تحديث وترقية مكونات الشبكة',
    'تقارير أداء شهرية تفصيلية',
    'إدارة عناوين IP والسياسات',
    'ضمان استمرارية 99.9% uptime'
  ],
  features_en = ARRAY[
    '24/7 network monitoring',
    'Proactive performance and capacity management',
    'Periodic and scheduled network maintenance',
    'Rapid fault and emergency response',
    'Network component upgrades',
    'Detailed monthly performance reports',
    'IP address and policy management',
    '99.9% uptime guarantee'
  ]
WHERE name_en = 'Data Network Management';

-- 20. Telecom & Internet Services
UPDATE public.website_services SET
  desc_ar = 'خدمات اتصالات وإنترنت شاملة للشركات والمؤسسات. نقدم حلول الإنترنت عالي السرعة المخصص للأعمال، خدمات الاتصالات الصوتية عبر IP (VoIP)، خدمات الكلاود والاستضافة، بنية تحتية اتصالات متكاملة، ودعم فني 24/7 لضمان استمرارية الخدمة.',
  desc_en = 'Comprehensive telecom and internet services for businesses and institutions. We offer high-speed internet solutions dedicated to businesses, voice over IP (VoIP) services, cloud and hosting services, integrated telecom infrastructure, and 24/7 technical support to ensure service continuity.',
  features_ar = ARRAY[
    'إنترنت عالي السرعة مخصص للأعمال',
    'خدمات الاتصالات الصوتية VoIP',
    'حلول الكلاود والاستضافة الآمنة',
    'خطوط مخصصة وشبكات خاصة (Leased Lines)',
    'خدمات المؤتمرات الصوتية والمرئية',
    'دعم فني متخصص 24/7',
    'SLA مضمون لجودة الخدمة',
    'مراقبة الخدمة والإبلاغ الفوري عن الأعطال'
  ],
  features_en = ARRAY[
    'High-speed internet for businesses',
    'VoIP communication services',
    'Secure cloud and hosting solutions',
    'Dedicated lines and private networks (Leased Lines)',
    'Audio and video conferencing services',
    'Specialized 24/7 technical support',
    'Guaranteed service quality SLA',
    'Service monitoring and instant fault reporting'
  ]
WHERE name_en = 'Telecom & Internet Services';

-- 21. Intellectual Property & Innovation
UPDATE public.website_services SET
  desc_ar = 'خدمات شاملة لحماية وتطوير حقوق الملكية الفكرية والابتكار التقني. نقدم تسجيل براءات الاختراع والعلامات التجارية، حماية حقوق الطبع والنشر، استشارات قانونية في الملكية الفكرية، استراتيجيات حماية الابتكار، وإدارة محفظة الملكية الفكرية للشركات.',
  desc_en = 'Comprehensive services for protecting and developing intellectual property rights and technical innovation. We offer patent and trademark registration, copyright protection, intellectual property legal consulting, innovation protection strategies, and IP portfolio management for companies.',
  features_ar = ARRAY[
    'تسجيل براءات الاختراع محلياً ودولياً',
    'تسجيل وحماية العلامات التجارية',
    'حماية حقوق الطبع والنشر',
    'استشارات قانونية في الملكية الفكرية',
    'استراتيجيات حماية الابتكار والأسرار التجارية',
    'إدارة محفظة الملكية الفكرية',
    'التفاوض على اتفاقيات الترخيص',
    'متابعة قضايا انتهاك الملكية الفكرية'
  ],
  features_en = ARRAY[
    'Patent registration locally and internationally',
    'Trademark registration and protection',
    'Copyright protection',
    'Intellectual property legal consulting',
    'Innovation and trade secret protection strategies',
    'IP portfolio management',
    'License agreement negotiation',
    'IP infringement case follow-up'
  ]
WHERE name_en = 'Intellectual Property & Innovation';

-- 22. Advanced Telecom Networks
UPDATE public.website_services SET
  desc_ar = 'إنشاء وتشغيل وصيانة شبكات الاتصالات المتقدمة اللاسلكية والسلكية. نقدم تركيب محطات الاتصالات، شبكات الألياف الضوئية، شبكات 4G/5G الخاصة، أنظمة البث الإذاعي والتلفزيوني الرقمي، وحلول الاتصال عبر الأقمار الاصطناعية.',
  desc_en = 'Establishing, operating, and maintaining advanced wireless and wired telecom networks. We offer telecom station installation, fiber optic networks, private 4G/5G networks, digital radio and TV broadcast systems, and satellite communication solutions.',
  features_ar = ARRAY[
    'تركيب وتشغيل محطات الاتصالات',
    'شبكات الألياف الضوئية FTTx',
    'شبكات 4G/5G الخاصة للمؤسسات',
    'أنظمة البث الإذاعي والتلفزيوني الرقمي',
    'حلول الاتصال عبر الأقمار الاصطناعية',
    'شبكات الميكروويف والراديو',
    'أنظمة IPTV وبث المحتوى',
    'صيانة وضمان الشبكات الاتصالية'
  ],
  features_en = ARRAY[
    'Telecom station installation and operation',
    'Fiber optic networks (FTTx)',
    'Private 4G/5G networks for enterprises',
    'Digital radio and TV broadcast systems',
    'Satellite communication solutions',
    'Microwave and radio networks',
    'IPTV and content streaming systems',
    'Telecom network maintenance and warranty'
  ]
WHERE name_en = 'Advanced Telecom Networks';

-- 23. Technology R&D
UPDATE public.website_services SET
  desc_ar = 'خدمات البحث والتطوير التقني لدعم الابتكار وتطوير المنتجات الجديدة. نقدم أبحاث تطبيقية في الذكاء الاصطناعي والتعلم الآلي، تطوير النماذج الأولية للمنتجات، أبحاث الفضاء والاستشعار عن بعد، الدراسات التقنية الجدوى، وتقارير الاتجاهات التكنولوجية.',
  desc_en = 'Technical research and development services to support innovation and new product development. We offer applied research in AI and machine learning, product prototype development, space and remote sensing research, technical feasibility studies, and technology trend reports.',
  features_ar = ARRAY[
    'أبحاث تطبيقية في الذكاء الاصطناعي',
    'تطوير نماذج أولية للمنتجات الجديدة',
    'أبحاث الفضاء والاستشعار عن بعد',
    'دراسات الجدوى التقنية والاقتصادية',
    'تقارير الاتجاهات التكنولوجية',
    'شراكات مع مراكز أبحاث أكاديمية',
    'حلول تعلم الآلة والبيانات الضخمة',
    'ابتكار حلول لمشكلات الصناعة'
  ],
  features_en = ARRAY[
    'Applied AI research',
    'New product prototype development',
    'Space and remote sensing research',
    'Technical and economic feasibility studies',
    'Technology trend reports',
    'Academic research center partnerships',
    'Machine learning and big data solutions',
    'Industry problem-solving innovations'
  ]
WHERE name_en = 'Technology R&D';

-- 24. Technical Training Centers
UPDATE public.website_services SET
  desc_ar = 'مراكز تدريب تقني متخصصة تقدم برامج تأهيلية معتمدة في مجالات تكنولوجيا المعلومات والاتصالات. نقدم دورات في البرمجة، الشبكات، الأمن السيبراني، الذكاء الاصطناعي، إدارة قواعد البيانات، وتقنيات الكلاود. شهادات معترف بها دولياً.',
  desc_en = 'Specialized technical training centers offering accredited qualification programs in IT and telecommunications. We offer courses in programming, networking, cybersecurity, AI, database management, and cloud technologies. Internationally recognized certifications.',
  features_ar = ARRAY[
    'دورات برمجة (Python, JavaScript, Java)',
    'تدريب شبكات (CCNA, CompTIA Network+)',
    'أمن سيبراني (CEH, CISSP)',
    'ذكاء اصطناعي وتعلم الآلة',
    'قواعد بيانات (SQL, MongoDB)',
    'تقنيات الكلاود (AWS, Azure, GCP)',
    'شهادات معتمدة دولياً',
    'تدريب عملي في بيئات حقيقية'
  ],
  features_en = ARRAY[
    'Programming courses (Python, JavaScript, Java)',
    'Network training (CCNA, CompTIA Network+)',
    'Cybersecurity (CEH, CISSP)',
    'Artificial Intelligence and Machine Learning',
    'Databases (SQL, MongoDB)',
    'Cloud technologies (AWS, Azure, GCP)',
    'Internationally accredited certifications',
    'Hands-on training in real environments'
  ]
WHERE name_en = 'Technical Training Centers';

-- 25. Technology Business Centers
UPDATE public.website_services SET
  desc_ar = 'مراكز أعمال تكنولوجية متكاملة لدعم الشركات الناشئة والمؤسسات التقنية. نوفر مساحات عمل مرنة ومجهزة تقنياً، خدمات إدارية وقانونية ومحاسبية، إرشاد وتوجيه ريادي، شبكات أعمال وفعاليات تواصل، وتسهيل الوصول إلى التمويل والمستثمرين.',
  desc_en = 'Integrated technology business centers supporting startups and tech organizations. We provide flexible and technically equipped workspaces, administrative, legal, and accounting services, entrepreneurial guidance and mentorship, business networks and networking events, and facilitated access to funding and investors.',
  features_ar = ARRAY[
    'مساحات عمل مرنة ومجهزة تقنياً',
    'خدمات إدارية وقانونية ومحاسبية',
    'إرشاد وتوجيه ريادي من خبراء',
    'شبكات أعمال وفعاليات تواصل',
    'تسهيل الوصول إلى التمويل',
    'برامج تسريع الشركات الناشئة',
    'شراكات مع مراكز أبحاث وجامعات',
    'خدمات تسجيل وتأسيس الشركات'
  ],
  features_en = ARRAY[
    'Flexible and technically equipped workspaces',
    'Administrative, legal and accounting services',
    'Expert entrepreneurial guidance and mentorship',
    'Business networks and networking events',
    'Facilitated access to funding',
    'Startup acceleration programs',
    'Research center and university partnerships',
    'Company registration and establishment services'
  ]
WHERE name_en = 'Technology Business Centers';

-- 26. Digital Content Conversion
UPDATE public.website_services SET
  desc_ar = 'خدمات تحويل المحتوى الرقمي الشاملة من صيغة لأخرى وبين الوسائط المختلفة. نقدم تحويل الوثائق الورقية إلى رقمية، تحويل الصيغ الصوتية والمرئية، رقمنة الأرشيفات القديمة، ضغط الملفات وتحسين جودتها، وإدارة وتنظيم الأرشيف الرقمي.',
  desc_en = 'Comprehensive digital content conversion services from one format to another and between different media. We offer paper-to-digital document conversion, audio and video format conversion, digitization of old archives, file compression and quality enhancement, and digital archive management and organization.',
  features_ar = ARRAY[
    'تحويل الوثائق الورقية إلى رقمية',
    'تحويل الصيغ الصوتية (MP3, WAV, FLAC)',
    'تحويل الصيغ المرئية (MP4, AVI, MKV)',
    'رقمنة الأرشيفات والسجلات القديمة',
    'ضغط الملفات مع الحفاظ على الجودة',
    'تنظيم وفهرسة الأرشيف الرقمي',
    'استخراج النصوص من الصور (OCR)',
    'تحويل الكتب والمجلات لصيغ إلكترونية'
  ],
  features_en = ARRAY[
    'Paper-to-digital document conversion',
    'Audio format conversion (MP3, WAV, FLAC)',
    'Video format conversion (MP4, AVI, MKV)',
    'Old archive and record digitization',
    'File compression with quality preservation',
    'Digital archive organization and indexing',
    'Text extraction from images (OCR)',
    'Book and magazine conversion to e-formats'
  ]
WHERE name_en = 'Digital Content Conversion';

-- 27. Digital Marketing
UPDATE public.website_services SET
  desc_ar = 'خدمات تسويق رقمي شاملة لتنمية علامتك التجارية وزيادة مبيعاتك عبر الإنترنت. نقدم إدارة حسابات وسائل التواصل الاجتماعي، إعلانات Google وFacebook وInstagram، تحسين محركات البحث (SEO)، التسويق بالمحتوى، والتسويق عبر البريد الإلكتروني والواتساب.',
  desc_en = 'Comprehensive digital marketing services to grow your brand and increase online sales. We offer social media account management, Google, Facebook and Instagram ads, search engine optimization (SEO), content marketing, and email and WhatsApp marketing.',
  features_ar = ARRAY[
    'إدارة حسابات التواصل الاجتماعي',
    'إعلانات Google Ads وFacebook Ads',
    'تحسين محركات البحث (SEO)',
    'تسويق بالمحتوى وبلوغ الجمهور المستهدف',
    'تسويق بالبريد الإلكتروني والواتساب',
    'تحليل أداء الحملات وROI',
    'استراتيجية تسويقية متكاملة',
    'تقارير أداء أسبوعية وشهرية'
  ],
  features_en = ARRAY[
    'Social media account management',
    'Google Ads and Facebook Ads',
    'Search Engine Optimization (SEO)',
    'Content marketing and target audience reach',
    'Email and WhatsApp marketing',
    'Campaign performance and ROI analysis',
    'Integrated marketing strategy',
    'Weekly and monthly performance reports'
  ]
WHERE name_en = 'Digital Marketing';

-- 28. Website Management
UPDATE public.website_services SET
  desc_ar = 'إنشاء وإدارة وصيانة مواقع الويب الاحترافية لجميع أنواع الأعمال. نقدم تصميم مواقع بالاتجاهات العصرية، تطوير مواقع WordPress وReact وNext.js، تحسين السرعة وSEO، الاستضافة والنطاق، والتحديثات الدورية لضمان الأمان والأداء.',
  desc_en = 'Creating, managing and maintaining professional websites for all business types. We offer modern trend website design, WordPress, React and Next.js development, speed and SEO optimization, hosting and domain, and periodic updates to ensure security and performance.',
  features_ar = ARRAY[
    'تصميم مواقع بالاتجاهات العصرية',
    'تطوير بـ WordPress وReact وNext.js',
    'تحسين سرعة الموقع وأداءه',
    'تحسين محركات البحث (SEO) المتكامل',
    'استضافة آمنة وسريعة مع SSL',
    'تحديثات دورية ونسخ احتياطية',
    'موقع متجاوب مع الموبايل',
    'لوحة تحكم سهلة لإدارة المحتوى'
  ],
  features_en = ARRAY[
    'Modern trend website design',
    'WordPress, React and Next.js development',
    'Website speed and performance optimization',
    'Integrated SEO optimization',
    'Secure and fast hosting with SSL',
    'Periodic updates and backups',
    'Mobile-responsive website',
    'Easy-to-use content management panel'
  ]
WHERE name_en = 'Website Management';

-- 29. E-Commerce Solutions
UPDATE public.website_services SET
  desc_ar = 'حلول تجارة إلكترونية متكاملة لإطلاق وتنمية متجرك الإلكتروني. نقدم تصميم متجر احترافي، تكامل بوابات الدفع المصرية والدولية، إدارة المخزون والمنتجات، نظام الشحن والتوصيل، التسويق للمتجر، وتحليل أداء المبيعات.',
  desc_en = 'Integrated e-commerce solutions to launch and grow your online store. We offer professional store design, Egyptian and international payment gateway integration, inventory and product management, shipping and delivery system, store marketing, and sales performance analysis.',
  features_ar = ARRAY[
    'تصميم متجر إلكتروني احترافي',
    'تكامل بوابات دفع (Fawry, PayMob, Stripe)',
    'إدارة المنتجات والتصنيفات',
    'نظام إدارة المخزون والتنبيهات',
    'تكامل شركات الشحن والتوصيل',
    'نظام كوبونات الخصم والعروض',
    'تسويق المتجر وحملات استهداف',
    'تقارير مبيعات تفصيلية يومية'
  ],
  features_en = ARRAY[
    'Professional online store design',
    'Payment gateway integration (Fawry, PayMob, Stripe)',
    'Product and category management',
    'Inventory management and alerts',
    'Shipping and delivery company integration',
    'Discount coupon and offers system',
    'Store marketing and targeting campaigns',
    'Detailed daily sales reports'
  ]
WHERE name_en = 'E-Commerce Solutions';

-- 30. Export & Import Services
UPDATE public.website_services SET
  desc_ar = 'خدمات استيراد وتصدير شاملة تغطي جميع الإجراءات التجارية الدولية. نقدم التخليص الجمركي البري والبحري والجوي، توثيق عقود التجارة الدولية، استشارات اللوائح والمعايير الدولية، تمويل التجارة الخارجية، وتقديم شهادات المنشأ والفحص.',
  desc_en = 'Comprehensive import and export services covering all international trade procedures. We offer land, sea and air customs clearance, international trade contract documentation, international regulations and standards consulting, foreign trade financing, and issuing certificates of origin and inspection.',
  features_ar = ARRAY[
    'تخليص جمركي بري وبحري وجوي',
    'توثيق عقود التجارة الدولية',
    'استشارات اللوائح والمعايير الدولية',
    'تمويل التجارة الخارجية (LC, TT)',
    'شهادات المنشأ والفحص',
    'التنسيق مع الموانئ والمطارات',
    'تتبع الشحنات الدولية',
    'التوافق مع متطلبات الجمارك الدولية'
  ],
  features_en = ARRAY[
    'Land, sea and air customs clearance',
    'International trade contract documentation',
    'International regulations and standards consulting',
    'Foreign trade financing (LC, TT)',
    'Certificates of origin and inspection',
    'Port and airport coordination',
    'International shipment tracking',
    'International customs requirements compliance'
  ]
WHERE name_en = 'Export & Import Services';

-- 31. Film, TV & Artistic Production
UPDATE public.website_services SET
  desc_ar = 'إنتاج فني واحترافي شامل للأفلام والمسلسلات والبرامج التلفزيونية والمسرحية. نقدم إنتاج الأفلام القصيرة والطويلة، المسلسلات التلفزيونية والرقمية، الإعلانات التجارية، توزيع المحتوى على المنصات الرقمية، والإنتاج المشترك مع شركاء محليين ودوليين.',
  desc_en = 'Comprehensive artistic and professional production of films, series, TV programs and theater. We offer short and feature film production, TV and digital series, commercial advertisements, content distribution on digital platforms, and co-productions with local and international partners.',
  features_ar = ARRAY[
    'إنتاج أفلام قصيرة وطويلة',
    'إنتاج مسلسلات تلفزيونية ورقمية',
    'إنتاج إعلانات تجارية احترافية',
    'توزيع المحتوى على Netflix وYouTube وغيرها',
    'إنتاج برامج تلفزيونية ووثائقية',
    'إنتاج مسرحي ومحتوى ترفيهي',
    'إنتاج مشترك مع شركاء دوليين',
    'خدمات ما بعد الإنتاج الشاملة'
  ],
  features_en = ARRAY[
    'Short and feature film production',
    'TV and digital series production',
    'Professional commercial advertisement production',
    'Content distribution on Netflix, YouTube, etc.',
    'TV program and documentary production',
    'Theater and entertainment content production',
    'International co-production',
    'Comprehensive post-production services'
  ]
WHERE name_en = 'Film, TV & Artistic Production';

-- 32. Creative & Artistic Services
UPDATE public.website_services SET
  desc_ar = 'خدمات فنية وإبداعية متكاملة لتطوير هويتك البصرية وإنتاج محتوى مميز. نقدم تصوير احترافي للمنتجات والفعاليات والبورتريه، مكساج وإنتاج صوتي، مونتاج احترافي، دوبلاج وتعليق صوتي، تصحيح ألوان سينمائي، وتصميم رسوم متحركة.',
  desc_en = 'Integrated creative and artistic services to develop your visual identity and produce distinctive content. We offer professional photography for products, events and portraits, audio mixing and production, professional video editing, dubbing and voice-over, cinematic color correction, and motion graphics design.',
  features_ar = ARRAY[
    'تصوير احترافي للمنتجات والفعاليات',
    'مكساج وإنتاج صوتي احترافي',
    'مونتاج فيديو احترافي',
    'دوبلاج وتعليق صوتي بالعربية والإنجليزية',
    'تصحيح ألوان سينمائي',
    'تصميم رسوم متحركة (Motion Graphics)',
    'تصميم هوية بصرية وشعارات',
    'إنتاج محتوى للمنصات الرقمية'
  ],
  features_en = ARRAY[
    'Professional photography for products and events',
    'Professional audio mixing and production',
    'Professional video editing',
    'Arabic and English dubbing and voice-over',
    'Cinematic color correction',
    'Motion graphics design',
    'Visual identity and logo design',
    'Content production for digital platforms'
  ]
WHERE name_en = 'Creative & Artistic Services';

-- 33. Photography & Visual Effects
UPDATE public.website_services SET
  desc_ar = 'خدمات تصوير فوتوغرافي ومؤثرات بصرية احترافية لجميع الاحتياجات التجارية والإبداعية. نقدم تصوير منتجات للمتاجر الإلكترونية، تصوير فعاليات وحفلات، تعديل وريتاشينج الصور، مؤثرات بصرية CGI، كروما كي وتركيب المشاهد، وتصوير جوي بالدرون.',
  desc_en = 'Professional photography and visual effects services for all commercial and creative needs. We offer product photography for online stores, event and wedding photography, photo editing and retouching, CGI visual effects, chroma key and scene compositing, and aerial drone photography.',
  features_ar = ARRAY[
    'تصوير منتجات للمتاجر الإلكترونية',
    'تصوير فعاليات وحفلات ومؤتمرات',
    'تعديل وريتاشينج احترافي للصور',
    'مؤثرات بصرية CGI وVFX',
    'كروما كي وتركيب المشاهد',
    'تصوير جوي بالدرون',
    'تصوير 360 درجة',
    'معالجة وتحسين جودة الصور القديمة'
  ],
  features_en = ARRAY[
    'Product photography for online stores',
    'Event, wedding and conference photography',
    'Professional photo editing and retouching',
    'CGI and VFX visual effects',
    'Chroma key and scene compositing',
    'Aerial drone photography',
    '360-degree photography',
    'Old photo quality enhancement and restoration'
  ]
WHERE name_en = 'Photography & Visual Effects';

-- 34. Product Distribution Agency
UPDATE public.website_services SET
  desc_ar = 'وكالة توزيع منتجات محلية ودولية بشبكة موزعين معتمدة وواسعة الانتشار. نوفر تغطية توزيع شاملة في جميع المحافظات، إدارة سلسلة التوريد، تخزين وشحن آمن، نظام تتبع الشحنات، وإدارة العلاقة مع الموزعين والوسطاء. نضمن وصول منتجك للسوق المناسب.',
  desc_en = 'Local and international product distribution agency with a certified and widespread distributor network. We provide comprehensive distribution coverage in all governorates, supply chain management, safe storage and shipping, shipment tracking, and distributor and intermediary relationship management. We guarantee your product reaches the right market.',
  features_ar = ARRAY[
    'شبكة موزعين معتمدين في جميع المحافظات',
    'إدارة سلسلة التوريد بالكامل',
    'مستودعات تخزين معتمدة وآمنة',
    'شحن وتوزيع سريع وموثوق',
    'نظام تتبع الشحنات لحظياً',
    'إدارة علاقات الموزعين والوسطاء',
    'تقارير المبيعات والتوزيع التفصيلية',
    'توزيع دولي في دول الخليج وأفريقيا'
  ],
  features_en = ARRAY[
    'Certified distributor network in all governorates',
    'Full supply chain management',
    'Certified and secure storage warehouses',
    'Fast and reliable shipping and distribution',
    'Real-time shipment tracking system',
    'Distributor and intermediary relationship management',
    'Detailed sales and distribution reports',
    'International distribution in Gulf and Africa'
  ]
WHERE name_en = 'Product Distribution Agency';

-- 35. International Trade Agency
UPDATE public.website_services SET
  desc_ar = 'وكالة تجارة دولية متخصصة في تمثيل الشركات الأجنبية في السوق المصري والعربي. نقدم خدمات التمثيل التجاري الحصري، تسويق المنتجات الدولية محلياً، إدارة عقود التوكيلات، الدراسات السوقية للأسواق الجديدة، وبناء شراكات تجارية استراتيجية.',
  desc_en = 'International trade agency specializing in representing foreign companies in the Egyptian and Arab market. We offer exclusive commercial representation, local marketing of international products, agency contract management, market studies for new markets, and building strategic business partnerships.',
  features_ar = ARRAY[
    'تمثيل تجاري حصري للشركات الأجنبية',
    'تسويق المنتجات الدولية في السوق المحلي',
    'إدارة عقود التوكيلات التجارية',
    'دراسات سوقية للأسواق الجديدة',
    'بناء شراكات تجارية استراتيجية',
    'خدمات الترجمة والتفاوض التجاري',
    'الامتثال للمتطلبات القانونية',
    'تقارير السوق والمنافسين'
  ],
  features_en = ARRAY[
    'Exclusive commercial representation for foreign companies',
    'Local marketing of international products',
    'Agency contract management',
    'Market studies for new markets',
    'Strategic business partnership building',
    'Translation and commercial negotiation services',
    'Legal requirements compliance',
    'Market and competitor reports'
  ]
WHERE name_en = 'International Trade Agency';

-- 36. Logistics Services Agency
UPDATE public.website_services SET
  desc_ar = 'وكالة لوجستية متكاملة توفر حلول شحن وتخزين وتوزيع شاملة. نقدم شحن بري وبحري وجوي دولي، تخزين مؤقت ودائم في مستودعات معتمدة، خدمات التعبئة والتغليف الاحترافي، التخليص الجمركي، وتتبع الشحنات في الوقت الفعلي. نضمن وصول بضاعتك آمنة وفي الموعد.',
  desc_en = 'Integrated logistics agency providing comprehensive shipping, storage, and distribution solutions. We offer international land, sea and air shipping, temporary and permanent storage in certified warehouses, professional packaging and wrapping, customs clearance, and real-time shipment tracking. We guarantee your goods arrive safely and on time.',
  features_ar = ARRAY[
    'شحن دولي بري وبحري وجوي',
    'مستودعات تخزين معتمدة وآمنة',
    'خدمات تعبئة وتغليف احترافية',
    'تخليص جمركي سريع وموثوق',
    'تتبع الشحنات في الوقت الفعلي',
    'توزيع أخير الميل (Last Mile)',
    'شحن بضائع خاصة وخطيرة',
    'تأمين الشحنات ضد التلف والسرقة'
  ],
  features_en = ARRAY[
    'International land, sea and air shipping',
    'Certified and secure storage warehouses',
    'Professional packaging and wrapping services',
    'Fast and reliable customs clearance',
    'Real-time shipment tracking',
    'Last mile delivery distribution',
    'Special and hazardous goods shipping',
    'Shipment insurance against damage and theft'
  ]
WHERE name_en = 'Logistics Services Agency';

-- 37. Marketing & Advertising Agency
UPDATE public.website_services SET
  desc_ar = 'وكالة إبداعية متكاملة للتسويق والإعلان تجمع بين الإبداع والتقنية. نقدم بناء الهوية البصرية الكاملة، حملات إعلانية على التلفزيون والراديو والإنترنت، إنتاج مواد تسويقية (كتيبات، بروشور، لافتات)، إدارة السمعة الرقمية، وتنظيم فعاليات ومؤتمرات.',
  desc_en = 'Integrated creative marketing and advertising agency combining creativity and technology. We offer complete visual identity building, advertising campaigns on TV, radio and internet, marketing material production (brochures, flyers, banners), digital reputation management, and event and conference organizing.',
  features_ar = ARRAY[
    'بناء هوية بصرية كاملة (لوغو، ألوان، خطوط)',
    'حملات إعلانية تلفزيونية وإذاعية',
    'إعلانات رقمية متكاملة',
    'إنتاج مطبوعات تسويقية احترافية',
    'إدارة السمعة الرقمية للعلامات',
    'تنظيم فعاليات ومعارض تجارية',
    'التسويق بالتأثيريين (Influencer Marketing)',
    'استراتيجية علامة تجارية شاملة'
  ],
  features_en = ARRAY[
    'Complete visual identity building (logo, colors, fonts)',
    'TV and radio advertising campaigns',
    'Integrated digital advertising',
    'Professional marketing print production',
    'Brand digital reputation management',
    'Event and trade show organizing',
    'Influencer marketing',
    'Comprehensive brand strategy'
  ]
WHERE name_en = 'Marketing & Advertising Agency';

-- 38. Software & Technology Agency
UPDATE public.website_services SET
  desc_ar = 'وكالة حصرية لتمثيل وتوزيع حلول البرمجيات والتقنية العالمية في مصر والوطن العربي. نقدم توزيع تراخيص البرمجيات العالمية (Microsoft, Oracle, SAP, Adobe)، تطبيق وتنفيذ الحلول التقنية، دعم فني متخصص، تدريب الفرق التقنية، وخدمات ما بعد البيع.',
  desc_en = 'Exclusive agency for representing and distributing global software and technology solutions in Egypt and the Arab world. We offer distribution of global software licenses (Microsoft, Oracle, SAP, Adobe), technology solution implementation, specialized technical support, technical team training, and after-sales services.',
  features_ar = ARRAY[
    'توزيع تراخيص Microsoft وOracle وSAP',
    'تطبيق وتنفيذ الحلول التقنية',
    'دعم فني متخصص ما بعد البيع',
    'تدريب الفرق التقنية على المنتجات',
    'ترخيص حصري في السوق المصري',
    'استشارات اختيار الحل التقني المناسب',
    'إدارة تجديد التراخيص والاشتراكات',
    'تكامل الحلول مع أنظمة العميل القائمة'
  ],
  features_en = ARRAY[
    'Microsoft, Oracle and SAP license distribution',
    'Technology solution implementation',
    'Specialized after-sales technical support',
    'Product training for technical teams',
    'Exclusive licensing in the Egyptian market',
    'Appropriate technology solution selection consulting',
    'License and subscription renewal management',
    'Solution integration with existing client systems'
  ]
WHERE name_en = 'Software & Technology Agency';
