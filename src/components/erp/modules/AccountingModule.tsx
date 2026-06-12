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
import { BookOpen, FileText, TrendingUp, DollarSign, Plus, Trash2, Pencil, BarChart2, ArrowUpDown } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Account {
  id: string; code: string; name: string; account_type: string;
  normal_balance: string; is_active: boolean; description: string | null;
}
interface JournalEntry {
  id: string; ref_number: string; description: string; entry_date: string;
  status: string; total_debit: number; total_credit: number;
}
interface BudgetLine {
  id: string; account_name: string; period_label: string;
  budgeted_amount: number; actual_amount: number; variance: number;
}

const ACCOUNT_TYPES = ['asset','liability','equity','revenue','expense'];
const ENTRY_STATUS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  posted: 'bg-green-100 text-green-700',
  voided: 'bg-red-100 text-red-600',
};

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function NoTenant() {
  return <div className="py-12 text-center text-muted-foreground text-sm">Select a tenant to view accounting data.</div>;
}

export default function AccountingModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;
  const cur = activeTenant?.default_currency ?? 'USD';

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['acc-accounts', tid],
    queryFn: async () => {
      const { data, error } = await db.from('acc_chart_of_accounts').select('*').eq('tenant_id', tid).order('code');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: entries = [] } = useQuery<JournalEntry[]>({
    queryKey: ['acc-entries', tid],
    queryFn: async () => {
      const { data, error } = await db.from('acc_journal_entries').select('*').eq('tenant_id', tid).order('entry_date', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: budgets = [] } = useQuery<BudgetLine[]>({
    queryKey: ['acc-budgets', tid],
    queryFn: async () => {
      const { data, error } = await db.from('acc_budget_lines').select('*').eq('tenant_id', tid).order('period_label');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const totalAssets   = accounts.filter(a => a.account_type === 'asset').length;
  const totalRevAcc   = accounts.filter(a => a.account_type === 'revenue').length;
  const postedEntries = entries.filter(e => e.status === 'posted');
  const totalDebit    = postedEntries.reduce((s, e) => s + (e.total_debit || 0), 0);
  const budgetVariance = budgets.reduce((s, b) => s + (b.variance || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Chart of Accounts', val: String(accounts.length), icon: <BookOpen className="h-4 w-4"/>, col: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Posted Entries',    val: String(postedEntries.length), icon: <FileText className="h-4 w-4"/>, col: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Total Debit',       val: fmt(totalDebit, cur), icon: <DollarSign className="h-4 w-4"/>, col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Budget Variance',   val: fmt(budgetVariance, cur), icon: <BarChart2 className="h-4 w-4"/>, col: budgetVariance >= 0 ? 'text-emerald-600' : 'text-red-600', bg: budgetVariance >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30' },
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

      <Tabs defaultValue="coa">
        <TabsList className="flex gap-1 w-full flex-wrap h-auto">
          <TabsTrigger value="coa"      className="gap-1 text-xs"><BookOpen className="h-3.5 w-3.5"/>Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal"  className="gap-1 text-xs"><FileText className="h-3.5 w-3.5"/>Journal Entries</TabsTrigger>
          <TabsTrigger value="budget"   className="gap-1 text-xs"><BarChart2 className="h-3.5 w-3.5"/>Budget vs Actual</TabsTrigger>
          <TabsTrigger value="reports"  className="gap-1 text-xs"><TrendingUp className="h-3.5 w-3.5"/>Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="coa" className="mt-4">
          <ChartOfAccountsTab accounts={accounts} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['acc-accounts', tid] })} />
        </TabsContent>
        <TabsContent value="journal" className="mt-4">
          <JournalEntriesTab entries={entries} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['acc-entries', tid] })} />
        </TabsContent>
        <TabsContent value="budget" className="mt-4">
          <BudgetTab budgets={budgets} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['acc-budgets', tid] })} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <AccountingReports accounts={accounts} entries={entries} cur={cur} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── CHART OF ACCOUNTS ───────────────────────────────────────────────────────
function ChartOfAccountsTab({ accounts, tenantId, onRefresh }: { accounts: Account[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ code: '', name: '', account_type: 'asset', normal_balance: 'debit', description: '' });
  const qc = useQueryClient();

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, is_active: true };
      if (editing) {
        const { error } = await db.from('acc_chart_of_accounts').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('acc_chart_of_accounts').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Account updated' : 'Account created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('acc_chart_of_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Account deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm({ code: '', name: '', account_type: 'asset', normal_balance: 'debit', description: '' }); setOpen(true); };
  const openEdit = (a: Account) => { setEditing(a); setForm({ code: a.code, name: a.name, account_type: a.account_type, normal_balance: a.normal_balance, description: a.description ?? '' }); setOpen(true); };

  const typeColors: Record<string, string> = {
    asset: 'bg-blue-100 text-blue-700', liability: 'bg-red-100 text-red-700',
    equity: 'bg-purple-100 text-purple-700', revenue: 'bg-green-100 text-green-700', expense: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{accounts.length} Accounts</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5"/>New Account</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Code</th>
            <th className="text-left p-2.5 font-medium">Name</th>
            <th className="text-left p-2.5 font-medium">Type</th>
            <th className="text-left p-2.5 font-medium">Normal Balance</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {accounts.map(a => (
              <tr key={a.id} className="hover:bg-muted/20">
                <td className="p-2.5 font-mono font-semibold">{a.code}</td>
                <td className="p-2.5">{a.name}</td>
                <td className="p-2.5"><Badge className={`text-[10px] ${typeColors[a.account_type] ?? ''}`}>{a.account_type}</Badge></td>
                <td className="p-2.5 capitalize">{a.normal_balance}</td>
                <td className="p-2.5"><Badge variant={a.is_active ? 'default' : 'secondary'} className="text-[10px]">{a.is_active ? 'Active' : 'Inactive'}</Badge></td>
                <td className="p-2.5 flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(a)}><Pencil className="h-3 w-3"/></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete account?')) remove(a.id); }}><Trash2 className="h-3 w-3"/></Button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No accounts yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Account' : 'New Account'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Code *</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="1000" className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Type *</Label>
              <Select value={form.account_type} onValueChange={v => setForm(p => ({ ...p, account_type: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Cash & Cash Equivalents" className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Normal Balance</Label>
              <Select value={form.normal_balance} onValueChange={v => setForm(p => ({ ...p, normal_balance: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="debit" className="text-xs">Debit</SelectItem><SelectItem value="credit" className="text-xs">Credit</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 text-xs"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.code || !form.name} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── JOURNAL ENTRIES ─────────────────────────────────────────────────────────
function JournalEntriesTab({ entries, cur, tenantId, onRefresh }: { entries: JournalEntry[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ref_number: '', description: '', entry_date: new Date().toISOString().slice(0,10), status: 'draft', total_debit: '', total_credit: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('acc_journal_entries').insert([{
        ...form, tenant_id: tenantId,
        total_debit: parseFloat(form.total_debit) || 0,
        total_credit: parseFloat(form.total_credit) || 0,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Journal entry created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('acc_journal_entries').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Entry deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{entries.length} Entries</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ ref_number: `JE-${Date.now().toString().slice(-6)}`, description: '', entry_date: new Date().toISOString().slice(0,10), status: 'draft', total_debit: '', total_credit: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>New Entry</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Reference</th>
            <th className="text-left p-2.5 font-medium">Description</th>
            <th className="text-left p-2.5 font-medium">Date</th>
            <th className="text-right p-2.5 font-medium">Debit</th>
            <th className="text-right p-2.5 font-medium">Credit</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {entries.map(e => (
              <tr key={e.id} className="hover:bg-muted/20">
                <td className="p-2.5 font-mono text-xs font-semibold">{e.ref_number}</td>
                <td className="p-2.5 max-w-[180px] truncate">{e.description}</td>
                <td className="p-2.5">{e.entry_date}</td>
                <td className="p-2.5 text-right font-mono">{fmt(e.total_debit, cur)}</td>
                <td className="p-2.5 text-right font-mono">{fmt(e.total_credit, cur)}</td>
                <td className="p-2.5"><Badge className={`text-[10px] ${ENTRY_STATUS[e.status] ?? ''}`}>{e.status}</Badge></td>
                <td className="p-2.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete entry?')) remove(e.id); }}><Trash2 className="h-3 w-3"/></Button></td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No entries yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Reference</Label><Input value={form.ref_number} onChange={e => setForm(p => ({ ...p, ref_number: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Date</Label><Input type="date" value={form.entry_date} onChange={e => setForm(p => ({ ...p, entry_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Total Debit</Label><Input type="number" value={form.total_debit} onChange={e => setForm(p => ({ ...p, total_debit: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Total Credit</Label><Input type="number" value={form.total_credit} onChange={e => setForm(p => ({ ...p, total_credit: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="draft" className="text-xs">Draft</SelectItem><SelectItem value="posted" className="text-xs">Posted</SelectItem></SelectContent>
              </Select>
            </div>
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

// ─── BUDGET VS ACTUAL ─────────────────────────────────────────────────────────
function BudgetTab({ budgets, cur, tenantId, onRefresh }: { budgets: BudgetLine[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ account_name: '', period_label: '', budgeted_amount: '', actual_amount: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const budgeted = parseFloat(form.budgeted_amount) || 0;
      const actual   = parseFloat(form.actual_amount) || 0;
      const { error } = await db.from('acc_budget_lines').insert([{
        ...form, tenant_id: tenantId,
        budgeted_amount: budgeted, actual_amount: actual, variance: actual - budgeted,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Budget line added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{budgets.length} Budget Lines</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ account_name: '', period_label: '', budgeted_amount: '', actual_amount: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>Add Line</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Account</th>
            <th className="text-left p-2.5 font-medium">Period</th>
            <th className="text-right p-2.5 font-medium">Budgeted</th>
            <th className="text-right p-2.5 font-medium">Actual</th>
            <th className="text-right p-2.5 font-medium">Variance</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {budgets.map(b => (
              <tr key={b.id} className="hover:bg-muted/20">
                <td className="p-2.5">{b.account_name}</td>
                <td className="p-2.5">{b.period_label}</td>
                <td className="p-2.5 text-right font-mono">{fmt(b.budgeted_amount, cur)}</td>
                <td className="p-2.5 text-right font-mono">{fmt(b.actual_amount, cur)}</td>
                <td className={`p-2.5 text-right font-mono font-semibold ${b.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(b.variance, cur)}</td>
              </tr>
            ))}
            {budgets.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No budget lines yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Budget Line</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Account Name</Label><Input value={form.account_name} onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Period (e.g. 2026-Q1)</Label><Input value={form.period_label} onChange={e => setForm(p => ({ ...p, period_label: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Budgeted</Label><Input type="number" value={form.budgeted_amount} onChange={e => setForm(p => ({ ...p, budgeted_amount: e.target.value }))} className="mt-1 text-xs"/></div>
              <div><Label className="text-xs">Actual</Label><Input type="number" value={form.actual_amount} onChange={e => setForm(p => ({ ...p, actual_amount: e.target.value }))} className="mt-1 text-xs"/></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.account_name} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ACCOUNTING REPORTS ───────────────────────────────────────────────────────
function AccountingReports({ accounts, entries, cur }: { accounts: Account[]; entries: JournalEntry[]; cur: string }) {
  const byType = ACCOUNT_TYPES.map(t => ({ type: t, count: accounts.filter(a => a.account_type === t).length }));
  const totalPostedDebit  = entries.filter(e => e.status === 'posted').reduce((s, e) => s + (e.total_debit || 0), 0);
  const totalPostedCredit = entries.filter(e => e.status === 'posted').reduce((s, e) => s + (e.total_credit || 0), 0);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3"><ArrowUpDown className="h-4 w-4 text-primary"/><p className="font-semibold text-sm">Trial Balance Summary</p></div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs py-1.5 border-b"><span className="text-muted-foreground">Total Debits (Posted)</span><span className="font-mono font-semibold">{fmt(totalPostedDebit, cur)}</span></div>
            <div className="flex justify-between text-xs py-1.5 border-b"><span className="text-muted-foreground">Total Credits (Posted)</span><span className="font-mono font-semibold">{fmt(totalPostedCredit, cur)}</span></div>
            <div className={`flex justify-between text-xs py-1.5 font-bold ${Math.abs(totalPostedDebit - totalPostedCredit) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Balance</span><span className="font-mono">{fmt(totalPostedDebit - totalPostedCredit, cur)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4 text-primary"/><p className="font-semibold text-sm">Accounts by Type</p></div>
          <div className="space-y-2">
            {byType.map(bt => (
              <div key={bt.type} className="flex justify-between items-center text-xs">
                <span className="capitalize text-muted-foreground">{bt.type}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-primary/20" style={{ width: `${(bt.count / Math.max(accounts.length, 1)) * 80}px` }}/>
                  <span className="font-semibold w-6 text-right">{bt.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
