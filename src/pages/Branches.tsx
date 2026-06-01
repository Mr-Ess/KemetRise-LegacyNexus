import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, Edit, Trash2, Building2, Users, Bot, Clock, X, Globe, Paperclip } from "lucide-react";
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
type ContactEntry = { id: string; type: string; value: string };
type AttachmentFile = { id: string; name: string; label: string };
type SocialAccount = { id: string; platform: string; url: string };
type SocialLinks = { website: string; facebook: string; instagram: string; twitter: string; linkedin: string; tiktok: string; youtube: string };
type TeamMemberEntry = { id: string; name: string; position: string; isAI: boolean; contacts: ContactEntry[] };

type Branch = {
  id: string; name: string; type: string; brandId?: string | null;
  address: string; humanCount: number; aiCount: number; status: "Active" | "Inactive" | "Maintenance";
  shifts: Shift[]; aiTasks: string; responsiblePerson: string; files: DocFile[];
  contacts?: ContactEntry[]; extraAttachments?: AttachmentFile[]; socialAccounts?: SocialAccount[]; teamDetails?: TeamMemberEntry[];
};

const defaultBranchTypes = ["Main", "Sub-branch", "Warehouse", "Data Center", "Office", "Lab", "Showroom"];

const typeColors: Record<string, string> = { Main: "bg-primary/20 text-primary", "Sub-branch": "bg-nile/20 text-nile", Warehouse: "bg-scarab/20 text-scarab", "Data Center": "bg-blood-red/20 text-blood-red", Office: "bg-muted text-muted-foreground" };
const statusToDb = (s: string) => s === "Active" ? "active" : s === "Maintenance" ? "maintenance" : "inactive";
const emptySocialLinks: SocialLinks = { website: "", facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "", youtube: "" };

const Branches = () => {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("branches");
  const emptyShift = (): Shift => ({ id: crypto.randomUUID(), name: "", start: "09:00", end: "17:00" });
  const empty = (): Omit<Branch, "id"> => ({ name: "", type: "Main", brandId: null, address: "", humanCount: 0, aiCount: 0, status: "Active", shifts: [emptyShift()], aiTasks: "", responsiblePerson: "", files: [], contacts: [], extraAttachments: [], teamDetails: [] });
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
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [extraAttachments, setExtraAttachments] = useState<AttachmentFile[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(emptySocialLinks);
  const [teamDetails, setTeamDetails] = useState<TeamMemberEntry[]>([]);

  const resetForm = () => { setForm(empty()); setContacts([]); setExtraAttachments([]); setSocialAccounts([]); setSocialLinks(emptySocialLinks); setTeamDetails([]); setEditId(null); };
  const openEdit = (b: Branch) => { const { id, ...rest } = b; setForm(rest); setContacts((b as any).contacts || []); setExtraAttachments((b as any).extraAttachments || []); setSocialAccounts((b as any).socialAccounts || []); setSocialLinks((b as any).socialLinks || emptySocialLinks); setTeamDetails((b as any).teamDetails || []); setEditId(b.id); setShowForm(true); };

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
      data:               { ...form, contacts, extraAttachments, socialAccounts, socialLinks, teamDetails },
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
            {/* Key Personnel / Team */}
            <div className="flex items-center gap-2 pb-1.5 border-b border-border mb-3 mt-5"><Users className="w-3.5 h-3.5 text-primary"/><span className="font-display text-[11px] tracking-wider text-primary uppercase">Key Personnel / Team</span></div>
            <div className="space-y-3">
              {teamDetails.map((t, i) => (
                <div key={t.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Member #{i+1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{t.isAI ? "🤖 AI" : "👤 Human"}</span>
                      <button type="button" onClick={() => setTeamDetails(p => p.map((tm, ti) => ti === i ? { ...tm, isAI: !tm.isAI } : tm))}
                        className={`w-8 h-4 rounded-full transition-colors relative ${t.isAI ? "bg-primary" : "bg-muted border border-border"}`}>
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${t.isAI ? "translate-x-4" : "translate-x-0.5"}`}/>
                      </button>
                      <button type="button" onClick={() => setTeamDetails(p => p.filter((_, idx) => idx !== i))} className="text-destructive hover:bg-destructive/10 rounded p-1"><X className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Name</Label><Input value={t.name} onChange={e => setTeamDetails(p => p.map((tm, ti) => ti === i ? { ...tm, name: e.target.value } : tm))} className="mt-1 bg-secondary border-border text-xs"/></div>
                    <div><Label className="text-xs">Position</Label><Input value={(t as any).position||""} onChange={e => setTeamDetails(p => p.map((tm, ti) => ti === i ? { ...tm, position: e.target.value } : tm))} className="mt-1 bg-secondary border-border text-xs"/></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contact Info</p>
                  {(t.contacts||[]).map((c, ci) => (
                    <div key={c.id} className="flex items-center gap-1.5">
                      <select value={c.type} onChange={e => setTeamDetails(p => p.map((tm, ti) => ti === i ? { ...tm, contacts: tm.contacts.map((cx, cxi) => cxi === ci ? { ...cx, type: e.target.value } : cx) } : tm))}
                        className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground shrink-0 w-28">
                        <option value="phone">📞 Phone</option><option value="email">📧 Email</option><option value="whatsapp">💬 WhatsApp</option><option value="linkedin">🔗 LinkedIn</option><option value="twitter">𝕏 Twitter</option><option value="other">• Other</option>
                      </select>
                      <Input value={c.value} onChange={e => setTeamDetails(p => p.map((tm, ti) => ti === i ? { ...tm, contacts: tm.contacts.map((cx, cxi) => cxi === ci ? { ...cx, value: e.target.value } : cx) } : tm))} placeholder="Value…" className="flex-1 h-7 text-xs bg-secondary border-border"/>
                      <button type="button" onClick={() => setTeamDetails(p => p.map((tm, ti) => ti === i ? { ...tm, contacts: tm.contacts.filter((_, cxi) => cxi !== ci) } : tm))} className="text-destructive p-0.5 shrink-0 hover:bg-destructive/10 rounded"><X className="w-3 h-3"/></button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={() => setTeamDetails(p => p.map((tm, ti) => ti === i ? { ...tm, contacts: [...tm.contacts, { id: crypto.randomUUID(), type: "phone", value: "" }] } : tm))} className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3"/>Add Contact</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setTeamDetails(p => [...p, { id: crypto.randomUUID(), name: "", position: "", isAI: false, contacts: [] }])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Member</Button>
            </div>
            {/* Social Media & Contact */}
            <div className="flex items-center gap-2 pb-1.5 border-b border-border mb-3 mt-5"><Globe className="w-3.5 h-3.5 text-primary"/><span className="font-display text-[11px] tracking-wider text-primary uppercase">Social Media & Contact</span></div>
            <div className="grid grid-cols-2 gap-3">
              {(["website","facebook","instagram","twitter","linkedin","tiktok","youtube"] as const).map(k => (
                <div key={k}><Label className="text-xs capitalize">{k}</Label><Input value={(socialLinks as any)[k]||""} onChange={e => setSocialLinks(p => ({...p,[k]:e.target.value}))} placeholder={k==="website"?"https://...": k==="youtube"?"https://youtube.com/...":"@handle"} className="mt-1 bg-secondary border-border text-xs"/></div>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Additional Accounts</p>
              {socialAccounts.map((sa, i) => (
                <div key={sa.id} className="flex items-center gap-1.5 mb-1.5">
                  <Input value={sa.platform} onChange={e => setSocialAccounts(p => p.map((s, si) => si === i ? { ...s, platform: e.target.value } : s))} placeholder="Platform…" className="w-28 h-7 text-xs bg-secondary border-border shrink-0"/>
                  <Input value={sa.url} onChange={e => setSocialAccounts(p => p.map((s, si) => si === i ? { ...s, url: e.target.value } : s))} placeholder="URL or @handle" className="flex-1 h-7 text-xs bg-secondary border-border"/>
                  <button type="button" onClick={() => setSocialAccounts(p => p.filter((_, si) => si !== i))} className="text-destructive p-0.5 shrink-0 hover:bg-destructive/10 rounded"><X className="w-3 h-3"/></button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => setSocialAccounts(p => [...p, { id: crypto.randomUUID(), platform: "", url: "" }])} className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3"/>Add Account</Button>
            </div>
            {/* Contact Methods */}
            <div className="space-y-2 mt-4">
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
            <div className="flex items-center gap-2 pb-1.5 border-b border-border mb-3 mt-5"><Paperclip className="w-3.5 h-3.5 text-primary"/><span className="font-display text-[11px] tracking-wider text-primary uppercase">Extra Attachments</span></div>
            <div className="space-y-2">
              {extraAttachments.map((a, i) => (
                <div key={a.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md border border-border">
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0"/>
                  <Input value={a.label} onChange={e => setExtraAttachments(p => p.map((att, ai2) => ai2 === i ? { ...att, label: e.target.value } : att))} placeholder="File description…" className="flex-1 h-7 text-xs bg-secondary border-border"/>
                  <span className="text-xs text-muted-foreground truncate max-w-[90px]">{a.name||"No file"}</span>
                  <label className="cursor-pointer px-2 py-0.5 text-xs text-primary hover:underline shrink-0">Browse<input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f) setExtraAttachments(p => p.map((att, ai2) => ai2 === i ? { ...att, name: f.name } : att)); }}/></label>
                  <button type="button" onClick={() => setExtraAttachments(p => p.filter((_, ai2) => ai2 !== i))} className="text-destructive p-0.5 rounded hover:bg-destructive/10 shrink-0"><X className="w-3 h-3"/></button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setExtraAttachments(p => [...p, { id: crypto.randomUUID(), name: "", label: "" }])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Attachment</Button>
            </div>
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
