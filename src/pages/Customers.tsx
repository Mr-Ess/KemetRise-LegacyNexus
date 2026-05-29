import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Users, Phone, Mail, Share2 } from "lucide-react";
import { copyShareLink } from "@/lib/shareLink";
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
import ExportButton from "@/components/shared/ExportButton";
import { SavedViews } from "@/components/shared/SavedViews";

type DocFile = { id: string; name: string; category: string };
type Customer = { id: string; name: string; email: string; phone: string; company: string; status: "Active" | "Inactive" | "Lead"; totalOrders: number; loyaltyPoints: number; notes: string; whatsapp: string; responsiblePerson: string; humanCount: number; aiCount: number; files: DocFile[] };

const statusColors: Record<string, string> = { Active: "bg-scarab/20 text-scarab", Inactive: "bg-muted text-muted-foreground", Lead: "bg-primary/20 text-primary" };
const emptyForm: Omit<Customer, "id"> = { name: "", email: "", phone: "", company: "", status: "Active", totalOrders: 0, loyaltyPoints: 0, notes: "", whatsapp: "", responsiblePerson: "", humanCount: 0, aiCount: 0, files: [] };
const statusToDb = (s: string) => s === "Active" ? "active" : s === "Inactive" ? "inactive" : "pending";

const Customers = () => {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("customers");
  const items: Customer[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyForm,
    ...(r.data as any),
    name: (r as any).name ?? (r.data as any)?.name ?? "",
    status: (r as any).status === "inactive" ? "Inactive" : (r as any).status === "pending" ? "Lead" : ((r.data as any)?.status ?? "Active"),
  })), [rows]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSel = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const bulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} customers?`)) return;
    for (const id of selected) await remove(id);
    toast.success(`Deleted ${selected.size}`); setSelected(new Set());
  };
  const [form, setForm] = useState<Omit<Customer, "id">>(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditId(null); };
  const openEdit = (c: Customer) => { const { id, ...rest } = c; setForm(rest); setEditId(c.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = { name: form.name, status: statusToDb(form.status), data: form };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else { await create(payload); toast.success("Added"); }
    setShowForm(false); resetForm();
  };

  const filtered = statusFilter === "all" ? items : items.filter(c => c.status === statusFilter);
  const detail = detailId ? items.find(c => c.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">CUSTOMERS</h1></div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Customer</Button>
        </div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <ExportButton data={filtered as any[]} filename="customers" title="Customers" />
          <SavedViews page="customers" currentFilters={{ statusFilter }} onApply={(f) => setStatusFilter(f.statusFilter ?? "all")} />
          {selected.size > 0 && (
            <>
              <span className="text-[10px] text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="destructive" onClick={bulkDelete} className="text-xs gap-1"><Trash2 className="w-3 h-3"/>Delete</Button>
              <Button size="sm" variant="outline" onClick={() => setSelected(new Set())} className="text-xs">Clear</Button>
            </>
          )}
        </div>
        <div className="flex gap-2 mb-4">
          {["all", "Active", "Inactive", "Lead"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>{s === "all" ? "All" : s}</button>
          ))}
          <div className="ml-auto flex gap-3 text-xs font-display">
            <span className="text-foreground">👤 {items.reduce((a, c) => a + c.humanCount, 0)} Human</span>
            <span className="text-nile">🤖 {items.reduce((a, c) => a + c.aiCount, 0)} AI</span>
          </div>
        </div>
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className={`bg-card border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer ${selected.has(c.id) ? "border-primary" : "border-border"}`} onClick={() => setDetailId(c.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={selected.has(c.id)} onClick={e=>e.stopPropagation()} onChange={()=>toggleSel(c.id)} className="mt-1 accent-primary" />
                  <div>
                  <h3 className="font-display text-sm text-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.company}</p>
                  {c.responsiblePerson && <p className="text-[10px] text-primary mt-0.5">Key Person: {summarizeKeyPersons(c.responsiblePerson)}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${statusColors[c.status]}`}>{c.status}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                    <span className="text-[10px] text-muted-foreground">{c.totalOrders} orders</span>
                    <span className="text-[10px] text-primary">⭐ {c.loyaltyPoints} pts</span>
                  </div>
                  {c.notes && <p className="text-[10px] text-primary mt-1">{c.notes}</p>}
                  <div className="mt-2"><StaffMetrics humanCount={c.humanCount} aiCount={c.aiCount} /></div>
                  </div>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => copyShareLink("customer", c)} className="p-1.5 rounded-md text-muted-foreground hover:text-nile hover:bg-nile/10" title="Share"><Share2 className="w-4 h-4" /></button>
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No customers found</p>}
        </div>
        <div className="mt-6"><ApiIntegrationStatus /></div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? "Edit" : "New"} Customer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <ResponsiblePerson value={form.responsiblePerson} onChange={v => setForm(p => ({ ...p, responsiblePerson: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Customer["status"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Active</option><option>Inactive</option><option>Lead</option></select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Loyalty Points</Label><Input type="number" min={0} value={form.loyaltyPoints} onChange={e => setForm(p => ({ ...p, loyaltyPoints: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" min={0} value={form.humanCount} onChange={e => setForm(p => ({ ...p, humanCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" min={0} value={form.aiCount} onChange={e => setForm(p => ({ ...p, aiCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="customer" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.name || "New Customer"} ownerKind="customer" ownerId={editId || undefined} />
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
                <p className="text-xs text-muted-foreground">{detail.company} • {detail.totalOrders} orders</p>
                {detail.responsiblePerson && <p className="text-xs text-primary">Key Person: {summarizeKeyPersons(detail.responsiblePerson)}</p>}
                <StaffMetrics humanCount={detail.humanCount} aiCount={detail.aiCount} />
                <EntityApiHub entityName={detail.name} ownerKind="customer" ownerId={detail.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Delete Customer?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) await remove(deleteId); setDeleteId(null); toast.success("Deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
