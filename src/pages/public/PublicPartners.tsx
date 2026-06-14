import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Handshake, Globe, Star, CheckCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Data ────────────────────────────────────────────────────────────── */
type Partner = {
  id: string; icon: string; name: string; nameAr: string;
  type: string; typeAr: string; color: string;
  desc: string; descAr: string;
  website?: string; tier: "platinum" | "gold" | "silver";
};

const PARTNERS: Partner[] = [
  {
    id: "p1", icon: "☁️", name: "Supabase", nameAr: "سوبابيس",
    type: "Cloud & Database", typeAr: "سحابة وقاعدة بيانات", color: "emerald",
    desc: "Our primary backend — real-time PostgreSQL, auth, storage and edge functions powering every KemetRise deployment.",
    descAr: "قاعدتنا الخلفية الأساسية — PostgreSQL الفوري، المصادقة، التخزين والوظائف الحدية تدعم كل نشر لـ KemetRise.",
    website: "https://supabase.com", tier: "platinum",
  },
  {
    id: "p2", icon: "⚡", name: "Vite + React", nameAr: "فايت + ريأكت",
    type: "Frontend Infrastructure", typeAr: "بنية تحتية للواجهة", color: "violet",
    desc: "Ultra-fast frontend build tooling. React 18 + TypeScript + Vite gives us the speed and DX to ship features rapidly.",
    descAr: "أدوات بناء الواجهة فائقة السرعة. React 18 + TypeScript + Vite يمنحانا السرعة لشحن الميزات بسرعة.",
    tier: "platinum",
  },
  {
    id: "p3", icon: "🤖", name: "OpenAI / Claude", nameAr: "أوبن إيه آي / كلود",
    type: "AI Infrastructure", typeAr: "بنية تحتية للذكاء الاصطناعي", color: "cyan",
    desc: "Powering ANUBIS, ISIS, HORUS and 10+ AI agents across the platform with GPT-4o and Claude Sonnet models.",
    descAr: "تشغيل أنوبيس وإيزيس وحورس وأكثر من 10 وكلاء AI عبر المنصة بنماذج GPT-4o وClaude Sonnet.",
    tier: "platinum",
  },
  {
    id: "p4", icon: "💳", name: "Stripe / Fawry", nameAr: "سترايب / فوري",
    type: "Payment Gateway", typeAr: "بوابة الدفع", color: "indigo",
    desc: "Secure payments in 135+ currencies. Local Egyptian payment methods including Fawry, Meeza and EasyPay are supported.",
    descAr: "مدفوعات آمنة بأكثر من 135 عملة. طرق الدفع المصرية المحلية بما فيها فوري وميزة وإيزي باي مدعومة.",
    tier: "gold",
  },
  {
    id: "p5", icon: "📧", name: "Resend / SendGrid", nameAr: "ريسيند / سيندجريد",
    type: "Communication", typeAr: "التواصل", color: "blue",
    desc: "Transactional email, SMS notifications and marketing campaigns delivered with high deliverability rates.",
    descAr: "بريد إلكتروني معاملاتي وإشعارات SMS وحملات تسويقية بمعدلات توصيل عالية.",
    tier: "gold",
  },
  {
    id: "p6", icon: "🔐", name: "Auth0 / Supabase Auth", nameAr: "أوث0 / مصادقة سوبابيس",
    type: "Identity & Security", typeAr: "الهوية والأمان", color: "red",
    desc: "Enterprise-grade SSO, MFA, OAuth, and RBAC security ensuring every tenant's data stays isolated and protected.",
    descAr: "أمان SSO وMFA وOAuth وRBAC بمستوى المؤسسات يضمن عزل وحماية بيانات كل مستأجر.",
    tier: "gold",
  },
  {
    id: "p7", icon: "📊", name: "Recharts / Chart.js", nameAr: "ريتشارتس / تشارت جي إس",
    type: "Data Visualization", typeAr: "تصور البيانات", color: "orange",
    desc: "Beautiful, interactive business intelligence dashboards rendered with React-based charting libraries.",
    descAr: "لوحات ذكاء أعمال تفاعلية وجميلة مُعرضة بمكتبات الرسوم البيانية المبنية على React.",
    tier: "silver",
  },
  {
    id: "p8", icon: "🌐", name: "Cloudflare", nameAr: "كلاودفلير",
    type: "CDN & Security", typeAr: "CDN والأمان", color: "amber",
    desc: "Global CDN, DDoS protection, and edge caching ensuring sub-100ms load times for users across the Middle East and beyond.",
    descAr: "شبكة CDN عالمية وحماية DDoS وتخزين مؤقت على الحافة لضمان أوقات تحميل دون 100ms.",
    tier: "silver",
  },
  {
    id: "p9", icon: "🎨", name: "Tailwind CSS + shadcn/ui", nameAr: "تيلويند + شادسن",
    type: "Design System", typeAr: "نظام التصميم", color: "pink",
    desc: "Our design system built on Tailwind CSS with Egyptian-themed gold palette, Orbitron/Rajdhani typography and dark/light modes.",
    descAr: "نظام التصميم المبني على Tailwind CSS بلوحة ذهبية ذات طابع مصري وخطوط Orbitron/Rajdhani.",
    tier: "silver",
  },
];

const TIER_COLORS = {
  platinum: { label: "Platinum", labelAr: "بلاتيني", border: "border-primary/40",  bg: "from-primary/10", badge: "bg-primary/15 text-primary border-primary/30" },
  gold:     { label: "Gold",     labelAr: "ذهبي",     border: "border-amber-500/40", bg: "from-amber-500/10", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  silver:   { label: "Silver",   labelAr: "فضي",      border: "border-slate-400/40", bg: "from-slate-400/10", badge: "bg-slate-400/15 text-slate-400 border-slate-400/30" },
};

const PAL: Record<string, string> = {
  emerald: "text-emerald-400", violet: "text-violet-400", cyan: "text-cyan-400",
  indigo: "text-indigo-400", blue: "text-blue-400", red: "text-red-400",
  orange: "text-orange-400", amber: "text-amber-400", pink: "text-pink-400",
};

const BENEFITS = [
  { icon: "💰", en: "Revenue sharing up to 30% commission",         ar: "مشاركة في الإيرادات حتى 30% عمولة" },
  { icon: "🎓", en: "Free access to KemetRise Academy",             ar: "وصول مجاني لأكاديمية KemetRise" },
  { icon: "🚀", en: "Co-marketing & co-selling opportunities",      ar: "فرص التسويق والبيع المشترك" },
  { icon: "🛠️", en: "Dedicated technical support & sandbox access", ar: "دعم تقني مخصص ووصول sandbox" },
  { icon: "🏆", en: "Partner certification & badge program",        ar: "برنامج شهادات وأوسمة الشركاء" },
  { icon: "📊", en: "Analytics dashboard to track referral earnings",ar: "لوحة تحليلات لتتبع أرباح الإحالة" },
];

const TIERS_ORDER: Partner["tier"][] = ["platinum", "gold", "silver"];

export default function PublicPartners() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const R = i18n.language === "ar";
  const [activeTier, setActiveTier] = useState<"all" | Partner["tier"]>("all");

  const filtered = activeTier === "all" ? PARTNERS : PARTNERS.filter((p) => p.tier === activeTier);

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 gap-2 px-4 py-1.5 text-xs">
            <Handshake className="w-3.5 h-3.5" />
            {R ? "شركاؤنا" : "Our Partners"}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-black mb-4 leading-tight">
            {R ? "نبني المستقبل معاً" : "Building the Future Together"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base mb-10">
            {R ? "نتعاون مع أفضل الشركات في العالم لتوفير منصة موحدة وآمنة وقابلة للتوسع." : "We partner with world-class companies to deliver a unified, secure and scalable platform."}
          </p>
        </div>
      </section>

      {/* ── Tier Filter ───────────────────────────────────────────────── */}
      <section className="pb-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 justify-center mb-8 flex-wrap">
            <button onClick={() => setActiveTier("all")}
              className={cn("px-4 py-1.5 rounded-full border text-xs font-medium transition-all", activeTier === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
              {R ? "الكل" : "All Partners"}
            </button>
            {TIERS_ORDER.map((t) => (
              <button key={t} onClick={() => setActiveTier(t)}
                className={cn("px-4 py-1.5 rounded-full border text-xs font-medium transition-all capitalize",
                  activeTier === t ? `${TIER_COLORS[t].badge}` : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
                {R ? TIER_COLORS[t].labelAr : TIER_COLORS[t].label}
              </button>
            ))}
          </div>

          {/* ── Partner Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {filtered.map((p) => {
              const tier = TIER_COLORS[p.tier];
              const colorTxt = PAL[p.color] || "text-primary";
              return (
                <Card key={p.id}
                  className={cn("group flex flex-col p-5 border transition-all hover:-translate-y-1 hover:shadow-xl bg-gradient-to-b to-transparent", tier.border, tier.bg)}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{p.icon}</span>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 ${tier.badge}`}>
                      {R ? tier.labelAr : tier.label}
                    </Badge>
                  </div>
                  <h3 className={cn("font-bold text-sm mb-0.5", colorTxt)}>{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground mb-3">{R ? p.typeAr : p.type}</p>
                  <p className="text-xs text-muted-foreground flex-1 leading-relaxed mb-4">
                    {R ? p.descAr : p.desc}
                  </p>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer"
                      className={cn("text-xs font-medium flex items-center gap-1 hover:underline", colorTxt)}>
                      {R ? "زيارة الموقع" : "Visit Website"} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </Card>
              );
            })}
          </div>

          {/* ── Partnership Benefits ───────────────────────────────── */}
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-amber-500/5 p-8 md:p-12 mb-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-black mb-2">
                {R ? "انضم إلى برنامج شركائنا" : "Join Our Partner Program"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {R ? "سواء كنت وكيلاً أو مورداً أو شريكاً تقنياً، لدينا ما يناسبك." : "Whether you're a reseller, vendor or technology partner, we have a tier that fits."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {BENEFITS.map((b) => (
                <div key={b.en} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/20 border border-border/40">
                  <span className="text-xl shrink-0">{b.icon}</span>
                  <p className="text-xs text-muted-foreground">{R ? b.ar : b.en}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" onClick={() => navigate("/auth?tab=signup&role=partner")} className="gap-2 gold-glow">
                {R ? "كن شريكاً الآن" : "Become a Partner"} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contact")}>
                {R ? "تواصل مع فريق الشراكات" : "Contact Partner Team"}
              </Button>
            </div>
          </div>

          {/* ── Stats strip ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { val: "200+", en: "Global Partners", ar: "شريك عالمي" },
              { val: "30%",  en: "Max Commission",  ar: "أقصى عمولة"  },
              { val: "40+",  en: "Countries",       ar: "دولة"         },
              { val: "24h",  en: "Partner Support", ar: "دعم الشركاء"  },
            ].map((s) => (
              <div key={s.en} className="p-4 rounded-xl border border-border/40 bg-secondary/10">
                <p className="text-2xl font-display font-black text-primary mb-1">{s.val}</p>
                <p className="text-xs text-muted-foreground">{R ? s.ar : s.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
