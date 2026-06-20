import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PublicLayout from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Zap, Shield, Globe, BarChart3, Users, Layers,
  CheckCircle, Star, Award, Building2, MessageSquare,
  ShoppingBag, GraduationCap, Scale, Briefcase, ShoppingCart,
  Cpu, Stethoscope, TrendingUp, Bot, Wallet, Code2, HeartHandshake,
  Network, UserCheck, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LeadCaptureModal from "@/components/shared/LeadCaptureModal";

/* ─── Animated Counter ─────────────────────────────────────────── */
function Counter({ to, suffix = "", duration = 2000 }: { to: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setCount(Math.floor(p * p * to));
          if (p < 1) requestAnimationFrame(tick);
          else setCount(to);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Floating Particles ───────────────────────────────────────── */
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  size: 1 + (i % 3),
  x: (i * 17 + 5) % 100,
  y: (i * 23 + 10) % 100,
  delay: (i * 0.4) % 6,
  dur: 4 + (i % 5),
  opacity: 0.15 + (i % 4) * 0.1,
}));

/* ─── Scroll Reveal Hook ───────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── Data ─────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Layers,   en: "Sector Factory",      ar: "مصنع القطاعات",        desc_en: "Activate specialized sectors instantly",          desc_ar: "تفعيل قطاعات متخصصة بلمسة واحدة",           color: "from-primary/20 to-primary/5",         border: "border-primary/20",        glow: "#D4A017" },
  { icon: Building2,en: "Partner Workspaces",  ar: "بيئات شركاء معزولة",   desc_en: "Every partner in an isolated workspace",          desc_ar: "كل شريك في بيئة عمل معزولة ومحمية",        color: "from-indigo-500/20 to-indigo-500/5",   border: "border-indigo-500/20",     glow: "#6366F1" },
  { icon: Bot,      en: "AI Brand Agents",     ar: "وكلاء ذكاء اصطناعي",   desc_en: "Custom AI agents per brand",                     desc_ar: "وكلاء AI مخصصون لكل علامة تجارية",          color: "from-cyan-500/20 to-cyan-500/5",       border: "border-cyan-500/20",       glow: "#06B6D4" },
  { icon: Wallet,   en: "Vendor Wallet",       ar: "محفظة البائعين",        desc_en: "Real-time settlement with auto fees",             desc_ar: "تسوية مالية آنية مع خصم رسوم تلقائي",      color: "from-orange-500/20 to-orange-500/5",   border: "border-orange-500/20",     glow: "#F97316" },
  { icon: BarChart3,en: "Analytics & Reports", ar: "تحليلات وتقارير",       desc_en: "Kanban pipeline with ROI reporting",              desc_ar: "Kanban + ROI + تقارير مباشرة",              color: "from-pink-500/20 to-pink-500/5",       border: "border-pink-500/20",       glow: "#EC4899" },
  { icon: Shield,   en: "Multi-layer Security",ar: "أمان متعدد الطبقات",   desc_en: "RLS + roles + permissions + audit",               desc_ar: "RLS + أدوار + صلاحيات + مراجعة",            color: "from-red-500/20 to-red-500/5",         border: "border-red-500/20",        glow: "#EF4444" },
  { icon: Globe,    en: "Bilingual Support",   ar: "دعم ثنائي اللغة",       desc_en: "Full Arabic & English interface",                 desc_ar: "واجهة كاملة بالعربية والإنجليزية",          color: "from-blue-500/20 to-blue-500/5",       border: "border-blue-500/20",       glow: "#3B82F6" },
  { icon: Code2,    en: "Open APIs",           ar: "API مفتوحة",            desc_en: "Full integration with external systems",          desc_ar: "تكامل كامل مع أنظمة خارجية",               color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20",    glow: "#10B981" },
];

const SECTORS = [
  { icon: Stethoscope,   label: "Medical",   ar: "الطب",       color: "#EF4444", bg: "bg-red-500/10" },
  { icon: Layers,        label: "Education", ar: "التعليم",    color: "#8B5CF6", bg: "bg-violet-500/10" },
  { icon: Scale,         label: "Legal",     ar: "القانون",    color: "#6366F1", bg: "bg-indigo-500/10" },
  { icon: Briefcase,     label: "Services",  ar: "الخدمات",    color: "#EC4899", bg: "bg-pink-500/10" },
  { icon: ShoppingCart,  label: "Retail",    ar: "التجزئة",    color: "#F97316", bg: "bg-orange-500/10" },
  { icon: TrendingUp,    label: "Financial", ar: "المالية",    color: "#F59E0B", bg: "bg-yellow-500/10" },
  { icon: GraduationCap, label: "Courses",   ar: "الدورات",    color: "#14B8A6", bg: "bg-teal-500/10" },
  { icon: Building2,     label: "Tourism",   ar: "السياحة",    color: "#10B981", bg: "bg-emerald-500/10" },
  { icon: Cpu,           label: "Tech",      ar: "التقنية",    color: "#06B6D4", bg: "bg-cyan-500/10" },
  { icon: HeartHandshake,label: "NGO",       ar: "غير ربحي",   color: "#A855F7", bg: "bg-purple-500/10" },
];

const BRANDS_ECOSYSTEM = [
  { icon: "👗", nameAr: "فور هير",            nameEn: "For Her",               color: "#ec4899", descAr: "منظومة الأزياء المحتشمة والأناقة النسائية",        descEn: "Modest fashion & women's style ecosystem",         tagAr: "أزياء وتصميم",     tagEn: "Fashion & Design"        },
  { icon: "🛒", nameAr: "جاست كليك ستور",     nameEn: "Just Click Store",       color: "#3b82f6", descAr: "منصة التجارة الإلكترونية متعددة البائعين",         descEn: "Multi-vendor e-commerce & logistics platform",    tagAr: "تجارة إلكترونية",  tagEn: "E-Commerce"             },
  { icon: "🚀", nameAr: "يوكا'س كور",         nameEn: "Youka's Core",           color: "#10b981", descAr: "تقنيات النمو ومنظومة SaaS للشركات الناشئة",      descEn: "Growth tech & SaaS ecosystem for startups",       tagAr: "تقنية ونمو",       tagEn: "Tech & Growth"          },
  { icon: "🎬", nameAr: "جرو فانس",           nameEn: "GrowVance",              color: "#f59e0b", descAr: "الإنتاج الإعلامي وترخيص الأعمال الإبداعية",      descEn: "Media production & creative content licensing",   tagAr: "إعلام وإنتاج",     tagEn: "Media & Production"     },
  { icon: "🤖", nameAr: "أجنتيك",             nameEn: "Agentic",                color: "#06b6d4", descAr: "وكلاء الذكاء الاصطناعي المستقلين للأعمال",       descEn: "Autonomous AI agents for enterprise operations",  tagAr: "ذكاء اصطناعي",    tagEn: "Artificial Intelligence" },
  { icon: "🤝", nameAr: "التوكيلات التجارية",  nameEn: "Commercial Agencies",    color: "#8b5cf6", descAr: "شبكة التوكيلات الإقليمية وحوكمة سلاسل الإمداد",  descEn: "Regional agencies & supply chain governance",     tagAr: "توكيلات وشراكات",  tagEn: "Agencies & Partnerships" },
];

const FEATURED_PROJECTS = [
  { brandIcon: "👗", brand: "For Her",          brandColor: "#ec4899", titleAr: "مساعد التنسيق الأزيائي بالذكاء الاصطناعي", titleEn: "AI Fashion Styling Assistant",  sectorAr: "أزياء وأناقة",    sectorEn: "Fashion & Styling", execAr: "وكلاء AI",  execEn: "AI Agents"     },
  { brandIcon: "🛒", brand: "Just Click Store", brandColor: "#3b82f6", titleAr: "منصة التجزئة متعددة البائعين",              titleEn: "Multi-Vendor Retail Platform", sectorAr: "تجارة إلكترونية", sectorEn: "E-commerce",        execAr: "بنية تحتية", execEn: "Infrastructure" },
  { brandIcon: "🤖", brand: "Agentic",          brandColor: "#06b6d4", titleAr: "نظام إدارة وكلاء الذكاء الاصطناعي",         titleEn: "AI Agent Management System",   sectorAr: "ذكاء اصطناعي",    sectorEn: "AI Systems",        execAr: "وكلاء AI",  execEn: "AI Agents"     },
];

const REGIONS_PREVIEW = [
  { flag: "🌿", ar: "بلاد الشام",      en: "The Levant",    color: "#10b981", count: 2 },
  { flag: "🏙️", ar: "الخليج العربي",   en: "The GCC",       color: "#3b82f6", count: 2 },
  { flag: "🏛️", ar: "أوروبا",         en: "Europe",        color: "#8b5cf6", count: 2 },
  { flag: "🚀", ar: "أمريكا الشمالية", en: "North America", color: "#06b6d4", count: 2 },
  { flag: "🌾", ar: "شمال أفريقيا",   en: "North Africa",  color: "#f59e0b", count: 2 },
];

const STEPS = [
  { n: "01", en: "Create Account", ar: "أنشئ حسابك", desc_en: "Sign up free in seconds. No credit card.", desc_ar: "سجّل مجاناً في ثوانٍ. بدون بطاقة ائتمان." },
  { n: "02", en: "Choose Your Role", ar: "اختر دورك", desc_en: "Vendor, partner, agent, or user — each gets a dedicated portal.", desc_ar: "بائع، شريك، وكيل، أو مستخدم — لكل دور بوابته الخاصة." },
  { n: "03", en: "Launch & Grow", ar: "انطلق واستثمر", desc_en: "Activate modules, invite your team, and start operating.", desc_ar: "فعّل الوحدات، ادعُ فريقك، وابدأ العمل فوراً." },
];

const TESTIMONIALS = [
  { avatar: "AM", name: "Ahmed M.", nameAr: "أحمد م.", role: "CEO, RetailCo", roleAr: "مدير تنفيذي، ريتيل كو", text_en: "KemetRise unified our 3 branches under one system in a week. The AI agents reduced our support load by 70%.", text_ar: "KemetRise وحّدت فروعنا الثلاثة في نظام واحد خلال أسبوع. وكلاء AI خففوا حمل دعمنا بنسبة 70%." },
  { avatar: "SF", name: "Sara F.",   nameAr: "سارة ف.",  role: "Vendor Partner",  roleAr: "شريك بائع",         text_en: "The vendor wallet and auto-settlement saved us hours each month. Clean UI, fast, bilingual.", text_ar: "محفظة البائع والتسوية التلقائية وفّرت علينا ساعات كل شهر. واجهة نظيفة، سريعة، ثنائية اللغة." },
  { avatar: "KN", name: "Kareem N.", nameAr: "كريم ن.",  role: "Agency Director",  roleAr: "مدير وكالة",       text_en: "The agent portal's commission tracking is a game changer. We track 200+ clients in real-time.", text_ar: "تتبع عمولات بوابة الوكيل غيّر قواعد اللعبة. نتابع +200 عميل في الوقت الفعلي." },
  { avatar: "DH", name: "Dina H.",   nameAr: "دينا ح.",  role: "Marketing Lead",   roleAr: "رئيسة التسويق",    text_en: "The Kanban lead pipeline and campaign manager are exactly what we needed. Arabic-first UI is a plus.", text_ar: "خط عملاء Kanban ومدير الحملات هو بالضبط ما نحتاجه. الواجهة العربية ميزة رائعة." },
];

export default function PublicLanding() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const R = i18n.language === "ar";
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [bizOpen, setBizOpen] = useState(false);
  const featuresRev = useReveal();
  const sectorsRev = useReveal();
  const stepsRev = useReveal();
  const brandsRev = useReveal();
  const projsRev = useReveal();

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <>
    <PublicLayout>

      {/* ══ 1. HERO ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-28 pb-24">
        {/* Glowing orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/4 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/6 rounded-full blur-[80px] animate-float-slow" />
          <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-cyan-500/5 rounded-full blur-[60px] animate-glow-pulse" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: "linear-gradient(hsl(42 85% 55% / 1) 1px, transparent 1px), linear-gradient(90deg, hsl(42 85% 55% / 1) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          {/* Particles */}
          {PARTICLES.map((p, i) => (
            <div key={i} className="absolute rounded-full bg-primary" style={{
              width: p.size, height: p.size,
              left: `${p.x}%`, top: `${p.y}%`,
              opacity: p.opacity,
              animation: `float ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 px-4 py-1.5 bg-primary/10 text-primary border-primary/30 text-xs gap-2 animate-fade-in-down">
            <Zap className="w-3.5 h-3.5" />
            {R ? "المنصة الموحدة متعددة المستأجرين" : "Unified Multi-Tenant SaaS & ERP Platform"}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-black leading-tight mb-6 animate-fade-in-up">
            <span className="text-primary gold-text-glow">KemetRise</span>
            <br />
            <span className="text-muted-foreground text-3xl md:text-4xl font-medium tracking-widest">Legacy Nexus</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {R
              ? "ثمانية بوابات متكاملة في نظام واحد — من الإدارة العليا إلى المستخدم النهائي، مع ذكاء اصطناعي وموارد بشرية وتحليلات فورية."
              : "Eight interconnected portals in one system — from supreme admin to end user, with AI, HR, and real-time analytics."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
            {user ? (
              <Button size="lg" onClick={() => navigate("/portal")} className="gap-2 text-base px-10 gold-glow">
                {R ? "الدخول للوحة التحكم" : "Go to Dashboard"} <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => setDemoOpen(true)} className="gap-2 text-base px-10 gold-glow">
                  {R ? "اطلب عرضاً تجريبيًا" : "Request a Demo"} <ArrowRight className="w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/services")} className="text-base px-10">
                  {R ? "استكشف خدماتنا" : "Explore Services"}
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-2xl overflow-hidden border border-border/30 max-w-2xl mx-auto">
            {[
              { val: 8,   suffix: "",  labelEn: "Portals",   labelAr: "بوابات" },
              { val: 25,  suffix: "+", labelEn: "DB Tables", labelAr: "جدول بيانات" },
              { val: 10,  suffix: "",  labelEn: "Sectors",   labelAr: "قطاع" },
              { val: 100, suffix: "%", labelEn: "Bilingual", labelAr: "ثنائي اللغة" },
            ].map((s) => (
              <div key={s.labelEn} className="flex flex-col items-center justify-center py-6 px-4 bg-background hover:bg-secondary/20 transition-colors">
                <p className="text-4xl font-display font-black text-primary tabular-nums">
                  <Counter to={s.val} suffix={s.suffix} />
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 text-center">{R ? s.labelAr : s.labelEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 2. LOGO MARQUEE ══════════════════════════════════════ */}
      <section className="py-6 border-y border-border/30 overflow-hidden bg-secondary/10">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...Array(3)].flatMap(() =>
            ["ERP", "HR", "AI Chat", "Vendor", "Partner", "Agent", "Marketing", "Mall"].map((t, i) => (
              <span key={`${t}-${i}`} className="text-xs font-display font-bold text-muted-foreground/60 uppercase tracking-widest shrink-0">
                ✦ {t}
              </span>
            ))
          )}
        </div>
      </section>

      {/* ══ 3. FEATURES ══════════════════════════════════════════ */}
      <section className="py-24">
        <div ref={featuresRev.ref} className="max-w-6xl mx-auto px-4">
          <div className={cn("text-center mb-14 transition-all duration-700", featuresRev.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "الميزات الأساسية" : "Core Features"}</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-black">{R ? "كل شيء تحتاجه في مكان واحد" : "Everything You Need in One Place"}</h2>
          </div>
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 delay-150", featuresRev.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
            {FEATURES.map((f) => (
              <div key={f.en} className={cn("relative p-5 rounded-2xl bg-gradient-to-br border hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden", f.color, f.border)}>
                <div className="absolute top-3 right-3 w-16 h-16 rounded-full opacity-20 blur-xl" style={{ backgroundColor: f.glow }} />
                <f.icon className="w-7 h-7 mb-4 relative z-10" style={{ color: f.glow }} />
                <h3 className="text-sm font-bold mb-2 relative z-10">{R ? f.ar : f.en}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed relative z-10">{R ? f.desc_ar : f.desc_en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. HOW IT WORKS ══════════════════════════════════════ */}
      <section className="py-20 bg-secondary/10 border-y border-border/30">
        <div ref={stepsRev.ref} className="max-w-4xl mx-auto px-4">
          <div className={cn("text-center mb-12 transition-all duration-700", stepsRev.visible ? "opacity-100" : "opacity-0")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "كيف يعمل" : "How It Works"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "ابدأ في 3 خطوات" : "Start in 3 Steps"}</h2>
          </div>
          <div className={cn("grid md:grid-cols-3 gap-6 transition-all duration-700 delay-200", stepsRev.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {STEPS.map((s) => (
              <div key={s.n} className="text-center p-6 rounded-2xl border border-border/40 bg-background/50 hover:border-primary/20 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-display font-black text-primary">{s.n}</span>
                </div>
                <h3 className="text-sm font-bold mb-2">{R ? s.ar : s.en}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{R ? s.desc_ar : s.desc_en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. SECTORS ═══════════════════════════════════════════ */}
      <section className="py-20">
        <div ref={sectorsRev.ref} className="max-w-5xl mx-auto px-4">
          <div className={cn("text-center mb-10 transition-all duration-700", sectorsRev.visible ? "opacity-100" : "opacity-0")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "القطاعات المدعومة" : "Supported Sectors"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "يعمل في أي صناعة" : "Works in Any Industry"}</h2>
            <p className="text-muted-foreground text-sm mt-2">{R ? "قطاعات تُفعَّل ديناميكياً بواسطة المشرف" : "Sectors dynamically activated by admin"}</p>
          </div>
          <div className={cn("grid grid-cols-2 sm:grid-cols-5 gap-3 transition-all duration-700 delay-100", sectorsRev.visible ? "opacity-100 scale-100" : "opacity-0 scale-95")}>
            {SECTORS.map((s) => (
              <div key={s.label} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/30 hover:border-current/20 transition-all hover:-translate-y-1 cursor-default", s.bg)}>
                <s.icon className="w-6 h-6" style={{ color: s.color }} />
                <span className="text-xs font-semibold">{R ? s.ar : s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. BRAND ECOSYSTEM ══════════════════════════════════════ */}
      <section className="py-20 bg-secondary/10 border-y border-border/30">
        <div ref={brandsRev.ref} className="max-w-6xl mx-auto px-4">
          <div className={cn("text-center mb-14 transition-all duration-700", brandsRev.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "شركاتنا الشقيقة" : "Brand Ecosystem"}</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-black">{R ? "منظومة علاماتنا التجارية" : "Our Brand Companies"}</h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-xl mx-auto">
              {R ? "ست علامات تجارية متخصصة تعمل بتناسق كامل لتغطية أوسع نطاق تجاري وتقني" : "Six specialized brands working in complete synergy for maximum commercial and technical coverage"}
            </p>
          </div>
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-all duration-700 delay-150", brandsRev.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
            {BRANDS_ECOSYSTEM.map((brand) => (
              <button key={brand.nameEn} onClick={() => navigate("/our-projects")}
                className="group relative p-6 rounded-2xl border text-start transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
                style={{ borderColor: `${brand.color}25`, background: `${brand.color}06` }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: `radial-gradient(circle at 80% 20%, ${brand.color}14, transparent 60%)` }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border" style={{ background: `${brand.color}12`, borderColor: `${brand.color}25` }}>
                      {brand.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full border" style={{ color: brand.color, borderColor: `${brand.color}40`, background: `${brand.color}12` }}>
                      {R ? brand.tagAr : brand.tagEn}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mb-2" style={{ color: brand.color }}>{R ? brand.nameAr : brand.nameEn}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{R ? brand.descAr : brand.descEn}</p>
                  <div className="flex items-center gap-1 mt-4 text-[10px] font-semibold group-hover:gap-2 transition-all" style={{ color: brand.color }}>
                    {R ? "استعرض المشاريع" : "View Projects"} <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => navigate("/our-projects")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary/40 text-primary text-xs font-semibold hover:bg-primary hover:text-background transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
            >
              {R ? "استعرض جميع المشاريع" : "View All Projects"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ══ 8. FEATURED SERVICES ══════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
              <Layers className="w-3.5 h-3.5" />{R ? "خدماتنا" : "Our Services"}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-black">{R ? "ما الذي نقدمه لك؟" : "What We Build For You"}</h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-xl mx-auto">
              {R ? "منظومة متكاملة من الخدمات الرقمية والذكاء الاصطناعي لبناء مشاريع متكاملة" : "A complete suite of digital & AI-powered services to build fully integrated businesses"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {[
              { icon: BarChart3,   color: "#f59e0b", tagAr: "ERP & مالية",       tagEn: "ERP & Finance",           titleAr: "نظام ERP متكامل",             titleEn: "Integrated ERP System",        descAr: "إدارة مالية وموارد بشرية ومخزون وعمليات في منصة واحدة", descEn: "Finance, HR, inventory & ops in one platform" },
              { icon: Bot,         color: "#06b6d4", tagAr: "ذكاء اصطناعي",      tagEn: "Artificial Intelligence", titleAr: "وكلاء الذكاء الاصطناعي",      titleEn: "AI Agents & Automation",       descAr: "وكلاء AI مخصصون لأتمتة كل عملياتك التجارية",           descEn: "Custom AI agents to automate your entire business" },
              { icon: ShoppingBag, color: "#10b981", tagAr: "تجارة إلكترونية",   tagEn: "E-Commerce",              titleAr: "متجر إلكتروني احترافي",        titleEn: "Professional Online Store",    descAr: "متجر متكامل متعدد البائعين مع نظام دفع آمن",           descEn: "Full multi-vendor store with secure payment gateway" },
              { icon: Globe,       color: "#8b5cf6", tagAr: "تطوير رقمي",        tagEn: "Digital Development",     titleAr: "بناء الهوية الرقمية",          titleEn: "Digital Identity Building",    descAr: "موقع احترافي وتطبيق وهوية بصرية متكاملة",              descEn: "Website, app & complete visual identity design" },
            ].map(({ icon: Icon, color, tagAr, tagEn, titleAr, titleEn, descAr, descEn }) => (
              <button key={titleEn} onClick={() => navigate("/services")}
                className="group flex items-start gap-5 p-6 rounded-2xl border text-start transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: `${color}25`, background: `${color}06` }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-sm font-bold">{R ? titleAr : titleEn}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
                      {R ? tagAr : tagEn}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{R ? descAr : descEn}</p>
                  <div className="flex items-center gap-1 mt-3 text-[10px] font-semibold group-hover:gap-2 transition-all" style={{ color }}>
                    {R ? "اكتشف الخدمة" : "Learn More"} <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="text-center">
            <Button onClick={() => navigate("/services")} variant="outline" className="gap-2 px-8">
              <Layers className="w-4 h-4" />{R ? "استعرض جميع خدماتنا" : "View All Services"}<ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══ 8. PRODUCTS ══════════════════════════════════════════ */}
      <section className="py-20 bg-secondary/10 border-y border-border/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
              <ShoppingBag className="w-3.5 h-3.5" />{R ? "منتجاتنا" : "Our Products"}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-black">{R ? "منتجات جاهزة للانطلاق" : "Ready-to-Deploy Products"}</h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-xl mx-auto">
              {R ? "حلول برمجية ورقمية ومنتجات ذكاء اصطناعي جاهزة للتفعيل الفوري في مشروعك" : "Software, digital & AI products ready for immediate activation in your business"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: "⚡", color: "#f59e0b", nameAr: "رخصة ERP المؤسسي",            nameEn: "Enterprise ERP License",     descAr: "ERP كامل: مالية، موارد بشرية، مخزون، CRM وتحليلات",             descEn: "Full ERP: finance, HR, inventory, CRM & analytics",         tagAr: "برمجيات",   tagEn: "Software"      },
              { icon: "🤖", color: "#06b6d4", nameAr: "حزمة وكلاء AI — 10 وكلاء",   nameEn: "AI Agent Pack — 10 Agents",  descAr: "نشر 10 وكلاء AI مخصصين مدعومين بـ GPT-4",                     descEn: "Deploy 10 custom AI agents powered by GPT-4",               tagAr: "ذكاء اصطناعي", tagEn: "AI"         },
              { icon: "📣", color: "#ec4899", nameAr: "حزمة التسويق الشاملة",        nameEn: "Marketing Suite",            descAr: "CRM + مدير حملات + خط عملاء + تحليلات ROI",                  descEn: "CRM + campaign manager + lead pipeline + ROI analytics",    tagAr: "تسويق",     tagEn: "Marketing"     },
              { icon: "🤝", color: "#10b981", nameAr: "رخصة بيئة عمل الشريك",       nameEn: "Partner Workspace Licence",  descAr: "بيئة عمل معزولة متعددة المستأجرين مع تشارك الإيرادات",       descEn: "Isolated multi-tenant workspace with revenue sharing",       tagAr: "منصة",      tagEn: "Platform"      },
            ].map(({ icon, color, nameAr, nameEn, descAr, descEn, tagAr, tagEn }) => (
              <button key={nameEn} onClick={() => navigate("/products")}
                className="group flex flex-col p-5 rounded-2xl border text-start transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                style={{ borderColor: `${color}25`, background: `${color}06` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border transition-transform group-hover:scale-110"
                    style={{ background: `${color}18`, borderColor: `${color}30` }}>
                    {icon}
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
                    {R ? tagAr : tagEn}
                  </span>
                </div>
                <h3 className="text-xs font-bold mb-1.5 leading-snug" style={{ color }}>{R ? nameAr : nameEn}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{R ? descAr : descEn}</p>
                <div className="flex items-center gap-1 mt-3 text-[10px] font-semibold group-hover:gap-2 transition-all" style={{ color }}>
                  {R ? "عرض المنتج" : "View Product"} <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
          <div className="text-center">
            <Button onClick={() => navigate("/products")} variant="outline" className="gap-2 px-8">
              <ShoppingBag className="w-4 h-4" />{R ? "استعرض جميع المنتجات" : "View All Products"}<ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══ 9. GLOBAL AGENT NETWORK ══════════════════════════════════════ */}
      <section className="py-20 bg-secondary/10 border-y border-border/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
              <Network className="w-3.5 h-3.5" />{R ? "الشبكة العالمية" : "Global Network"}
            </Badge>
            <h2 className="text-3xl font-display font-black">{R ? "وكلاؤنا حول العالم" : "Our Agents Worldwide"}</h2>
            <p className="text-muted-foreground text-sm mt-2">{R ? "شبكة وكلاء إقليميين متخصصين في 5 مناطق وأكثر من 10 دول" : "Specialized regional agents across 5 territories & 10+ countries"}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
            {REGIONS_PREVIEW.map((r) => (
              <button key={r.en} onClick={() => navigate("/our-agents")}
                className="rounded-xl border p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: `${r.color}25`, background: `${r.color}06` }}
              >
                <div className="text-2xl mb-2">{r.flag}</div>
                <p className="text-xs font-bold text-foreground">{R ? r.ar : r.en}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.count}+ {R ? "وكيل" : "agents"}</p>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 mb-10 py-6 rounded-2xl border border-border/30 bg-background/40">
            {[
              { icon: UserCheck, val: "10+", labelAr: "وكيل معتمد",    labelEn: "Certified Agents" },
              { icon: Globe,     val: "5",   labelAr: "منطقة جغرافية", labelEn: "Regions"          },
              { icon: MapPin,    val: "10+", labelAr: "دولة",           labelEn: "Countries"        },
              { icon: Briefcase, val: "6",   labelAr: "علامة تجارية",   labelEn: "Brand Lines"      },
            ].map(({ icon: Icon, val, labelAr, labelEn }) => (
              <div key={labelEn} className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-black text-primary leading-none">{val}</p>
                  <p className="text-[10px] text-muted-foreground">{R ? labelAr : labelEn}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button onClick={() => navigate("/our-agents")} variant="outline" className="gap-2 px-8">
              <Network className="w-4 h-4" />{R ? "تعرف على شبكة وكلائنا" : "Explore Our Agent Network"}<ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══ 9. TESTIMONIALS ══════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "آراء العملاء" : "Testimonials"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "ماذا يقول عملاؤنا" : "What Our Clients Say"}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={cn("p-6 rounded-2xl border border-border/40 bg-secondary/20 transition-all duration-500", i === testimonialIdx || i === (testimonialIdx + 1) % TESTIMONIALS.length ? "opacity-100 scale-100" : "opacity-40 scale-95")}>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="w-3.5 h-3.5 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{R ? t.text_ar : t.text_en}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">{t.avatar}</div>
                  <div>
                    <p className="text-xs font-semibold">{R ? t.nameAr : t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{R ? t.roleAr : t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setTestimonialIdx(i)} className={cn("h-2 rounded-full transition-all", i === testimonialIdx ? "bg-primary w-6" : "bg-border w-2")} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ 10. BUSINESS CTA ══════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs mb-6">
            <Award className="w-4 h-4" />
            {R ? "حساب تجاري؟" : "Need a Business Account?"}
          </div>
          <h2 className="text-4xl font-display font-black mb-4">
            {R ? "حوّل حسابك إلى قوة تجارية" : "Upgrade to Business Power"}
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {R
              ? "سواء كنت بائعاً أو شريكاً أو وكيلاً — قدّم طلبك وبعد الموافقة تُفتح لك بوابتك الخاصة فوراً."
              : "Whether vendor, partner, or agent — submit your request and your dedicated portal unlocks after approval."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setBizOpen(true)} className="gap-2 px-10 gold-glow">
              <Building2 className="w-5 h-5" />
              {R ? "اطلب حساباً تجارياً" : "Request Business Account"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="gap-2 px-10">
              <MessageSquare className="w-5 h-5" />
              {R ? "تواصل مع المبيعات" : "Contact Sales"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-5">
            {R ? "مراجعة خلال 24-48 ساعة عمل · بدون بطاقة ائتمان" : "Review within 24-48 business hours · No credit card required"}
          </p>
        </div>
      </section>

    </PublicLayout>

    {/* ── Lead Capture Modals ── */}
    <LeadCaptureModal
      open={demoOpen}
      onClose={() => setDemoOpen(false)}
      type="demo"
      isAr={R}
      meta={{ icon: "🚀", color: "#D4A017", refName: R ? "KemetRise: Legacy Nexus" : "KemetRise: Legacy Nexus" }}
    />
    <LeadCaptureModal
      open={bizOpen}
      onClose={() => setBizOpen(false)}
      type="partner"
      isAr={R}
      meta={{ icon: "🏢", color: "#8b5cf6", refName: R ? "طلب حساب تجاري" : "Business Account Request" }}
    />
    </>
  );
}