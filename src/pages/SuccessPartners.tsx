import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Handshake, X } from "lucide-react";
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
type TeamMemberEntry = { id: string; name: string; isAI: boolean; contacts: ContactEntry[] };
type Partner = { id: string; name: string; company: string; role: string; contribution: string; status: "Active" | "Inactive"; email: string; phone: string; responsiblePerson: string; humanCount: number; aiCount: number; files: DocFile[]; contacts?: ContactEntry[]; extraAttachments?: AttachmentFile[]; socialAccounts?: SocialAccount[]; teamDetails?: TeamMemberEntry[] };

const emptyForm: Omit<Partner, "id"> = { name: "", company: "", role: "", contribution: "", status: "Active", email: "", phone: "", responsiblePerson: "", humanCount: 0, aiCount: 0, files: [] };
const statusToDb = (s: string) => s === "Active" ? "active" : "inactive";

const SuccessPartners = () => {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("success_partners");
  const items: Partner[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyForm,
    ...(r.data as any),
    name:              (r as any).name              ?? (r.data as any)?.name              ?? "",
    company:           (r as any).company          ?? (r.data as any)?.company           ?? "",
    role:              (r as any).role             ?? (r.data as any)?.role              ?? "",
    contribution:      (r as any).contribution     ?? (r.data as any)?.contribution      ?? "",
    email:             (r as any).email            ?? (r.data as any)?.email             ?? "",
    phone:             (r as any).phone            ?? (r.data as any)?.phone             ?? "",
    humanCount:        (r as any).human_count      ?? (r.data as any)?.humanCount        ?? 0,
    aiCount:           (r as any).ai_count         ?? (r.data as any)?.aiCount           ?? 0,
    responsiblePerson: (r as any).responsible_person ?? (r.data as any)?.responsiblePerson ?? "",
    status:   (r as any).status === "inactive" ? "Inactive" : ((r.data as any)?.status ?? "Active"),
  })), [rows]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<Omit<Partner, "id">>(emptyForm);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [extraAttachments, setExtraAttachments] = useState<AttachmentFile[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [teamDetails, setTeamDetails] = useState<TeamMemberEntry[]>([]);

  const resetForm = () => { setForm(emptyForm); setContacts([]); setExtraAttachments([]); setSocialAccounts([]); setTeamDetails([]); setEditId(null); };
  const openEdit = (p: Partner) => {
    const { id, ...rest } = p;
    setForm(rest);
    const existingContacts = (p as any).contacts;
    if (existingContacts && existingContacts.length > 0) {
      setContacts(existingContacts);
    } else {
      const migrated: ContactEntry[] = [];
      if (p.phone) migrated.push({ id: crypto.randomUUID(), type: "Phone", value: p.phone });
      if (p.email) migrated.push({ id: crypto.randomUUID(), type: "Email", value: p.email });
      setContacts(migrated);
    }
    setExtraAttachments((p as any).extraAttachments || []);
    setSocialAccounts((p as any).socialAccounts || []);
    setTeamDetails((p as any).teamDetails || []);
    setEditId(p.id); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = {
      name:               form.name,
      status:             statusToDb(form.status),
      company:            form.company            || null,
      role:               form.role               || null,
      contribution:       form.contribution       || null,
      email:              form.email              || null,
      phone:              form.phone              || null,
      human_count:        form.humanCount         || 0,
      ai_count:           form.aiCount            || 0,
      responsible_person: form.responsiblePerson  || null,
      data:               { ...form, contacts, extraAttachments, socialAccounts, teamDetails },
    };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else { await create(payload); toast.success("Created"); }
    setShowForm(false); resetForm();
  };

  const filtered = statusFilter === "all" ? items : items.filter(p => p.status === statusFilter);
  const detail = detailId ? items.find(p => p.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><Handshake className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">SUCCESS PARTNERS</h1></div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Partner</Button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <ExportButton data={filtered as any[]} filename="success-partners" title="Success Partners" />
          <SavedViews page="success_partners" currentFilters={{ statusFilter }} onApply={(f) => setStatusFilter(f.statusFilter ?? "all")} />
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
          {filtered.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setDetailId(p.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-sm text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.company} • {p.role}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{p.contribution}</p>
                  {p.responsiblePerson && <p className="text-[10px] text-primary mt-0.5">Key Person: {summarizeKeyPersons(p.responsiblePerson)}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${p.status === "Active" ? "bg-scarab/20 text-scarab" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                    {p.email && <span className="text-[10px] text-muted-foreground">{p.email}</span>}
                  </div>
                  <div className="mt-2"><StaffMetrics humanCount={p.humanCount} aiCount={p.aiCount} /></div>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No partners found</p>}
        </div>
        <div className="mt-6"><ApiIntegrationStatus /></div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? "Edit" : "New"} Partner</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <ResponsiblePerson value={form.responsiblePerson} onChange={v => setForm(p => ({ ...p, responsiblePerson: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Role</Label><Input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            {/* Key Personnel / Team */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Key Personnel / Team</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setTeamDetails(p => [...p, { id: crypto.randomUUID(), name: "", isAI: false, contacts: [] }])} className="gap-1 text-xs"><Plus className="w-3 h-3" />Add Member</Button>
              </div>
              {teamDetails.map((member, mi) => (
                <div key={member.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={member.name} onChange={e => setTeamDetails(p => p.map((m, idx) => idx === mi ? { ...m, name: e.target.value } : m))} placeholder="Member name" className="bg-secondary border-border text-foreground text-xs flex-1" />
                    <button type="button" onClick={() => setTeamDetails(p => p.map((m, idx) => idx === mi ? { ...m, isAI: !m.isAI } : m))} className={`px-3 py-1.5 rounded-full text-[11px] font-display transition-colors shrink-0 ${member.isAI ? "bg-nile/20 text-nile border border-nile/30" : "bg-primary/10 text-primary border border-primary/20"}`}>{member.isAI ? "🤖 AI" : "👤 Human"}</button>
                    <button type="button" onClick={() => setTeamDetails(p => p.filter((_, idx) => idx !== mi))} className="p-1 text-destructive shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Contacts</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setTeamDetails(p => p.map((m, idx) => idx === mi ? { ...m, contacts: [...m.contacts, { id: crypto.randomUUID(), type: "Phone", value: "" }] } : m))} className="h-5 text-[10px] px-2 gap-1"><Plus className="w-2.5 h-2.5" />Add</Button>
                    </div>
                    {member.contacts.map((c, ci) => (
                      <div key={c.id} className="flex items-center gap-1">
                        <select value={c.type} onChange={e => setTeamDetails(p => p.map((m, idx) => idx === mi ? { ...m, contacts: m.contacts.map((x, cidx) => cidx === ci ? { ...x, type: e.target.value } : x) } : m))} className="rounded bg-secondary border border-border px-1 py-1 text-[10px] font-body text-foreground w-24 shrink-0"><option>Phone</option><option>Email</option><option>WhatsApp</option><option>LinkedIn</option><option>Twitter</option><option>Other</option></select>
                        <Input value={c.value} onChange={e => setTeamDetails(p => p.map((m, idx) => idx === mi ? { ...m, contacts: m.contacts.map((x, cidx) => cidx === ci ? { ...x, value: e.target.value } : x) } : m))} placeholder="Value" className="bg-secondary border-border text-foreground text-[10px] h-7" />
                        <button type="button" onClick={() => setTeamDetails(p => p.map((m, idx) => idx === mi ? { ...m, contacts: m.contacts.filter((_, cidx) => cidx !== ci) } : m))} className="p-0.5 text-destructive shrink-0"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" min={0} value={form.humanCount} onChange={e => setForm(p => ({ ...p, humanCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" min={0} value={form.aiCount} onChange={e => setForm(p => ({ ...p, aiCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Partner["status"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Active</option><option>Inactive</option></select>
            </div>
            <div className="space-y-2"><Label>Contribution</Label><Textarea value={form.contribution} onChange={e => setForm(p => ({ ...p, contribution: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
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
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="success_partner" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.name || "New Partner"} ownerKind="success_partner" ownerId={editId || undefined} />
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
                <p className="text-xs text-muted-foreground">{detail.company} • {detail.role}</p>
                {detail.responsiblePerson && <p className="text-xs text-primary">Key Person: {summarizeKeyPersons(detail.responsiblePerson)}</p>}
                <StaffMetrics humanCount={detail.humanCount} aiCount={detail.aiCount} />
                {((detail as any).teamDetails?.length > 0) && (
                  <div className="space-y-1 border-t border-border pt-2">
                    <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">Key Personnel / Team</p>
                    {(detail as any).teamDetails.map((m: TeamMemberEntry) => (
                      <div key={m.id} className="flex items-start gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-display shrink-0 ${m.isAI ? "bg-nile/20 text-nile" : "bg-primary/10 text-primary"}`}>{m.isAI ? "🤖 AI" : "👤 Human"}</span>
                        <div>
                          <span className="text-xs text-foreground">{m.name}</span>
                          {m.contacts?.length > 0 && <div className="flex flex-wrap gap-1 mt-0.5">{m.contacts.map((c: ContactEntry) => <span key={c.id} className="text-[9px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">{c.type}: {c.value}</span>)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <EntityApiHub entityName={detail.name} ownerKind="success_partner" ownerId={detail.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Delete Partner?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) await remove(deleteId); setDeleteId(null); toast.success("Deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuccessPartners;
