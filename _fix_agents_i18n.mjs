import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/pages/public/PublicAgents.tsx', 'utf8');

// Replace entire STATIC_AGENTS array with bilingual version
const oldStart = 'const STATIC_AGENTS: Agent[] = [';
const oldEnd = '];';
const startIdx = c.indexOf(oldStart);
// Find the matching closing bracket
let depth = 0, endIdx = -1;
for (let i = startIdx; i < c.length; i++) {
  if (c[i] === '[') depth++;
  if (c[i] === ']') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
}

const newStaticAgents = `const STATIC_AGENTS: Agent[] = [
  {
    id: "aa100000-0000-0000-0000-000000000001",
    name: "وكالة ليبانو للموضة والأزياء المحتشمة",
    name_en: "Lebanon Agency for Fashion & Modest Styling",
    region: "الشام",
    country: "لبنان",
    country_en: "Lebanon",
    coverage_scope:
      "مسؤولة عن توزيع منتجات For Her في لبنان وإدارة شحنات Just Click Store إلى الأسواق اللبنانية والسورية، بما يشمل إدارة المخزون والتسليم اللوجستي الأخير.",
    coverage_scope_en:
      "Responsible for distributing For Her products in Lebanon and managing Just Click Store shipments to Lebanese and Syrian markets, including inventory management and last-mile logistics delivery.",
    contact_email: "lebanon@kemetrise.com",
    project_order: 10,
  },
  {
    id: "aa100000-0000-0000-0000-000000000002",
    name: "وكالة الأردن للشراكات التجارية والتوزيع",
    name_en: "Jordan Agency for Commercial Partnerships & Distribution",
    region: "الشام",
    country: "الأردن",
    country_en: "Jordan",
    coverage_scope:
      "إدارة شبكة الوكلاء التجاريين في الأردن وتطوير قنوات التوزيع مع التوكيلات التجارية الكبرى وتنسيق الشحن إلى الدول المجاورة.",
    coverage_scope_en:
      "Managing the commercial agent network in Jordan, developing distribution channels with major commercial agencies, and coordinating shipping to neighboring countries.",
    contact_email: "jordan@kemetrise.com",
    project_order: 20,
  },
  {
    id: "aa200000-0000-0000-0000-000000000001",
    name: "وكالة الإمارات للتكنولوجيا والتجارة الإلكترونية",
    name_en: "UAE Agency for Technology & E-Commerce",
    region: "الخليج",
    country: "الإمارات",
    country_en: "UAE",
    coverage_scope:
      "إدارة عمليات Just Click Store في منطقة الخليج، وتشغيل منظومة GrowVance الإعلامية، ودعم شبكة الموردين متعددي البائعين في دول مجلس التعاون.",
    coverage_scope_en:
      "Managing Just Click Store operations across the Gulf region, operating the GrowVance media ecosystem, and supporting the multi-vendor supplier network across GCC countries.",
    contact_email: "uae@kemetrise.com",
    project_order: 30,
  },
  {
    id: "aa200000-0000-0000-0000-000000000002",
    name: "وكالة المملكة العربية السعودية للتحول الرقمي",
    name_en: "Saudi Arabia Agency for Digital Transformation",
    region: "الخليج",
    country: "السعودية",
    country_en: "Saudi Arabia",
    coverage_scope:
      "مسؤولة عن توسع Agentic في السوق السعودي وبناء منظومة التجارة الإلكترونية متعددة البائعين والتكامل مع بوابات الدفع المحلية ومنصة تحيا.",
    coverage_scope_en:
      "Responsible for Agentic's expansion in the Saudi market, building the multi-vendor e-commerce ecosystem, and integrating with local payment gateways and the Tahya platform.",
    contact_email: "ksa@kemetrise.com",
    project_order: 40,
  },
  {
    id: "aa300000-0000-0000-0000-000000000001",
    name: "وكالة برلين للإعلام والترخيص الإبداعي",
    name_en: "Berlin Agency for Media & Creative Licensing",
    region: "أوروبا",
    country: "ألمانيا",
    country_en: "Germany",
    coverage_scope:
      "إدارة توزيع المحتوى الإبداعي لـ GrowVance في الأسواق الأوروبية وترخيص الأعمال الفنية وعقود الإنتاج المشترك مع شركاء الإنتاج الأوروبيين.",
    coverage_scope_en:
      "Managing creative content distribution for GrowVance in European markets, licensing artistic works, and co-production agreements with European production partners.",
    contact_email: "berlin@kemetrise.com",
    project_order: 50,
  },
  {
    id: "aa300000-0000-0000-0000-000000000002",
    name: "وكالة باريس للأزياء الراقية والعرض الدولي",
    name_en: "Paris Agency for Haute Couture & International Showcase",
    region: "أوروبا",
    country: "فرنسا",
    country_en: "France",
    coverage_scope:
      "شراكات الأزياء الراقية لعلامة For Her وإدارة الحضور الأوروبي في معارض الأزياء الدولية وتنسيق الاستيراد والتصدير عبر الجمارك الأوروبية.",
    coverage_scope_en:
      "Haute couture partnerships for For Her brand, managing European presence at international fashion shows, and coordinating import/export through European customs.",
    contact_email: "paris@kemetrise.com",
    project_order: 60,
  },
  {
    id: "aa400000-0000-0000-0000-000000000001",
    name: "وكالة كاليفورنيا للذكاء الاصطناعي والبنية التقنية",
    name_en: "California Agency for AI & Technical Infrastructure",
    region: "أمريكا الشمالية",
    country: "الولايات المتحدة",
    country_en: "United States",
    coverage_scope:
      "إدارة منظومة Agentic التقنية على المستوى العالمي وتطوير أطر العمل بالذكاء الاصطناعي وبناء الأنظمة متعددة المستأجرين وإدارة البنية التحتية السحابية.",
    coverage_scope_en:
      "Managing the Agentic technical ecosystem globally, developing AI frameworks, building multi-tenant systems, and managing cloud infrastructure.",
    contact_email: "california@kemetrise.com",
    project_order: 70,
  },
  {
    id: "aa400000-0000-0000-0000-000000000002",
    name: "وكالة كندا للتقنية الموزعة وحلول SaaS",
    name_en: "Canada Agency for Distributed Tech & SaaS Solutions",
    region: "أمريكا الشمالية",
    country: "كندا",
    country_en: "Canada",
    coverage_scope:
      "دعم البنية التحتية لـ Just Click Store في أمريكا الشمالية وإدارة حلول SaaS للسوق الكندي وتوفير خدمات الدعم الفني والاندماج مع الأنظمة المحلية.",
    coverage_scope_en:
      "Supporting Just Click Store infrastructure in North America, managing SaaS solutions for the Canadian market, and providing technical support services and local system integration.",
    contact_email: "canada@kemetrise.com",
    project_order: 80,
  },
  {
    id: "aa500000-0000-0000-0000-000000000001",
    name: "وكالة القاهرة للتوكيلات التجارية والحوكمة",
    name_en: "Cairo Agency for Commercial Agencies & Governance",
    region: "أفريقيا",
    country: "مصر",
    country_en: "Egypt",
    coverage_scope:
      "مركز عمليات التوكيلات التجارية الإقليمية في مصر، وإدارة التخليص الجمركي وبناء شبكة الموردين وحوكمة سلسلة الإمداد على المستوى الأفريقي.",
    coverage_scope_en:
      "The regional commercial agencies operations center in Egypt, managing customs clearance, building supplier networks, and supply chain governance at the African level.",
    contact_email: "cairo@kemetrise.com",
    project_order: 90,
  },
  {
    id: "aa500000-0000-0000-0000-000000000002",
    name: "وكالة الدار البيضاء للإعلام وتوزيع المحتوى",
    name_en: "Casablanca Agency for Media & Content Distribution",
    region: "أفريقيا",
    country: "المغرب",
    country_en: "Morocco",
    coverage_scope:
      "توزيع محتوى GrowVance في منطقة المغرب العربي والشراكات مع قنوات الإعلام المحلية ومنصات البث الرقمي والمشاركة في معارض الإعلام الإقليمية.",
    coverage_scope_en:
      "Distributing GrowVance content across the Maghreb region, partnering with local media channels and digital streaming platforms, and participating in regional media exhibitions.",
    contact_email: "morocco@kemetrise.com",
    project_order: 100,
  },
]`;

c = c.slice(0, startIdx) + newStaticAgents + c.slice(endIdx);

// Now update AgentCard to use bilingual name, country, coverage_scope
// Update agent name display
c = c.replace(
`            <h3 className="text-sm font-bold text-foreground leading-snug mb-1.5 group-hover:text-primary transition-colors">
              {agent.name}
            </h3>`,
`            <h3 className="text-sm font-bold text-foreground leading-snug mb-1.5 group-hover:text-primary transition-colors">
              {isAr ? agent.name : (agent.name_en || agent.name)}
            </h3>`
);

// Update country badge
c = c.replace(
`                <MapPin className="w-2.5 h-2.5" />
                {agent.country}`,
`                <MapPin className="w-2.5 h-2.5" />
                {isAr ? agent.country : (agent.country_en || agent.country)}`
);

// Update coverage scope display in AgentCard (the bullet list version)
// The scopeWords split is on Arabic comma — for English we need different splitting
c = c.replace(
`  const scopeWords = (agent.coverage_scope ?? "").split("،").filter(Boolean);`,
`  const scopeText = isAr ? (agent.coverage_scope ?? "") : (agent.coverage_scope_en || agent.coverage_scope || "");
  const scopeWords = scopeText.split(isAr ? "،" : ".").filter(s => s.trim().length > 0);`
);

// Update ContactPane to show bilingual name and country
c = c.replace(
`            <h2 className="text-sm font-bold text-foreground leading-snug">{agent.name}</h2>`,
`            <h2 className="text-sm font-bold text-foreground leading-snug">{isAr ? agent.name : (agent.name_en || agent.name)}</h2>`
);

c = c.replace(
`              <span className="text-xs text-muted-foreground">{agent.country}</span>`,
`              <span className="text-xs text-muted-foreground">{isAr ? agent.country : (agent.country_en || agent.country)}</span>`
);

// Update coverage scope in ContactPane
c = c.replace(
`              <p className="text-sm text-foreground/80 leading-relaxed">{agent.coverage_scope}</p>`,
`              <p className="text-sm text-foreground/80 leading-relaxed">{isAr ? agent.coverage_scope : (agent.coverage_scope_en || agent.coverage_scope)}</p>`
);

writeFileSync('src/pages/public/PublicAgents.tsx', c, 'utf8');
console.log('PublicAgents.tsx updated. Length:', c.length);
console.log('Has name_en:', c.includes('name_en'));
console.log('Has country_en:', c.includes('country_en'));
console.log('Has coverage_scope_en:', c.includes('coverage_scope_en'));
