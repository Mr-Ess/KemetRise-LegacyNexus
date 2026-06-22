import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MarketingLayout from "@/layouts/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, MousePointerClick, Users, DollarSign, Eye, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const PERIODS = [
  { v: "7",  ar: "آخر 7 أيام",   en: "Last 7 days"   },
  { v: "30", ar: "آخر 30 يوم",   en: "Last 30 days"  },
  { v: "90", ar: "آخر 90 يوم",   en: "Last 90 days"  },
];

export default function MarketingPerformance() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ impressions: 0, clicks: 0, conversions: 0, spend: 0, leads: 0, ctr: 0, cvr: 0, cpl: 0 });
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - Number(period) * 86400000).toISOString();
    const { data: cData } = await db.from("marketing_campaigns").select("*").gte("created_at", since).order("created_at", { ascending: false });
    const { data: lData } = await db.from("leads").select("id", { count: "exact", head: false }).gte("created_at", since);
    const list = cData ?? [];
    setCampaigns(list);
    const impressions = list.reduce((s: number, c: any) => s + (c.impressions || 0), 0);
    const clicks      = list.reduce((s: number, c: any) => s + (c.clicks || 0), 0);
    const conversions = list.reduce((s: number, c: any) => s + (c.conversions || 0), 0);
    const spend       = list.reduce((s: number, c: any) => s + (c.spent || 0), 0);
    const leads       = lData?.length ?? 0;
    setKpis({
      impressions, clicks, conversions, spend, leads,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cvr: clicks > 0 ? (conversions / clicks) * 100 : 0,
      cpl: leads > 0 && spend > 0 ? spend / leads : 0,
    });
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const kpiCards = [
    { icon: Eye,              label: R ? "الظهورات"    : "Impressions",     val: kpis.impressions.toLocaleString(), color: "text-pink-400"   },
    { icon: MousePointerClick,label: R ? "النقرات"     : "Clicks",          val: kpis.clicks.toLocaleString(),      color: "text-blue-400"   },
    { icon: TrendingUp,       label: R ? "التحويلات"   : "Conversions",     val: kpis.conversions.toLocaleString(), color: "text-green-400"  },
    { icon: DollarSign,       label: R ? "الإنفاق"     : "Total Spend",     val: `$${kpis.spend.toLocaleString()}`, color: "text-orange-400" },
    { icon: Users,            label: R ? "العملاء المحتملون" : "Leads",    val: kpis.leads.toLocaleString(),       color: "text-indigo-400" },
    { icon: TrendingUp,       label: R ? "نسبة النقر"  : "CTR",             val: `${kpis.ctr.toFixed(2)}%`,        color: "text-purple-400" },
    { icon: TrendingUp,       label: R ? "معدل التحويل": "CVR",             val: `${kpis.cvr.toFixed(2)}%`,        color: "text-teal-400"   },
    { icon: DollarSign,       label: R ? "تكلفة العميل": "Cost per Lead",   val: kpis.cpl > 0 ? `$${kpis.cpl.toFixed(2)}` : "—", color: "text-rose-400" },
  ];

  return (
    <MarketingLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-pink-400" />
              {R ? "الأداء التسويقي" : "Marketing Performance"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "مؤشرات الأداء الرئيسية" : "Key performance indicators"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map(p => <SelectItem key={p.v} value={p.v}>{R ? p.ar : p.en}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
              <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map(k => (
            <Card key={k.label} className="border-border/50 hover:border-pink-500/30 transition-colors">
              <CardContent className="p-4 space-y-2">
                <k.icon className={cn("w-5 h-5", k.color)} />
                <div className={cn("text-2xl font-bold font-display", k.color)}>{loading ? "—" : k.val}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "أداء الحملات" : "Campaign Performance"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}</div>
            ) : campaigns.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">{R ? "لا توجد حملات في هذه الفترة" : "No campaigns in this period"}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border/50 text-muted-foreground">{[R?"الحملة":"Campaign",R?"النوع":"Type",R?"الظهورات":"Impr.",R?"النقرات":"Clicks",R?"التحويلات":"Conv.",R?"الإنفاق":"Spend",R?"الحالة":"Status"].map(h=><th key={h} className="py-2 px-2 text-start font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {campaigns.map(c => (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 px-2 font-medium">{c.name}</td>
                        <td className="py-2 px-2 text-muted-foreground">{c.type || "—"}</td>
                        <td className="py-2 px-2">{(c.impressions||0).toLocaleString()}</td>
                        <td className="py-2 px-2">{(c.clicks||0).toLocaleString()}</td>
                        <td className="py-2 px-2">{(c.conversions||0).toLocaleString()}</td>
                        <td className="py-2 px-2">${(c.spent||0).toLocaleString()}</td>
                        <td className="py-2 px-2">
                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", c.status==="active"?"bg-green-500/15 text-green-400":c.status==="paused"?"bg-yellow-500/15 text-yellow-400":"bg-muted/50 text-muted-foreground")}>{c.status||"—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MarketingLayout>
  );
}
