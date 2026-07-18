// src/pages/AIProductFactory.tsx
// AI Digital Product Factory — Admin Control Panel
// Routes: /ai-factory (protected, superadmin/admin only)

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle,
  Package, Zap, ExternalLink, ShieldCheck, Factory, TrendingUp,
  ArrowLeft, Activity, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Replace with your actual Supabase project ref ─────────────────────────
const SUPABASE_PROJECT_REF = "eoxcpubjoaninjyxtfko";
const FN_APPROVE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/ai-factory-approve`;

// ─── Status badge config ────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  awaiting_tier1: { label: "Awaiting Super Admin", cls: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  awaiting_tier2: { label: "Escalated to Team",   cls: "bg-orange-500/20 text-orange-400 border-orange-500/40" },
  auto_fallback:  { label: "Auto-Approved",         cls: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
  approved:       { label: "Approved",               cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  rejected:       { label: "Rejected",               cls: "bg-red-500/20 text-red-400 border-red-500/40" },
  expired:        { label: "Expired",                cls: "bg-slate-500/20 text-slate-400 border-slate-500/40" },
  published:      { label: "Published",              cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  in_review:      { label: "In Review",              cls: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  draft:          { label: "Draft",                  cls: "bg-slate-500/20 text-slate-400 border-slate-500/40" },
  failed:         { label: "Failed",                 cls: "bg-red-500/20 text-red-400 border-red-500/40" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: "bg-slate-500/20 text-slate-400 border-slate-500/40" };
  return (
    <Badge className={cn("text-[10px] px-2 py-0.5 border font-body", cfg.cls)}>
      {cfg.label}
    </Badge>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, colorCls,
}: { label: string; value: number; icon: any; colorCls: string }) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground font-body uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={cn("p-2.5 rounded-lg bg-background/60 group-hover:scale-110 transition-transform", colorCls)}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AIProductFactory() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [queue, setQueue]       = useState<any[]>([]);
  const [logs, setLogs]         = useState<any[]>([]);
  const [stats, setStats] = useState({
    published: 0, inReview: 0, rejected: 0, autoFallback: 0,
  });
  const [activeTab, setActiveTab] = useState<"queue" | "products" | "logs">("queue");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: prods }, { data: q }, { data: l }] = await Promise.all([
        db.from("aidpf_products").select("*").order("created_at", { ascending: false }).limit(50),
        db.from("aidpf_approval_queue").select("*").order("created_at", { ascending: false }).limit(50),
        db.from("aidpf_generation_logs").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      setProducts(prods || []);
      setQueue(q || []);
      setLogs(l || []);
      setStats({
        published:    (prods || []).filter((p: any) => p.status === "published").length,
        inReview:     (prods || []).filter((p: any) => p.status === "in_review").length,
        rejected:     (prods || []).filter((p: any) => p.status === "rejected").length,
        autoFallback: (q    || []).filter((row: any) => row.status === "auto_fallback").length,
      });
    } catch {
      toast.error("Failed to load factory data");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
    // Live updates via Postgres realtime
    const ch = supabase
      .channel("aidpf-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "aidpf_approval_queue" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "aidpf_products" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const handleOverride = async (row: any, decision: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const tier = row.status === "awaiting_tier1" ? 1 : row.status === "awaiting_tier2" ? 2 : null;
    if (!tier) { toast.error("This request is no longer open for manual decision"); return; }
    try {
      const qs = new URLSearchParams({
        queue_id: row.id, tier: String(tier), decision, responder_id: user.id,
      });
      await fetch(`${FN_APPROVE_URL}?${qs.toString()}`);
      toast.success(decision === "approved" ? "✅ Manually approved" : "❌ Manually rejected");
      load();
    } catch {
      toast.error("Override call failed");
    }
  };

  const tabs = [
    { key: "queue"    as const, label: R ? "بوابة الموافقات"     : "Approval Queue",     count: queue.filter(r => r.status.startsWith("awaiting")).length },
    { key: "products" as const, label: R ? "المنتجات المولّدة"   : "Generated Products", count: products.length },
    { key: "logs"     as const, label: R ? "سجل التنفيذ"          : "Pipeline Logs",      count: 0 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        {/* ── Page header ── */}
        <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Factory className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-display font-bold text-foreground tracking-wide">
                    {R ? "مصنع المنتجات الرقمية الذكي" : "AI Digital Product Factory"}
                  </h1>
                  <p className="text-[10px] text-muted-foreground font-body">
                    {R ? "إدارة خط الإنتاج الآلي والموافقات متعددة المستويات" : "Autonomous pipeline · multi-tier approval · auto-publish"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Live indicator */}
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {R ? "مباشر" : "Live"}
              </span>
              <Button size="sm" variant="outline" onClick={load} disabled={loading}
                className="h-7 text-xs border-border/60 hover:border-primary/40 hover:text-primary transition-all">
                <RefreshCw className={cn("w-3 h-3 mr-1.5", loading && "animate-spin")} />
                {R ? "تحديث" : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 space-y-4">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label={R ? "منشورة" : "Published"}
              value={stats.published}
              icon={CheckCircle2}
              colorCls="text-emerald-400"
            />
            <StatCard
              label={R ? "قيد المراجعة" : "In Review"}
              value={stats.inReview}
              icon={Clock}
              colorCls="text-amber-400"
            />
            <StatCard
              label={R ? "مرفوضة" : "Rejected"}
              value={stats.rejected}
              icon={XCircle}
              colorCls="text-red-400"
            />
            <StatCard
              label={R ? "تصعيد تلقائي" : "Auto-Fallback"}
              value={stats.autoFallback}
              icon={Zap}
              colorCls="text-purple-400"
            />
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 border-b border-border/50 pb-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "px-3 py-2 text-xs font-body font-medium transition-all border-b-2 -mb-px flex items-center gap-1.5",
                  activeTab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                    activeTab === t.key ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Approval Queue tab ── */}
          {activeTab === "queue" && (
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs flex items-center gap-2 font-display text-foreground/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  {R ? "بوابة الموافقات متعددة المستويات" : "Multi-Tier Approval Gateway"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading && (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-14 rounded-lg bg-secondary/40 animate-pulse" />
                    ))}
                  </div>
                )}
                {!loading && queue.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ShieldCheck className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {R ? "لا توجد طلبات موافقة حالياً" : "No pending approval requests."}
                    </p>
                  </div>
                )}
                {!loading && queue.map((row) => {
                  const product = products.find((p) => p.id === row.product_id);
                  const openForOverride = row.status === "awaiting_tier1" || row.status === "awaiting_tier2";
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        "flex items-center justify-between border rounded-lg p-3 transition-all duration-200",
                        openForOverride
                          ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                          : "border-border/60 hover:border-border"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-body font-medium truncate text-foreground">
                          {product?.name || <span className="text-muted-foreground italic">Product #{row.product_id?.slice(0, 8)}</span>}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <StatusBadge status={row.status} />
                          <span className="text-[10px] text-muted-foreground font-body">
                            Tier {row.tier} · {format(new Date(row.created_at), "MMM d, HH:mm")}
                          </span>
                          {row.status === "awaiting_tier1" && row.tier1_deadline && (
                            <span className="text-[10px] text-amber-400 font-body">
                              → escalates {formatDistanceToNow(new Date(row.tier1_deadline), { addSuffix: true })}
                            </span>
                          )}
                          {row.status === "awaiting_tier2" && row.tier2_deadline && (
                            <span className="text-[10px] text-orange-400 font-body">
                              → auto-fallback {formatDistanceToNow(new Date(row.tier2_deadline), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      {openForOverride && (
                        <div className="flex gap-2 shrink-0 ml-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-500/70 transition-all"
                            onClick={() => handleOverride(row, "approved")}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {R ? "موافقة" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] text-red-400 border-red-500/40 hover:bg-red-500/10 hover:border-red-500/70 transition-all"
                            onClick={() => handleOverride(row, "rejected")}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            {R ? "رفض" : "Reject"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* ── Generated Products tab ── */}
          {activeTab === "products" && (
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs flex items-center gap-2 font-display text-foreground/80">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  {R ? "المنتجات المولّدة" : "Generated Products"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading && (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-14 rounded-lg bg-secondary/40 animate-pulse" />
                    ))}
                  </div>
                )}
                {!loading && products.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Package className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {R ? "لم يتم توليد أي منتجات بعد" : "No products generated yet."}
                    </p>
                  </div>
                )}
                {!loading && products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border border-border/60 rounded-lg p-3 hover:border-border hover:bg-secondary/20 transition-all duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-body font-medium truncate text-foreground">{p.name}</p>
                        {p.meta?.source === "ai_factory" && (
                          <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/40 border px-1.5 py-0 flex items-center gap-1 shrink-0">
                            <Sparkles className="w-2 h-2" /> AI
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                        {p.category} · ${((p.price_cents || 0) / 100).toFixed(2)} · {format(new Date(p.created_at), "MMM d, HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <StatusBadge status={p.status} />
                      {p.listing_id && (
                        <a
                          href={`/marketplace?listing=${p.listing_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                          title="View in Marketplace"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Pipeline Logs tab ── */}
          {activeTab === "logs" && (
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs flex items-center gap-2 font-display text-foreground/80">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  {R ? "سجل التنفيذ" : "Pipeline Execution Logs"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0.5 max-h-[500px] overflow-y-auto font-mono text-[11px] bg-background/50 rounded-lg p-3 border border-border/40">
                  {loading && (
                    <div className="space-y-2">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-4 rounded bg-secondary/40 animate-pulse" />
                      ))}
                    </div>
                  )}
                  {!loading && logs.length === 0 && (
                    <p className="text-muted-foreground text-center py-6">
                      {R ? "لا توجد سجلات بعد" : "No pipeline logs yet."}
                    </p>
                  )}
                  {!loading && logs.map((l) => (
                    <div
                      key={l.id}
                      className={cn(
                        "flex gap-2 py-0.5 leading-5",
                        l.level === "error"   ? "text-red-400"
                        : l.level === "warning" ? "text-amber-400"
                        : "text-muted-foreground"
                      )}
                    >
                      <span className="text-border shrink-0 select-none">{format(new Date(l.created_at), "HH:mm:ss")}</span>
                      <span className={cn(
                        "font-bold shrink-0",
                        l.level === "error" ? "text-red-400" : l.level === "warning" ? "text-amber-400" : "text-primary/70"
                      )}>
                        [{l.step}]
                      </span>
                      <span className="truncate">{l.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
