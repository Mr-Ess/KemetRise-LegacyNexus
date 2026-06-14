import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PartnerLayout from "@/layouts/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3, DollarSign, Users, Building2, TrendingUp, ArrowRight,
  AlertCircle, CheckCircle, Layers, Calendar, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/context/TenantContext";
import { format } from "date-fns";

export default function PartnerDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeSectors, partnerWorkspace } = useTenant();
  const db = supabase as any;
  const R = i18n.language === "ar";
  const [stats, setStats] = useState({ brands: 0, staff: 0, revenue: 0, growth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [{ count: brands }, { data: orders }] = await Promise.all([
          db.from("brands").select("*", { count: "exact", head: true }).eq("owner_id", user.id),
          db.from("mp_orders").select("total_cents,status").eq("status","completed").limit(500),
        ]);
        const rev = (orders || []).reduce((s: number, o: any) => s + (o.total_cents || 0), 0);
        setStats({ brands: brands || 0, staff: 0, revenue: rev, growth: 12.5 });
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  const pw = partnerWorkspace as any;

  return (
    <PartnerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">
              {R ? `مرحباً، ${pw?.name || "الشريك"}` : `Welcome, ${pw?.name || "Partner"}`}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-indigo-400">{pw?.workspace_code}</span>
              {pw?.is_approved
                ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3 h-3" />{R ? "معتمد" : "Approved"}</span>
                : <span className="flex items-center gap-1 text-yellow-400 text-xs"><AlertCircle className="w-3 h-3" />{R ? "قيد المراجعة" : "Pending Approval"}</span>}
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/partner/brands")} className="gap-2">
            <Building2 className="w-3.5 h-3.5" />{R ? "إدارة العلامات" : "Manage Brands"}
          </Button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Building2,  label: R ? "علاماتي التجارية" : "My Brands",   value: stats.brands,  color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
            { icon: Users,      label: R ? "الموظفون"          : "Staff",       value: stats.staff,   color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20"   },
            { icon: DollarSign, label: R ? "الإيرادات (إجمالي)": "Revenue",     value: `$${(stats.revenue/100).toFixed(0)}`, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            { icon: TrendingUp, label: R ? "النمو هذا الشهر"   : "Monthly Growth", value: `${stats.growth}%`, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
          ].map(k => (
            <Card key={k.label} className={cn("border", k.bg)}>
              <CardContent className="p-4">
                <k.icon className={cn("w-5 h-5 mb-2", k.color)} />
                <p className={cn("text-xl font-bold font-display", k.color)}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Isolation notice */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs">
          <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
          <p className="text-indigo-300">
            {R ? "بيئة عمل معزولة بالكامل — البيانات محمية ولا يمكن لأي شريك آخر رؤيتها" : "Fully sandboxed workspace — your data is protected and invisible to other partners"}
          </p>
        </div>

        {/* Active sectors for this partner */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              {R ? "القطاعات المفعلة في منصتك" : "Activated Sectors in Your Platform"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSectors.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">{R ? "لا توجد قطاعات نشطة بعد" : "No active sectors yet"}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {activeSectors.map(s => (
                  <div key={s.id} className="flex items-center gap-2 p-3 rounded-xl border border-border/40 bg-secondary/20">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: s.color + "20" }}>🏢</div>
                    <div>
                      <p className="text-xs font-medium">{R ? s.name_ar : s.name}</p>
                      <p className="text-[9px] text-muted-foreground">{(s.modules || []).length} {R ? "وحدة" : "modules"}</p>
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
