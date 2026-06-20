import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/context/UserRoleContext";
import ManagerLayout from "@/layouts/ManagerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, CheckSquare, BarChart3, TrendingUp, Clock,
  Activity, ArrowRight, CheckCircle2, AlertCircle,
  Calendar, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  teamSize: number;
  pendingTasks: number;
  completedTasks: number;
  teamPerformance: number;
}

export default function ManagerDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useRole();
  const db = supabase as any;
  const R = i18n.language === "ar";

  const [stats, setStats] = useState<Stats>({
    teamSize: 0,
    pendingTasks: 0,
    completedTasks: 0,
    teamPerformance: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [{ count: teamSize }, { data: orders }] = await Promise.all([
          db.from("user_profiles").select("*", { count: "exact", head: true }).eq("role", "staff"),
          db.from("mp_orders").select("status,created_at,total_cents").order("created_at", { ascending: false }).limit(5),
        ]);

        const completed = (orders || []).filter((o: any) => o.status === "completed").length;
        const pending = (orders || []).filter((o: any) => o.status === "pending").length;
        const performance = orders?.length ? Math.round((completed / orders.length) * 100) : 0;

        setStats({
          teamSize: teamSize || 0,
          pendingTasks: pending,
          completedTasks: completed,
          teamPerformance: performance,
        });
        setRecentActivity(orders || []);
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  const kpis = [
    {
      icon: Users,
      label: R ? "أعضاء الفريق" : "Team Members",
      value: stats.teamSize,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      path: "/manager/team",
    },
    {
      icon: CheckSquare,
      label: R ? "المهام المكتملة" : "Completed Tasks",
      value: stats.completedTasks,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      path: "/manager/tasks",
    },
    {
      icon: Clock,
      label: R ? "المهام المعلقة" : "Pending Tasks",
      value: stats.pendingTasks,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      path: "/manager/tasks",
    },
    {
      icon: TrendingUp,
      label: R ? "أداء الفريق" : "Team Performance",
      value: `${stats.teamPerformance}%`,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      path: "/manager/performance",
    },
  ];

  const quickActions = [
    { icon: Users,        label: R ? "إدارة الفريق"    : "Manage Team",      path: "/manager/team" },
    { icon: CheckSquare,  label: R ? "عرض المهام"       : "View Tasks",       path: "/manager/tasks" },
    { icon: Calendar,     label: R ? "الجداول الزمنية"  : "Schedules",        path: "/manager/schedules" },
    { icon: MessageSquare,label: R ? "الرسائل"          : "Messages",         path: "/manager/messages" },
    { icon: BarChart3,    label: R ? "التحليلات"        : "Analytics",        path: "/manager/analytics" },
    { icon: Activity,     label: R ? "تقرير الأداء"    : "Performance Report",path: "/manager/performance" },
  ];

  return (
    <ManagerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">
              {R
                ? `مرحباً، ${profile?.full_name || "المدير"}`
                : `Welcome, ${profile?.full_name || "Manager"}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {R ? "بوابة المديرين — إدارة الفريق والأداء" : "Manager Portal — Team & Performance Management"}
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/manager/team")} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Users className="w-3.5 h-3.5" />
            {R ? "إدارة الفريق" : "Manage Team"}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => (
            <Card
              key={k.label}
              className={cn("border cursor-pointer hover:scale-[1.02] transition-transform", k.bg)}
              onClick={() => navigate(k.path)}
            >
              <CardContent className="p-4">
                <k.icon className={cn("w-5 h-5 mb-2", k.color)} />
                <p className={cn("text-xl font-bold font-display", k.color)}>
                  {loading ? "—" : k.value}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Banner */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-300">
            {R
              ? "أنت تدير فريقك بالكامل من هنا — تتبع المهام والأداء والجداول الزمنية"
              : "Manage your entire team from here — track tasks, performance and schedules"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                {R ? "إجراءات سريعة" : "Quick Actions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map(a => (
                  <button
                    key={a.path}
                    onClick={() => navigate(a.path)}
                    className="flex items-center gap-2 p-3 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <a.icon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                {R ? "النشاط الأخير" : "Recent Activity"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-10 rounded-lg bg-secondary/30 animate-pulse" />
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  {R ? "لا يوجد نشاط حديث" : "No recent activity"}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/30">
                      <div className="flex items-center gap-2">
                        {item.status === "completed"
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          : <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />}
                        <span className="text-xs">{R ? "طلب" : "Order"} #{String(item.id || i + 1).slice(0, 8)}</span>
                      </div>
                      <Badge
                        className={cn(
                          "text-[9px] px-1.5",
                          item.status === "completed"
                            ? "bg-green-500/20 text-green-400 border-green-500/40"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                        )}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ManagerLayout>
  );
}
