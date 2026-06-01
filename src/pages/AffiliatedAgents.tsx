import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Users, X } from "lucide-react";
import { useEntities } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import ApiIntegrationStatus from "@/components/dashboard/ApiIntegrationStatus";
import EntityFileUpload from "@/components/shared/EntityFileUpload";
import EntityApiHub from "@/components/shared/EntityApiHub";
import ExportButton from "@/components/shared/ExportButton";
import { SavedViews } from "@/components/shared/SavedViews";

type DocFile = { id: string; name: string; category: string };
type ContactEntry = { id: string; type: string; value: string };
type AttachmentFile = { id: string; name: string; label: string };
type SocialAccount = { id: string; platform: string; url: string };
type Agent = {
  id: string; agentName: string; commissionRate: number; totalSales: number;
  status: "Active" | "Inactive"; notes: string; files: DocFile[];
  contacts?: ContactEntry[]; extraAttachments?: AttachmentFile[]; socialAccounts?: SocialAccount[];
};

const emptyForm: Omit<Agent, "id"> = { agentName: "", commissionRate: 0.05, totalSales: 0, status: "Active", notes: "", files: [], contacts: [], extraAttachments: [] };
const statusToDb = (s: string) => s === "Active" ? "active" : "inactive";

export default function AffiliatedAgents() {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("affiliated_agents");
  const items: Agent[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyForm,
    ...(r.data as any),
    agentName:      (r as any).agent_name      ?? (r.data as any)?.agentName      ?? "",
    commissionRate: (r as any).commission_rate ?? (r.data as any)?.commissionRate ?? 0.05,
    totalSales:     (r as any).total_sales     ?? (r.data as any)?.totalSales     ?? 0,
    notes:          (r as any).notes           ?? (r.data as any)?.notes          ?? "",
    status: (r as any).status === "inactive" ? "Inactive" : ((r.data as any)?.status ?? "Active"),
  })), [rows]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<Omit<Agent, "id">>(emptyForm);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [extraAttachments, setExtraAttachments] = useState<AttachmentFile[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);

  const resetForm = () => { setForm(emptyForm); setContacts([]); setExtraAttachments([]); setSocialAccounts([]); setEditId(null); };
  const openEdit = (a: Agent) => {
    const { id, ...rest } = a;
    setForm(rest);
    setContacts((a as any).contacts || []);
    setExtraAttachments((a as any).extraAttachments || []);
    setSocialAccounts((a as any).socialAccounts || []);
    setEditId(a.id); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.agentName.trim()) { toast.error("Agent name required"); return; }
    const payload = {
      agent_name:      form.agentName,
      commission_rate: form.commissionRate || 0,
      total_sales:     form.totalSales     || 0,
      status:          statusToDb(form.status),
      notes:           form.notes          || null,
      data:            { ...form, contacts, extraAttachments, socialAccounts },
    };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else { await create(payload); toast.success("Created"); }
    setShowForm(false); resetForm();
  };

  const filtered = statusFilter === "all" ? items : items.filter(a => a.status === statusFilter);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">AFFILIATED AGENTS</h1></div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Agent</Button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <ExportButton data={filtered as any[]} filename="affiliated-agents" title="Affiliated Agents" />
          <SavedViews page="affiliated_agents" currentFilters={{ statusFilter }} onApply={(f) => setStatusFilter(f.statusFilter ?? "all")} />
        </div>
        <div className="flex gap-2 mb-4">
          {["all", "Active", "Inactive"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>{s === "all" ? "All" : s}</button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-sm text-foreground">{a.agentName}</h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${a.status === "Active" ? "bg-scarab/20 text-scarab" : "bg-muted text-muted-foreground"}`}>{a.status}</span>
                    <span className="text-[10px] text-muted-foreground">Rate: <span className="text-scarab font-display">{(a.commissionRate * 100).toFixed(1)}%</span></span>
                    <span className="text-[10px] text-muted-foreground">Sales: <span className="text-primary font-display">{a.totalSales}</span></span>
                  </div>
                  {a.notes && <p className="text-[10px] text-muted-foreground mt-1">{a.notes}</p>}
                  {((a as any).contacts?.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(a as any).contacts.map((c: ContactEntry) => (
                        <span key={c.id} className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">{c.type}: {c.value}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No agents found</p>}
        </div>
        <div className="mt-6"><ApiIntegrationStatus /></div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? "Edit Agent" : "New Agent"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Agent Name *</Label><Input value={form.agentName} onChange={e => setForm(p => ({ ...p, agentName: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Commission Rate</Label><Input type="number" step="0.01" min={0} max={1} value={form.commissionRate} onChange={e => setForm(p => ({ ...p, commissionRate: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Total Sales</Label><Input type="number" min={0} value={form.totalSales} onChange={e => setForm(p => ({ ...p, totalSales: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Agent["status"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Active</option><option>Inactive</option></select>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
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
            {/* Contact Methods */}
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
            {/* Extra Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Extra Attachments</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setExtraAttachments(p => [...p, { id: crypto.randomUUID(), name: "", label: "" }])} className="gap-1 text-xs"><Plus className="w-3 h-3" />Add</Button>
              </div>
              {extraAttachments.map((a, i) => (
                <div key={a.id} className="flex items-center gap-2">
                  <Input value={a.label} onChange={e => setExtraAttachments(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Label / Description" className="bg-secondary border-border text-foreground text-xs" />
                  <Input value={a.name} onChange={e => setExtraAttachments(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="File name" className="bg-secondary border-border text-foreground text-xs" />
                  <button type="button" onClick={() => setExtraAttachments(p => p.filter((_, idx) => idx !== i))} className="p-1 text-destructive shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="affiliated_agent" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.agentName || "New Agent"} ownerKind="affiliated_agent" ownerId={editId || undefined} />
          </div>
          <DialogFooter><Button onClick={handleSubmit} className="font-display text-xs">{editId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Delete Agent?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) await remove(deleteId); setDeleteId(null); toast.success("Deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
