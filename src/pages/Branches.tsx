import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Building2, Users, Bot, Clock, X } from "lucide-react";
import { useEntities } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import ApiIntegrationStatus from "@/components/dashboard/ApiIntegrationStatus";
import EntityFileUpload from "@/components/shared/EntityFileUpload";
import EntityApiHub from "@/components/shared/EntityApiHub";
import ResponsiblePerson, { summarizeKeyPersons } from "@/components/shared/ResponsiblePerson";
import BrandSelector from "@/components/shared/BrandSelector";
import ExportButton from "@/components/shared/ExportButton";
import { SavedViews } from "@/components/shared/SavedViews";

type Shift = { id: string; name: string; start: string; end: string };
type DocFile = { id: string; name: string; category: string };

type Branch = {
  id: string; name: string; type: string; brandId?: string | null;
  address: string; humanCount: number; aiCount: number; status: "Active" | "Inactive" | "Maintenance";
  shifts: Shift[]; aiTasks: string; responsiblePerson: string; files: DocFile[];
};

const defaultBranchTypes = ["Main", "Sub-branch", "Warehouse", "Data Center", "Office", "Lab", "Showroom"];

const typeColors: Record<string, string> = { Main: "bg-primary/20 text-primary", "Sub-branch": "bg-nile/20 text-nile", Warehouse: "bg-scarab/20 text-scarab", "Data Center": "bg-blood-red/20 text-blood-red", Office: "bg-muted text-muted-foreground" };
const statusToDb = (s: string) => s === "Active" ? "active" : s === "Maintenance" ? "maintenance" : "inactive";

const Branches = () => {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("branches");
  const emptyShift = (): Shift => ({ id: crypto.randomUUID(), name: "", start: "09:00", end: "17:00" });
  const empty = (): Omit<Branch, "id"> => ({ name: "", type: "Main", brandId: null, address: "", humanCount: 0, aiCount: 0, status: "Active", shifts: [emptyShift()], aiTasks: "", responsiblePerson: "", files: [] });
  const items: Branch[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...empty(),
    ...(r.data as any),
    name:              (r as any).name              ?? (r.data as any)?.name              ?? "",
    type:              (r as any).branch_type       ?? (r.data as any)?.type              ?? "Main",
    address:           (r as any).address           ?? (r.data as any)?.address           ?? "",
    humanCount:        (r as any).human_count       ?? (r.data as any)?.humanCount        ?? 0,
    aiCount:           (r as any).ai_count          ?? (r.data as any)?.aiCount           ?? 0,
    responsiblePerson: (r as any).responsible_person ?? (r.data as any)?.responsiblePerson ?? "",
    shifts:            (r as any).shifts            ?? (r.data as any)?.shifts            ?? [],
    aiTasks:           (r as any).ai_tasks          ?? (r.data as any)?.aiTasks           ?? "",
    status:   (r as any).status === "inactive" ? "Inactive" : (r as any).status === "maintenance" ? "Maintenance" : ((r.data as any)?.status ?? "Active"),
    brandId:  (r as any).brand_id ?? (r.data as any)?.brandId ?? null,
  })), [rows]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchTypes, setBranchTypes] = useState(defaultBranchTypes);
  const [customTypeInput, setCustomTypeInput] = useState("");

  const [form, setForm] = useState<Omit<Branch, "id">>(empty());

  const resetForm = () => { setForm(empty()); setEditId(null); };
  const openEdit = (b: Branch) => { const { id, ...rest } = b; setForm(rest); setEditId(b.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = {
      name:               form.name,
      status:             statusToDb(form.status),
      brand_id:           form.brandId            || null,
      branch_type:        form.type               || "Main",
      address:            form.address            || null,
      human_count:        form.humanCount         || 0,
      ai_count:           form.aiCount            || 0,
      responsible_person: form.responsiblePerson  || null,
      shifts:             form.shifts             || [],
      ai_tasks:           form.aiTasks            || null,
      data:               form,
    };
    if (editId) { await update(editId, payload); toast.success("Branch updated"); }
    else { await create(payload); toast.success("Branch added"); }
    setShowForm(false); resetForm();
  };

  const addCustomType = () => {
    if (customTypeInput.trim() && !branchTypes.includes(customTypeInput.trim())) {
      setBranchTypes(prev => [...prev, customTypeInput.trim()]);
      setCustomTypeInput("");
      toast.success("Custom type added");
    }
  };

  const allTypes = [...new Set([...branchTypes, ...items.map(b => b.type)])];
  const filtered = items.filter(b => {
    if (typeFilter !== "all" && b.type !== typeFilter) return false;
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    return true;
  });
  const detail = detailId ? items.find(b => b.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">BRANCHES</h1></div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Branch</Button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <ExportButton data={filtered as any[]} filename="branches" title="Branches" />
          <SavedViews page="branches" currentFilters={{ typeFilter, statusFilter }} onApply={(f) => { setTypeFilter(f.typeFilter ?? "all"); setStatusFilter(f.statusFilter ?? "all"); }} />
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-[10px] font-display text-muted-foreground self-center">Type:</span>
          {["all", ...allTypes].map(s => (
            <button key={s} onClick={() => setTypeFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${typeFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>{s === "all" ? "All" : s}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-display text-muted-foreground self-center">Status:</span>
          {["all", "Active", "Inactive", "Maintenance"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>{s === "all" ? "All" : s}</button>
          ))}
          <div className="ml-auto flex gap-3 text-xs font-display">
            <span className="text-foreground">👤 {items.reduce((a, b) => a + b.humanCount, 0)} Human</span>
            <span className="text-nile">🤖 {items.reduce((a, b) => a + b.aiCount, 0)} AI</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(b => (
            <div key={b.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setDetailId(b.id)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-display text-sm text-foreground">{b.name}</h3>
                  <p className="text-xs text-muted-foreground">{b.address}</p>
                  {b.responsiblePerson && <p className="text-[10px] text-primary mt-0.5">Key Person: {summarizeKeyPersons(b.responsiblePerson)}</p>}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${typeColors[b.type] || "bg-primary/10 text-primary"}`}>{b.type}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${b.status === "Active" ? "bg-scarab/20 text-scarab" : b.status === "Maintenance" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{b.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div className="bg-secondary/50 rounded p-2">
                  <Users className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                  <p className="font-display text-xs text-foreground">{b.humanCount}</p>
                  <p className="text-[9px] text-muted-foreground">Human</p>
                </div>
                <div className="bg-secondary/50 rounded p-2">
                  <Bot className="w-3.5 h-3.5 text-nile mx-auto mb-1" />
                  <p className="font-display text-xs text-foreground">{b.aiCount}</p>
                  <p className="text-[9px] text-muted-foreground">AI Agents</p>
                </div>
                <div className="bg-secondary/50 rounded p-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                  <p className="font-display text-[10px] text-foreground">{b.shifts.length}</p>
                  <p className="text-[9px] text-muted-foreground">Shifts</p>
                </div>
              </div>
              {b.shifts.length > 0 && (
                <div className="text-[10px] text-muted-foreground mb-1">
                  {b.shifts.map(s => <span key={s.id} className="mr-2"><span className="text-foreground">{s.name || "Shift"}:</span> {s.start}-{s.end}</span>)}
                </div>
              )}
              {b.aiTasks && <p className="text-[10px] text-muted-foreground"><span className="text-nile">AI Tasks:</span> {b.aiTasks}</p>}
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No branches found</p>}
        <div className="mt-6"><ApiIntegrationStatus /></div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? "Edit Branch" : "New Branch"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <BrandSelector value={form.brandId} onChange={(id) => setForm(p => ({ ...p, brandId: id }))} />
            <ResponsiblePerson value={form.responsiblePerson} onChange={v => setForm(p => ({ ...p, responsiblePerson: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground">
                  {allTypes.map(t => <option key={t}>{t}</option>)}
                </select>
                <div className="flex gap-1">
                  <Input value={customTypeInput} onChange={e => setCustomTypeInput(e.target.value)} placeholder="Custom type" className="bg-secondary border-border text-foreground text-xs" />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomType} className="text-xs shrink-0"><Plus className="w-3 h-3" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Branch["status"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground">
                  <option>Active</option><option>Inactive</option><option>Maintenance</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" value={form.humanCount} onChange={e => setForm(p => ({ ...p, humanCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" value={form.aiCount} onChange={e => setForm(p => ({ ...p, aiCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2">
              <Label>Working Hours / Shifts</Label>
              {form.shifts.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md border border-border">
                  <Input value={s.name} onChange={e => setForm(p => ({ ...p, shifts: p.shifts.map((sh, idx) => idx === i ? { ...sh, name: e.target.value } : sh) }))} placeholder="Shift name" className="bg-secondary border-border text-foreground text-xs flex-1" />
                  <Input type="time" value={s.start} onChange={e => setForm(p => ({ ...p, shifts: p.shifts.map((sh, idx) => idx === i ? { ...sh, start: e.target.value } : sh) }))} className="bg-secondary border-border text-foreground text-xs w-28" />
                  <span className="text-muted-foreground text-xs">to</span>
                  <Input type="time" value={s.end} onChange={e => setForm(p => ({ ...p, shifts: p.shifts.map((sh, idx) => idx === i ? { ...sh, end: e.target.value } : sh) }))} className="bg-secondary border-border text-foreground text-xs w-28" />
                  {form.shifts.length > 1 && <button type="button" onClick={() => setForm(p => ({ ...p, shifts: p.shifts.filter((_, idx) => idx !== i) }))} className="p-1 text-destructive"><X className="w-3.5 h-3.5" /></button>}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, shifts: [...p.shifts, emptyShift()] }))} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5" />Add Shift</Button>
            </div>
            <div className="space-y-2"><Label>AI Tasks</Label><Input value={form.aiTasks} onChange={e => setForm(p => ({ ...p, aiTasks: e.target.value }))} className="bg-secondary border-border text-foreground" placeholder="Data analysis, Support..." /></div>
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="branch" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.name || "New Branch"} ownerKind="branch" ownerId={editId || undefined} />
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
                <p className="text-xs text-muted-foreground">{detail.address} • {detail.type}</p>
                {detail.responsiblePerson && <p className="text-xs text-primary">Key Person: {summarizeKeyPersons(detail.responsiblePerson)}</p>}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-secondary/50 rounded p-2"><Users className="w-3.5 h-3.5 text-primary mx-auto mb-1" /><p className="font-display text-xs text-foreground">{detail.humanCount}</p><p className="text-[9px] text-muted-foreground">Human</p></div>
                  <div className="bg-secondary/50 rounded p-2"><Bot className="w-3.5 h-3.5 text-nile mx-auto mb-1" /><p className="font-display text-xs text-foreground">{detail.aiCount}</p><p className="text-[9px] text-muted-foreground">AI</p></div>
                  <div className="bg-secondary/50 rounded p-2"><Clock className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" /><p className="font-display text-[10px] text-foreground">{detail.shifts.length}</p><p className="text-[9px] text-muted-foreground">Shifts</p></div>
                </div>
                <EntityApiHub entityName={detail.name} ownerKind="branch" ownerId={detail.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Delete Branch?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-body">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) await remove(deleteId); setDeleteId(null); toast.success("Deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Branches;
