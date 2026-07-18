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
import { toast } from "sonner";
import { Truck, ClipboardList, Building2, Plus, Pencil, Trash2, ShoppingBag, AlertTriangle } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Supplier {
  id: string; name: string; contact_name: string | null; email: string | null;
  phone: string | null; payment_terms: string | null; currency: string; is_active: boolean;
}
interface PurchaseOrder {
  id: string; po_number: string; supplier_id: string | null; supplier_name: string | null;
  status: string; order_date: string; delivery_date: string | null;
  total_amount: number; currency: string; notes: string | null;
}
interface RFQ {
  id: string; rfq_number: string; title: string; status: string;
  requested_by: string | null; deadline: string | null; total_budget: number | null;
}

const PO_STATUS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-violet-100 text-violet-700', received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600', partial: 'bg-amber-100 text-amber-700',
};
const RFQ_STATUS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700', closed: 'bg-gray-100 text-gray-600',
  awarded: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600',
};

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function NoTenant() {
  return <div className="py-12 text-center text-muted-foreground text-sm">Select a tenant to view procurement data.</div>;
}

export default function ProcurementModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;
  const cur = activeTenant?.default_currency ?? 'USD';

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['proc-suppliers', tid],
    queryFn: async () => {
      const { data, error } = await db.from('proc_suppliers').select('*').eq('tenant_id', tid).order('name');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: orders = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ['proc-orders', tid],
    queryFn: async () => {
      const { data, error } = await db.from('proc_purchase_orders').select('*').eq('tenant_id', tid).order('order_date', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: rfqs = [] } = useQuery<RFQ[]>({
    queryKey: ['proc-rfqs', tid],
    queryFn: async () => {
      const { data, error } = await db.from('proc_rfqs').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(50);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const activeSuppliers = suppliers.filter(s => s.is_active).length;
  const pendingOrders = orders.filter(o => ['draft','sent','confirmed'].includes(o.status));
  const totalPending = pendingOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const openRFQs = rfqs.filter(r => r.status === 'open').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Suppliers', val: String(activeSuppliers),        icon: <Building2 className="h-4 w-4"/>,    col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Purchase Orders', val: String(orders.length),           icon: <ClipboardList className="h-4 w-4"/>, col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Pending Value',    val: fmt(totalPending, cur),          icon: <ShoppingBag className="h-4 w-4"/>,   col: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Open RFQs',        val: String(openRFQs),               icon: <AlertTriangle className="h-4 w-4"/>, col: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
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

      <Tabs defaultValue="orders">
        <TabsList className="flex gap-1 flex-wrap h-auto">
          <TabsTrigger value="orders"    className="gap-1 text-xs"><ClipboardList className="h-3.5 w-3.5"/>Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-1 text-xs"><Building2 className="h-3.5 w-3.5"/>Suppliers</TabsTrigger>
          <TabsTrigger value="rfqs"      className="gap-1 text-xs"><Truck className="h-3.5 w-3.5"/>RFQs</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <PurchaseOrdersTab orders={orders} suppliers={suppliers} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['proc-orders', tid] })} />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <SuppliersTab suppliers={suppliers} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['proc-suppliers', tid] })} />
        </TabsContent>
        <TabsContent value="rfqs" className="mt-4">
          <RFQTab rfqs={rfqs} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['proc-rfqs', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────
function PurchaseOrdersTab({ orders, suppliers, cur, tenantId, onRefresh }: { orders: PurchaseOrder[]; suppliers: Supplier[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState({ po_number: '', supplier_id: '', supplier_name: '', status: 'draft', order_date: new Date().toISOString().slice(0,10), delivery_date: '', total_amount: '', currency: cur, notes: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, total_amount: parseFloat(form.total_amount) || 0, supplier_id: form.supplier_id || null, delivery_date: form.delivery_date || null };
      if (editing) {
        const { error } = await db.from('proc_purchase_orders').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('proc_purchase_orders').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'PO updated' : 'PO created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('proc_purchase_orders').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('PO deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm({ po_number: `PO-${Date.now().toString().slice(-6)}`, supplier_id: '', supplier_name: '', status: 'draft', order_date: new Date().toISOString().slice(0,10), delivery_date: '', total_amount: '', currency: cur, notes: '' }); setOpen(true); };
  const openEdit = (o: PurchaseOrder) => { setEditing(o); setForm({ po_number: o.po_number, supplier_id: o.supplier_id??'', supplier_name: o.supplier_name??'', status: o.status, order_date: o.order_date, delivery_date: o.delivery_date??'', total_amount: String(o.total_amount), currency: o.currency, notes: o.notes??'' }); setOpen(true); };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{orders.length} POs</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5"/>New PO</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">PO #</th>
            <th className="text-left p-2.5 font-medium">Supplier</th>
            <th className="text-left p-2.5 font-medium">Order Date</th>
            <th className="text-left p-2.5 font-medium">Delivery</th>
            <th className="text-right p-2.5 font-medium">Total</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-muted/20">
                <td className="p-2.5 font-mono font-semibold">{o.po_number}</td>
                <td className="p-2.5">{o.supplier_name ?? '—'}</td>
                <td className="p-2.5">{o.order_date}</td>
                <td className="p-2.5">{o.delivery_date ?? '—'}</td>
                <td className="p-2.5 text-right font-mono">{fmt(o.total_amount, o.currency)}</td>
                <td className="p-2.5"><Badge className={`text-[10px] ${PO_STATUS[o.status] ?? ''}`}>{o.status}</Badge></td>
                <td className="p-2.5 flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(o)}><Pencil className="h-3 w-3"/></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete PO?')) remove(o.id); }}><Trash2 className="h-3 w-3"/></Button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No purchase orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit PO' : 'New Purchase Order'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">PO Number</Label><Input value={form.po_number} onChange={e => setForm(p => ({ ...p, po_number: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(PO_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Supplier</Label>
              {suppliers.length > 0 ? (
                <Select value={form.supplier_id} onValueChange={v => { const sup = suppliers.find(s => s.id === v); setForm(p => ({ ...p, supplier_id: v, supplier_name: sup?.name ?? '' })); }}>
                  <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select supplier…"/></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input value={form.supplier_name} onChange={e => setForm(p => ({ ...p, supplier_name: e.target.value }))} placeholder="Supplier name" className="mt-1 text-xs"/>
              )}
            </div>
            <div><Label className="text-xs">Order Date</Label><Input type="date" value={form.order_date} onChange={e => setForm(p => ({ ...p, order_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Delivery Date</Label><Input type="date" value={form.delivery_date} onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Total Amount</Label><Input type="number" value={form.total_amount} onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Currency</Label><Input value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="mt-1 text-xs"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── SUPPLIERS ────────────────────────────────────────────────────────────────
function SuppliersTab({ suppliers, tenantId, onRefresh }: { suppliers: Supplier[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', phone: '', payment_terms: 'net30', currency: 'USD' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('proc_suppliers').insert([{ ...form, tenant_id: tenantId, is_active: true }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Supplier added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('proc_suppliers').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Supplier deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{suppliers.length} Suppliers</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ name: '', contact_name: '', email: '', phone: '', payment_terms: 'net30', currency: 'USD' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>New Supplier</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Name</th>
            <th className="text-left p-2.5 font-medium">Contact</th>
            <th className="text-left p-2.5 font-medium">Email</th>
            <th className="text-left p-2.5 font-medium">Terms</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-muted/20">
                <td className="p-2.5 font-medium">{s.name}</td>
                <td className="p-2.5">{s.contact_name ?? '—'}</td>
                <td className="p-2.5">{s.email ?? '—'}</td>
                <td className="p-2.5">{s.payment_terms ?? '—'}</td>
                <td className="p-2.5"><Badge variant={s.is_active ? 'default' : 'secondary'} className="text-[10px]">{s.is_active ? 'Active' : 'Inactive'}</Badge></td>
                <td className="p-2.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete supplier?')) remove(s.id); }}><Trash2 className="h-3 w-3"/></Button></td>
              </tr>
            ))}
            {suppliers.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No suppliers yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Supplier</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Company Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Contact Name</Label><Input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Payment Terms</Label>
              <Select value={form.payment_terms} onValueChange={v => setForm(p => ({ ...p, payment_terms: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{['immediate','net15','net30','net45','net60'].map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Currency</Label><Input value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="mt-1 text-xs"/></div>
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

// ─── RFQs ─────────────────────────────────────────────────────────────────────
function RFQTab({ rfqs, cur, tenantId, onRefresh }: { rfqs: RFQ[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ rfq_number: '', title: '', status: 'open', requested_by: '', deadline: '', total_budget: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('proc_rfqs').insert([{ ...form, tenant_id: tenantId, total_budget: parseFloat(form.total_budget) || null, deadline: form.deadline || null }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('RFQ created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('proc_rfqs').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('RFQ deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{rfqs.length} RFQs</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ rfq_number: `RFQ-${Date.now().toString().slice(-6)}`, title: '', status: 'open', requested_by: '', deadline: '', total_budget: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>New RFQ</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">RFQ #</th>
            <th className="text-left p-2.5 font-medium">Title</th>
            <th className="text-left p-2.5 font-medium">Requested By</th>
            <th className="text-left p-2.5 font-medium">Deadline</th>
            <th className="text-right p-2.5 font-medium">Budget</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {rfqs.map(r => (
              <tr key={r.id} className="hover:bg-muted/20">
                <td className="p-2.5 font-mono font-semibold">{r.rfq_number}</td>
                <td className="p-2.5 max-w-[160px] truncate">{r.title}</td>
                <td className="p-2.5">{r.requested_by ?? '—'}</td>
                <td className="p-2.5">{r.deadline ?? '—'}</td>
                <td className="p-2.5 text-right font-mono">{r.total_budget ? fmt(r.total_budget, cur) : '—'}</td>
                <td className="p-2.5"><Badge className={`text-[10px] ${RFQ_STATUS[r.status] ?? ''}`}>{r.status}</Badge></td>
                <td className="p-2.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete RFQ?')) remove(r.id); }}><Trash2 className="h-3 w-3"/></Button></td>
              </tr>
            ))}
            {rfqs.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No RFQs yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New RFQ</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">RFQ Number</Label><Input value={form.rfq_number} onChange={e => setForm(p => ({ ...p, rfq_number: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(RFQ_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Requested By</Label><Input value={form.requested_by} onChange={e => setForm(p => ({ ...p, requested_by: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Budget</Label><Input type="number" value={form.total_budget} onChange={e => setForm(p => ({ ...p, total_budget: e.target.value }))} className="mt-1 text-xs"/></div>
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
