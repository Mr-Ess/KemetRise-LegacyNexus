import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, UserCheck, Users, DollarSign } from "lucide-react";
import { useEntities } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
type Affiliate = { id: string; name: string; code: string; commission: string; referrals: number; status: "Active" | "Inactive"; region: string; email: string; phone: string; notes: string; responsiblePerson: string; humanCount: number; aiCount: number; files: DocFile[] };

const emptyForm: Omit<Affiliate, "id"> = { name: "", code: "", commission: "", referrals: 0, status: "Active", region: "", email: "", phone: "", notes: "", responsiblePerson: "", humanCount: 0, aiCount: 0, files: [] };
const statusToDb = (s: string) => s === "Active" ? "active" : "inactive";

const Affiliates = () => {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("affiliates");
  const items: Affiliate[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyForm,
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

  // ── Affiliated Agents state ──────────────────────────────────────────────
  const [agentItems, setAgentItems] = useState<any[]>([]);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentEditId, setAgentEditId] = useState<string|null>(null);
  const [agentForm, setAgentForm] = useState({ agent_name:"", commission_rate:0.05, total_sales:0, status:"active", affiliate_id:"", notes:"" });

  const loadAgents = () => extApi.list("affiliated_agents", { order: "id" }).then(d => setAgentItems(d as any[])).catch(()=>{});
  useEffect(() => { loadAgents(); }, []);

  const saveAgent = async () => {
    if (!agentForm.agent_name.trim()) return toast.error("Agent name required");
    try {
      if (agentEditId) await extApi.update("affiliated_agents", agentEditId, agentForm);
      else await extApi.create("affiliated_agents", agentForm);
      toast.success("Saved"); setAgentOpen(false); setAgentEditId(null);
      setAgentForm({ agent_name:"", commission_rate:0.05, total_sales:0, status:"active", affiliate_id:"", notes:"" });
      loadAgents();
    } catch(e:any) { toast.error(e.message); }
  };
  const removeAgent = async (id:string) => {
    if (!confirm("Delete agent?")) return;
    await extApi.remove("affiliated_agents", id); toast.success("Deleted"); loadAgents();
  };

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<Omit<Affiliate, "id">>(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditId(null); };
  const openEdit = (a: Affiliate) => { const { id, ...rest } = a; setForm(rest); setEditId(a.id); setShowForm(true); };

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

  const filtered = statusFilter === "all" ? items : items.filter(a => a.status === statusFilter);
  const detail = detailId ? items.find(a => a.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">AFFILIATES HUB</h1></div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Card className="p-3 border-l-4 border-primary"><p className="text-[10px] text-muted-foreground">Affiliates</p><p className="text-xl font-bold">{items.length}</p></Card>
          <Card className="p-3 border-l-4 border-blue-500"><p className="text-[10px] text-muted-foreground">Affiliated Agents</p><p className="text-xl font-bold">{agentItems.length}</p></Card>
          <Card className="p-3 border-l-4 border-emerald-500"><p className="text-[10px] text-muted-foreground">Active</p><p className="text-xl font-bold text-emerald-500">{items.filter(a=>a.status==="Active").length}</p></Card>
          <Card className="p-3 border-l-4 border-yellow-500"><p className="text-[10px] text-muted-foreground">Total Sales (Agents)</p><p className="text-xl font-bold">{agentItems.reduce((s:number,a:any)=>s+(a.total_sales||0),0).toLocaleString()}</p></Card>
        </div>

        <Tabs defaultValue="affiliates">
          <TabsList className="grid w-full grid-cols-2 max-w-xs mb-4">
            <TabsTrigger value="affiliates"><UserCheck className="w-3.5 h-3.5 mr-1"/>Affiliates ({items.length})</TabsTrigger>
            <TabsTrigger value="agents"><Users className="w-3.5 h-3.5 mr-1"/>Agents ({agentItems.length})</TabsTrigger>
          </TabsList>

        {/* ── TAB: AFFILIATES ── */}
        <TabsContent value="affiliates">
        <div className="flex items-center gap-2 mb-3">
          <ExportButton data={filtered as any[]} filename="affiliates" title="Affiliates" />
          <SavedViews page="affiliates" currentFilters={{ statusFilter }} onApply={(f) => setStatusFilter(f.statusFilter ?? "all")} />
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="ml-auto gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Affiliate</Button>
        </div>
        <div className="flex gap-2 mb-4">
          {["all", "Active", "Inactive"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>{s === "all" ? "All" : s}</button>
          ))}
          <div className="ml-auto flex gap-3 text-xs font-display">
            <span className="text-foreground">👤 {items.reduce((a, x) => a + x.humanCount, 0)} Human</span>
            <span className="text-nile">🤖 {items.reduce((a, x) => a + x.aiCount, 0)} AI</span>
          </div>
        </div>
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setDetailId(a.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-sm text-foreground">{a.name}</h3>
                  {a.responsiblePerson && <p className="text-[10px] text-primary mt-0.5">Key Person: {summarizeKeyPersons(a.responsiblePerson)}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-display bg-primary/20 text-primary">{a.code}</span>
                    <span className="text-xs text-scarab font-display">{a.commission}</span>
                    <span className="text-xs text-muted-foreground">{a.referrals} referrals</span>
                    <span className="text-xs text-muted-foreground">{a.region}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${a.status === "Active" ? "bg-scarab/20 text-scarab" : "bg-muted text-muted-foreground"}`}>{a.status}</span>
                  </div>
                  {a.email && <p className="text-[10px] text-muted-foreground mt-1">{a.email} {a.phone && `• ${a.phone}`}</p>}
                  {a.notes && <p className="text-[10px] text-primary mt-0.5">{a.notes}</p>}
                  <div className="mt-2"><StaffMetrics humanCount={a.humanCount} aiCount={a.aiCount} /></div>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No affiliates found</p>}
        </div>
        <div className="mt-6"><ApiIntegrationStatus /></div>
        </TabsContent>

        {/* ── TAB: AFFILIATED AGENTS ── */}
        <TabsContent value="agents">
          <div className="flex justify-end mb-3">
            <ExportButton data={agentItems} filename="affiliated-agents" title="Agents"/>
            <Button className="ml-2 gap-1 font-display text-xs" onClick={()=>{setAgentEditId(null);setAgentForm({agent_name:"",commission_rate:0.05,total_sales:0,status:"active",affiliate_id:"",notes:""});setAgentOpen(true);}}>
              <Plus className="w-4 h-4"/>Add Agent
            </Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs"><tr>
                <th className="text-left p-3">Agent Name</th>
                <th className="text-left p-3">Commission</th>
                <th className="text-left p-3">Total Sales</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Affiliate</th>
                <th className="text-left p-3"/>
              </tr></thead>
              <tbody>
                {agentItems.length===0?<tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No affiliated agents yet</td></tr>:
                agentItems.map((a:any)=>(
                  <tr key={a.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="p-3 font-semibold">{a.agent_name}</td>
                    <td className="p-3"><Badge variant="outline">{(Number(a.commission_rate||0)*100).toFixed(1)}%</Badge></td>
                    <td className="p-3 font-bold text-emerald-400">{(a.total_sales||0).toLocaleString()}</td>
                    <td className="p-3"><Badge variant={a.status==="active"?"default":"secondary"}>{a.status||"active"}</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground">{a.affiliate_id||"—"}</td>
                    <td className="p-3 flex gap-1">
                      <Button size="sm" variant="ghost" onClick={()=>{setAgentEditId(a.id);setAgentForm({agent_name:a.agent_name||"",commission_rate:a.commission_rate||0.05,total_sales:a.total_sales||0,status:a.status||"active",affiliate_id:a.affiliate_id||"",notes:a.notes||""});setAgentOpen(true);}}>
                        <Edit className="w-3.5 h-3.5"/>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={()=>removeAgent(a.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      {/* Agent Dialog */}
      <Dialog open={agentOpen} onOpenChange={setAgentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{agentEditId?"Edit":"New"} Affiliated Agent</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Agent Name *</Label><Input value={agentForm.agent_name} onChange={e=>setAgentForm(p=>({...p,agent_name:e.target.value}))} placeholder="e.g. AG-001"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Commission Rate</Label><Input type="number" step="0.01" min="0" max="1" value={agentForm.commission_rate} onChange={e=>setAgentForm(p=>({...p,commission_rate:+e.target.value}))} placeholder="0.05 = 5%"/></div>
              <div><Label>Total Sales</Label><Input type="number" value={agentForm.total_sales} onChange={e=>setAgentForm(p=>({...p,total_sales:+e.target.value}))}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <select value={agentForm.status} onChange={e=>setAgentForm(p=>({...p,status:e.target.value}))} className="w-full mt-1 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground">
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
                </select>
              </div>
              <div><Label>Parent Affiliate ID</Label><Input value={agentForm.affiliate_id} onChange={e=>setAgentForm(p=>({...p,affiliate_id:e.target.value}))} placeholder="Optional UUID"/></div>
            </div>
            <div><Label>Notes</Label><Input value={agentForm.notes} onChange={e=>setAgentForm(p=>({...p,notes:e.target.value}))}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setAgentOpen(false)}>Cancel</Button>
            <Button onClick={saveAgent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? "Edit" : "New"} Affiliate</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <ResponsiblePerson value={form.responsiblePerson} onChange={v => setForm(p => ({ ...p, responsiblePerson: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Commission</Label><Input value={form.commission} onChange={e => setForm(p => ({ ...p, commission: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Region</Label><Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Affiliate["status"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Active</option><option>Inactive</option></select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" min={0} value={form.humanCount} onChange={e => setForm(p => ({ ...p, humanCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" min={0} value={form.aiCount} onChange={e => setForm(p => ({ ...p, aiCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="affiliate" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.name || "New Affiliate"} ownerKind="affiliate" ownerId={editId || undefined} />
          </div>
          <DialogFooter><Button onClick={handleSubmit} className="font-display text-xs">{editId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle className="font-display text-primary">{detail.name}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{detail.code} • {detail.commission} • {detail.region}</p>
                {detail.responsiblePerson && <p className="text-xs text-primary">Key Person: {summarizeKeyPersons(detail.responsiblePerson)}</p>}
                <StaffMetrics humanCount={detail.humanCount} aiCount={detail.aiCount} />
                <EntityApiHub entityName={detail.name} ownerKind="affiliate" ownerId={detail.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Delete Affiliate?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) await remove(deleteId); setDeleteId(null); toast.success("Deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Affiliates;
