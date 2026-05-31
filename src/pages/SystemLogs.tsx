import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, Activity, Search, Shield, Monitor, Smartphone, Tablet, Trash2, LogOut } from "lucide-react";
import { auditApi } from "@/services/system";
import { tenantDb } from "@/lib/tenantDb";
import { supabase } from "@/integrations/supabase/client";
import ExportButton from "@/components/shared/ExportButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function SystemLogs() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("audit");

  // ── Audit Logs ──────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditQ, setAuditQ] = useState("");
  const [auditLevel, setAuditLevel] = useState("all");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");

  // ── Agent Logs ──────────────────────────────────────────────────
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentQ, setAgentQ] = useState("");
  const [agentStatus, setAgentStatus] = useState("all");

  const loadAgentLogs = async () => {
    setAgentLoading(true);
    try {
      // 1. Try tenant-scoped query first
      let data = await tenantDb.select("agent_logs", { orderBy: "created_at", ascending: false, limit: 500 }) as any[];

      // 2. If empty, try direct supabase (covers rows with different/null user_id)
      if (!data?.length) {
        const { data: direct } = await supabase
          .from("agent_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        if (direct?.length) data = direct;
      }

      // 3. If still empty, fallback to chat_messages (AI assistant replies)
      if (!data?.length) {
        const convData = await tenantDb.select("chat_conversations", { orderBy: "created_at", ascending: false }) as any[];
        const convIds = convData.map((c: any) => c.id).filter(Boolean);
        if (convIds.length > 0) {
          const { data: msgs } = await supabase
            .from("chat_messages")
            .select("id, role, content, metadata, created_at, conversation_id")
            .eq("role", "assistant")
            .in("conversation_id", convIds)
            .order("created_at", { ascending: false })
            .limit(300);
          if (msgs?.length) {
            data = msgs.map((m: any) => ({
              id: m.id,
              agent_code: (m.metadata?.agent_id || m.metadata?.agentId || "AI-AGENT").toString().toUpperCase(),
              agent_name: m.metadata?.agent_name || m.metadata?.agentName || "AI Agent",
              action_taken: m.content?.slice(0, 200) || "—",
              status: "completed",
              task_id: m.conversation_id,
              error_message: null,
              created_at: m.created_at,
              _source: "chat",
            }));
          }
        }
      }

      // Normalize nulls for display
      setAgentLogs((data || []).map((r: any) => ({
        ...r,
        action_taken: r.action_taken || r.log_details?.action || r.log_details?.message || "—",
        agent_name: r.agent_name || r.agent_code || "Agent",
        status: r.status || "completed",
      })));
    } catch { /* keep existing */ } finally { setAgentLoading(false); }
  };

  // ── Sessions ────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const loadSessions = async () => {
    if (!user) return;
    setSessionsLoading(true);
    try {
      // Try user_sessions first
      let data = await tenantDb.select("user_sessions", { eq: { revoked: false }, orderBy: "last_active", ascending: false }) as any[];
      if (!data?.length) {
        // Fallback: login_history — written on every login, read-only display
        const { data: hist } = await supabase
          .from("login_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        data = (hist || []).map((h: any) => ({
          ...h,
          last_active: h.created_at,
          revoked: false,
          session_token: `hist-${h.id}`,
          _readonly: true,
        }));
      }
      setSessions(data || []);
    } finally { setSessionsLoading(false); }
  };

  const revokeSession = async (id: string) => {
    const s = sessions.find(x => x.id === id);
    if (s?._readonly) return toast.info("Login history entries cannot be revoked");
    try { await tenantDb.update("user_sessions", { revoked: true }, { id }); }
    catch { return toast.error("Failed to revoke session"); }
    toast.success("Session revoked");
    loadSessions();
  };

  const revokeAllSessions = async () => {
    await tenantDb.update("user_sessions", { revoked: true }, { eq: { user_id: user!.id } } as any);
    await supabase.auth.signOut({ scope: "others" } as any);
    toast.success("All other sessions revoked");
    loadSessions();
  };

  const DeviceIcon = (device: string) =>
    /mobile|phone/i.test(device || "") ? Smartphone : /tablet/i.test(device || "") ? Tablet : Monitor;

  useEffect(() => {
    auditApi.list(500).then(d => setAuditLogs(d as any[])).finally(() => setAuditLoading(false));
    loadAgentLogs();
    loadSessions();
  }, [user]);

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
          <ExportButton data={tab === "audit" ? filteredAudit : tab === "agent" ? filteredAgent : sessions} filename={tab === "audit" ? "audit-logs" : tab === "agent" ? "agent-logs" : "sessions"} title="Logs" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="audit" className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Audit ({auditLogs.length})
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Agents ({agentLogs.length})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Sessions ({sessions.length})
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
                        <td className="p-3 font-mono text-xs text-primary">{l.agent_code}{l._source === "chat" ? <span className="ml-1 text-[9px] text-muted-foreground">(chat)</span> : ""}</td>
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

          {/* ── SESSIONS ───────────────────────────────────────────────── */}
          <TabsContent value="sessions" className="space-y-3 mt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">
                {sessions.some(s => s._readonly) ? "Login history for your account." : "Active sessions for your account across all devices."}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5"><LogOut className="w-3.5 h-3.5"/>Revoke All Others</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke all other sessions?</AlertDialogTitle>
                    <AlertDialogDescription>All other devices will be signed out immediately. Your current session stays active.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={revokeAllSessions}>Revoke All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {sessionsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-20 w-full"/>)}</div>
            ) : sessions.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                <p>No active sessions found</p>
                <p className="text-xs mt-1">Sessions will appear here when you sign in on other devices.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => {
                  const DevIcon = DeviceIcon(s.device);
                  return (
                    <Card key={s.id} className="p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0"><DevIcon className="w-6 h-6 text-primary"/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{s.browser || "Browser"} on {s.os || s.device || "Unknown OS"}</span>
                          <Badge variant="outline" className="text-[10px]">{s.device || "Desktop"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          IP: {s.ip_address || "—"} · Last active: {s.last_active ? new Date(s.last_active).toLocaleString() : "—"}
                        </p>
                        {s.location && <p className="text-xs text-muted-foreground">{s.location}</p>}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => revokeSession(s.id)} title="Revoke">
                        <Trash2 className="w-4 h-4 text-destructive"/>
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}