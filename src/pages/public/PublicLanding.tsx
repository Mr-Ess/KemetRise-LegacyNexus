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
  CheckCircle, Star, TrendingUp, Building2, MessageSquare,
  ShoppingBag, GraduationCap, Award, ChevronRight,
  Stethoscope, Scale, Briefcase, ShoppingCart, Cpu, Play,
  ChevronDown, Sparkles, Rocket, Lock, Code2, HeartHandshake,
  Bot, Wallet, PieChart, MapPin, Phone, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Animated Counter ───────────────────────────────────────────── */
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

/* ─── Floating Particle ─────────────────────────────────────────── */
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  size: Math.random() * 3 + 1,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 6,
  dur: 4 + Math.random() * 6,
  opacity: 0.15 + Math.random() * 0.4,
}));

/* ─── Scroll Reveal Hook ─────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const FEATURES = [
  { icon: Layers,        ar: "مصنع القطاعات",     en: "Sector Factory",        desc_ar: "تفعيل قطاعات متخصصة بلمسة واحدة",    desc_en: "Activate specialized sectors instantly",       color: "from-primary/20 to-primary/5",   border: "border-primary/20",  glow: "#D4A017" },
  { icon: Building2,     ar: "بيئات شركاء معزولة", en: "Partner Workspaces",    desc_ar: "كل شريك في بيئة عمل معزولة ومحمية", desc_en: "Every partner in an isolated workspace",       color: "from-indigo-500/20 to-indigo-500/5", border: "border-indigo-500/20", glow: "#6366F1" },
  { icon: Bot,           ar: "وكلاء ذكاء اصطناعي", en: "AI Brand Agents",       desc_ar: "وكلاء AI مخصصون لكل علامة تجارية",  desc_en: "Custom AI agents per brand",                   color: "from-cyan-500/20 to-cyan-500/5", border: "border-cyan-500/20", glow: "#06B6D4" },
  { icon: Wallet,        ar: "محفظة البائعين",      en: "Vendor Wallet",         desc_ar: "تسوية مالية آنية مع خصم رسوم تلقائي",desc_en: "Real-time settlement with auto fees",          color: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/20", glow: "#F97316" },
  { icon: BarChart3,     ar: "تحليلات وتقارير",     en: "Analytics & Reports",   desc_ar: "Kanban + ROI + تقارير مباشرة",       desc_en: "Kanban pipeline with ROI reporting",           color: "from-pink-500/20 to-pink-500/5", border: "border-pink-500/20", glow: "#EC4899" },
  { icon: Shield,        ar: "أمان متعدد الطبقات",  en: "Multi-layer Security",  desc_ar: "RLS + أدوار + صلاحيات + مراجعة",    desc_en: "RLS + roles + permissions + audit",           color: "from-red-500/20 to-red-500/5",   border: "border-red-500/20",  glow: "#EF4444" },
  { icon: Globe,         ar: "دعم ثنائي اللغة",     en: "Bilingual Support",     desc_ar: "واجهة كاملة بالعربية والإنجليزية",  desc_en: "Full Arabic & English interface",             color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20", glow: "#3B82F6" },
  { icon: Code2,         ar: "API مفتوحة",          en: "Open APIs",             desc_ar: "تكامل كامل مع أنظمة خارجية",        desc_en: "Full integration with external systems",      color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", glow: "#10B981" },
];

const SECTORS = [
  { icon: Stethoscope, label: "Medical",    ar: "الطب",      color: "#EF4444", bg: "bg-red-500/10" },
  { icon: Layers,      label: "Education",  ar: "التعليم",   color: "#8B5CF6", bg: "bg-violet-500/10" },
  { icon: Scale,       label: "Legal",      ar: "القانون",   color: "#6366F1", bg: "bg-indigo-500/10" },
  { icon: Briefcase,   label: "Services",   ar: "الخدمات",   color: "#EC4899", bg: "bg-pink-500/10" },
  { icon: ShoppingCart,label: "Retail",     ar: "التجزئة",   color: "#F97316", bg: "bg-orange-500/10" },
  { icon: TrendingUp,  label: "Financial",  ar: "المالية",   color: "#F59E0B", bg: "bg-yellow-500/10" },
  { icon: GraduationCap,label:"Courses",    ar: "الدورات",   color: "#14B8A6", bg: "bg-teal-500/10" },
  { icon: Building2,   label: "Tourism",    ar: "السياحة",   color: "#10B981", bg: "bg-emerald-500/10" },
  { icon: Cpu,         label: "Tech",       ar: "التكنولوجيا",color: "#0EA5E9", bg: "bg-sky-500/10" },
  { icon: HeartHandshake,label:"Consulting",ar: "الاستشارات",color: "#A855F7", bg: "bg-purple-500/10" },
];

const PRICING = [
  {
    code: "free",     name: "Free",       nameAr: "مجاني",     price: 0,
    features_en: ["Marketplace access", "5 products", "Basic analytics", "Community support"],
    features_ar: ["وصول للسوق", "5 منتجات", "تحليلات أساسية", "دعم المجتمع"],
    color: "border-border", badge: "", cta_en: "Start Free", cta_ar: "ابدأ مجاناً",
  },
  {
    code: "starter",  name: "Starter",    nameAr: "مبتدئ",     price: 9.99,
    features_en: ["50 products", "Orders management", "Wallet & payouts", "Email support"],
    features_ar: ["50 منتج", "إدارة الطلبات", "المحفظة والمدفوعات", "دعم بريدي"],
    color: "border-blue-500/40", badge: "", cta_en: "Get Started", cta_ar: "ابدأ الآن",
  },
  {
    code: "pro",      name: "Pro",        nameAr: "احترافي",   price: 29.99,
    features_en: ["Unlimited products", "Partner workspace", "AI chat agents", "Analytics dashboard", "API access"],
    features_ar: ["منتجات لا محدودة", "بيئة شريك", "وكلاء AI", "لوحة تحليلات", "API"],
    color: "border-primary/50", badge: "Popular", cta_en: "Go Pro", cta_ar: "ترقية احترافية",
  },
  {
    code: "enterprise", name: "Enterprise", nameAr: "مؤسسي",   price: 99.99,
    features_en: ["Everything in Pro", "Custom sectors", "HR & ERP module", "Dedicated support", "White-label option", "SLA 99.9%"],
    features_ar: ["كل ما في Pro", "قطاعات مخصصة", "وحدة HR وERP", "دعم حصري", "علامة بيضاء", "ضمان 99.9%"],
    color: "border-purple-500/40", badge: "Best Value", cta_en: "Contact Sales", cta_ar: "تواصل للبيع",
  },
];

const STEPS = [
  { num: "01", icon: Rocket,        titleEn: "Create Account",    titleAr: "أنشئ حساباً",       descEn: "Sign up in 60 seconds, choose your role and sector.",          descAr: "سجّل في 60 ثانية واختر دورك وقطاعك." },
  { num: "02", icon: Layers,        titleEn: "Configure Portal",  titleAr: "هيّئ بوابتك",       descEn: "Activate sectors, add brands, configure your workspace.",       descAr: "فعّل القطاعات وأضف براندات وهيّئ مساحة عملك." },
  { num: "03", icon: TrendingUp,    titleEn: "Grow & Scale",       titleAr: "انمُ وتوسّع",       descEn: "Use AI agents, manage team & finances, and scale globally.",     descAr: "استخدم وكلاء الذكاء الاصطناعي وادر الفريق والمالية." },
];

const TESTIMONIALS = [
  { name: "Ahmed Khaled",    nameAr: "أحمد خالد",    role: "E-commerce Director",  roleAr: "مدير التجارة الإلكترونية",  text_en: "KemetRise unified our 12 brands into one dashboard. Revenue tracking is flawless.",        text_ar: "وحّدت KemetRise 12 علامة تجارية في لوحة واحدة. تتبع الإيرادات لا تشوبه شائبة.",      avatar: "AK" },
  { name: "Sara Al-Nour",   nameAr: "سارة النور",   role: "Startup Founder",       roleAr: "مؤسسة شركة ناشئة",         text_en: "The AI agents handle 70% of our customer queries automatically. Game changer.",            text_ar: "وكلاء الذكاء الاصطناعي يتعاملون مع 70% من استفسارات العملاء آلياً. تغيير جذري.",        avatar: "SN" },
  { name: "Omar Fawzi",     nameAr: "عمر فوزي",     role: "Operations Manager",    roleAr: "مدير العمليات",             text_en: "HR attendance via QR codes + ERP ledger saved us 3 days per month in admin work.",          text_ar: "الحضور عبر QR ودفتر الأستاذ ERP وفّرا لنا 3 أيام شهرياً من العمل الإداري.",            avatar: "OF" },
  { name: "Lina Rashid",    nameAr: "لينا راشد",    role: "Marketing Lead",        roleAr: "قيادة التسويق",             text_en: "The Kanban leads pipeline and campaign analytics boosted our conversion by 40%.",            text_ar: "خط أنابيب العملاء وتحليلات الحملات رفعا معدل تحويلنا بنسبة 40%.",                      avatar: "LR" },
];

export default function PublicLanding() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const R = i18n.language === "ar";
  const [activeTab, setActiveTab] = useState<"monthly" | "annual">("monthly");
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const heroReveal = useReveal();
  const statsReveal = useReveal();
  const featuresReveal = useReveal();
  const sectorsReveal = useReveal();
  const pricingReveal = useReveal();

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <PublicLayout>
      {/* ══ 1. HERO ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Particle background */}
        <div className="absolute inset-0 pointer-events-none">
          {PARTICLES.map((p, i) => (
            <div key={i} className="absolute rounded-full bg-primary"
              style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, opacity: p.opacity,
                animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite` }} />
          ))}
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[100px] animate-glow-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/8 rounded-full blur-[80px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(hsl(42 85% 55%) 1px, transparent 1px), linear-gradient(90deg, hsl(42 85% 55%) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 text-center w-full">
          {/* Badge */}
          <div ref={heroReveal.ref} className={cn("transition-all duration-700", heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <Badge className="mb-6 px-5 py-2 bg-primary/10 text-primary border-primary/30 text-xs font-semibold gap-2 animate-glow-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              {R ? "المنصة الموحدة متعددة المستأجرين · SaaS + ERP" : "Unified Multi-Tenant SaaS & ERP Platform"}
            </Badge>
          </div>

          {/* Headline */}
          <div className={cn("transition-all duration-700 delay-150", heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black leading-none mb-4">
              <span className="text-foreground">Kemet</span>
              <span className="text-primary gold-text-glow">Rise</span>
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground font-light tracking-widest mb-2 font-display">
              LEGACY NEXUS
            </p>
          </div>

          {/* Sub-headline */}
          <div className={cn("transition-all duration-700 delay-300 max-w-3xl mx-auto", heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <p className="text-base md:text-xl text-muted-foreground leading-relaxed mt-6 mb-10">
              {R
                ? "ثمانية بوابات موحدة في نظام واحد — إدارة الموارد البشرية، ERP، المتجر، التسويق، الوكلاء، الشركاء، والذكاء الاصطناعي — كل شيء مترابط."
                : "Eight unified portals in one system — HR, ERP, commerce, marketing, agents, partners & AI — all interconnected."}
            </p>
          </div>

          {/* CTAs */}
          <div className={cn("flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500", heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {user ? (
              <Button size="lg" onClick={() => navigate("/portal")} className="gap-2 text-base px-10 gold-glow hover:gold-glow-strong transition-shadow">
                {R ? "الدخول للوحة التحكم" : "Go to Dashboard"} <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate("/auth?tab=signup")} className="gap-2 text-base px-10 gold-glow hover:gold-glow-strong transition-all">
                  <Rocket className="w-5 h-5" />
                  {R ? "ابدأ مجاناً الآن" : "Start Free Today"}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/about")} className="text-base px-10 gap-2 border-primary/30 hover:border-primary/60">
                  <Play className="w-4 h-4" />
                  {R ? "اكتشف المنصة" : "Explore Platform"}
                </Button>
              </>
            )}
          </div>

          {/* Stats bar */}
          <div ref={statsReveal.ref} className={cn("mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto transition-all duration-700", statsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {[
              { val: 8,    suffix: "",    labelEn: "Unified Portals",    labelAr: "بوابة موحدة" },
              { val: 10,   suffix: "+",   labelEn: "Active Sectors",     labelAr: "قطاع نشط" },
              { val: 99,   suffix: ".9%", labelEn: "Uptime SLA",         labelAr: "ضمان الوقت" },
              { val: 100,  suffix: "%",   labelEn: "Bilingual",          labelAr: "ثنائي اللغة" },
            ].map(s => (
              <div key={s.labelEn} className="text-center p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-all">
                <p className="text-3xl font-display font-black text-primary gold-text-glow">
                  <Counter to={s.val} suffix={s.suffix} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">{R ? s.labelAr : s.labelEn}</p>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 flex justify-center animate-bounce opacity-40">
            <ChevronDown className="w-6 h-6 text-primary" />
          </div>
        </div>
      </section>

      {/* ══ 2. LOGO MARQUEE ════════════════════════════════════════ */}
      <section className="py-8 border-y border-border/30 bg-secondary/10 overflow-hidden">
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">
          {R ? "قطاعات مدعومة" : "Supported Sectors"}
        </p>
        <div className="flex gap-12 animate-marquee whitespace-nowrap" style={{ width: "max-content" }}>
          {[...SECTORS, ...SECTORS].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 opacity-50 hover:opacity-100 transition-opacity">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <span className="text-sm font-medium">{R ? s.ar : s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 3. FEATURES GRID ═══════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div ref={featuresReveal.ref} className={cn("text-center mb-16 transition-all duration-700", featuresReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "الميزات" : "Features"}</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
              {R ? "كل ما تحتاجه في مكان واحد" : "Everything You Need, One Platform"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {R ? "ثمانية أنظمة متكاملة تعمل معاً على قاعدة بيانات موحدة مع أمان متعدد الطبقات" : "Eight integrated systems on a unified database with multi-layer security"}
            </p>
          </div>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 delay-200", featuresReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {FEATURES.map((f, i) => (
              <div key={f.en} className={cn("relative p-5 rounded-2xl border bg-gradient-to-br hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-default group overflow-hidden", f.color, f.border)}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{ boxShadow: `inset 0 0 40px ${f.glow}15` }} />
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: f.glow + "20", border: `1px solid ${f.glow}30` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.glow }} />
                </div>
                <h3 className="text-sm font-bold mb-2">{R ? f.ar : f.en}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{R ? f.desc_ar : f.desc_en}</p>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4" style={{ color: f.glow }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. HOW IT WORKS ════════════════════════════════════════ */}
      <section className="py-20 bg-secondary/10 border-y border-border/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "كيف يعمل" : "How It Works"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "ثلاث خطوات للانطلاق" : "Three Steps to Launch"}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative text-center p-6 rounded-2xl bg-background border border-border/40 hover:border-primary/30 transition-all hover:-translate-y-1 group">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-display font-black flex items-center justify-center gold-glow">
                  {s.num}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 mt-2 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-sm font-bold mb-2">{R ? s.titleAr : s.titleEn}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{R ? s.descAr : s.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. SECTORS GRID ═══════════════════════════════════════ */}
      <section ref={sectorsReveal.ref} className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className={cn("text-center mb-12 transition-all duration-700", sectorsReveal.visible ? "opacity-100" : "opacity-0")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "القطاعات" : "Sectors"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "قطاعات مخصصة لكل صناعة" : "Industry-Specific Sectors"}</h2>
          </div>
          <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4 transition-all duration-700 delay-200", sectorsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {SECTORS.map(s => (
              <div key={s.label} className={cn("flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-border/30 hover:border-primary/20 bg-background hover:bg-secondary/30 transition-all hover:-translate-y-1 cursor-pointer group")}>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.bg)}>
                  <s.icon className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ color: s.color }} />
                </div>
                <span className="text-xs font-semibold text-center">{R ? s.ar : s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. PRICING ═══════════════════════════════════════════ */}
      <section ref={pricingReveal.ref} className="py-24 bg-secondary/10 border-y border-border/30" id="pricing">
        <div className="max-w-5xl mx-auto px-4">
          <div className={cn("text-center mb-12 transition-all duration-700", pricingReveal.visible ? "opacity-100" : "opacity-0")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "الأسعار" : "Pricing"}</Badge>
            <h2 className="text-3xl font-display font-black mb-3">{R ? "اشتراكات لكل حجم" : "Plans for Every Scale"}</h2>
            <p className="text-muted-foreground mb-6">{R ? "ابدأ مجاناً وقم بالترقية عند الحاجة" : "Start free, upgrade when you need"}</p>
            {/* Monthly / Annual toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/40">
              <button onClick={() => setActiveTab("monthly")} className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {R ? "شهري" : "Monthly"}
              </button>
              <button onClick={() => setActiveTab("annual")} className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {R ? "سنوي (خصم 20%)" : "Annual (save 20%)"}
              </button>
            </div>
          </div>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 delay-200", pricingReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {PRICING.map(plan => {
              const price = activeTab === "annual" && plan.price > 0 ? (plan.price * 0.8) : plan.price;
              return (
                <div key={plan.code} className={cn("relative rounded-2xl border-2 p-5 hover:-translate-y-2 transition-all duration-300 bg-background", plan.color, plan.code === "pro" && "shadow-xl shadow-primary/10")}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-3 gold-glow">{plan.badge}</Badge>
                    </div>
                  )}
                  <h3 className="text-sm font-bold mb-1">{R ? plan.nameAr : plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-display font-black text-primary">${price === 0 ? "0" : price.toFixed(2)}</span>
                    {plan.price > 0 && <span className="text-xs text-muted-foreground">{R ? "/شهر" : "/mo"}</span>}
                  </div>
                  <ul className="space-y-2 mb-5">
                    {(R ? plan.features_ar : plan.features_en).map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" className="w-full" variant={plan.code === "pro" ? "default" : "outline"}
                    onClick={() => navigate(user ? "/portal/profile" : "/auth?tab=signup")}>
                    {R ? plan.cta_ar : plan.cta_en}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 7. TESTIMONIALS ══════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "آراء العملاء" : "Testimonials"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "ماذا يقول عملاؤنا" : "What Our Clients Say"}</h2>
          </div>
          <div className="relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={cn("p-6 rounded-2xl border border-border/40 bg-secondary/20 transition-all duration-500", i === testimonialIdx || i === (testimonialIdx + 1) % TESTIMONIALS.length ? "opacity-100 scale-100" : "opacity-40 scale-95")}>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="w-3.5 h-3.5 fill-primary text-primary" />)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    "{R ? t.text_ar : t.text_en}"
                  </p>
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
                <button key={i} onClick={() => setTestimonialIdx(i)} className={cn("w-2 h-2 rounded-full transition-all", i === testimonialIdx ? "bg-primary w-6" : "bg-border")} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 8. BUSINESS CTA ══════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
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
            <Button size="lg" onClick={() => navigate(user ? "/portal/profile" : "/auth?tab=signup")} className="gap-2 px-10 gold-glow">
              <Building2 className="w-5 h-5" />
              {R ? "اطلب حساباً تجارياً" : "Request Business Account"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="gap-2 px-10">
              <MessageSquare className="w-5 h-5" />
              {R ? "تواصل مع المبيعات" : "Contact Sales"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-5">{R ? "مراجعة خلال 24-48 ساعة عمل · بدون بطاقة ائتمان" : "Review within 24-48 business hours · No credit card required"}</p>
        </div>
      </section>
    </PublicLayout>
  );
}

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Zap, Shield, Globe, BarChart3, Users, Layers,
  CheckCircle, Star, TrendingUp, Building2, MessageSquare,
  ShoppingBag, GraduationCap, Heart, Award, ChevronRight,
  Stethoscope, Scale, Briefcase, ShoppingCart, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Layers,      ar: "مصنع القطاعات",     en: "Sector Factory",      desc_ar: "تفعيل قطاعات متخصصة بلمسة واحدة",           desc_en: "Activate specialized sectors with one click",         color: "text-primary" },
  { icon: Building2,   ar: "بيئات شركاء معزولة", en: "Partner Workspaces",  desc_ar: "كل شريك في بيئة عمل معزولة ومحمية",         desc_en: "Each partner in isolated sandboxed workspace",        color: "text-indigo-400" },
  { icon: Users,       ar: "شبكة وكلاء ذكية",    en: "Agent Network",       desc_ar: "تتبع العملاء والعمولات في الوقت الفعلي",     desc_en: "Track clients & commissions in real-time",           color: "text-emerald-400" },
  { icon: ShoppingBag, ar: "محفظة البائعين",      en: "Vendor Wallet",       desc_ar: "نظام تسوية مالية مع خصم رسوم تلقائي",       desc_en: "Settlement with automatic fee deduction",            color: "text-orange-400" },
  { icon: BarChart3,   ar: "تحليلات المبيعات",    en: "Sales Analytics",     desc_ar: "قناة مبيعات Kanban مع تقارير ROI",           desc_en: "Kanban pipeline with ROI reporting",                 color: "text-pink-400" },
  { icon: Cpu,         ar: "وكلاء ذكاء اصطناعي", en: "AI Chat Agents",      desc_ar: "وكلاء AI متخصصون لكل علامة تجارية",         desc_en: "Specialized AI agents per brand",                   color: "text-cyan-400" },
  { icon: Globe,       ar: "دعم ثنائي اللغة",     en: "Bilingual Support",   desc_ar: "واجهة كاملة بالعربية والإنجليزية",          desc_en: "Full Arabic & English interface",                    color: "text-blue-400" },
  { icon: Shield,      ar: "أمان متعدد الطبقات",  en: "Multi-layer Security", desc_ar: "RLS + دور + صلاحيات + سجل المراجعة",       desc_en: "RLS + roles + permissions + audit trail",           color: "text-red-400" },
];

const SECTORS = [
  { icon: Stethoscope, label: "Medical",     ar: "الطب",     color: "#EF4444" },
  { icon: Layers,      label: "Education",   ar: "التعليم",  color: "#8B5CF6" },
  { icon: Scale,       label: "Legal",       ar: "القانون",  color: "#6366F1" },
  { icon: Briefcase,   label: "Services",    ar: "الخدمات",  color: "#EC4899" },
  { icon: ShoppingCart,label: "Retail",      ar: "التجزئة",  color: "#F97316" },
  { icon: TrendingUp,  label: "Financial",   ar: "المالية",  color: "#F59E0B" },
  { icon: GraduationCap,label:"Courses",     ar: "الدورات",  color: "#14B8A6" },
  { icon: Building2,   label: "Tourism",     ar: "السياحة",  color: "#10B981" },
];

const PRICING = [
  { code: "free",     name: "Free",       nameAr: "مجاني",      price: 0,    priceAr: "0",  features_en: ["Marketplace access","5 products","Basic analytics"], features_ar: ["وصول للسوق","5 منتجات","تحليلات أساسية"], color: "border-border", badge: "" },
  { code: "starter",  name: "Starter",    nameAr: "مبتدئ",      price: 9.99, priceAr: "9.99", features_en: ["50 products","Orders management","Wallet"], features_ar: ["50 منتج","إدارة الطلبات","المحفظة"], color: "border-blue-500/30", badge: "" },
  { code: "pro",      name: "Pro",        nameAr: "احترافي",    price: 29.99,priceAr: "29.99",features_en: ["Unlimited products","Partner workspace","AI agents","Analytics"], features_ar: ["منتجات لا محدودة","بيئة شريك","وكلاء AI","تحليلات"], color: "border-primary/40", badge: "Popular" },
  { code: "enterprise",name: "Enterprise",nameAr: "مؤسسي",      price: 99.99,priceAr: "99.99",features_en: ["Everything in Pro","Custom sectors","Dedicated support","API access","HR & ERP"], features_ar: ["كل شيء في Pro","قطاعات مخصصة","دعم حصري","API","HR وERP"], color: "border-purple-500/30", badge: "Best Value" },
];

export default function PublicLanding() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const R = i18n.language === "ar";

  return (
    <PublicLayout>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl" />
        </div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 px-4 py-1.5 bg-primary/10 text-primary border-primary/30 text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {R ? "المنصة الموحدة متعددة المستأجرين" : "Unified Multi-Tenant SaaS & ERP Platform"}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-black text-foreground leading-tight mb-6">
            <span className="text-primary">KemetRise</span>
            <br />
            <span className="text-muted-foreground text-3xl md:text-4xl">Legacy Nexus</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {R
              ? "ثمانية بوابات متكاملة في نظام واحد — من الإدارة العليا إلى المستخدم النهائي، مع ذكاء اصطناعي وموارد بشرية وتحليلات فورية."
              : "Eight interconnected portals in one system — from supreme admin to end user, with AI, HR, and real-time analytics."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button size="lg" onClick={() => navigate("/portal")} className="gap-2 text-base px-8">
                {R ? "الدخول للوحة التحكم" : "Go to Dashboard"} <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate("/auth?tab=signup")} className="gap-2 text-base px-8">
                  {R ? "ابدأ مجاناً" : "Start Free"} <ArrowRight className="w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-base px-8">
                  {R ? "تسجيل الدخول" : "Sign In"}
                </Button>
              </>
            )}
          </div>
          {/* Stats row */}
          <div className="flex justify-center gap-8 mt-14 text-center">
            {[["8", R ? "بوابات متكاملة" : "Integrated Portals"], ["∞", R ? "قطاعات قابلة للتفعيل" : "Activatable Sectors"], ["100%", R ? "ثنائي اللغة" : "Bilingual"], ["0", R ? "بيانات مشتركة بين الشركاء" : "Cross-partner data leaks"]].map(([v, l]) => (
              <div key={l}>
                <p className="text-2xl font-display font-black text-primary">{v}</p>
                <p className="text-xs text-muted-foreground mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sectors ──────────────────────────────────────────── */}
      <section className="py-16 border-y border-border/40 bg-secondary/10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-8">{R ? "القطاعات المدعومة — تُفعَّل ديناميكياً" : "Supported Sectors — Dynamically Activated"}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {SECTORS.map(s => (
              <div key={s.label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/40 bg-background/80 hover:border-border transition-all">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "20" }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-sm font-medium">{R ? s.ar : s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-black mb-3">{R ? "كل ما تحتاجه في مكان واحد" : "Everything You Need, One Platform"}</h2>
            <p className="text-muted-foreground">{R ? "ثمانية أنظمة متكاملة تعمل معاً في قاعدة بيانات موحدة" : "Eight integrated systems working together on one unified database"}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <Card key={f.en} className="border-border/40 hover:border-primary/20 transition-all hover:-translate-y-1 group">
                <CardContent className="p-5">
                  <f.icon className={cn("w-8 h-8 mb-4 group-hover:scale-110 transition-transform", f.color)} />
                  <h3 className="text-sm font-bold mb-2">{R ? f.ar : f.en}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{R ? f.desc_ar : f.desc_en}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="py-20 bg-secondary/10 border-y border-border/40" id="pricing">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-black mb-3">{R ? "خطط الاشتراك" : "Pricing Plans"}</h2>
            <p className="text-muted-foreground">{R ? "ابدأ مجاناً وقم بالترقية عند الحاجة" : "Start free, upgrade when you need"}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING.map(plan => (
              <Card key={plan.code} className={cn("border-2 relative transition-all hover:-translate-y-1", plan.color, plan.code === "pro" && "shadow-lg shadow-primary/10")}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-[9px] px-3">{plan.badge}</Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <h3 className="text-sm font-bold mb-1">{R ? plan.nameAr : plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-display font-black">${plan.price === 0 ? "0" : plan.price}</span>
                    {plan.price > 0 && <span className="text-xs text-muted-foreground">{R ? "/شهر" : "/mo"}</span>}
                  </div>
                  <ul className="space-y-2 mb-5">
                    {(R ? plan.features_ar : plan.features_en).map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" className={cn("w-full", plan.code === "pro" ? "" : "variant-outline")}
                    onClick={() => navigate(user ? "/portal/profile" : "/auth?tab=signup")}>
                    {plan.price === 0 ? (R ? "ابدأ مجاناً" : "Start Free") : (R ? "اشترك الآن" : "Subscribe")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Business Account CTA ─────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs mb-6">
            <Award className="w-3.5 h-3.5" />
            {R ? "هل أنت مزود خدمة أو شريك تجاري؟" : "Are you a service provider or business partner?"}
          </div>
          <h2 className="text-3xl font-display font-black mb-4">
            {R ? "حوّل حسابك إلى حساب تجاري" : "Upgrade to Business Account"}
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {R
              ? "بضغطة زر واحدة، قدّم طلبك لتصبح مزود خدمة أو وكيلاً أو شريكاً. بعد موافقة الإدارة، يفتح لك البوابة المناسبة فوراً."
              : "With one button, submit your request to become a vendor, agent, or partner. After admin approval, your portal unlocks instantly."}
          </p>
          <Button size="lg" onClick={() => navigate(user ? "/portal/profile" : "/auth?tab=signup")} className="gap-2 text-base px-10">
            <Building2 className="w-5 h-5" />
            {R ? "اطلب حساباً تجارياً" : "Request Business Account"}
            <ArrowRight className="w-5 h-5" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">{R ? "المراجعة خلال 24-48 ساعة عمل" : "Review within 24-48 business hours"}</p>
        </div>
      </section>
    </PublicLayout>
  );
}
