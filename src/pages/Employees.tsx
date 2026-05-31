import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Users, Bot, User } from "lucide-react";
import { useEntities } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import ApiIntegrationStatus from "@/components/dashboard/ApiIntegrationStatus";
import EntityFileUpload from "@/components/shared/EntityFileUpload";
import EntityApiHub from "@/components/shared/EntityApiHub";
import ResponsiblePerson from "@/components/shared/ResponsiblePerson";
import BrandSelector from "@/components/shared/BrandSelector";
import ExportButton from "@/components/shared/ExportButton";
import { SavedViews } from "@/components/shared/SavedViews";

type DocFile = { id: string; name: string; category: string };
type Employee = {
  id: string; name: string; type: "Human" | "AI Agent"; position: string; branch: string;
  brandId?: string | null; status: "Active" | "Inactive"; tasks: string;
  email: string; phone: string; specialization: string; responsiblePerson: string;
  role?: string; department?: string; bio?: string; avatar_url?: string;
  availability?: "online" | "offline" | "busy"; reports_to?: string; instructions?: string;
  workflow_id?: string; metadata?: Record<string, any>;
  files: DocFile[];
  agent_code?: string; agent_version?: string; system_prompt?: string;
  team_category?: string; is_aggregator?: boolean;
};

const emptyForm: Omit<Employee, "id"> = {
  name: "", type: "Human", position: "", branch: "", brandId: null,
  status: "Active", tasks: "", email: "", phone: "", specialization: "",
  responsiblePerson: "", role: "", department: "", bio: "", avatar_url: "",
  availability: "offline", reports_to: "", instructions: "",
  workflow_id: "", metadata: {},
  files: [],
  agent_code: "", agent_version: "", system_prompt: "", team_category: "",
  is_aggregator: false,
};
const statusToDb = (s: string) => s === "Active" ? "active" : "inactive";

const Employees = () => {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("employees");
  const items: Employee[] = useMemo(() => rows.map((r: any) => ({
    id: r.id,
    ...emptyForm,
    ...(r.data as any),
    name:              r.name              ?? r.data?.name              ?? "",
    position:          r.position          ?? r.data?.position          ?? "",
    branch:            r.branch_name       ?? r.data?.branch            ?? "",
    email:             r.email             ?? r.data?.email             ?? "",
    phone:             r.phone             ?? r.data?.phone             ?? "",
    specialization:    r.specialization    ?? r.data?.specialization    ?? "",
    tasks:             r.tasks             ?? r.data?.tasks             ?? "",
    responsiblePerson: r.responsible_person ?? r.data?.responsiblePerson ?? "",
    role:              r.role              ?? r.data?.role              ?? "",
    department:        r.department        ?? r.data?.department        ?? "",
    bio:               r.bio               ?? r.data?.bio               ?? "",
    avatar_url:        r.avatar_url        ?? r.data?.avatar_url        ?? "",
    availability:      r.availability      ?? r.data?.availability      ?? "offline",
    reports_to:        r.reports_to        ?? r.data?.reports_to        ?? "",
    instructions:      r.instructions      ?? r.data?.instructions      ?? "",
    workflow_id:       r.workflow_id        ?? r.data?.workflow_id        ?? "",
    metadata:          (() => { const m = r.metadata ?? r.data?.metadata; if (!m || typeof m !== "object" || Array.isArray(m)) return {}; return m; })(),
    brandId:           r.brand_id          ?? r.data?.brandId           ?? null,
    status:            r.status === "inactive" ? "Inactive" : "Active",
    agent_code:        r.agent_code        ?? r.data?.agent_code        ?? "",
    agent_version:     r.agent_version     ?? r.data?.agent_version     ?? "",
    system_prompt:     r.system_prompt     ?? r.data?.system_prompt     ?? "",
    team_category:     r.team_category     ?? r.data?.team_category     ?? "",
    is_aggregator:     r.is_aggregator     ?? r.data?.is_aggregator     ?? false,
    type: (r.employee_type === "AI" || r.employee_type === "AI Agent" || r.data?.type === "AI Agent") ? "AI Agent" : "Human",
  })), [rows]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<Omit<Employee, "id">>(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditId(null); };
  const openEdit = (e: Employee) => { const { id, ...rest } = e; setForm(rest); setEditId(e.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload: any = {
      name:               form.name,
      status:             statusToDb(form.status),
      brand_id:           form.brandId        || null,
      employee_type:      form.type === "AI Agent" ? "AI" : "Human",
      position:           form.position       || null,
      branch_name:        form.branch         || null,
      email:              form.email          || null,
      phone:              form.phone          || null,
      specialization:     form.specialization || null,
      tasks:              form.tasks          || null,
      responsible_person: form.responsiblePerson || null,
      role:               form.role           || null,
      department:         form.department     || null,
      bio:                form.bio            || null,
      avatar_url:         form.avatar_url     || null,
      availability:       form.availability   || "offline",
      reports_to:         form.reports_to     || null,
      instructions:       form.instructions   || null,
      workflow_id:         form.workflow_id    || null,
      metadata:            form.metadata       || {},
      agent_code:         form.agent_code     || null,
      agent_version:      form.agent_version  || null,
      system_prompt:      form.system_prompt  || null,
      team_category:      form.team_category  || null,
      is_aggregator:      !!form.is_aggregator,
      data:               form,
    };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else { await create(payload); toast.success("Added"); }
    setShowForm(false); resetForm();
  };

  const filtered = items.filter(e => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  const detail = detailId ? items.find(e => e.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">EMPLOYEES (TEAM)</h1></div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Employee</Button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <ExportButton data={filtered as any[]} filename="employees" title="Employees" />
          <SavedViews page="employees" currentFilters={{ typeFilter, statusFilter }} onApply={(f) => { setTypeFilter(f.typeFilter ?? "all"); setStatusFilter(f.statusFilter ?? "all"); }} />
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-[10px] font-display text-muted-foreground self-center">Type:</span>
          {["all", "Human", "AI Agent"].map(s => (
            <button key={s} onClick={() => setTypeFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${typeFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>{s === "all" ? "All" : s}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-display text-muted-foreground self-center">Status:</span>
          {["all", "Active", "Inactive"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>{s === "all" ? "All" : s}</button>
          ))}
          <div className="ml-auto flex gap-3 text-xs font-display">
            <span className="text-foreground">👤 {items.filter(e => e.type === "Human").length} Human</span>
            <span className="text-nile">🤖 {items.filter(e => e.type === "AI Agent").length} AI</span>
          </div>
        </div>
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setDetailId(e.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${e.type === "AI Agent" ? "bg-nile/20" : "bg-primary/20"}`}>
                    {e.type === "AI Agent" ? <Bot className="w-5 h-5 text-nile" /> : <User className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-display text-sm text-foreground">{e.name}</h3>
                    <p className="text-xs text-muted-foreground">{e.position} • {e.branch}</p>
                    {e.specialization && <p className="text-[10px] text-primary mt-0.5">{e.specialization}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{e.tasks}</p>
                    {e.type === "Human" && (e.email || e.phone) && <p className="text-[10px] text-muted-foreground mt-0.5">{e.email}{e.email && e.phone && " • "}{e.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={ev => ev.stopPropagation()}>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${e.type === "AI Agent" ? "bg-nile/20 text-nile" : "bg-primary/20 text-primary"}`}>{e.type}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${e.status === "Active" ? "bg-scarab/20 text-scarab" : "bg-muted text-muted-foreground"}`}>{e.status}</span>
                  <button onClick={() => openEdit(e)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No employees found</p>}
        <div className="mt-6"><ApiIntegrationStatus /></div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? "Edit" : "New"} Employee</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Classification *</Label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Employee["type"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Human</option><option>AI Agent</option></select>
              </div>
              <div className="space-y-2"><Label>Position</Label><Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Branch</Label><Input value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Specialization</Label><Input value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <BrandSelector value={form.brandId} onChange={(id) => setForm(p => ({ ...p, brandId: id }))} />
            <ResponsiblePerson value={form.responsiblePerson} onChange={v => setForm(p => ({ ...p, responsiblePerson: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Role</Label><Input value={form.role || ""} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Manager..." className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Department</Label><Input value={form.department || ""} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="Marketing..." className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Availability</Label>
                <select value={form.availability || "offline"} onChange={e => setForm(p => ({ ...p, availability: e.target.value as Employee["availability"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground">
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Reports To</Label><Input value={form.reports_to || ""} onChange={e => setForm(p => ({ ...p, reports_to: e.target.value }))} placeholder="Manager name..." className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>Avatar URL</Label><Input value={form.avatar_url || ""} onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))} placeholder="https://..." className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Bio</Label><Textarea value={form.bio || ""} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={2} placeholder="Short bio..." className="bg-secondary border-border text-foreground" /></div>
            {form.type === "Human" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              </div>
            )}
            {form.type === "Human" && (
              <div className="space-y-2"><Label>Instructions</Label><Textarea value={form.instructions || ""} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} rows={2} placeholder="Special instructions..." className="bg-secondary border-border text-foreground" /></div>
            )}
            {form.type === "AI Agent" && (
              <div className="space-y-3 p-3 rounded-md border border-nile/30 bg-nile/5">
                <p className="font-display text-xs text-nile">AI AGENT CONFIG</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Agent Code</Label><Input value={form.agent_code || ""} onChange={e => setForm(p => ({ ...p, agent_code: e.target.value }))} placeholder="AG-001" className="bg-secondary border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Agent Version</Label><Input value={form.agent_version || ""} onChange={e => setForm(p => ({ ...p, agent_version: e.target.value }))} placeholder="v1.0" className="bg-secondary border-border text-foreground" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Team Category</Label><Input value={form.team_category || ""} onChange={e => setForm(p => ({ ...p, team_category: e.target.value }))} placeholder="Marketing / Ops..." className="bg-secondary border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Role</Label><Input value={form.role || ""} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Coordinator..." className="bg-secondary border-border text-foreground" /></div>
                </div>
                <div className="space-y-2"><Label>System Prompt</Label><Textarea value={form.system_prompt || ""} onChange={e => setForm(p => ({ ...p, system_prompt: e.target.value }))} rows={4} placeholder="Instructions for the AI agent..." className="bg-secondary border-border text-foreground" /></div>
                <label className="flex items-center gap-2 text-xs text-foreground">
                  <input type="checkbox" checked={!!form.is_aggregator} onChange={e => setForm(p => ({ ...p, is_aggregator: e.target.checked }))} />
                  Is Aggregator (collects results from sub-agents)
                </label>
              </div>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Employee["status"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Active</option><option>Inactive</option></select>
            </div>
            <div className="space-y-2"><Label>Tasks</Label><Textarea value={form.tasks} onChange={e => setForm(p => ({ ...p, tasks: e.target.value }))} className="bg-secondary border-border text-foreground" placeholder="Comma-separated tasks" /></div>
            <div className="space-y-2"><Label>Workflow ID</Label><Input value={form.workflow_id || ""} onChange={e => setForm(p => ({ ...p, workflow_id: e.target.value }))} placeholder="WF-001" className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2">
              <Label>Metadata (JSON)</Label>
              <Textarea
                value={(() => { try { const m = form.metadata; return m && typeof m === "object" && !Array.isArray(m) ? JSON.stringify(m, null, 2) : "{}"; } catch { return "{}"; } })()}
                onChange={e => { try { setForm(p => ({ ...p, metadata: JSON.parse(e.target.value) })); } catch { setForm(p => ({ ...p, metadata: e.target.value as any })); } }}
                rows={3}
                placeholder={"{ \"key\": \"value\" }"}
                className="bg-secondary border-border text-foreground font-mono text-xs"
              />
            </div>
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="employee" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.name || "New Employee"} ownerKind="employee" ownerId={editId || undefined} />
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
                <p className="text-xs text-muted-foreground">{detail.position} • {detail.branch}</p>
                <p className="text-xs text-muted-foreground">{detail.tasks}</p>
                <EntityApiHub entityName={detail.name} ownerKind="employee" ownerId={detail.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Delete Employee?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) await remove(deleteId); setDeleteId(null); toast.success("Deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
