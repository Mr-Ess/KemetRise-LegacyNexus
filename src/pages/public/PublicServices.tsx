import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Layers, Bot, Wallet, BarChart3, Users, Shield,
  Building2, Globe, Code2, Clock, CheckCircle,
  ArrowRight, Zap, Search, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICES = [
  {
    id: "erp", icon: BarChart3, color: "#D4A017", bg: "bg-primary/10", border: "border-primary/20",
    nameEn: "ERP & Finance", nameAr: "ERP والمالية",
    descEn: "Complete general ledger, tax compliance, journal entries, and real-time P&L reporting.", descAr: "دفتر أستاذ عام كامل، امتثال ضريبي، قيود يومية، وتقارير الربح والخسارة الفورية.",
    features_en: ["General Ledger", "Tax Compliance", "Journal Entries", "P&L Reports"],
    features_ar: ["دفتر الأستاذ", "الامتثال الضريبي", "القيود المحاسبية", "تقارير الربح والخسارة"],
    category: "business",
  },
  {
    id: "hr", icon: Users, color: "#8B5CF6", bg: "bg-violet-500/10", border: "border-violet-500/20",
    nameEn: "HR & Attendance", nameAr: "الموارد البشرية والحضور",
    descEn: "QR-based attendance, biometric sync, payroll, employee profiles, and leave management.", descAr: "حضور QR، مزامنة بيومترية، كشوف رواتب، ملفات موظفين، وإدارة الإجازات.",
    features_en: ["QR Attendance", "Biometric Sync", "Payroll", "Leave Management"],
    features_ar: ["حضور QR", "مزامنة بيومترية", "كشوف الرواتب", "إدارة الإجازات"],
    category: "business",
  },
  {
    id: "vendor", icon: Wallet, color: "#F97316", bg: "bg-orange-500/10", border: "border-orange-500/20",
    nameEn: "Vendor & Commerce", nameAr: "البائع والتجارة",
    descEn: "Full e-commerce suite with wallet, automatic fee deduction, payout requests, and SKU tracking.", descAr: "مجموعة تجارة إلكترونية كاملة مع محفظة، خصم رسوم تلقائي، طلبات دفع، وتتبع SKU.",
    features_en: ["Vendor Wallet", "Auto Fee Deduction", "Payout Requests", "SKU Tracking"],
    features_ar: ["محفظة البائع", "خصم رسوم تلقائي", "طلبات الدفع", "تتبع SKU"],
    category: "commerce",
  },
  {
    id: "marketing", icon: BarChart3, color: "#EC4899", bg: "bg-pink-500/10", border: "border-pink-500/20",
    nameEn: "Marketing & CRM", nameAr: "التسويق وإدارة العملاء",
    descEn: "Kanban lead pipeline, campaign manager, ROI analytics, and multi-channel support.", descAr: "خط عملاء Kanban، مدير حملات، تحليلات ROI، ودعم متعدد القنوات.",
    features_en: ["Lead Pipeline", "Campaign Manager", "ROI Analytics", "Multi-channel"],
    features_ar: ["خط العملاء", "مدير الحملات", "تحليلات ROI", "متعدد القنوات"],
    category: "marketing",
  },
  {
    id: "ai", icon: Bot, color: "#06B6D4", bg: "bg-cyan-500/10", border: "border-cyan-500/20",
    nameEn: "AI Chat Agents", nameAr: "وكلاء المحادثة الذكية",
    descEn: "GPT-4 powered brand-specific AI agents with session history, message rating, and streaming.", descAr: "وكلاء AI مدعومون بـGPT-4 مخصصون لكل براند مع تاريخ جلسات وتقييم رسائل وتدفق.",
    features_en: ["Brand-specific Agents", "Session History", "Message Rating", "Streaming"],
    features_ar: ["وكلاء مخصصون", "تاريخ الجلسات", "تقييم الرسائل", "تدفق فوري"],
    category: "tech",
  },
  {
    id: "partner", icon: Building2, color: "#6366F1", bg: "bg-indigo-500/10", border: "border-indigo-500/20",
    nameEn: "Partner Workspaces", nameAr: "بيئات عمل الشركاء",
    descEn: "Isolated multi-tenant workspaces with sector activation, team management, and revenue sharing.", descAr: "بيئات عمل معزولة متعددة المستأجرين مع تفعيل قطاعات، إدارة فريق، وتشارك إيرادات.",
    features_en: ["Isolated Workspace", "Sector Activation", "Team Management", "Revenue Sharing"],
    features_ar: ["بيئة معزولة", "تفعيل القطاعات", "إدارة الفريق", "تشارك الإيرادات"],
    category: "business",
  },
  {
    id: "agent", icon: Users, color: "#10B981", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
    nameEn: "Agent Network", nameAr: "شبكة الوكلاء",
    descEn: "Client tracking, commission management, status pipeline, and agent analytics dashboard.", descAr: "تتبع العملاء، إدارة العمولات، خط حالة، ولوحة تحليلات الوكيل.",
    features_en: ["Client Tracking", "Commission Mgmt", "Status Pipeline", "Analytics"],
    features_ar: ["تتبع العملاء", "إدارة العمولات", "خط الحالة", "التحليلات"],
    category: "sales",
  },
  {
    id: "security", icon: Shield, color: "#EF4444", bg: "bg-red-500/10", border: "border-red-500/20",
    nameEn: "Security & Compliance", nameAr: "الأمان والامتثال",
    descEn: "Row Level Security (RLS), multi-role auth, audit logs, IP whitelist, SSO, and 2FA.", descAr: "أمان على مستوى الصف (RLS)، توثيق متعدد الأدوار، سجلات التدقيق، القائمة البيضاء، SSO، و2FA.",
    features_en: ["Row Level Security", "Multi-role Auth", "Audit Logs", "SSO + 2FA"],
    features_ar: ["أمان RLS", "توثيق متعدد الأدوار", "سجلات التدقيق", "SSO + 2FA"],
    category: "tech",
  },
  {
    id: "sectors", icon: Layers, color: "#F59E0B", bg: "bg-yellow-500/10", border: "border-yellow-500/20",
    nameEn: "Dynamic Sectors", nameAr: "القطاعات الديناميكية",
    descEn: "Admin-controlled sector factory to activate/deactivate specialized industry modules instantly.", descAr: "مصنع قطاعات يتحكم به المشرف لتفعيل/تعطيل وحدات الصناعات المتخصصة فوراً.",
    features_en: ["Sector Factory", "Dynamic Activation", "Industry Modules", "Admin Control"],
    features_ar: ["مصنع القطاعات", "تفعيل ديناميكي", "وحدات الصناعات", "تحكم إداري"],
    category: "business",
  },
  {
    id: "api", icon: Code2, color: "#A855F7", bg: "bg-purple-500/10", border: "border-purple-500/20",
    nameEn: "Open APIs & Integrations", nameAr: "APIs مفتوحة وتكامل",
    descEn: "REST API, webhooks, Supabase edge functions, and biometric hardware sync endpoints.", descAr: "REST API، webhooks، وظائف Supabase edge، ونقاط نهاية مزامنة الأجهزة البيومترية.",
    features_en: ["REST API", "Webhooks", "Edge Functions", "Biometric Sync"],
    features_ar: ["REST API", "Webhooks", "وظائف Edge", "مزامنة بيومترية"],
    category: "tech",
  },
];

const CATEGORIES = [
  { id: "all",      en: "All Services",  ar: "كل الخدمات" },
  { id: "business", en: "Business",      ar: "الأعمال" },
  { id: "commerce", en: "Commerce",      ar: "التجارة" },
  { id: "marketing",en: "Marketing",     ar: "التسويق" },
  { id: "sales",    en: "Sales",         ar: "المبيعات" },
  { id: "tech",     en: "Technology",    ar: "التقنية" },
];

export default function PublicServices() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const R = i18n.language === "ar";
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  const filtered = SERVICES.filter(s =>
    (cat === "all" || s.category === cat) &&
    (search === "" ||
      (R ? s.nameAr : s.nameEn).toLowerCase().includes(search.toLowerCase()) ||
      (R ? s.descAr : s.descEn).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
            <Zap className="w-3.5 h-3.5" />{R ? "خدماتنا ووحداتنا" : "Our Services & Modules"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black mb-4">
            {R ? "10 خدمات متكاملة" : "10 Integrated Services"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {R ? "كل وحدة مصممة للعمل بشكل مستقل أو كجزء من النظام الموحد — حسب احتياجات عملك." : "Each module works standalone or as part of the unified system — based on your business needs."}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={R ? "ابحث عن خدمة..." : "Search services..."} className="pl-9 text-xs h-9" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", cat === c.id ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground hover:text-foreground border border-border/40")}>
                  {R ? c.ar : c.en}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(s => (
              <Card key={s.id} className={cn("border hover:-translate-y-1 transition-all duration-300 group overflow-hidden", s.border)}>
                <CardContent className="p-0">
                  <div className={cn("p-5 border-b border-border/30", s.bg)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-background border border-border/40 flex items-center justify-center">
                        <s.icon className="w-6 h-6" style={{ color: s.color }} />
                      </div>
                      <Badge className="text-[9px] px-2 capitalize" style={{ color: s.color, borderColor: s.color + "40", backgroundColor: s.color + "15" }}>
                        {s.category}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold mb-2">{R ? s.nameAr : s.nameEn}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{R ? s.descAr : s.descEn}</p>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(R ? s.features_ar : s.features_en).map(f => (
                        <div key={f} className="flex items-center gap-1.5 text-[10px]">
                          <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              {R ? "لا توجد خدمات تطابق بحثك" : "No services match your search"}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary/10 border-t border-border/30">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-black mb-4">{R ? "جاهز للبدء؟" : "Ready to Start?"}</h2>
          <p className="text-muted-foreground mb-8">{R ? "احصل على وصول فوري لجميع الوحدات بعد إنشاء حسابك." : "Get instant access to all modules after creating your account."}</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth?tab=signup")} className="gap-2 gold-glow">
              {R ? "ابدأ مجاناً" : "Start Free"} <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="gap-2">
              {R ? "تواصل مع المبيعات" : "Contact Sales"}
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
