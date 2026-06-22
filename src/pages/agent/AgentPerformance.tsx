import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AgentLayout from "@/layouts/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, DollarSign, Star, RefreshCcw, Award, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgentPerformance() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalClients: 0, activeClients: 0, converted: 0,
    totalComm: 0, paidComm: 0, pendingComm: 0,
    conversionRate: 0, avgValue: 0,
  });
  const [monthly, setMonthly] = useState<{ label: string; clients: number; revenue: number }[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: ap } = await db.from("agent_profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(ap);
    if (ap) {
      const since = new Date(Date.now() - Number(period) * 86400_000).toISOString();
      const [{ data: clients }, { data: commissions }] = await Promise.all([
        db.from("agent_clients").select("status,estimated_value,created_at").eq("agent_id", ap.id).gte("created_at", since),
        db.from("agent_commissions").select("amount_cents,status,created_at").eq("agent_id", ap.id).gte("created_at", since),
      ]);
      const cl = clients || []; const cm = commissions || [];
      const converted = cl.filter((c: any) => c.status === "converted");
      const active    = cl.filter((c: any) => c.status === "active");
      const paid      = cm.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + c.amount_cents, 0);
      const pending   = cm.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + c.amount_cents, 0);
      const avgValue  = converted.length > 0 ? converted.reduce((s: number, c: any) => s + (c.estimated_value || 0), 0) / converted.length : 0;

      // group by month
      const map = new Map<string, { clients: number; revenue: number }>();
      for (const c of cl) {
        const k = c.created_at.slice(0, 7);
        const prev = map.get(k) || { clients: 0, revenue: 0 };
        map.set(k, { clients: prev.clients + 1, revenue: prev.revenue + (c.status === "converted" ? (c.estimated_value || 0) : 0) });
      }
      setMonthly(Array.from(map.entries()).sort().map(([label, v]) => ({ label, ...v })));
      setStats({ totalClients: cl.length, activeClients: active.length, converted: converted.length, totalComm: paid + pending, paidComm: paid, pendingComm: pending, conversionRate: cl.length > 0 ? (converted.length / cl.length) * 100 : 0, avgValue });
    }
    setLoading(false);
  }, [user, period]);

  useEffect(() => { load(); }, [load]);

  const kpis = [
    { label: R ? "إجمالي العملاء" : "Total Clients",    value: stats.totalClients,                    icon: Users,      color: "text-emerald-400" },
    { label: R ? "عملاء نشطون"   : "Active Clients",    value: stats.activeClients,                   icon: Activity,   color: "text-blue-400"   },
    { label: R ? "تحويلات"       : "Conversions",       value: stats.converted,                       icon: Star,       color: "text-yellow-400" },
    { label: R ? "معدل التحويل"  : "Conv. Rate",        value: `${stats.conversionRate.toFixed(1)}%`, icon: Target,     color: "text-indigo-400" },
    { label: R ? "عمولات مدفوعة" : "Paid Comm.",        value: `$${(stats.paidComm / 100).toFixed(0)}`,icon: DollarSign,color: "text-green-400"  },
    { label: R ? "عمولات معلقة"  : "Pending Comm.",     value: `$${(stats.pendingComm / 100).toFixed(0)}`,icon: DollarSign,color:"text-orange-400"},
  ];

  const maxClients = monthly.length > 0 ? Math.max(...monthly.map(m => m.clients)) : 1;

  return (
    <AgentLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              {R ? "أدائي" : "My Performance"}
            </h1>
            {profile && <p className="text-xs text-muted-foreground mt-0.5">{R ? "الوكيل" : "Agent"}: <span className="font-mono text-emerald-400">{profile.agent_code}</span> · {R ? "نسبة العمولة" : "Commission Rate"}: <span className="text-emerald-400">{profile.commission_rate ?? 0}%</span></p>}
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

        {/* Agent rank / level */}
        {profile && (
          <Card className="border-border/50 bg-gradient-to-r from-emerald-500/5 to-transparent">
            <CardContent className="p-5 flex items-center gap-4">
              <Award className="w-10 h-10 text-emerald-400" />
              <div>
                <p className="font-semibold">{R ? "مستوى الوكيل" : "Agent Level"}: <span className="text-emerald-400">{profile.status ?? "standard"}</span></p>
                <p className="text-sm text-muted-foreground">{R ? "إجمالي العملاء في كل الأوقات" : "All-time clients"}: <span className="font-semibold">{profile.total_clients ?? 0}</span></p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">{R ? "إجمالي العمولات" : "Total Commissions"}</p>
                <p className="text-xl font-bold text-emerald-400">${((profile.total_commissions ?? 0) / 100).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "العملاء الشهريون" : "Monthly Clients"}</CardTitle>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{R ? "لا توجد بيانات" : "No data"}</p>
            ) : (
              <div className="space-y-3">
                {monthly.map(m => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-semibold text-emerald-400">{m.clients} {R ? "عميل" : "clients"}</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all" style={{ width: `${(m.clients / maxClients) * 100}%` }} />
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
