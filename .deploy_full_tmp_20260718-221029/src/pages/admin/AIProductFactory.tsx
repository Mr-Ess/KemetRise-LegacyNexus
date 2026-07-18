import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle,
  Package, Zap, ExternalLink, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const FN_APPROVE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-factory-approve`;

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  awaiting_tier1: { label: "Awaiting Super Admin", cls: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  awaiting_tier2: { label: "Escalated to Team", cls: "bg-orange-500/20 text-orange-400 border-orange-500/40" },
  auto_fallback: { label: "Auto-Approved (Fallback)", cls: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
  approved: { label: "Approved", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  rejected: { label: "Rejected", cls: "bg-red-500/20 text-red-400 border-red-500/40" },
  expired: { label: "Expired", cls: "bg-slate-500/20 text-slate-400 border-slate-500/40" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.awaiting_tier1;
  return <Badge className={cn("text-[10px] px-2 py-0.5 border", cfg.cls)}>{cfg.label}</Badge>;
}

export default function AIProductFactory() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const db = supabase as any;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ published: 0, inReview: 0, rejected: 0, autoFallback: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: prods }, { data: q }, { data: l }] = await Promise.all([
        db.from("aidpf_products").select("*").order("created_at", { ascending: false }).limit(30),
        db.from("aidpf_approval_queue").select("*").order("created_at", { ascending: false }).limit(30),
        db.from("aidpf_generation_logs").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setProducts(prods || []);
      setQueue(q || []);
      setLogs(l || []);
      setStats({
        published: (prods || []).filter((p: any) => p.status === "published").length,
        inReview: (prods || []).filter((p: any) => p.status === "in_review").length,
        rejected: (prods || []).filter((p: any) => p.status === "rejected").length,
        autoFallback: (q || []).filter((row: any) => row.status === "auto_fallback").length,
      });
    } catch {
      toast.error("Failed to load factory data");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();

    const ch = supabase
      .channel("aidpf-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "aidpf_approval_queue" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "aidpf_products" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const handleOverride = async (row: any, decision: "approved" | "rejected") => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const tier = row.status === "awaiting_tier1" ? 1 : row.status === "awaiting_tier2" ? 2 : null;
    if (!tier) {
      toast.error("This request is no longer open for manual decision");
      return;
    }

    try {
      const qs = new URLSearchParams({
        queue_id: row.id,
        tier: String(tier),
        decision,
        responder_id: user.id,
      });
      await fetch(`${FN_APPROVE_URL}?${qs.toString()}`);
      toast.success(decision === "approved" ? "Manually approved" : "Manually rejected");
      load();
    } catch {
      toast.error("Override failed");
    }
  };

  return (
    <AdminLayout>
      <div className={cn("p-6 space-y-6", isRTL && "rtl")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">{isRTL ? "مصنع المنتجات الرقمية الذكي" : "Autonomous AI Digital Product Factory"}</h1>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? "منشورة" : "Published"}</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? "قيد المراجعة" : "In Review"}</p>
                <p className="text-2xl font-bold">{stats.inReview}</p>
              </div>
              <Clock className="w-6 h-6 text-amber-400" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? "مرفوضة" : "Rejected"}</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="w-6 h-6 text-red-400" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? "تصعيد تلقائي" : "Auto-Fallback"}</p>
                <p className="text-2xl font-bold">{stats.autoFallback}</p>
              </div>
              <Zap className="w-6 h-6 text-purple-400" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {isRTL ? "بوابة الموافقات متعددة المستويات" : "Multi-Tier Approval Gateway"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {queue.length === 0 && <p className="text-xs text-muted-foreground">{isRTL ? "لا توجد طلبات" : "No approval requests yet."}</p>}
            {queue.map((row) => {
              const product = products.find((p) => p.id === row.product_id);
              const openForOverride = row.status === "awaiting_tier1" || row.status === "awaiting_tier2";
              return (
                <div key={row.id} className="flex items-center justify-between border border-border/60 rounded-lg p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{product?.name || row.product_id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={row.status} />
                      <span className="text-[10px] text-muted-foreground">Tier {row.tier} · {format(new Date(row.created_at), "MMM d, HH:mm")}</span>
                      {row.status === "awaiting_tier1" && row.tier1_deadline && (
                        <span className="text-[10px] text-muted-foreground">→ escalates {format(new Date(row.tier1_deadline), "HH:mm")}</span>
                      )}
                      {row.status === "awaiting_tier2" && row.tier2_deadline && (
                        <span className="text-[10px] text-muted-foreground">→ auto-fallback {format(new Date(row.tier2_deadline), "HH:mm")}</span>
                      )}
                    </div>
                  </div>
                  {openForOverride && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-emerald-400 border-emerald-500/40" onClick={() => handleOverride(row, "approved")}>
                        {isRTL ? "موافقة يدوية" : "Approve"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-red-400 border-red-500/40" onClick={() => handleOverride(row, "rejected")}>
                        {isRTL ? "رفض" : "Reject"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              {isRTL ? "المنتجات المولّدة" : "Generated Products"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between border border-border/60 rounded-lg p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.category} · ${(p.price_cents / 100).toFixed(2)} · {format(new Date(p.created_at), "MMM d, HH:mm")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] capitalize">{p.status}</Badge>
                  {p.listing_id && (
                    <a href={`/marketplace?listing=${p.listing_id}`} target="_blank" rel="noreferrer" className="text-primary">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {isRTL ? "سجل التنفيذ" : "Pipeline Logs"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-96 overflow-y-auto font-mono text-[11px]">
            {logs.map((l) => (
              <div
                key={l.id}
                className={cn(
                  "flex gap-2",
                  l.level === "error" ? "text-red-400" : l.level === "warning" ? "text-amber-400" : "text-muted-foreground"
                )}
              >
                <span>{format(new Date(l.created_at), "HH:mm:ss")}</span>
                <span className="font-semibold">[{l.step}]</span>
                <span className="truncate">{l.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
