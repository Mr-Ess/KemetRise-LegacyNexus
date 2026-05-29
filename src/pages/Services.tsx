import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Briefcase } from "lucide-react";
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
type Service = { id: string; name: string; description: string; category: string; price: string; status: "Active" | "Inactive"; brandId?: string | null; responsiblePerson: string; humanCount: number; aiCount: number; files: DocFile[] };

const emptyForm: Omit<Service, "id"> = { name: "", description: "", category: "", price: "", status: "Active", brandId: null, responsiblePerson: "", humanCount: 0, aiCount: 0, files: [] };
const statusToDb = (s: string) => s === "Active" ? "active" : "inactive";

const Services = () => {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("services");
  const items: Service[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyForm,
    ...(r.data as any),
    name: (r as any).name ?? (r.data as any)?.name ?? "",
    status: (r as any).status === "inactive" ? "Inactive" : ((r.data as any)?.status ?? "Active"),
    brandId: (r as any).brand_id ?? (r.data as any)?.brandId ?? null,
  })), [rows]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<Omit<Service, "id">>(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditId(null); };
  const openEdit = (s: Service) => { const { id, ...rest } = s; setForm(rest); setEditId(s.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = { name: form.name, status: statusToDb(form.status), data: form, brand_id: form.brandId || null };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else { await create(payload); toast.success("Created"); }
    setShowForm(false); resetForm();
  };

  const toggleStatus = async (s: Service) => {
    const next = s.status === "Active" ? "Inactive" : "Active";
    await update(s.id, { status: statusToDb(next), data: { ...s, status: next } });
    toast.success("Status updated");
  };

  const filtered = statusFilter === "all" ? items : items.filter(s => s.status === statusFilter);
  const detail = detailId ? items.find(s => s.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">SERVICES</h1></div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Service</Button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <ExportButton data={filtered as any[]} filename="services" title="Services" />
          <SavedViews page="services" currentFilters={{ statusFilter }} onApply={(f) => setStatusFilter(f.statusFilter ?? "all")} />
        </div>
        <div className="flex gap-2 mb-4">
          {["all", "Active", "Inactive"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>{s === "all" ? "All" : s}</button>
          ))}
          <div className="ml-auto flex gap-3 text-xs font-display">
            <span className="text-scarab">{items.filter(s => s.status === "Active").length} Active</span> / <span>{items.filter(s => s.status === "Inactive").length} Inactive</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setDetailId(s.id)}>
              <div className="flex items-start justify-between">
                <div><h3 className="font-display text-sm text-foreground">{s.name}</h3><p className="text-xs text-muted-foreground mt-1">{s.description}</p></div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleStatus(s)} className={`p-1.5 rounded-md text-xs font-display ${s.status === "Active" ? "text-scarab hover:bg-scarab/10" : "text-muted-foreground hover:bg-muted/30"}`} title="Toggle status">
                    {s.status === "Active" ? "●" : "○"}
                  </button>
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {s.responsiblePerson && <p className="text-[10px] text-primary mt-1">Key Person: {summarizeKeyPersons(s.responsiblePerson)}</p>}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-display bg-primary/20 text-primary">{s.category}</span>
                <span className="text-xs font-display text-scarab">{s.price}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${s.status === "Active" ? "bg-scarab/20 text-scarab" : "bg-muted text-muted-foreground"}`}>{s.status}</span>
              </div>
              <div className="mt-2"><StaffMetrics humanCount={s.humanCount} aiCount={s.aiCount} /></div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No services found</p>}
        <div className="mt-6"><ApiIntegrationStatus /></div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? "Edit Service" : "New Service"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <ResponsiblePerson value={form.responsiblePerson} onChange={v => setForm(p => ({ ...p, responsiblePerson: v }))} />
            <BrandSelector value={form.brandId} onChange={(id) => setForm(p => ({ ...p, brandId: id }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Price</Label><Input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" min={0} value={form.humanCount} onChange={e => setForm(p => ({ ...p, humanCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" min={0} value={form.aiCount} onChange={e => setForm(p => ({ ...p, aiCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Service["status"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Active</option><option>Inactive</option></select>
            </div>
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="service" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.name || "New Service"} ownerKind="service" ownerId={editId || undefined} />
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
                <p className="text-xs text-muted-foreground">{detail.description}</p>
                {detail.responsiblePerson && <p className="text-xs text-primary">Key Person: {summarizeKeyPersons(detail.responsiblePerson)}</p>}
                <StaffMetrics humanCount={detail.humanCount} aiCount={detail.aiCount} />
                <EntityApiHub entityName={detail.name} ownerKind="service" ownerId={detail.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Delete Service?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) await remove(deleteId); setDeleteId(null); toast.success("Deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
