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
type ContactEntry = { id: string; type: string; value: string };
type AttachmentFile = { id: string; name: string; label: string };
type SocialAccount = { id: string; platform: string; url: string };
type Customer = { id: string; name: string; email: string; phone: string; company: string; status: "Active" | "Inactive" | "Lead"; totalOrders: number; loyaltyPoints: number; notes: string; whatsapp: string; responsiblePerson: string; humanCount: number; aiCount: number; files: DocFile[]; contacts?: ContactEntry[]; extraAttachments?: AttachmentFile[]; socialAccounts?: SocialAccount[] };

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
    name:              (r as any).name              ?? (r.data as any)?.name              ?? "",
    email:             (r as any).email             ?? (r.data as any)?.email             ?? "",
    phone:             (r as any).phone             ?? (r.data as any)?.phone             ?? "",
    company:           (r as any).company           ?? (r.data as any)?.company           ?? "",
    totalOrders:       (r as any).total_orders      ?? (r.data as any)?.totalOrders       ?? 0,
    loyaltyPoints:     (r as any).loyalty_points    ?? (r.data as any)?.loyaltyPoints     ?? 0,
    notes:             (r as any).notes             ?? (r.data as any)?.notes             ?? "",
    whatsapp:          (r as any).whatsapp          ?? (r.data as any)?.whatsapp          ?? "",
    humanCount:        (r as any).human_count       ?? (r.data as any)?.humanCount        ?? 0,
    aiCount:           (r as any).ai_count          ?? (r.data as any)?.aiCount           ?? 0,
    responsiblePerson: (r as any).responsible_person ?? (r.data as any)?.responsiblePerson ?? "",
    status:   (r as any).status === "inactive" ? "Inactive" : (r as any).status === "pending" ? "Lead" : ((r.data as any)?.status ?? "Active"),
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
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [extraAttachments, setExtraAttachments] = useState<AttachmentFile[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);

  const resetForm = () => { setForm(emptyForm); setContacts([]); setExtraAttachments([]); setSocialAccounts([]); setEditId(null); };
  const openEdit = (c: Customer) => {
    const { id, ...rest } = c;
    setForm(rest);
    const existingContacts = (c as any).contacts;
    if (existingContacts && existingContacts.length > 0) {
      setContacts(existingContacts);
    } else {
      const migrated: ContactEntry[] = [];
      if (c.phone) migrated.push({ id: crypto.randomUUID(), type: "Phone", value: c.phone });
      if (c.email) migrated.push({ id: crypto.randomUUID(), type: "Email", value: c.email });
      if (c.whatsapp) migrated.push({ id: crypto.randomUUID(), type: "WhatsApp", value: c.whatsapp });
      setContacts(migrated);
    }
    setExtraAttachments((c as any).extraAttachments || []);
    setSocialAccounts((c as any).socialAccounts || []);
    setEditId(c.id); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = {
      name:               form.name,
      status:             statusToDb(form.status),
      email:              form.email              || null,
      phone:              form.phone              || null,
      company:            form.company            || null,
      total_orders:       form.totalOrders        || 0,
      loyalty_points:     form.loyaltyPoints      || 0,
      notes:              form.notes              || null,
      whatsapp:           form.whatsapp           || null,
      human_count:        form.humanCount         || 0,
      ai_count:           form.aiCount            || 0,
      responsible_person: form.responsiblePerson  || null,
      data:               { ...form, contacts, extraAttachments, socialAccounts },
    };
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
            {/* Social Media Accounts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Social Media Accounts</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setSocialAccounts(p => [...p, { id: crypto.randomUUID(), platform: "Facebook", url: "" }])} className="gap-1 text-xs"><Plus className="w-3 h-3" />Add</Button>
              </div>
              {socialAccounts.map((acc, i) => (
                <div key={acc.id} className="flex items-center gap-2">
                  <select value={acc.platform} onChange={e => setSocialAccounts(p => p.map((x, idx) => idx === i ? { ...x, platform: e.target.value } : x))} className="rounded-md bg-secondary border border-border px-2 py-1.5 text-xs font-body text-foreground w-32 shrink-0">
                    <option>Facebook</option><option>Instagram</option><option>Twitter/X</option><option>LinkedIn</option><option>TikTok</option><option>YouTube</option><option>WhatsApp</option><option>Telegram</option><option>Snapchat</option><option>Pinterest</option><option>Other</option>
                  </select>
                  <Input value={acc.url} onChange={e => setSocialAccounts(p => p.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} placeholder="URL or username" className="bg-secondary border-border text-foreground text-xs" />
                  <button type="button" onClick={() => setSocialAccounts(p => p.filter((_, idx) => idx !== i))} className="p-1 text-destructive shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            {/* Dynamic Contacts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contact Methods</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setContacts(p => [...p, { id: crypto.randomUUID(), type: "Phone", value: "" }])} className="gap-1 text-xs"><Plus className="w-3 h-3" />Add</Button>
              </div>
              {contacts.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <select value={c.type} onChange={e => setContacts(p => p.map((x, idx) => idx === i ? { ...x, type: e.target.value } : x))} className="rounded-md bg-secondary border border-border px-2 py-1.5 text-xs font-body text-foreground w-28 shrink-0">
                    <option>Phone</option><option>Email</option><option>WhatsApp</option><option>LinkedIn</option><option>Twitter</option><option>Other</option>
                  </select>
                  <Input value={c.value} onChange={e => setContacts(p => p.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} placeholder="Value" className="bg-secondary border-border text-foreground text-xs" />
                  <button type="button" onClick={() => setContacts(p => p.filter((_, idx) => idx !== i))} className="p-1 text-destructive shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Customer["status"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Active</option><option>Inactive</option><option>Lead</option></select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Loyalty Points</Label><Input type="number" min={0} value={form.loyaltyPoints} onChange={e => setForm(p => ({ ...p, loyaltyPoints: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" min={0} value={form.humanCount} onChange={e => setForm(p => ({ ...p, humanCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" min={0} value={form.aiCount} onChange={e => setForm(p => ({ ...p, aiCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            {/* Extra Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Extra Attachments</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setExtraAttachments(p => [...p, { id: crypto.randomUUID(), name: "", label: "" }])} className="gap-1 text-xs"><Plus className="w-3 h-3" />Add</Button>
              </div>
              {extraAttachments.map((a, i) => (
                <div key={a.id} className="flex items-center gap-2">
                  <Input value={a.label} onChange={e => setExtraAttachments(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Description / Label" className="bg-secondary border-border text-foreground text-xs flex-1" />
                  <label className="flex items-center gap-1 cursor-pointer px-2 py-1.5 rounded-md bg-secondary border border-border text-[10px] text-muted-foreground hover:text-primary transition-colors shrink-0">
                    📎 <span className="max-w-[80px] truncate">{a.name || "Browse…"}</span>
                    <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setExtraAttachments(p => p.map((x, idx) => idx === i ? { ...x, name: f.name } : x)); e.target.value = ""; }} />
                  </label>
                  <button type="button" onClick={() => setExtraAttachments(p => p.filter((_, idx) => idx !== i))} className="p-1 text-destructive shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
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
                {((detail as any).socialAccounts?.length > 0) && (
                  <div className="space-y-1 border-t border-border pt-2">
                    <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">Social Media</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(detail as any).socialAccounts.map((acc: SocialAccount) => (
                        <span key={acc.id} className="text-[10px] bg-secondary/60 px-2 py-0.5 rounded-full border border-border text-foreground">{acc.platform}{acc.url ? ` · ${acc.url}` : ""}</span>
                      ))}
                    </div>
                  </div>
                )}
                {((detail as any).contacts?.length > 0) && (
                  <div className="space-y-1 border-t border-border pt-2">
                    <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">Contact Methods</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(detail as any).contacts.map((c: ContactEntry) => (
                        <span key={c.id} className="text-[10px] bg-secondary/60 px-2 py-0.5 rounded border border-border text-foreground">{c.type}: {c.value}</span>
                      ))}
                    </div>
                  </div>
                )}
                {((detail as any).extraAttachments?.length > 0) && (
                  <div className="space-y-1 border-t border-border pt-2">
                    <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">Attachments</p>
                    {(detail as any).extraAttachments.map((a: AttachmentFile) => (
                      <div key={a.id} className="flex items-center gap-2 text-[10px]">
                        <span>📎</span>
                        {a.label && <span className="text-primary font-display">{a.label}:</span>}
                        <span className="text-foreground">{a.name}</span>
                      </div>
                    ))}
                  </div>
                )}
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
