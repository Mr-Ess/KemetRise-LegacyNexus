import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, Activity, Search, Shield, Monitor, Smartphone, Tablet, Trash2, LogOut, AlertTriangle, Zap, Globe, RefreshCw, XCircle, Clock, BarChart2, Download } from "lucide-react";
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval>|null>(null);

  // -- Error Logs --------------------------------------------------
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [errorLoading, setErrorLoading] = useState(true);
  const [errorQ, setErrorQ] = useState("");
  const [errorSeverity, setErrorSeverity] = useState("all");

  const loadErrorLogs = async () => {
    setErrorLoading(true);
    try {
      const { data } = await supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (data?.length) { setErrorLogs(data); return; }
      // Fallback: derive from audit logs with level=error
      const audit = auditLogs.filter(l => l.level === "error" || l.level === "warning");
      setErrorLogs(audit.map(l => ({ id: l.id, message: l.action, severity: l.level, source: l.module || l.table_name || "system", stack_trace: l.details || null, created_at: l.created_at })));
    } catch { setErrorLogs([]); } finally { setErrorLoading(false); }
  };

  // -- Security Alerts ---------------------------------------------
  const [secAlerts, setSecAlerts] = useState<any[]>([]);
  const [secLoading, setSecLoading] = useState(true);
  const [secQ, setSecQ] = useState("");
  const [secSeverity, setSecSeverity] = useState("all");

  const loadSecAlerts = async () => {
    setSecLoading(true);
    try {
      const { data } = await supabase.from("security_alerts").select("*").order("created_at", { ascending: false }).limit(500);
      if (data?.length) { setSecAlerts(data); return; }
      // Fallback: login_history failed attempts + ip_whitelist violations
      const { data: hist } = await supabase.from("login_history").select("*").order("created_at", { ascending: false }).limit(200);
      setSecAlerts((hist || []).map((h: any) => ({
        id: h.id, alert_type: "Login", description: `Login from ${h.ip_address || "unknown IP"} — ${h.device || "unknown device"}`,
        ip_address: h.ip_address, severity: "info", resolved: false, created_at: h.created_at,
      })));
    } catch { setSecAlerts([]); } finally { setSecLoading(false); }
  };

  // -- Integration / Webhook Logs ----------------------------------
  const [integLogs, setIntegLogs] = useState<any[]>([]);
  const [integLoading, setIntegLoading] = useState(true);
  const [integQ, setIntegQ] = useState("");
  const [integStatus, setIntegStatus] = useState("all");

  const loadIntegLogs = async () => {
    setIntegLoading(true);
    try {
      let data: any[] = [];
      const { data: wh } = await supabase.from("webhook_deliveries").select("*").order("created_at", { ascending: false }).limit(500);
      if (wh?.length) data = wh.map((w: any) => ({ ...w, source: "webhook", description: `${w.event_type||"event"} ? ${w.endpoint_url||"—"}` }));
      else {
        const { data: api } = await supabase.from("api_request_logs").select("*").order("created_at", { ascending: false }).limit(500);
        if (api?.length) data = api.map((r: any) => ({ ...r, source: "api", description: `${r.method||"GET"} ${r.path||"—"}` }));
      }
      setIntegLogs(data);
    } catch { setIntegLogs([]); } finally { setIntegLoading(false); }
  };

  // -- Audit Logs --------------------------------------------------
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditQ, setAuditQ] = useState("");
  const [auditLevel, setAuditLevel] = useState("all");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");

  // -- Agent Logs --------------------------------------------------
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentQ, setAgentQ] = useState("");
  const [agentStatus, setAgentStatus] = useState("all");

  const loadAgentLogs = async () => {
    setAgentLoading(true);
    try {
      // 1. Try RPC that bypasses RLS (SECURITY DEFINER — all rows regardless of user_id)
      let data: any[] = [];
      const { data: rpcData, error: rpcErr } = await supabase.rpc("get_all_agent_logs", { p_limit: 500 });
      if (!rpcErr && rpcData?.length) {
        data = rpcData;
      }

      // 2. Fallback: tenant-scoped query
      if (!data.length) {
        data = await tenantDb.select("agent_logs", { orderBy: "created_at", ascending: false, limit: 500 }) as any[];
      }

      // 3. Fallback: direct supabase (covers rows with different/null user_id)
      if (!data.length) {
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

  // -- Sessions ----------------------------------------------------
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
    loadErrorLogs();
    loadSecAlerts();
    loadIntegLogs();
  }, [user]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        auditApi.list(500).then(d => setAuditLogs(d as any[]));
        loadAgentLogs(); loadErrorLogs(); loadSecAlerts(); loadIntegLogs();
      }, 30000);
    } else {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [autoRefresh]);

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

  const filteredError = useMemo(() => errorLogs.filter(l => {
    if (errorSeverity !== "all" && l.severity !== errorSeverity) return false;
    if (errorQ && !`${l.message||""} ${l.source||""} ${l.stack_trace||""}`.toLowerCase().includes(errorQ.toLowerCase())) return false;
    return true;
  }), [errorLogs, errorQ, errorSeverity]);

  const filteredSec = useMemo(() => secAlerts.filter(l => {
    if (secSeverity !== "all" && l.severity !== secSeverity) return false;
    if (secQ && !`${l.alert_type||""} ${l.description||""} ${l.ip_address||""}`.toLowerCase().includes(secQ.toLowerCase())) return false;
    return true;
  }), [secAlerts, secQ, secSeverity]);

  const filteredInteg = useMemo(() => integLogs.filter(l => {
    if (integStatus !== "all" && String(l.status_code||l.status||"") !== integStatus && l.status !== integStatus) return false;
    if (integQ && !`${l.description||""} ${l.source||""} ${l.endpoint_url||""}`.toLowerCase().includes(integQ.toLowerCase())) return false;
    return true;
  }), [integLogs, integQ, integStatus]);

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
          <div className="flex items-center gap-2">
            <Button size="sm" variant={autoRefresh ? "default" : "outline"} className="gap-1.5 text-xs" onClick={() => setAutoRefresh(r => !r)}>
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin" : ""}`}/>{autoRefresh ? "Auto-refresh ON" : "Auto-refresh"}
            </Button>
            <ExportButton data={tab==="audit"?filteredAudit:tab==="agent"?filteredAgent:tab==="errors"?filteredError:tab==="security"?filteredSec:tab==="integrations"?filteredInteg:sessions} filename={`${tab}-logs`} title="Logs" />
          </div>
        </div>

        {/* -- KPI Strip -- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label:"Audit",       value:auditLogs.length,              icon:FileText,       color:"border-primary text-primary" },
            { label:"Agents",      value:agentLogs.length,              icon:Activity,       color:"border-blue-500 text-blue-400" },
            { label:"Errors",      value:errorLogs.filter(l=>l.severity==="error").length, icon:XCircle, color:"border-red-500 text-red-400" },
            { label:"Security",    value:secAlerts.length,              icon:Shield,         color:"border-amber-500 text-amber-400" },
            { label:"Integrations",value:integLogs.length,              icon:Globe,          color:"border-violet-500 text-violet-400" },
            { label:"Sessions",    value:sessions.length,               icon:Monitor,        color:"border-emerald-500 text-emerald-400" },
          ].map(k => (
            <Card key={k.label} className={`border-l-4 ${k.color}`}>
              <div className="p-3 flex items-center gap-2">
                <k.icon className={`w-5 h-5 opacity-75 ${k.color.split(" ")[1]}`}/>
                <div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 max-w-3xl">
            <TabsTrigger value="audit" className="text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Audit ({auditLogs.length})
            </TabsTrigger>
            <TabsTrigger value="agent" className="text-xs flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Agents ({agentLogs.length})
            </TabsTrigger>
            <TabsTrigger value="errors" className="text-xs flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Errors ({errorLogs.filter(l=>l.severity==="error"||!l.severity).length})
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Security ({secAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Integrations ({integLogs.length})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" /> Sessions ({sessions.length})
            </TabsTrigger>
          </TabsList>

          {/* -- AUDIT LOGS ----------------------------------------------- */}
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

          {/* -- AGENT LOGS ----------------------------------------------- */}
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

          {/* -- SESSIONS ------------------------------------------------- */}
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

          {/* -- ERROR LOGS ------------------------------------------------ */}
          <TabsContent value="errors" className="space-y-3 mt-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={errorQ} onChange={e => setErrorQ(e.target.value)} placeholder="Search errors…" className="pl-9" />
              </div>
              {["all","error","warning","info"].map(s => (
                <Button key={s} size="sm" variant={errorSeverity===s?"default":"outline"} onClick={() => setErrorSeverity(s)}>
                  {s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={loadErrorLogs}><RefreshCw className="w-3.5 h-3.5"/></Button>
            </div>
            <Card className="overflow-x-auto">
              {errorLoading ? (
                <div className="p-4 space-y-2">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs">
                    <tr>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Severity</th>
                      <th className="text-left p-3">Source</th>
                      <th className="text-left p-3">Message</th>
                      <th className="text-left p-3">Stack</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredError.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No error logs found</td></tr>
                    ) : filteredError.map(l => (
                      <tr key={l.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={l.severity==="error"?"destructive":l.severity==="warning"?"outline":"secondary"} className={l.severity==="warning"?"border-amber-500 text-amber-400":""}>
                            {l.severity||"error"}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs font-mono text-muted-foreground">{l.source||"—"}</td>
                        <td className="p-3 text-xs max-w-[300px] truncate">{l.message||l.action||"—"}</td>
                        <td className="p-3 text-xs font-mono text-destructive max-w-[200px] truncate" title={l.stack_trace}>{l.stack_trace?"[stack]":""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <p className="text-xs text-muted-foreground text-center">Showing {filteredError.length} of {errorLogs.length}</p>
          </TabsContent>

          {/* -- SECURITY ALERTS ------------------------------------------- */}
          <TabsContent value="security" className="space-y-3 mt-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={secQ} onChange={e => setSecQ(e.target.value)} placeholder="Search alerts, IP, type…" className="pl-9" />
              </div>
              {["all","critical","high","medium","low","info"].map(s => (
                <Button key={s} size="sm" variant={secSeverity===s?"default":"outline"} onClick={() => setSecSeverity(s)}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={loadSecAlerts}><RefreshCw className="w-3.5 h-3.5"/></Button>
            </div>
            <Card className="overflow-x-auto">
              {secLoading ? (
                <div className="p-4 space-y-2">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs">
                    <tr>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Description</th>
                      <th className="text-left p-3">IP Address</th>
                      <th className="text-left p-3">Severity</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSec.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No security alerts found</td></tr>
                    ) : filteredSec.map(l => (
                      <tr key={l.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="p-3"><Badge variant="outline" className="text-[10px]">{l.alert_type||"Alert"}</Badge></td>
                        <td className="p-3 text-xs max-w-[280px] truncate">{l.description||"—"}</td>
                        <td className="p-3 text-xs font-mono text-muted-foreground">{l.ip_address||"—"}</td>
                        <td className="p-3">
                          <Badge variant={/critical|high/i.test(l.severity||"")?"destructive":/medium/i.test(l.severity||"")?"outline":"secondary"}
                            className={/medium/i.test(l.severity||"")?"border-amber-500 text-amber-400":""}>
                            {l.severity||"info"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={l.resolved?"outline":"secondary"}>{l.resolved?"Resolved":"Open"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <p className="text-xs text-muted-foreground text-center">Showing {filteredSec.length} of {secAlerts.length}</p>
          </TabsContent>

          {/* -- INTEGRATION / WEBHOOK LOGS ------------------------------- */}
          <TabsContent value="integrations" className="space-y-3 mt-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={integQ} onChange={e => setIntegQ(e.target.value)} placeholder="Search endpoint, event, source…" className="pl-9" />
              </div>
              {["all","200","201","400","404","500"].map(s => (
                <Button key={s} size="sm" variant={integStatus===s?"default":"outline"} onClick={() => setIntegStatus(s)}>
                  {s==="all"?"All":s}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={loadIntegLogs}><RefreshCw className="w-3.5 h-3.5"/></Button>
            </div>
            <Card className="overflow-x-auto">
              {integLoading ? (
                <div className="p-4 space-y-2">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs">
                    <tr>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Source</th>
                      <th className="text-left p-3">Description</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Duration</th>
                      <th className="text-left p-3">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInteg.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No integration logs found</td></tr>
                    ) : filteredInteg.map(l => {
                      const code = l.status_code || l.response_code || l.status;
                      const isOk = code >= 200 && code < 300;
                      return (
                        <tr key={l.id} className="border-t border-border hover:bg-secondary/20">
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                          <td className="p-3"><Badge variant="outline" className="text-[10px]">{l.source||l.integration_type||"api"}</Badge></td>
                          <td className="p-3 text-xs max-w-[280px] truncate">{l.description||l.endpoint_url||"—"}</td>
                          <td className="p-3">
                            <Badge variant={isOk?"default":"destructive"} className="text-[10px] font-mono">{code||"—"}</Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{l.duration_ms!=null?`${l.duration_ms}ms`:"—"}</td>
                          <td className="p-3 text-xs font-mono text-muted-foreground max-w-[120px] truncate" title={JSON.stringify(l.response_body)}>
                            {l.response_body?JSON.stringify(l.response_body).slice(0,40)+"…":"—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
            <p className="text-xs text-muted-foreground text-center">Showing {filteredInteg.length} of {integLogs.length}</p>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}