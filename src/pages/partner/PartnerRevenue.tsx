import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PartnerLayout from "@/layouts/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingBag,
  RefreshCcw, Calendar, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Order = { total_cents: number; created_at: string; status: string };

function groupByMonth(orders: Order[]): { label: string; revenue: number; count: number }[] {
  const map = new Map<string, { revenue: number; count: number }>();
  for (const o of orders) {
    if (o.status !== "completed") continue;
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const prev = map.get(key) || { revenue: 0, count: 0 };
    map.set(key, { revenue: prev.revenue + (o.total_cents || 0), count: prev.count + 1 });
  }
  return Array.from(map.entries()).sort().map(([k, v]) => ({ label: k, ...v }));
}

export default function PartnerRevenue() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [period, setPeriod] = useState("90");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const since = new Date(Date.now() - Number(period) * 86400_000).toISOString();
    const { data } = await db.from("mp_orders").select("total_cents,created_at,status").eq("partner_user_id", user.id).gte("created_at", since).order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }, [user, period]);

  useEffect(() => { load(); }, [load]);

  const completed = orders.filter(o => o.status === "completed");
  const totalRevenue = completed.reduce((s, o) => s + (o.total_cents || 0), 0);
  const avgOrder = completed.length > 0 ? totalRevenue / completed.length : 0;
  const conversionRate = orders.length > 0 ? (completed.length / orders.length) * 100 : 0;
  const monthly = groupByMonth(orders);
  const maxRevenue = monthly.length > 0 ? Math.max(...monthly.map(m => m.revenue)) : 1;

  const stats = [
    { label: R ? "إجمالي الإيرادات" : "Total Revenue",     value: `$${(totalRevenue / 100).toFixed(2)}`,   icon: DollarSign, color: "text-green-400",   bg: "bg-green-500/10"  },
    { label: R ? "الطلبات المكتملة" : "Completed Orders",  value: String(completed.length),                icon: ShoppingBag,color: "text-indigo-400",  bg: "bg-indigo-500/10" },
    { label: R ? "متوسط الطلب"      : "Avg. Order Value",  value: `$${(avgOrder / 100).toFixed(2)}`,       icon: TrendingUp, color: "text-blue-400",    bg: "bg-blue-500/10"   },
    { label: R ? "معدل التحويل"     : "Conversion Rate",   value: `${conversionRate.toFixed(1)}%`,         icon: ArrowUpRight,color:"text-orange-400",  bg: "bg-orange-500/10" },
  ];

  return (
    <PartnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-indigo-400" />
              {R ? "الإيرادات" : "Revenue"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "تتبع أرباح بيئة عملك" : "Track your workspace earnings"}</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">{R ? "آخر 30 يوم" : "Last 30 days"}</SelectItem>
                <SelectItem value="90">{R ? "آخر 90 يوم" : "Last 90 days"}</SelectItem>
                <SelectItem value="180">{R ? "آخر 6 أشهر" : "Last 6 months"}</SelectItem>
                <SelectItem value="365">{R ? "آخر سنة" : "Last year"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-5 space-y-2">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              {R ? "الإيرادات الشهرية" : "Monthly Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 bg-muted/20 rounded-lg animate-pulse" />
            ) : monthly.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">{R ? "لا توجد بيانات كافية" : "Not enough data"}</p>
            ) : (
              <div className="space-y-3">
                {monthly.map(m => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-semibold text-green-400">${(m.revenue / 100).toFixed(2)} <span className="text-muted-foreground font-normal">({m.count} {R ? "طلب" : "orders"})</span></span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full transition-all"
                        style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "آخر المعاملات" : "Recent Transactions"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />)}</div>
            ) : (
              <div className="divide-y divide-border/50">
                {(completed.slice(0, 10)).map((o, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString(R ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                    <span className="text-sm font-semibold text-green-400">+${((o.total_cents || 0) / 100).toFixed(2)}</span>
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
