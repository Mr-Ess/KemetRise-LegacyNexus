import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ExternalLink, Building2, Award, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Data ────────────────────────────────────────────────────────────── */
type CaseStudy = {
  id: string; icon: string; color: string; badge: string; badgeAr: string;
  sector: string; sectorAr: string;
  title: string; titleAr: string;
  client: string; clientAr: string;
  desc: string; descAr: string;
  result: string; resultAr: string;
  year: string;
  tags: string[];
};

const CASES: CaseStudy[] = [
  {
    id: "c1", icon: "🏥", color: "emerald", badge: "Healthcare", badgeAr: "رعاية صحية",
    sector: "Healthcare", sectorAr: "رعاية صحية",
    title: "Al-Nour Medical Center — Full ERP Rollout",
    titleAr: "مركز النور الطبي — نشر ERP كامل",
    client: "Al-Nour Medical Group", clientAr: "مجموعة النور الطبية",
    desc: "Deployed KemetRise ERP across 3 hospital branches covering HR, payroll, inventory, patient billing and QR-based attendance for 400+ staff.",
    descAr: "نشر KemetRise ERP عبر 3 فروع طبية يشمل HR، الرواتب، المخزون، فوترة المرضى والحضور بـ QR لأكثر من 400 موظف.",
    result: "40% reduction in administrative overhead, payroll processed in under 2 hours.",
    resultAr: "تخفيض 40% في الأعباء الإدارية ومعالجة الرواتب في أقل من ساعتين.",
    year: "2025", tags: ["ERP", "HR", "Healthcare", "QR Attendance"],
  },
  {
    id: "c2", icon: "🏨", color: "amber", badge: "Hospitality", badgeAr: "ضيافة",
    sector: "Hospitality", sectorAr: "ضيافة",
    title: "Grand Nile Resort — Digital Transformation",
    titleAr: "منتجع النيل الكبير — التحول الرقمي",
    client: "Grand Nile Hotels", clientAr: "فنادق النيل الكبير",
    desc: "Integrated POS, reservations, housekeeping, F&B inventory and guest CRM into a single KemetRise dashboard used across 5 properties.",
    descAr: "دمج نقطة البيع، الحجوزات، التدبير المنزلي، مخزون الأغذية ونظام CRM في لوحة KemetRise واحدة لـ5 فنادق.",
    result: "Guest satisfaction up 35%, inventory waste down 28%.",
    resultAr: "رضا النزلاء ارتفع 35% وهدر المخزون انخفض 28%.",
    year: "2025", tags: ["Hospitality", "POS", "CRM", "Inventory"],
  },
  {
    id: "c3", icon: "🛒", color: "violet", badge: "Retail", badgeAr: "تجزئة",
    sector: "Retail", sectorAr: "تجزئة",
    title: "MasrMart — Omnichannel Retail Platform",
    titleAr: "مصرمارت — منصة التجزئة متعددة القنوات",
    client: "MasrMart Egypt", clientAr: "مصرمارت مصر",
    desc: "Built a full omnichannel solution: online marketplace, in-store POS, mobile app sync, loyalty points, and automated replenishment.",
    descAr: "بناء حل متعدد القنوات: سوق إلكتروني، POS داخل المتجر، تزامن تطبيق الجوال، نقاط الولاء وإعادة التعبئة التلقائية.",
    result: "Online sales grew 180% in 6 months, shrinkage reduced by 22%.",
    resultAr: "نمو المبيعات الإلكترونية 180% في 6 أشهر وتراجع الانكماش بنسبة 22%.",
    year: "2025", tags: ["Retail", "Omnichannel", "POS", "Marketplace"],
  },
  {
    id: "c4", icon: "🎓", color: "blue", badge: "Education", badgeAr: "تعليم",
    sector: "Education", sectorAr: "تعليم",
    title: "FutureLearn Academy — LMS + ERP Integration",
    titleAr: "أكاديمية فيوتشر ليرن — دمج LMS + ERP",
    client: "FutureLearn Academy", clientAr: "أكاديمية فيوتشر ليرن",
    desc: "Connected LMS, student billing, instructor payroll, attendance tracking and certificate issuance in one unified system.",
    descAr: "ربط نظام التعلم، فوترة الطلاب، رواتب المدربين، تتبع الحضور وإصدار الشهادات في نظام موحد.",
    result: "Admin time cut by 60%; certificates issued automatically within minutes.",
    resultAr: "تقليص وقت الإدارة بنسبة 60% وإصدار الشهادات تلقائياً خلال دقائق.",
    year: "2026", tags: ["Education", "LMS", "HR", "Automation"],
  },
  {
    id: "c5", icon: "🏗️", color: "orange", badge: "Construction", badgeAr: "إنشاءات",
    sector: "Construction", sectorAr: "إنشاءات",
    title: "Delta Contracting — Project & Asset Management",
    titleAr: "دلتا للمقاولات — إدارة المشاريع والأصول",
    client: "Delta Contracting Co.", clientAr: "شركة دلتا للمقاولات",
    desc: "Deployed project tracking, subcontractor management, equipment asset ledger, and multi-site payroll for 1,200 workers across 8 active projects.",
    descAr: "نشر تتبع المشاريع، إدارة المقاولين من الباطن، سجل أصول المعدات، والرواتب متعددة المواقع لـ1200 عامل في 8 مشاريع.",
    result: "Project delivery on time improved from 51% to 83%.",
    resultAr: "تحسن تسليم المشاريع في الموعد من 51% إلى 83%.",
    year: "2026", tags: ["Construction", "Projects", "Assets", "Payroll"],
  },
  {
    id: "c6", icon: "🚚", color: "teal", badge: "Logistics", badgeAr: "لوجستيات",
    sector: "Logistics", sectorAr: "لوجستيات",
    title: "SpeedLine Logistics — Fleet & Dispatch ERP",
    titleAr: "سبيدلاين للشحن — ERP الأسطول والتوزيع",
    client: "SpeedLine Egypt", clientAr: "سبيدلاين مصر",
    desc: "Automated fleet dispatch, driver attendance, fuel tracking, customer billing and real-time delivery notifications.",
    descAr: "تشغيل توزيع الأسطول تلقائياً، حضور السائقين، تتبع الوقود، فوترة العملاء وإشعارات التسليم الفورية.",
    result: "On-time delivery rate jumped from 68% to 94%.",
    resultAr: "معدل التسليم في الوقت المحدد قفز من 68% إلى 94%.",
    year: "2026", tags: ["Logistics", "Fleet", "Automation", "CRM"],
  },
];

const SECTORS = ["All", "Healthcare", "Hospitality", "Retail", "Education", "Construction", "Logistics"];
const SECTOR_AR: Record<string, string> = { All: "الكل", Healthcare: "رعاية صحية", Hospitality: "ضيافة", Retail: "تجزئة", Education: "تعليم", Construction: "إنشاءات", Logistics: "لوجستيات" };

const PAL: Record<string, { border: string; bg: string; txt: string }> = {
  emerald: { border: "border-emerald-500/30", bg: "from-emerald-500/10 to-transparent", txt: "text-emerald-400" },
  amber:   { border: "border-amber-500/30",   bg: "from-amber-500/10 to-transparent",   txt: "text-amber-400"   },
  violet:  { border: "border-violet-500/30",  bg: "from-violet-500/10 to-transparent",  txt: "text-violet-400"  },
  blue:    { border: "border-blue-500/30",    bg: "from-blue-500/10 to-transparent",    txt: "text-blue-400"    },
  orange:  { border: "border-orange-500/30",  bg: "from-orange-500/10 to-transparent",  txt: "text-orange-400"  },
  teal:    { border: "border-teal-500/30",    bg: "from-teal-500/10 to-transparent",    txt: "text-teal-400"    },
};

const STATS = [
  { val: "50+", en: "Projects Delivered", ar: "مشروع منجز" },
  { val: "12",  en: "Industry Sectors",   ar: "قطاع صناعي"  },
  { val: "98%", en: "Client Retention",   ar: "معدل الاحتفاظ بالعملاء" },
  { val: "6",   en: "Countries Served",   ar: "دول تخدمها"  },
];

/* ─── Component ──────────────────────────────────────────────────────── */
export default function PublicPortfolio() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const R = i18n.language === "ar";
  const [activeSector, setActiveSector] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = activeSector === "All" ? CASES : CASES.filter((c) => c.sector === activeSector);

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 gap-2 px-4 py-1.5 text-xs">
            <Award className="w-3.5 h-3.5" />
            {R ? "أعمالنا السابقة" : "Our Portfolio"}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-black mb-4 leading-tight">
            {R ? "قصص النجاح الحقيقية" : "Real Success Stories"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base mb-10">
            {R ? "كيف حوّلت KemetRise عمليات شركات حقيقية في قطاعات متعددة." : "How KemetRise transformed operations for real businesses across multiple industries."}
          </p>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-border/30 bg-secondary/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.en}>
                <p className="text-3xl font-display font-black text-primary mb-1">{s.val}</p>
                <p className="text-xs text-muted-foreground">{R ? s.ar : s.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sector Filter ─────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 flex-wrap justify-center mb-10">
            {SECTORS.map((s) => (
              <button key={s} onClick={() => setActiveSector(s)}
                className={cn("px-4 py-1.5 rounded-full border text-xs font-medium transition-all",
                  activeSector === s ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
                {R ? SECTOR_AR[s] : s}
              </button>
            ))}
          </div>

          {/* ── Case Studies Grid ───────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c) => {
              const pal = PAL[c.color] || PAL.violet;
              const open = expanded === c.id;
              return (
                <Card key={c.id}
                  className={cn("group flex flex-col p-5 border transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl", pal.border, `bg-gradient-to-b ${pal.bg}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{c.icon}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0 ${pal.border} ${pal.txt}`}>{R ? c.badgeAr : c.badge}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Calendar className="w-3 h-3" />{c.year}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold mb-1 leading-snug">{R ? c.titleAr : c.title}</h3>
                  <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                    <Building2 className="w-3 h-3 shrink-0" />{R ? c.clientAr : c.client}
                  </p>
                  <p className="text-xs text-muted-foreground flex-1 mb-3 line-clamp-3 leading-relaxed">
                    {R ? c.descAr : c.desc}
                  </p>

                  {open && (
                    <div className="mb-3 p-3 rounded-xl bg-secondary/20 border border-border/40">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />{R ? "النتيجة" : "Result"}
                      </p>
                      <p className="text-xs text-emerald-400 font-medium">{R ? c.resultAr : c.result}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {c.tags.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground">{t}</span>
                    ))}
                  </div>

                  <button
                    onClick={() => setExpanded(open ? null : c.id)}
                    className={cn("text-xs font-medium flex items-center gap-1 transition-colors", pal.txt, "hover:underline")}>
                    {open ? (R ? "إخفاء التفاصيل" : "Hide Details") : (R ? "عرض النتائج" : "View Results")}
                    <ArrowRight className={cn("w-3 h-3 transition-transform", open && "rotate-90")} />
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-amber-500/5 p-10 text-center">
            <h2 className="text-3xl font-display font-black mb-3">
              {R ? "هل تريد قصة نجاحك هنا؟" : "Want Your Success Story Here?"}
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
              {R ? "تواصل معنا اليوم ودعنا نبني معاً الحل المثالي لعملك." : "Contact us today and let us build the perfect solution for your business together."}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 gold-glow">
                {R ? "تحدث معنا" : "Talk to Us"} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}>
                {R ? "عرض الأسعار" : "View Pricing"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
