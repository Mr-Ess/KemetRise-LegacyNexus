import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import MarketingLayout from "@/layouts/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, RefreshCcw, DollarSign, TrendingUp, Target, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const PERIODS = [
  { v: "30",  ar: "آخر 30 يوم",  en: "Last 30 days"  },
  { v: "90",  ar: "آخر 90 يوم",  en: "Last 90 days"  },
  { v: "180", ar: "آخر 6 أشهر",  en: "Last 6 months" },
  { v: "365", ar: "آخر سنة",     en: "Last year"     },
];

interface RoiRow {
  campaign: string;
  type: string;
  spend: number;
  revenue: number;
  roi: number;
  conversions: number;
}

export default function MarketingROI() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [period, setPeriod] = useState("90");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RoiRow[]>([]);
  const [totals, setTotals] = useState({ spend: 0, revenue: 0, roi: 0, conversions: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - Number(period) * 86400000).toISOString();
    const { data } = await db.from("marketing_campaigns").select("name,type,spent,revenue,conversions").gte("created_at", since);
    const list = (data ?? []).map((c: any) => {
      const spend   = c.spent    || 0;
      const revenue = c.revenue  || 0;
      const roi     = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
      return { campaign: c.name, type: c.type || "—", spend, revenue, roi, conversions: c.conversions || 0 } as RoiRow;
    });
    setRows(list);
    const tSpend   = list.reduce((s, r) => s + r.spend, 0);
    const tRevenue = list.reduce((s, r) => s + r.revenue, 0);
    setTotals({ spend: tSpend, revenue: tRevenue, roi: tSpend > 0 ? ((tRevenue - tSpend) / tSpend) * 100 : 0, conversions: list.reduce((s,r)=>s+r.conversions,0) });
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    if (!rows.length) return;
    const header = R ? ["الحملة","النوع","الإنفاق","الإيرادات","العائد %","التحويلات"] : ["Campaign","Type","Spend","Revenue","ROI %","Conversions"];
    const body = rows.map(r => [r.campaign, r.type, r.spend.toFixed(2), r.revenue.toFixed(2), r.roi.toFixed(2), r.conversions]);
    const csv  = [header, ...body].map(row => row.join(",")).join("\n");
    const url  = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "roi-report.csv"; a.click();
  };

  const roiColor = (roi: number) => roi > 50 ? "text-green-400" : roi > 0 ? "text-blue-400" : "text-red-400";

  return (
    <MarketingLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-pink-400" />
              {R ? "تقارير العائد على الاستثمار" : "ROI Reports"}
            </h1>
            <p className="text-sm text-muted-foreground">{rows.length} {R ? "حملة" : "campaigns"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map(p => <SelectItem key={p.v} value={p.v}>{R ? p.ar : p.en}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5"><Download className="w-3.5 h-3.5" />{R ? "تصدير" : "Export"}</Button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: R ? "إجمالي الإنفاق"    : "Total Spend",   val: `$${totals.spend.toLocaleString()}`,   color: "text-orange-400" },
            { icon: TrendingUp, label: R ? "إجمالي الإيرادات"  : "Total Revenue", val: `$${totals.revenue.toLocaleString()}`, color: "text-green-400"  },
            { icon: BarChart3,  label: R ? "العائد الإجمالي %"  : "Overall ROI",   val: `${totals.roi.toFixed(1)}%`,           color: roiColor(totals.roi) },
            { icon: Target,     label: R ? "التحويلات"          : "Conversions",   val: totals.conversions.toLocaleString(),   color: "text-pink-400"   },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <s.icon className={cn("w-5 h-5", s.color)} />
                <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "تفصيل الحملات" : "Campaign Breakdown"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}</div>
            ) : rows.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">{R ? "لا توجد بيانات في هذه الفترة" : "No data for this period"}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      {[R?"الحملة":"Campaign",R?"النوع":"Type",R?"الإنفاق":"Spend",R?"الإيرادات":"Revenue",R?"العائد":"ROI %",R?"التحويلات":"Conv."].map(h => (
                        <th key={h} className="py-2 px-2 text-start font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.sort((a,b) => b.roi - a.roi).map((r, i) => (
                      <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 px-2 font-medium max-w-[150px] truncate">{r.campaign}</td>
                        <td className="py-2 px-2 text-muted-foreground">{r.type}</td>
                        <td className="py-2 px-2 text-orange-400">${r.spend.toFixed(2)}</td>
                        <td className="py-2 px-2 text-green-400">${r.revenue.toFixed(2)}</td>
                        <td className={cn("py-2 px-2 font-semibold", roiColor(r.roi))}>{r.roi.toFixed(1)}%</td>
                        <td className="py-2 px-2">{r.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border/50 font-semibold bg-muted/10">
                      <td className="py-2 px-2" colSpan={2}>{R ? "الإجمالي" : "Total"}</td>
                      <td className="py-2 px-2 text-orange-400">${totals.spend.toFixed(2)}</td>
                      <td className="py-2 px-2 text-green-400">${totals.revenue.toFixed(2)}</td>
                      <td className={cn("py-2 px-2", roiColor(totals.roi))}>{totals.roi.toFixed(1)}%</td>
                      <td className="py-2 px-2">{totals.conversions}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MarketingLayout>
  );
}
