import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AgentLayout from "@/layouts/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Clock, CheckCircle, XCircle, RefreshCcw, TrendingUp, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  paid:     "text-green-400 bg-green-500/10 border-green-500/30",
  cancelled:"text-red-400 bg-red-500/10 border-red-500/30",
  processing:"text-blue-400 bg-blue-500/10 border-blue-500/30",
};
const STATUS_AR: Record<string, string> = { pending: "معلق", paid: "مدفوع", cancelled: "ملغي", processing: "قيد المعالجة" };

export default function AgentCommissions() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [period, setPeriod] = useState("90");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: ap } = await db.from("agent_profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(ap);
    if (ap) {
      const since = new Date(Date.now() - Number(period) * 86400_000).toISOString();
      let q = db.from("agent_commissions").select("*").eq("agent_id", ap.id).gte("created_at", since).order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q;
      setCommissions(data ?? []);
    }
    setLoading(false);
  }, [user, period, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const total     = commissions.reduce((s, c) => s + (c.amount_cents || 0), 0);
  const paid      = commissions.filter(c => c.status === "paid").reduce((s, c) => s + (c.amount_cents || 0), 0);
  const pending   = commissions.filter(c => c.status === "pending").reduce((s, c) => s + (c.amount_cents || 0), 0);

  return (
    <AgentLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              {R ? "عمولاتي" : "My Commissions"}
            </h1>
            {profile && <p className="text-xs text-muted-foreground mt-0.5">{R ? "نسبة العمولة" : "Commission rate"}: <span className="text-emerald-400">{profile.commission_rate ?? 0}%</span></p>}
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">{R ? "30 يوم" : "30 days"}</SelectItem>
                <SelectItem value="90">{R ? "90 يوم" : "90 days"}</SelectItem>
                <SelectItem value="365">{R ? "سنة" : "1 year"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder={R ? "الحالة" : "Status"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{R ? "الكل" : "All"}</SelectItem>
                {["pending", "paid", "processing", "cancelled"].map(s => <SelectItem key={s} value={s}>{R ? STATUS_AR[s] : s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: R ? "إجمالي العمولات" : "Total",    value: `$${(total / 100).toFixed(2)}`,   icon: TrendingUp,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: R ? "مدفوع"           : "Paid",      value: `$${(paid / 100).toFixed(2)}`,    icon: CheckCircle,  color: "text-green-400",   bg: "bg-green-500/10"   },
            { label: R ? "معلق"            : "Pending",   value: `$${(pending / 100).toFixed(2)}`, icon: Clock,        color: "text-yellow-400",  bg: "bg-yellow-500/10"  },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div>
                  <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "سجل العمولات" : "Commission History"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />)}</div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-12">
                <Banknote className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{R ? "لا توجد عمولات" : "No commissions found"}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/10 border-b border-border/50 sticky top-0">
                  <span>{R ? "التاريخ" : "Date"}</span>
                  <span>{R ? "المصدر" : "Source"}</span>
                  <span className="text-center">{R ? "الحالة" : "Status"}</span>
                  <span className="text-right">{R ? "المبلغ" : "Amount"}</span>
                </div>
                <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
                  {commissions.map(c => (
                    <div key={c.id} className="grid grid-cols-4 px-4 py-3 items-center text-sm">
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</span>
                      <span className="text-xs truncate">{c.source_type || "—"}</span>
                      <div className="flex justify-center">
                        <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLE[c.status] || "")}>{R ? STATUS_AR[c.status] : c.status}</Badge>
                      </div>
                      <span className={cn("text-right font-semibold", c.status === "paid" ? "text-green-400" : "text-yellow-400")}>
                        ${((c.amount_cents || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
}
