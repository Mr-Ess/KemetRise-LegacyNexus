import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Handshake, CheckCircle, ExternalLink, Cpu, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import LeadCaptureModal from "@/components/shared/LeadCaptureModal";
import { supabase } from "@/integrations/supabase/client";

/* ══════════════════════════════════════════════════════════════════
   DB TYPES
══════════════════════════════════════════════════════════════════ */
type DbPartner = {
  id: string; name_ar: string; name_en: string;
  desc_ar?: string; desc_en?: string; website_url?: string;
  logo_url?: string; icon?: string; category: string; category_ar?: string;
  spec_icon?: string; sort_order: number; is_featured: boolean;
};

type DbTech = {
  id: string; name_en: string; name_ar: string;
  icon: string; category: string; category_ar: string;
  tier: "platinum" | "gold" | "silver"; color: string;
  desc_en: string; desc_ar: string; website_url?: string;
};

type SpecGroup = {
  key: string; enLabel: string; arLabel: string; icon: string;
  companies: DbPartner[];
};

/* ══════════════════════════════════════════════════════════════════
   STATIC FALLBACK — Tech Stack
══════════════════════════════════════════════════════════════════ */
const STATIC_TECH: DbTech[] = [
  { id:"t1", icon:"☁️",  name_en:"Supabase",              name_ar:"سوبابيس",               category:"Cloud & Database",        category_ar:"سحابة وقاعدة بيانات",           color:"emerald", tier:"platinum", desc_en:"Primary backend — real-time PostgreSQL, auth, storage and edge functions.",       desc_ar:"القاعدة الخلفية الأساسية — PostgreSQL الفوري، المصادقة، التخزين والوظائف الحدية.",  website_url:"https://supabase.com" },
  { id:"t2", icon:"⚡",  name_en:"Vite + React",           name_ar:"فايت + ريأكت",          category:"Frontend Infrastructure", category_ar:"بنية الواجهة الأمامية",         color:"violet",  tier:"platinum", desc_en:"React 18 + TypeScript + Vite — ultra-fast build tooling.",                       desc_ar:"React 18 + TypeScript + Vite — أدوات بناء فائقة السرعة." },
  { id:"t3", icon:"🤖",  name_en:"OpenAI / Claude",        name_ar:"أوبن إيه آي / كلود",    category:"AI Infrastructure",       category_ar:"بنية الذكاء الاصطناعي",         color:"cyan",    tier:"platinum", desc_en:"Powering 10+ AI agents with GPT-4o and Claude Sonnet models.",                    desc_ar:"تشغيل أكثر من 10 وكلاء AI بنماذج GPT-4o وClaude Sonnet.",                          website_url:"https://openai.com" },
  { id:"t4", icon:"💳",  name_en:"Stripe / Fawry",         name_ar:"سترايب / فوري",          category:"Payment Gateway",         category_ar:"بوابة الدفع",                   color:"indigo",  tier:"gold",     desc_en:"Secure payments in 135+ currencies with local Egyptian methods.",                 desc_ar:"مدفوعات آمنة بأكثر من 135 عملة مع طرق الدفع المصرية.",                              website_url:"https://stripe.com" },
  { id:"t5", icon:"📧",  name_en:"Resend / SendGrid",      name_ar:"ريسيند / سيندجريد",      category:"Communication",           category_ar:"التواصل والإشعارات",            color:"blue",    tier:"gold",     desc_en:"Transactional email and SMS with high deliverability.",                           desc_ar:"بريد معاملاتي وإشعارات SMS بمعدلات توصيل عالية." },
  { id:"t6", icon:"🔐",  name_en:"Auth0 / Supabase Auth",  name_ar:"مصادقة سوبابيس",        category:"Identity & Security",     category_ar:"الهوية والأمان",                color:"red",     tier:"gold",     desc_en:"Enterprise-grade SSO, MFA, OAuth and RBAC.",                                     desc_ar:"أمان SSO وMFA وOAuth وRBAC بمستوى المؤسسات." },
  { id:"t7", icon:"📊",  name_en:"Recharts / Chart.js",    name_ar:"ريتشارتس",               category:"Data Visualization",     category_ar:"تصور البيانات",                  color:"orange",  tier:"silver",   desc_en:"Interactive BI dashboards with React-based charting libraries.",                  desc_ar:"لوحات ذكاء أعمال تفاعلية بمكتبات الرسوم البيانية." },
  { id:"t8", icon:"🌐",  name_en:"Cloudflare",             name_ar:"كلاودفلير",              category:"CDN & Security",          category_ar:"CDN والأمان",                   color:"amber",   tier:"silver",   desc_en:"Global CDN and DDoS protection for sub-100ms load times.",                       desc_ar:"شبكة CDN عالمية وحماية DDoS لأوقات تحميل دون 100ms.",                               website_url:"https://cloudflare.com" },
  { id:"t9", icon:"🎨",  name_en:"Tailwind + shadcn/ui",   name_ar:"تيلويند + شادسن",        category:"Design System",          category_ar:"نظام التصميم",                   color:"pink",    tier:"silver",   desc_en:"Egyptian-themed gold palette, Orbitron typography, dark/light modes.",            desc_ar:"لوحة ذهبية ذات طابع مصري وخطوط Orbitron ووضعي الإضاءة." },
];

/* ══════════════════════════════════════════════════════════════════
   STATIC FALLBACK — Business Partners by Specialization
══════════════════════════════════════════════════════════════════ */
const STATIC_SPECS: SpecGroup[] = [
  { key:"logistics", enLabel:"Logistics & Delivery",             arLabel:"اللوجستيات والتوصيل",             icon:"🚛", companies: [
    { id:"s1", name_ar:"أراميكس مصر",               name_en:"Aramex Egypt",            website_url:"https://aramex.com",        desc_en:"International and local shipping services.",        desc_ar:"خدمات الشحن والتوصيل الدولي والمحلي.",        sort_order:10, is_featured:true  },
    { id:"s2", name_ar:"بوسطة",                      name_en:"Bosta",                   website_url:"https://bosta.co",          desc_en:"Egyptian last-mile delivery company.",              desc_ar:"شركة توصيل سريع مصرية.",                     sort_order:20, is_featured:false },
    { id:"s3", name_ar:"جيه آند تي إكسبريس مصر",    name_en:"J&T Express Egypt",       website_url:"https://jtexpress.eg",      desc_en:"Fast-growing delivery network.",                    desc_ar:"شبكة توصيل سريعة النمو.",                    sort_order:30, is_featured:false },
    { id:"s4", name_ar:"مايلرز",                      name_en:"Mylerz",                  website_url:"https://mylerz.com",        desc_en:"Integrated logistics for e-commerce.",              desc_ar:"حلول لوجستية متكاملة للتجارة الإلكترونية.", sort_order:40, is_featured:false },
  ]},
  { key:"fintech",   enLabel:"Payments & Fintech",               arLabel:"المدفوعات والتقنية المالية",       icon:"💳", companies: [
    { id:"s5", name_ar:"فوري",                       name_en:"Fawry",                   website_url:"https://fawry.com",         desc_en:"Egypt's leading electronic payment gateway.",       desc_ar:"بوابة الدفع الإلكتروني الأولى في مصر.",     sort_order:10, is_featured:true  },
    { id:"s6", name_ar:"باي موب",                    name_en:"Paymob",                  website_url:"https://paymob.com",        desc_en:"Digital payments platform for MENA.",               desc_ar:"منصة مدفوعات رقمية لمنطقة الشرق الأوسط.",  sort_order:20, is_featured:false },
    { id:"s7", name_ar:"كاشير",                      name_en:"Kashier",                 website_url:"https://kashier.io",        desc_en:"Integrated payment gateway for e-commerce.",        desc_ar:"بوابة دفع متكاملة للتجارة الإلكترونية.",    sort_order:30, is_featured:false },
  ]},
  { key:"telecom",   enLabel:"Telecom & ICT",                    arLabel:"الاتصالات وتكنولوجيا المعلومات",  icon:"📡", companies: [
    { id:"s8", name_ar:"فودافون مصر",                name_en:"Vodafone Egypt",          website_url:"https://vodafone.com.eg",   desc_en:"Egypt's largest telecom provider.",                 desc_ar:"أكبر مزود خدمات اتصالات في مصر.",            sort_order:10, is_featured:true  },
    { id:"s9", name_ar:"أورنچ مصر",                  name_en:"Orange Egypt",            website_url:"https://orange.eg",         desc_en:"Telecom and digital solutions provider.",           desc_ar:"مزود خدمات اتصالات وحلول رقمية.",            sort_order:20, is_featured:false },
    { id:"s10",name_ar:"إي آند مصر",                 name_en:"e& Egypt",                website_url:undefined,                   desc_en:"Advanced telecom and B2B services.",               desc_ar:"خدمات اتصالات متطورة وB2B.",                 sort_order:30, is_featured:false },
  ]},
  { key:"consulting",enLabel:"Consulting & Enterprise",          arLabel:"الاستشارات والمؤسسات",             icon:"💼", companies: [
    { id:"s11",name_ar:"إرنست ويونغ مصر",            name_en:"EY Egypt",                website_url:"https://ey.com/eg",         desc_en:"Advisory, audit and financial services.",           desc_ar:"خدمات استشارية وتدقيق ومالية.",              sort_order:10, is_featured:false },
    { id:"s12",name_ar:"ديلويت مصر",                 name_en:"Deloitte Egypt",          website_url:undefined,                   desc_en:"Management consulting and digital transformation.",  desc_ar:"استشارات إدارة وتحول رقمي.",                 sort_order:20, is_featured:false },
    { id:"s13",name_ar:"KPMG مصر",                   name_en:"KPMG Egypt",              website_url:undefined,                   desc_en:"Audit, advisory and tax services.",                 desc_ar:"خدمات تدقيق واستشارات وضرائب.",              sort_order:30, is_featured:false },
  ]},
  { key:"training",  enLabel:"Training & Technical Education",   arLabel:"التدريب والتأهيل التقني",          icon:"🎓", companies: [
    { id:"s14",name_ar:"معهد تكنولوجيا المعلومات ITI",name_en:"ITI Egypt",             website_url:"https://iti.gov.eg",        desc_en:"National ICT training and qualification institute.", desc_ar:"المعهد القومي لتكنولوجيا المعلومات.",        sort_order:10, is_featured:true  },
    { id:"s15",name_ar:"أورنچ ديجيتال سنتر",         name_en:"Orange Digital Center",   website_url:undefined,                   desc_en:"Training center for coding and digital innovation.", desc_ar:"مركز تدريب على الترميز والابتكار الرقمي.",  sort_order:20, is_featured:false },
    { id:"s16",name_ar:"جهاز ITIDA",                  name_en:"ITIDA",                   website_url:"https://itida.gov.eg",      desc_en:"IT Industry Development Agency.",                   desc_ar:"جهاز تنمية صناعة تقنية المعلومات.",          sort_order:30, is_featured:false },
  ]},
  { key:"ecommerce", enLabel:"E-commerce & Distribution",        arLabel:"التجارة الإلكترونية والتوزيع",     icon:"🛍️", companies: [
    { id:"s17",name_ar:"جوميا مصر",                  name_en:"Jumia Egypt",             website_url:"https://jumia.com.eg",      desc_en:"Africa's largest e-commerce marketplace.",          desc_ar:"أكبر سوق إلكتروني في أفريقيا.",              sort_order:10, is_featured:false },
    { id:"s18",name_ar:"نون مصر",                    name_en:"Noon Egypt",              website_url:"https://noon.com/egypt-en", desc_en:"Leading e-commerce platform in the Middle East.",   desc_ar:"منصة تجارة إلكترونية رائدة في الشرق الأوسط.", sort_order:20, is_featured:false },
    { id:"s19",name_ar:"أمازون مصر",                 name_en:"Amazon Egypt",            website_url:"https://amazon.eg",         desc_en:"Global e-commerce with growing presence in Egypt.", desc_ar:"التجارة الإلكترونية العالمية مع حضور متنامٍ في مصر.", sort_order:30, is_featured:false },
  ]},
];

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════ */
const TIER_COLORS = {
  platinum: { label:"Platinum", labelAr:"بلاتيني", border:"border-primary/40",  bg:"from-primary/10",    badge:"bg-primary/15 text-primary border-primary/30" },
  gold:     { label:"Gold",     labelAr:"ذهبي",     border:"border-amber-500/40", bg:"from-amber-500/10",  badge:"bg-amber-500/15 text-amber-400 border-amber-500/30" },
  silver:   { label:"Silver",   labelAr:"فضي",      border:"border-slate-400/40", bg:"from-slate-400/10",  badge:"bg-slate-400/15 text-slate-400 border-slate-400/30" },
};
const PAL: Record<string, string> = {
  emerald:"text-emerald-400", violet:"text-violet-400", cyan:"text-cyan-400",
  indigo: "text-indigo-400",  blue:  "text-blue-400",   red:  "text-red-400",
  orange: "text-orange-400",  amber: "text-amber-400",  pink: "text-pink-400",
};
const TIERS_ORDER: DbTech["tier"][] = ["platinum", "gold", "silver"];
const BENEFITS = [
  { icon:"💰", en:"Revenue sharing up to 30% commission",           ar:"مشاركة في الإيرادات حتى 30% عمولة" },
  { icon:"🎓", en:"Free access to KemetRise Academy",               ar:"وصول مجاني لأكاديمية KemetRise" },
  { icon:"🚀", en:"Co-marketing & co-selling opportunities",        ar:"فرص التسويق والبيع المشترك" },
  { icon:"🛠️", en:"Dedicated technical support & sandbox access",   ar:"دعم تقني مخصص ووصول sandbox" },
  { icon:"🏆", en:"Partner certification & badge program",          ar:"برنامج شهادات وأوسمة الشركاء" },
  { icon:"📊", en:"Analytics dashboard to track referral earnings", ar:"لوحة تحليلات لتتبع أرباح الإحالة" },
];

const SPEC_CFG: Record<string, { color: string }> = {
  logistics:   { color: "#f59e0b" },
  fintech:     { color: "#10b981" },
  telecom:     { color: "#3b82f6" },
  consulting:  { color: "#8b5cf6" },
  training:    { color: "#06b6d4" },
  ecommerce:   { color: "#ec4899" },
};
const DEFAULT_SPEC_CFG = { color: "#D4A017" };

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
type ModalState = { open: boolean; type: "partner" | "service"; refNameEn: string; refNameAr: string };

export default function PublicPartners() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const [tab, setTab] = useState<"partners" | "tech">("partners");
  const [activeSpec, setActiveSpec] = useState<string>("all");
  const [activeTier, setActiveTier] = useState<"all" | DbTech["tier"]>("all");
  const [modal, setModal] = useState<ModalState>({ open: false, type: "partner", refNameEn: "", refNameAr: "" });
  const [dbPartners, setDbPartners] = useState<DbPartner[]>([]);
  const [dbTech, setDbTech] = useState<DbTech[]>([]);
  const [loading, setLoading] = useState(true);

  const openModal = (type: ModalState["type"], refNameEn: string, refNameAr: string) =>
    setModal({ open: true, type, refNameEn, refNameAr });

  // Scroll to top whenever the spec view changes (All ↔ single spec)
  const specMounted = useRef(false);
  useEffect(() => {
    if (!specMounted.current) { specMounted.current = true; return; }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSpec]);

  useEffect(() => {
    const db = supabase as any;
    Promise.all([
      db.from("website_partners").select("*").order("sort_order"),
      db.from("website_tech_stack").select("*").order("sort_order"),
    ]).then(([p, t]: any[]) => {
      if (p.data?.length > 0) setDbPartners(p.data);
      if (t.data?.length > 0) setDbTech(t.data);
    }).finally(() => setLoading(false));
  }, []);

  // Group DB partners by specialization
  const specGroups: SpecGroup[] = (() => {
    if (dbPartners.length === 0) return STATIC_SPECS;
    const map = new Map<string, SpecGroup>();
    for (const p of dbPartners) {
      const key = p.category ?? "Other";
      if (!map.has(key)) {
        map.set(key, { key, enLabel: key, arLabel: p.category_ar ?? key, icon: p.spec_icon ?? "🏢", companies: [] });
      }
      map.get(key)!.companies.push(p);
    }
    return [...map.values()];
  })();

  const techToShow = dbTech.length > 0 ? dbTech : STATIC_TECH;
  const filtered = activeTier === "all" ? techToShow : techToShow.filter(t => t.tier === activeTier);

  const activeSpecGroup   = activeSpec !== "all" ? specGroups.find(sg => sg.key === activeSpec) ?? null : null;
  const activeSpecCfg     = activeSpec !== "all" ? (SPEC_CFG[activeSpec] ?? DEFAULT_SPEC_CFG) : DEFAULT_SPEC_CFG;
  const visibleCompanies  = activeSpecGroup?.companies ?? [];
  const totalCompanies    = specGroups.reduce((s, sg) => s + sg.companies.length, 0);

  return (
    <>
      <PublicLayout>
        <div dir={R ? "rtl" : "ltr"}>

          {/* ── Hero ── */}
          <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]" />
            </div>
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 gap-2 px-4 py-1.5 text-xs">
                <Handshake className="w-3.5 h-3.5" />
                {R ? "الشركاء والتقنيات" : "Partners & Technologies"}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-display font-black mb-4 leading-tight">
                {R ? "نبني المستقبل معاً" : "Building the Future Together"}
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base mb-10">
                {R
                  ? "نجمع بين شراكات استراتيجية مع شركات رائدة وبنية تقنية متطورة لتقديم منصة موحدة وآمنة وقابلة للتوسع."
                  : "We combine strategic business partnerships with a world-class technology stack to deliver a unified, secure and scalable platform."}
              </p>
              <div className="inline-flex rounded-xl border border-border/50 p-1 bg-secondary/20 gap-1">
                <button onClick={() => setTab("partners")}
                  className={cn("px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                    tab === "partners" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <Handshake className="w-4 h-4" />{R ? "شركاء الأعمال" : "Business Partners"}
                </button>
                <button onClick={() => setTab("tech")}
                  className={cn("px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                    tab === "tech" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <Cpu className="w-4 h-4" />{R ? "التقنيات المستخدمة" : "Technology Stack"}
                </button>
              </div>
            </div>
          </section>

          {/* ══ TAB 1: BUSINESS PARTNERS ══ */}
          {tab === "partners" && (
            <section className="pb-20 relative">
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[130px] opacity-[0.05] transition-all duration-700"
                  style={{ background: activeSpecCfg.color }}
                />
              </div>

              <div className="max-w-6xl mx-auto px-4 relative z-10">
                {loading ? (
                  <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  <>
                    {/* ── Filter pills ── */}
                    <div className="flex items-center gap-2 flex-wrap justify-center mb-10">
                      <button
                        onClick={() => setActiveSpec("all")}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all",
                          activeSpec === "all"
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border/80"
                        )}>
                        🌐 {R ? "الكل" : "All"}
                        <span className="px-1.5 py-0.5 rounded-full bg-foreground/10 text-[9px]">{totalCompanies}</span>
                      </button>
                      {specGroups.map((spec) => {
                        const cfg = SPEC_CFG[spec.key] ?? DEFAULT_SPEC_CFG;
                        const isActive = activeSpec === spec.key;
                        return (
                          <button key={spec.key}
                            onClick={() => setActiveSpec(isActive ? "all" : spec.key)}
                            className={cn(
                              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all",
                              isActive ? "text-white" : "border-border/50 text-muted-foreground hover:text-foreground"
                            )}
                            style={isActive
                              ? { background: cfg.color, borderColor: cfg.color, boxShadow: `0 4px 20px ${cfg.color}50` }
                              : {}}>
                            <span>{spec.icon}</span>
                            {R ? spec.arLabel : spec.enLabel}
                            <span className="px-1.5 py-0.5 rounded-full bg-foreground/10 text-[9px]">{spec.companies.length}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* ── ALL VIEW: 2-column category cards ── */}
                    {activeSpec === "all" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {specGroups.map((spec) => {
                          const cfg = SPEC_CFG[spec.key] ?? DEFAULT_SPEC_CFG;
                          return (
                            <div key={spec.key}
                              className="rounded-2xl border overflow-hidden flex flex-col"
                              style={{ borderColor: `${cfg.color}28` }}>

                              {/* ── Card header ── */}
                              <div className="flex items-center gap-3 px-5 py-4 border-b"
                                style={{ borderColor: `${cfg.color}20`, background: `${cfg.color}09` }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                                  style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
                                  {spec.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-display font-black leading-snug" style={{ color: cfg.color }}>
                                    {R ? spec.arLabel : spec.enLabel}
                                  </h3>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {spec.companies.length} {R ? "شركة" : "companies"}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setActiveSpec(spec.key)}
                                  className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0"
                                  style={{ background: `${cfg.color}15`, color: cfg.color }}>
                                  {R ? "عرض الكل" : "View all"} <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>

                              {/* ── Company list ── */}
                              <div className="p-4 flex flex-col gap-2 flex-1">
                                {spec.companies.map((c, ci) => (
                                  <button
                                    key={c.id ?? ci}
                                    onClick={() => setActiveSpec(spec.key)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border text-start transition-all hover:-translate-y-0.5 w-full"
                                    style={{ borderColor: `${cfg.color}20`, background: `${cfg.color}05` }}
                                    onMouseEnter={e => {
                                      (e.currentTarget as HTMLElement).style.background = `${cfg.color}12`;
                                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${cfg.color}18`;
                                    }}
                                    onMouseLeave={e => {
                                      (e.currentTarget as HTMLElement).style.background = `${cfg.color}05`;
                                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                                    }}>
                                    {/* Colored dot */}
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
                                    <span className="text-[12px] font-semibold flex-1 leading-snug" style={{ color: cfg.color }}>
                                      {R ? c.name_ar : c.name_en}
                                    </span>
                                    {c.is_featured && (
                                      <span className="text-[8px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                                        style={{ background: `${cfg.color}20`, color: cfg.color }}>
                                        ⭐ {R ? "مميز" : "Top"}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── SINGLE SPEC VIEW ── */}
                    {activeSpec !== "all" && activeSpecGroup && (
                      <>
                        {/* Spec banner */}
                        <div className="mb-8 rounded-2xl border p-5 flex items-center gap-4"
                          style={{ borderColor: `${activeSpecCfg.color}30`, background: `${activeSpecCfg.color}08` }}>
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                            style={{ background: `${activeSpecCfg.color}15`, border: `1px solid ${activeSpecCfg.color}30` }}>
                            {activeSpecGroup.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-display font-black mb-1" style={{ color: activeSpecCfg.color }}>
                              {R ? activeSpecGroup.arLabel : activeSpecGroup.enLabel}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {activeSpecGroup.companies.length} {R ? "شركة شريكة في هذا القطاع" : "partner companies in this sector"}
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveSpec("all")}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/40 hover:border-border shrink-0">
                            {R ? "↩ رجوع" : "← Back"}
                          </button>
                        </div>

                        {/* Company cards — featured spotlight + regular grid */}
                        {(() => {
                          const featured = visibleCompanies.filter(c => c.is_featured);
                          const regular  = visibleCompanies.filter(c => !c.is_featured);
                          return (
                            <div className="mb-10 space-y-6">
                              {/* ── Featured partners ── */}
                              {featured.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 ps-1">
                                    {R ? "شركاء مميزون" : "Featured Partners"}
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {featured.map((c, ci) => (
                                      <div key={c.id ?? ci}
                                        className="rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1"
                                        style={{ borderColor: `${activeSpecCfg.color}40`, background: `linear-gradient(135deg, ${activeSpecCfg.color}10 0%, transparent 60%)` }}
                                        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 32px ${activeSpecCfg.color}28`)}
                                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                                        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${activeSpecCfg.color}, ${activeSpecCfg.color}30)` }} />
                                        <div className="p-6">
                                          <div className="flex items-start gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                                              style={{ background: `${activeSpecCfg.color}18`, border: `1px solid ${activeSpecCfg.color}35` }}>
                                              {c.icon ?? (c.logo_url && c.logo_url.length <= 2 ? c.logo_url : null) ?? "🏢"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                <h4 className="font-bold text-base leading-snug" style={{ color: activeSpecCfg.color }}>
                                                  {R ? c.name_ar : c.name_en}
                                                </h4>
                                                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border"
                                                  style={{ background: `${activeSpecCfg.color}15`, color: activeSpecCfg.color, borderColor: `${activeSpecCfg.color}30` }}>
                                                  ⭐ {R ? "شريك مميز" : "Featured Partner"}
                                                </span>
                                              </div>
                                              {(R ? c.desc_ar : c.desc_en) && (
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                  {R ? c.desc_ar : c.desc_en}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {c.website_url && (
                                              <a href={c.website_url} target="_blank" rel="noopener noreferrer"
                                                className="text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                                                onClick={e => e.stopPropagation()}>
                                                <ExternalLink className="w-3 h-3" />{R ? "الموقع الرسمي" : "Official Website"}
                                              </a>
                                            )}
                                            <button
                                              onClick={() => openModal("partner", `Partnership — ${c.name_en}`, `شراكة — ${c.name_ar}`)}
                                              className="text-[11px] font-semibold flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all text-white"
                                              style={{ background: activeSpecCfg.color }}>
                                              {R ? "تواصل الآن" : "Partner with Us"} <ChevronRight className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ── Regular partners ── */}
                              {regular.length > 0 && (
                                <div>
                                  {featured.length > 0 && (
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 ps-1">
                                      {R ? "شركاء آخرون" : "More Partners"}
                                    </p>
                                  )}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {regular.map((c, ci) => (
                                      <div key={c.id ?? ci}
                                        className="group rounded-xl border bg-background/50 flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                                        style={{ borderColor: `${activeSpecCfg.color}25` }}
                                        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 20px ${activeSpecCfg.color}18`)}
                                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                                        <div className="h-0.5 w-full" style={{ background: activeSpecCfg.color }} />
                                        <div className="p-4 flex flex-col flex-1">
                                          <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                                              style={{ background: `${activeSpecCfg.color}15`, border: `1px solid ${activeSpecCfg.color}25` }}>
                                              {c.icon ?? (c.logo_url && c.logo_url.length <= 2 ? c.logo_url : null) ?? "🏢"}
                                            </div>
                                            <h4 className="font-bold text-sm leading-snug" style={{ color: activeSpecCfg.color }}>
                                              {R ? c.name_ar : c.name_en}
                                            </h4>
                                          </div>
                                          {(R ? c.desc_ar : c.desc_en) && (
                                            <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3 line-clamp-2">
                                              {R ? c.desc_ar : c.desc_en}
                                            </p>
                                          )}
                                          <div className="mt-auto flex items-center gap-2">
                                            {c.website_url ? (
                                              <a href={c.website_url} target="_blank" rel="noopener noreferrer"
                                                className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                                                onClick={e => e.stopPropagation()}>
                                                <ExternalLink className="w-3 h-3" />{R ? "الموقع" : "Website"}
                                              </a>
                                            ) : <span />}
                                            <button
                                              onClick={() => openModal("partner", `Partnership — ${c.name_en}`, `شراكة — ${c.name_ar}`)}
                                              className="ms-auto text-[10px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all"
                                              style={{ background: `${activeSpecCfg.color}15`, color: activeSpecCfg.color }}>
                                              {R ? "تواصل" : "Inquire"} <ChevronRight className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {/* ── Benefits ── */}
                    <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-amber-500/5 p-8 md:p-12 mb-10 mt-6">
                      <div className="text-center mb-8">
                        <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">
                          {R ? "مزايا الشراكة" : "Partnership Benefits"}
                        </Badge>
                        <h2 className="text-2xl font-display font-black mb-2">
                          {R ? "لماذا تصبح شريكاً لـ KemetRise؟" : "Why Partner with KemetRise?"}
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          {R
                            ? "شراكتنا تعني اتفاقية رسمية واضحة الحقوق والالتزامات مع دعم متكامل."
                            : "Our partnerships are formal agreements with clear rights, obligations and comprehensive support."}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {BENEFITS.map((b) => (
                          <div key={b.en} className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/40">
                            <span className="text-xl shrink-0">{b.icon}</span>
                            <p className="text-xs text-muted-foreground leading-relaxed">{R ? b.ar : b.en}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Button size="lg" className="gap-2 gold-glow"
                          onClick={() => openModal("partner", "Partnership Application — KemetRise", "طلب شراكة — KemetRise")}>
                          {R ? "تقدّم بطلب شراكة" : "Apply for Partnership"} <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button size="lg" variant="outline"
                          onClick={() => openModal("partner", "Contact Partner Team", "التواصل مع فريق الشراكات")}>
                          {R ? "تواصل مع فريق الشراكات" : "Contact Partner Team"}
                        </Button>
                      </div>
                    </div>

                    {/* ── Stats ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      {[
                        { val:"6",   en:"Specializations", ar:"تخصص"          },
                        { val:"30%", en:"Max Commission",   ar:"أقصى عمولة"   },
                        { val:"40+", en:"Target Countries", ar:"دولة مستهدفة" },
                        { val:"24h", en:"Partner Support",  ar:"دعم الشركاء"  },
                      ].map((s) => (
                        <div key={s.en} className="p-4 rounded-xl border border-border/40 bg-secondary/10">
                          <p className="text-2xl font-display font-black text-primary mb-1">{s.val}</p>
                          <p className="text-xs text-muted-foreground">{R ? s.ar : s.en}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* ══ TAB 2: TECHNOLOGY STACK (Platinum / Gold / Silver) ══ */}
          {tab === "tech" && (
            <section className="pb-20">
              <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-display font-black mb-3">
                    {R ? "التقنيات التي نبني بها المنصة" : "Technologies Powering Our Platform"}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                    {R
                      ? "بنينا KemetRise على أفضل الأدوات والأطر التقنية لضمان الأداء والأمان وسرعة التطوير."
                      : "KemetRise is built on the world's best tools and frameworks to ensure performance, security and development velocity."}
                  </p>
                </div>

                {/* Tier filter */}
                <div className="flex items-center gap-2 justify-center mb-8 flex-wrap">
                  <button onClick={() => setActiveTier("all")}
                    className={cn("px-4 py-1.5 rounded-full border text-xs font-medium transition-all",
                      activeTier === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
                    {R ? "الكل" : "All"}
                  </button>
                  {TIERS_ORDER.map((t) => (
                    <button key={t} onClick={() => setActiveTier(t)}
                      className={cn("px-4 py-1.5 rounded-full border text-xs font-medium transition-all capitalize",
                        activeTier === t ? TIER_COLORS[t].badge : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
                      {R ? TIER_COLORS[t].labelAr : TIER_COLORS[t].label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="flex justify-center py-24">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                      {filtered.map((p) => {
                        const tier = TIER_COLORS[p.tier];
                        const colorTxt = PAL[p.color] || "text-primary";
                        return (
                          <Card key={p.id} className={cn("group flex flex-col p-5 border transition-all hover:-translate-y-1 hover:shadow-xl bg-gradient-to-b to-transparent", tier.border, tier.bg)}>
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-3xl">{p.icon}</span>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className={`text-[10px] px-2 py-0 ${tier.badge}`}>
                                  {R ? tier.labelAr : tier.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{R ? p.category_ar : p.category}</span>
                              </div>
                            </div>
                            <h3 className={cn("font-bold text-sm mb-3", colorTxt)}>{R ? p.name_ar : p.name_en}</h3>
                            <p className="text-xs text-muted-foreground flex-1 leading-relaxed mb-4">{R ? p.desc_ar : p.desc_en}</p>
                            {p.website_url && (
                              <a href={p.website_url} target="_blank" rel="noopener noreferrer"
                                className={cn("text-xs font-medium flex items-center gap-1 hover:underline w-fit", colorTxt)}>
                                {R ? "زيارة الموقع" : "Visit Website"} <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </Card>
                        );
                      })}
                    </div>

                    {/* Open-source note */}
                    <div className="rounded-2xl border border-border/40 bg-secondary/10 p-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1">
                          {R ? "بنية تقنية مفتوحة المصدر وموثوقة" : "Open-source & Battle-tested Stack"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {R
                            ? "جميع التقنيات الأساسية مفتوحة المصدر أو ذات سمعة مؤسسية راسخة، مما يضمن الاستدامة والشفافية."
                            : "All core technologies are open-source or enterprise-grade with proven track records, ensuring sustainability and transparency."}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0"
                        onClick={() => openModal("service", "Technical Stack Inquiry", "استفسار عن Stack التقني")}>
                        {R ? "اسأل عن Stack التقني" : "Ask About Our Stack"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

        </div>
      </PublicLayout>

      <LeadCaptureModal
        open={modal.open}
        onClose={() => setModal(prev => ({ ...prev, open: false }))}
        type={modal.type as any}
        isAr={R}
        meta={{
          icon: modal.type === "partner" ? "🤝" : "🛠️",
          color: "#D4A017",
          refName: R ? modal.refNameAr : modal.refNameEn,
        }}
      />
    </>
  );
}
