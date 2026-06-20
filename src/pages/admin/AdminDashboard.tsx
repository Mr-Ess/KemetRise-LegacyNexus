import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Building2, DollarSign, ShoppingBag, TrendingUp, Activity,
  Shield, BarChart3, Layers, UserCheck, ArrowUpRight, Eye, AlertTriangle,
  RefreshCw, Clock, CheckCircle, XCircle, Cpu, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AdminStats {
  totalUsers: number;
  totalPartners: number;
  totalVendors: number;
  totalAgents: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeOrders: number;
  systemHealth: "good" | "warning" | "critical";
}

export default function AdminDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const db = supabase as any;
  const R = i18n.language === "ar";
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, totalPartners: 0, totalVendors: 0, totalAgents: 0,
    totalRevenue: 0, pendingApprovals: 0, activeOrders: 0, systemHealth: "good",
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { count: totalUsers },
        { count: totalPartners },
        { count: totalVendors },
        { count: totalAgents },
        { data: orders },
        { data: requests },
        { data: recent },
      ] = await Promise.all([
        db.from("user_profiles").select("*", { count: "exact", head: true }),
        db.from("user_profiles").select("*", { count: "exact", head: true }).eq("role", "partner"),
        db.from("user_profiles").select("*", { count: "exact", head: true }).in("role", ["vendor","provider"]),
        db.from("user_profiles").select("*", { count: "exact", head: true }).eq("role", "agent"),
        db.from("mp_orders").select("total_cents,status").eq("status", "completed").limit(1000),
        db.from("business_upgrade_requests").select("id,requested_role,business_name,created_at,status").eq("status","pending").order("created_at",{ascending:false}).limit(5),
        db.from("user_profiles").select("id,full_name,role,created_at").order("created_at",{ascending:false}).limit(8),
      ]);
      const revenue = (orders || []).reduce((s: number, o: any) => s + (o.total_cents || 0), 0);
      const pendingCount = (requests || []).length;
      const health: "good" | "warning" | "critical" =
        pendingCount > 20 ? "critical" : pendingCount > 5 ? "warning" : "good";
      setStats({
        totalUsers: totalUsers || 0, totalPartners: totalPartners || 0,
        totalVendors: totalVendors || 0, totalAgents: totalAgents || 0,
        totalRevenue: revenue, pendingApprovals: pendingCount,
        activeOrders: (orders || []).length, systemHealth: health,
      });
      setPendingRequests(requests || []);
      setRecentUsers(recent || []);
    } catch { /* Graceful degradation */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const roleColors: Record<string, string> = {
    admin: "text-red-400 bg-red-500/10 border-red-500/30",
    superadmin: "text-red-500 bg-red-600/10 border-red-600/30",
    partner: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    vendor: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    provider: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    agent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    marketing: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    user: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  };

  const KPI = [
    { icon: Users,      label: R ? "إجمالي المستخدمين" : "Total Users",   value: stats.totalUsers,   color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    path: "/admin/users" },
    { icon: Building2,  label: R ? "الشركاء النشطون" : "Active Partners",  value: stats.totalPartners, color: "text-indigo-400",  bg: "bg-indigo-500/10 border-indigo-500/20", path: "/admin/partners" },
    { icon: ShoppingBag,label: R ? "البائعون" : "Vendors",                 value: stats.totalVendors, color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20", path: "/admin/vendors" },
    { icon: UserCheck,  label: R ? "الوكلاء" : "Agents",                  value: stats.totalAgents,  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",path: "/admin/agents" },
    { icon: DollarSign, label: R ? "إجمالي الإيرادات" : "Total Revenue",  value: `$${(stats.totalRevenue/100).toLocaleString("en",{minimumFractionDigits:2})}`, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", path: "/admin/finance" },
    { icon: AlertTriangle,label: R ? "طلبات معلقة" : "Pending Approvals", value: stats.pendingApprovals, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", path: "/admin/approvals" },
  ];

  const approveRequest = async (id: string) => {
    await db.from("business_upgrade_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", id);
    load();
  };
  const rejectRequest = async (id: string) => {
    await db.from("business_upgrade_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">{R ? "مركز القيادة العليا" : "Supreme Command Center"}</h1>
            <p className="text-sm text-muted-foreground">{R ? "نظرة شاملة على المنصة بالكامل" : "Full platform overview & controls"}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={load} className="gap-2"><RefreshCw className="w-3.5 h-3.5" />{R ? "تحديث" : "Refresh"}</Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/website")} className="gap-2"><Globe className="w-3.5 h-3.5" />{R ? "إدارة الموقع" : "Website CMS"}</Button>
            <Button size="sm" onClick={() => navigate("/admin/sectors")} className="gap-2"><Layers className="w-3.5 h-3.5" />{R ? "إدارة القطاعات" : "Sector Factory"}</Button>
          </div>
        </div>

        {/* System Health Bar */}
        <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-medium",
          stats.systemHealth === "good" ? "bg-green-500/5 border-green-500/20 text-green-400" :
          stats.systemHealth === "warning" ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-400" :
          "bg-red-500/5 border-red-500/20 text-red-400"
        )}>
          <Activity className="w-4 h-4 shrink-0" />
          <span>{R ? "حالة النظام:" : "System Status:"}</span>
          <span className="font-bold">{stats.systemHealth === "good" ? (R ? "جميع الأنظمة تعمل ✓" : "All Systems Operational ✓") : (R ? "تحذير" : "Warning")}</span>
          <span className="ml-auto text-muted-foreground">{format(new Date(), "dd MMM yyyy HH:mm")}</span>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {KPI.map(k => (
            <Card key={k.label} className={cn("border cursor-pointer hover:scale-105 transition-transform", k.bg)}
              onClick={() => navigate(k.path)}>
              <CardContent className="p-4">
                <k.icon className={cn("w-5 h-5 mb-2", k.color)} />
                <p className={cn("text-xl font-bold font-display", k.color)}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent users */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">{R ? "آخر المستخدمين المسجلين" : "Recently Registered Users"}</CardTitle>
              <button onClick={() => navigate("/admin/users")} className="text-xs text-primary hover:underline flex items-center gap-1">
                {R ? "عرض الكل" : "View All"} <ArrowUpRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                        {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <p className="text-xs font-medium">{u.full_name || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[8px] px-1.5 py-0 border", roleColors[u.role] || roleColors.user)}>{u.role?.toUpperCase()}</Badge>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        {format(new Date(u.created_at), "dd MMM")}
                      </span>
                    </div>
                  </div>
                ))}
                {recentUsers.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">{R ? "لا يوجد مستخدمون" : "No users yet"}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Pending approvals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                {R ? "طلبات الترقية المعلقة" : "Pending Upgrade Requests"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-8 h-8 text-green-400/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{R ? "لا توجد طلبات معلقة" : "No pending requests"}</p>
                </div>
              ) : pendingRequests.map(req => (
                <div key={req.id} className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2">
                  <div>
                    <p className="text-xs font-semibold">{req.business_name || "—"}</p>
                    <Badge className={cn("text-[8px] px-1.5 py-0 mt-1", roleColors[req.requested_role] || "text-foreground")}>
                      {req.requested_role?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveRequest(req.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-green-500/20 text-green-400 text-[10px] hover:bg-green-500/30 transition-colors">
                      <CheckCircle className="w-3 h-3" />{R ? "قبول" : "Approve"}
                    </button>
                    <button onClick={() => rejectRequest(req.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] hover:bg-red-500/30 transition-colors">
                      <XCircle className="w-3 h-3" />{R ? "رفض" : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick nav to all portals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "الوصول السريع إلى البوابات" : "Quick Portal Access"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: R ? "الشركاء"   : "Partners",  path: "/partner",   color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20",  icon: Building2  },
                { label: R ? "الوكلاء"   : "Agents",    path: "/agent",     color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20", icon: UserCheck  },
                { label: R ? "البائعون"  : "Vendors",   path: "/vendor",    color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20",   icon: ShoppingBag},
                { label: R ? "التسويق"   : "Marketing", path: "/marketing", color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/20",       icon: TrendingUp },
                { label: R ? "الدردشة"   : "AI Chat",   path: "/chat",      color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20",       icon: Cpu        },
                { label: R ? "الموارد البشرية" : "HR",  path: "/erp/hr",    color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",   icon: Users      },
                { label: R ? "المنتجات"  : "Marketplace",path: "/",         color: "text-primary",    bg: "bg-primary/10 border-primary/20",         icon: Eye        },
              ].map(p => (
                <button key={p.path} onClick={() => navigate(p.path)}
                  className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:scale-105", p.bg)}>
                  <p.icon className={cn("w-5 h-5", p.color)} />
                  <span className={cn("text-[10px] font-medium", p.color)}>{p.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
