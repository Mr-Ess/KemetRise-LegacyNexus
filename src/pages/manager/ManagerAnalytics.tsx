import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import ManagerLayout from "@/layouts/ManagerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, TrendingUp, Users, ShoppingBag, DollarSign,
  RefreshCcw, Star, CheckCircle, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ManagerAnalytics() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalOrders: 0, completedOrders: 0, pendingOrders: 0,
    revenue: 0, teamSize: 0, avgScore: 0,
    recentOrders: [] as any[],
    performances: [] as any[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: orders },
        { count: teamSize },
        { data: perfs },
      ] = await Promise.all([
        db.from("mp_orders").select("status,total_cents,created_at").order("created_at", { ascending: false }).limit(50),
        db.from("user_profiles").select("*", { count: "exact", head: true }).in("role", ["staff", "agent"]),
        db.from("hr_performance").select("score,review_period,employee_id").order("created_at", { ascending: false }).limit(10),
      ]);
      const completed = (orders || []).filter((o: any) => o.status === "completed");
      const pending = (orders || []).filter((o: any) => o.status === "pending");
      const revenue = completed.reduce((s: number, o: any) => s + (o.total_cents || 0), 0);
      const scores = (perfs || []).map((p: any) => p.score).filter(Boolean);
      const avgScore = scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
      setData({
        totalOrders: (orders || []).length,
        completedOrders: completed.length,
        pendingOrders: pending.length,
        revenue,
        teamSize: teamSize || 0,
        avgScore,
        recentOrders: (orders || []).slice(0, 8),
        performances: perfs || [],
      });
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = [
    { label: R ? "إجمالي الطلبات" : "Total Orders", value: data.totalOrders, icon: ShoppingBag, color: "text-blue-400" },
    { label: R ? "مكتملة" : "Completed", value: data.completedOrders, icon: CheckCircle, color: "text-green-400" },
    { label: R ? "معلقة" : "Pending", value: data.pendingOrders, icon: Clock, color: "text-yellow-400" },
    { label: R ? "الإيرادات" : "Revenue", value: `$${(data.revenue / 100).toFixed(0)}`, icon: DollarSign, color: "text-emerald-400" },
    { label: R ? "الفريق" : "Team Size", value: data.teamSize, icon: Users, color: "text-purple-400" },
    { label: R ? "متوسط الأداء" : "Avg Performance", value: `${data.avgScore.toFixed(1)}/10`, icon: Star, color: "text-orange-400" },
  ];

  const STATUS_COLOR: Record<string, string> = {
    completed: "text-green-400 bg-green-500/10 border-green-500/30",
    pending:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    cancelled: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <ManagerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              {R ? "التحليلات" : "Analytics"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "نظرة شاملة على أداء الفريق والأعمال" : "Overview of team & business performance"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="border-border/50 bg-card/50">
              <CardContent className="p-4 space-y-2">
                <s.icon className={cn("w-5 h-5", s.color)} />
                <div className={cn("text-2xl font-bold font-display", s.color)}>
                  {loading ? "—" : s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                {R ? "آخر الطلبات" : "Recent Orders"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}</div>
              ) : data.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{R ? "لا توجد طلبات" : "No orders"}</p>
              ) : (
                <div className="divide-y divide-border/50">
                  {data.recentOrders.map((o, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-mono">#{o.id?.slice(0,8) || "—"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">${((o.total_cents || 0) / 100).toFixed(2)}</span>
                        <Badge variant="outline" className={cn("text-xs", STATUS_COLOR[o.status] || "")}>
                          {o.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Scores */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                {R ? "تقييمات الأداء" : "Performance Reviews"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}</div>
              ) : data.performances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{R ? "لا توجد تقييمات" : "No performance reviews yet"}</p>
              ) : (
                <div className="divide-y divide-border/50">
                  {data.performances.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-medium">{p.employee_id?.slice(0,8) || "—"}</p>
                        <p className="text-xs text-muted-foreground">{p.review_period}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className={cn("text-sm font-bold", (p.score || 0) >= 7 ? "text-green-400" : (p.score || 0) >= 4 ? "text-yellow-400" : "text-red-400")}>
                          {p.score ?? "—"}/10
                        </span>
                      </div>
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
