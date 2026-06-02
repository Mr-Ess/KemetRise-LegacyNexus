/**
 * ExecutiveCockpit.tsx
 * ─────────────────────────────────────────────────────────────
 * Real-time Enterprise Command Dashboard – reads & live-streams
 * from `public.executive_cockpit_state` via supabase.channel().
 *
 * Prerequisites:
 *   1. Run the SQL migration:
 *      supabase/migrations/20260602100000_executive_cockpit_state.sql
 *   2. .env must contain:
 *      VITE_SUPABASE_URL=https://<project>.supabase.co
 *      VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity, AlertTriangle, Bot, BarChart3, BookOpen, Boxes,
  Briefcase, Building2, ChevronDown, ChevronUp, Code2, Crown,
  FlaskConical, Globe, Gavel, Heart, Layers, Leaf,
  Megaphone, Package, RefreshCw, Settings, Shield, Sparkles,
  Star, Truck, Users, Wallet, Wifi, WifiOff, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeptStatus = "active" | "idle" | "warning" | "error" | "maintenance";

interface CockpitRow {
  id: string;
  workflow_name: string;
  department_code: string;
  current_status: DeptStatus;
  active_agent_id: string | null;
  last_update: string;
  health_score: number;
  last_error_message: string | null;
}

// ─── Department Metadata Map ──────────────────────────────────────────────────

const DEPT_META: Record<string, { icon: React.ElementType; route: string; color: string }> = {
  BRANDS:      { icon: Crown,      route: "/brands-hub",      color: "text-gold" },
  CRM:         { icon: Users,      route: "/customers",       color: "text-nile" },
  FINANCE:     { icon: Wallet,     route: "/finance",         color: "text-scarab" },
  OPS:         { icon: Settings,   route: "/operations",      color: "text-papyrus" },
  MARKETING:   { icon: Megaphone,  route: "/marketing",       color: "text-gold" },
  HR:          { icon: Heart,      route: "/employees",       color: "text-blood-red" },
  LOGISTICS:   { icon: Truck,      route: "/logistics",       color: "text-nile" },
  INVENTORY:   { icon: Package,    route: "/inventory",       color: "text-papyrus" },
  PROJECTS:    { icon: Briefcase,  route: "/projects",        color: "text-scarab" },
  SERVICES:    { icon: Sparkles,   route: "/services",        color: "text-gold" },
  AFFILIATES:  { icon: Globe,      route: "/affiliates",      color: "text-nile" },
  AI_AGENTS:   { icon: Bot,        route: "/agent-logs",      color: "text-scarab" },
  LEGAL:       { icon: Gavel,      route: "/legal-vault",     color: "text-papyrus" },
  SECURITY:    { icon: Shield,     route: "/audit-logs",      color: "text-blood-red" },
  DEV:         { icon: Code2,      route: "/developer",       color: "text-nile" },
  INHERITANCE: { icon: Leaf,       route: "/digital-inheritance", color: "text-scarab" },
  ARTISTIC:    { icon: FlaskConical, route: "/artistic",      color: "text-gold" },
  MARKETPLACE: { icon: BarChart3,  route: "/marketplace",     color: "text-nile" },
  PARTNERS:    { icon: Star,       route: "/success-partners",color: "text-papyrus" },
};

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<DeptStatus, { label: string; ring: string; badge: string; pulse: boolean }> = {
  active:      { label: "Active",      ring: "ring-scarab/60",     badge: "bg-scarab/20 text-scarab border-scarab/30",        pulse: true },
  idle:        { label: "Idle",        ring: "ring-muted/40",      badge: "bg-muted/30 text-muted-foreground border-muted/30", pulse: false },
  warning:     { label: "Warning",     ring: "ring-gold/60",       badge: "bg-gold/20 text-gold border-gold/30",               pulse: true },
  error:       { label: "Error",       ring: "ring-blood-red/70",  badge: "bg-blood-red/20 text-blood-red border-blood-red/30", pulse: true },
  maintenance: { label: "Maintenance", ring: "ring-nile/50",       badge: "bg-nile/20 text-nile border-nile/30",               pulse: false },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function healthColor(score: number): string {
  if (score >= 80) return "text-scarab";
  if (score >= 50) return "text-gold";
  return "text-blood-red";
}

function healthBarColor(score: number): string {
  if (score >= 80) return "bg-scarab";
  if (score >= 50) return "bg-gold";
  return "bg-blood-red";
}

function fmt(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "–";
  }
}

// ─── Department Card ──────────────────────────────────────────────────────────

const DeptCard = ({ row, expanded, onToggle }: {
  row: CockpitRow;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const meta = DEPT_META[row.department_code] ?? { icon: Boxes, route: "/", color: "text-foreground" };
  const statusCfg = STATUS_CFG[row.current_status] ?? STATUS_CFG.idle;
  const Icon = meta.icon;

  return (
    <div
      className={`
        relative rounded-lg border border-border bg-card
        ring-1 ${statusCfg.ring}
        transition-all duration-300
        hover:shadow-[0_0_14px_hsl(var(--gold)/0.15)]
      `}
    >
      {/* Pulse indicator for live statuses */}
      {statusCfg.pulse && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-scarab" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-scarab" />
        </span>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 p-3 cursor-pointer select-none" onClick={onToggle}>
        <div className={`flex-shrink-0 p-1.5 rounded-md bg-secondary/60 ${meta.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-display font-semibold text-foreground truncate leading-tight">
            {row.workflow_name}
          </p>
          <p className="text-[9px] text-muted-foreground font-mono">{row.department_code}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={`text-[9px] px-1.5 py-0 border ${statusCfg.badge}`}>
            {statusCfg.label}
          </Badge>
          {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
        </div>
      </div>

      {/* Health bar */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 rounded-full bg-secondary/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${healthBarColor(row.health_score)}`}
              style={{ width: `${row.health_score}%` }}
            />
          </div>
          <span className={`text-[9px] font-mono font-bold ${healthColor(row.health_score)}`}>
            {row.health_score}%
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-border/50 pt-2">
          <div className="flex justify-between text-[9px]">
            <span className="text-muted-foreground">Last Update</span>
            <span className="font-mono text-foreground">{fmt(row.last_update)}</span>
          </div>
          {row.active_agent_id && (
            <div className="flex justify-between text-[9px]">
              <span className="text-muted-foreground">Active Agent</span>
              <span className="font-mono text-nile truncate max-w-[120px]">{row.active_agent_id.slice(0, 8)}…</span>
            </div>
          )}
          {row.last_error_message && (
            <div className="mt-1 rounded bg-blood-red/10 border border-blood-red/20 p-1.5">
              <div className="flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 text-blood-red flex-shrink-0 mt-0.5" />
                <p className="text-[9px] text-blood-red leading-tight">{row.last_error_message}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ExecutiveCockpit = () => {
  const [rows, setRows] = useState<CockpitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Initial fetch ──────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("executive_cockpit_state")
        .select("*")
        .order("workflow_name", { ascending: true });

      if (error) throw error;
      setRows((data as CockpitRow[]) ?? []);
      setLastSync(new Date());
    } catch (err) {
      console.warn("[ExecutiveCockpit] fetch error:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("cockpit_realtime", { config: { broadcast: { ack: false } } })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "executive_cockpit_state",
        },
        (payload) => {
          setLastSync(new Date());

          if (payload.eventType === "INSERT") {
            setRows((prev) => [...prev, payload.new as CockpitRow].sort((a, b) =>
              a.workflow_name.localeCompare(b.workflow_name)
            ));
          } else if (payload.eventType === "UPDATE") {
            setRows((prev) =>
              prev.map((r) => r.id === payload.new.id ? (payload.new as CockpitRow) : r)
            );
          } else if (payload.eventType === "DELETE") {
            setRows((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // ── Aggregated stats ───────────────────────────────────────
  const stats = {
    active:      rows.filter((r) => r.current_status === "active").length,
    warning:     rows.filter((r) => r.current_status === "warning").length,
    error:       rows.filter((r) => r.current_status === "error").length,
    avgHealth:   rows.length
      ? Math.round(rows.reduce((s, r) => s + r.health_score, 0) / rows.length)
      : 0,
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <Card className="border border-border/60 bg-card shadow-sm">
      {/* ── Header ── */}
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-gold/10">
              <Activity className="w-4 h-4 text-gold" />
            </div>
            <CardTitle className="text-sm font-display text-foreground">
              Executive Cockpit
            </CardTitle>
            <Badge className="text-[9px] px-1.5 border border-gold/30 bg-gold/10 text-gold">
              {rows.length} Departments
            </Badge>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-3">
            {/* Stats chips */}
            <div className="hidden sm:flex items-center gap-2 text-[9px]">
              <span className="flex items-center gap-0.5 text-scarab font-mono">
                <Zap className="w-2.5 h-2.5" />{stats.active} Active
              </span>
              {stats.warning > 0 && (
                <span className="flex items-center gap-0.5 text-gold font-mono">
                  <AlertTriangle className="w-2.5 h-2.5" />{stats.warning} Warn
                </span>
              )}
              {stats.error > 0 && (
                <span className="flex items-center gap-0.5 text-blood-red font-mono">
                  <AlertTriangle className="w-2.5 h-2.5" />{stats.error} Error
                </span>
              )}
              <span className={`flex items-center gap-0.5 font-mono font-bold ${healthColor(stats.avgHealth)}`}>
                <Layers className="w-2.5 h-2.5" />{stats.avgHealth}% Avg Health
              </span>
            </div>

            {/* Connection indicator */}
            <div className="flex items-center gap-1 text-[9px]">
              {connected
                ? <><Wifi className="w-3 h-3 text-scarab" /><span className="text-scarab hidden sm:inline">Live</span></>
                : <><WifiOff className="w-3 h-3 text-blood-red" /><span className="text-blood-red hidden sm:inline">Offline</span></>
              }
            </div>

            {/* Last sync */}
            {lastSync && (
              <span className="hidden md:block text-[9px] text-muted-foreground font-mono">
                {fmt(lastSync.toISOString())}
              </span>
            )}

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={fetchAll}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`w-3 h-3 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {/* ── Loading skeleton ── */}
        {loading && rows.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {Array.from({ length: 19 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-secondary/30 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No cockpit data found.
            </p>
            <p className="text-[10px] text-muted-foreground/70 max-w-xs">
              Run the SQL migration in your Supabase dashboard to seed the
              19 department rows, then refresh.
            </p>
            <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={fetchAll}>
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* ── Department grid ── */}
        {rows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {rows.map((row) => (
              <DeptCard
                key={row.id}
                row={row}
                expanded={expanded === row.id}
                onToggle={() => setExpanded(expanded === row.id ? null : row.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExecutiveCockpit;
