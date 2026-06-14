import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Check, X, Crown, Sparkles, Zap, Star,
  ArrowRight, Shield, Globe, BarChart3,
  Bot, Package, Layers, Building2, Wallet,
  ChevronDown, ChevronUp,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════ */
type Interval = "monthly" | "annual";
type Tab = "subscriptions" | "products" | "services" | "sectors";

/* ═══════════════════════════════════════════════════════════════════════
   SUBSCRIPTION PLANS
═══════════════════════════════════════════════════════════════════════ */
type PlanDef = {
  id: string; name: string; nameAr: string; badge?: string; badgeColor?: string;
  icon: React.ElementType; iconColor: string; gradient: string; border: string;
  highlighted?: boolean;
  price: { monthly: number; annual: number }; currency: string;
  tagline: string; taglineAr: string;
  features: { text: string; textAr: string; included: boolean }[];
  limits: { label: string; labelAr: string; value: string }[];
  cta: string; ctaAr: string;
};

const PLANS: PlanDef[] = [
  {
    id: "free", name: "Starter", nameAr: "المبتدئ", icon: Zap, iconColor: "text-emerald-400",
    gradient: "from-emerald-500/10 to-transparent", border: "border-emerald-500/20",
    price: { monthly: 0, annual: 0 }, currency: "USD",
    tagline: "Explore the platform at no cost", taglineAr: "استكشف المنصة مجاناً",
    features: [
      { text: "1 Brand workspace",            textAr: "بيئة عمل براند واحدة",   included: true  },
      { text: "Up to 5 users",                textAr: "حتى 5 مستخدمين",          included: true  },
      { text: "Basic ERP modules",            textAr: "وحدات ERP أساسية",         included: true  },
      { text: "100 transactions/mo",          textAr: "100 معاملة/شهر",           included: true  },
      { text: "Community support",            textAr: "دعم المجتمع",              included: true  },
      { text: "AI Agents",                    textAr: "وكلاء AI",                 included: false },
      { text: "Advanced Analytics",           textAr: "تحليلات متقدمة",           included: false },
      { text: "Custom domains",               textAr: "نطاقات مخصصة",             included: false },
    ],
    limits: [
      { label: "Storage",   labelAr: "تخزين",       value: "1 GB"  },
      { label: "API Calls", labelAr: "طلبات API",   value: "1K/mo" },
      { label: "Reports",   labelAr: "تقارير",      value: "5"     },
    ],
    cta: "Get Started Free", ctaAr: "ابدأ مجاناً",
  },
  {
    id: "business", name: "Business", nameAr: "الأعمال", badge: "Most Popular", badgeColor: "bg-primary text-primary-foreground",
    icon: BarChart3, iconColor: "text-primary", gradient: "from-primary/15 to-amber-500/5",
    border: "border-primary/40", highlighted: true,
    price: { monthly: 149, annual: 119 }, currency: "USD",
    tagline: "For growing businesses", taglineAr: "للشركات النامية",
    features: [
      { text: "5 Brand workspaces",           textAr: "5 بيئات عمل براند",       included: true  },
      { text: "Up to 50 users",               textAr: "حتى 50 مستخدماً",          included: true  },
      { text: "Full ERP suite",               textAr: "حزمة ERP كاملة",           included: true  },
      { text: "Unlimited transactions",       textAr: "معاملات غير محدودة",       included: true  },
      { text: "Priority support",             textAr: "دعم أولوية",               included: true  },
      { text: "5 AI Agents",                  textAr: "5 وكلاء AI",               included: true  },
      { text: "Advanced Analytics",           textAr: "تحليلات متقدمة",           included: true  },
      { text: "Custom domains",               textAr: "نطاقات مخصصة",             included: false },
    ],
    limits: [
      { label: "Storage",   labelAr: "تخزين",       value: "50 GB"    },
      { label: "API Calls", labelAr: "طلبات API",   value: "100K/mo"  },
      { label: "Reports",   labelAr: "تقارير",      value: "Unlimited"},
    ],
    cta: "Start Business", ctaAr: "ابدأ خطة الأعمال",
  },
  {
    id: "enterprise", name: "Enterprise", nameAr: "المؤسسي", badge: "Full Power", badgeColor: "bg-violet-500 text-white",
    icon: Crown, iconColor: "text-violet-400", gradient: "from-violet-500/10 to-blue-500/5",
    border: "border-violet-500/30",
    price: { monthly: 499, annual: 399 }, currency: "USD",
    tagline: "For large organisations", taglineAr: "للمؤسسات الكبيرة",
    features: [
      { text: "Unlimited Brand workspaces",   textAr: "بيئات عمل براند غير محدودة", included: true },
      { text: "Unlimited users",              textAr: "مستخدمون غير محدودون",       included: true },
      { text: "Full ERP + custom modules",    textAr: "ERP كامل + وحدات مخصصة",     included: true },
      { text: "Unlimited transactions",       textAr: "معاملات غير محدودة",          included: true },
      { text: "24/7 dedicated support",       textAr: "دعم مخصص 24/7",              included: true },
      { text: "Unlimited AI Agents",          textAr: "وكلاء AI غير محدودين",       included: true },
      { text: "Advanced Analytics + BI",      textAr: "تحليلات متقدمة + BI",        included: true },
      { text: "Custom domains + White Label", textAr: "نطاقات + White Label",        included: true },
    ],
    limits: [
      { label: "Storage",   labelAr: "تخزين",       value: "1 TB+"     },
      { label: "API Calls", labelAr: "طلبات API",   value: "Unlimited" },
      { label: "Reports",   labelAr: "تقارير",      value: "Unlimited" },
    ],
    cta: "Contact Sales", ctaAr: "تواصل مع المبيعات",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   ONE-TIME PRODUCTS
═══════════════════════════════════════════════════════════════════════ */
const PRODUCTS = [
  { id: "erp",     icon: "⚡", color: "amber",   name: "Enterprise ERP Licence",        nameAr: "رخصة ERP المؤسسي",           price: 999,  desc: "Full ERP — finance, HR, inventory, CRM. Perpetual licence.",         descAr: "ERP كامل: مالية، موارد بشرية، مخزون، CRM. رخصة دائمة.",   tag: "Software"  },
  { id: "hr",      icon: "👥", color: "violet",  name: "HR & Attendance Module",         nameAr: "وحدة الموارد البشرية",        price: 299,  desc: "QR biometric attendance, payroll, leave & shift management.",         descAr: "حضور QR، رواتب، إجازات وورديات.",                           tag: "Software"  },
  { id: "inv",     icon: "📦", color: "indigo",  name: "Inventory & Warehouse Module",   nameAr: "وحدة المخزون والمستودع",     price: 349,  desc: "SKU management, barcode scanning, multi-location tracking.",           descAr: "إدارة SKU، باركود، تتبع متعدد المواقع.",                   tag: "Software"  },
  { id: "ai",      icon: "🤖", color: "cyan",    name: "AI Agent Pack (10 Agents)",      nameAr: "حزمة وكلاء AI — 10 وكلاء",   price: 499,  desc: "Deploy 10 custom brand AI agents powered by GPT-4o.",               descAr: "10 وكلاء AI مخصصين مدعومين بـ GPT-4o.",                    tag: "AI"        },
  { id: "api",     icon: "🔑", color: "blue",    name: "API Access Token — Unlimited",   nameAr: "رمز وصول API غير محدود",     price: 99,   desc: "Unlimited REST API calls, webhooks, sandbox & dev portal.",           descAr: "طلبات API غير محدودة، Webhooks، Sandbox.",                 tag: "Tech"      },
  { id: "sec",     icon: "🛡️", color: "red",     name: "Security & Compliance Pack",     nameAr: "حزمة الأمان والامتثال",      price: 249,  desc: "Row Level Security, audit logs, IP whitelist, SSO + 2FA.",            descAr: "أمان RLS، سجلات تدقيق، SSO + 2FA.",                        tag: "Security"  },
  { id: "partner", icon: "🤝", color: "emerald", name: "Partner Workspace Licence",      nameAr: "رخصة بيئة عمل الشريك",      price: 599,  desc: "Isolated multi-tenant workspace, team mgmt & revenue sharing.",       descAr: "بيئة عمل معزولة، إدارة فريق وتشارك إيرادات.",             tag: "Platform"  },
  { id: "brand",   icon: "✨", color: "pink",    name: "Brand Identity Design Package",  nameAr: "حزمة تصميم الهوية التجارية", price: 199,  desc: "Logo, colour palette, typography & full brand guidelines.",           descAr: "شعار، ألوان، خطوط وإرشادات العلامة التجارية.",            tag: "Design"    },
];

/* ═══════════════════════════════════════════════════════════════════════
   SERVICES
═══════════════════════════════════════════════════════════════════════ */
const SERVICES = [
  { id: "s1", icon: Building2, color: "amber",  name: "Business Setup Consulting",      nameAr: "استشارة إعداد الأعمال",       price: 499, unit: "project", unitAr: "مشروع", desc: "Company formation, legal structure, licensing & digital presence.",    descAr: "تأسيس شركة، هيكل قانوني، ترخيص وحضور رقمي."     },
  { id: "s2", icon: Globe,     color: "blue",   name: "ERP Implementation & Setup",     nameAr: "تطبيق ERP وإعداده",           price: 999, unit: "project", unitAr: "مشروع", desc: "Full ERP onboarding, data migration, team training & go-live support.", descAr: "إعداد ERP، نقل بيانات، تدريب فريق ودعم الإطلاق." },
  { id: "s3", icon: Bot,       color: "cyan",   name: "AI Agent Customisation",         nameAr: "تخصيص وكيل AI",              price: 299, unit: "agent",   unitAr: "وكيل",  desc: "Custom-train a brand AI agent with your knowledge base & workflows.",   descAr: "تدريب وكيل AI مخصص بقاعدة معرفتك وسير عملك."    },
  { id: "s4", icon: BarChart3, color: "violet", name: "Analytics & BI Dashboard Setup", nameAr: "إعداد لوحة تحليلات BI",      price: 399, unit: "project", unitAr: "مشروع", desc: "Custom BI dashboards, KPI setup, automated reports & data pipelines.",  descAr: "لوحات BI، KPI، تقارير آلية وتدفق بيانات."        },
  { id: "s5", icon: Wallet,    color: "orange", name: "Payment Gateway Integration",    nameAr: "دمج بوابة الدفع",             price: 249, unit: "gateway", unitAr: "بوابة", desc: "Stripe, PayPal, Fawry or custom PG integration with testing & go-live.", descAr: "دمج Stripe, PayPal, فوري أو بوابة مخصصة."        },
  { id: "s6", icon: Shield,    color: "red",    name: "Security Audit & Hardening",     nameAr: "تدقيق وتصليب الأمان",        price: 599, unit: "audit",   unitAr: "تدقيق", desc: "Full security assessment, RLS review, penetration testing & compliance.", descAr: "تقييم أمني، مراجعة RLS، اختبار اختراق وامتثال."  },
];

/* ═══════════════════════════════════════════════════════════════════════
   SECTOR BUNDLES
═══════════════════════════════════════════════════════════════════════ */
const SECTORS = [
  { id: "hosp",  icon: "🏨", color: "amber",  name: "Hospitality Bundle",   nameAr: "حزمة الضيافة",        price: 299, features_en: ["Hotel PMS", "Room Booking", "F&B Module", "Guest CRM"],           features_ar: ["إدارة فندق","حجز غرف","وحدة F&B","CRM الضيوف"]            },
  { id: "hlth",  icon: "🏥", color: "red",    name: "Healthcare Bundle",    nameAr: "حزمة الرعاية الصحية", price: 399, features_en: ["Patient Records", "Appointment Mgmt", "Billing", "Lab Module"],   features_ar: ["سجلات المرضى","إدارة المواعيد","الفواتير","المختبر"]       },
  { id: "ret",   icon: "🛒", color: "blue",   name: "Retail Bundle",        nameAr: "حزمة التجزئة",        price: 249, features_en: ["POS System", "Inventory", "Loyalty Cards", "E-Commerce"],        features_ar: ["نظام POS","مخزون","بطاقات ولاء","تجارة إلكترونية"]         },
  { id: "edu",   icon: "🎓", color: "violet", name: "Education Bundle",     nameAr: "حزمة التعليم",        price: 199, features_en: ["LMS", "Student Records", "Online Exams", "Fee Management"],      features_ar: ["LMS","سجلات طلاب","امتحانات","إدارة الرسوم"]               },
  { id: "const", icon: "🏗️", color: "orange","name": "Construction Bundle", nameAr: "حزمة البناء",         price: 349, features_en: ["Project Tracking", "BOQ", "Contractor Mgmt", "Safety Logs"],    features_ar: ["تتبع المشاريع","جداول الكميات","المقاولين","سجلات السلامة"] },
  { id: "logis", icon: "🚚", color: "teal",   name: "Logistics Bundle",     nameAr: "حزمة اللوجستيات",    price: 299, features_en: ["Fleet Tracking", "Routing", "Delivery Mgmt", "Fuel Logs"],       features_ar: ["تتبع الأسطول","التوجيه","إدارة التوصيل","سجلات الوقود"]    },
];

/* ═══════════════════════════════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════════════════════════════ */
const FAQ = [
  { q: "Can I switch plans later?",              qAr: "هل يمكنني تغيير الخطة لاحقاً؟",          a: "Yes, upgrade or downgrade anytime. Changes take effect on the next billing cycle.",                                                               aAr: "نعم، يمكنك الترقية أو التخفيض في أي وقت. تسري التغييرات في دورة الفوترة التالية."                    },
  { q: "Is there a free trial?",                 qAr: "هل هناك فترة تجريبية مجانية؟",            a: "The Starter plan is free forever. All paid plans include a 14-day free trial.",                                                                    aAr: "خطة المبتدئ مجانية للأبد. تتضمن جميع الخطط المدفوعة تجربة مجانية 14 يوماً."                           },
  { q: "What payment methods are accepted?",     qAr: "ما طرق الدفع المقبولة؟",                  a: "Visa, Mastercard, Fawry, PayPal, bank transfer. All transactions are encrypted.",                                                                aAr: "Visa, Mastercard، فوري، PayPal، تحويل بنكي. جميع المعاملات مشفرة."                                    },
  { q: "Can I get a custom quote?",              qAr: "هل يمكنني الحصول على عرض سعر مخصص؟",     a: "Absolutely. Contact our sales team for enterprise pricing, volume discounts and custom integrations.",                                             aAr: "بالتأكيد. تواصل مع فريق المبيعات للحصول على تسعير المؤسسات وخصومات الكميات."                          },
  { q: "Do sector bundles require a base plan?", qAr: "هل تتطلب حزم القطاعات خطة أساسية؟",      a: "Sector bundles are add-ons to any paid plan. They activate industry-specific modules within your workspace.",                                     aAr: "حزم القطاعات إضافات لأي خطة مدفوعة. تُفعّل وحدات خاصة بالصناعة داخل بيئة عملك."                     },
];

/* ═══════════════════════════════════════════════════════════════════════
   COLOR PALETTE
═══════════════════════════════════════════════════════════════════════ */
const PAL: Record<string, { bg: string; border: string; badge: string; txt: string }> = {
  amber:   { bg: "from-amber-500/15 to-transparent",    border: "border-amber-500/30",   badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",     txt: "text-amber-400"   },
  cyan:    { bg: "from-cyan-500/15 to-transparent",      border: "border-cyan-500/30",    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",         txt: "text-cyan-400"    },
  violet:  { bg: "from-violet-500/15 to-transparent",    border: "border-violet-500/30",  badge: "bg-violet-500/15 text-violet-400 border-violet-500/30",   txt: "text-violet-400"  },
  pink:    { bg: "from-pink-500/15 to-transparent",      border: "border-pink-500/30",    badge: "bg-pink-500/15 text-pink-400 border-pink-500/30",         txt: "text-pink-400"    },
  orange:  { bg: "from-orange-500/15 to-transparent",    border: "border-orange-500/30",  badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",   txt: "text-orange-400"  },
  blue:    { bg: "from-blue-500/15 to-transparent",      border: "border-blue-500/30",    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",         txt: "text-blue-400"    },
  red:     { bg: "from-red-500/15 to-transparent",       border: "border-red-500/30",     badge: "bg-red-500/15 text-red-400 border-red-500/30",            txt: "text-red-400"     },
  emerald: { bg: "from-emerald-500/15 to-transparent",   border: "border-emerald-500/30", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", txt: "text-emerald-400" },
  indigo:  { bg: "from-indigo-500/15 to-transparent",    border: "border-indigo-500/30",  badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",   txt: "text-indigo-400"  },
  teal:    { bg: "from-teal-500/15 to-transparent",      border: "border-teal-500/30",    badge: "bg-teal-500/15 text-teal-400 border-teal-500/30",         txt: "text-teal-400"    },
  Security:{ bg: "from-red-500/15 to-transparent",       border: "border-red-500/30",     badge: "bg-red-500/15 text-red-400 border-red-500/30",            txt: "text-red-400"     },
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const [interval, setInterval] = useState<Interval>("monthly");
  const [tab, setTab] = useState<Tab>("subscriptions");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const goTo = (path: string) => {
    if (!user) navigate(`/auth?tab=signin&redirect=${path}`);
    else navigate(path);
  };

  const TABS: { id: Tab; label: string; labelAr: string; icon: React.ElementType }[] = [
    { id: "subscriptions", label: "Subscriptions",  labelAr: "الاشتراكات",    icon: Crown   },
    { id: "products",      label: "Products",        labelAr: "المنتجات",       icon: Package },
    { id: "services",      label: "Services",        labelAr: "الخدمات",        icon: Sparkles},
    { id: "sectors",       label: "Sector Bundles",  labelAr: "حزم القطاعات",   icon: Layers  },
  ];

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs gap-2 px-4 py-1.5">
            <Crown className="w-3.5 h-3.5" />
            {R ? "الأسعار والخطط" : "Pricing & Plans"}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-black mb-4 leading-tight">
            {R ? "اختر خطتك" : "Choose Your Plan"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base mb-10">
            {R ? "تسعير شفاف — لا رسوم خفية. ابدأ مجاناً، أو اختر الخطة التي تناسب نموك." : "Transparent pricing — no hidden fees. Start free, or pick the plan that fits your growth."}
          </p>
          <div className="inline-flex items-center gap-1 bg-secondary/40 border border-border/60 rounded-xl p-1">
            {(["monthly", "annual"] as Interval[]).map(i => (
              <button key={i} onClick={() => setInterval(i)}
                className={cn("px-5 py-2 rounded-lg text-xs font-semibold transition-all", interval === i ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {i === "monthly" ? (R ? "شهري" : "Monthly") : (R ? "سنوي" : "Annual")}
                {i === "annual" && <span className="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">-20%</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tab Selector ──────────────────────────────────────────────── */}
      <section className="pb-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-10">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all",
                  tab === t.id ? "bg-primary/10 border-primary/40 text-primary shadow-sm" : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/20")}>
                <t.icon className="w-3.5 h-3.5" />{R ? t.labelAr : t.label}
              </button>
            ))}
          </div>

          {/* ── Subscriptions ─────────────────────────────────────────── */}
          {tab === "subscriptions" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map(plan => (
                <div key={plan.id}
                  className={cn("relative rounded-2xl border p-6 flex flex-col transition-all", `bg-gradient-to-b ${plan.gradient}`, plan.border, plan.highlighted ? "shadow-xl shadow-primary/10 scale-[1.02]" : "hover:shadow-lg")}>
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${plan.badgeColor}`}>{plan.badge}</span>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center", `border ${plan.border}`)}>
                      <plan.icon className={`w-5 h-5 ${plan.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base">{R ? plan.nameAr : plan.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{R ? plan.taglineAr : plan.tagline}</p>
                    </div>
                  </div>
                  <div className="mb-5">
                    <div className="flex items-end gap-1">
                      <span className="font-display text-4xl font-black text-primary">
                        {plan.price.monthly === 0 ? "FREE" : `$${interval === "monthly" ? plan.price.monthly : plan.price.annual}`}
                      </span>
                      {plan.price.monthly > 0 && (
                        <span className="text-xs text-muted-foreground mb-1.5">/{R ? (interval === "monthly" ? "شهر" : "شهر، سنوياً") : (interval === "monthly" ? "mo" : "mo, billed annually")}</span>
                      )}
                    </div>
                    {interval === "annual" && plan.price.monthly > 0 && (
                      <p className="text-[11px] text-emerald-400 mt-0.5">{R ? `وفّر $${(plan.price.monthly - plan.price.annual) * 12}/سنة` : `Save $${(plan.price.monthly - plan.price.annual) * 12}/yr`}</p>
                    )}
                  </div>
                  <div className="flex gap-4 mb-5 flex-wrap">
                    {plan.limits.map(l => (
                      <div key={l.label}>
                        <span className="text-[10px] text-muted-foreground block">{R ? l.labelAr : l.label}</span>
                        <span className="text-xs font-semibold">{l.value}</span>
                      </div>
                    ))}
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className={cn("flex items-start gap-2 text-xs", f.included ? "text-foreground" : "text-muted-foreground/40 line-through")}>
                        {f.included ? <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted-foreground/30 mt-0.5 shrink-0" />}
                        {R ? f.textAr : f.text}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => goTo(plan.id === "enterprise" ? "/contact" : "/auth?tab=signup")}
                    variant={plan.highlighted ? "default" : "outline"} className="w-full gap-2">
                    {R ? plan.ctaAr : plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* ── Products ──────────────────────────────────────────────── */}
          {tab === "products" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRODUCTS.map(p => {
                const pal = PAL[p.color] || PAL.amber;
                return (
                  <Card key={p.id} className={`group flex flex-col p-5 border ${pal.border} bg-gradient-to-b ${pal.bg} hover:-translate-y-1 hover:shadow-lg transition-all`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{p.icon}</span>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0 ${pal.badge}`}>{p.tag}</Badge>
                    </div>
                    <h3 className="text-sm font-bold mb-1">{R ? p.nameAr : p.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4 flex-1">{R ? p.descAr : p.desc}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <div>
                        <span className="text-lg font-black text-primary">${p.price}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">{R ? "مرة واحدة" : "one-time"}</span>
                      </div>
                      <Button size="sm" className="text-xs h-7 gap-1" onClick={() => goTo("/marketplace")}>
                        {R ? "اشترِ" : "Buy"} <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── Services ──────────────────────────────────────────────── */}
          {tab === "services" && (
            <div className="space-y-3">
              {SERVICES.map(s => {
                const pal = PAL[s.color] || PAL.amber;
                return (
                  <Card key={s.id} className={`flex items-center gap-4 p-4 border ${pal.border} hover:shadow-md transition-all`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${pal.bg} border ${pal.border} shrink-0`}>
                      <s.icon className={`w-5 h-5 ${pal.txt}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-sm font-bold">{R ? s.nameAr : s.name}</h3>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0 ${pal.badge}`}>{R ? s.unitAr : s.unit}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{R ? s.descAr : s.desc}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-black text-primary">${s.price}</p>
                      <p className="text-[10px] text-muted-foreground">{R ? `لكل ${s.unitAr}` : `per ${s.unit}`}</p>
                      <Button size="sm" className="mt-2 text-xs h-7 gap-1" variant="outline" onClick={() => goTo("/contact")}>
                        {R ? "احجز" : "Book"} <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── Sectors ───────────────────────────────────────────────── */}
          {tab === "sectors" && (
            <>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                {R ? "حزم القطاعات إضافات تُفعَّل فوق أي خطة مدفوعة وتفتح وحدات خاصة بالصناعة." : "Sector bundles are add-ons on top of any paid plan, unlocking industry-specific modules."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SECTORS.map(s => {
                  const pal = PAL[s.color] || PAL.amber;
                  const features = R ? s.features_ar : s.features_en;
                  return (
                    <Card key={s.id} className={`p-5 border ${pal.border} bg-gradient-to-b ${pal.bg} hover:-translate-y-1 hover:shadow-lg transition-all`}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{s.icon}</span>
                        <div>
                          <h3 className="text-sm font-bold">{R ? s.nameAr : s.name}</h3>
                          <p className={`text-base font-black ${pal.txt}`}>${s.price}<span className="text-[11px] font-normal text-muted-foreground ml-1">{R ? "/شهر" : "/mo"}</span></p>
                        </div>
                      </div>
                      <ul className="space-y-1.5 mb-4">
                        {features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                      <Button size="sm" className="w-full gap-1.5 text-xs" variant="outline" onClick={() => goTo("/auth?tab=signup")}>
                        {R ? "تفعيل القطاع" : "Activate Sector"} <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Feature comparison ────────────────────────────────────────── */}
      {tab === "subscriptions" && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl font-display font-bold text-center mb-8">{R ? "مقارنة مفصّلة" : "Detailed Comparison"}</h2>
            <div className="rounded-2xl border border-border/50 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary/20 border-b border-border/50">
                    <th className="text-left p-4 font-semibold text-sm w-1/2">{R ? "الميزة" : "Feature"}</th>
                    {PLANS.map(p => (
                      <th key={p.id} className="p-4 text-center font-semibold">
                        <span className={p.highlighted ? "text-primary" : ""}>{R ? p.nameAr : p.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLANS[0].features.map((f, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                      <td className="p-4 text-muted-foreground">{R ? f.textAr : f.text}</td>
                      {PLANS.map(p => (
                        <td key={p.id} className="p-4 text-center">
                          {p.features[i].included ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-border/30 bg-secondary/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "10K+", label: "Active Users",     labelAr: "مستخدم نشط"   },
              { value: "98%",  label: "Uptime SLA",       labelAr: "ضمان التشغيل" },
              { value: "50+",  label: "Integrations",     labelAr: "تكاملات"       },
              { value: "24/7", label: "Support Coverage", labelAr: "تغطية الدعم"   },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-display font-black text-primary mb-1">{s.value}</p>
                <p className="text-xs text-muted-foreground">{R ? s.labelAr : s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-center mb-10">{R ? "الأسئلة الشائعة" : "Frequently Asked Questions"}</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-border/50 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/20 transition-colors">
                  <span className="text-sm font-medium">{R ? item.qAr : item.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground border-t border-border/30 pt-3">
                    {R ? item.aAr : item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-amber-500/5 p-10 text-center">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
            </div>
            <h2 className="text-3xl font-display font-black mb-2">{R ? "ابدأ رحلتك اليوم" : "Start Your Journey Today"}</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
              {R ? "انضم إلى آلاف الشركات التي تستخدم KemetRise لتشغيل عملياتها." : "Join thousands of businesses using KemetRise to run their operations."}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" onClick={() => goTo("/auth?tab=signup")} className="gap-2 gold-glow">
                <Sparkles className="w-4 h-4" />{R ? "ابدأ مجاناً" : "Get Started Free"}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="gap-2">
                {R ? "تحدث مع المبيعات" : "Talk to Sales"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

