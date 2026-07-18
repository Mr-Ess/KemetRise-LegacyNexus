import { Plug, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { tenantDb } from "@/lib/tenantDb";

type Integration = {
  id: string;
  platform: string;
  status: "connected" | "disconnected" | "error";
  lastSync: string;
  error?: string;
  kind: "api_key" | "webhook";
};

const statusConfig = {
  connected: { icon: CheckCircle, color: "text-scarab", bg: "bg-scarab/10", label: "Connected" },
  disconnected: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted/30", label: "Disconnected" },
  error: { icon: AlertTriangle, color: "text-blood-red", bg: "bg-blood-red/10", label: "Error" },
};

const fmt = (d: string | null) => !d ? "Never" : new Date(d).toLocaleString();

const ApiIntegrationStatus = ({ compact = false }: { compact?: boolean }) => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);

  const load = async () => {
    const [keys, hooks] = await Promise.all([
      tenantDb.select("api_keys", { orderBy: "created_at", ascending: false }),
      tenantDb.select("webhooks", { orderBy: "created_at", ascending: false }),
    ]);
    const k: Integration[] = (keys || []).map((r: any) => ({
      id: `k-${r.id}`,
      platform: r.label || "API Key",
      status: !r.active ? "disconnected" : (r.last_used_at ? "connected" : "disconnected"),
      lastSync: fmt(r.last_used_at),
      kind: "api_key",
    }));
    const w: Integration[] = (hooks || []).map((r: any) => ({
      id: `w-${r.id}`,
      platform: `Webhook · ${r.label || r.url}`,
      status: r.active ? "connected" : "disconnected",
      lastSync: fmt(r.updated_at),
      kind: "webhook",
    }));
    setIntegrations([...k, ...w]);
  };

  useEffect(() => {
    if (!user) return;
    load().catch((e) => toast.error(e.message));
    const ch = supabase.channel("api-int-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "api_keys" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "webhooks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const handleSync = async (i: Integration) => {
    setSyncing(i.id);
    try {
      const id = i.id.slice(2);
      if (i.kind === "api_key") {
        await tenantDb.update("api_keys", { last_used_at: new Date().toISOString() }, { id });
      } else {
        await tenantDb.update("webhooks", { updated_at: new Date().toISOString() }, { id });
      }
      await load();
      toast.success("Synced");
    } catch (e: any) { toast.error(e.message); }
    finally { setSyncing(null); }
  };

  const connected = integrations.filter(i => i.status === "connected").length;
  const total = integrations.length || 0;

  if (compact) {
    return (
      <div className="bg-secondary/30 rounded-md border border-border/50 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Plug className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[10px] text-foreground tracking-wider">API STATUS</span>
          <span className="ml-auto text-[10px] font-display text-scarab">{connected}/{total}</span>
        </div>
        <div className="space-y-1">
          {integrations.length === 0 && <p className="text-[10px] text-muted-foreground">No integrations yet</p>}
          {integrations.slice(0, 5).map(i => {
            const cfg = statusConfig[i.status];
            return (
              <div key={i.id} className="flex items-center justify-between">
                <span className="text-[10px] font-body text-muted-foreground truncate max-w-[60%]">{i.platform}</span>
                <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Plug className="w-4 h-4 text-primary" />
        <h3 className="font-display text-xs font-bold text-foreground tracking-wider">API INTEGRATION STATUS</h3>
        <span className="ml-auto text-[10px] font-display px-2 py-0.5 rounded-full bg-scarab/20 text-scarab">{connected}/{total} Active</span>
      </div>
      <div className="space-y-2">
        {integrations.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Add API keys or webhooks in Settings → API Hub.</p>}
        {integrations.map(i => {
          const cfg = statusConfig[i.status];
          return (
            <div key={i.id} className={`flex items-center gap-3 p-3 rounded-md border border-border/50 ${cfg.bg}`}>
              <cfg.icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display text-foreground truncate">{i.platform}</p>
                <p className="text-[10px] text-muted-foreground">Last sync: {i.lastSync}</p>
              </div>
              <button onClick={() => handleSync(i)} disabled={syncing === i.id}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${syncing === i.id ? "animate-spin" : ""}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApiIntegrationStatus;
