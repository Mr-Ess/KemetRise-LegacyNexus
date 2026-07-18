import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  DollarSign, FileText, TrendingUp, AlertCircle, Plus, Pencil, Trash2,
  CheckCircle2, Receipt, Landmark, Shield
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// â”€â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Invoice {
  id: string; invoice_number: string; client_name: string | null;
  total_amount: number; status: string; currency: string;
  issue_date: string; due_date: string | null; tax_amount: number | null;
}
interface Receipt {
  id: string; receipt_number: string; client_name: string | null;
  amount: number; currency: string; payment_method: string; payment_date: string;
}
interface TaxRule {
  id: string; name: string; rate_pct: number;
  tax_type: string; is_default: boolean; is_active: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
};

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}

// â”€â”€â”€ MAIN COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function FinanceEngine() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;
  const cur = activeTenant?.default_currency ?? 'USD';

  const { data: invoices = [], isLoading: loadInv } = useQuery<Invoice[]>({
    queryKey: ['fin-invoices', tid],
    queryFn: async () => {
      const { data, error } = await db.from('fin_invoices').select('*').eq('tenant_id', tid).order('created_at', { ascending: false });
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: receipts = [], isLoading: loadRec } = useQuery<Receipt[]>({
    queryKey: ['fin-receipts', tid],
    queryFn: async () => {
      const { data, error } = await db.from('fin_receipts').select('*').eq('tenant_id', tid).order('created_at', { ascending: false });
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: taxRules = [], isLoading: loadTax } = useQuery<TaxRule[]>({
    queryKey: ['fin-tax', tid],
    queryFn: async () => {
      const { data, error } = await db.from('fin_tax_rules').select('*').eq('tenant_id', tid).order('created_at', { ascending: false });
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant label="Finance Engine" />;

  const totalInvoiced  = invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0);
  const totalCollected = receipts.reduce((s, r) => s + (r.amount ?? 0), 0);
  const paidInvoices   = invoices.filter(i => i.status === 'paid').length;
  const overdueInv     = invoices.filter(i => i.status === 'overdue').length;

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoiced',  val: fmt(totalInvoiced, cur),  icon: <FileText className="h-4 w-4"/>,    col: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Collected',       val: fmt(totalCollected, cur), icon: <CheckCircle2 className="h-4 w-4"/>, col: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Paid Invoices',   val: String(paidInvoices),     icon: <Receipt className="h-4 w-4"/>,      col: 'text-violet-600',bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Overdue',         val: String(overdueInv),       icon: <AlertCircle className="h-4 w-4"/>,  col: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-950/30' },
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

      <Tabs defaultValue="invoices">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="invoices" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5"/>Invoices</TabsTrigger>
          <TabsTrigger value="receipts" className="gap-1.5 text-xs"><Receipt className="h-3.5 w-3.5"/>Receipts</TabsTrigger>
          <TabsTrigger value="tax"      className="gap-1.5 text-xs"><Shield className="h-3.5 w-3.5"/>Tax Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <InvoicesTab invoices={invoices} isLoading={loadInv} tenantId={tid!} currency={cur} onRefresh={() => qc.invalidateQueries({ queryKey: ['fin-invoices', tid] })} />
        </TabsContent>
        <TabsContent value="receipts" className="mt-4">
          <ReceiptsTab receipts={receipts} isLoading={loadRec} tenantId={tid!} currency={cur} onRefresh={() => qc.invalidateQueries({ queryKey: ['fin-receipts', tid] })} />
        </TabsContent>
        <TabsContent value="tax" className="mt-4">
          <TaxRulesTab rules={taxRules} isLoading={loadTax} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['fin-tax', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// â”€â”€â”€ INVOICES TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function InvoicesTab({ invoices, isLoading, tenantId, currency, onRefresh }: {
  invoices: Invoice[]; isLoading: boolean; tenantId: string; currency: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ invoice_number: '', client_name: '', total_amount: '', currency, status: 'draft', issue_date: new Date().toISOString().slice(0,10), due_date: '' });

  const reset = () => { setEditing(null); setForm({ invoice_number: `INV-${Date.now().toString().slice(-6)}`, client_name: '', total_amount: '', currency, status: 'draft', issue_date: new Date().toISOString().slice(0,10), due_date: '' }); };

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, total_amount: parseFloat(form.total_amount) || 0 };
      if (editing) {
        const { error } = await db.from('fin_invoices').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('fin_invoices').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Invoice updated' : 'Invoice created'); onRefresh(); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => db.from('fin_invoices').delete().eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => { toast.success('Deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (inv: Invoice) => { setEditing(inv); setForm({ invoice_number: inv.invoice_number, client_name: inv.client_name ?? '', total_amount: String(inv.total_amount), currency: inv.currency, status: inv.status, issue_date: inv.issue_date, due_date: inv.due_date ?? '' }); setOpen(true); };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{invoices.length} invoices</p>
        <Button size="sm" className="gap-1.5" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4"/>New Invoice</Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['Invoice #','Client','Amount','Status','Date',''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No invoices yet</td></tr>
            )}
            {invoices.map(inv => (
              <tr key={inv.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium">{inv.invoice_number}</td>
                <td className="px-4 py-3">{inv.client_name ?? 'â€”'}</td>
                <td className="px-4 py-3 font-semibold">{fmt(inv.total_amount, inv.currency)}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[inv.status] ?? 'bg-muted'}`}>{inv.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{inv.issue_date}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inv)}><Pencil className="h-3.5 w-3.5"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if(confirm('Delete?')) remove(inv.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Invoice' : 'New Invoice'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Invoice #</Label><Input value={form.invoice_number} onChange={e => setForm(f => ({...f, invoice_number: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['draft','sent','paid','overdue','cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Client Name</Label><Input value={form.client_name} onChange={e => setForm(f => ({...f, client_name: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Amount</Label><Input type="number" value={form.total_amount} onChange={e => setForm(f => ({...f, total_amount: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({...f, currency: v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['USD','EUR','EGP','SAR','AED'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Issue Date</Label><Input type="date" value={form.issue_date} onChange={e => setForm(f => ({...f, issue_date: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.invoice_number || isPending}>{isPending ? 'Savingâ€¦' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// â”€â”€â”€ RECEIPTS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReceiptsTab({ receipts, isLoading, tenantId, currency, onRefresh }: {
  receipts: Receipt[]; isLoading: boolean; tenantId: string; currency: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [form, setForm] = useState({ receipt_number: '', client_name: '', amount: '', currency, payment_method: 'cash', payment_date: new Date().toISOString().slice(0,10) });

  const reset = () => { setEditing(null); setForm({ receipt_number: `REC-${Date.now().toString().slice(-6)}`, client_name: '', amount: '', currency, payment_method: 'cash', payment_date: new Date().toISOString().slice(0,10) }); };

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, amount: parseFloat(form.amount) || 0 };
      if (editing) {
        const { error } = await db.from('fin_receipts').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('fin_receipts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Receipt updated' : 'Receipt created'); onRefresh(); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => db.from('fin_receipts').delete().eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => { toast.success('Deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{receipts.length} receipts</p>
        <Button size="sm" className="gap-1.5" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4"/>Record Receipt</Button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{['Receipt #','Client','Amount','Method','Date',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody>
            {receipts.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No receipts yet</td></tr>}
            {receipts.map(r => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-medium">{r.receipt_number}</td>
                <td className="px-4 py-3">{r.client_name ?? 'â€”'}</td>
                <td className="px-4 py-3 font-semibold">{fmt(r.amount, r.currency)}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{r.payment_method}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{r.payment_date?.slice(0,10)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(r); setForm({ receipt_number: r.receipt_number, client_name: r.client_name ?? '', amount: String(r.amount), currency: r.currency, payment_method: r.payment_method, payment_date: r.payment_date?.slice(0,10) ?? '' }); setOpen(true); }}><Pencil className="h-3.5 w-3.5"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if(confirm('Delete?')) remove(r.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Receipt' : 'Record Receipt'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Receipt #</Label><Input value={form.receipt_number} onChange={e => setForm(f => ({...f, receipt_number: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Payment Method</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({...f, payment_method: v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['cash','card','bank_transfer','cheque','online'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Client Name</Label><Input value={form.client_name} onChange={e => setForm(f => ({...f, client_name: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Amount</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={form.payment_date} onChange={e => setForm(f => ({...f, payment_date: e.target.value}))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.receipt_number || !form.amount || isPending}>{isPending ? 'Savingâ€¦' : editing ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// â”€â”€â”€ TAX RULES TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TaxRulesTab({ rules, isLoading, tenantId, onRefresh }: {
  rules: TaxRule[]; isLoading: boolean; tenantId: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRule | null>(null);
  const [form, setForm] = useState({ name: '', rate_pct: '', tax_type: 'vat', authority: '' });

  const reset = () => { setEditing(null); setForm({ name: '', rate_pct: '', tax_type: 'vat', authority: '' }); };

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, rate_pct: parseFloat(form.rate_pct) || 0 };
      if (editing) {
        const { error } = await db.from('fin_tax_rules').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('fin_tax_rules').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success('Tax rule saved'); onRefresh(); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => db.from('fin_tax_rules').delete().eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => { toast.success('Deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) => db.from('fin_tax_rules').update({ is_active: val }).eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => onRefresh(),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{rules.length} tax rules Â· <span className="text-xs text-muted-foreground">Auto-applied to invoices</span></p>
        <Button size="sm" className="gap-1.5" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4"/>Add Tax Rule</Button>
      </div>
      <div className="space-y-2">
        {rules.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border-2 border-dashed">No tax rules defined</div>}
        {rules.map(r => (
          <div key={r.id} className={`flex items-center gap-3 rounded-xl border p-3 ${!r.is_active ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 font-bold text-sm shrink-0">{r.rate_pct}%</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.tax_type.toUpperCase()} {r.authority ? `Â· ${r.authority}` : ''}</p>
            </div>
            {r.is_default && <Badge className="text-xs">Default</Badge>}
            <Badge variant={r.is_active ? 'default' : 'outline'} className="text-xs cursor-pointer" onClick={() => toggle({ id: r.id, val: !r.is_active })}>{r.is_active ? 'Active' : 'Off'}</Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(r); setForm({ name: r.name, rate_pct: String(r.rate_pct), tax_type: r.tax_type, authority: r.authority ?? '' }); setOpen(true); }}><Pencil className="h-3.5 w-3.5"/></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm('Delete tax rule?')) remove(r.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Edit Tax Rule' : 'New Tax Rule'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Rule Name</Label><Input placeholder="e.g. VAT 14%" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Rate (%)</Label><Input type="number" step="0.01" value={form.rate_pct} onChange={e => setForm(f => ({...f, rate_pct: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Type</Label>
                <Select value={form.tax_type} onValueChange={v => setForm(f => ({...f, tax_type: v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['vat','income','withholding','custom'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Authority (optional)</Label><Input placeholder="e.g. ETA Egypt" value={form.authority} onChange={e => setForm(f => ({...f, authority: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.name || isPending}>{isPending ? 'Savingâ€¦' : editing ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// â”€â”€â”€ SHARED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NoTenant({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-muted-foreground/20">
      <p className="text-sm text-muted-foreground">Select a tenant to view {label}</p>
    </div>
  );
}
