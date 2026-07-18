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
import { Warehouse, Package, ArrowLeftRight, AlertTriangle, Plus, Trash2, Pencil, TrendingDown } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface WarehouseRecord {
  id: string; name: string; location: string | null; manager: string | null; is_active: boolean;
}
interface StockItem {
  id: string; warehouse_id: string | null; warehouse_name: string | null;
  product_name: string; sku: string | null; qty_on_hand: number;
  reorder_point: number | null; unit_cost: number | null; category: string | null;
}
interface StockMove {
  id: string; move_type: string; warehouse_id: string | null; warehouse_name: string | null;
  product_name: string; qty: number; ref_number: string | null; move_date: string; notes: string | null;
}

const MOVE_TYPES: Record<string, string> = {
  receipt: 'bg-green-100 text-green-700', delivery: 'bg-blue-100 text-blue-700',
  adjustment: 'bg-amber-100 text-amber-700', transfer: 'bg-violet-100 text-violet-700',
  return: 'bg-orange-100 text-orange-700', scrap: 'bg-red-100 text-red-600',
};

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function NoTenant() {
  return <div className="py-12 text-center text-muted-foreground text-sm">Select a tenant to view inventory data.</div>;
}

export default function InventoryModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;
  const cur = activeTenant?.default_currency ?? 'USD';

  const { data: warehouses = [] } = useQuery<WarehouseRecord[]>({
    queryKey: ['inv-warehouses', tid],
    queryFn: async () => {
      const { data, error } = await db.from('inv_warehouses').select('*').eq('tenant_id', tid).order('name');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ['inv-stock', tid],
    queryFn: async () => {
      const { data, error } = await db.from('inv_stock_items').select('*').eq('tenant_id', tid).order('product_name');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: moves = [] } = useQuery<StockMove[]>({
    queryKey: ['inv-moves', tid],
    queryFn: async () => {
      const { data, error } = await db.from('inv_stock_moves').select('*').eq('tenant_id', tid).order('move_date', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const lowStock = stockItems.filter(i => (i.reorder_point != null) && i.qty_on_hand <= i.reorder_point);
  const totalValue = stockItems.reduce((s, i) => s + i.qty_on_hand * (i.unit_cost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Warehouses',       val: String(warehouses.filter(w => w.is_active).length), icon: <Warehouse className="h-4 w-4"/>,       col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'SKUs',             val: String(stockItems.length),                          icon: <Package className="h-4 w-4"/>,          col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Inventory Value',  val: fmt(totalValue, cur),                               icon: <TrendingDown className="h-4 w-4"/>,      col: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Low Stock Alerts', val: String(lowStock.length),                            icon: <AlertTriangle className="h-4 w-4"/>,     col: lowStock.length > 0 ? 'text-red-600' : 'text-emerald-600', bg: lowStock.length > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30' },
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

      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0"/>
          <span><strong>{lowStock.length}</strong> items below reorder point: {lowStock.slice(0,3).map(i => i.product_name).join(', ')}{lowStock.length > 3 ? `… +${lowStock.length - 3} more` : ''}</span>
        </div>
      )}

      <Tabs defaultValue="stock">
        <TabsList className="flex gap-1 flex-wrap h-auto">
          <TabsTrigger value="stock"      className="gap-1 text-xs"><Package className="h-3.5 w-3.5"/>Stock Items</TabsTrigger>
          <TabsTrigger value="warehouses" className="gap-1 text-xs"><Warehouse className="h-3.5 w-3.5"/>Warehouses</TabsTrigger>
          <TabsTrigger value="moves"      className="gap-1 text-xs"><ArrowLeftRight className="h-3.5 w-3.5"/>Stock Moves</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <StockItemsTab items={stockItems} warehouses={warehouses} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['inv-stock', tid] })} />
        </TabsContent>
        <TabsContent value="warehouses" className="mt-4">
          <WarehousesTab warehouses={warehouses} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['inv-warehouses', tid] })} />
        </TabsContent>
        <TabsContent value="moves" className="mt-4">
          <StockMovesTab moves={moves} warehouses={warehouses} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['inv-moves', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── STOCK ITEMS ─────────────────────────────────────────────────────────────
function StockItemsTab({ items, warehouses, cur, tenantId, onRefresh }: { items: StockItem[]; warehouses: WarehouseRecord[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [form, setForm] = useState({ product_name: '', sku: '', category: '', warehouse_id: '', qty_on_hand: '0', reorder_point: '', unit_cost: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, qty_on_hand: parseFloat(form.qty_on_hand) || 0, reorder_point: form.reorder_point ? parseFloat(form.reorder_point) : null, unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null, warehouse_id: form.warehouse_id || null };
      if (editing) {
        const { error } = await db.from('inv_stock_items').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('inv_stock_items').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Item updated' : 'Item added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('inv_stock_items').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Item deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm({ product_name: '', sku: '', category: '', warehouse_id: '', qty_on_hand: '0', reorder_point: '', unit_cost: '' }); setOpen(true); };
  const openEdit = (i: StockItem) => { setEditing(i); setForm({ product_name: i.product_name, sku: i.sku??'', category: i.category??'', warehouse_id: i.warehouse_id??'', qty_on_hand: String(i.qty_on_hand), reorder_point: String(i.reorder_point??''), unit_cost: String(i.unit_cost??'') }); setOpen(true); };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{items.length} SKUs</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5"/>Add Item</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Product</th>
            <th className="text-left p-2.5 font-medium">SKU</th>
            <th className="text-left p-2.5 font-medium">Category</th>
            <th className="text-right p-2.5 font-medium">Qty</th>
            <th className="text-right p-2.5 font-medium">Reorder</th>
            <th className="text-right p-2.5 font-medium">Unit Cost</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {items.map(i => {
              const isLow = i.reorder_point != null && i.qty_on_hand <= i.reorder_point;
              return (
                <tr key={i.id} className="hover:bg-muted/20">
                  <td className="p-2.5 font-medium">{i.product_name}</td>
                  <td className="p-2.5 font-mono text-[10px]">{i.sku ?? '—'}</td>
                  <td className="p-2.5">{i.category ?? '—'}</td>
                  <td className={`p-2.5 text-right font-mono font-semibold ${isLow ? 'text-red-600' : ''}`}>{i.qty_on_hand}</td>
                  <td className="p-2.5 text-right">{i.reorder_point ?? '—'}</td>
                  <td className="p-2.5 text-right font-mono">{i.unit_cost ? fmt(i.unit_cost, cur) : '—'}</td>
                  <td className="p-2.5">{isLow ? <Badge className="text-[10px] bg-red-100 text-red-700">Low Stock</Badge> : <Badge variant="outline" className="text-[10px]">OK</Badge>}</td>
                  <td className="p-2.5 flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(i)}><Pencil className="h-3 w-3"/></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete item?')) remove(i.id); }}><Trash2 className="h-3 w-3"/></Button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No stock items yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Item' : 'Add Stock Item'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Product Name *</Label><Input value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">SKU</Label><Input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Qty on Hand</Label><Input type="number" value={form.qty_on_hand} onChange={e => setForm(p => ({ ...p, qty_on_hand: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Reorder Point</Label><Input type="number" value={form.reorder_point} onChange={e => setForm(p => ({ ...p, reorder_point: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Unit Cost</Label><Input type="number" value={form.unit_cost} onChange={e => setForm(p => ({ ...p, unit_cost: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Warehouse</Label>
              <Select value={form.warehouse_id} onValueChange={v => setForm(p => ({ ...p, warehouse_id: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select…"/></SelectTrigger>
                <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.product_name} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── WAREHOUSES ───────────────────────────────────────────────────────────────
function WarehousesTab({ warehouses, tenantId, onRefresh }: { warehouses: WarehouseRecord[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', manager: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('inv_warehouses').insert([{ ...form, tenant_id: tenantId, is_active: true }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Warehouse added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('inv_warehouses').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Warehouse deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{warehouses.length} Warehouses</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ name: '', location: '', manager: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>Add Warehouse</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {warehouses.map(w => (
          <Card key={w.id} className="border shadow-sm">
            <CardContent className="p-3 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-primary"/>
                  <p className="text-sm font-semibold">{w.name}</p>
                  <Badge variant={w.is_active ? 'default' : 'secondary'} className="text-[9px]">{w.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                {w.location && <p className="text-xs text-muted-foreground mt-0.5">{w.location}</p>}
                {w.manager && <p className="text-xs text-muted-foreground">Manager: {w.manager}</p>}
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive shrink-0" onClick={() => { if (confirm('Delete warehouse?')) remove(w.id); }}><Trash2 className="h-3 w-3"/></Button>
            </CardContent>
          </Card>
        ))}
        {warehouses.length === 0 && <div className="col-span-3 py-10 text-center text-muted-foreground text-sm">No warehouses yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Warehouse</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Address…" className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Manager</Label><Input value={form.manager} onChange={e => setForm(p => ({ ...p, manager: e.target.value }))} className="mt-1 text-xs"/></div>
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

// ─── STOCK MOVES ─────────────────────────────────────────────────────────────
function StockMovesTab({ moves, warehouses, tenantId, onRefresh }: { moves: StockMove[]; warehouses: WarehouseRecord[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ move_type: 'receipt', warehouse_id: '', product_name: '', qty: '', ref_number: '', move_date: new Date().toISOString().slice(0,10), notes: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('inv_stock_moves').insert([{ ...form, tenant_id: tenantId, qty: parseFloat(form.qty) || 0, warehouse_id: form.warehouse_id || null, ref_number: form.ref_number || null, notes: form.notes || null }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Stock move recorded'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{moves.length} Moves</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ move_type: 'receipt', warehouse_id: '', product_name: '', qty: '', ref_number: '', move_date: new Date().toISOString().slice(0,10), notes: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>Record Move</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Type</th>
            <th className="text-left p-2.5 font-medium">Product</th>
            <th className="text-left p-2.5 font-medium">Warehouse</th>
            <th className="text-right p-2.5 font-medium">Qty</th>
            <th className="text-left p-2.5 font-medium">Date</th>
            <th className="text-left p-2.5 font-medium">Ref</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {moves.map(m => (
              <tr key={m.id} className="hover:bg-muted/20">
                <td className="p-2.5"><Badge className={`text-[10px] ${MOVE_TYPES[m.move_type] ?? ''}`}>{m.move_type}</Badge></td>
                <td className="p-2.5">{m.product_name}</td>
                <td className="p-2.5">{m.warehouse_name ?? '—'}</td>
                <td className={`p-2.5 text-right font-mono font-semibold ${['delivery','scrap'].includes(m.move_type) ? 'text-red-600' : 'text-green-600'}`}>{['delivery','scrap'].includes(m.move_type) ? '-' : '+'}{m.qty}</td>
                <td className="p-2.5">{m.move_date}</td>
                <td className="p-2.5 font-mono text-[10px]">{m.ref_number ?? '—'}</td>
              </tr>
            ))}
            {moves.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No stock moves yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Stock Move</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Type</Label>
              <Select value={form.move_type} onValueChange={v => setForm(p => ({ ...p, move_type: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(MOVE_TYPES).map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Warehouse</Label>
              <Select value={form.warehouse_id} onValueChange={v => setForm(p => ({ ...p, warehouse_id: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select…"/></SelectTrigger>
                <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Product Name *</Label><Input value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Quantity *</Label><Input type="number" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Date</Label><Input type="date" value={form.move_date} onChange={e => setForm(p => ({ ...p, move_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Reference</Label><Input value={form.ref_number} onChange={e => setForm(p => ({ ...p, ref_number: e.target.value }))} className="mt-1 text-xs"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.product_name || !form.qty} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
