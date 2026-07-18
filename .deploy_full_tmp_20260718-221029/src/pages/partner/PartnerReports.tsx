import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PartnerLayout from "@/layouts/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileBarChart2, Download, RefreshCcw, DollarSign, ShoppingBag, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportData {
  period: string;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  brands: number;
  staff: number;
  conversionRate: number;
  rows: { date: string; orders: number; revenue: number }[];
}

export default function PartnerReports() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const since = new Date(Date.now() - Number(period) * 86400_000).toISOString();
      const [
        { data: orders },
        { count: brands },
        { count: staff },
      ] = await Promise.all([
        db.from("mp_orders").select("total_cents,status,created_at").eq("partner_user_id", user.id).gte("created_at", since),
        db.from("brands").select("*", { count: "exact", head: true }).eq("owner_id", user.id),
        db.from("user_profiles").select("*", { count: "exact", head: true }).eq("partner_user_id", user.id),
      ]);

      const list: any[] = orders ?? [];
      const completed = list.filter(o => o.status === "completed");
      const totalRevenue = completed.reduce((s, o) => s + (o.total_cents || 0), 0);

      // Group by date
      const dayMap = new Map<string, { orders: number; revenue: number }>();
      for (const o of list) {
        const d = new Date(o.created_at).toISOString().slice(0, 10);
        const prev = dayMap.get(d) || { orders: 0, revenue: 0 };
        dayMap.set(d, { orders: prev.orders + 1, revenue: prev.revenue + (o.status === "completed" ? (o.total_cents || 0) : 0) });
      }
      const rows = Array.from(dayMap.entries()).sort().map(([date, v]) => ({ date, ...v }));

      setReport({
        period, totalOrders: list.length, completedOrders: completed.length,
        totalRevenue, avgOrderValue: completed.length > 0 ? totalRevenue / completed.length : 0,
        brands: brands ?? 0, staff: staff ?? 0,
        conversionRate: list.length > 0 ? (completed.length / list.length) * 100 : 0,
        rows,
      });
    } catch (e: any) {
      toast.error(e.message ?? "Error loading report");
    }
    setLoading(false);
  }, [user, period]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    if (!report) return;
    const headers = R
      ? ["التاريخ", "الطلبات", "الإيرادات (USD)"]
      : ["Date", "Orders", "Revenue (USD)"];
    const rows = report.rows.map(r => [r.date, r.orders, (r.revenue / 100).toFixed(2)]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `partner-report-${report.period}d-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const summaryItems = report ? [
    { label: R ? "إجمالي الطلبات" : "Total Orders",       value: String(report.totalOrders),                icon: ShoppingBag, color: "text-indigo-400" },
    { label: R ? "الطلبات المكتملة": "Completed",          value: String(report.completedOrders),            icon: ShoppingBag, color: "text-green-400"  },
    { label: R ? "إجمالي الإيرادات": "Total Revenue",      value: `$${(report.totalRevenue / 100).toFixed(2)}`,icon: DollarSign, color: "text-green-400"  },
    { label: R ? "متوسط الطلب"     : "Avg. Order Value",   value: `$${(report.avgOrderValue / 100).toFixed(2)}`,icon: DollarSign, color: "text-blue-400"  },
    { label: R ? "العلامات التجارية": "Brands",             value: String(report.brands),                    icon: Building2,   color: "text-purple-400" },
    { label: R ? "الموظفون"        : "Staff",               value: String(report.staff),                     icon: Users,       color: "text-orange-400" },
  ] : [];

  return (
    <PartnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <FileBarChart2 className="w-6 h-6 text-indigo-400" />
              {R ? "التقارير" : "Reports"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "ملخص أداء بيئة عملك" : "Workspace performance summary"}</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{R ? "7 أيام" : "7 days"}</SelectItem>
                <SelectItem value="30">{R ? "30 يوم" : "30 days"}</SelectItem>
                <SelectItem value="90">{R ? "90 يوم" : "90 days"}</SelectItem>
                <SelectItem value="365">{R ? "سنة" : "1 year"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={!report || loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Download className="w-4 h-4" />{R ? "تصدير CSV" : "Export CSV"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {summaryItems.map(s => (
                <Card key={s.label} className="border-border/50">
                  <CardContent className="p-4 space-y-1.5">
                    <s.icon className={cn("w-5 h-5", s.color)} />
                    <div className={cn("text-2xl font-bold font-display", s.color)}>{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{R ? "تفاصيل يومية" : "Daily Breakdown"}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(report?.rows ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{R ? "لا توجد بيانات" : "No data"}</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                    <div className="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/10 sticky top-0">
                      <span>{R ? "التاريخ" : "Date"}</span>
                      <span className="text-center">{R ? "الطلبات" : "Orders"}</span>
                      <span className="text-right">{R ? "الإيرادات" : "Revenue"}</span>
                    </div>
                    {report!.rows.map(r => (
                      <div key={r.date} className="grid grid-cols-3 px-4 py-2.5 text-sm">
                        <span className="text-muted-foreground">{r.date}</span>
                        <span className="text-center">{r.orders}</span>
                        <span className="text-right text-green-400">${(r.revenue / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PartnerLayout>
  );
}
