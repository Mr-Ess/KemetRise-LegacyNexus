import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AgentLayout from "@/layouts/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, TrendingUp, DollarSign, Users, RefreshCcw, CheckCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgentConversions() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [converted, setConverted] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, totalValue: 0, avgValue: 0 });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: ap } = await db.from("agent_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (ap) {
      const since = new Date(Date.now() - Number(period) * 86400_000).toISOString();
      const { data } = await db.from("agent_clients").select("*").eq("agent_id", ap.id).eq("status", "converted").gte("updated_at", since).order("updated_at", { ascending: false });
      const list = data ?? [];
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const thisMonth = list.filter((c: any) => new Date(c.updated_at) >= monthStart).length;
      const totalValue = list.reduce((s: number, c: any) => s + (c.estimated_value || 0), 0);
      setConverted(list);
      setStats({ total: list.length, thisMonth, totalValue, avgValue: list.length > 0 ? totalValue / list.length : 0 });
    }
    setLoading(false);
  }, [user, period]);

  useEffect(() => { load(); }, [load]);

  return (
    <AgentLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Star className="w-6 h-6 text-emerald-400" />
              {R ? "ترقية العملاء" : "Conversions"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "العملاء الذين تم تحويلهم بنجاح" : "Successfully converted clients"}</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">{R ? "30 يوم" : "30 days"}</SelectItem>
                <SelectItem value="90">{R ? "90 يوم" : "90 days"}</SelectItem>
                <SelectItem value="365">{R ? "سنة" : "1 year"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: R ? "إجمالي التحويلات" : "Total Conversions",  value: stats.total,                         icon: Star,       color: "text-yellow-400" },
            { label: R ? "هذا الشهر"         : "This Month",         value: stats.thisMonth,                     icon: Calendar,   color: "text-emerald-400"},
            { label: R ? "إجمالي القيمة"      : "Total Value",        value: `$${stats.totalValue.toLocaleString()}`,icon: DollarSign,color: "text-green-400" },
            { label: R ? "متوسط قيمة العميل" : "Avg Client Value",   value: `$${Math.round(stats.avgValue).toLocaleString()}`,icon: TrendingUp,color:"text-blue-400"},
          ].map(s => (
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
              <Users className="w-4 h-4 text-emerald-400" />
              {R ? "قائمة التحويلات" : "Conversions List"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />)}</div>
            ) : converted.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{R ? "لا توجد تحويلات في هذه الفترة" : "No conversions in this period"}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {converted.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                        {c.client_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{c.client_name}</p>
                        <p className="text-xs text-muted-foreground">{c.client_company || c.client_email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.estimated_value && <span className="text-sm font-semibold text-emerald-400">${c.estimated_value.toLocaleString()}</span>}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="w-3 h-3" />{R ? "محوّل" : "Converted"}</div>
                        <p className="text-[10px] text-muted-foreground">{new Date(c.updated_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
}
