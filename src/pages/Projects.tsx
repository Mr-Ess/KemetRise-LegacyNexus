import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, FolderOpen, Calendar, Users, Edit, Trash2 } from "lucide-react";
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
import StaffMetrics from "@/components/shared/StaffMetrics";
import ResponsiblePerson, { summarizeKeyPersons } from "@/components/shared/ResponsiblePerson";
import BrandSelector from "@/components/shared/BrandSelector";
import ExportButton from "@/components/shared/ExportButton";
import { SavedViews } from "@/components/shared/SavedViews";

type DocFile = { id: string; name: string; category: string };
type Project = {
  id: string; name: string; description: string;
  status: "Active" | "On Hold" | "Completed" | "Cancelled";
  brand: string; brandId?: string | null; startDate: string; endDate: string; team: string[]; budget: string;
  responsiblePerson: string; humanCount: number; aiCount: number; files: DocFile[];
};

const statusColors: Record<string, string> = {
  Active: "bg-scarab/20 text-scarab", "On Hold": "bg-primary/20 text-primary", Completed: "bg-nile/20 text-nile", Cancelled: "bg-blood-red/20 text-blood-red",
};

const emptyForm: Omit<Project, "id"> = { name: "", description: "", status: "Active", brand: "", brandId: null, startDate: "", endDate: "", team: [], budget: "", responsiblePerson: "", humanCount: 0, aiCount: 0, files: [] };

const statusToDb = (s: string) => s === "Active" ? "active" : s === "Completed" ? "inactive" : s === "On Hold" ? "maintenance" : "pending";

const Projects = () => {
  const navigate = useNavigate();
  const { items: rows, loading, create, update, remove } = useEntities("projects");
  const projects: Project[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyForm,
    ...(r.data as any),
    name:              (r as any).name              ?? (r.data as any)?.name              ?? "",
    description:       (r as any).description       ?? (r.data as any)?.description       ?? "",
    startDate:         (r as any).start_date        ?? (r.data as any)?.startDate         ?? "",
    endDate:           (r as any).end_date          ?? (r.data as any)?.endDate           ?? "",
    budget:            (r as any).budget            ?? (r.data as any)?.budget            ?? "",
    team:              (r as any).team              ?? (r.data as any)?.team              ?? [],
    humanCount:        (r as any).human_count       ?? (r.data as any)?.humanCount        ?? 0,
    aiCount:           (r as any).ai_count          ?? (r.data as any)?.aiCount           ?? 0,
    responsiblePerson: (r as any).responsible_person ?? (r.data as any)?.responsiblePerson ?? "",
    status:   (r as any).status === "inactive" ? "Completed" : (r as any).status === "maintenance" ? "On Hold" : (r as any).status === "pending" ? "Cancelled" : ((r.data as any)?.status ?? "Active"),
    brandId:  (r as any).brand_id ?? (r.data as any)?.brandId ?? null,
  })), [rows]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState<Omit<Project, "id">>(emptyForm);
  const [teamInput, setTeamInput] = useState("");

  const resetForm = () => { setForm(emptyForm); setTeamInput(""); setEditId(null); };
  const openEdit = (p: Project) => { const { id, ...rest } = p; setForm(rest); setEditId(p.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Project name required"); return; }
    const payload = {
      name:               form.name,
      status:             statusToDb(form.status),
      brand_id:           form.brandId || null,
      description:        form.description        || null,
      start_date:         form.startDate          || null,
      end_date:           form.endDate            || null,
      budget:             form.budget             || null,
      team:               form.team               || [],
      human_count:        form.humanCount         || 0,
      ai_count:           form.aiCount            || 0,
      responsible_person: form.responsiblePerson  || null,
      data:               form,
    };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else { await create(payload); toast.success("Created"); }
    setShowForm(false); resetForm();
  };

  const addTeamMember = () => { if (teamInput.trim()) { setForm(prev => ({ ...prev, team: [...prev.team, teamInput.trim()] })); setTeamInput(""); } };
  const filtered = statusFilter === "all" ? projects : projects.filter(p => p.status === statusFilter);
  const detail = detailId ? projects.find(p => p.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><FolderOpen className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">PROJECTS</h1></div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Project</Button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <ExportButton data={filtered as any[]} filename="projects" title="Projects" />
          <SavedViews page="projects" currentFilters={{ statusFilter }} onApply={(f) => setStatusFilter(f.statusFilter ?? "all")} />
        </div>
        <div className="flex gap-2 mb-4">
          {["all", "Active", "On Hold", "Completed", "Cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>{s === "all" ? "All" : s}</button>
          ))}
          <div className="ml-auto flex gap-3 text-xs font-display">
            <span className="text-foreground">👤 {projects.reduce((a, p) => a + p.humanCount, 0)} Human</span>
            <span className="text-nile">🤖 {projects.reduce((a, p) => a + p.aiCount, 0)} AI</span>
          </div>
        </div>
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setDetailId(p.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-sm text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  {p.responsiblePerson && <p className="text-[10px] text-primary mt-0.5">Key Person: {summarizeKeyPersons(p.responsiblePerson)}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${statusColors[p.status]}`}>{p.status}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{p.startDate} → {p.endDate}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{p.team.length} members</span>
                    {p.budget && <span className="text-[10px] text-scarab font-display">{p.budget}</span>}
                    {p.brand && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-display">{p.brand}</span>}
                  </div>
                  <StaffMetrics humanCount={p.humanCount} aiCount={p.aiCount} />
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No projects found</p>}
        </div>

        <div className="mt-6"><ApiIntegrationStatus /></div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <ResponsiblePerson value={form.responsiblePerson} onChange={v => setForm(p => ({ ...p, responsiblePerson: v }))} />
            <BrandSelector value={form.brandId} onChange={(id) => setForm(p => ({ ...p, brandId: id }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Brand (legacy text)</Label><Input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Budget</Label><Input value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="$50,000" className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Start</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>End</Label><Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" min={0} value={form.humanCount} onChange={e => setForm(p => ({ ...p, humanCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" min={0} value={form.aiCount} onChange={e => setForm(p => ({ ...p, aiCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Project["status"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground">
                <option>Active</option><option>On Hold</option><option>Completed</option><option>Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="flex gap-2"><Input value={teamInput} onChange={e => setTeamInput(e.target.value)} placeholder="Add member" className="bg-secondary border-border text-foreground" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTeamMember())} /><Button type="button" variant="outline" size="sm" onClick={addTeamMember}><Plus className="w-4 h-4" /></Button></div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.team.map((t, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full text-xs text-primary font-body">{t}<button onClick={() => setForm(p => ({ ...p, team: p.team.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button></span>
                ))}
              </div>
            </div>
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="project" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.name || "New Project"} ownerKind="project" ownerId={editId || undefined} />
          </div>
          <DialogFooter><Button onClick={handleSubmit} className="font-display text-xs">{editId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle className="font-display text-primary">{detail.name}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{detail.description}</p>
                {detail.responsiblePerson && <p className="text-xs text-primary">Key Person: {summarizeKeyPersons(detail.responsiblePerson)}</p>}
                <StaffMetrics humanCount={detail.humanCount} aiCount={detail.aiCount} />
                <EntityApiHub entityName={detail.name} ownerKind="project" ownerId={detail.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Delete Project?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) { await remove(deleteId); } setDeleteId(null); toast.success("Deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
