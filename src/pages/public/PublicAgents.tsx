import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import LeadCaptureModal from "@/components/shared/LeadCaptureModal";
import {
  Globe, MapPin, Mail, Phone, X, ChevronRight,
  UserCheck, Building2, Network, ArrowRight, Shield,
  ExternalLink, Users, Briefcase,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  name_en?: string;
  region: string;
  country: string;
  country_en?: string;
  coverage_scope: string | null;
  coverage_scope_en?: string | null;
  contact_email: string | null;
  project_order: number;
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────────
//  REGION CONFIG
// ─────────────────────────────────────────────────────────────────
interface RegionCfg {
  id: string;
  ar: string;
  en: string;
  flag: string;
  color: string;
  borderColor: string;
  bgGlow: string;
  summaryAr: string;
  summaryEn: string;
  countriesAr: string;
  countriesEn: string;
}

const REGIONS: RegionCfg[] = [
  {
    id: "all",
    ar: "جميع الوكلاء",
    en: "All Agents",
    flag: "🌍",
    color: "#D4A017",
    borderColor: "border-[#D4A017]/40",
    bgGlow: "shadow-[#D4A017]/20",
    summaryAr: "الشبكة العالمية الكاملة لوكلاء كيمت رايز",
    summaryEn: "The complete global KemetRise agent network",
    countriesAr: "5 مناطق · 10 دول",
    countriesEn: "5 Regions · 10 Countries",
  },
  {
    id: "الشام",
    ar: "بلاد الشام",
    en: "The Levant",
    flag: "🌿",
    color: "#10b981",
    borderColor: "border-emerald-500/40",
    bgGlow: "shadow-emerald-500/20",
    summaryAr: "إدارة لوجستيات التوزيع والأزياء عبر الأسواق الشامية",
    summaryEn: "Fashion logistics & distribution across Levant markets",
    countriesAr: "لبنان · الأردن · سوريا",
    countriesEn: "Lebanon · Jordan · Syria",
  },
  {
    id: "الخليج",
    ar: "الخليج العربي",
    en: "The GCC",
    flag: "🏙️",
    color: "#3b82f6",
    borderColor: "border-blue-500/40",
    bgGlow: "shadow-blue-500/20",
    summaryAr: "التجارة الإلكترونية والتحول الرقمي في دول مجلس التعاون",
    summaryEn: "E-commerce & digital transformation across the GCC",
    countriesAr: "الإمارات · السعودية · الكويت",
    countriesEn: "UAE · KSA · Kuwait",
  },
  {
    id: "أوروبا",
    ar: "أوروبا",
    en: "Europe",
    flag: "🏛️",
    color: "#8b5cf6",
    borderColor: "border-violet-500/40",
    bgGlow: "shadow-violet-500/20",
    summaryAr: "توزيع الإعلام الإبداعي وترخيص الأعمال الفنية",
    summaryEn: "Creative media distribution & art licensing",
    countriesAr: "ألمانيا · فرنسا · هولندا",
    countriesEn: "Germany · France · Netherlands",
  },
  {
    id: "أمريكا الشمالية",
    ar: "أمريكا الشمالية",
    en: "North America",
    flag: "🚀",
    color: "#06b6d4",
    borderColor: "border-cyan-500/40",
    bgGlow: "shadow-cyan-500/20",
    summaryAr: "تقنيات الذكاء الاصطناعي والأنظمة السحابية متعددة المستأجرين",
    summaryEn: "AI tech stacks & multi-tenant cloud systems",
    countriesAr: "الولايات المتحدة · كندا",
    countriesEn: "United States · Canada",
  },
  {
    id: "أفريقيا",
    ar: "شمال أفريقيا",
    en: "North Africa",
    flag: "🌾",
    color: "#f59e0b",
    borderColor: "border-amber-500/40",
    bgGlow: "shadow-amber-500/20",
    summaryAr: "التوكيلات التجارية والتخليص الجمركي وحوكمة سلسلة الإمداد",
    summaryEn: "Commercial agencies, customs & supply chain governance",
    countriesAr: "مصر · المغرب · تونس",
    countriesEn: "Egypt · Morocco · Tunisia",
  },
];

const REGION_MAP = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

// ─────────────────────────────────────────────────────────────────
//  STATIC FALLBACK DATA
// ─────────────────────────────────────────────────────────────────
const STATIC_AGENTS: Agent[] = [
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
];

// ─────────────────────────────────────────────────────────────────
//  SKELETON CARD
// ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/40 bg-secondary/20 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-secondary/60 rounded w-3/4" />
          <div className="h-3 bg-secondary/40 rounded w-1/3" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-secondary/60" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-secondary/40 rounded w-full" />
        <div className="h-3 bg-secondary/40 rounded w-5/6" />
        <div className="h-3 bg-secondary/40 rounded w-4/6" />
      </div>
      <div className="h-8 bg-secondary/40 rounded-lg w-1/2" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  CONTACT SLIDE-OVER MODAL
// ─────────────────────────────────────────────────────────────────
interface ContactPaneProps {
  agent: Agent | null;
  isAr: boolean;
  onClose: () => void;
}

function ContactPane({ agent, isAr, onClose }: ContactPaneProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const region = agent ? REGION_MAP[agent.region] ?? REGION_MAP.all : null;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = agent ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [agent]);

  if (!agent) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over pane */}
      <div
        className={cn(
          "fixed top-0 bottom-0 z-50 w-full max-w-md bg-background/98 backdrop-blur-xl",
          "border-border shadow-2xl flex flex-col",
          "animate-in slide-in-from-right duration-300",
          isAr ? "left-0 border-r" : "right-0 border-l"
        )}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header strip */}
        <div
          className="px-6 py-5 border-b border-border/50 flex items-start justify-between gap-4"
          style={{ background: `linear-gradient(135deg, ${region?.color}18 0%, transparent 60%)` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{region?.flag}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color: region?.color, borderColor: `${region?.color}50`, background: `${region?.color}15` }}
              >
                {isAr ? region?.ar : region?.en}
              </span>
            </div>
            <h2 className="text-sm font-bold text-foreground leading-snug">{isAr ? agent.name : (agent.name_en || agent.name)}</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{isAr ? agent.country : (agent.country_en || agent.country)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Scope */}
          {agent.coverage_scope && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {isAr ? "نطاق العمليات" : "Operational Scope"}
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">{isAr ? agent.coverage_scope : (agent.coverage_scope_en || agent.coverage_scope)}</p>
            </div>
          )}

          {/* Brand activities */}
          {Array.isArray(agent.brand_activities) && agent.brand_activities.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              {isAr ? "نشاطات العلامات التجارية" : "Brand Activities"}
            </p>
            <div className="space-y-2">
              {agent.brand_activities.map((act: { icon?: string; label_en?: string; label_ar?: string }, i: number) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <span className="text-sm shrink-0">{act.icon}</span>
                  <span>{isAr ? act.label_ar : act.label_en}</span>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Contact details */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              {isAr ? "بيانات التواصل" : "Contact Information"}
            </p>
            <div className="space-y-3">
              {agent.contact_email && (
                <a
                  href={`mailto:${agent.contact_email}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/40 hover:bg-secondary/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {isAr ? "البريد الإلكتروني" : "Email"}
                    </p>
                    <p className="text-xs font-medium text-foreground truncate">{agent.contact_email}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground ms-auto shrink-0" />
                </a>
              )}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/30">
                <div className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "تُدار بيانات الاتصال التفصيلية بصورة آمنة وتُكشف حصراً للشركاء المعتمدين."
                    : "Detailed contact data is securely managed and disclosed exclusively to verified partners."}
                </p>
              </div>
            </div>
          </div>

          {/* Region stats */}
          {region && (
            <div className="rounded-xl border p-4" style={{ borderColor: `${region.color}30`, background: `${region.color}08` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: region.color }}>
                {isAr ? "المنطقة الجغرافية" : "Geographic Region"}
              </p>
              <p className="text-sm font-semibold text-foreground mb-1">{isAr ? region.ar : region.en} {region.flag}</p>
              <p className="text-xs text-muted-foreground">{isAr ? region.countriesAr : region.countriesEn}</p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-border/50 space-y-2">
          {agent.contact_email && (
            <Button asChild className="w-full gap-2 text-xs gold-glow" size="sm">
              <a href={`mailto:${agent.contact_email}`}>
                <Mail className="w-3.5 h-3.5" />
                {isAr ? "إرسال بريد إلكتروني للوكيل" : "Email This Agent"}
              </a>
            </Button>
          )}
          <Button variant="outline" className="w-full text-xs" size="sm" onClick={onClose}>
            {isAr ? "إغلاق" : "Close"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
//  AGENT CARD
// ─────────────────────────────────────────────────────────────────
interface AgentCardProps {
  agent: Agent;
  isAr: boolean;
  onConnect: (agent: Agent) => void;
}

function AgentCard({ agent, isAr, onConnect }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const region = REGION_MAP[agent.region] ?? REGION_MAP.all;
  const scopeText = isAr ? (agent.coverage_scope ?? "") : (agent.coverage_scope_en || agent.coverage_scope || "");
  const scopeWords = scopeText.split(isAr ? "،" : ".").filter(s => s.trim().length > 0);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-background/60 backdrop-blur-sm",
        "transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden",
        region.borderColor,
        `hover:shadow-xl hover:${region.bgGlow}`
      )}
      style={{
        boxShadow: `0 0 0 1px ${region.color}15`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${region.color}, transparent)` }}
      />

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-snug mb-1.5 group-hover:text-primary transition-colors">
              {isAr ? agent.name : (agent.name_en || agent.name)}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Country badge */}
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  color: region.color,
                  borderColor: `${region.color}40`,
                  background: `${region.color}12`,
                }}
              >
                <MapPin className="w-2.5 h-2.5" />
                {isAr ? agent.country : (agent.country_en || agent.country)}
              </span>
              {/* Region badge */}
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary/40 border border-border/40">
                <Globe className="w-2.5 h-2.5" />
                {isAr ? region.ar : region.en}
              </span>
            </div>
          </div>

          {/* Flag avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
            style={{ background: `${region.color}12`, borderColor: `${region.color}30` }}
          >
            {region.flag}
          </div>
        </div>

        {/* Coverage scope — bullet list */}
        {agent.coverage_scope && (
          <div className="mb-4 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              {isAr ? "نطاق التغطية" : "Coverage Scope"}
            </p>
            {scopeWords.length > 1 ? (
              <ul className={cn("space-y-1", !expanded && "max-h-20 overflow-hidden relative")}>
                {scopeWords.map((part, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ background: region.color }} />
                    <span>{part.trim()}.</span>
                  </li>
                ))}
                {!expanded && scopeWords.length > 2 && (
                  <li className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent" />
                )}
              </ul>
            ) : (
              <p className={cn("text-xs text-muted-foreground leading-relaxed", !expanded && "line-clamp-3")}>
                {isAr ? agent.coverage_scope : (agent.coverage_scope_en || agent.coverage_scope)}
              </p>
            )}
            {(scopeWords.length > 2 || (agent.coverage_scope?.length ?? 0) > 120) && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 text-[10px] font-semibold transition-colors flex items-center gap-1"
                style={{ color: region.color }}
              >
                <ChevronRight className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")} />
                {expanded
                  ? (isAr ? "إخفاء" : "Show less")
                  : (isAr ? "قراءة المزيد" : "Read more")}
              </button>
            )}
          </div>
        )}

        {/* Connect button */}
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "w-full gap-2 text-xs mt-auto border transition-all",
            "hover:text-background font-semibold"
          )}
          style={
            {
              "--tw-border-opacity": 1,
              borderColor: `${region.color}50`,
              color: region.color,
              "--hover-bg": region.color,
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = region.color;
            (e.currentTarget as HTMLButtonElement).style.color = "#0a0a0a";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "";
            (e.currentTarget as HTMLButtonElement).style.color = region.color;
          }}
          onClick={() => onConnect(agent)}
        >
          <UserCheck className="w-3.5 h-3.5" />
          {isAr ? "تواصل مع الوكيل" : "Connect with Agent"}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function PublicAgents() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";

  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [agents, setAgents] = useState<Agent[]>(STATIC_AGENTS);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentApplyOpen, setAgentApplyOpen] = useState(false);

  // Fetch from Supabase
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (supabase as any)
      .from("website_agents")
      .select("*")
      .eq("is_active", true)
      .order("project_order", { ascending: true })
      .then(({ data, error }: any) => {
        if (cancelled) return;
        if (!error && data && data.length > 0) setAgents(data);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Filter + stats
  const filtered = useMemo(
    () => activeRegion === "all" ? agents : agents.filter((a) => a.region === activeRegion),
    [agents, activeRegion]
  );

  const regionCounts = useMemo(
    () => REGIONS.reduce<Record<string, number>>((acc, r) => {
      acc[r.id] = r.id === "all" ? agents.length : agents.filter((a) => a.region === r.id).length;
      return acc;
    }, {}),
    [agents]
  );

  const countries = useMemo(
    () => [...new Set(agents.map((a) => a.country))].length,
    [agents]
  );

  const activeRegionCfg = REGION_MAP[activeRegion] ?? REGION_MAP.all;

  return (
    <>
    <PublicLayout>
      <div
        className={cn("min-h-screen", isAr && "rtl")}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* ── AMBIENT BACKGROUND ─────────────────────────────── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] opacity-[0.04] transition-all duration-700"
            style={{ background: activeRegionCfg.color }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] rounded-full blur-[100px] opacity-[0.03] transition-all duration-700"
            style={{ background: activeRegionCfg.color }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">

          {/* ── HERO ──────────────────────────────────────────── */}
          <div className="text-center mb-14">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-5">
              <Network className="w-3 h-3" />
              {isAr ? "الشبكة العالمية" : "Global Network"}
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              <span className="text-foreground">{isAr ? "شبكة " : "Our "}</span>
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, ${activeRegionCfg.color}, #D4A017)` }}
              >
                {isAr ? "وكلاؤنا" : "Global Agents"}
              </span>
            </h1>

            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              {isAr
                ? "شبكة متكاملة من الوكلاء الإقليميين المتخصصين تغطي أسواق الشرق الأوسط وأوروبا وأمريكا الشمالية وأفريقيا، لتمكين عمليات كيمت رايز على نطاق عالمي حقيقي."
                : "A comprehensive network of specialized regional agents covering the Middle East, Europe, North America, and Africa — enabling KemetRise to operate at a truly global scale."}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { icon: UserCheck, value: agents.length, labelAr: "وكيل معتمد", labelEn: "Certified Agents" },
                { icon: Globe,     value: REGIONS.length - 1, labelAr: "منطقة جغرافية", labelEn: "Regions" },
                { icon: MapPin,    value: countries,         labelAr: "دولة",            labelEn: "Countries" },
                { icon: Briefcase, value: 5,                  labelAr: "علامة تجارية",   labelEn: "Brand Lines" },
              ].map(({ icon: Icon, value, labelAr, labelEn }) => (
                <div key={labelEn} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-start">
                    <p className="text-lg font-black text-foreground leading-none">{value}+</p>
                    <p className="text-[10px] text-muted-foreground">{isAr ? labelAr : labelEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── REGION FILTER TABS ────────────────────────────── */}
          <div className="flex gap-2 flex-wrap justify-center mb-10">
            {REGIONS.map((r) => {
              const isActive = activeRegion === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRegion(r.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200",
                    isActive
                      ? "text-background font-bold shadow-lg scale-105"
                      : "text-muted-foreground border-border/50 bg-secondary/20 hover:bg-secondary/40 hover:text-foreground"
                  )}
                  style={isActive ? { background: r.color, borderColor: r.color } : {}}
                >
                  <span>{r.flag}</span>
                  <span>{isAr ? r.ar : r.en}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                      isActive ? "bg-black/20 text-white" : "bg-secondary/60 text-muted-foreground"
                    )}
                  >
                    {regionCounts[r.id] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── ACTIVE REGION BANNER ─────────────────────────── */}
          {activeRegion !== "all" && (
            <div
              className="rounded-2xl border p-5 mb-8 transition-all duration-500"
              style={{
                borderColor: `${activeRegionCfg.color}30`,
                background: `linear-gradient(135deg, ${activeRegionCfg.color}10 0%, transparent 60%)`,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeRegionCfg.flag}</span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {isAr ? activeRegionCfg.ar : activeRegionCfg.en}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? activeRegionCfg.summaryAr : activeRegionCfg.summaryEn}
                  </p>
                </div>
                <div
                  className="ms-auto text-[10px] font-bold px-3 py-1.5 rounded-full border"
                  style={{ color: activeRegionCfg.color, borderColor: `${activeRegionCfg.color}40`, background: `${activeRegionCfg.color}12` }}
                >
                  {isAr ? activeRegionCfg.countriesAr : activeRegionCfg.countriesEn}
                </div>
              </div>
            </div>
          )}

          {/* ── AGENTS GRID ──────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary/30 border border-border/40 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {isAr ? "لا يوجد وكلاء في هذه المنطقة بعد" : "No agents in this region yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "نعمل على توسيع شبكتنا باستمرار" : "We are continuously expanding our network"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isAr={isAr}
                  onConnect={setSelectedAgent}
                />
              ))}
            </div>
          )}

          {/* ── REGIONS OVERVIEW STRIP (when "all" selected) ── */}
          {activeRegion === "all" && !loading && (
            <div className="mt-16">
              <h2 className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
                {isAr ? "المناطق الجغرافية لشبكة الوكلاء" : "Agent Network Regions"}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {REGIONS.filter((r) => r.id !== "all").map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRegion(r.id)}
                    className="rounded-xl border p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                    style={{ borderColor: `${r.color}25`, background: `${r.color}06` }}
                  >
                    <div className="text-2xl mb-2">{r.flag}</div>
                    <p className="text-xs font-bold text-foreground mb-0.5">{isAr ? r.ar : r.en}</p>
                    <p className="text-[10px] text-muted-foreground">{isAr ? r.countriesAr : r.countriesEn}</p>
                    <div
                      className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block"
                      style={{ color: r.color, background: `${r.color}15` }}
                    >
                      {regionCounts[r.id] ?? 0} {isAr ? "وكيل" : "agents"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CTA ─────────────────────────────────────────── */}
          <div className="mt-20 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-2">
              {isAr ? "أنت المرشح التالي لتكون وكيلنا الإقليمي؟" : "Could You Be Our Next Regional Agent?"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              {isAr
                ? "نبحث باستمرار عن شركاء إقليميين متمكنين لتوسيع شبكة كيمت رايز في أسواق جديدة. انضم إلينا وأدِر عمليات علاماتنا التجارية في منطقتك."
                : "We are constantly seeking empowered regional partners to expand the KemetRise network in new markets. Join us and manage our brand operations in your region."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="sm"
                className="gap-2 text-xs gold-glow px-6"
                onClick={() => setAgentApplyOpen(true)}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {isAr ? "قدّم كوكيل معتمد" : "Apply as Authorized Agent"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs px-6"
                onClick={() => navigate("/about")}
              >
                {isAr ? "تعرف علينا أولاً" : "Learn About Us First"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTACT SLIDE-OVER ─────────────────────────────── */}
      <ContactPane
        agent={selectedAgent}
        isAr={isAr}
        onClose={() => setSelectedAgent(null)}
      />
    </PublicLayout>

    <LeadCaptureModal
      open={agentApplyOpen}
      onClose={() => setAgentApplyOpen(false)}
      type="agent"
      isAr={isAr}
      meta={{ icon: "🧑‍💼", color: "#D4A017", refName: isAr ? "التقدم كوكيل معتمد لـ KemetRise" : "Apply as an Authorized KemetRise Agent" }}
    />
    </>
  );
}
