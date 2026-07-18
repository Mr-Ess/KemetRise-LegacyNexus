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
import { DollarSign, FileText, Users, Plus, Trash2, Pencil, PlayCircle, CheckCircle2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface PayrollRun {
  id: string; period_label: string; period_start: string; period_end: string;
  status: string; total_gross: number; total_net: number; total_deductions: number;
  processed_by: string | null; created_at: string;
}
interface Payslip {
  id: string; run_id: string | null; employee_name: string; employee_code: string | null;
  department: string | null; basic_salary: number; allowances: number;
  deductions: number; net_pay: number; status: string; payment_date: string | null;
}

const RUN_STATUS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', processing: 'bg-blue-100 text-blue-700',
  approved: 'bg-violet-100 text-violet-700', paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
const SLIP_STATUS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-600',
};

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function NoTenant() {
  return <div className="py-12 text-center text-muted-foreground text-sm">Select a tenant to view payroll data.</div>;
}

export default function PayrollModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;
  const cur = activeTenant?.default_currency ?? 'USD';

  const { data: runs = [] } = useQuery<PayrollRun[]>({
    queryKey: ['pay-runs', tid],
    queryFn: async () => {
      const { data, error } = await db.from('pay_payroll_runs').select('*').eq('tenant_id', tid).order('period_start', { ascending: false });
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: payslips = [] } = useQuery<Payslip[]>({
    queryKey: ['pay-slips', tid],
    queryFn: async () => {
      const { data, error } = await db.from('pay_payslips').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(200);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const lastRun = runs[0];
  const pendingSlips = payslips.filter(s => s.status === 'pending').length;
  const totalPaidNet = payslips.filter(s => s.status === 'paid').reduce((s, p) => s + (p.net_pay || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Payroll Runs',    val: String(runs.length),        icon: <PlayCircle className="h-4 w-4"/>,      col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Payslips',        val: String(payslips.length),    icon: <FileText className="h-4 w-4"/>,        col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Pending Approval',val: String(pendingSlips),       icon: <Users className="h-4 w-4"/>,           col: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Total Paid (Net)',val: fmt(totalPaidNet, cur),      icon: <DollarSign className="h-4 w-4"/>,      col: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
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

      {lastRun && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border text-xs">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0"/>
          <span>Last run: <strong>{lastRun.period_label}</strong> · Net: <strong>{fmt(lastRun.total_net, cur)}</strong> · Status: <Badge className={`text-[10px] ml-1 ${RUN_STATUS[lastRun.status]}`}>{lastRun.status}</Badge></span>
        </div>
      )}

      <Tabs defaultValue="runs">
        <TabsList className="flex gap-1 flex-wrap h-auto">
          <TabsTrigger value="runs"     className="gap-1 text-xs"><PlayCircle className="h-3.5 w-3.5"/>Payroll Runs</TabsTrigger>
          <TabsTrigger value="payslips" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5"/>Payslips</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="mt-4">
          <PayrollRunsTab runs={runs} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['pay-runs', tid] })} />
        </TabsContent>
        <TabsContent value="payslips" className="mt-4">
          <PayslipsTab payslips={payslips} runs={runs} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['pay-slips', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── PAYROLL RUNS ─────────────────────────────────────────────────────────────
function PayrollRunsTab({ runs, cur, tenantId, onRefresh }: { runs: PayrollRun[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ period_label: '', period_start: '', period_end: '', status: 'draft', total_gross: '', total_net: '', total_deductions: '', processed_by: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('pay_payroll_runs').insert([{
        ...form, tenant_id: tenantId,
        total_gross: parseFloat(form.total_gross) || 0,
        total_net: parseFloat(form.total_net) || 0,
        total_deductions: parseFloat(form.total_deductions) || 0,
        processed_by: form.processed_by || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Payroll run created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('pay_payroll_runs').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Run deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{runs.length} Runs</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ period_label: '', period_start: '', period_end: '', status: 'draft', total_gross: '', total_net: '', total_deductions: '', processed_by: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>New Run</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Period</th>
            <th className="text-left p-2.5 font-medium">Dates</th>
            <th className="text-right p-2.5 font-medium">Gross</th>
            <th className="text-right p-2.5 font-medium">Deductions</th>
            <th className="text-right p-2.5 font-medium">Net</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {runs.map(r => (
              <tr key={r.id} className="hover:bg-muted/20">
                <td className="p-2.5 font-semibold">{r.period_label}</td>
                <td className="p-2.5 text-muted-foreground">{r.period_start} → {r.period_end}</td>
                <td className="p-2.5 text-right font-mono">{fmt(r.total_gross, cur)}</td>
                <td className="p-2.5 text-right font-mono text-red-600">-{fmt(r.total_deductions, cur)}</td>
                <td className="p-2.5 text-right font-mono font-semibold text-green-600">{fmt(r.total_net, cur)}</td>
                <td className="p-2.5"><Badge className={`text-[10px] ${RUN_STATUS[r.status] ?? ''}`}>{r.status}</Badge></td>
                <td className="p-2.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete run?')) remove(r.id); }}><Trash2 className="h-3 w-3"/></Button></td>
              </tr>
            ))}
            {runs.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No payroll runs yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Payroll Run</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Period Label (e.g. June 2026)</Label><Input value={form.period_label} onChange={e => setForm(p => ({ ...p, period_label: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Period Start</Label><Input type="date" value={form.period_start} onChange={e => setForm(p => ({ ...p, period_start: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Period End</Label><Input type="date" value={form.period_end} onChange={e => setForm(p => ({ ...p, period_end: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Total Gross</Label><Input type="number" value={form.total_gross} onChange={e => setForm(p => ({ ...p, total_gross: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Total Deductions</Label><Input type="number" value={form.total_deductions} onChange={e => setForm(p => ({ ...p, total_deductions: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Total Net</Label><Input type="number" value={form.total_net} onChange={e => setForm(p => ({ ...p, total_net: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(RUN_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.period_label} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── PAYSLIPS ─────────────────────────────────────────────────────────────────
function PayslipsTab({ payslips, runs, cur, tenantId, onRefresh }: { payslips: Payslip[]; runs: PayrollRun[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_name: '', employee_code: '', department: '', run_id: '', basic_salary: '', allowances: '0', deductions: '0', net_pay: '', status: 'pending', payment_date: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('pay_payslips').insert([{
        ...form, tenant_id: tenantId,
        basic_salary: parseFloat(form.basic_salary) || 0,
        allowances: parseFloat(form.allowances) || 0,
        deductions: parseFloat(form.deductions) || 0,
        net_pay: parseFloat(form.net_pay) || 0,
        run_id: form.run_id || null, payment_date: form.payment_date || null,
        employee_code: form.employee_code || null, department: form.department || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Payslip created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db.from('pay_payslips').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Status updated'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('pay_payslips').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Payslip deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{payslips.length} Payslips</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ employee_name: '', employee_code: '', department: '', run_id: '', basic_salary: '', allowances: '0', deductions: '0', net_pay: '', status: 'pending', payment_date: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>Add Payslip</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Employee</th>
            <th className="text-left p-2.5 font-medium">Dept</th>
            <th className="text-right p-2.5 font-medium">Basic</th>
            <th className="text-right p-2.5 font-medium">Allowances</th>
            <th className="text-right p-2.5 font-medium">Deductions</th>
            <th className="text-right p-2.5 font-medium">Net</th>
            <th className="text-left p-2.5 font-medium">Status</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {payslips.map(s => (
              <tr key={s.id} className="hover:bg-muted/20">
                <td className="p-2.5">
                  <p className="font-medium">{s.employee_name}</p>
                  {s.employee_code && <p className="text-[10px] font-mono text-muted-foreground">{s.employee_code}</p>}
                </td>
                <td className="p-2.5">{s.department ?? '—'}</td>
                <td className="p-2.5 text-right font-mono">{fmt(s.basic_salary, cur)}</td>
                <td className="p-2.5 text-right font-mono text-green-600">+{fmt(s.allowances, cur)}</td>
                <td className="p-2.5 text-right font-mono text-red-600">-{fmt(s.deductions, cur)}</td>
                <td className="p-2.5 text-right font-mono font-bold">{fmt(s.net_pay, cur)}</td>
                <td className="p-2.5">
                  <Select value={s.status} onValueChange={v => updateStatus({ id: s.id, status: v })}>
                    <SelectTrigger className={`h-6 text-[10px] border-0 p-0 pl-1.5 rounded ${SLIP_STATUS[s.status]}`}><SelectValue/></SelectTrigger>
                    <SelectContent>{Object.keys(SLIP_STATUS).map(st => <SelectItem key={st} value={st} className="text-xs capitalize">{st}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-2.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete payslip?')) remove(s.id); }}><Trash2 className="h-3 w-3"/></Button></td>
              </tr>
            ))}
            {payslips.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No payslips yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Payslip</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Employee Name *</Label><Input value={form.employee_name} onChange={e => setForm(p => ({ ...p, employee_name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Employee Code</Label><Input value={form.employee_code} onChange={e => setForm(p => ({ ...p, employee_code: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Department</Label><Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Payroll Run</Label>
              <Select value={form.run_id} onValueChange={v => setForm(p => ({ ...p, run_id: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select run…"/></SelectTrigger>
                <SelectContent>{runs.map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.period_label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Basic Salary *</Label><Input type="number" value={form.basic_salary} onChange={e => setForm(p => ({ ...p, basic_salary: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Allowances</Label><Input type="number" value={form.allowances} onChange={e => setForm(p => ({ ...p, allowances: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Deductions</Label><Input type="number" value={form.deductions} onChange={e => setForm(p => ({ ...p, deductions: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Net Pay *</Label><Input type="number" value={form.net_pay} onChange={e => setForm(p => ({ ...p, net_pay: e.target.value }))} className="mt-1 text-xs"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.employee_name || !form.basic_salary} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
