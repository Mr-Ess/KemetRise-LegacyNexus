import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, FolderOpen, Calendar, Users, Edit, Trash2, Globe, Paperclip } from "lucide-react";
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
type ContactEntry = { id: string; type: string; value: string };
type AttachmentFile = { id: string; name: string; label: string };
type SocialAccount = { id: string; platform: string; url: string };
type SocialLinks = { website: string; facebook: string; instagram: string; twitter: string; linkedin: string; tiktok: string; youtube: string };
type TeamMemberEntry = { id: string; name: string; position: string; isAI: boolean; contacts: ContactEntry[] };
type Project = {
  id: string; name: string; description: string;
  status: "Active" | "On Hold" | "Completed" | "Cancelled";
  brand: string; brandId?: string | null; startDate: string; endDate: string; team: string[]; budget: string;
  responsiblePerson: string; humanCount: number; aiCount: number; files: DocFile[];
  teamDetails?: TeamMemberEntry[]; extraAttachments?: AttachmentFile[]; socialAccounts?: SocialAccount[];
};

const statusColors: Record<string, string> = {
  Active: "bg-scarab/20 text-scarab", "On Hold": "bg-primary/20 text-primary", Completed: "bg-nile/20 text-nile", Cancelled: "bg-blood-red/20 text-blood-red",
};

const emptyForm: Omit<Project, "id"> = { name: "", description: "", status: "Active", brand: "", brandId: null, startDate: "", endDate: "", team: [], budget: "", responsiblePerson: "", humanCount: 0, aiCount: 0, files: [], teamDetails: [], extraAttachments: [] };

const statusToDb = (s: string) => s === "Active" ? "active" : s === "Completed" ? "inactive" : s === "On Hold" ? "maintenance" : "pending";
const emptySocialLinks: SocialLinks = { website: "", facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "", youtube: "" };

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
  const [teamDetails, setTeamDetails] = useState<TeamMemberEntry[]>([]);
  const [extraAttachments, setExtraAttachments] = useState<AttachmentFile[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(emptySocialLinks);

  const resetForm = () => { setForm(emptyForm); setTeamDetails([]); setExtraAttachments([]); setSocialAccounts([]); setSocialLinks(emptySocialLinks); setEditId(null); };
  const openEdit = (p: Project) => {
    const { id, ...rest } = p;
    setForm(rest);
    const existingTeamDetails = (p as any).teamDetails;
    if (existingTeamDetails && existingTeamDetails.length > 0) {
      setTeamDetails(existingTeamDetails);
    } else {
      setTeamDetails(p.team.map((name: string) => ({ id: crypto.randomUUID(), name, position: "", isAI: false, contacts: [] })));
    }
    setExtraAttachments((p as any).extraAttachments || []);
    setSocialAccounts((p as any).socialAccounts || []);
    setSocialLinks((p as any).socialLinks || emptySocialLinks);
    setEditId(p.id); setShowForm(true);
  };

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
      team:               teamDetails.map(t => t.name).filter(Boolean),
      data:               { ...form, teamDetails, extraAttachments, socialAccounts, socialLinks },
    };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else { await create(payload); toast.success("Created"); }
    setShowForm(false); resetForm();
  };

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
                {((detail as any).teamDetails?.length > 0) && (
                  <div className="space-y-1 border-t border-border pt-2">
                    <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">Team Members</p>
                    {(detail as any).teamDetails.map((m: TeamMemberEntry) => (
                      <div key={m.id} className="flex items-start gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-display shrink-0 ${m.isAI ? "bg-nile/20 text-nile" : "bg-primary/10 text-primary"}`}>{m.isAI ? "🤖 AI" : "👤 Human"}</span>
                        <div>
                          <span className="text-xs text-foreground">{m.name}</span>
                          {m.contacts?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {m.contacts.map((c: ContactEntry) => <span key={c.id} className="text-[9px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">{c.type}: {c.value}</span>)}
                            </div>
                          )}
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
