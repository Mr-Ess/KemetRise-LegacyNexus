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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const PRICING = [
  {
    code: "free", name: "Free", nameAr: "مجاني", price: 0,
    features_en: ["Marketplace access", "5 products", "Basic analytics"],
    features_ar: ["وصول للسوق", "5 منتجات", "تحليلات أساسية"],
    color: "border-border/50", badge: "", cta_en: "Start Free", cta_ar: "ابدأ مجاناً",
  },
  {
    code: "starter", name: "Starter", nameAr: "مبتدئ", price: 9.99,
    features_en: ["50 products", "Orders management", "Wallet"],
    features_ar: ["50 منتج", "إدارة الطلبات", "المحفظة"],
    color: "border-blue-500/30", badge: "", cta_en: "Get Started", cta_ar: "ابدأ الآن",
  },
  {
    code: "pro", name: "Pro", nameAr: "احترافي", price: 29.99,
    features_en: ["Unlimited products", "Partner workspace", "AI agents", "Analytics"],
    features_ar: ["منتجات لا محدودة", "بيئة شريك", "وكلاء AI", "تحليلات"],
    color: "border-primary/50", badge: "الأكثر طلباً", cta_en: "Go Pro", cta_ar: "اشترك الآن",
  },
  {
    code: "enterprise", name: "Enterprise", nameAr: "مؤسسي", price: 99.99,
    features_en: ["Everything in Pro", "Custom sectors", "Dedicated support", "API", "HR & ERP"],
    features_ar: ["كل شيء في Pro", "قطاعات مخصصة", "دعم حصري", "API", "HR وERP"],
    color: "border-purple-500/30", badge: "الأفضل قيمة", cta_en: "Contact Sales", cta_ar: "تواصل معنا",
  },
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
  const [annual, setAnnual] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const featuresRev = useReveal();
  const sectorsRev = useReveal();
  const stepsRev = useReveal();
  const pricingRev = useReveal();
  const mallRev = useReveal();

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
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
                <Button size="lg" onClick={() => navigate("/auth?tab=signup")} className="gap-2 text-base px-10 gold-glow">
                  {R ? "ابدأ مجاناً" : "Start Free"} <ArrowRight className="w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-base px-10">
                  {R ? "تسجيل الدخول" : "Sign In"}
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-10 mt-16">
            {[
              { val: 8,    suffix: "",  labelEn: "Integrated Portals", labelAr: "بوابات متكاملة" },
              { val: 25,   suffix: "+", labelEn: "DB Tables",          labelAr: "جدول قاعدة بيانات" },
              { val: 10,   suffix: "",  labelEn: "Sectors",            labelAr: "قطاع تجاري" },
              { val: 100,  suffix: "%", labelEn: "Bilingual",          labelAr: "ثنائي اللغة" },
            ].map((s) => (
              <div key={s.labelEn} className="text-center">
                <p className="text-3xl font-display font-black text-primary gold-text-glow">
                  <Counter to={s.val} suffix={s.suffix} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">{R ? s.labelAr : s.labelEn}</p>
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

      {/* ══ 6. PRICING ═══════════════════════════════════════════ */}
      <section className="py-20 bg-secondary/10 border-y border-border/30" id="pricing">
        <div ref={pricingRev.ref} className="max-w-5xl mx-auto px-4">
          <div className={cn("text-center mb-12 transition-all duration-700", pricingRev.visible ? "opacity-100" : "opacity-0")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "خطط الاشتراك" : "Pricing Plans"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "ابدأ مجاناً وقم بالترقية" : "Start Free, Upgrade When Ready"}</h2>
            <div className="flex items-center justify-center gap-3 mt-5">
              <span className={cn("text-xs", !annual && "text-primary font-bold")}>{R ? "شهري" : "Monthly"}</span>
              <button onClick={() => setAnnual(v => !v)} className={cn("w-11 h-6 rounded-full border transition-all relative", annual ? "bg-primary border-primary" : "bg-secondary border-border/50")}>
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all", annual ? "left-[22px]" : "left-0.5")} />
              </button>
              <span className={cn("text-xs", annual && "text-primary font-bold")}>{R ? "سنوي (-20%)" : "Annual (-20%)"}</span>
            </div>
          </div>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 delay-150", pricingRev.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {PRICING.map((plan) => {
              const finalPrice = annual ? (plan.price * 0.8).toFixed(2) : plan.price.toFixed(2);
              return (
                <div key={plan.code} className={cn("relative p-5 rounded-2xl border-2 transition-all hover:-translate-y-1", plan.color, plan.code === "pro" && "shadow-lg shadow-primary/10")}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-[9px] px-3">{plan.badge}</Badge>
                    </div>
                  )}
                  <h3 className="text-sm font-bold mb-1">{R ? plan.nameAr : plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-display font-black">{plan.price === 0 ? "0" : `$${finalPrice}`}</span>
                    {plan.price > 0 && <span className="text-xs text-muted-foreground">{R ? "/شهر" : "/mo"}</span>}
                  </div>
                  <ul className="space-y-2 mb-5">
                    {(R ? plan.features_ar : plan.features_en).map((f) => (
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

      {/* ══ 8. MARKETPLACE & DIGITAL MALL ════════════════════════ */}
      <section className="py-20 bg-secondary/10 border-y border-border/30">
        <div ref={mallRev.ref} className="max-w-5xl mx-auto px-4">
          <div className={cn("text-center mb-12 transition-all duration-700", mallRev.visible ? "opacity-100" : "opacity-0")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              {R ? "تسوق معنا" : "Shop With Us"}
            </Badge>
            <h2 className="text-3xl font-display font-black">
              {R ? "السوق الإلكتروني والمول الرقمي" : "Marketplace & Digital Mall"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {R ? "تصفح الآلاف من المنتجات والخدمات من موردين معتمدين" : "Browse thousands of products & services from verified vendors"}
            </p>
          </div>
          <div className={cn("grid md:grid-cols-2 gap-6 transition-all duration-700 delay-150", mallRev.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {/* Marketplace */}
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-5">
                  <ShoppingBag className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-black mb-2">{R ? "السوق الإلكتروني" : "Marketplace"}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {R
                    ? "تصفح منتجات وخدمات من بائعين معتمدين. أضف للسلة، قارن، واشترِ بثقة."
                    : "Browse products & services from verified vendors. Add to cart, compare, and buy with confidence."}
                </p>
                <ul className="space-y-1.5 mb-6">
                  {(R
                    ? ["بحث وتصفية متقدم", "تقييمات موثوقة", "دفع آمن", "تتبع الطلبات"]
                    : ["Advanced search & filter", "Verified reviews", "Secure checkout", "Order tracking"]
                  ).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate(user ? "/marketplace" : "/auth?tab=signin")} className="gap-2 gold-glow">
                  <ShoppingCart className="w-4 h-4" />
                  {R ? "تصفح السوق" : "Browse Marketplace"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Digital Mall */}
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent p-8 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mb-5">
                  <Building2 className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-display font-black mb-2">{R ? "المول الرقمي" : "Digital Mall"}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {R
                    ? "تجربة تسوق منظمة في بيئة مول متكاملة — كل قطاع في جناحه الخاص بمتاجر وعروض حصرية."
                    : "Organized shopping in a full mall environment — each sector in its own wing with exclusive stores & offers."}
                </p>
                <ul className="space-y-1.5 mb-6">
                  {(R
                    ? ["أجنحة متخصصة بالقطاع", "عروض حصرية", "تجربة تسوق مرئية", "مقارنة بين المتاجر"]
                    : ["Sector-specific wings", "Exclusive deals", "Visual browsing experience", "Cross-store comparison"]
                  ).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate(user ? "/digital-mall" : "/auth?tab=signin")} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0">
                  <Building2 className="w-4 h-4" />
                  {R ? "دخول المول" : "Enter Digital Mall"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 9. BUSINESS CTA ══════════════════════════════════════ */}
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
            <Button size="lg" onClick={() => navigate(user ? "/portal/profile" : "/auth?tab=signup")} className="gap-2 px-10 gold-glow">
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
  );
}
