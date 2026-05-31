import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit, Trash2, UserCheck, Users, DollarSign,
  Search, TrendingUp, Award, Activity, ChevronDown, ChevronUp, BarChart2
} from "lucide-react";
import { useEntities } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import ApiIntegrationStatus from "@/components/dashboard/ApiIntegrationStatus";
import EntityFileUpload from "@/components/shared/EntityFileUpload";
import EntityApiHub from "@/components/shared/EntityApiHub";
import StaffMetrics from "@/components/shared/StaffMetrics";
import ResponsiblePerson, { summarizeKeyPersons } from "@/components/shared/ResponsiblePerson";
import ExportButton from "@/components/shared/ExportButton";
import { SavedViews } from "@/components/shared/SavedViews";
import { extApi } from "@/services/extended";

type DocFile = { id: string; name: string; category: string };
type Affiliate = {
  id: string; name: string; code: string; commission: string;
  referrals: number; status: "Active" | "Inactive"; region: string;
  email: string; phone: string; notes: string; responsiblePerson: string;
  humanCount: number; aiCount: number; files: DocFile[];
};
type Agent = {
  id: string; agent_name: string; commission_rate: number;
  total_sales: number; status: string; affiliate_id: string; notes: string;
};

const emptyAffiliate: Omit<Affiliate, "id"> = {
  name: "", code: "", commission: "", referrals: 0, status: "Active",
  region: "", email: "", phone: "", notes: "", responsiblePerson: "",
  humanCount: 0, aiCount: 0, files: [],
};
const emptyAgent: Omit<Agent, "id"> = {
  agent_name: "", commission_rate: 0.05, total_sales: 0,
  status: "active", affiliate_id: "", notes: "",
};
const statusToDb = (s: string) => s === "Active" ? "active" : "inactive";

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, color = "primary" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "border-primary text-primary",   blue:    "border-blue-500 text-blue-400",
    emerald: "border-emerald-500 text-emerald-400", amber:   "border-amber-500 text-amber-400",
    violet:  "border-violet-500 text-violet-400",   rose:    "border-rose-500 text-rose-400",
  };
  const cls = colorMap[color] ?? colorMap.primary;
  return (
    <Card className={`border-l-4 ${cls}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`w-8 h-8 opacity-70 ${cls.split(" ")[1]}`} />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Commission Bar ─────────────────────────────────────────────────────── */
function CommissionBar({ rate }: { rate: number }) {
  const pct = Math.min((rate || 0) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono">{pct.toFixed(1)}%</span>
    </div>
  );
}

const Affiliates = () => {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("affiliates");
  const items: Affiliate[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyAffiliate,
    ...(r.data as any),
    name:              (r as any).name              ?? (r.data as any)?.name              ?? "",
    code:              (r as any).code              ?? (r.data as any)?.code              ?? "",
    commission:        (r as any).commission        ?? (r.data as any)?.commission        ?? "",
    referrals:         (r as any).referrals         ?? (r.data as any)?.referrals         ?? 0,
    region:            (r as any).region            ?? (r.data as any)?.region            ?? "",
    email:             (r as any).email             ?? (r.data as any)?.email             ?? "",
    phone:             (r as any).phone             ?? (r.data as any)?.phone             ?? "",
    notes:             (r as any).notes             ?? (r.data as any)?.notes             ?? "",
    humanCount:        (r as any).human_count       ?? (r.data as any)?.humanCount        ?? 0,
    aiCount:           (r as any).ai_count          ?? (r.data as any)?.aiCount           ?? 0,
    responsiblePerson: (r as any).responsible_person ?? (r.data as any)?.responsiblePerson ?? "",
    status:   (r as any).status === "inactive" ? "Inactive" : ((r.data as any)?.status ?? "Active"),
  })), [rows]);

  /* ── Agents data ── */
  const [agents, setAgents] = useState<Agent[]>([]);
  const loadAgents = () =>
    extApi.list("affiliated_agents", { order: "id" })
      .then(d => setAgents(d as Agent[]))
      .catch(() => {});
  useEffect(() => { loadAgents(); }, []);

  /* ── KPIs ── */
  const activeAffiliates = items.filter(a => a.status === "Active").length;
  const activeAgents     = agents.filter(a => a.status === "active").length;
  const totalSales       = agents.reduce((s, a) => s + (a.total_sales || 0), 0);
  const totalCommission  = agents.reduce((s, a) => s + (a.total_sales || 0) * (a.commission_rate || 0), 0);
  const totalReferrals   = items.reduce((s, a) => s + (a.referrals || 0), 0);
  const topAffiliate     = [...items].sort((a, b) => b.referrals - a.referrals)[0];

  /* ── Helpers ── */
  const affiliateName = (id: string) => items.find(a => a.id === id)?.name ?? (id ? "Unknown" : "—");
  const agentCountFor = (affiliateId: string) => agents.filter(a => a.affiliate_id === affiliateId).length;

  /* ── Affiliates form state ── */
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [detailId,   setDetailId]   = useState<string | null>(null);
  const [statusFilter, setStatusFilter]           = useState("all");
  const [affiliateSearch, setAffiliateSearch]     = useState("");
  const [expandedAffiliate, setExpandedAffiliate] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Affiliate, "id">>(emptyAffiliate);

  const resetForm = () => { setForm(emptyAffiliate); setEditId(null); };
  const openEdit  = (a: Affiliate) => { const { id, ...rest } = a; setForm(rest); setEditId(a.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = {
      name:               form.name,
      status:             statusToDb(form.status),
      code:               form.code               || null,
      commission:         form.commission         || null,
      referrals:          form.referrals          || 0,
      region:             form.region             || null,
      email:              form.email              || null,
      phone:              form.phone              || null,
      notes:              form.notes              || null,
      human_count:        form.humanCount         || 0,
      ai_count:           form.aiCount            || 0,
      responsible_person: form.responsiblePerson  || null,
      data:               form,
    };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else { await create(payload); toast.success("Created"); }
    setShowForm(false); resetForm();
  };

  const filteredAffiliates = useMemo(() => {
    let list = statusFilter === "all" ? items : items.filter(a => a.status === statusFilter);
    if (affiliateSearch.trim())
      list = list.filter(a =>
        a.name.toLowerCase().includes(affiliateSearch.toLowerCase()) ||
        a.code.toLowerCase().includes(affiliateSearch.toLowerCase()) ||
        a.region.toLowerCase().includes(affiliateSearch.toLowerCase())
      );
    return list;
  }, [items, statusFilter, affiliateSearch]);

  /* ── Agents form state ── */
  const [agentOpen,      setAgentOpen]    = useState(false);
  const [agentEditId,    setAgentEditId]  = useState<string | null>(null);
  const [agentSearch,    setAgentSearch]  = useState("");
  const [agentStatus,    setAgentStatus]  = useState("all");
  const [agentAffFilter, setAgentAffFilter] = useState("all");
  const [agentForm, setAgentForm] = useState<Omit<Agent, "id">>(emptyAgent);

  const openAgentEdit = (a: Agent) => {
    const { id, ...rest } = a;
    setAgentForm(rest); setAgentEditId(a.id); setAgentOpen(true);
  };
  const openAgentNew = (defaultAffiliate = "") => {
    setAgentEditId(null);
    setAgentForm({ ...emptyAgent, affiliate_id: defaultAffiliate });
    setAgentOpen(true);
  };
  const saveAgent = async () => {
    if (!agentForm.agent_name.trim()) { toast.error("Agent name required"); return; }
    try {
      if (agentEditId) await extApi.update("affiliated_agents", agentEditId, agentForm);
      else await extApi.create("affiliated_agents", agentForm);
      toast.success("Saved"); setAgentOpen(false); setAgentEditId(null);
      loadAgents();
    } catch (e: any) { toast.error(e.message); }
  };
  const removeAgent = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    await extApi.remove("affiliated_agents", id);
    toast.success("Deleted"); loadAgents();
  };

  const filteredAgents = useMemo(() => {
    let list = agents;
    if (agentStatus !== "all") list = list.filter(a => a.status === agentStatus);
    if (agentAffFilter !== "all") list = list.filter(a => a.affiliate_id === agentAffFilter);
    if (agentSearch.trim())
      list = list.filter(a =>
        a.agent_name.toLowerCase().includes(agentSearch.toLowerCase()) ||
        affiliateName(a.affiliate_id).toLowerCase().includes(agentSearch.toLowerCase())
      );
    return list;
  }, [agents, agentStatus, agentAffFilter, agentSearch, items]);

  /* ── Commission rows (per affiliate) ── */
  const commissionRows = useMemo(() =>
    items.map(af => {
      const linked = agents.filter(a => a.affiliate_id === af.id);
      const sales  = linked.reduce((s, a) => s + (a.total_sales || 0), 0);
      const owed   = linked.reduce((s, a) => s + (a.total_sales || 0) * (a.commission_rate || 0), 0);
      return { ...af, agentCount: linked.length, totalSales: sales, commissionOwed: owed };
    }).sort((a, b) => b.commissionOwed - a.commissionOwed),
  [items, agents]);

  const detail = detailId ? items.find(a => a.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10"><UserCheck className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="font-display text-xl text-primary">AFFILIATES HUB</h1>
            <p className="text-xs text-muted-foreground">Manage affiliates, linked agents, and commission tracking</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <KpiCard icon={UserCheck}  label="Affiliates"      value={items.length}                         sub={`${activeAffiliates} active`}  color="primary"  />
          <KpiCard icon={Users}      label="Agents"          value={agents.length}                        sub={`${activeAgents} active`}      color="blue"     />
          <KpiCard icon={TrendingUp} label="Total Sales"     value={`$${totalSales.toLocaleString()}`}    sub="all agents"                    color="emerald"  />
          <KpiCard icon={DollarSign} label="Commission Owed" value={`$${totalCommission.toFixed(0)}`}     sub="pending payout"                color="amber"    />
          <KpiCard icon={Activity}   label="Total Referrals" value={totalReferrals}                       sub="from affiliates"               color="violet"   />
          <KpiCard icon={Award}      label="Top Region"      value={topAffiliate?.region || "—"}          sub={topAffiliate?.name || ""}      color="rose"     />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4 max-w-xl mb-5">
            <TabsTrigger value="overview"><BarChart2 className="w-3.5 h-3.5 mr-1"/>Overview</TabsTrigger>
            <TabsTrigger value="affiliates"><UserCheck className="w-3.5 h-3.5 mr-1"/>Affiliates ({items.length})</TabsTrigger>
            <TabsTrigger value="agents"><Users className="w-3.5 h-3.5 mr-1"/>Agents ({agents.length})</TabsTrigger>
            <TabsTrigger value="commissions"><DollarSign className="w-3.5 h-3.5 mr-1"/>Commissions</TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════ OVERVIEW ══ */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display flex items-center gap-2"><Award className="w-4 h-4 text-amber-400"/>Top Affiliates by Referrals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...items].sort((a, b) => b.referrals - a.referrals).slice(0, 5).map((a, i) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1"><span className="font-medium">{a.name}</span><span className="text-primary">{a.referrals}</span></div>
                        <div className="w-full h-1.5 bg-secondary rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((a.referrals / ([...items].sort((x,y)=>y.referrals-x.referrals)[0]?.referrals || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No affiliates yet</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400"/>Top Agents by Sales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...agents].sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0)).slice(0, 5).map((a, i) => {
                    const maxS = [...agents].sort((x, y) => (y.total_sales || 0) - (x.total_sales || 0))[0]?.total_sales || 1;
                    return (
                      <div key={a.id} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1"><span className="font-medium">{a.agent_name}</span><span className="text-emerald-400">${(a.total_sales || 0).toLocaleString()}</span></div>
                          <div className="w-full h-1.5 bg-secondary rounded-full">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(((a.total_sales || 0) / maxS) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {agents.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No agents yet</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400"/>Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Affiliates</p>
                      <div className="flex justify-between text-xs"><span className="text-emerald-400">● Active</span><span className="font-bold">{activeAffiliates}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">● Inactive</span><span>{items.length - activeAffiliates}</span></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Agents</p>
                      <div className="flex justify-between text-xs"><span className="text-emerald-400">● Active</span><span className="font-bold">{activeAgents}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-amber-400">● Inactive</span><span>{agents.filter(a => a.status === "inactive").length}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-rose-400">● Suspended</span><span>{agents.filter(a => a.status === "suspended").length}</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-400"/>Commission Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-border pb-2"><span className="text-muted-foreground">Total Sales Volume</span><span className="font-bold text-emerald-400">${totalSales.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm border-b border-border pb-2"><span className="text-muted-foreground">Commission Owed</span><span className="font-bold text-amber-400">${totalCommission.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm border-b border-border pb-2"><span className="text-muted-foreground">Avg Commission Rate</span><span className="font-bold">{agents.length > 0 ? `${(agents.reduce((s,a)=>s+(a.commission_rate||0),0)/agents.length*100).toFixed(1)}%` : "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Unlinked Agents</span><span className={agents.filter(a=>!a.affiliate_id).length>0?"text-amber-400 font-bold":""}>{agents.filter(a=>!a.affiliate_id).length}</span></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═════════════════════════════════ AFFILIATES ══ */}
          <TabsContent value="affiliates">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground"/>
                <Input placeholder="Search affiliates…" className="pl-9 h-8 text-xs" value={affiliateSearch} onChange={e=>setAffiliateSearch(e.target.value)}/>
              </div>
              <ExportButton data={filteredAffiliates as any[]} filename="affiliates" title="Affiliates" />
              <SavedViews page="affiliates" currentFilters={{ statusFilter }} onApply={(f) => setStatusFilter(f.statusFilter ?? "all")} />
              <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4"/> Add Affiliate</Button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {["all","Active","Inactive"].map(s => (
                <button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${statusFilter===s?"bg-primary/20 text-primary border border-primary/30":"text-muted-foreground border border-transparent"}`}>{s==="all"?"All":s}</button>
              ))}
              <div className="ml-auto flex gap-3 text-xs font-display">
                <span>👤 {items.reduce((a,x)=>a+x.humanCount,0)} Human</span>
                <span className="text-blue-400">🤖 {items.reduce((a,x)=>a+x.aiCount,0)} AI</span>
              </div>
            </div>
            <div className="space-y-3">
              {filteredAffiliates.map(a => {
                const isExpanded   = expandedAffiliate === a.id;
                const linkedAgents = agents.filter(ag => ag.affiliate_id === a.id);
                return (
                  <div key={a.id} className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
                    <div className="p-4 cursor-pointer" onClick={()=>setDetailId(a.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-sm">{a.name}</h3>
                            {agentCountFor(a.id) > 0 && <Badge variant="outline" className="text-[9px] px-1.5">{agentCountFor(a.id)} agent{agentCountFor(a.id)>1?"s":""}</Badge>}
                          </div>
                          {a.responsiblePerson && <p className="text-[10px] text-primary mt-0.5">Key Person: {summarizeKeyPersons(a.responsiblePerson)}</p>}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">{a.code}</span>
                            <span className="text-xs text-emerald-400 font-display">{a.commission}</span>
                            <span className="text-xs text-muted-foreground">{a.referrals} referrals</span>
                            {a.region && <span className="text-xs text-muted-foreground">{a.region}</span>}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.status==="Active"?"bg-emerald-500/20 text-emerald-400":"bg-muted text-muted-foreground"}`}>{a.status}</span>
                          </div>
                          {a.email && <p className="text-[10px] text-muted-foreground mt-1">{a.email}{a.phone&&` • ${a.phone}`}</p>}
                          <div className="mt-2"><StaffMetrics humanCount={a.humanCount} aiCount={a.aiCount}/></div>
                        </div>
                        <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                          {linkedAgents.length > 0 && (
                            <button onClick={()=>setExpandedAffiliate(isExpanded?null:a.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10">
                              {isExpanded?<ChevronUp className="w-3.5 h-3.5"/>:<ChevronDown className="w-3.5 h-3.5"/>}
                            </button>
                          )}
                          <button onClick={()=>openEdit(a)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5"/></button>
                          <button onClick={()=>setDeleteId(a.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && linkedAgents.length > 0 && (
                      <div className="border-t border-border bg-secondary/30 px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">Linked Agents ({linkedAgents.length})</p>
                          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={()=>openAgentNew(a.id)}><Plus className="w-3 h-3 mr-1"/>Add Agent</Button>
                        </div>
                        <div className="space-y-1.5">
                          {linkedAgents.map(ag=>(
                            <div key={ag.id} className="flex items-center justify-between text-xs bg-card rounded-md px-3 py-1.5 gap-2">
                              <span className="font-medium w-28 truncate">{ag.agent_name}</span>
                              <CommissionBar rate={ag.commission_rate||0}/>
                              <span className="text-emerald-400 w-20 text-right font-mono">${(ag.total_sales||0).toLocaleString()}</span>
                              <Badge variant={ag.status==="active"?"default":"secondary"} className="text-[9px]">{ag.status}</Badge>
                              <div className="flex gap-1 ml-1">
                                <button onClick={()=>openAgentEdit(ag)} className="p-1 rounded hover:bg-primary/10"><Edit className="w-3 h-3 text-muted-foreground"/></button>
                                <button onClick={()=>removeAgent(ag.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-destructive"/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredAffiliates.length===0 && <p className="text-center text-muted-foreground text-sm py-12">No affiliates found</p>}
            </div>
            <div className="mt-6"><ApiIntegrationStatus/></div>
          </TabsContent>

          {/* ══════════════════════════════════════ AGENTS ══ */}
          <TabsContent value="agents">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground"/>
                <Input placeholder="Search agents…" className="pl-9 h-8 text-xs" value={agentSearch} onChange={e=>setAgentSearch(e.target.value)}/>
              </div>
              <select value={agentStatus} onChange={e=>setAgentStatus(e.target.value)} className="h-8 text-xs rounded-md bg-secondary border border-border px-2 text-foreground">
                <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
              </select>
              <select value={agentAffFilter} onChange={e=>setAgentAffFilter(e.target.value)} className="h-8 text-xs rounded-md bg-secondary border border-border px-2 text-foreground max-w-[160px]">
                <option value="all">All Affiliates</option>
                {items.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <ExportButton data={filteredAgents as any[]} filename="affiliated-agents" title="Agents"/>
              <Button className="gap-1 font-display text-xs" onClick={()=>openAgentNew()}><Plus className="w-4 h-4"/>Add Agent</Button>
            </div>
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-[11px] font-display uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-3">Agent Name</th><th className="text-left p-3">Commission</th>
                    <th className="text-left p-3">Total Sales</th><th className="text-left p-3">Earned</th>
                    <th className="text-left p-3">Status</th><th className="text-left p-3">Parent Affiliate</th>
                    <th className="text-left p-3">Notes</th><th className="p-3"/>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.length===0
                    ? <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No agents found</td></tr>
                    : filteredAgents.map(a=>(
                    <tr key={a.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-semibold">{a.agent_name}</td>
                      <td className="p-3"><CommissionBar rate={a.commission_rate||0}/></td>
                      <td className="p-3 font-bold text-emerald-400 font-mono">${(a.total_sales||0).toLocaleString()}</td>
                      <td className="p-3 font-mono text-amber-400">${((a.total_sales||0)*(a.commission_rate||0)).toFixed(2)}</td>
                      <td className="p-3"><Badge variant={a.status==="active"?"default":a.status==="suspended"?"destructive":"secondary"} className="text-[10px]">{a.status||"active"}</Badge></td>
                      <td className="p-3 text-xs">{a.affiliate_id?<span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{affiliateName(a.affiliate_id)}</span>:<span className="text-muted-foreground">—</span>}</td>
                      <td className="p-3 text-xs text-muted-foreground max-w-[120px] truncate">{a.notes||"—"}</td>
                      <td className="p-3"><div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={()=>openAgentEdit(a)}><Edit className="w-3.5 h-3.5"/></Button>
                        <Button size="sm" variant="ghost" onClick={()=>removeAgent(a.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════ COMMISSIONS ══ */}
          <TabsContent value="commissions">
            <div className="flex justify-end mb-3">
              <ExportButton data={commissionRows as any[]} filename="commission-report" title="Commission Report"/>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Total Sales</p><p className="text-lg font-bold text-emerald-400">${commissionRows.reduce((s,r)=>s+r.totalSales,0).toLocaleString()}</p></Card>
              <Card className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Total Commission Owed</p><p className="text-lg font-bold text-amber-400">${commissionRows.reduce((s,r)=>s+r.commissionOwed,0).toFixed(2)}</p></Card>
              <Card className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Affiliates with Agents</p><p className="text-lg font-bold text-blue-400">{commissionRows.filter(r=>r.agentCount>0).length}</p></Card>
            </div>
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-[11px] font-display uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-3">Affiliate</th><th className="text-left p-3">Region</th>
                    <th className="text-left p-3">Agents</th><th className="text-left p-3">Total Sales</th>
                    <th className="text-left p-3">Commission Owed</th><th className="text-left p-3">Own Rate</th>
                    <th className="text-left p-3">Referrals</th><th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionRows.length===0
                    ? <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No data yet</td></tr>
                    : commissionRows.map(r=>(
                    <tr key={r.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-semibold">{r.name}</td>
                      <td className="p-3 text-xs text-muted-foreground">{r.region||"—"}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs">{r.agentCount}</span></td>
                      <td className="p-3 font-bold text-emerald-400 font-mono">${r.totalSales.toLocaleString()}</td>
                      <td className="p-3"><span className={`font-bold font-mono ${r.commissionOwed>0?"text-amber-400":"text-muted-foreground"}`}>${r.commissionOwed.toFixed(2)}</span></td>
                      <td className="p-3 text-xs text-primary">{r.commission||"—"}</td>
                      <td className="p-3">{r.referrals}</td>
                      <td className="p-3"><Badge variant={r.status==="Active"?"default":"secondary"} className="text-[10px]">{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
                {commissionRows.length>0 && (
                  <tfoot className="bg-secondary/40 font-bold text-xs border-t-2 border-border">
                    <tr>
                      <td className="p-3 font-display uppercase" colSpan={3}>Grand Total</td>
                      <td className="p-3 text-emerald-400 font-mono">${commissionRows.reduce((s,r)=>s+r.totalSales,0).toLocaleString()}</td>
                      <td className="p-3 text-amber-400 font-mono">${commissionRows.reduce((s,r)=>s+r.commissionOwed,0).toFixed(2)}</td>
                      <td className="p-3"/><td className="p-3">{commissionRows.reduce((s,r)=>s+r.referrals,0)}</td><td/>
                    </tr>
                  </tfoot>
                )}
              </table>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* ════════════════════════════════════ AGENT DIALOG ══ */}
      <Dialog open={agentOpen} onOpenChange={setAgentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{agentEditId?"Edit":"New"} Affiliated Agent</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Agent Name *</Label><Input value={agentForm.agent_name} onChange={e=>setAgentForm(p=>({...p,agent_name:e.target.value}))} placeholder="e.g. Agent Cairo-01"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Commission Rate</Label>
                <Input type="number" step="0.01" min="0" max="1" value={agentForm.commission_rate} onChange={e=>setAgentForm(p=>({...p,commission_rate:+e.target.value}))} placeholder="0.05 = 5%"/>
                <p className="text-[10px] text-muted-foreground mt-0.5">= {((agentForm.commission_rate||0)*100).toFixed(1)}%</p>
              </div>
              <div>
                <Label>Total Sales ($)</Label>
                <Input type="number" value={agentForm.total_sales} onChange={e=>setAgentForm(p=>({...p,total_sales:+e.target.value}))}/>
                {agentForm.total_sales>0&&<p className="text-[10px] text-amber-400 mt-0.5">Earns: ${((agentForm.total_sales||0)*(agentForm.commission_rate||0)).toFixed(2)}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <select value={agentForm.status} onChange={e=>setAgentForm(p=>({...p,status:e.target.value}))} className="w-full mt-1 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground">
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <Label>Parent Affiliate</Label>
                <select value={agentForm.affiliate_id} onChange={e=>setAgentForm(p=>({...p,affiliate_id:e.target.value}))} className="w-full mt-1 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground">
                  <option value="">— None —</option>
                  {items.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={agentForm.notes} onChange={e=>setAgentForm(p=>({...p,notes:e.target.value}))} rows={2}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setAgentOpen(false)}>Cancel</Button>
            <Button onClick={saveAgent}>Save Agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════ AFFILIATE FORM DIALOG ══ */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId?"Edit":"New"} Affiliate</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
            <ResponsiblePerson value={form.responsiblePerson} onChange={v=>setForm(p=>({...p,responsiblePerson:v}))}/>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2"><Label>Commission Rate</Label><Input value={form.commission} onChange={e=>setForm(p=>({...p,commission:e.target.value}))} placeholder="e.g. 10%" className="bg-secondary border-border text-foreground"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Region</Label><Input value={form.region} onChange={e=>setForm(p=>({...p,region:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value as Affiliate["status"]}))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Active</option><option>Inactive</option></select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Referrals</Label><Input type="number" min={0} value={form.referrals} onChange={e=>setForm(p=>({...p,referrals:+e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" min={0} value={form.humanCount} onChange={e=>setForm(p=>({...p,humanCount:+e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" min={0} value={form.aiCount} onChange={e=>setForm(p=>({...p,aiCount:+e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
            <EntityFileUpload files={form.files} onChange={files=>setForm(p=>({...p,files}))} ownerKind="affiliate" ownerId={editId||undefined}/>
            <EntityApiHub entityName={form.name||"New Affiliate"} ownerKind="affiliate" ownerId={editId||undefined}/>
          </div>
          <DialogFooter><Button onClick={handleSubmit} className="font-display text-xs">{editId?"Save":"Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════ DETAIL DIALOG ══ */}
      <Dialog open={!!detailId} onOpenChange={()=>setDetailId(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-primary flex items-center gap-2">
                  {detail.name}
                  <Badge variant={detail.status==="Active"?"default":"secondary"} className="text-[10px]">{detail.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-secondary/50 rounded p-2"><p className="text-muted-foreground">Code</p><p className="font-mono mt-0.5">{detail.code||"—"}</p></div>
                  <div className="bg-secondary/50 rounded p-2"><p className="text-muted-foreground">Commission</p><p className="font-mono mt-0.5 text-emerald-400">{detail.commission||"—"}</p></div>
                  <div className="bg-secondary/50 rounded p-2"><p className="text-muted-foreground">Region</p><p className="font-mono mt-0.5">{detail.region||"—"}</p></div>
                </div>
                {detail.responsiblePerson && <p className="text-xs text-primary">Key Person: {summarizeKeyPersons(detail.responsiblePerson)}</p>}
                <StaffMetrics humanCount={detail.humanCount} aiCount={detail.aiCount}/>
                {agents.filter(a=>a.affiliate_id===detail.id).length>0 && (
                  <div>
                    <p className="text-xs font-display text-muted-foreground mb-2 uppercase tracking-wider">Linked Agents ({agents.filter(a=>a.affiliate_id===detail.id).length})</p>
                    <div className="space-y-1.5">
                      {agents.filter(a=>a.affiliate_id===detail.id).map(ag=>(
                        <div key={ag.id} className="flex justify-between items-center text-xs bg-secondary/40 rounded px-3 py-1.5 gap-3">
                          <span className="font-medium">{ag.agent_name}</span>
                          <CommissionBar rate={ag.commission_rate||0}/>
                          <span className="text-emerald-400 font-mono">${(ag.total_sales||0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <EntityApiHub entityName={detail.name} ownerKind="affiliate" ownerId={detail.id}/>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════ DELETE DIALOG ══ */}
      <Dialog open={!!deleteId} onOpenChange={()=>setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-destructive">Delete Affiliate?</DialogTitle></DialogHeader>
          {deleteId && agents.filter(a=>a.affiliate_id===deleteId).length>0 && (
            <p className="text-xs text-amber-400 mb-2">⚠ {agents.filter(a=>a.affiliate_id===deleteId).length} agent(s) linked to this affiliate will be unlinked.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async()=>{if(deleteId){await remove(deleteId);setDeleteId(null);toast.success("Deleted");}}}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Affiliates;
