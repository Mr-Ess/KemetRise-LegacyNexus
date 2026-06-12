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
import { Wrench, Cpu, ClipboardCheck, Plus, Trash2, Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Equipment {
  id: string; name: string; serial_number: string | null; category: string | null;
  location: string | null; purchase_date: string | null; last_maintenance: string | null;
  next_maintenance: string | null; status: string; notes: string | null;
}
interface WorkOrder {
  id: string; equipment_id: string | null; equipment_name: string | null;
  title: string; description: string | null; priority: string; status: string;
  requested_by: string | null; assigned_to: string | null;
  scheduled_date: string | null; completed_date: string | null; cost: number | null;
}

const EQUIP_STATUS: Record<string, string> = {
  operational: 'bg-green-100 text-green-700', maintenance: 'bg-amber-100 text-amber-700',
  breakdown: 'bg-red-100 text-red-600', decommissioned: 'bg-gray-100 text-gray-500',
};
const WO_STATUS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700', in_progress: 'bg-violet-100 text-violet-700',
  pending_parts: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-500', medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
};

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function NoTenant() {
  return <div className="py-12 text-center text-muted-foreground text-sm">Select a tenant to view maintenance data.</div>;
}

export default function MaintenanceModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;
  const cur = activeTenant?.default_currency ?? 'USD';

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ['mnt-equipment', tid],
    queryFn: async () => {
      const { data, error } = await db.from('mnt_equipment').select('*').eq('tenant_id', tid).order('name');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ['mnt-workorders', tid],
    queryFn: async () => {
      const { data, error } = await db.from('mnt_work_orders').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const today = new Date().toISOString().slice(0,10);
  const overdueMaintenence = equipment.filter(e => e.next_maintenance && e.next_maintenance <= today && e.status === 'operational').length;
  const openWOs = workOrders.filter(w => !['completed','cancelled'].includes(w.status)).length;
  const criticalWOs = workOrders.filter(w => w.priority === 'critical' && w.status !== 'completed').length;
  const totalWOCost = workOrders.filter(w => w.status === 'completed').reduce((s, w) => s + (w.cost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Equipment',           val: String(equipment.length),        icon: <Cpu className="h-4 w-4"/>,           col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Open Work Orders',    val: String(openWOs),                 icon: <Wrench className="h-4 w-4"/>,        col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Overdue Maintenance', val: String(overdueMaintenence),      icon: <AlertTriangle className="h-4 w-4"/>, col: overdueMaintenence > 0 ? 'text-red-600' : 'text-emerald-600', bg: overdueMaintenence > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Maintenance Cost',    val: fmt(totalWOCost, cur),           icon: <ClipboardCheck className="h-4 w-4"/>,col: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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

      {criticalWOs > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0"/>
          <span><strong>{criticalWOs}</strong> critical work order{criticalWOs > 1 ? 's' : ''} require immediate attention!</span>
        </div>
      )}

      <Tabs defaultValue="workorders">
        <TabsList className="flex gap-1 flex-wrap h-auto">
          <TabsTrigger value="workorders" className="gap-1 text-xs"><Wrench className="h-3.5 w-3.5"/>Work Orders</TabsTrigger>
          <TabsTrigger value="equipment"  className="gap-1 text-xs"><Cpu className="h-3.5 w-3.5"/>Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="workorders" className="mt-4">
          <WorkOrdersTab workOrders={workOrders} equipment={equipment} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['mnt-workorders', tid] })} />
        </TabsContent>
        <TabsContent value="equipment" className="mt-4">
          <EquipmentTab equipment={equipment} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['mnt-equipment', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── WORK ORDERS ──────────────────────────────────────────────────────────────
function WorkOrdersTab({ workOrders, equipment, cur, tenantId, onRefresh }: { workOrders: WorkOrder[]; equipment: Equipment[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState({ title: '', equipment_id: '', description: '', priority: 'medium', status: 'open', requested_by: '', assigned_to: '', scheduled_date: '', cost: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const equip = equipment.find(e => e.id === form.equipment_id);
      const payload = { ...form, tenant_id: tenantId, equipment_id: form.equipment_id || null, equipment_name: equip?.name ?? null, cost: form.cost ? parseFloat(form.cost) : null, scheduled_date: form.scheduled_date || null, description: form.description || null, requested_by: form.requested_by || null, assigned_to: form.assigned_to || null };
      if (editing) {
        const { error } = await db.from('mnt_work_orders').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('mnt_work_orders').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Work order updated' : 'Work order created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('mnt_work_orders').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Work order deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm({ title: '', equipment_id: '', description: '', priority: 'medium', status: 'open', requested_by: '', assigned_to: '', scheduled_date: '', cost: '' }); setOpen(true); };
  const openEdit = (w: WorkOrder) => { setEditing(w); setForm({ title: w.title, equipment_id: w.equipment_id??'', description: w.description??'', priority: w.priority, status: w.status, requested_by: w.requested_by??'', assigned_to: w.assigned_to??'', scheduled_date: w.scheduled_date??'', cost: String(w.cost??'') }); setOpen(true); };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{workOrders.length} Work Orders</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5"/>New WO</Button>
      </div>
      <div className="space-y-2">
        {workOrders.map(w => (
          <div key={w.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold truncate">{w.title}</p>
                <Badge className={`text-[9px] ${WO_STATUS[w.status] ?? ''}`}>{w.status.replace('_',' ')}</Badge>
                <Badge className={`text-[9px] ${PRIORITY_COLOR[w.priority] ?? ''}`}>{w.priority}</Badge>
              </div>
              {w.equipment_name && <p className="text-xs text-muted-foreground mt-0.5">🔧 {w.equipment_name}</p>}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {w.assigned_to && <span className="text-[10px] text-muted-foreground">→ {w.assigned_to}</span>}
                {w.scheduled_date && <span className="text-[10px] text-muted-foreground">📅 {w.scheduled_date}</span>}
                {w.cost && <span className="text-[10px] font-mono text-primary">{fmt(w.cost, cur)}</span>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(w)}><Pencil className="h-3 w-3"/></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete work order?')) remove(w.id); }}><Trash2 className="h-3 w-3"/></Button>
            </div>
          </div>
        ))}
        {workOrders.length === 0 && <div className="py-10 text-center text-muted-foreground text-sm">No work orders yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Work Order' : 'New Work Order'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Equipment</Label>
              <Select value={form.equipment_id} onValueChange={v => setForm(p => ({ ...p, equipment_id: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select equipment…"/></SelectTrigger>
                <SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id} className="text-xs">{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(PRIORITY_COLOR).map(pr => <SelectItem key={pr} value={pr} className="text-xs capitalize">{pr}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(WO_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Requested By</Label><Input value={form.requested_by} onChange={e => setForm(p => ({ ...p, requested_by: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Assigned To</Label><Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Scheduled Date</Label><Input type="date" value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Cost</Label><Input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1 text-xs"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.title} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── EQUIPMENT TAB ────────────────────────────────────────────────────────────
function EquipmentTab({ equipment, tenantId, onRefresh }: { equipment: Equipment[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', serial_number: '', category: '', location: '', purchase_date: '', next_maintenance: '', status: 'operational', notes: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('mnt_equipment').insert([{ ...form, tenant_id: tenantId, serial_number: form.serial_number || null, category: form.category || null, location: form.location || null, purchase_date: form.purchase_date || null, next_maintenance: form.next_maintenance || null, notes: form.notes || null }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Equipment added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('mnt_equipment').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Equipment deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = new Date().toISOString().slice(0,10);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{equipment.length} Equipment</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ name: '', serial_number: '', category: '', location: '', purchase_date: '', next_maintenance: '', status: 'operational', notes: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>Add Equipment</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Name</th>
            <th className="text-left p-2.5 font-medium">Category</th>
            <th className="text-left p-2.5 font-medium">Location</th>
            <th className="text-left p-2.5 font-medium">Next Maintenance</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {equipment.map(e => {
              const overdue = e.next_maintenance && e.next_maintenance <= today;
              return (
                <tr key={e.id} className="hover:bg-muted/20">
                  <td className="p-2.5">
                    <p className="font-medium">{e.name}</p>
                    {e.serial_number && <p className="text-[10px] font-mono text-muted-foreground">{e.serial_number}</p>}
                  </td>
                  <td className="p-2.5">{e.category ?? '—'}</td>
                  <td className="p-2.5">{e.location ?? '—'}</td>
                  <td className={`p-2.5 ${overdue ? 'text-red-600 font-semibold' : ''}`}>{e.next_maintenance ?? '—'}{overdue ? ' ⚠' : ''}</td>
                  <td className="p-2.5"><Badge className={`text-[10px] ${EQUIP_STATUS[e.status] ?? ''}`}>{e.status}</Badge></td>
                  <td className="p-2.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete equipment?')) remove(e.id); }}><Trash2 className="h-3 w-3"/></Button></td>
                </tr>
              );
            })}
            {equipment.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No equipment yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Serial Number</Label><Input value={form.serial_number} onChange={e => setForm(p => ({ ...p, serial_number: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="HVAC, Electrical…" className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(p => ({ ...p, purchase_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Next Maintenance</Label><Input type="date" value={form.next_maintenance} onChange={e => setForm(p => ({ ...p, next_maintenance: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(EQUIP_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
