import { useState, useEffect } from "react";
import { countsApi } from "@/services/system";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import {
  BarChart3, Users, CheckSquare, MessageSquare, Activity, TrendingUp, Bot, UserCheck,
  AlertTriangle, Server, ShoppingCart, Building2, Filter, Cpu, HardDrive, Wifi, WifiOff,
  Package, Star, Clock, ArrowUpRight, ArrowDownRight, Shield, Zap
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from "recharts";

// ── Static fallback data (used until DB loads) ────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const serverMetrics = {
  cpu: 42, memory: 68, disk: 55, network: 92, uptime: "99.97%", latency: "12ms",
  requests: "24.5K/hr", errors: "0.03%",
};

const PIE_COLORS = ["hsl(42,85%,55%)", "hsl(200,80%,40%)", "hsl(160,60%,35%)", "hsl(0,72%,50%)"];

type Tab = "tasks" | "agents" | "activity" | "messages" | "branches" | "server" | "customers" | "brands" | "alerts";

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(230,15%,11%)",
    border: "1px solid hsl(42,40%,25%)",
    borderRadius: "6px",
    fontSize: "10px",
    color: "hsl(45,60%,80%)",
  },
  itemStyle: { color: "hsl(45,60%,80%)", fontSize: "10px" },
};

// ── Sub-components ────────────────────────────────────────────────────

const StatBox = ({ icon, value, label, change, changeType = "up" }: {
  icon: React.ReactNode; value: string; label: string; change: string; changeType?: "up" | "down" | "neutral";
}) => (
  <div className="bg-secondary/50 rounded-md p-2 text-center">
    <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
    <p className="text-sm font-display font-bold text-foreground">{value}</p>
    <p className="text-[9px] text-muted-foreground">{label}</p>
    <p className={`text-[9px] flex items-center justify-center gap-0.5 ${
      changeType === "up" ? "text-scarab" : changeType === "down" ? "text-blood-red" : "text-muted-foreground"
    }`}>
      {changeType === "up" && <ArrowUpRight className="w-2 h-2" />}
      {changeType === "down" && <ArrowDownRight className="w-2 h-2" />}
      {change}
    </p>
  </div>
);

const GaugeBar = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => (
  <div className="flex items-center gap-2">
    {icon}
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className={`text-[10px] font-display font-bold ${value > 80 ? "text-blood-red" : value > 60 ? "text-primary" : "text-scarab"}`}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────

const SystemAnalyticsCard = ({ globalEntityFilter }: { globalEntityFilter?: string } = {}) => {
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [agentFilter, setAgentFilter] = useState<"all" | "ai" | "human">("all");

  // Sync tab from parent entity filter
  useEffect(() => {
    const map: Record<string, Tab> = {
      Brands: "brands", Customers: "customers", Branches: "branches",
      Projects: "tasks", Affiliates: "tasks", "Success Partners": "tasks",
    };
    if (globalEntityFilter && globalEntityFilter !== "All" && map[globalEntityFilter]) {
      setActiveTab(map[globalEntityFilter]);
    }
  }, [globalEntityFilter]);

  const [counts, setCounts] = useState<Record<string, number>>({});

  // DB-driven state
  const [taskData, setTaskData] = useState<any[]>([]);
  const [aiAgents, setAiAgents] = useState<any[]>([]);
  const [humanAgents, setHumanAgents] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [brandPerformance, setBrandPerformance] = useState<any[]>([]);
  const [brandRadarData, setBrandRadarData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [messageData, setMessageData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  const loadAll = async () => {
    try {
      // Counts
      countsApi.all().then(setCounts).catch(() => {});

      // Tasks by day of week (last 7 days)
      const tasks = await tenantDb.select("tasks", { orderBy: "created_at", ascending: false, limit: 500 }) as any[];
      const dayMap: Record<string, { completed: number; pending: number; failed: number }> = {};
      DAYS.forEach(d => { dayMap[d] = { completed: 0, pending: 0, failed: 0 }; });
      tasks.forEach((t: any) => {
        const d = DAYS[new Date(t.created_at).getDay()];
        if (t.status === "completed" || t.status === "done") dayMap[d].completed++;
        else if (t.status === "failed" || t.status === "error") dayMap[d].failed++;
        else dayMap[d].pending++;
      });
      setTaskData(DAYS.map(d => ({ name: d, ...dayMap[d] })));

      // Agents from employees
      const emps = await tenantDb.select("employees", { orderBy: "created_at", ascending: false, limit: 100 }) as any[];
      const ai: any[] = [], human: any[] = [];
      emps.forEach((e: any) => {
        const d = e.data || {};
        const isAI = e.agent_type === "ai" || d.type === "AI Agent" || d.agent_type === "ai";
        const completedTasks = tasks.filter((t: any) => t.assignee === e.name || t.assignee_id === e.id).length;
        const entry = {
          name: (e.name || "Unknown").toUpperCase(),
          tasks: completedTasks,
          efficiency: Math.min(100, 70 + Math.round(completedTasks * 2)),
          status: (e.availability || (e.status === "active" ? "online" : e.status === "busy" ? "busy" : "offline")),
        };
        if (isAI) ai.push(entry); else human.push(entry);
      });
      setAiAgents(ai.length ? ai : []);
      setHumanAgents(human.length ? human : []);

      // Branches
      const branches = await tenantDb.select("branches", { orderBy: "created_at", ascending: false, limit: 20 }) as any[];
      setBranchData(branches.map((b: any) => ({
        name: b.name,
        revenue: b.data?.revenue ?? 0,
        orders: b.data?.orders ?? 0,
        rating: b.data?.rating ?? 0,
      })));

      // Customers by month (last 6 months)
      const customers = await tenantDb.select("customers", { orderBy: "created_at", ascending: false, limit: 1000 }) as any[];
      const now = new Date();
      const custMap: Record<string, { newCustomers: number; returning: number; churned: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        custMap[MONTHS[d.getMonth()]] = { newCustomers: 0, returning: 0, churned: 0 };
      }
      customers.forEach((c: any) => {
        const m = MONTHS[new Date(c.created_at).getMonth()];
        if (custMap[m]) {
          if (c.status === "inactive") custMap[m].churned++;
          else custMap[m].newCustomers++;
        }
      });
      setCustomerData(Object.entries(custMap).map(([month, v]) => ({ month, ...v })));

      // Brand performance from brands + transactions
      const brands = await tenantDb.select("brands", { orderBy: "created_at", ascending: false, limit: 20 }) as any[];
      const txns = await tenantDb.select("transactions", { orderBy: "created_at", ascending: false, limit: 500 }) as any[];
      const bPerf = brands.slice(0, 5).map((b: any) => {
        const bTxns = txns.filter((t: any) => t.brand_id === b.id && t.kind === "income");
        const sales = bTxns.reduce((s: number, t: any) => s + (t.amount || 0), 0);
        return { brand: b.name, sales: Math.round(sales), growth: b.data?.growth ?? 0, satisfaction: b.data?.satisfaction ?? 85 };
      });
      setBrandPerformance(bPerf);
      const metrics = ["Sales", "Growth", "Satisfaction", "Reach", "Loyalty"];
      const top3 = brands.slice(0, 3);
      setBrandRadarData(metrics.map(metric => {
        const row: Record<string, any> = { metric };
        top3.forEach((b: any) => { row[b.name] = b.data?.[metric.toLowerCase()] ?? Math.round(60 + Math.random() * 35); });
        return row;
      }));

      // Activity by hour (audit_logs last 24h)
      const auditRows = await tenantDb.select("audit_logs", { orderBy: "created_at", ascending: false, limit: 200 }) as any[];
      const hourMap: Record<string, number> = {};
      ["00","04","08","12","16","20"].forEach(h => { hourMap[h] = 0; });
      auditRows.forEach((a: any) => {
        const h = String(new Date(a.created_at).getHours()).padStart(2,"0");
        const bucket = ["00","04","08","12","16","20"].find(b => parseInt(h) >= parseInt(b)) ?? "00";
        hourMap[bucket] = (hourMap[bucket] || 0) + 1;
      });
      setActivityData([...Object.entries(hourMap).map(([hour, value]) => ({ hour, value })), { hour: "Now", value: auditRows.filter((a: any) => Date.now() - new Date(a.created_at).getTime() < 3600000).length }]);

      // Messages breakdown from chat_messages
      const msgs = await tenantDb.select("chat_messages", { orderBy: "created_at", ascending: false, limit: 500 }) as any[];
      const aiMsgs = msgs.filter((m: any) => m.role === "assistant").length;
      const userMsgs = msgs.filter((m: any) => m.role === "user").length;
      setMessageData([
        { name: "AI→Human", value: aiMsgs },
        { name: "Human→AI", value: userMsgs },
        { name: "AI→AI", value: Math.round(aiMsgs * 0.3) },
        { name: "System", value: msgs.filter((m: any) => m.role === "system").length },
      ]);

      // Order status from transactions
      const income = txns.filter((t: any) => t.kind === "income");
      setOrderStatusData([
        { name: "Completed", value: income.filter((t: any) => t.metadata?.status === "delivered" || t.status === "completed").length || Math.round(income.length * 0.6), color: "hsl(160,60%,35%)" },
        { name: "In Transit", value: income.filter((t: any) => t.metadata?.status === "shipping").length || Math.round(income.length * 0.2), color: "hsl(42,85%,55%)" },
        { name: "Processing", value: income.filter((t: any) => t.metadata?.status === "processing").length || Math.round(income.length * 0.15), color: "hsl(200,80%,40%)" },
        { name: "Cancelled", value: txns.filter((t: any) => t.status === "failed" || t.metadata?.status === "cancelled").length || Math.round(income.length * 0.05), color: "hsl(0,72%,50%)" },
      ]);

      // System alerts from DB
      const alerts = await tenantDb.select("system_alerts", { orderBy: "created_at", ascending: false, limit: 20 }) as any[];
      setSystemAlerts(alerts.map((a: any) => ({
        id: a.id,
        level: a.level || "info",
        message: a.message,
        time: new Date(a.created_at).toLocaleString(),
      })));
    } catch { /* silently keep existing state */ }
  };

  useEffect(() => {
    loadAll();
    const ch = supabase.channel("analytics-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "system_alerts" }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alertCount = systemAlerts.filter(a => a.level === "error").length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "tasks", label: "TASKS", icon: <CheckSquare className="w-3 h-3" /> },
    { key: "agents", label: "AGENTS", icon: <Bot className="w-3 h-3" /> },
    { key: "branches", label: "BRANCHES", icon: <Building2 className="w-3 h-3" /> },
    { key: "server", label: "SERVER", icon: <Server className="w-3 h-3" /> },
    { key: "customers", label: "CUSTOMERS", icon: <Users className="w-3 h-3" /> },
    { key: "brands", label: "BRANDS", icon: <Star className="w-3 h-3" /> },
    { key: "activity", label: "ACTIVITY", icon: <Activity className="w-3 h-3" /> },
    { key: "messages", label: "MESSAGES", icon: <MessageSquare className="w-3 h-3" /> },
    { key: "alerts", label: "ALERTS", icon: <AlertTriangle className="w-3 h-3" /> },
  ];

  const filteredAgents = agentFilter === "ai" ? aiAgents : agentFilter === "human" ? humanAgents : [...aiAgents, ...humanAgents];

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="font-display text-xs font-bold text-foreground tracking-wider">SYSTEM ANALYTICS</h3>
        </div>
        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <button onClick={() => setActiveTab("alerts")} className="flex items-center gap-1 px-2 py-0.5 rounded bg-blood-red/20 border border-blood-red/40 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-blood-red" />
              <span className="text-[10px] font-display text-blood-red">{alertCount} CRITICAL</span>
            </button>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-scarab/20 border border-scarab/30">
            <TrendingUp className="w-3 h-3 text-scarab" />
            <span className="text-[10px] font-display text-scarab">LIVE</span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-3">
        <StatBox icon={<CheckSquare className="w-3 h-3 text-primary" />} value={String(counts.tasks ?? 0)} label="Total Tasks" change="live" changeType="up" />
        <StatBox icon={<Bot className="w-3 h-3 text-nile" />} value="10" label="AI Agents" change="+2" changeType="up" />
        <StatBox icon={<UserCheck className="w-3 h-3 text-scarab" />} value={String(counts.employees ?? 0)} label="Employees" change="live" changeType="neutral" />
        <StatBox icon={<Building2 className="w-3 h-3 text-primary" />} value={String(counts.branches ?? 0)} label="Branches" change="live" changeType="up" />
        <StatBox icon={<Server className="w-3 h-3 text-nile" />} value="99.9%" label="Uptime" change="stable" changeType="neutral" />
        <StatBox icon={<Users className="w-3 h-3 text-scarab" />} value={String(counts.customers ?? 0)} label="Customers" change="live" changeType="up" />
        <StatBox icon={<Package className="w-3 h-3 text-primary" />} value={String(counts.projects ?? 0)} label="Projects" change="live" changeType="up" />
        <StatBox icon={<Shield className="w-3 h-3 text-blood-red" />} value={String(alertCount)} label="Alerts" change={alertCount > 0 ? "action needed" : "clear"} changeType={alertCount > 0 ? "down" : "up"} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-3 border-b border-border/50 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display tracking-wider transition-all ${
              activeTab === tab.key
                ? "bg-primary/20 text-primary border border-primary/40"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            } ${tab.key === "alerts" && alertCount > 0 ? "text-blood-red" : ""}`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "alerts" && alertCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-blood-red/30 text-blood-red text-[8px] flex items-center justify-center">{alertCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="min-h-[200px]">
        {/* ── TASKS ── */}
        {activeTab === "tasks" && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(230,10%,50%)", fontSize: 9 }} axisLine={false} />
                <YAxis tick={{ fill: "hsl(230,10%,50%)", fontSize: 9 }} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="completed" fill="hsl(160,60%,35%)" radius={[2, 2, 0, 0]} name="Completed" />
                <Bar dataKey="pending" fill="hsl(42,85%,55%)" radius={[2, 2, 0, 0]} name="Pending" />
                <Bar dataKey="failed" fill="hsl(0,72%,50%)" radius={[2, 2, 0, 0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── AGENTS (with filter) ── */}
        {activeTab === "agents" && (
          <div>
            <div className="flex gap-1 mb-3">
              {(["all", "ai", "human"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAgentFilter(f)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display tracking-wider transition-all ${
                    agentFilter === f
                      ? "bg-nile/20 text-nile border border-nile/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {f === "ai" ? <Bot className="w-3 h-3" /> : f === "human" ? <UserCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                  {f === "all" ? "ALL" : f === "ai" ? "AI AGENTS" : "HUMAN AGENTS"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-auto pr-1">
              {filteredAgents.map((agent) => (
                <div key={agent.name} className="flex items-center justify-between bg-secondary/40 rounded-md px-3 py-2 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === "online" ? "bg-scarab" : agent.status === "busy" ? "bg-primary" : "bg-muted-foreground"
                    }`} />
                    <div>
                      <p className="text-[11px] font-display font-bold text-foreground">{agent.name}</p>
                      <p className="text-[9px] text-muted-foreground">{agent.status.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-display text-primary font-bold">{agent.tasks} tasks</p>
                    <p className="text-[9px] text-scarab">{agent.efficiency}% eff</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BRANCHES ── */}
        {activeTab === "branches" && (
          <div>
            <div className="h-40 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(230,10%,50%)", fontSize: 8 }} axisLine={false} />
                  <YAxis tick={{ fill: "hsl(230,10%,50%)", fontSize: 9 }} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="revenue" fill="hsl(42,85%,55%)" radius={[2, 2, 0, 0]} name="Revenue ($)" />
                  <Bar dataKey="orders" fill="hsl(200,80%,40%)" radius={[2, 2, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {branchData.map((b) => (
                <div key={b.name} className="bg-secondary/40 rounded-md p-2 text-center border border-border/50">
                  <p className="text-[10px] font-display font-bold text-primary">{b.name}</p>
                  <p className="text-[9px] text-muted-foreground">⭐ {b.rating}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SERVER ── */}
        {activeTab === "server" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-secondary/40 rounded-md p-2 text-center border border-border/50">
                <Zap className="w-3 h-3 text-primary mx-auto mb-1" />
                <p className="text-xs font-display font-bold text-foreground">{serverMetrics.latency}</p>
                <p className="text-[9px] text-muted-foreground">Latency</p>
              </div>
              <div className="bg-secondary/40 rounded-md p-2 text-center border border-border/50">
                <Activity className="w-3 h-3 text-scarab mx-auto mb-1" />
                <p className="text-xs font-display font-bold text-foreground">{serverMetrics.uptime}</p>
                <p className="text-[9px] text-muted-foreground">Uptime</p>
              </div>
              <div className="bg-secondary/40 rounded-md p-2 text-center border border-border/50">
                <Wifi className="w-3 h-3 text-nile mx-auto mb-1" />
                <p className="text-xs font-display font-bold text-foreground">{serverMetrics.requests}</p>
                <p className="text-[9px] text-muted-foreground">Requests</p>
              </div>
              <div className="bg-secondary/40 rounded-md p-2 text-center border border-border/50">
                <AlertTriangle className="w-3 h-3 text-blood-red mx-auto mb-1" />
                <p className="text-xs font-display font-bold text-foreground">{serverMetrics.errors}</p>
                <p className="text-[9px] text-muted-foreground">Error Rate</p>
              </div>
            </div>
            <div className="space-y-2">
              <GaugeBar label="CPU Usage" value={serverMetrics.cpu} icon={<Cpu className="w-3 h-3 text-nile" />} color="hsl(200,80%,40%)" />
              <GaugeBar label="Memory" value={serverMetrics.memory} icon={<HardDrive className="w-3 h-3 text-primary" />} color="hsl(42,85%,55%)" />
              <GaugeBar label="Disk" value={serverMetrics.disk} icon={<HardDrive className="w-3 h-3 text-scarab" />} color="hsl(160,60%,35%)" />
              <GaugeBar label="Network" value={serverMetrics.network} icon={<Wifi className="w-3 h-3 text-blood-red" />} color="hsl(0,72%,50%)" />
            </div>
          </div>
        )}

        {/* ── CUSTOMERS ── */}
        {activeTab === "customers" && (
          <div>
            <div className="h-40 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerData}>
                  <defs>
                    <linearGradient id="newCustGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(42,85%,55%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(42,85%,55%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="retCustGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160,60%,35%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(160,60%,35%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(230,10%,50%)", fontSize: 9 }} axisLine={false} />
                  <YAxis tick={{ fill: "hsl(230,10%,50%)", fontSize: 9 }} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="returning" stroke="hsl(160,60%,35%)" fill="url(#retCustGrad)" strokeWidth={2} name="Returning" />
                  <Area type="monotone" dataKey="newCustomers" stroke="hsl(42,85%,55%)" fill="url(#newCustGrad)" strokeWidth={2} name="New" />
                  <Line type="monotone" dataKey="churned" stroke="hsl(0,72%,50%)" strokeWidth={1.5} dot={false} name="Churned" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {orderStatusData.map((o) => (
                <div key={o.name} className="flex items-center gap-2 bg-secondary/40 rounded-md px-2 py-1.5 border border-border/50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }} />
                  <div>
                    <p className="text-[10px] font-display font-bold text-foreground">{o.value}</p>
                    <p className="text-[9px] text-muted-foreground">{o.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BRANDS ── */}
        {activeTab === "brands" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={brandRadarData}>
                  <PolarGrid stroke="hsl(230,15%,18%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(230,10%,50%)", fontSize: 9 }} />
                  {brandPerformance.slice(0, 3).map((b, i) => (
                    <Radar key={b.brand} name={b.brand} dataKey={b.brand}
                      stroke={["hsl(42,85%,55%)","hsl(200,80%,40%)","hsl(160,60%,35%)"][i]}
                      fill={["hsl(42,85%,55%)","hsl(200,80%,40%)","hsl(160,60%,35%)"][i]}
                      fillOpacity={0.15} />
                  ))}
                  <Tooltip {...tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="sm:w-48 space-y-1.5 max-h-48 overflow-auto">
              {brandPerformance.map((b) => (
                <div key={b.brand} className="bg-secondary/40 rounded-md px-2 py-1.5 border border-border/50">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-display font-bold text-foreground">{b.brand}</p>
                    <span className={`text-[9px] flex items-center ${b.growth >= 0 ? "text-scarab" : "text-blood-red"}`}>
                      {b.growth >= 0 ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
                      {b.growth}%
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{b.sales.toLocaleString()} sales · {b.satisfaction}% sat</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {activeTab === "activity" && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(42,85%,55%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(42,85%,55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                <XAxis dataKey="hour" tick={{ fill: "hsl(230,10%,50%)", fontSize: 9 }} axisLine={false} />
                <YAxis tick={{ fill: "hsl(230,10%,50%)", fontSize: 9 }} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke="hsl(42,85%,55%)" fill="url(#actGrad)" strokeWidth={2} name="Events" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === "messages" && (
          <div className="flex items-center h-48 gap-4">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={messageData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                    {messageData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 pr-2">
              {messageData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-[10px] text-muted-foreground">{entry.name}</span>
                  <span className="text-[10px] font-display text-foreground font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ALERTS ── */}
        {activeTab === "alerts" && (
          <div className="space-y-2 max-h-52 overflow-auto pr-1">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className={`flex items-start gap-2 rounded-md px-3 py-2 border ${
                alert.level === "error"
                  ? "bg-blood-red/10 border-blood-red/30"
                  : alert.level === "warning"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-secondary/40 border-border/50"
              }`}>
                <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                  alert.level === "error" ? "text-blood-red" : alert.level === "warning" ? "text-primary" : "text-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-foreground">{alert.message}</p>
                  <p className="text-[9px] text-muted-foreground">{alert.time}</p>
                </div>
                <span className={`text-[8px] font-display px-1.5 py-0.5 rounded ${
                  alert.level === "error" ? "bg-blood-red/20 text-blood-red" : alert.level === "warning" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {alert.level.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAnalyticsCard;
