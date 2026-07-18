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
import { toast } from "sonner";
import { toAppUrl } from "@/lib/appUrl";
import { Users, QrCode, Clock, Plus, Pencil, Trash2, RefreshCw, Fingerprint, Copy } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Employee {
  id: string; full_name: string; employee_code: string | null;
  department: string | null; position: string | null; email: string | null;
  phone: string | null; hire_date: string | null; base_salary: number; is_active: boolean;
}
interface AttendanceLog {
  id: string; employee_name: string; check_type: string;
  source: string; recorded_at: string; notes: string | null;
}
interface QRSession {
  id: string; token: string; label: string | null;
  expires_at: string; scans_count: number; created_at: string;
}

export default function HRSystem() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;

  const { data: employees = [], isLoading: loadEmp } = useQuery<Employee[]>({
    queryKey: ['hr-employees', tid],
    queryFn: async () => {
      const { data, error } = await db.from('hr_employees').select('*').eq('tenant_id', tid).order('full_name');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: attendanceLogs = [], isLoading: loadAtt } = useQuery<AttendanceLog[]>({
    queryKey: ['hr-attendance', tid],
    queryFn: async () => {
      const { data, error } = await db.from('hr_attendance_log').select('*').eq('tenant_id', tid).order('recorded_at', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: qrSessions = [], isLoading: loadQR } = useQuery<QRSession[]>({
    queryKey: ['hr-qr', tid],
    queryFn: async () => {
      const { data, error } = await db.from('hr_qr_sessions').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(10);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const activeEmp = employees.filter(e => e.is_active).length;
  const todayLogs = attendanceLogs.filter(l => l.recorded_at?.startsWith(new Date().toISOString().slice(0,10))).length;

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Employees', val: String(employees.length), icon: <Users className="h-4 w-4"/>, col: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Active',          val: String(activeEmp),        icon: <Users className="h-4 w-4"/>, col: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: "Today's Scans",   val: String(todayLogs),        icon: <QrCode className="h-4 w-4"/>, col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'QR Sessions',     val: String(qrSessions.length),icon: <Clock className="h-4 w-4"/>, col: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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

      <Tabs defaultValue="employees">
        <TabsList className="grid grid-cols-3 w-full max-w-sm">
          <TabsTrigger value="employees" className="gap-1 text-xs"><Users className="h-3.5 w-3.5"/>Staff</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1 text-xs"><Clock className="h-3.5 w-3.5"/>Attendance</TabsTrigger>
          <TabsTrigger value="qr" className="gap-1 text-xs"><QrCode className="h-3.5 w-3.5"/>QR Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <EmployeesTab employees={employees} isLoading={loadEmp} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['hr-employees', tid] })} />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendanceTab logs={attendanceLogs} isLoading={loadAtt} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['hr-attendance', tid] })} />
        </TabsContent>
        <TabsContent value="qr" className="mt-4">
          <QRTab sessions={qrSessions} isLoading={loadQR} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['hr-qr', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// â”€â”€â”€ EMPLOYEES TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EmployeesTab({ employees, isLoading, tenantId, onRefresh }: {
  employees: Employee[]; isLoading: boolean; tenantId: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ full_name: '', employee_code: '', department: '', position: '', email: '', phone: '', hire_date: '', base_salary: '' });

  const reset = () => { setEditing(null); setForm({ full_name: '', employee_code: `EMP-${Date.now().toString().slice(-5)}`, department: '', position: '', email: '', phone: '', hire_date: '', base_salary: '' }); };

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, base_salary: parseFloat(form.base_salary) || 0 };
      if (editing) {
        const { error } = await db.from('hr_employees').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('hr_employees').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Employee updated' : 'Employee added'); onRefresh(); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => db.from('hr_employees').delete().eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => { toast.success('Removed'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) => db.from('hr_employees').update({ is_active: val }).eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => onRefresh(),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{employees.length} employees</p>
        <Button size="sm" className="gap-1.5" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4"/>Add Employee</Button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{['Name','Code','Department','Position','Salary','Status',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody>
            {employees.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">No employees yet</td></tr>}
            {employees.map(e => (
              <tr key={e.id} className={`border-t hover:bg-muted/30 ${!e.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{e.full_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.employee_code ?? 'â€”'}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.department ?? 'â€”'}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.position ?? 'â€”'}</td>
                <td className="px-4 py-3">{e.base_salary ? `${e.base_salary.toLocaleString()}` : 'â€”'}</td>
                <td className="px-4 py-3">
                  <Badge variant={e.is_active ? 'default' : 'outline'} className="text-xs cursor-pointer" onClick={() => toggle({ id: e.id, val: !e.is_active })}>{e.is_active ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(e); setForm({ full_name: e.full_name, employee_code: e.employee_code ?? '', department: e.department ?? '', position: e.position ?? '', email: e.email ?? '', phone: e.phone ?? '', hire_date: e.hire_date ?? '', base_salary: String(e.base_salary) }); setOpen(true); }}><Pencil className="h-3.5 w-3.5"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm('Delete employee?')) remove(e.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Employee Code</Label><Input value={form.employee_code} onChange={e => setForm(f => ({...f, employee_code: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Department</Label><Input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Position</Label><Input value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Hire Date</Label><Input type="date" value={form.hire_date} onChange={e => setForm(f => ({...f, hire_date: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Base Salary</Label><Input type="number" value={form.base_salary} onChange={e => setForm(f => ({...f, base_salary: e.target.value}))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.full_name || isPending}>{isPending ? 'Savingâ€¦' : editing ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// â”€â”€â”€ ATTENDANCE TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AttendanceTab({ logs, isLoading, tenantId, onRefresh }: {
  logs: AttendanceLog[]; isLoading: boolean; tenantId: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_name: '', check_type: 'in', source: 'manual', notes: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('hr_attendance_log').insert({ ...form, tenant_id: tenantId, recorded_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Log recorded'); onRefresh(); setOpen(false); setForm({ employee_name: '', check_type: 'in', source: 'manual', notes: '' }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => db.from('hr_attendance_log').delete().eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => { toast.success('Removed'); onRefresh(); },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{logs.length} records</p>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-4 w-4"/>Manual Log</Button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{['Employee','Type','Source','Time',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No attendance records</td></tr>}
            {logs.map(l => (
              <tr key={l.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{l.employee_name}</td>
                <td className="px-4 py-3"><Badge variant={l.check_type === 'in' ? 'default' : 'outline'} className="text-xs">{l.check_type === 'in' ? 'â†’ In' : 'â† Out'}</Badge></td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{l.source}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(l.recorded_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm('Delete?')) remove(l.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Manual Attendance Log</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Employee Name *</Label><Input value={form.employee_name} onChange={e => setForm(f => ({...f, employee_name: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Type</Label>
                <Select value={form.check_type} onValueChange={v => setForm(f => ({...f, check_type: v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="in">Check In</SelectItem><SelectItem value="out">Check Out</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Source</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({...f, source: v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['manual','qr','biometric','app'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.employee_name || isPending}>{isPending ? 'Savingâ€¦' : 'Log'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// â”€â”€â”€ QR TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function QRTab({ sessions, isLoading, tenantId, onRefresh }: {
  sessions: QRSession[]; isLoading: boolean; tenantId: string; onRefresh: () => void;
}) {
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('10');

  const { mutate: createSession, isPending } = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc('fn_create_qr_session', {
        p_tenant_id: tenantId,
        p_label: label || null,
        p_minutes: parseInt(minutes) || 10,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success('QR Session created'); onRefresh(); setLabel(''); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => db.from('hr_qr_sessions').delete().eq('id', id).then(({ error }: { error: Error | null }) => { if (error) throw error; }),
    onSuccess: () => onRefresh(),
  });

  const copyLink = (token: string) => {
    const url = toAppUrl(`qr-scan?token=${encodeURIComponent(token)}`);
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      {/* Generator */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="h-4 w-4 text-violet-600" />
          <p className="font-semibold text-sm">Generate QR Attendance Session</p>
        </div>
        <p className="text-xs text-muted-foreground">Employees scan the QR with their phone to clock in/out. Session auto-expires.</p>
        <div className="flex gap-3">
          <Input placeholder="Session label (optional)" value={label} onChange={e => setLabel(e.target.value)} className="flex-1" />
          <Select value={minutes} onValueChange={setMinutes}>
            <SelectTrigger className="w-28"><SelectValue/></SelectTrigger>
            <SelectContent>{['5','10','15','30','60'].map(m => <SelectItem key={m} value={m}>{m} min</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => createSession()} disabled={isPending} className="gap-1.5">
            <Plus className="h-4 w-4"/>{isPending ? 'Creatingâ€¦' : 'Create QR'}
          </Button>
        </div>
      </div>

      {/* Biometric API info */}
      <div className="rounded-xl border p-4 bg-muted/20">
        <div className="flex items-center gap-2 mb-2"><Fingerprint className="h-4 w-4 text-blue-600"/><p className="font-semibold text-sm">Biometric Device Integration</p></div>
        <p className="text-xs text-muted-foreground mb-2">POST raw attendance from fingerprint/facial hardware to this endpoint:</p>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-background rounded px-2 py-1 border flex-1 font-mono">/api/v1/hr/biometric-sync</code>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => { navigator.clipboard.writeText('/api/v1/hr/biometric-sync'); toast.success('Copied'); }}>
            <Copy className="h-3.5 w-3.5"/>Copy
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Payload: <code className="font-mono">{`{ user_id, timestamp, status, device_id }`}</code></p>
      </div>

      {/* Sessions List */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium">Recent Sessions</p>
          <Button variant="ghost" size="sm" onClick={onRefresh}><RefreshCw className="h-3.5 w-3.5"/></Button>
        </div>
        {sessions.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm rounded-xl border-2 border-dashed">No QR sessions yet</div>}
        {sessions.map(s => {
          const expired = new Date(s.expires_at) < new Date();
          return (
            <div key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 mb-2 ${expired ? 'opacity-50' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${expired ? 'bg-red-400' : 'bg-green-400'} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.label ?? 'Untitled Session'}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{s.token}</p>
                <p className="text-xs text-muted-foreground">Expires: {new Date(s.expires_at).toLocaleString()} Â· {s.scans_count} scans</p>
              </div>
              <Badge variant={expired ? 'outline' : 'default'} className="text-xs">{expired ? 'Expired' : 'Active'}</Badge>
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => copyLink(s.token)}><Copy className="h-3 w-3"/>Link</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(s.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NoTenant() {
  return (
    <div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-muted-foreground/20">
      <p className="text-sm text-muted-foreground">Select a tenant to view HR System</p>
    </div>
  );
}
