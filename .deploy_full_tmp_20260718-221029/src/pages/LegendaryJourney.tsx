import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, Scroll, Star, Calendar, Edit, Trash2 } from "lucide-react";
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
import ResponsiblePerson, { summarizeKeyPersons } from "@/components/shared/ResponsiblePerson";

type DocFile = { id: string; name: string; category: string };
type Milestone = { id: string; title: string; date: string; description: string; category: "Achievement" | "Challenge" | "Expansion" | "Innovation"; responsiblePerson: string; files: DocFile[] };

const catColors: Record<string, string> = { Achievement: "bg-primary/20 text-primary border-primary/30", Challenge: "bg-blood-red/20 text-blood-red border-blood-red/30", Expansion: "bg-nile/20 text-nile border-nile/30", Innovation: "bg-scarab/20 text-scarab border-scarab/30" };
const emptyForm: Omit<Milestone, "id"> = { title: "", date: "", description: "", category: "Achievement", responsiblePerson: "", files: [] };

const LegendaryJourney = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items: rows, create, update, remove } = useEntities("legendary_journey");
  const items: Milestone[] = useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyForm,
    ...(r.data as any),
    title:             (r.data as any)?.title       || r.name,
    date:              (r as any).date              ?? (r.data as any)?.date              ?? "",
    description:       (r as any).description      ?? (r.data as any)?.description       ?? "",
    category:          (r as any).category         ?? (r.data as any)?.category          ?? "Achievement",
    responsiblePerson: (r as any).responsible_person ?? (r.data as any)?.responsiblePerson ?? "",
  })).sort((a, b) => a.date.localeCompare(b.date)), [rows]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Milestone, "id">>(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditId(null); };
  const openEdit = (m: Milestone) => { const { id, ...rest } = m; setForm(rest); setEditId(m.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error(t('required')); return; }
    const payload = {
      name:               form.title,
      status:             "active",
      date:               form.date               || null,
      description:        form.description        || null,
      category:           form.category           || null,
      responsible_person: form.responsiblePerson  || null,
      data:               form,
    };
    if (editId) { await update(editId, payload); toast.success(t('updated_success')); }
    else { await create(payload); toast.success(t('created_success')); }
    setShowForm(false); resetForm();
  };

  const detail = detailId ? items.find(m => m.id === detailId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">{t('back_btn')}</span></button>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2"><Scroll className="w-5 h-5 text-primary" /><h1 className="font-display text-lg text-primary">{t('legendary_journey').toUpperCase()}</h1></div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> {t('add_milestone_btn')}</Button>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />
          <div className="space-y-6">
            {items.map(m => (
              <div key={m.id} className="relative pl-12 cursor-pointer" onClick={() => setDetailId(m.id)}>
                <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-primary gold-glow" />
                <div className={`bg-card border rounded-lg p-4 ${catColors[m.category]} hover:border-primary/50 transition-colors`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-3.5 h-3.5 text-primary" />
                      <span className="font-display text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{m.date}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${catColors[m.category]}`}>{m.category}</span>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(m)} className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3 h-3" /></button>
                      <button onClick={() => setDeleteId(m.id)} className="p-1 rounded text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <h3 className="font-display text-sm text-foreground">{m.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                  {m.responsiblePerson && <p className="text-[10px] text-primary mt-1">{t('key_person_label')} {summarizeKeyPersons(m.responsiblePerson)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6"><ApiIntegrationStatus /></div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId ? t('edit') : t('new_btn')} {t('add_milestone_btn').replace('Add ','')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as Milestone["category"] }))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Achievement</option><option>Challenge</option><option>Expansion</option><option>Innovation</option></select>
              </div>
            </div>
            <ResponsiblePerson value={form.responsiblePerson} onChange={v => setForm(p => ({ ...p, responsiblePerson: v }))} />
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <EntityFileUpload files={form.files} onChange={files => setForm(p => ({ ...p, files }))} ownerKind="legendary_journey" ownerId={editId || undefined} />
            <EntityApiHub entityName={form.title || "New Milestone"} ownerKind="legendary_journey" ownerId={editId || undefined} />
          </div>
          <DialogFooter><Button onClick={handleSubmit} className="font-display text-xs">{editId ? t('save') : t('add_milestone_btn')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle className="font-display text-primary">{detail.title}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{detail.date} • {detail.category}</p>
                <p className="text-xs text-muted-foreground">{detail.description}</p>
                {detail.responsiblePerson && <p className="text-xs text-primary">{t('key_person_label')} {summarizeKeyPersons(detail.responsiblePerson)}</p>}
                <EntityApiHub entityName={detail.title} ownerKind="legendary_journey" ownerId={detail.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-blood-red">Delete Milestone?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteId) await remove(deleteId); setDeleteId(null); toast.success("Deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LegendaryJourney;
