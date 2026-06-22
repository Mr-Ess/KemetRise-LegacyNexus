import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import VendorLayout from "@/layouts/VendorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCcw, CreditCard, DollarSign, Clock, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type CompletedOrder = { total_cents: number; created_at: string };

function groupByWeek(orders: CompletedOrder[]) {
  const map = new Map<string, number>();
  for (const o of orders) {
    const d = new Date(o.created_at);
    const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
    const k = weekStart.toISOString().slice(0, 10);
    map.set(k, (map.get(k) || 0) + (o.total_cents || 0));
  }
  return Array.from(map.entries()).sort().slice(-8).map(([label, revenue]) => ({ label, revenue }));
}

export default function VendorSettlement() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const since = new Date(Date.now() - Number(period) * 86400_000).toISOString();
    const [{ data: w }, { data: ord }, { data: sett }] = await Promise.all([
      db.from("vendor_wallets").select("*").eq("user_id", user.id).maybeSingle(),
      db.from("mp_orders").select("total_cents,created_at").eq("seller_user_id", user.id).in("status", ["completed","paid"]).gte("created_at", since),
      db.from("vendor_settlements").select("*").eq("vendor_user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setWallet(w);
    setOrders(ord ?? []);
    setSettlements(sett ?? []);
    setLoading(false);
  }, [user, period]);

  useEffect(() => { load(); }, [load]);

  const grossRevenue   = orders.reduce((s, o) => s + (o.total_cents || 0), 0);
  const platformFee    = Math.round(grossRevenue * (wallet?.fee_rate ?? 0.05));
  const netSettlement  = grossRevenue - platformFee;
  const weeks          = groupByWeek(orders);
  const maxWeek        = weeks.length > 0 ? Math.max(...weeks.map(w => w.revenue)) : 1;

  const exportCSV = () => {
    const headers = [R ? "الأسبوع" : "Week", R ? "الإيرادات الإجمالية" : "Gross Revenue", R ? "رسوم المنصة" : "Platform Fee", R ? "الصافي" : "Net"];
    const rows = weeks.map(w => [w.label, `$${(w.revenue / 100).toFixed(2)}`, `$${(w.revenue * 0.05 / 100).toFixed(2)}`, `$${(w.revenue * 0.95 / 100).toFixed(2)}`]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `settlement-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <VendorLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-orange-400" />
              {R ? "سجل التسوية" : "Settlement"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "تسوية مدفوعاتك مع المنصة" : "Your payment settlement with the platform"}</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">{R ? "30 يوم" : "30 days"}</SelectItem>
                <SelectItem value="90">{R ? "90 يوم" : "90 days"}</SelectItem>
                <SelectItem value="180">{R ? "6 أشهر" : "6 months"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={!orders.length} className="gap-2 bg-orange-600 hover:bg-orange-700">
              <Download className="w-4 h-4" />{R ? "تصدير" : "Export"}
            </Button>
          </div>
        </div>

        {/* Wallet card */}
        {wallet && (
          <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-transparent">
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: R ? "الرصيد المتاح" : "Available",  value: `$${((wallet.balance_cents || 0) / 100).toFixed(2)}`,      color: "text-green-400"  },
                  { label: R ? "معلق"           : "Pending",    value: `$${((wallet.pending_cents || 0) / 100).toFixed(2)}`,       color: "text-yellow-400" },
                  { label: R ? "إجمالي المكاسب" : "Total Earned",value: `$${((wallet.total_earned_cents || 0) / 100).toFixed(2)}`, color: "text-orange-400" },
                  { label: R ? "الرسوم المدفوعة": "Total Fees",  value: `$${((wallet.total_fees_cents || 0) / 100).toFixed(2)}`,   color: "text-red-400"    },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={cn("text-xl font-bold font-display", s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settlement summary for period */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: R ? "الإيرادات الإجمالية" : "Gross Revenue",  value: `$${(grossRevenue / 100).toFixed(2)}`,   icon: DollarSign, color: "text-orange-400" },
            { label: R ? "رسوم المنصة (5%)"    : "Platform Fee (5%)",value: `$${(platformFee / 100).toFixed(2)}`,  icon: CreditCard, color: "text-red-400"    },
            { label: R ? "الصافي للدفع"        : "Net Settlement",  value: `$${(netSettlement / 100).toFixed(2)}`, icon: TrendingUp, color: "text-green-400"  },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-5 flex items-center gap-3">
                <s.icon className={cn("w-8 h-8", s.color)} />
                <div>
                  <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly breakdown */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              {R ? "التسوية الأسبوعية" : "Weekly Breakdown"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-40 bg-muted/20 rounded animate-pulse" />
            ) : weeks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{R ? "لا توجد بيانات" : "No data"}</p>
            ) : (
              <div className="space-y-3">
                {weeks.map(w => (
                  <div key={w.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{R ? "أسبوع" : "Week"} {w.label}</span>
                      <span className="font-semibold text-orange-400">${(w.revenue / 100).toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all" style={{ width: `${(w.revenue / maxWeek) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlement history */}
        {settlements.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{R ? "سجل التحويلات" : "Settlement History"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {settlements.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</span>
                    <Badge variant="outline" className={cn("text-xs", s.status === "completed" ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30")}>{s.status}</Badge>
                    <span className="font-semibold text-green-400">${((s.amount_cents || 0) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </VendorLayout>
  );
}
