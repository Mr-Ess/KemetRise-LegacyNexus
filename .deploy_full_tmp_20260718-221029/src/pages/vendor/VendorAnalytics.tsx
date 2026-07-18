import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import VendorLayout from "@/layouts/VendorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, DollarSign, ShoppingBag, Package, TrendingUp, RefreshCcw, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Order = { total_cents: number; status: string; created_at: string };

function groupByMonth(orders: Order[]) {
  const map = new Map<string, { revenue: number; count: number }>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const k = o.created_at.slice(0, 7);
    const prev = map.get(k) || { revenue: 0, count: 0 };
    map.set(k, { revenue: prev.revenue + (o.total_cents || 0), count: prev.count + 1 });
  }
  return Array.from(map.entries()).sort().map(([label, v]) => ({ label, ...v }));
}

export default function VendorAnalytics() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [period, setPeriod] = useState("90");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ products: 0, totalRevenue: 0, totalOrders: 0, completedOrders: 0, avgOrder: 0, convRate: 0 });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const since = new Date(Date.now() - Number(period) * 86400_000).toISOString();
    const [{ data: ord }, { count: products }] = await Promise.all([
      db.from("mp_orders").select("total_cents,status,created_at").eq("seller_user_id", user.id).gte("created_at", since),
      db.from("public_products").select("*", { count: "exact", head: true }).eq("vendor_user_id", user.id),
    ]);
    const list: Order[] = ord ?? [];
    const completed = list.filter(o => o.status === "completed" || o.status === "paid");
    const revenue = completed.reduce((s, o) => s + (o.total_cents || 0), 0);
    setOrders(list);
    setStats({ products: products ?? 0, totalRevenue: revenue, totalOrders: list.length, completedOrders: completed.length, avgOrder: completed.length > 0 ? revenue / completed.length : 0, convRate: list.length > 0 ? (completed.length / list.length) * 100 : 0 });
    setLoading(false);
  }, [user, period]);

  useEffect(() => { load(); }, [load]);

  const monthly = groupByMonth(orders);
  const maxRev = monthly.length > 0 ? Math.max(...monthly.map(m => m.revenue)) : 1;

  const kpis = [
    { label: R ? "المنتجات" : "Products",         value: stats.products,                              icon: Package,    color: "text-indigo-400" },
    { label: R ? "الطلبات" : "Total Orders",       value: stats.totalOrders,                           icon: ShoppingBag,color: "text-orange-400" },
    { label: R ? "مكتملة" : "Completed",           value: stats.completedOrders,                       icon: TrendingUp, color: "text-green-400"  },
    { label: R ? "الإيرادات" : "Revenue",          value: `$${(stats.totalRevenue / 100).toFixed(2)}`, icon: DollarSign, color: "text-emerald-400"},
    { label: R ? "متوسط الطلب" : "Avg Order",      value: `$${(stats.avgOrder / 100).toFixed(2)}`,     icon: BarChart3,  color: "text-blue-400"   },
    { label: R ? "معدل الإتمام" : "Completion %",  value: `${stats.convRate.toFixed(1)}%`,             icon: Users,      color: "text-purple-400" },
  ];

  return (
    <VendorLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-orange-400" />
              {R ? "التحليلات" : "Analytics"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "أداء متجرك" : "Your store performance"}</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">{R ? "30 يوم" : "30 days"}</SelectItem>
                <SelectItem value="90">{R ? "90 يوم" : "90 days"}</SelectItem>
                <SelectItem value="180">{R ? "6 أشهر" : "6 months"}</SelectItem>
                <SelectItem value="365">{R ? "سنة" : "1 year"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map(k => (
            <Card key={k.label} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <k.icon className={cn("w-5 h-5", k.color)} />
                <div className={cn("text-2xl font-bold font-display", k.color)}>{loading ? "—" : k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "الإيرادات الشهرية" : "Monthly Revenue"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 bg-muted/20 rounded animate-pulse" />
            ) : monthly.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">{R ? "لا توجد بيانات" : "No data"}</p>
            ) : (
              <div className="space-y-3">
                {monthly.map(m => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-semibold text-orange-400">${(m.revenue / 100).toFixed(2)} <span className="text-muted-foreground font-normal">({m.count} {R ? "طلب" : "orders"})</span></span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all" style={{ width: `${(m.revenue / maxRev) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
