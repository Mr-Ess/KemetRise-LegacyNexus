import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PublicLayout from "@/layouts/PublicLayout";
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
