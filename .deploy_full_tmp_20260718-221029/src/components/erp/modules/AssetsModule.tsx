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
import { Laptop, TrendingDown, Calendar, Plus, Trash2, Pencil, AlertTriangle, DollarSign } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface FixedAsset {
  id: string; name: string; asset_code: string | null; category: string | null;
  purchase_date: string | null; purchase_cost: number; salvage_value: number;
  useful_life_years: number; depreciation_method: string; current_value: number;
  status: string; location: string | null; assigned_to: string | null;
}
interface DepreciationLog {
  id: string; asset_id: string; asset_name: string | null;
  period_date: string; amount: number; book_value_after: number;
}

const ASSET_STATUS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', disposed: 'bg-red-100 text-red-600',
  maintenance: 'bg-amber-100 text-amber-700', retired: 'bg-gray-100 text-gray-600',
};
const DEPRECIATION_METHODS = ['straight_line','declining_balance','units_of_production'];

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function NoTenant() {
  return <div className="py-12 text-center text-muted-foreground text-sm">Select a tenant to view assets data.</div>;
}

export default function AssetsModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;
  const cur = activeTenant?.default_currency ?? 'USD';

  const { data: assets = [] } = useQuery<FixedAsset[]>({
    queryKey: ['ast-assets', tid],
    queryFn: async () => {
      const { data, error } = await db.from('ast_fixed_assets').select('*').eq('tenant_id', tid).order('name');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: depreciation = [] } = useQuery<DepreciationLog[]>({
    queryKey: ['ast-depreciation', tid],
    queryFn: async () => {
      const { data, error } = await db.from('ast_depreciation_log').select('*').eq('tenant_id', tid).order('period_date', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const totalCost    = assets.reduce((s, a) => s + (a.purchase_cost || 0), 0);
  const totalCurrent = assets.reduce((s, a) => s + (a.current_value || 0), 0);
  const totalDepreciated = totalCost - totalCurrent;
  const activeAssets = assets.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Assets',     val: String(activeAssets),         icon: <Laptop className="h-4 w-4"/>,       col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Total Cost',        val: fmt(totalCost, cur),          icon: <DollarSign className="h-4 w-4"/>,   col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Book Value',        val: fmt(totalCurrent, cur),       icon: <TrendingDown className="h-4 w-4"/>, col: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Accumulated Depr.', val: fmt(totalDepreciated, cur),   icon: <Calendar className="h-4 w-4"/>,     col: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
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

      <Tabs defaultValue="assets">
        <TabsList className="flex gap-1 flex-wrap h-auto">
          <TabsTrigger value="assets"      className="gap-1 text-xs"><Laptop className="h-3.5 w-3.5"/>Fixed Assets</TabsTrigger>
          <TabsTrigger value="depreciation" className="gap-1 text-xs"><TrendingDown className="h-3.5 w-3.5"/>Depreciation</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4">
          <FixedAssetsTab assets={assets} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['ast-assets', tid] })} />
        </TabsContent>
        <TabsContent value="depreciation" className="mt-4">
          <DepreciationTab logs={depreciation} assets={assets} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['ast-depreciation', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── FIXED ASSETS TAB ────────────────────────────────────────────────────────
function FixedAssetsTab({ assets, cur, tenantId, onRefresh }: { assets: FixedAsset[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FixedAsset | null>(null);
  const [form, setForm] = useState({ name: '', asset_code: '', category: '', purchase_date: '', purchase_cost: '', salvage_value: '0', useful_life_years: '5', depreciation_method: 'straight_line', current_value: '', status: 'active', location: '', assigned_to: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, purchase_cost: parseFloat(form.purchase_cost) || 0, salvage_value: parseFloat(form.salvage_value) || 0, useful_life_years: parseInt(form.useful_life_years) || 5, current_value: parseFloat(form.current_value) || parseFloat(form.purchase_cost) || 0, asset_code: form.asset_code || null, category: form.category || null, purchase_date: form.purchase_date || null, location: form.location || null, assigned_to: form.assigned_to || null };
      if (editing) {
        const { error } = await db.from('ast_fixed_assets').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('ast_fixed_assets').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Asset updated' : 'Asset added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('ast_fixed_assets').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Asset deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm({ name: '', asset_code: '', category: '', purchase_date: '', purchase_cost: '', salvage_value: '0', useful_life_years: '5', depreciation_method: 'straight_line', current_value: '', status: 'active', location: '', assigned_to: '' }); setOpen(true); };
  const openEdit = (a: FixedAsset) => { setEditing(a); setForm({ name: a.name, asset_code: a.asset_code??'', category: a.category??'', purchase_date: a.purchase_date??'', purchase_cost: String(a.purchase_cost), salvage_value: String(a.salvage_value), useful_life_years: String(a.useful_life_years), depreciation_method: a.depreciation_method, current_value: String(a.current_value), status: a.status, location: a.location??'', assigned_to: a.assigned_to??'' }); setOpen(true); };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{assets.length} Assets</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5"/>Add Asset</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Asset</th>
            <th className="text-left p-2.5 font-medium">Category</th>
            <th className="text-right p-2.5 font-medium">Cost</th>
            <th className="text-right p-2.5 font-medium">Book Value</th>
            <th className="text-left p-2.5 font-medium">Method</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {assets.map(a => (
              <tr key={a.id} className="hover:bg-muted/20">
                <td className="p-2.5">
                  <p className="font-medium">{a.name}</p>
                  {a.asset_code && <p className="text-[10px] font-mono text-muted-foreground">{a.asset_code}</p>}
                </td>
                <td className="p-2.5">{a.category ?? '—'}</td>
                <td className="p-2.5 text-right font-mono">{fmt(a.purchase_cost, cur)}</td>
                <td className="p-2.5 text-right font-mono">{fmt(a.current_value, cur)}</td>
                <td className="p-2.5 text-[10px]">{a.depreciation_method.replace('_',' ')}</td>
                <td className="p-2.5"><Badge className={`text-[10px] ${ASSET_STATUS[a.status] ?? ''}`}>{a.status}</Badge></td>
                <td className="p-2.5 flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(a)}><Pencil className="h-3 w-3"/></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete asset?')) remove(a.id); }}><Trash2 className="h-3 w-3"/></Button>
                </td>
              </tr>
            ))}
            {assets.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No assets yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Asset' : 'Add Fixed Asset'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Asset Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Asset Code</Label><Input value={form.asset_code} onChange={e => setForm(p => ({ ...p, asset_code: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="mt-1 text-xs" placeholder="Vehicles, IT Equipment…"/></div>
            <div><Label className="text-xs">Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(p => ({ ...p, purchase_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Purchase Cost *</Label><Input type="number" value={form.purchase_cost} onChange={e => setForm(p => ({ ...p, purchase_cost: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Salvage Value</Label><Input type="number" value={form.salvage_value} onChange={e => setForm(p => ({ ...p, salvage_value: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Useful Life (Years)</Label><Input type="number" value={form.useful_life_years} onChange={e => setForm(p => ({ ...p, useful_life_years: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Depreciation Method</Label>
              <Select value={form.depreciation_method} onValueChange={v => setForm(p => ({ ...p, depreciation_method: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{DEPRECIATION_METHODS.map(m => <SelectItem key={m} value={m} className="text-xs">{m.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Current Book Value</Label><Input type="number" value={form.current_value} onChange={e => setForm(p => ({ ...p, current_value: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(ASSET_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Assigned To</Label><Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} className="mt-1 text-xs"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.name || !form.purchase_cost} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── DEPRECIATION LOG ─────────────────────────────────────────────────────────
function DepreciationTab({ logs, assets, cur, tenantId, onRefresh }: { logs: DepreciationLog[]; assets: FixedAsset[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ asset_id: '', period_date: '', amount: '', book_value_after: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const asset = assets.find(a => a.id === form.asset_id);
      const { error } = await db.from('ast_depreciation_log').insert([{ ...form, tenant_id: tenantId, asset_name: asset?.name ?? null, amount: parseFloat(form.amount) || 0, book_value_after: parseFloat(form.book_value_after) || 0 }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Depreciation entry added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{logs.length} Entries</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ asset_id: '', period_date: new Date().toISOString().slice(0,7) + '-01', amount: '', book_value_after: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>Add Entry</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Asset</th>
            <th className="text-left p-2.5 font-medium">Period</th>
            <th className="text-right p-2.5 font-medium">Depreciation</th>
            <th className="text-right p-2.5 font-medium">Book Value After</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-muted/20">
                <td className="p-2.5">{l.asset_name ?? l.asset_id}</td>
                <td className="p-2.5">{l.period_date}</td>
                <td className="p-2.5 text-right font-mono text-red-600">-{fmt(l.amount, cur)}</td>
                <td className="p-2.5 text-right font-mono">{fmt(l.book_value_after, cur)}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No depreciation entries yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Depreciation Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Asset *</Label>
              <Select value={form.asset_id} onValueChange={v => setForm(p => ({ ...p, asset_id: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select asset…"/></SelectTrigger>
                <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Period Date</Label><Input type="date" value={form.period_date} onChange={e => setForm(p => ({ ...p, period_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Amount</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="mt-1 text-xs"/></div>
              <div><Label className="text-xs">Book Value After</Label><Input type="number" value={form.book_value_after} onChange={e => setForm(p => ({ ...p, book_value_after: e.target.value }))} className="mt-1 text-xs"/></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.asset_id || !form.amount} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
