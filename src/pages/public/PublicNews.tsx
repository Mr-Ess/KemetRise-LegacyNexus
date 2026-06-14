import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Newspaper, Calendar, Search, Tag, Clock, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Data ────────────────────────────────────────────────────────────── */
type Article = {
  id: string; slug: string; icon: string; color: string;
  category: string; categoryAr: string;
  title: string; titleAr: string;
  excerpt: string; excerptAr: string;
  author: string; authorAr: string;
  date: string; readMin: number;
  tags: string[]; featured?: boolean;
};

const ARTICLES: Article[] = [
  {
    id: "a1", slug: "kemetrise-erp-2026", icon: "🚀", color: "primary", featured: true,
    category: "Product Update", categoryAr: "تحديث المنتج",
    title: "KemetRise 2026 Legacy Nexus Edition — What's New",
    titleAr: "إصدار KemetRise 2026 Legacy Nexus — ما الجديد",
    excerpt: "We just shipped the biggest update in KemetRise history — 8 portals, AI agents, Digital Mall and a full ERP suite all unified in one platform.",
    excerptAr: "أطلقنا للتو أكبر تحديث في تاريخ KemetRise — 8 بوابات ووكلاء AI والمول الرقمي ومجموعة ERP كاملة في منصة واحدة.",
    author: "KemetRise Team", authorAr: "فريق KemetRise",
    date: "2026-06-01", readMin: 5, tags: ["ERP", "AI", "Platform", "Update"],
  },
  {
    id: "a2", slug: "ai-agents-business", icon: "🤖", color: "cyan",
    category: "AI & Technology", categoryAr: "الذكاء الاصطناعي والتقنية",
    title: "How AI Agents Are Transforming Business Operations in the Middle East",
    titleAr: "كيف يحوّل وكلاء الذكاء الاصطناعي عمليات الأعمال في الشرق الأوسط",
    excerpt: "From ANUBIS answering customer queries to HORUS managing logistics — AI agents are no longer the future, they're today's competitive advantage.",
    excerptAr: "من أنوبيس الذي يجيب على استفسارات العملاء إلى حورس الذي يدير اللوجستيات — وكلاء AI ليسوا مستقبلاً بعد الآن، بل ميزة تنافسية اليوم.",
    author: "Mohamed Al-Rashid", authorAr: "محمد الراشد",
    date: "2026-05-20", readMin: 7, tags: ["AI", "Agents", "Operations"],
  },
  {
    id: "a3", slug: "digital-mall-launch", icon: "🏬", color: "amber",
    category: "Company News", categoryAr: "أخبار الشركة",
    title: "KemetRise Digital Mall is Now Live — Open Your Store Today",
    titleAr: "مول KemetRise الرقمي متاح الآن — افتح متجرك اليوم",
    excerpt: "The Digital Mall brings together physical stores, digital products, virtual goods, services and subscriptions under one roof — and it's open for business.",
    excerptAr: "يجمع المول الرقمي المتاجر الفعلية والمنتجات الرقمية والسلع الافتراضية والخدمات والاشتراكات تحت سقف واحد — وهو مفتوح للأعمال.",
    author: "Sara El-Morsi", authorAr: "سارة المرسي",
    date: "2026-05-10", readMin: 4, tags: ["Mall", "Digital", "Launch"],
  },
  {
    id: "a4", slug: "erp-hospitality-sector", icon: "🏨", color: "orange",
    category: "Industry Insights", categoryAr: "رؤى الصناعة",
    title: "5 Ways ERP is Revolutionising Hospitality Management in Egypt",
    titleAr: "5 طرق يُحدث فيها ERP ثورة في إدارة الضيافة في مصر",
    excerpt: "Egypt's booming tourism sector demands smarter hotel management. Here's how modern ERP systems are eliminating waste and boosting guest satisfaction.",
    excerptAr: "يتطلب قطاع السياحة المتنامي في مصر إدارة فندقية أذكى. إليك كيف تُزيل أنظمة ERP الحديثة الهدر وتعزز رضا الضيوف.",
    author: "Ahmed Khalil", authorAr: "أحمد خليل",
    date: "2026-04-28", readMin: 6, tags: ["ERP", "Hospitality", "Egypt"],
  },
  {
    id: "a5", slug: "partner-program-2026", icon: "🤝", color: "indigo",
    category: "Partnership", categoryAr: "شراكة",
    title: "Introducing the KemetRise Partner Program 2026 — Up to 30% Commission",
    titleAr: "برنامج شركاء KemetRise 2026 — حتى 30% عمولة",
    excerpt: "We're expanding our reseller and technology partner network across MENA. Join today and earn recurring commissions on every client you bring.",
    excerptAr: "نحن نوسع شبكة إعادة البيع والشركاء التقنيين عبر منطقة MENA. انضم اليوم واكسب عمولات متكررة على كل عميل تجلبه.",
    author: "KemetRise Partnerships", authorAr: "شراكات KemetRise",
    date: "2026-04-15", readMin: 3, tags: ["Partners", "Commission", "MENA"],
  },
  {
    id: "a6", slug: "qr-attendance-hr", icon: "📱", color: "emerald",
    category: "Feature Spotlight", categoryAr: "إبراز الميزات",
    title: "QR-Based Attendance: How 500+ Companies Eliminated Paper Timesheets",
    titleAr: "الحضور بـ QR: كيف تخلصت أكثر من 500 شركة من جداول الوقت الورقية",
    excerpt: "Our QR biometric attendance module integrates directly with payroll — zero manual entry, instant verification, complete audit trail.",
    excerptAr: "وحدة حضور QR البيومتري تتكامل مباشرة مع الرواتب — صفر إدخال يدوي، تحقق فوري، مسار تدقيق كامل.",
    author: "Nour Hassan", authorAr: "نور حسن",
    date: "2026-03-30", readMin: 5, tags: ["HR", "Attendance", "Payroll", "QR"],
  },
];

const CATS = ["All", "Product Update", "AI & Technology", "Company News", "Industry Insights", "Partnership", "Feature Spotlight"];
const CATS_AR: Record<string, string> = {
  "All": "الكل", "Product Update": "تحديث المنتج", "AI & Technology": "ذكاء اصطناعي وتقنية",
  "Company News": "أخبار الشركة", "Industry Insights": "رؤى الصناعة",
  "Partnership": "شراكة", "Feature Spotlight": "إبراز الميزات",
};

const COLOR_CLS: Record<string, { badge: string; txt: string; border: string }> = {
  primary: { badge: "bg-primary/15 text-primary border-primary/30", txt: "text-primary", border: "border-primary/30" },
  cyan:    { badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", txt: "text-cyan-400", border: "border-cyan-500/30" },
  amber:   { badge: "bg-amber-500/15 text-amber-400 border-amber-500/30", txt: "text-amber-400", border: "border-amber-500/30" },
  orange:  { badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", txt: "text-orange-400", border: "border-orange-500/30" },
  indigo:  { badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", txt: "text-indigo-400", border: "border-indigo-500/30" },
  emerald: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", txt: "text-emerald-400", border: "border-emerald-500/30" },
};

function formatDate(d: string, ar: boolean) {
  const dt = new Date(d);
  return dt.toLocaleDateString(ar ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function PublicNews() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const R = i18n.language === "ar";
  const [activeCat, setActiveCat] = useState("All");
  const [query, setQuery] = useState("");

  const featured = ARTICLES.find((a) => a.featured);
  const rest = ARTICLES.filter((a) => !a.featured);

  const filtered = rest.filter((a) => {
    const matchCat = activeCat === "All" || a.category === activeCat;
    const q = query.toLowerCase();
    const matchQ = !q || a.title.toLowerCase().includes(q) || a.titleAr.includes(q) || a.excerpt.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 gap-2 px-4 py-1.5 text-xs">
            <Newspaper className="w-3.5 h-3.5" />
            {R ? "آخر أخبارنا" : "Latest News"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black mb-4">
            {R ? "أخبار وتحديثات KemetRise" : "KemetRise News & Updates"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm mb-8">
            {R ? "آخر التحديثات، ورؤى الصناعة، وقصص النجاح من عالم KemetRise." : "Latest updates, industry insights, and success stories from the KemetRise world."}
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-10 bg-secondary/20" placeholder={R ? "ابحث في الأخبار..." : "Search news..."} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* ── Featured Article ──────────────────────────────────────── */}
        {featured && !query && activeCat === "All" && (
          <div className="mb-12">
            <Card className="group relative flex flex-col md:flex-row gap-0 overflow-hidden border border-primary/25 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-xl transition-all">
              {/* Icon panel */}
              <div className="md:w-48 shrink-0 h-40 md:h-auto flex items-center justify-center bg-gradient-to-br from-primary/20 to-amber-500/10 border-b md:border-b-0 md:border-r border-primary/20">
                <span className="text-7xl">{featured.icon}</span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] px-2 py-0">
                    ⭐ {R ? "مميز" : "Featured"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-2 py-0">{R ? featured.categoryAr : featured.category}</Badge>
                </div>
                <h2 className="text-xl font-display font-black mb-2 leading-snug group-hover:text-primary transition-colors">
                  {R ? featured.titleAr : featured.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed line-clamp-3">
                  {R ? featured.excerptAr : featured.excerpt}
                </p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{R ? featured.authorAr : featured.author}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(featured.date, R)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.readMin} {R ? "دقائق" : "min read"}</span>
                  </div>
                  <Button size="sm" className="gap-1.5 text-xs h-7">
                    {R ? "اقرأ المزيد" : "Read More"} <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── Category Filter ────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {CATS.map((c) => (
            <button key={c} onClick={() => setActiveCat(c)}
              className={cn("px-3 py-1 rounded-full border text-xs font-medium transition-all",
                activeCat === c ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
              {R ? CATS_AR[c] : c}
            </button>
          ))}
        </div>

        {/* ── Articles Grid ──────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{R ? "لا توجد مقالات تطابق بحثك." : "No articles match your search."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a) => {
              const col = COLOR_CLS[a.color] || COLOR_CLS.primary;
              return (
                <Card key={a.id}
                  className={cn("group flex flex-col p-5 border hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer", col.border, "bg-gradient-to-b from-secondary/10 to-transparent")}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{a.icon}</span>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 ${col.badge}`}>{R ? a.categoryAr : a.category}</Badge>
                  </div>
                  <h3 className="font-bold text-sm mb-2 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {R ? a.titleAr : a.title}
                  </h3>
                  <p className="text-xs text-muted-foreground flex-1 mb-3 leading-relaxed line-clamp-3">
                    {R ? a.excerptAr : a.excerpt}
                  </p>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {a.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" />{t}
                      </span>
                    ))}
                  </div>
                  <div className="border-t border-border/30 pt-3 flex items-center justify-between">
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{formatDate(a.date, R)}</div>
                      <div className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{a.readMin} {R ? "دقائق" : "min"}</div>
                    </div>
                    <button className={cn("text-xs font-medium flex items-center gap-0.5 hover:underline", col.txt)}>
                      {R ? "اقرأ" : "Read"} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Newsletter CTA ─────────────────────────────────────────── */}
        <div className="mt-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-amber-500/5 p-8 text-center">
          <h2 className="text-xl font-display font-black mb-2">
            {R ? "ابق على اطلاع دائم" : "Stay in the Loop"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {R ? "اشترك في نشرتنا الإخبارية وكن أول من يعلم بآخر المستجدات." : "Subscribe to our newsletter and be the first to know about latest updates."}
          </p>
          <div className="flex items-center gap-2 max-w-sm mx-auto">
            <Input placeholder={R ? "بريدك الإلكتروني" : "your@email.com"} className="flex-1 text-sm" />
            <Button className="gap-1.5 whitespace-nowrap" onClick={() => navigate("/auth?tab=signup")}>
              {R ? "اشترك" : "Subscribe"} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
