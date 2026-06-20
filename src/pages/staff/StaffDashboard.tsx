import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/context/UserRoleContext";
import StaffLayout from "@/layouts/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckSquare, Calendar, Clock, MessageSquare,
  Activity, ArrowRight, CheckCircle2, AlertCircle,
  User, Star, Bell, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  myTasks: number;
  completedToday: number;
  hoursLogged: number;
  performance: number;
}

export default function StaffDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useRole();
  const db = supabase as any;
  const R = i18n.language === "ar";

  const [stats, setStats] = useState<Stats>({
    myTasks: 0,
    completedToday: 0,
    hoursLogged: 0,
    performance: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: orders } = await db
          .from("mp_orders")
          .select("status,created_at,total_cents,id")
          .order("created_at", { ascending: false })
          .limit(5);

        const allOrders = orders || [];
        const completedToday = allOrders.filter((o: any) => {
          return o.status === "completed" && new Date(o.created_at) >= today;
        }).length;

        setStats({
          myTasks: allOrders.length,
          completedToday,
          hoursLogged: 8,
          performance: allOrders.length ? Math.round((completedToday / Math.max(allOrders.length, 1)) * 100) : 0,
        });
        setRecentActivity(allOrders);
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  const kpis = [
    {
      icon: CheckSquare,
      label: R ? "مهامي" : "My Tasks",
      value: stats.myTasks,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
      path: "/staff/tasks",
    },
    {
      icon: CheckCircle2,
      label: R ? "مكتملة اليوم" : "Completed Today",
      value: stats.completedToday,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
      path: "/staff/tasks",
    },
    {
      icon: Clock,
      label: R ? "ساعات العمل" : "Hours Logged",
      value: `${stats.hoursLogged}h`,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      path: "/staff/attendance",
    },
    {
      icon: TrendingUp,
      label: R ? "الأداء" : "Performance",
      value: `${stats.performance}%`,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
      path: "/staff/profile",
    },
  ];

  const quickActions = [
    { icon: CheckSquare,   label: R ? "مهامي"          : "My Tasks",        path: "/staff/tasks" },
    { icon: Calendar,      label: R ? "جدولي"           : "My Schedule",     path: "/staff/schedule" },
    { icon: Clock,         label: R ? "تسجيل الحضور"   : "Log Attendance",  path: "/staff/attendance" },
    { icon: MessageSquare, label: R ? "الرسائل"         : "Messages",        path: "/staff/messages" },
    { icon: Bell,          label: R ? "الإشعارات"       : "Notifications",   path: "/staff/notifications" },
    { icon: User,          label: R ? "ملفي الشخصي"    : "My Profile",      path: "/staff/profile" },
  ];

  return (
    <StaffLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">
              {R
                ? `مرحباً، ${profile?.full_name || "الموظف"}`
                : `Welcome, ${profile?.full_name || "Staff Member"}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {R ? "بوابة الموظفين — مهامك وجدولك اليومي" : "Staff Portal — Your tasks and daily schedule"}
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/staff/tasks")} className="gap-2 bg-violet-600 hover:bg-violet-700">
            <CheckSquare className="w-3.5 h-3.5" />
            {R ? "عرض المهام" : "View Tasks"}
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
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/20 text-xs">
          <Star className="w-4 h-4 text-violet-400 shrink-0" />
          <p className="text-violet-300">
            {R
              ? "كل مهامك وجدولك ورسائلك في مكان واحد — ابدأ يومك من هنا"
              : "All your tasks, schedule and messages in one place — start your day from here"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-violet-400" />
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
                    <a.icon className="w-4 h-4 text-violet-400 shrink-0" />
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
                <Activity className="w-4 h-4 text-violet-400" />
                {R ? "النشاط الأخير" : "Recent Activity"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
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
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/30"
                    >
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
    </StaffLayout>
  );
}
