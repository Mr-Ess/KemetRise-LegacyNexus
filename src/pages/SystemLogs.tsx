import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Activity, Search } from "lucide-react";
import { auditApi } from "@/services/system";
import { tenantDb } from "@/lib/tenantDb";
import ExportButton from "@/components/shared/ExportButton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SystemLogs() {
  const nav = useNavigate();
  const [tab, setTab] = useState("audit");

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditQ, setAuditQ] = useState("");
  const [auditLevel, setAuditLevel] = useState("all");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");

  // Agent Logs state
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentQ, setAgentQ] = useState("");
  const [agentStatus, setAgentStatus] = useState("all");

  useEffect(() => {
    auditApi.list(500).then(d => setAuditLogs(d as any[])).finally(() => setAuditLoading(false));
    tenantDb.select("agent_logs", { orderBy: "created_at", ascending: false, limit: 500 })
      .then(d => setAgentLogs(d as any[])).finally(() => setAgentLoading(false));
  }, []);

  const filteredAudit = useMemo(() => auditLogs.filter(l => {
    if (auditLevel !== "all" && l.level !== auditLevel) return false;
    if (auditQ && !`${l.action} ${l.module} ${l.table_name}`.toLowerCase().includes(auditQ.toLowerCase())) return false;
    if (auditFrom && new Date(l.created_at) < new Date(auditFrom)) return false;
    if (auditTo && new Date(l.created_at) > new Date(auditTo + "T23:59:59")) return false;
    return true;
  }), [auditLogs, auditQ, auditLevel, auditFrom, auditTo]);

  const filteredAgent = useMemo(() => agentLogs.filter(l => {
    if (agentStatus !== "all" && l.status !== agentStatus) return false;
    if (agentQ && !`${l.agent_code} ${l.agent_name || ""} ${l.action_taken}`.toLowerCase().includes(agentQ.toLowerCase())) return false;
    return true;
  }), [agentLogs, agentQ, agentStatus]);

  const presets: [string, () => void][] = [
    ["Today", () => { const d = new Date().toISOString().slice(0,10); setAuditFrom(d); setAuditTo(d); }],
    ["7 Days", () => { const d = new Date(); d.setDate(d.getDate()-7); setAuditFrom(d.toISOString().slice(0,10)); setAuditTo(new Date().toISOString().slice(0,10)); }],
    ["30 Days", () => { const d = new Date(); d.setDate(d.getDate()-30); setAuditFrom(d.toISOString().slice(0,10)); setAuditTo(new Date().toISOString().slice(0,10)); }],
    ["Clear", () => { setAuditFrom(""); setAuditTo(""); }],
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={() => nav(-1 as any)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <FileText className="w-6 h-6" /> System Logs
          </h1>
          <ExportButton data={tab === "audit" ? filteredAudit : filteredAgent} filename={tab === "audit" ? "audit-logs" : "agent-logs"} title="Logs" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="audit" className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Audit Logs ({auditLogs.length})
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Agent Logs ({agentLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* ── AUDIT LOGS ─────────────────────────────────────────────── */}
          <TabsContent value="audit" className="space-y-3 mt-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={auditQ} onChange={e => setAuditQ(e.target.value)} placeholder="Search action, module, table…" className="pl-9" />
              </div>
              {["all","info","warning","error"].map(l => (
                <Button key={l} size="sm" variant={auditLevel === l ? "default" : "outline"} onClick={() => setAuditLevel(l)}>
                  {l === "all" ? "All" : l.charAt(0).toUpperCase() + l.slice(1)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">From:</span>
              <Input type="date" value={auditFrom} onChange={e => setAuditFrom(e.target.value)} className="w-auto" />
              <span className="text-xs text-muted-foreground">To:</span>
              <Input type="date" value={auditTo} onChange={e => setAuditTo(e.target.value)} className="w-auto" />
              {presets.map(([label, fn]) => <Button key={label} size="sm" variant="ghost" onClick={fn}>{label}</Button>)}
            </div>
            <Card className="overflow-x-auto">
              {auditLoading ? (
                <div className="p-4 space-y-2">{Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs">
                    <tr>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Level</th>
                      <th className="text-left p-3">Module</th>
                      <th className="text-left p-3">Table</th>
                      <th className="text-left p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudit.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No logs match filter</td></tr>
                    ) : filteredAudit.map(l => (
                      <tr key={l.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="p-3"><Badge variant={l.level === "error" ? "destructive" : "outline"}>{l.level}</Badge></td>
                        <td className="p-3 text-xs">{l.module || "—"}</td>
                        <td className="p-3 text-xs font-mono">{l.table_name}</td>
                        <td className="p-3 text-xs">{l.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <p className="text-xs text-muted-foreground text-center">Showing {filteredAudit.length} of {auditLogs.length}</p>
          </TabsContent>

          {/* ── AGENT LOGS ─────────────────────────────────────────────── */}
          <TabsContent value="agent" className="space-y-3 mt-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={agentQ} onChange={e => setAgentQ(e.target.value)} placeholder="Search agent, action…" className="pl-9" />
              </div>
              {["all","pending","running","completed","failed"].map(s => (
                <Button key={s} size="sm" variant={agentStatus === s ? "default" : "outline"} onClick={() => setAgentStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            <Card className="overflow-x-auto">
              {agentLoading ? (
                <div className="p-4 space-y-2">{Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs">
                    <tr>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Agent</th>
                      <th className="text-left p-3">Action</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Task</th>
                      <th className="text-left p-3">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgent.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No agent logs found</td></tr>
                    ) : filteredAgent.map(l => (
                      <tr key={l.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="p-3 font-mono text-xs text-primary">{l.agent_code}</td>
                        <td className="p-3 text-xs">{l.action_taken}</td>
                        <td className="p-3">
                          <Badge variant={l.status === "failed" ? "destructive" : l.status === "completed" ? "default" : "secondary"}>
                            {l.status || "—"}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs font-mono text-muted-foreground">{l.task_id?.slice(0,8) || "—"}</td>
                        <td className="p-3 text-xs text-destructive">{l.error_message || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <p className="text-xs text-muted-foreground text-center">Showing {filteredAgent.length} of {agentLogs.length}</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}