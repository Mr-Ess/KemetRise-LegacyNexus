import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSectors, createSector, updateSector, deleteSector,
  type SectorEntry, type CreateSectorDto,
} from "@/services/erp/sectorRegistryService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";

const PRESET_ICONS = ['🎓','🏥','🏋️','⚖️','✈️','🏢','🛒','🌐','🏦','🎨','🔬','🏗️','🍽️','🎵','💼','🏠','🚗','👗'];
const PRESET_COLORS = ['#6366f1','#ef4444','#f97316','#8b5cf6','#06b6d4','#10b981','#f59e0b','#64748b','#0ea5e9','#84cc16','#ec4899','#14b8a6'];

export default function SectorManager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SectorEntry | null>(null);
  const [form, setForm] = useState<CreateSectorDto>({ code: '', label: '', icon: '🏢', color: '#6366f1', description: '' });

  const { data: sectors = [], isLoading } = useQuery<SectorEntry[]>({
    queryKey: ['sector-registry'],
    queryFn: listSectors,
  });

  const reset = () => { setEditing(null); setForm({ code: '', label: '', icon: '🏢', color: '#6366f1', description: '', sort_order: sectors.length + 1 }); };

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => editing ? updateSector(editing.code, form) : createSector(form),
    onSuccess: () => { toast.success(editing ? 'Sector updated' : 'Sector created'); qc.invalidateQueries({ queryKey: ['sector-registry'] }); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (code: string) => deleteSector(code),
    onSuccess: () => { toast.success('Sector deleted'); qc.invalidateQueries({ queryKey: ['sector-registry'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ code, val }: { code: string; val: boolean }) => updateSector(code, { is_active: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sector-registry'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
    </div>
  );

  const active = sectors.filter(s => s.is_active).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Sector Registry</p>
          <p className="text-xs text-muted-foreground">{active} active · {sectors.length} total · Fully dynamic — add, edit, or deactivate any sector</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4"/>New Sector</Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sectors.map(s => (
          <div
            key={s.code}
            className={`rounded-2xl border p-4 relative transition-all ${!s.is_active ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}
            style={{ borderLeftWidth: 4, borderLeftColor: s.color }}
          >
            {/* Active toggle */}
            <div className="absolute top-3 right-3">
              <Switch checked={s.is_active} onCheckedChange={v => toggle({ code: s.code, val: v })} />
            </div>

            <div className="text-3xl mb-2">{s.icon}</div>
            <p className="font-semibold text-sm pr-8 leading-tight">{s.label}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{s.code}</p>
            {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}

            <div className="flex gap-1 mt-3">
              <Button
                variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1"
                onClick={() => { setEditing(s); setForm({ code: s.code, label: s.label, icon: s.icon, color: s.color, description: s.description ?? '', sort_order: s.sort_order }); setOpen(true); }}
              >
                <Pencil className="h-3 w-3"/>Edit
              </Button>
              <Button
                variant="outline" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => { if(confirm(`Delete sector "${s.label}"?`)) remove(s.code); }}
              >
                <Trash2 className="h-3.5 w-3.5"/>
              </Button>
            </div>
          </div>
        ))}

        {/* Add card */}
        <button
          className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors text-muted-foreground"
          onClick={() => { reset(); setOpen(true); }}
        >
          <Plus className="h-6 w-6" />
          <span className="text-xs font-medium">Add Sector</span>
        </button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Sector' : 'New Sector'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Sector Code *</Label>
                <Input
                  value={form.code}
                  onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))}
                  placeholder="e.g. MFG-01"
                  disabled={!!editing}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label *</Label>
                <Input value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} placeholder="e.g. Manufacturing" />
              </div>
            </div>

            {/* Icon picker */}
            <div className="space-y-2">
              <Label className="text-xs">Icon</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map(ico => (
                  <button
                    key={ico}
                    type="button"
                    onClick={() => setForm(f => ({...f, icon: ico}))}
                    className={`text-xl p-1.5 rounded-lg transition-all ${form.icon === ico ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'hover:bg-muted'}`}
                  >
                    {ico}
                  </button>
                ))}
                <Input
                  value={form.icon}
                  onChange={e => setForm(f => ({...f, icon: e.target.value}))}
                  className="w-16 text-center text-lg h-9"
                  maxLength={4}
                />
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <Label className="text-xs">Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setForm(f => ({...f, color: col}))}
                    className={`w-7 h-7 rounded-full transition-all ${form.color === col ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: col }}
                  />
                ))}
                <Input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({...f, color: e.target.value}))}
                  className="w-10 h-7 p-0.5 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={form.description ?? ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief description of this sector" />
            </div>

            {/* Preview */}
            <div className="rounded-xl p-3 border-l-4 bg-muted/30" style={{ borderLeftColor: form.color }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{form.icon || '🏢'}</span>
                <div>
                  <p className="font-semibold text-sm">{form.label || 'Sector Label'}</p>
                  <p className="text-xs text-muted-foreground font-mono">{form.code || 'CODE-00'}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.code || !form.label || isPending}>
              {isPending ? 'Saving…' : editing ? 'Update Sector' : 'Create Sector'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
