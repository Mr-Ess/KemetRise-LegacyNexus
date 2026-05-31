import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Shield, Heart, Upload } from "lucide-react";
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

type DocFile = { id: string; name: string; category: string };
type Heir = { id: string; name: string; relationship: string; email: string; phone: string; whatsapp: string; accessLevel: "Full" | "Partial" | "View Only"; assets: string; notes: string; photoUrl: string; responsiblePerson: string; humanCount: number; aiCount: number; files: DocFile[] };


const accessColors: Record<string, string> = { Full: "bg-scarab/20 text-scarab", Partial: "bg-primary/20 text-primary", "View Only": "bg-muted text-muted-foreground" };
const emptyForm: Omit<Heir, "id"> = { name: "", relationship: "", email: "", phone: "", whatsapp: "", accessLevel: "Full", assets: "", notes: "", photoUrl: "", responsiblePerson: "", humanCount: 0, aiCount: 0, files: [] };

const DigitalInheritance = () => {
  const navigate = useNavigate();
  const { items: rows, create, update, remove } = useEntities("digital_inheritance");
  const items: Heir[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyForm,
    ...(r.data as any),
    name:              (r as any).name              ?? (r.data as any)?.name              ?? "",
    relationship:      (r as any).relationship      ?? (r.data as any)?.relationship      ?? "",
    email:             (r as any).email             ?? (r.data as any)?.email             ?? "",
    phone:             (r as any).phone             ?? (r.data as any)?.phone             ?? "",
    whatsapp:          (r as any).whatsapp          ?? (r.data as any)?.whatsapp          ?? "",
    accessLevel:       (r as any).access_level      ?? (r.data as any)?.accessLevel       ?? "Full",
    assets:            (r as any).assets            ?? (r.data as any)?.assets            ?? "",
    notes:             (r as any).notes             ?? (r.data as any)?.notes             ?? "",
    photoUrl:          (r as any).photo_url         ?? (r.data as any)?.photoUrl          ?? "",
    humanCount:        (r as any).human_count       ?? (r.data as any)?.humanCount        ?? 0,
    aiCount:           (r as any).ai_count          ?? (r.data as any)?.aiCount           ?? 0,
    responsiblePerson: (r as any).responsible_person ?? (r.data as any)?.responsiblePerson ?? "",
  })), [rows]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Heir, "id">>(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditId(null); };
  const openEdit = (h: Heir) => { const { id, ...rest } = h; setForm(rest); setEditId(h.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = {
      name:               form.name,
      status:             "active",
      relationship:       form.relationship       || null,
      email:              form.email              || null,
      phone:              form.phone              || null,
      whatsapp:           form.whatsapp           || null,
      access_level:       form.accessLevel        || null,
      assets:             form.assets             || null,
      notes:              form.notes              || null,
      photo_url:          form.photoUrl           || null,
      human_count:        form.humanCount         || 0,
      ai_count:           form.aiCount            || 0,
      responsible_person: form.responsiblePerson  || null,
      data:               form,
    };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else { await create(payload); toast.success("Added"); }
    setShowForm(false); resetForm();
  };

  const detail = detailId ? items.find(h => h.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">DIGITAL INHERITORS</h1></div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Heir</Button>
        </div>
        <div className="flex gap-3 text-xs font-display mb-4">
          <span className="text-foreground">👤 {items.reduce((a, h) => a + h.humanCount, 0)} Human</span>
          <span className="text-nile">🤖 {items.reduce((a, h) => a + h.aiCount, 0)} AI</span>
        </div>
        <div className="space-y-3">
          {items.map(h => (
            <div key={h.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setDetailId(h.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {h.photoUrl ? (
                    <img src={h.photoUrl} alt={h.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Heart className="w-5 h-5 text-primary" /></div>
                  )}
                  <div>
                    <h3 className="font-display text-sm text-foreground">{h.name}</h3>
                    <p className="text-xs text-muted-foreground">{h.relationship} • {h.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${accessColors[h.accessLevel]}`}>{h.accessLevel} Access</span>
                    </div>
                    {h.responsiblePerson && <p className="text-[10px] text-primary mt-0.5">Key Person: {summarizeKeyPersons(h.responsiblePerson)}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1"><span className="text-primary">Assets:</span> {h.assets}</p>
                    {h.phone && <p className="text-[10px] text-muted-foreground mt-0.5">{h.phone}{h.whatsapp && ` • WA: ${h.whatsapp}`}</p>}
                    {h.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{h.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(h)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(h.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6"><ApiIntegrationStatus /></div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? "Edit" : "New"} Heir</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo / Image</Label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-md cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" /><span className="font-body text-xs text-muted-foreground">Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setForm(p => ({ ...p, photoUrl: URL.createObjectURL(f) })); }} />
                </label>
                {form.photoUrl && <img src={form.photoUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-border" />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Relationship</Label><Input value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Access Level</Label>
                <select value={form.accessLevel} onChange={e => setForm(p => ({ ...p, accessLevel: e.target.value as Heir["accessLevel"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Full</option><option>Partial</option><option>View Only</option></select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <ResponsiblePerson value={form.responsiblePerson} onChange={v => setForm(p => ({ ...p, responsiblePerson: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" min={0} value={form.humanCount} onChange={e => setForm(p => ({ ...p, humanCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" min={0} value={form.aiCount} onChange={e => setForm(p => ({ ...p, aiCount: +e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>Assigned Assets</Label><Textarea value={form.assets} onChange={e => setForm(p => ({ ...p, assets: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="digital_inheritance" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.name || "New Heir"} ownerKind="digital_inheritance" ownerId={editId || undefined} />
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
                {detail.photoUrl && <img src={detail.photoUrl} alt={detail.name} className="w-16 h-16 rounded-full object-cover border border-border" />}
                <p className="text-xs text-muted-foreground">{detail.relationship} • {detail.accessLevel} Access</p>
                <p className="text-xs text-muted-foreground">Assets: {detail.assets}</p>
                <StaffMetrics humanCount={detail.humanCount} aiCount={detail.aiCount} />
                <EntityApiHub entityName={detail.name} ownerKind="digital_inheritance" ownerId={detail.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Remove Heir?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-body">This will remove them from the digital inheritance plan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) await remove(deleteId); setDeleteId(null); toast.success("Removed"); }}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalInheritance;
