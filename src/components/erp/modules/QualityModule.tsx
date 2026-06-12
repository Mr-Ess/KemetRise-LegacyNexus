import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ShieldCheck, ClipboardList, AlertOctagon, Plus, Trash2, Pencil, CheckSquare } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface QCChecklist {
  id: string; name: string; category: string | null; description: string | null;
  version: string | null; is_active: boolean;
}
interface QCInspection {
  id: string; checklist_id: string | null; checklist_name: string | null;
  ref_number: string; inspector: string | null; inspection_date: string;
  status: string; result: string | null; notes: string | null;
}
interface NonConformance {
  id: string; ref_number: string; description: string; severity: string;
  status: string; raised_by: string | null; raised_date: string;
  root_cause: string | null; corrective_action: string | null;
}

const INSP_STATUS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700', in_progress: 'bg-violet-100 text-violet-700',
  passed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-600',
  conditional: 'bg-amber-100 text-amber-700',
};
const NC_STATUS: Record<string, string> = {
  open: 'bg-red-100 text-red-600', under_review: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600',
};
const SEVERITY: Record<string, string> = {
  minor: 'bg-yellow-100 text-yellow-700', major: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function NoTenant() {
  return <div className="py-12 text-center text-muted-foreground text-sm">Select a tenant to view quality data.</div>;
}

export default function QualityModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;

  const { data: checklists = [] } = useQuery<QCChecklist[]>({
    queryKey: ['qlt-checklists', tid],
    queryFn: async () => {
      const { data, error } = await db.from('qlt_checklists').select('*').eq('tenant_id', tid).order('name');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: inspections = [] } = useQuery<QCInspection[]>({
    queryKey: ['qlt-inspections', tid],
    queryFn: async () => {
      const { data, error } = await db.from('qlt_inspections').select('*').eq('tenant_id', tid).order('inspection_date', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: ncs = [] } = useQuery<NonConformance[]>({
    queryKey: ['qlt-ncs', tid],
    queryFn: async () => {
      const { data, error } = await db.from('qlt_non_conformances').select('*').eq('tenant_id', tid).order('raised_date', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const passedInspections = inspections.filter(i => i.status === 'passed').length;
  const openNCs = ncs.filter(n => n.status === 'open').length;
  const criticalNCs = ncs.filter(n => n.severity === 'critical' && n.status !== 'closed').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'QC Checklists',     val: String(checklists.filter(c => c.is_active).length), icon: <ClipboardList className="h-4 w-4"/>,   col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Inspections',       val: String(inspections.length),                          icon: <CheckSquare className="h-4 w-4"/>,      col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Pass Rate',         val: inspections.length ? `${Math.round(passedInspections/inspections.length*100)}%` : '—', icon: <ShieldCheck className="h-4 w-4"/>, col: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Open NCs',          val: String(openNCs),                                     icon: <AlertOctagon className="h-4 w-4"/>,     col: openNCs > 0 ? 'text-red-600' : 'text-emerald-600', bg: openNCs > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30' },
        ].map(s => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg mb-2 ${s.bg} ${s.col}`}>{s.icon}</div>
              <p className="text-xl font-bold">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {criticalNCs > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs">
          <AlertOctagon className="h-4 w-4 shrink-0"/>
          <span><strong>{criticalNCs}</strong> critical non-conformance{criticalNCs > 1 ? 's' : ''} require immediate resolution!</span>
        </div>
      )}

      <Tabs defaultValue="inspections">
        <TabsList className="flex gap-1 flex-wrap h-auto">
          <TabsTrigger value="inspections" className="gap-1 text-xs"><CheckSquare className="h-3.5 w-3.5"/>Inspections</TabsTrigger>
          <TabsTrigger value="ncs"         className="gap-1 text-xs"><AlertOctagon className="h-3.5 w-3.5"/>Non-Conformances</TabsTrigger>
          <TabsTrigger value="checklists"  className="gap-1 text-xs"><ClipboardList className="h-3.5 w-3.5"/>Checklists</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections" className="mt-4">
          <InspectionsTab inspections={inspections} checklists={checklists} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['qlt-inspections', tid] })} />
        </TabsContent>
        <TabsContent value="ncs" className="mt-4">
          <NCsTab ncs={ncs} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['qlt-ncs', tid] })} />
        </TabsContent>
        <TabsContent value="checklists" className="mt-4">
          <ChecklistsTab checklists={checklists} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['qlt-checklists', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InspectionsTab({ inspections, checklists, tenantId, onRefresh }: { inspections: QCInspection[]; checklists: QCChecklist[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ref_number: '', checklist_id: '', inspector: '', inspection_date: new Date().toISOString().slice(0,10), status: 'scheduled', result: '', notes: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const cl = checklists.find(c => c.id === form.checklist_id);
      const { error } = await db.from('qlt_inspections').insert([{ ...form, tenant_id: tenantId, checklist_name: cl?.name ?? null, checklist_id: form.checklist_id || null, result: form.result || null, notes: form.notes || null, inspector: form.inspector || null }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Inspection created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('qlt_inspections').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{inspections.length} Inspections</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ ref_number: `QCI-${Date.now().toString().slice(-6)}`, checklist_id: '', inspector: '', inspection_date: new Date().toISOString().slice(0,10), status: 'scheduled', result: '', notes: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>New Inspection</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Ref</th>
            <th className="text-left p-2.5 font-medium">Checklist</th>
            <th className="text-left p-2.5 font-medium">Inspector</th>
            <th className="text-left p-2.5 font-medium">Date</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {inspections.map(i => (
              <tr key={i.id} className="hover:bg-muted/20">
                <td className="p-2.5 font-mono font-semibold">{i.ref_number}</td>
                <td className="p-2.5">{i.checklist_name ?? '—'}</td>
                <td className="p-2.5">{i.inspector ?? '—'}</td>
                <td className="p-2.5">{i.inspection_date}</td>
                <td className="p-2.5"><Badge className={`text-[10px] ${INSP_STATUS[i.status] ?? ''}`}>{i.status}</Badge></td>
                <td className="p-2.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete?')) remove(i.id); }}><Trash2 className="h-3 w-3"/></Button></td>
              </tr>
            ))}
            {inspections.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No inspections yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Inspection</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Ref Number</Label><Input value={form.ref_number} onChange={e => setForm(p => ({ ...p, ref_number: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Date</Label><Input type="date" value={form.inspection_date} onChange={e => setForm(p => ({ ...p, inspection_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Checklist</Label>
              <Select value={form.checklist_id} onValueChange={v => setForm(p => ({ ...p, checklist_id: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select checklist…"/></SelectTrigger>
                <SelectContent>{checklists.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Inspector</Label><Input value={form.inspector} onChange={e => setForm(p => ({ ...p, inspector: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(INSP_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.ref_number} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NCsTab({ ncs, tenantId, onRefresh }: { ncs: NonConformance[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ref_number: '', description: '', severity: 'minor', status: 'open', raised_by: '', raised_date: new Date().toISOString().slice(0,10), root_cause: '', corrective_action: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('qlt_non_conformances').insert([{ ...form, tenant_id: tenantId, raised_by: form.raised_by || null, root_cause: form.root_cause || null, corrective_action: form.corrective_action || null }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('NC created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('qlt_non_conformances').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{ncs.length} Non-Conformances</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ ref_number: `NC-${Date.now().toString().slice(-6)}`, description: '', severity: 'minor', status: 'open', raised_by: '', raised_date: new Date().toISOString().slice(0,10), root_cause: '', corrective_action: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>Raise NC</Button>
      </div>
      <div className="space-y-2">
        {ncs.map(n => (
          <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-muted-foreground">{n.ref_number}</span>
                <Badge className={`text-[9px] ${SEVERITY[n.severity] ?? ''}`}>{n.severity}</Badge>
                <Badge className={`text-[9px] ${NC_STATUS[n.status] ?? ''}`}>{n.status.replace('_',' ')}</Badge>
              </div>
              <p className="text-xs font-medium mt-0.5 truncate">{n.description}</p>
              {n.raised_by && <p className="text-[10px] text-muted-foreground">Raised by: {n.raised_by} · {n.raised_date}</p>}
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive shrink-0" onClick={() => { if (confirm('Delete NC?')) remove(n.id); }}><Trash2 className="h-3 w-3"/></Button>
          </div>
        ))}
        {ncs.length === 0 && <div className="py-10 text-center text-muted-foreground text-sm">No non-conformances recorded.</div>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Raise Non-Conformance</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Reference</Label><Input value={form.ref_number} onChange={e => setForm(p => ({ ...p, ref_number: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Severity</Label>
              <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(SEVERITY).map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Description *</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Raised By</Label><Input value={form.raised_by} onChange={e => setForm(p => ({ ...p, raised_by: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Date</Label><Input type="date" value={form.raised_date} onChange={e => setForm(p => ({ ...p, raised_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Corrective Action</Label><Textarea value={form.corrective_action} onChange={e => setForm(p => ({ ...p, corrective_action: e.target.value }))} rows={2} className="mt-1 text-xs"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.description} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChecklistsTab({ checklists, tenantId, onRefresh }: { checklists: QCChecklist[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', description: '', version: '1.0', is_active: true });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('qlt_checklists').insert([{ ...form, tenant_id: tenantId, category: form.category || null, description: form.description || null }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Checklist created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('qlt_checklists').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{checklists.length} Checklists</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ name: '', category: '', description: '', version: '1.0', is_active: true }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>New Checklist</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {checklists.map(c => (
          <Card key={c.id} className="border shadow-sm">
            <CardContent className="p-3 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[9px]">{c.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                {c.category && <p className="text-xs text-muted-foreground">{c.category}</p>}
                {c.version && <p className="text-[10px] text-muted-foreground">v{c.version}</p>}
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive shrink-0" onClick={() => { if (confirm('Delete checklist?')) remove(c.id); }}><Trash2 className="h-3 w-3"/></Button>
            </CardContent>
          </Card>
        ))}
        {checklists.length === 0 && <div className="col-span-2 py-10 text-center text-muted-foreground text-sm">No checklists yet.</div>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New QC Checklist</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="mt-1 text-xs"/></div>
              <div><Label className="text-xs">Version</Label><Input value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} className="mt-1 text-xs"/></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1 text-xs"/></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))}/><Label className="text-xs">Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.name} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
