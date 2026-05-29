import { useState, useEffect } from "react";
import { countsApi } from "@/services/system";
import { supabase } from "@/integrations/supabase/client";
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

// ── Data ──────────────────────────────────────────────────────────────
const taskData = [
  { name: "Mon", completed: 24, pending: 8, failed: 3 },
  { name: "Tue", completed: 30, pending: 5, failed: 2 },
  { name: "Wed", completed: 18, pending: 12, failed: 5 },
  { name: "Thu", completed: 35, pending: 6, failed: 1 },
  { name: "Fri", completed: 28, pending: 9, failed: 4 },
  { name: "Sat", completed: 15, pending: 3, failed: 1 },
  { name: "Sun", completed: 12, pending: 4, failed: 2 },
];

const aiAgents = [
  { name: "ANUBIS", tasks: 45, efficiency: 92, status: "online" },
  { name: "HORUS", tasks: 38, efficiency: 88, status: "online" },
  { name: "THOTH", tasks: 52, efficiency: 95, status: "online" },
  { name: "BASTET", tasks: 30, efficiency: 85, status: "busy" },
  { name: "RA", tasks: 41, efficiency: 90, status: "offline" },
];

const humanAgents = [
  { name: "AHMED", tasks: 22, efficiency: 78, status: "online" },
  { name: "SARA", tasks: 18, efficiency: 82, status: "online" },
  { name: "OMAR", tasks: 25, efficiency: 75, status: "busy" },
  { name: "NOUR", tasks: 15, efficiency: 88, status: "offline" },
  { name: "YOUSSEF", tasks: 20, efficiency: 80, status: "online" },
];

const activityData = [
  { hour: "00", value: 12 }, { hour: "04", value: 8 }, { hour: "08", value: 35 },
  { hour: "12", value: 62 }, { hour: "16", value: 55 }, { hour: "20", value: 40 },
  { hour: "Now", value: 48 },
];

const messageData = [
  { name: "AI→AI", value: 340 },
  { name: "AI→Human", value: 220 },
  { name: "Human→AI", value: 180 },
  { name: "Human→Human", value: 90 },
];

const branchData = [
  { name: "Cairo HQ", revenue: 85000, orders: 342, rating: 4.8 },
  { name: "Alexandria", revenue: 62000, orders: 256, rating: 4.5 },
  { name: "Luxor", revenue: 45000, orders: 189, rating: 4.7 },
  { name: "Aswan", revenue: 38000, orders: 145, rating: 4.3 },
  { name: "Giza", revenue: 71000, orders: 298, rating: 4.6 },
];

const serverMetrics = {
  cpu: 42, memory: 68, disk: 55, network: 92, uptime: "99.97%", latency: "12ms",
  requests: "24.5K/hr", errors: "0.03%",
};

const customerData = [
  { month: "Jan", newCustomers: 120, returning: 340, churned: 15 },
  { month: "Feb", newCustomers: 145, returning: 360, churned: 12 },
  { month: "Mar", newCustomers: 160, returning: 380, churned: 18 },
  { month: "Apr", newCustomers: 180, returning: 410, churned: 10 },
  { month: "May", newCustomers: 200, returning: 430, churned: 8 },
  { month: "Jun", newCustomers: 220, returning: 460, churned: 14 },
];

const orderStatusData = [
  { name: "Delivered", value: 580, color: "hsl(160,60%,35%)" },
  { name: "In Transit", value: 230, color: "hsl(42,85%,55%)" },
  { name: "Processing", value: 120, color: "hsl(200,80%,40%)" },
  { name: "Cancelled", value: 35, color: "hsl(0,72%,50%)" },
];

const brandPerformance = [
  { brand: "Pharaoh Gold", sales: 4200, growth: 15, satisfaction: 92 },
  { brand: "Nile Silver", sales: 3800, growth: 8, satisfaction: 88 },
  { brand: "Sphinx Premium", sales: 3200, growth: 22, satisfaction: 95 },
  { brand: "Ankh Basic", sales: 5100, growth: -3, satisfaction: 78 },
  { brand: "Ra Elite", sales: 2900, growth: 35, satisfaction: 91 },
];

const brandRadarData = [
  { metric: "Sales", "Pharaoh Gold": 85, "Nile Silver": 75, "Sphinx Premium": 65 },
  { metric: "Growth", "Pharaoh Gold": 60, "Nile Silver": 45, "Sphinx Premium": 80 },
  { metric: "Satisfaction", "Pharaoh Gold": 92, "Nile Silver": 88, "Sphinx Premium": 95 },
  { metric: "Reach", "Pharaoh Gold": 70, "Nile Silver": 80, "Sphinx Premium": 55 },
  { metric: "Loyalty", "Pharaoh Gold": 78, "Nile Silver": 72, "Sphinx Premium": 90 },
];

const systemAlerts = [
  { id: 1, level: "error", message: "High memory usage on Server Node 3 (92%)", time: "2 min ago" },
  { id: 2, level: "warning", message: "API response time exceeding 500ms threshold", time: "8 min ago" },
  { id: 3, level: "warning", message: "Agent BASTET response rate dropped to 65%", time: "15 min ago" },
  { id: 4, level: "info", message: "Scheduled backup completed successfully", time: "32 min ago" },
  { id: 5, level: "error", message: "Failed login attempts spike from IP 192.168.x.x", time: "45 min ago" },
  { id: 6, level: "warning", message: "Branch Aswan offline for 5 minutes", time: "1 hr ago" },
];

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

const SystemAnalyticsCard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [agentFilter, setAgentFilter] = useState<"all" | "ai" | "human">("all");
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = () => countsApi.all().then(setCounts).catch(() => {});
    load();
    const ch = supabase.channel("analytics-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
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
                  <Radar name="Pharaoh Gold" dataKey="Pharaoh Gold" stroke="hsl(42,85%,55%)" fill="hsl(42,85%,55%)" fillOpacity={0.15} />
                  <Radar name="Nile Silver" dataKey="Nile Silver" stroke="hsl(200,80%,40%)" fill="hsl(200,80%,40%)" fillOpacity={0.15} />
                  <Radar name="Sphinx Premium" dataKey="Sphinx Premium" stroke="hsl(160,60%,35%)" fill="hsl(160,60%,35%)" fillOpacity={0.15} />
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
