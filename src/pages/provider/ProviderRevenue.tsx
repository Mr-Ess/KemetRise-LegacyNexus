import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/context/UserRoleContext";
import ProviderLayout from "@/layouts/ProviderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCcw, DollarSign, TrendingUp, ShoppingBag, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type Order = { total_cents: number; created_at: string; status: string };

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

export default function ProviderRevenue() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { profile } = useRole();
  const db = supabase as any;

  const [period, setPeriod] = useState("90");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const since = new Date(Date.now() - Number(period) * 86400_000).toISOString();
    const { data: myListings } = await db.from("mp_listings").select("id").eq("publisher_user_id", profile.id);
    const listingIds = (myListings ?? []).map((l: any) => l.id);
    const { data: orderItems } = listingIds.length
      ? await db.from("mp_order_items").select("order_id").in("listing_id", listingIds)
      : { data: [] };
    const orderIds = [...new Set((orderItems ?? []).map((oi: any) => oi.order_id))];
    const { data } = orderIds.length
      ? await db.from("mp_orders").select("total_cents,created_at,status").in("id", orderIds).gte("created_at", since)
      : { data: [] };
    setOrders(data ?? []);
    setLoading(false);
  }, [profile, period]);

  useEffect(() => { load(); }, [load]);

  const completed = orders.filter(o => o.status === "completed" || o.status === "paid");
  const totalRevenue = completed.reduce((s, o) => s + (o.total_cents || 0), 0);
  const avgOrder = completed.length > 0 ? totalRevenue / completed.length : 0;
  const monthly = groupByMonth(orders);
  const maxRev = monthly.length > 0 ? Math.max(...monthly.map(m => m.revenue)) : 1;

  const exportCSV = () => {
    const headers = [R ? "التاريخ" : "Month", R ? "الطلبات" : "Orders", R ? "الإيرادات" : "Revenue"];
    const rows = monthly.map(m => [m.label, m.count, `$${(m.revenue / 100).toFixed(2)}`]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `revenue-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const stats = [
    { label: R ? "إجمالي الإيرادات" : "Total Revenue",   value: `$${(totalRevenue / 100).toFixed(2)}`,   icon: DollarSign, color: "text-green-400",  bg: "bg-green-500/10"  },
    { label: R ? "الطلبات المكتملة" : "Completed Orders", value: String(completed.length),                icon: ShoppingBag,color: "text-blue-400",   bg: "bg-blue-500/10"   },
    { label: R ? "متوسط الطلب"      : "Avg. Order",       value: `$${(avgOrder / 100).toFixed(2)}`,        icon: TrendingUp, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: R ? "إجمالي الطلبات"   : "Total Orders",     value: String(orders.length),                   icon: Calendar,   color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-blue-400" />
              {R ? "الإيرادات" : "Revenue"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "تتبع إيرادات نشاطك التجاري" : "Track your business revenue"}</p>
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
            <Button size="sm" onClick={exportCSV} disabled={!monthly.length} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4" />{R ? "تصدير" : "Export"}
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
            <CardTitle className="text-sm">{R ? "التوزيع الشهري" : "Monthly Breakdown"}</CardTitle>
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
                      <span className="font-semibold text-blue-400">${(m.revenue / 100).toFixed(2)} <span className="text-muted-foreground font-normal">({m.count} {R ? "طلب" : "orders"})</span></span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all" style={{ width: `${(m.revenue / maxRev) * 100}%` }} />
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
            <div className="divide-y divide-border/50 max-h-64 overflow-y-auto">
              {(loading ? [] : completed.slice(0, 10)).map((o, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</span>
                  <span className="text-sm font-semibold text-green-400">+${((o.total_cents || 0) / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProviderLayout>
  );
}
