import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, TrendingUp, DollarSign, Package, Building2,
  ShoppingBag, BarChart3, RefreshCcw, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  users: number; partners: number; vendors: number; agents: number;
  products: number; sectors: number; campaigns: number; leads: number;
};

const GROWTH = [
  { month: "Jan", val: 12 }, { month: "Feb", val: 19 }, { month: "Mar", val: 27 },
  { month: "Apr", val: 41 }, { month: "May", val: 58 }, { month: "Jun", val: 72 },
  { month: "Jul", val: 89 }, { month: "Aug", val: 110 }, { month: "Sep", val: 134 },
  { month: "Oct", val: 158 }, { month: "Nov", val: 181 }, { month: "Dec", val: 210 },
];

const ROLE_DIST = [
  { role: "user",      pct: 55, color: "bg-slate-400" },
  { role: "vendor",    pct: 18, color: "bg-yellow-400" },
  { role: "partner",   pct: 12, color: "bg-indigo-400" },
  { role: "agent",     pct: 10, color: "bg-emerald-400" },
  { role: "marketing", pct: 5,  color: "bg-pink-400" },
];

export default function AdminAnalytics() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;
  const [stats, setStats] = useState<Stats>({ users: 0, partners: 0, vendors: 0, agents: 0, products: 0, sectors: 0, campaigns: 0, leads: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [
      { count: users },
      { count: partners },
      { count: vendors },
      { count: agents },
      { count: products },
      { count: sectors },
      { count: campaigns },
      { count: leads },
    ] = await Promise.all([
      db.from("user_profiles").select("id", { count: "exact", head: true }),
      db.from("user_profiles").select("id", { count: "exact", head: true }).eq("role", "partner"),
      db.from("user_profiles").select("id", { count: "exact", head: true }).eq("role", "vendor"),
      db.from("agent_profiles").select("id", { count: "exact", head: true }),
      db.from("public_products").select("id", { count: "exact", head: true }),
      db.from("sectors").select("id", { count: "exact", head: true }),
      db.from("marketing_campaigns").select("id", { count: "exact", head: true }),
      db.from("marketing_leads").select("id", { count: "exact", head: true }),
    ]);
    setStats({ users: users ?? 0, partners: partners ?? 0, vendors: vendors ?? 0, agents: agents ?? 0, products: products ?? 0, sectors: sectors ?? 0, campaigns: campaigns ?? 0, leads: leads ?? 0 });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const maxGrowth = Math.max(...GROWTH.map(g => g.val));

  const KPI_CARDS = [
    { icon: Users,      label_en: "Total Users",    label_ar: "إجمالي المستخدمين",  val: stats.users,     color: "text-primary",   bg: "bg-primary/10" },
    { icon: Building2,  label_en: "Partners",       label_ar: "الشركاء",             val: stats.partners,  color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { icon: ShoppingBag,label_en: "Vendors",        label_ar: "البائعون",            val: stats.vendors,   color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { icon: Activity,   label_en: "Agents",         label_ar: "الوكلاء",             val: stats.agents,    color: "text-emerald-400",bg: "bg-emerald-500/10" },
    { icon: Package,    label_en: "Products",       label_ar: "المنتجات",            val: stats.products,  color: "text-orange-400", bg: "bg-orange-500/10" },
    { icon: BarChart3,  label_en: "Sectors",        label_ar: "القطاعات",            val: stats.sectors,   color: "text-cyan-400",   bg: "bg-cyan-500/10" },
    { icon: TrendingUp, label_en: "Campaigns",      label_ar: "الحملات",             val: stats.campaigns, color: "text-pink-400",   bg: "bg-pink-500/10" },
    { icon: Users,      label_en: "Leads",          label_ar: "العملاء المحتملون",   val: stats.leads,     color: "text-violet-400", bg: "bg-violet-500/10" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black">{R ? "تحليلات المنصة" : "Platform Analytics"}</h1>
            <p className="text-sm text-muted-foreground">{R ? "نظرة عامة على أداء المنصة" : "Platform-wide performance overview"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {KPI_CARDS.map(k => (
            <Card key={k.label_en} className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{R ? k.label_ar : k.label_en}</p>
                    <p className="text-2xl font-display font-black">{loading ? "—" : k.val.toLocaleString()}</p>
                  </div>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}>
                    <k.icon className={cn("w-5 h-5", k.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">{R ? "نمو المستخدمين" : "User Growth"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-36">
                {GROWTH.map(g => (
                  <div key={g.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-primary/30 hover:bg-primary/60 transition-all"
                      style={{ height: `${(g.val / maxGrowth) * 100}%`, minHeight: "4px" }}
                    />
                    <span className="text-[8px] text-muted-foreground">{g.month}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{R ? "* بيانات توضيحية" : "* Illustrative data"}</p>
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">{R ? "توزيع الأدوار" : "Role Distribution"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ROLE_DIST.map(r => (
                  <div key={r.role}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="capitalize font-medium">{r.role}</span>
                      <span className="text-muted-foreground">{r.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700", r.color)} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">{R ? "* بيانات توضيحية" : "* Illustrative data"}</p>
            </CardContent>
          </Card>

          {/* Revenue Projection */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">{R ? "توقعات الإيراد الشهري" : "Monthly Revenue Projection"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1.5 h-28">
                {[28, 35, 42, 51, 63, 78, 90, 105, 120, 140, 165, 195].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm hover:opacity-80 transition-all"
                      style={{
                        height: `${(v / 195) * 100}%`,
                        minHeight: "4px",
                        background: `hsl(42 85% ${35 + i * 2}%)`
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span>Jan</span><span>Dec</span>
              </div>
            </CardContent>
          </Card>

          {/* Sector Activity */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">{R ? "نشاط القطاعات" : "Sector Activity"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {[
                  { name_en: "Retail", name_ar: "التجزئة", pct: 82 },
                  { name_en: "Healthcare", name_ar: "الرعاية الصحية", pct: 67 },
                  { name_en: "Real Estate", name_ar: "العقارات", pct: 54 },
                  { name_en: "Technology", name_ar: "التقنية", pct: 91 },
                  { name_en: "Education", name_ar: "التعليم", pct: 45 },
                ].map(s => (
                  <div key={s.name_en}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-medium">{R ? s.name_ar : s.name_en}</span>
                      <span className="text-muted-foreground">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
