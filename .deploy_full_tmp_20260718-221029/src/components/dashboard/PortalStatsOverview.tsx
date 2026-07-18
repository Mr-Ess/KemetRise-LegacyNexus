/**
 * PortalStatsOverview
 * Real-time cross-portal statistics card.
 * Pulls live data from every portal's key tables and shows a unified overview.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Briefcase, ShoppingBag, Store, Megaphone, Globe,
  TrendingUp, DollarSign, Package, ClipboardList, CalendarCheck,
  Star, Heart, HelpCircle, BarChart3, Zap, UserCheck, Mail,
  RefreshCcw, ExternalLink, Activity, Building2, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
interface PortalBlock {
  key: string;
  label: string;
  labelAr: string;
  path: string;
  icon: React.ComponentType<any>;
  accent: string;
  bg: string;
  border: string;
  stats: StatItem[];
}

interface StatItem {
  icon: React.ComponentType<any>;
  label: string;
  labelAr: string;
  value: number | string;
  sub?: string;
  subColor?: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PortalStatsOverview() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const navigate = useNavigate();
  const db = supabase as any;

  const [loading, setLoading] = useState(true);
  const [ts, setTs] = useState<string>("");
  const [portals, setPortals] = useState<PortalBlock[]>([]);

  const load = useCallback(async () => {
    setLoading(true);

    // ── Parallel queries ────────────────────────────────────────────────────
    const [
      // Users / HR
      { count: totalUsers },
      { count: staffCount },
      { count: managerCount },
      { count: agentCount },
      { count: vendorCount },
      { count: providerCount },
      { count: marketingCount },
      // Orders / Revenue
      { data: orders },
      { count: pendingOrdersCount },
      // Listings
      { count: listingsTotal },
      { count: listingsActive },
      // Leads / Marketing
      { count: leadsTotal },
      { count: leadsWon },
      { count: campaignsActive },
      { count: emailCampaigns },
      { count: automationRules },
      // Portal / User
      { count: wishlistItems },
      { count: supportOpen },
      // Agent
      { data: commissions },
      // HR / ERP
      { count: hrAttendance },
      { count: hrEmployees },
      { data: ledgerEntries },
      // Reviews
      { data: reviewsData },
      // Tasks
      { count: tasksOpen },
      { count: tasksCompleted },
    ] = await Promise.all([
      db.from("user_profiles").select("*", { count: "exact", head: true }),
      db.from("user_profiles").select("*", { count: "exact", head: true }).eq("role", "staff"),
      db.from("user_profiles").select("*", { count: "exact", head: true }).eq("role", "manager"),
      db.from("user_profiles").select("*", { count: "exact", head: true }).eq("role", "agent"),
      db.from("user_profiles").select("*", { count: "exact", head: true }).eq("role", "vendor"),
      db.from("user_profiles").select("*", { count: "exact", head: true }).eq("role", "provider"),
      db.from("user_profiles").select("*", { count: "exact", head: true }).eq("role", "marketing"),
      db.from("mp_orders").select("total_cents,status"),
      db.from("mp_orders").select("*", { count: "exact", head: true }).in("status", ["pending","processing"]),
      db.from("mp_listings").select("*", { count: "exact", head: true }),
      db.from("mp_listings").select("*", { count: "exact", head: true }).eq("is_active", true),
      db.from("marketing_leads").select("*", { count: "exact", head: true }),
      db.from("marketing_leads").select("*", { count: "exact", head: true }).eq("status", "won"),
      db.from("marketing_campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
      db.from("marketing_campaigns").select("*", { count: "exact", head: true }).eq("type", "email"),
      db.from("automations").select("*", { count: "exact", head: true }).eq("enabled", true),
      db.from("mp_wishlist").select("*", { count: "exact", head: true }),
      db.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open","in_progress"]),
      db.from("agent_commissions").select("amount,status"),
      db.from("hr_attendance").select("*", { count: "exact", head: true }),
      db.from("hr_employees").select("*", { count: "exact", head: true }),
      db.from("erp_ledger").select("amount").limit(500),
      db.from("mp_reviews").select("rating").limit(500),
      db.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open","in_progress"]).eq("category", "task"),
      db.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    ]);

    // ── Derived values ──────────────────────────────────────────────────────
    const allOrders     = orders ?? [];
    const totalRevenue  = allOrders.filter((o: any) => o.status === "completed").reduce((s: number, o: any) => s + (o.total_cents || 0), 0) / 100;
    const totalOrders   = allOrders.length;
    const pendingOrders = pendingOrdersCount ?? 0;

    const totalCommissions = (commissions ?? []).reduce((s: number, c: any) => s + (c.amount || 0), 0);
    const paidCommissions  = (commissions ?? []).filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + (c.amount || 0), 0);

    const ledgerTotal = (ledgerEntries ?? []).reduce((s: number, e: any) => s + Math.abs(e.amount || 0), 0);

    const reviewList  = reviewsData ?? [];
    const avgRating   = reviewList.length > 0 ? (reviewList.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviewList.length).toFixed(1) : "—";

    const cvrRate     = (leadsTotal ?? 0) > 0 ? (((leadsWon ?? 0) / (leadsTotal ?? 1)) * 100).toFixed(1) : "0";

    // ── Portal blocks ────────────────────────────────────────────────────────
    const blocks: PortalBlock[] = [
      // MANAGER
      {
        key: "manager", label: "Manager", labelAr: "المدراء",
        path: "/manager",
        icon: Briefcase,
        accent: "text-violet-400", bg: "bg-violet-500/5", border: "border-violet-500/20",
        stats: [
          { icon: Users,          label: "Managers",      labelAr: "عدد المدراء",        value: managerCount ?? 0 },
          { icon: ClipboardList,  label: "Open Tasks",    labelAr: "مهام مفتوحة",        value: tasksOpen ?? 0,      sub: `${tasksCompleted ?? 0} resolved`, subColor: "text-green-400" },
        ],
      },
      // STAFF
      {
        key: "staff", label: "Staff", labelAr: "الموظفون",
        path: "/staff",
        icon: UserCheck,
        accent: "text-teal-400", bg: "bg-teal-500/5", border: "border-teal-500/20",
        stats: [
          { icon: Users,        label: "Staff Members",  labelAr: "أعضاء الفريق",        value: staffCount ?? 0 },
          { icon: CalendarCheck,label: "Attendance Logs",labelAr: "سجلات الحضور",        value: hrAttendance ?? 0 },
        ],
      },
      // AGENT
      {
        key: "agent", label: "Agents", labelAr: "الوكلاء",
        path: "/agent",
        icon: Target,
        accent: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20",
        stats: [
          { icon: Users,       label: "Agents",          labelAr: "الوكلاء",             value: agentCount ?? 0 },
          { icon: DollarSign,  label: "Commissions",     labelAr: "العمولات",            value: `$${totalCommissions.toLocaleString()}`, sub: `$${paidCommissions.toLocaleString()} paid`, subColor: "text-green-400" },
        ],
      },
      // VENDOR
      {
        key: "vendor", label: "Vendors", labelAr: "البائعون",
        path: "/vendor",
        icon: ShoppingBag,
        accent: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-500/20",
        stats: [
          { icon: Users,       label: "Vendors",         labelAr: "البائعون",            value: vendorCount ?? 0 },
          { icon: Package,     label: "Active Listings", labelAr: "إدراجات نشطة",       value: listingsActive ?? 0, sub: `${listingsTotal ?? 0} total`, subColor: "text-muted-foreground" },
        ],
      },
      // PROVIDER
      {
        key: "provider", label: "Providers", labelAr: "المزودون",
        path: "/provider",
        icon: Store,
        accent: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20",
        stats: [
          { icon: Users,       label: "Providers",       labelAr: "المزودون",            value: providerCount ?? 0 },
          { icon: Star,        label: "Avg Rating",      labelAr: "متوسط التقييم",       value: avgRating, sub: `${reviewList.length} reviews`, subColor: "text-yellow-400" },
        ],
      },
      // MARKETING
      {
        key: "marketing", label: "Marketing", labelAr: "التسويق",
        path: "/marketing",
        icon: Megaphone,
        accent: "text-pink-400", bg: "bg-pink-500/5", border: "border-pink-500/20",
        stats: [
          { icon: Megaphone,   label: "Active Campaigns",labelAr: "حملات نشطة",          value: campaignsActive ?? 0 },
          { icon: Users,       label: "Leads",           labelAr: "عملاء محتملون",       value: leadsTotal ?? 0,  sub: `${cvrRate}% CVR`, subColor: "text-green-400" },
          { icon: Mail,        label: "Email Campaigns", labelAr: "حملات بريدية",        value: emailCampaigns ?? 0 },
          { icon: Zap,         label: "Automation Rules",labelAr: "قواعد آلية",          value: automationRules ?? 0 },
        ],
      },
      // PORTAL (USER)
      {
        key: "portal", label: "User Portal", labelAr: "بوابة المستخدم",
        path: "/portal",
        icon: Globe,
        accent: "text-indigo-400", bg: "bg-indigo-500/5", border: "border-indigo-500/20",
        stats: [
          { icon: ShoppingBag, label: "Total Orders",    labelAr: "إجمالي الطلبات",     value: totalOrders,  sub: `${pendingOrders} pending`, subColor: "text-yellow-400" },
          { icon: Heart,       label: "Wishlist Items",  labelAr: "عناصر المفضلة",      value: wishlistItems ?? 0 },
          { icon: HelpCircle,  label: "Open Tickets",    labelAr: "تذاكر مفتوحة",       value: supportOpen ?? 0 },
        ],
      },
      // ERP / HR
      {
        key: "erp", label: "ERP / HR", labelAr: "الموارد البشرية / المحاسبة",
        path: "/erp/hr",
        icon: Building2,
        accent: "text-rose-400", bg: "bg-rose-500/5", border: "border-rose-500/20",
        stats: [
          { icon: Users,       label: "Employees",       labelAr: "الموظفون",            value: hrEmployees ?? 0 },
          { icon: CalendarCheck,label:"Attendance Records",labelAr: "سجلات الحضور",     value: hrAttendance ?? 0 },
          { icon: BarChart3,   label: "Ledger Volume",   labelAr: "حجم الدفتر",         value: `$${ledgerTotal.toLocaleString()}` },
        ],
      },
      // REVENUE SUMMARY
      {
        key: "revenue", label: "Revenue Overview", labelAr: "الإيرادات الإجمالية",
        path: "/admin/finance",
        icon: DollarSign,
        accent: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/20",
        stats: [
          { icon: DollarSign,  label: "Total Revenue",   labelAr: "إجمالي الإيرادات",   value: `$${totalRevenue.toLocaleString("en", { minimumFractionDigits: 2 })}` },
          { icon: Package,     label: "Completed Orders",labelAr: "طلبات مكتملة",       value: allOrders.filter((o: any) => o.status === "completed").length },
          { icon: Activity,    label: "All Users",       labelAr: "جميع المستخدمين",    value: totalUsers ?? 0 },
        ],
      },
    ];

    setPortals(blocks);
    setTs(new Date().toLocaleTimeString(R ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds for live dashboard heartbeat
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {R ? "إحصائيات جميع البوابات — لحظية" : "All-Portal Live Statistics"}
          </CardTitle>
          {ts && <p className="text-[10px] text-muted-foreground mt-0.5">{R ? "آخر تحديث:" : "Last updated:"} {ts}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 h-7 text-xs">
          <RefreshCcw className={cn("w-3 h-3", loading && "animate-spin")} />
          {R ? "تحديث" : "Refresh"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} className="h-28 bg-muted/20 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {portals.map(p => (
              <div
                key={p.key}
                className={cn("rounded-xl border p-3 transition-all hover:scale-[1.01] cursor-pointer", p.bg, p.border)}
                onClick={() => navigate(p.path)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <p.icon className={cn("w-4 h-4", p.accent)} />
                    <span className={cn("text-xs font-bold", p.accent)}>{R ? p.labelAr : p.label}</span>
                  </div>
                  <ExternalLink className={cn("w-3 h-3 opacity-50", p.accent)} />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {p.stats.map((s, i) => (
                    <div key={i} className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <s.icon className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                        <span className="text-[9px] text-muted-foreground truncate">{R ? s.labelAr : s.label}</span>
                      </div>
                      <p className={cn("text-sm font-bold font-display truncate", p.accent)}>
                        {loading ? "…" : String(s.value)}
                      </p>
                      {s.sub && <p className={cn("text-[9px] truncate", s.subColor || "text-muted-foreground")}>{s.sub}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick-jump row */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground self-center">{R ? "وصول سريع:" : "Jump to:"}</span>
          {[
            { label: R ? "مدير" : "Manager",    path: "/manager",   color: "text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20"   },
            { label: R ? "موظف" : "Staff",      path: "/staff",     color: "text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20"           },
            { label: R ? "وكيل" : "Agent",      path: "/agent",     color: "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20"},
            { label: R ? "بائع" : "Vendor",     path: "/vendor",    color: "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20"   },
            { label: R ? "مزود" : "Provider",   path: "/provider",  color: "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"           },
            { label: R ? "تسويق" : "Marketing", path: "/marketing", color: "text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20"           },
            { label: R ? "بوابة" : "Portal",    path: "/portal",    color: "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20"   },
            { label: R ? "HR" : "ERP/HR",        path: "/erp/hr",    color: "text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20"           },
            { label: R ? "دفتر" : "Ledger",      path: "/erp/ledger",color: "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20"       },
          ].map(b => (
            <button key={b.path} onClick={() => navigate(b.path)}
              className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors", b.color)}>
              {b.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
