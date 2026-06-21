import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Cpu, GitBranch, Wrench, ChevronDown, Layers, ArrowRight,
} from "lucide-react";
import LeadCaptureModal from "@/components/shared/LeadCaptureModal";

// ─────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  title: string;
  title_en?: string;
  brand_name: string;
  sector: string | null;
  sector_en?: string;
  sector_ar?: string;
  execution_type: string | null;
  description: string;
  description_en?: string;
  image_url: string | null;
  project_order: number;
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────────
//  BRAND CONFIG
// ─────────────────────────────────────────────────────────────────
interface BrandCfg {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  sectorAr: string;
  sectorEn: string;
  taglineAr: string;
  taglineEn: string;
}

const BRANDS: BrandCfg[] = [
  {
    id: "all",
    nameAr: "جميع المشاريع",
    nameEn: "All Projects",
    icon: "🌐",
    color: "#D4A017",
    sectorAr: "المنظومة الكاملة لكيمت رايز",
    sectorEn: "The complete KemetRise ecosystem",
    taglineAr: "استعرض كل المشاريع",
    taglineEn: "Browse all projects",
  },
  {
    id: "For Her",
    nameAr: "فور هير",
    nameEn: "For Her",
    icon: "👗",
    color: "#ec4899",
    sectorAr: "الأزياء والأناقة المحتشمة",
    sectorEn: "Fashion & Modest Styling",
    taglineAr: "مجموعات أزياء ذكية بلمسة إبداعية",
    taglineEn: "Smart fashion collections with a creative touch",
  },
  {
    id: "Just Click Store",
    nameAr: "جاست كليك ستور",
    nameEn: "Just Click Store",
    icon: "🛒",
    color: "#3b82f6",
    sectorAr: "التجارة الإلكترونية والخدمات اللوجستية الذكية",
    sectorEn: "E-commerce & Smart Logistics",
    taglineAr: "تجارة إلكترونية متكاملة وشحن آلي",
    taglineEn: "Integrated e-commerce & automated shipping",
  },
  {
    id: "Youka's Core",
    nameAr: "يوكا كور",
    nameEn: "Youka's Core",
    icon: "🚀",
    color: "#10b981",
    sectorAr: "حاضنات الأعمال ومحور التسويق",
    sectorEn: "Business Incubators & Marketing Hub",
    taglineAr: "تسريع الأعمال وتطوير الكفاءات",
    taglineEn: "Business acceleration & talent development",
  },
  {
    id: "GrowVance",
    nameAr: "جروفانس",
    nameEn: "GrowVance",
    icon: "🎬",
    color: "#f59e0b",
    sectorAr: "الإعلام والإنتاج وتوزيع الفنون",
    sectorEn: "Media, Production & Arts Distribution",
    taglineAr: "منظومة إنتاج إعلامي متكاملة",
    taglineEn: "Complete media production ecosystem",
  },
  {
    id: "Agentic",
    nameAr: "إيجنتك",
    nameEn: "Agentic",
    icon: "🤖",
    color: "#06b6d4",
    sectorAr: "عمليات الذكاء الاصطناعي ونظام العمالة الرقمية",
    sectorEn: "AI Operations & Digital Labor System",
    taglineAr: "وكلاء ذكاء اصطناعي متخصصون للعمليات",
    taglineEn: "Specialized AI agents for operations",
  },
  {
    id: "Commercial Agencies",
    nameAr: "التوكيلات التجارية",
    nameEn: "Commercial Agencies",
    icon: "🤝",
    color: "#8b5cf6",
    sectorAr: "حوكمة العقود والتوزيع العالمي",
    sectorEn: "Contract Governance & Global Distribution",
    taglineAr: "توكيلات دولية وتوزيع استراتيجي",
    taglineEn: "International agencies & strategic distribution",
  },
];

const BRAND_MAP = Object.fromEntries(BRANDS.map(b => [b.id, b]));

// ─────────────────────────────────────────────────────────────────
//  EXECUTION TYPE CONFIG
// ─────────────────────────────────────────────────────────────────
interface ExecCfg {
  ar: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

const EXEC_CONFIG: Record<string, ExecCfg> = {
  "AI Agents":               { ar: "وكلاء AI",   icon: Cpu,       color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/25" },
  "Hybrid":                  { ar: "هجين",        icon: GitBranch, color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/25" },
  "Technical Infrastructure":{ ar: "بنية تحتية", icon: Wrench,    color: "text-slate-300",  bg: "bg-slate-500/10",  border: "border-slate-500/25" },
};

// ─────────────────────────────────────────────────────────────────
//  STATIC SEED DATA  (instant fallback before DB responds)
// ─────────────────────────────────────────────────────────────────
const STATIC_PROJECTS: Project[] = [
  // FOR HER
  { id:"fh-001", title:"نظام إدارة مجموعات الأزياء المحتشمة", brand_name:"For Her", title_en:"Modest Fashion Collections Management System",
    sector:"الأزياء والأناقة المحتشمة", sector_en:"Fashion & Modest Styling", sector_ar:"الأزياء والأناقة المحتشمة", execution_type:"Hybrid", project_order:10, image_url:null,
    description:"نظام متكامل لإدارة مجموعات الأزياء المحتشمة يشمل إدارة المخزون بالمقاسات والألوان، تصنيف القطع الفنية، ونشر الكتالوجات تلقائياً عبر قنوات المبيعات المتعددة مع إشعارات النفاد الآني.", description_en:"A complete system for managing modest fashion collections including size/color inventory management, artistic piece classification, and automated catalog publishing across multiple sales channels with real-time stock alerts." },
  { id:"fh-002", title:"مساعد التنسيق الأزيائي بالذكاء الاصطناعي", brand_name:"For Her", title_en:"AI Fashion Styling Assistant",
    sector:"التنسيق بالذكاء الاصطناعي", sector_en:"AI Styling", sector_ar:"التنسيق بالذكاء الاصطناعي", execution_type:"AI Agents", project_order:20, image_url:null,
    description:"وكيل ذكاء اصطناعي مخصص يقدم توصيات تنسيق الأزياء بناءً على تفضيلات العميلة والمناسبة ومتطلبات اللباس المحتشم، يعمل عبر دردشة تفاعلية بالعربية والإنجليزية على مدار الساعة.", description_en:"A custom AI agent providing outfit coordination recommendations based on client preferences, occasion, and modest dress requirements. Operates via interactive chat in Arabic and English around the clock." },
  { id:"fh-003", title:"دليل المقاسات الديناميكي والذكي", brand_name:"For Her", title_en:"Smart Dynamic Size Guide",
    sector:"الأزياء والأناقة المحتشمة", sector_en:"Fashion & Modest Styling", sector_ar:"الأزياء والأناقة المحتشمة", execution_type:"Technical Infrastructure", project_order:30, image_url:null,
    description:"أداة تفاعلية ذكية لتوجيه العميلات نحو المقاس الأنسب وفق قياساتهن الحقيقية، مما يقلل معدل الإرجاع بنسبة تصل إلى 60% ويحسن رضا العملاء من خلال توصيات دقيقة ومحدّثة باستمرار.", description_en:"An intelligent interactive tool guiding customers to the best fit based on their actual measurements, reducing return rates by up to 60% and improving satisfaction through accurate, continuously updated recommendations." },
  // JUST CLICK STORE
  { id:"jcs-001", title:"منصة التجزئة متعددة البائعين", brand_name:"Just Click Store", title_en:"Multi-Vendor Retail Platform",
    sector:"التجارة الإلكترونية واللوجستيك الذكي", sector_en:"E-commerce & Smart Logistics", sector_ar:"التجارة الإلكترونية واللوجستيك الذكي", execution_type:"Technical Infrastructure", project_order:10, image_url:null,
    description:"متجر تجزئة مركزي يجمع شبكة موردين متعددين في واجهة عرض موحدة مع نظام إدارة المخزون الآني والتسعير التنافسي والمزامنة الكاملة مع أنظمة نقاط البيع وبوابات الدفع الإلكتروني.", description_en:"A centralized retail store aggregating multiple suppliers in a unified display with real-time inventory management, competitive pricing, and full synchronization with POS systems and payment gateways." },
  { id:"jcs-002", title:"محرك الشحن والتسليم الآلي", brand_name:"Just Click Store", title_en:"Automated Shipping & Delivery Engine",
    sector:"التجارة الإلكترونية واللوجستيك الذكي", sector_en:"E-commerce & Smart Logistics", sector_ar:"التجارة الإلكترونية واللوجستيك الذكي", execution_type:"AI Agents", project_order:20, image_url:null,
    description:"نظام ربط آلي متكامل مع شركات الشحن عبر Webhooks، يُنشئ بوليصات الشحن فور تأكيد الطلب ويتتبع الشحنات في الوقت الفعلي مع إشعارات تلقائية للعملاء عبر SMS والبريد الإلكتروني.", description_en:"An automated integration system with shipping companies via Webhooks, generating shipping labels upon order confirmation and tracking shipments in real time with automatic SMS and email notifications to customers." },
  { id:"jcs-003", title:"بوابة إدارة شبكة الموردين", brand_name:"Just Click Store", title_en:"Supplier Network Management Portal",
    sector:"سلسلة التوريد", sector_en:"Supply Chain", sector_ar:"سلسلة التوريد", execution_type:"Hybrid", project_order:30, image_url:null,
    description:"بوابة موردين متكاملة لرفع المنتجات والفواتير وتتبع الطلبات وإدارة العقود مع آليات تقييم الأداء وضمان الجودة وقنوات تواصل مباشرة مع فريق الشراء ومدير الحسابات.", description_en:"An integrated supplier portal for uploading products and invoices, tracking orders and managing contracts with performance evaluation mechanisms, quality assurance, and direct communication channels with the purchasing team." },
  // YOUKA'S CORE
  { id:"yc-001", title:"مسرّع الشركات الناشئة المتكامل", brand_name:"Youka's Core", title_en:"Integrated Startup Accelerator",
    sector:"حاضنات الأعمال ومحور التسويق", sector_en:"Business Incubators & Marketing Hub", sector_ar:"حاضنات الأعمال ومحور التسويق", execution_type:"Hybrid", project_order:10, image_url:null,
    description:"برنامج تسريع شامل للشركات الناشئة يشمل التقييم المبدئي والتوجيه الاستراتيجي وربط المشاريع بالممولين إلى جانب الدعم القانوني والمحاسبي من خلال شبكة خبراء مؤهلين ومعتمدين.", description_en:"A comprehensive startup acceleration program including initial assessment, strategic mentoring, connecting projects with investors, along with legal and accounting support through a qualified expert network." },
  { id:"yc-002", title:"منظومة تتبع دعوات HR Hub", brand_name:"Youka's Core", title_en:"HR Hub Invitation Tracking System",
    sector:"إدارة الموارد البشرية", sector_en:"HR Management", sector_ar:"إدارة الموارد البشرية", execution_type:"Technical Infrastructure", project_order:20, image_url:null,
    description:"نظام رقمي متكامل لإدارة وتتبع دعوات الانضمام لبوابة الموارد البشرية يشمل رموز الدعوة المخصصة ولوحات التتبع التفاعلية وتقارير قبول الدعوات مع ربط كامل بنظام ERP.", description_en:"An integrated digital system for managing and tracking HR portal join invitations, including custom invitation codes, interactive tracking dashboards, and invitation acceptance reports with full ERP integration." },
  { id:"yc-003", title:"مركز المنهجيات التسويقية الذكي", brand_name:"Youka's Core", title_en:"Smart Marketing Methodologies Hub",
    sector:"مركز التسويق", sector_en:"Marketing Hub", sector_ar:"مركز التسويق", execution_type:"Hybrid", project_order:30, image_url:null,
    description:"منصة تعليمية وتطبيقية للمنهجيات التسويقية الحديثة تدمج خطط التسويق المخصصة وتحليلات الأداء وأدوات إنشاء المحتوى وتتبع معدلات العائد على الاستثمار في بيئة عمل تعاونية.", description_en:"An educational and practical platform for modern marketing methodologies integrating customized marketing plans, performance analytics, content creation tools, and ROI tracking in a collaborative workspace." },
  // GROWVANCE
  { id:"gv-001", title:"منصة سير عمل الإنتاج الإعلامي", brand_name:"GrowVance", title_en:"Media Production Workflow Platform",
    sector:"الإعلام والإنتاج وتوزيع الفنون", sector_en:"Media, Production & Arts Distribution", sector_ar:"الإعلام والإنتاج وتوزيع الفنون", execution_type:"Technical Infrastructure", project_order:10, image_url:null,
    description:"نظام إدارة مشاريع الإنتاج الإعلامي من الفكرة حتى التوزيع يشمل جدولة التصوير وإدارة فريق الإنتاج ومراحل المراجعة والاعتماد وأرشفة المشاريع المكتملة وتتبع التكاليف التشغيلية.", description_en:"A media production project management system from concept to distribution, including shooting schedules, production team management, review and approval stages, completed project archiving, and operational cost tracking." },
  { id:"gv-002", title:"نظام إدارة التراخيص والحقوق الإعلامية", brand_name:"GrowVance", title_en:"Media Licensing & Rights Management System",
    sector:"تراخيص الإعلام", sector_en:"Media Licensing", sector_ar:"تراخيص الإعلام", execution_type:"Hybrid", project_order:20, image_url:null,
    description:"منظومة متكاملة لإدارة حقوق الملكية الفكرية والتراخيص الإعلامية تشمل تسجيل الأعمال وعقود التوزيع وتتبع الاستخدام وجمع المستحقات المالية من المنصات الرقمية المختلفة.", description_en:"An integrated system for managing intellectual property rights and media licenses, including work registration, distribution contracts, usage tracking, and collecting royalties from various digital platforms." },
  { id:"gv-003", title:"خط إنتاج الفيديو والمحتوى الصوتي", brand_name:"GrowVance", title_en:"Video & Audio Content Production Pipeline",
    sector:"خط الإنتاج", sector_en:"Production Pipeline", sector_ar:"خط الإنتاج", execution_type:"Hybrid", project_order:30, image_url:null,
    description:"خط إنتاج رقمي متكامل يربط فريق الإبداع بأدوات التحرير والمؤثرات البصرية والتوزيع مع نظام مراجعة ذكي يستخدم الذكاء الاصطناعي لاقتراح تحسينات على المحتوى الإعلامي قبل نشره.", description_en:"An integrated digital production pipeline connecting the creative team with editing tools, visual effects, and distribution, with an intelligent review system using AI to suggest content improvements before publication." },
  // AGENTIC
  { id:"ag-001", title:"شبكة وكلاء الذكاء الاصطناعي المخصصة", brand_name:"Agentic", title_en:"Custom AI Agents Network",
    sector:"عمليات AI ونظام العمالة الرقمية", sector_en:"AI Operations & Digital Labor System", sector_ar:"عمليات AI ونظام العمالة الرقمية", execution_type:"AI Agents", project_order:10, image_url:null,
    description:"بناء وتشغيل شبكة متكاملة من وكلاء الذكاء الاصطناعي المخصصين لأتمتة العمليات التشغيلية تشمل وكلاء خدمة العملاء والجدولة الذكية وتحليل البيانات وإدارة الطلبات دون أي تدخل بشري.", description_en:"Building and operating an integrated network of custom AI agents to automate operational processes, including customer service agents, smart scheduling, data analytics, and order management without human intervention." },
  { id:"ag-002", title:"محرر خرائط سير العمل التفاعلي", brand_name:"Agentic", title_en:"Interactive Workflow Map Editor",
    sector:"أتمتة سير العمل", sector_en:"Workflow Automation", sector_ar:"أتمتة سير العمل", execution_type:"AI Agents", project_order:20, image_url:null,
    description:"أداة بصرية متطورة بالسحب والإفلات لتصميم مسارات العمل الآلية تدعم الشروط المنطقية المتقدمة (condition_expr) والتكامل الكامل مع n8n وتصحيح الأخطاء الفوري في بيئة الإنتاج.", description_en:"An advanced drag-and-drop visual tool for designing automated workflows supporting advanced logical conditions (condition_expr), full n8n integration, and real-time debugging in production environments." },
  { id:"ag-003", title:"تنسيق وإدارة شبكات n8n المؤسسية", brand_name:"Agentic", title_en:"Enterprise n8n Network Orchestration & Management",
    sector:"البنية التحتية الرقمية", sector_en:"Digital Infrastructure", sector_ar:"البنية التحتية الرقمية", execution_type:"Technical Infrastructure", project_order:30, image_url:null,
    description:"تصميم وتشغيل ومراقبة شبكات أتمتة n8n الكاملة للمؤسسات تشمل ربط الأنظمة المختلفة ومعالجة البيانات الضخمة وتشغيل العمليات المعقدة متعددة الخطوات بموثوقية وأمان عاليين.", description_en:"Designing, operating, and monitoring complete enterprise n8n automation networks including system integrations, big data processing, and running complex multi-step processes with high reliability and security." },
  // COMMERCIAL AGENCIES
  { id:"ca-001", title:"نظام حوكمة عقود التوكيلات التجارية", brand_name:"Commercial Agencies", title_en:"Commercial Agency Contract Governance System",
    sector:"حوكمة العقود", sector_en:"Contract Governance", sector_ar:"حوكمة العقود", execution_type:"Technical Infrastructure", project_order:10, image_url:null,
    description:"منظومة قانونية تقنية متكاملة لإدارة عقود التوكيلات التجارية متعددة المستأجرين تشمل إنشاء العقود الرقمية والتوقيع الإلكتروني ومتابعة صلاحية البنود والتنبيهات التلقائية قبل انتهاء العقد.", description_en:"An integrated legal-tech system for managing multi-tenant commercial agency contracts, including digital contract creation, electronic signatures, clause validity tracking, and automatic alerts before contract expiry." },
  { id:"ca-002", title:"منصة شبكة الموردين الدوليين", brand_name:"Commercial Agencies", title_en:"International Supplier Network Platform",
    sector:"التجارة الدولية", sector_en:"International Trade", sector_ar:"التجارة الدولية", execution_type:"Hybrid", project_order:20, image_url:null,
    description:"منصة ربط احترافية بين الموردين الدوليين والسوق المحلية تشمل إجراءات التخليص الجمركي الرقمي وإدارة الفواتير الدولية وتتبع الشحنات عبر الحدود والامتثال للوائح الاستيراد والتصدير.", description_en:"A professional platform connecting international suppliers with the local market, including digital customs clearance procedures, international invoice management, cross-border shipment tracking, and import/export compliance." },
  { id:"ca-003", title:"نظام التوزيع اللوجستي العالمي", brand_name:"Commercial Agencies", title_en:"Global Logistics Distribution System",
    sector:"اللوجستيك العالمي", sector_en:"Global Logistics", sector_ar:"اللوجستيك العالمي", execution_type:"Hybrid", project_order:30, image_url:null,
    description:"شبكة توزيع عالمية متكاملة تدعم التخطيط اللوجستي المتقدم وإدارة المستودعات الموزعة وتحسين مسارات الشحن والتكامل مع شركاء التوزيع الدوليين لضمان وصول فعّال للأسواق المستهدفة.", description_en:"An integrated global distribution network supporting advanced logistics planning, distributed warehouse management, shipping route optimization, and integration with international distribution partners for efficient market access." },
];

// Lookup maps for static bilingual fallback
const STATIC_MAP          = Object.fromEntries(STATIC_PROJECTS.map(p => [p.id, p]));
const STATIC_MAP_BY_TITLE = Object.fromEntries(STATIC_PROJECTS.map(p => [p.title, p]));

// ─────────────────────────────────────────────────────────────────
//  SKELETON CARD
// ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-0.5 w-full bg-slate-700/80" />
      <div className="h-24 bg-slate-700/30" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-700/60 rounded-lg w-4/5" />
        <div className="flex gap-2">
          <div className="h-5 bg-slate-700/50 rounded-full w-24" />
          <div className="h-5 bg-slate-700/50 rounded-full w-16" />
        </div>
        <div className="space-y-2 pt-1">
          <div className="h-2.5 bg-slate-700/40 rounded w-full" />
          <div className="h-2.5 bg-slate-700/40 rounded w-5/6" />
          <div className="h-2.5 bg-slate-700/40 rounded w-3/5" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  PROJECT CARD
// ─────────────────────────────────────────────────────────────────
function ProjectCard({ project, isAr }: { project: Project; isAr: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const brand = BRAND_MAP[project.brand_name] ?? BRAND_MAP.all;
  const execCfg = project.execution_type ? EXEC_CONFIG[project.execution_type] : null;
  const ExecIcon = execCfg?.icon;
  const displayDesc = isAr ? project.description : (project.description_en || project.description);
  const longDesc = displayDesc.length > 120;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden",
        "bg-slate-800/50 backdrop-blur-sm border border-slate-700/40",
        "hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 cursor-default"
      )}
    >
      {/* Top gradient accent bar */}
      <div
        className="h-0.5 w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, ${brand.color}, ${brand.color}40, transparent)` }}
      />

      {/* Visual header */}
      <div
        className="relative h-24 flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${brand.color}14 0%, ${brand.color}04 60%, transparent)` }}
      >
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-[4rem] leading-none opacity-[0.18] select-none group-hover:opacity-30 transition-opacity duration-300">
            {brand.icon}
          </span>
        )}

        {/* Brand pill — bottom start */}
        <div
          className="absolute bottom-2 start-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{
            background: `${brand.color}1a`,
            color: brand.color,
            border: `1px solid ${brand.color}30`,
          }}
        >
          <span className="text-[11px] leading-none">{brand.icon}</span>
          <span>{isAr ? brand.nameAr : brand.nameEn}</span>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Title */}
        <h3 className="text-white font-bold text-sm leading-snug tracking-tight">
          {isAr ? project.title : (project.title_en || project.title)}
        </h3>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          {project.sector && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30">
              <Layers className="w-2.5 h-2.5 shrink-0" />
              {isAr ? (project.sector_ar || project.sector) : (project.sector_en || project.sector)}
            </span>
          )}
          {execCfg && ExecIcon && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border",
                execCfg.bg, execCfg.color, execCfg.border
              )}
            >
              <ExecIcon className="w-2.5 h-2.5 shrink-0" />
              {isAr ? execCfg.ar : project.execution_type}
            </span>
          )}
        </div>

        {/* Description — expandable */}
        {project.description && (
          <div className="mt-auto pt-0.5">
            <p
              className={cn(
                "text-slate-400 text-[11px] leading-relaxed",
                !expanded && "line-clamp-3"
              )}
            >
              {isAr ? project.description : (project.description_en || project.description)}
            </p>
            {longDesc && (
              <button
                onClick={() => setExpanded(s => !s)}
                className="mt-1.5 flex items-center gap-0.5 text-[9px] text-slate-600 hover:text-slate-300 transition-colors"
              >
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    expanded && "rotate-180"
                  )}
                />
                {expanded
                  ? (isAr ? "إخفاء التفاصيل" : "Show less")
                  : (isAr ? "اقرأ التفاصيل كاملة" : "Read more")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hover border glow overlay */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${brand.color}45` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function PublicProjects() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();

  const [activeBrand, setActiveBrand] = useState("all");
  const [projects, setProjects]       = useState<Project[]>(STATIC_PROJECTS);
  const [loading, setLoading]         = useState(true);
  const [projectOpen, setProjectOpen] = useState(false);

  // Fetch from Supabase; fall back to static data on error / empty
  useEffect(() => {
    (supabase as any)
      .from("website_projects")
      .select("*")
      .eq("is_active", true)
      .order("project_order", { ascending: true })
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && data && data.length > 0) {
          // Step 1 — Deduplicate: DB has duplicate rows (old without EN, new with EN).
          // Group by brand_name + Arabic title; prefer the row that has title_en set.
          const dedupeMap = new Map<string, any>();
          for (const p of data) {
            const arabicTitle = p.title || (p as any).title_ar || '';
            const key = `${p.brand_name}||${arabicTitle}`;
            const cur = dedupeMap.get(key);
            if (!cur || ((p as any).title_en && !(cur as any).title_en)) {
              dedupeMap.set(key, p);
            }
          }
          const deduped = [...dedupeMap.values()]
            .sort((a, b) => (a.project_order ?? (a as any).sort_order ?? 0) - (b.project_order ?? (b as any).sort_order ?? 0));

          // Step 2 — Enrich: map DB column names → Project interface + fill missing EN fields
          const enriched = deduped.map(p => {
            const arabicTitle = p.title || (p as any).title_ar || '';
            const s = STATIC_MAP[p.id] ?? STATIC_MAP_BY_TITLE[arabicTitle];
            return {
              ...p,
              title:          arabicTitle,
              title_en:       (p as any).title_en  || s?.title_en,
              description:    (p as any).desc_ar   || p.description,
              description_en: (p as any).desc_en   || s?.description_en,
              sector_en:      (p as any).sector_en || s?.sector_en,
              sector_ar:      (p as any).sector_ar || s?.sector_ar,
            };
          });
          setProjects(enriched as Project[]);
        }
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(
    () => activeBrand === "all"
      ? projects
      : projects.filter(p => p.brand_name === activeBrand),
    [projects, activeBrand]
  );

  const stats = useMemo(() => ({
    total:   projects.length,
    brands:  new Set(projects.map(p => p.brand_name)).size,
    sectors: new Set(projects.filter(p => p.sector).map(p => p.sector)).size,
  }), [projects]);

  const activeConfig = BRAND_MAP[activeBrand] ?? BRAND_MAP.all;

  return (
    <>
    <PublicLayout>
      <div
        className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
        dir={isAr ? "rtl" : "ltr"}
      >

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative py-16 px-4 text-center overflow-hidden">
          {/* Ambient background glow — changes with active brand */}
          <div
            className="absolute inset-x-0 top-0 h-80 pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${activeConfig.color}16, transparent)`,
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/70 border border-slate-700/60 text-slate-400 text-xs mb-6">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: activeConfig.color }}
              />
              {isAr ? "منظومة مشاريع كيمت رايز" : "KemetRise Project Ecosystem"}
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              {isAr ? "مشاريعنا" : "Our Projects"}
            </h1>

            {/* Subtitle */}
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              {isAr
                ? "منظومة متكاملة من المشاريع الرقمية والتقنية الموزعة عبر خمس علامات تجارية متخصصة، تغطي كل جوانب التحول الرقمي والنمو المؤسسي."
                : "An integrated ecosystem of digital and technical projects across five specialized brands, covering every aspect of digital transformation and enterprise growth."}
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-10 mt-10">
              {[
                { v: `${stats.total}+`, ar: "مشروع نشط",     en: "Active Projects" },
                { v: stats.brands,       ar: "علامة تجارية",   en: "Core Brands" },
                { v: `${stats.sectors}+`,ar: "قطاع تشغيلي",   en: "Sectors" },
              ].map(s => (
                <div key={s.en} className="text-center">
                  <p
                    className="text-2xl md:text-3xl font-black"
                    style={{ color: activeConfig.color }}
                  >
                    {s.v}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isAr ? s.ar : s.en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BRAND FILTER TABS ─────────────────────────────────────── */}
        <div className="sticky top-16 z-20 bg-slate-950/92 backdrop-blur-xl border-b border-slate-800/70">
          <div className="max-w-7xl mx-auto px-4">

            {/* Scrollable tab row */}
            <div
              className="flex gap-2 py-3 overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {BRANDS.map(brand => {
                const isActive = activeBrand === brand.id;
                const count = brand.id === "all"
                  ? projects.length
                  : projects.filter(p => p.brand_name === brand.id).length;

                return (
                  <button
                    key={brand.id}
                    onClick={() => setActiveBrand(brand.id)}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none",
                      isActive
                        ? "text-white shadow-lg"
                        : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-700/60 hover:border-slate-600/60"
                    )}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${brand.color}ee, ${brand.color}88)`,
                      boxShadow: `0 4px 20px ${brand.color}30`,
                    } : {}}
                  >
                    <span className="text-sm leading-none">{brand.icon}</span>
                    <span>{isAr ? brand.nameAr : brand.nameEn}</span>
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                        isActive ? "bg-white/20 text-white" : "bg-slate-700/70 text-slate-400"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active brand sector subtitle */}
            {activeBrand !== "all" && (
              <div className="pb-2.5 flex items-center gap-2">
                <div
                  className="w-0.5 h-3 rounded-full"
                  style={{ background: activeConfig.color }}
                />
                <p className="text-[10px] text-slate-400">
                  {isAr ? activeConfig.sectorAr : activeConfig.sectorEn}
                </p>
                <span className="text-slate-700 text-[10px]">·</span>
                <p className="text-[10px] text-slate-600">
                  {isAr ? activeConfig.taglineAr : activeConfig.taglineEn}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── PROJECTS GRID ─────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <span className="text-5xl mb-5 opacity-25">📂</span>
              <h3 className="text-slate-300 font-semibold text-sm mb-2">
                {isAr ? "لا توجد مشاريع حالياً" : "No projects yet"}
              </h3>
              <p className="text-slate-600 text-xs max-w-xs leading-relaxed">
                {activeBrand !== "all"
                  ? (isAr
                      ? `لم يتم نشر أي مشاريع لـ ${activeConfig.nameAr} حتى الآن`
                      : `No published projects for ${activeConfig.nameEn} yet`)
                  : (isAr
                      ? "لا توجد مشاريع منشورة في الوقت الحالي"
                      : "No published projects at this time")}
              </p>
            </div>
          ) : (
            <>
              {/* Result count hint */}
              <p className="text-[11px] text-slate-600 mb-5 ps-1">
                {isAr
                  ? `يتم عرض ${filtered.length} مشروع`
                  : `Showing ${filtered.length} project${filtered.length !== 1 ? "s" : ""}`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(p => (
                  <ProjectCard key={p.id} project={p} isAr={isAr} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── BRAND SHOWCASE STRIP ──────────────────────────────────── */}
        {activeBrand === "all" && !loading && (
          <section className="max-w-7xl mx-auto px-4 pb-10">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ps-1">
              {isAr ? "علاماتنا التجارية" : "Our Brands"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {BRANDS.filter(b => b.id !== "all").map(brand => (
                <button
                  key={brand.id}
                  onClick={() => setActiveBrand(brand.id)}
                  className={cn(
                    "group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                    "bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60 hover:-translate-y-0.5 hover:shadow-lg"
                  )}
                  style={{ ["--c" as any]: brand.color }}
                >
                  <span
                    className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                    style={{ background: `${brand.color}18` }}
                  >
                    {brand.icon}
                  </span>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-white leading-tight">
                      {isAr ? brand.nameAr : brand.nameEn}
                    </p>
                    <p className="text-[8px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                      {isAr ? brand.sectorAr : brand.sectorEn}
                    </p>
                  </div>
                  <div
                    className="w-8 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: brand.color }}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div
            className="relative rounded-2xl border border-slate-700/50 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${activeConfig.color}0a 0%, transparent 50%)`,
            }}
          >
            {/* Decorative right glow */}
            <div
              className="absolute end-0 top-0 w-72 h-full pointer-events-none opacity-[0.06]"
              style={{
                background: `radial-gradient(circle at 80% 50%, ${activeConfig.color}, transparent)`,
              }}
            />

            <div className="relative z-10 py-12 px-6 text-center">
              <div className="text-4xl mb-5">💡</div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-3">
                {isAr ? "هل لديك فكرة مشروع متميز؟" : "Have a great project idea?"}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto mb-8">
                {isAr
                  ? "تواصل معنا لمناقشة كيف يمكن لمنظومة كيمت رايز أن تُحوّل فكرتك إلى مشروع حقيقي ناجح ضمن أحد علاماتنا التجارية المتخصصة."
                  : "Get in touch to discuss how the KemetRise ecosystem can transform your idea into a successful project within one of our specialized brands."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => setProjectOpen(true)}
                  className="text-xs h-10 px-8 gold-glow gap-2"
                >
                  {isAr ? "اطلب تنفيذ مشروع" : "Request Project Collaboration"}
                  <ArrowRight className={cn("w-3.5 h-3.5", isAr && "rotate-180")} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/services")}
                  className="text-xs h-10 px-8 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  {isAr ? "استعرض خدماتنا" : "Explore Services"}
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>

    <LeadCaptureModal
      open={projectOpen}
      onClose={() => setProjectOpen(false)}
      type="project"
      isAr={isAr}
      meta={{ icon: "💡", color: "#D4A017", refName: isAr ? "طلب شراكة / تنفيذ مشروع" : "Project Collaboration Request" }}
    />
    </>
  );
}
