import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AgentLayout from "@/layouts/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, ChevronRight, Users, CheckCircle, Clock, RefreshCcw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ONBOARDING_STEPS = ["onboarding", "active", "qualified", "converted"];
const STEP_LABELS_AR: Record<string, string> = { onboarding: "تأهيل", active: "نشط", qualified: "مؤهل", converted: "محوّل" };
const STEP_COLORS: Record<string, string> = { onboarding: "text-blue-400 bg-blue-500/10 border-blue-500/30", active: "text-green-400 bg-green-500/10 border-green-500/30", qualified: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30", converted: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };

export default function AgentOnboarding() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: ap } = await db.from("agent_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (ap) {
      setAgentId(ap.id);
      const { data } = await db.from("agent_clients").select("*").eq("agent_id", ap.id).in("status", ONBOARDING_STEPS).order("created_at", { ascending: false });
      setClients(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const advance = async (id: string, currentStatus: string) => {
    const idx = ONBOARDING_STEPS.indexOf(currentStatus);
    if (idx === -1 || idx >= ONBOARDING_STEPS.length - 1) return;
    const nextStatus = ONBOARDING_STEPS[idx + 1];
    const { error } = await db.from("agent_clients").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(R ? `تم التحديث إلى: ${STEP_LABELS_AR[nextStatus]}` : `Advanced to: ${nextStatus}`);
    load();
  };

  const grouped = ONBOARDING_STEPS.reduce((acc, step) => {
    acc[step] = clients.filter(c => c.status === step);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <AgentLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-400" />
              {R ? "تأهيل العملاء" : "Client Onboarding"}
            </h1>
            <p className="text-sm text-muted-foreground">{clients.length} {R ? "عميل في مراحل التأهيل" : "clients in pipeline"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Pipeline steps summary */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {ONBOARDING_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1 shrink-0">
              <div className={cn("px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2", STEP_COLORS[step])}>
                {R ? STEP_LABELS_AR[step] : step}
                <Badge variant="outline" className={cn("text-xs", STEP_COLORS[step])}>{grouped[step]?.length ?? 0}</Badge>
              </div>
              {i < ONBOARDING_STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>

        {/* Kanban-style columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ONBOARDING_STEPS.map(step => (
            <div key={step} className="space-y-2">
              <div className={cn("text-xs font-bold px-3 py-1.5 rounded-lg border", STEP_COLORS[step])}>
                {R ? STEP_LABELS_AR[step] : step} ({grouped[step]?.length ?? 0})
              </div>
              {loading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}</div>
              ) : (grouped[step] ?? []).length === 0 ? (
                <div className="h-20 border border-dashed border-border/50 rounded-xl flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">{R ? "لا يوجد" : "Empty"}</p>
                </div>
              ) : (
                (grouped[step] ?? []).map((c: any) => (
                  <Card key={c.id} className="border-border/50 hover:border-emerald-500/30 transition-colors">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                          {c.client_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{c.client_name}</p>
                          {c.client_company && <p className="text-[10px] text-muted-foreground truncate">{c.client_company}</p>}
                        </div>
                      </div>
                      {c.estimated_value && (
                        <p className="text-xs text-emerald-400 font-semibold">${c.estimated_value.toLocaleString()}</p>
                      )}
                      {step !== "converted" && (
                        <Button size="sm" className="w-full h-6 text-xs gap-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30" variant="outline" onClick={() => advance(c.id, step)}>
                          {R ? "تقدم" : "Advance"} <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                      {step === "converted" && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-3 h-3" />{R ? "محوّل" : "Converted"}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </AgentLayout>
  );
}
