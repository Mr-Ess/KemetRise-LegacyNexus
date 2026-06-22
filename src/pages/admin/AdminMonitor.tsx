import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, Users, ShoppingBag, DollarSign, Cpu, RefreshCw,
  CheckCircle, AlertTriangle, XCircle, Clock, Globe, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveStat {
  label: string;
  labelAr: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}

interface RecentEvent {
  type: string;
  message: string;
  time: string;
  status: "ok" | "warn" | "error";
}

export default function AdminMonitor() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [stats, setStats] = useState<LiveStat[]>([]);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [health, setHealth] = useState<"good" | "warning" | "critical">("good");
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [
        { count: totalUsers },
        { count: onlineUsers },
        { count: pendingOrders },
        { count: totalOrders },
        { data: recentOrders },
        { data: recentUsers },
        { count: pendingRequests },
      ] = await Promise.all([
        db.from("user_profiles").select("*", { count: "exact", head: true }),
        db.from("user_profiles").select("*", { count: "exact", head: true })
          .gte("updated_at", new Date(Date.now() - 15 * 60 * 1000).toISOString()),
        db.from("mp_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        db.from("mp_orders").select("*", { count: "exact", head: true }),
        db.from("mp_orders").select("id,status,total_cents,created_at").order("created_at", { ascending: false }).limit(5),
        db.from("user_profiles").select("id,full_name,role,created_at").order("created_at", { ascending: false }).limit(5),
        db.from("business_upgrade_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const healthStatus: "good" | "warning" | "critical" =
        (pendingRequests || 0) > 20 ? "critical"
        : (pendingRequests || 0) > 5 ? "warning"
        : "good";

      setHealth(healthStatus);
      setStats([
        { label: "Total Users", labelAr: "إجمالي المستخدمين", value: totalUsers ?? 0, icon: Users, color: "text-blue-400" },
        { label: "Active (15min)", labelAr: "نشط (15 دقيقة)", value: onlineUsers ?? 0, icon: Globe, color: "text-green-400" },
        { label: "Pending Orders", labelAr: "طلبات معلقة", value: pendingOrders ?? 0, icon: ShoppingBag, color: "text-yellow-400" },
        { label: "Total Orders", labelAr: "إجمالي الطلبات", value: totalOrders ?? 0, icon: DollarSign, color: "text-purple-400" },
        { label: "Pending Requests", labelAr: "طلبات ترقية", value: pendingRequests ?? 0, icon: AlertTriangle, color: "text-orange-400" },
        { label: "System Health", labelAr: "صحة النظام", value: healthStatus === "good" ? (R ? "جيد" : "Good") : healthStatus === "warning" ? (R ? "تحذير" : "Warning") : (R ? "حرج" : "Critical"), icon: Cpu, color: healthStatus === "good" ? "text-green-400" : healthStatus === "warning" ? "text-yellow-400" : "text-red-400" },
      ]);

      // Build event feed
      const evs: RecentEvent[] = [];
      (recentOrders ?? []).forEach((o: any) => {
        evs.push({
          type: "order",
          message: `${R ? "طلب جديد" : "New order"} #${o.id?.slice(0, 8)} — ${((o.total_cents ?? 0) / 100).toFixed(2)} USD`,
          time: new Date(o.created_at).toLocaleTimeString(R ? "ar-EG" : "en-US"),
          status: o.status === "completed" ? "ok" : o.status === "cancelled" ? "error" : "warn",
        });
      });
      (recentUsers ?? []).forEach((u: any) => {
        evs.push({
          type: "user",
          message: `${R ? "مستخدم جديد" : "New user"}: ${u.full_name || "—"} (${u.role || "user"})`,
          time: new Date(u.created_at).toLocaleTimeString(R ? "ar-EG" : "en-US"),
          status: "ok",
        });
      });
      evs.sort(() => Math.random() - 0.5); // shuffle for feed feel
      setEvents(evs.slice(0, 10));
      setLastRefresh(new Date());
    } catch {
      // graceful
    } finally {
      setLoading(false);
    }
  }, [R]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const healthColor = health === "good" ? "text-green-400 bg-green-500/10 border-green-500/30"
    : health === "warning" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
    : "text-red-400 bg-red-500/10 border-red-500/30";

  const HealthIcon = health === "good" ? CheckCircle : health === "warning" ? AlertTriangle : XCircle;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              {R ? "المراقبة الآنية" : "Live Monitor"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {R ? "آخر تحديث:" : "Last refresh:"}{" "}
              {lastRefresh.toLocaleTimeString(R ? "ar-EG" : "en-US")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("border gap-1.5", healthColor)}>
              <HealthIcon className="w-3 h-3" />
              {health === "good" ? (R ? "النظام جيد" : "System OK")
                : health === "warning" ? (R ? "تحذير" : "Warning")
                : (R ? "حالة حرجة" : "Critical")}
            </Badge>
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              {R ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border/50 bg-card/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <s.icon className={cn("w-4 h-4", s.color)} />
                  <Zap className="w-3 h-3 text-muted-foreground/40 animate-pulse" />
                </div>
                <div className="text-2xl font-bold font-display">{s.value}</div>
                <div className="text-xs text-muted-foreground">{R ? s.labelAr : s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Event Feed */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {R ? "سجل الأحداث الآني" : "Live Event Feed"}
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {R ? "مباشر" : "Live"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {R ? "لا توجد أحداث حديثة" : "No recent events"}
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className={cn("mt-0.5 w-2 h-2 rounded-full shrink-0",
                      ev.status === "ok" ? "bg-green-500" : ev.status === "warn" ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    <span className="text-sm flex-1">{ev.message}</span>
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {ev.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-refresh notice */}
        <p className="text-xs text-muted-foreground text-center">
          {R ? "يتم التحديث تلقائياً كل 30 ثانية" : "Auto-refreshes every 30 seconds"}
        </p>
      </div>
    </AdminLayout>
  );
}
