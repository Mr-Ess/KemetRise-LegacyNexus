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
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ShoppingCart, Package, AlertTriangle, Plus, Pencil, Trash2, Download, Box } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Product {
  id: string; name: string; slug: string; description: string | null;
  product_type: string; sku: string | null; price: number; currency: string;
  track_inventory: boolean; stock_qty: number | null; low_stock_alert: number | null;
  low_stock_threshold: number; file_url: string | null; is_active: boolean;
}
interface Order {
  id: string; order_number: string; customer_name: string | null;
  customer_email: string | null; status: string; total_amount: number;
  currency: string; created_at: string;
}

const ORDER_STATUS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-violet-100 text-violet-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-zinc-100 text-zinc-600',
};

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}

export default function CommerceStore() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;

  const { data: products = [], isLoading: loadProd } = useQuery<Product[]>({
    queryKey: ['com-products', tid],
    queryFn: async () => {
      const { data, error } = await db.from('com_products').select('*').eq('tenant_id', tid).order('name');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: orders = [], isLoading: loadOrd } = useQuery<Order[]>({
    queryKey: ['com-orders', tid],
    queryFn: async () => {
      const { data, error } = await db.from('com_orders').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const lowStock = products.filter(p => p.track_inventory && (p.stock_qty ?? 0) <= (p.low_stock_alert ?? p.low_stock_threshold ?? 5));
  const totalRevenue = orders.filter(o => ['delivered','confirmed'].includes(o.status)).reduce((s, o) => s + o.total_amount, 0);

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Products',     val: String(products.length),     icon: <Package className="h-4 w-4"/>,       col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Orders',       val: String(orders.length),       icon: <ShoppingCart className="h-4 w-4"/>,  col: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Revenue',      val: fmt(totalRevenue, activeTenant.default_currency), icon: <ShoppingCart className="h-4 w-4"/>, col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Low Stock',    val: String(lowStock.length),     icon: <AlertTriangle className="h-4 w-4"/>, col: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/30' },
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Low Stock Alert</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">{lowStock.map(p => p.name).join(', ')}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="products">
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="products" className="gap-1 text-xs"><Package className="h-3.5 w-3.5"/>Products</TabsTrigger>
          <TabsTrigger value="orders"   className="gap-1 text-xs"><ShoppingCart className="h-3.5 w-3.5"/>Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4">
          <ProductsTab products={products} isLoading={loadProd} tenantId={tid!} sectorCode={activeTenant.sector_code} onRefresh={() => qc.invalidateQueries({ queryKey: ['com-products', tid] })} />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <OrdersTab orders={orders} isLoading={loadOrd} tenantId={tid!} sectorCode={activeTenant.sector_code} onRefresh={() => qc.invalidateQueries({ queryKey: ['com-orders', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// â”€â”€â”€ PRODUCTS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProductsTab({ products, isLoading, tenantId, sectorCode, onRefresh }: {
  products: Product[]; isLoading: boolean; tenantId: string; sectorCode: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', description: '', product_type: 'physical', price: '', currency: 'USD', track_inventory: false, stock_qty: '', low_stock_alert: '5', file_url: '' });

  const reset = () => { setEditing(null); setForm({ name: '', sku: `SKU-${Date.now().toString().slice(-6)}`, description: '', product_type: 'physical', price: '', currency: 'USD', track_inventory: false, stock_qty: '', low_stock_alert: '5', file_url: '' }); };

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form, tenant_id: tenantId, sector_code: sectorCode,
        price: parseFloat(form.price) || 0,
        stock_qty: form.track_inventory ? (parseInt(form.stock_qty) || 0) : null,
        low_stock_alert: parseInt(form.low_stock_alert) || 5,
      };
      if (editing) {
        const { error } = await db.from('com_products').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { error } = await db.from('com_products').insert({ ...payload, slug });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Product updated' : 'Product added'); onRefresh(); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => db.from('com_products').delete().eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => { toast.success('Deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{products.length} products</p>
        <Button size="sm" className="gap-1.5" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4"/>Add Product</Button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{['Product','SKU','Type','Price','Stock',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No products yet</td></tr>}
            {products.map(p => (
              <tr key={p.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.product_type === 'digital' ? <Download className="h-3.5 w-3.5 text-violet-500"/> : <Box className="h-3.5 w-3.5 text-blue-500"/>}
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.sku ?? 'â€”'}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{p.product_type}</Badge></td>
                <td className="px-4 py-3 font-semibold">{fmt(p.price, p.currency)}</td>
                <td className="px-4 py-3">
                  {p.track_inventory
                    ? <span className={`text-xs font-medium ${(p.stock_qty ?? 0) <= (p.low_stock_alert ?? 5) ? 'text-red-600' : 'text-green-600'}`}>{p.stock_qty ?? 0} units</span>
                    : <span className="text-xs text-muted-foreground">âˆž</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(p); setForm({ name: p.name, sku: p.sku ?? '', description: p.description ?? '', product_type: p.product_type, price: String(p.price), currency: p.currency, track_inventory: p.track_inventory, stock_qty: String(p.stock_qty ?? ''), low_stock_alert: String(p.low_stock_alert ?? 5), file_url: p.file_url ?? '' }); setOpen(true); }}><Pencil className="h-3.5 w-3.5"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm('Delete product?')) remove(p.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Product Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({...f, sku: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Type</Label>
                <Select value={form.product_type} onValueChange={v => setForm(f => ({...f, product_type: v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['physical','digital','service','subscription','bundle'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} /></div>
            </div>
            {form.product_type === 'digital' && (
              <div className="space-y-1"><Label className="text-xs">File URL / Download Link</Label><Input value={form.file_url} onChange={e => setForm(f => ({...f, file_url: e.target.value}))} placeholder="https://â€¦" /></div>
            )}
            {form.product_type === 'physical' && (
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Track Inventory</Label>
                  <Switch checked={form.track_inventory} onCheckedChange={v => setForm(f => ({...f, track_inventory: v}))} />
                </div>
                {form.track_inventory && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Stock Qty</Label><Input type="number" value={form.stock_qty} onChange={e => setForm(f => ({...f, stock_qty: e.target.value}))} /></div>
                    <div className="space-y-1"><Label className="text-xs">Low Stock Alert</Label><Input type="number" value={form.low_stock_alert} onChange={e => setForm(f => ({...f, low_stock_alert: e.target.value}))} /></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.name || !form.price || isPending}>{isPending ? 'Savingâ€¦' : editing ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// â”€â”€â”€ ORDERS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrdersTab({ orders, isLoading, tenantId, sectorCode, onRefresh }: {
  orders: Order[]; isLoading: boolean; tenantId: string; sectorCode: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ order_number: '', customer_name: '', customer_email: '', status: 'pending', total_amount: '', currency: 'USD' });

  const reset = () => setForm({ order_number: `ORD-${Date.now().toString().slice(-6)}`, customer_name: '', customer_email: '', status: 'pending', total_amount: '', currency: 'USD' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('com_orders').insert({ ...form, tenant_id: tenantId, sector_code: sectorCode, total_amount: parseFloat(form.total_amount) || 0 });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Order created'); onRefresh(); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => db.from('com_orders').update({ status }).eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => onRefresh(),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => db.from('com_orders').delete().eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => { toast.success('Deleted'); onRefresh(); },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{orders.length} orders</p>
        <Button size="sm" className="gap-1.5" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4"/>New Order</Button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{['Order #','Customer','Amount','Status','Date',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No orders yet</td></tr>}
            {orders.map(o => (
              <tr key={o.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-medium">{o.order_number}</td>
                <td className="px-4 py-3">{o.customer_name ?? 'â€”'}</td>
                <td className="px-4 py-3 font-semibold">{fmt(o.total_amount, o.currency)}</td>
                <td className="px-4 py-3">
                  <Select value={o.status} onValueChange={v => updateStatus({ id: o.id, status: v })}>
                    <SelectTrigger className={`h-7 text-xs w-32 ${ORDER_STATUS[o.status] ?? ''}`}><SelectValue/></SelectTrigger>
                    <SelectContent>{Object.keys(ORDER_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm('Delete?')) remove(o.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Order #</Label><Input value={form.order_number} onChange={e => setForm(f => ({...f, order_number: e.target.value}))} /></div>
            <div className="space-y-1"><Label className="text-xs">Customer Name</Label><Input value={form.customer_name} onChange={e => setForm(f => ({...f, customer_name: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Amount</Label><Input type="number" value={form.total_amount} onChange={e => setForm(f => ({...f, total_amount: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.keys(ORDER_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.order_number || isPending}>{isPending ? 'Savingâ€¦' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NoTenant() {
  return (
    <div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-muted-foreground/20">
      <p className="text-sm text-muted-foreground">Select a tenant to view Commerce Store</p>
    </div>
  );
}
