import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PartnerLayout from "@/layouts/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3, DollarSign, Building2, Users, TrendingUp,
  ShoppingBag, CheckCircle, Clock, RefreshCcw, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PartnerAnalytics() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    brands: 0, staff: 0, revenue: 0, orders: 0,
    completedOrders: 0, pendingOrders: 0, growth: 0,
    recentOrders: [] as any[],
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const since = new Date(Date.now() - Number(period) * 86400_000).toISOString();
      const [
        { count: brands },
        { count: staff },
        { data: orders },
        { data: allOrders },
      ] = await Promise.all([
        db.from("brands").select("*", { count: "exact", head: true }).eq("owner_id", user.id),
        db.from("user_profiles").select("*", { count: "exact", head: true }).eq("partner_user_id", user.id),
        db.from("mp_orders").select("status,total_cents,created_at,id").eq("partner_user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(50),
        db.from("mp_orders").select("total_cents,status").eq("partner_user_id", user.id).eq("status", "completed").limit(500),
      ]);
      const completed = (orders || []).filter((o: any) => o.status === "completed");
      const pending   = (orders || []).filter((o: any) => o.status === "pending");
      const revenue   = (allOrders || []).reduce((s: number, o: any) => s + (o.total_cents || 0), 0);
      setData({
        brands: brands || 0, staff: staff || 0,
        revenue, orders: (orders || []).length,
        completedOrders: completed.length, pendingOrders: pending.length,
        growth: (orders || []).length > 0 ? Math.round((completed.length / (orders || []).length) * 100) : 0,
        recentOrders: (orders || []).slice(0, 8),
      });
    } catch {}
    setLoading(false);
  }, [user, period]);

  useEffect(() => { load(); }, [load]);

  const stats = [
    { label: R ? "العلامات التجارية" : "My Brands",      value: data.brands,                           icon: Building2,  color: "text-indigo-400" },
    { label: R ? "الموظفون"          : "Staff",           value: data.staff,                            icon: Users,      color: "text-blue-400"   },
    { label: R ? "الإيرادات"         : "Revenue",         value: `$${(data.revenue / 100).toFixed(0)}`, icon: DollarSign, color: "text-green-400"  },
    { label: R ? "الطلبات"           : "Orders",          value: data.orders,                           icon: ShoppingBag,color: "text-purple-400" },
    { label: R ? "مكتملة"            : "Completed",       value: data.completedOrders,                  icon: CheckCircle,color: "text-emerald-400"},
    { label: R ? "معدل الإتمام"      : "Completion Rate", value: `${data.growth}%`,                     icon: TrendingUp, color: "text-orange-400" },
  ];

  const STATUS_COLOR: Record<string, string> = {
    completed: "text-green-400 bg-green-500/10 border-green-500/30",
    pending:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    cancelled: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <PartnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              {R ? "التحليلات" : "Analytics"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "أداء بيئة عملك" : "Your workspace performance"}</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{R ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
                <SelectItem value="30">{R ? "آخر 30 يوم" : "Last 30 days"}</SelectItem>
                <SelectItem value="90">{R ? "آخر 90 يوم" : "Last 90 days"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <s.icon className={cn("w-5 h-5", s.color)} />
                <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              {R ? "آخر الطلبات" : "Recent Orders"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-11 bg-muted/30 rounded animate-pulse" />)}</div>
            ) : data.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{R ? "لا توجد طلبات في هذه الفترة" : "No orders in this period"}</p>
            ) : (
              <div className="divide-y divide-border/50">
                {data.recentOrders.map((o, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-mono">#{o.id?.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">${((o.total_cents || 0) / 100).toFixed(2)}</span>
                      <Badge variant="outline" className={cn("text-xs", STATUS_COLOR[o.status] || "")}>{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
