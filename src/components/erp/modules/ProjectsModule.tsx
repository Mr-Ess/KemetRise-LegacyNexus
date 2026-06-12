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
import { toast } from "sonner";
import { FolderKanban, ListTodo, Clock, CheckCircle2, Plus, Trash2, Pencil, BarChart2, AlertCircle } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Project {
  id: string; name: string; description: string | null; status: string;
  start_date: string | null; end_date: string | null; budget: number | null;
  client_name: string | null; manager: string | null; priority: string;
}
interface Task {
  id: string; project_id: string; title: string; assignee: string | null;
  status: string; priority: string; due_date: string | null;
  estimated_hours: number | null; actual_hours: number | null; description: string | null;
}
interface Timesheet {
  id: string; task_id: string | null; employee_name: string; work_date: string;
  hours: number; description: string | null; project_name: string | null;
}

const PROJ_STATUS: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-600', active: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
const TASK_STATUS: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-600', in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-violet-100 text-violet-700', done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-600',
};
const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-500', medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
};

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function NoTenant() {
  return <div className="py-12 text-center text-muted-foreground text-sm">Select a tenant to view projects data.</div>;
}

export default function ProjectsModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;
  const cur = activeTenant?.default_currency ?? 'USD';

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['proj-projects', tid],
    queryFn: async () => {
      const { data, error } = await db.from('proj_projects').select('*').eq('tenant_id', tid).order('created_at', { ascending: false });
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['proj-tasks', tid],
    queryFn: async () => {
      const { data, error } = await db.from('proj_tasks').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(200);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: timesheets = [] } = useQuery<Timesheet[]>({
    queryKey: ['proj-timesheets', tid],
    queryFn: async () => {
      const { data, error } = await db.from('proj_timesheets').select('*').eq('tenant_id', tid).order('work_date', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const openTasks = tasks.filter(t => !['done','cancelled'].includes(t.status)).length;
  const totalHours = timesheets.reduce((s, t) => s + (t.hours || 0), 0);
  const overdueCount = tasks.filter(t => t.due_date && t.due_date < new Date().toISOString().slice(0,10) && t.status !== 'done').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Projects', val: String(activeProjects),      icon: <FolderKanban className="h-4 w-4"/>,  col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Open Tasks',      val: String(openTasks),           icon: <ListTodo className="h-4 w-4"/>,      col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Logged Hours',    val: `${totalHours}h`,            icon: <Clock className="h-4 w-4"/>,         col: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Overdue Tasks',   val: String(overdueCount),        icon: <AlertCircle className="h-4 w-4"/>,   col: overdueCount > 0 ? 'text-red-600' : 'text-emerald-600', bg: overdueCount > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30' },
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

      <Tabs defaultValue="projects">
        <TabsList className="flex gap-1 flex-wrap h-auto">
          <TabsTrigger value="projects"   className="gap-1 text-xs"><FolderKanban className="h-3.5 w-3.5"/>Projects</TabsTrigger>
          <TabsTrigger value="tasks"      className="gap-1 text-xs"><ListTodo className="h-3.5 w-3.5"/>Tasks</TabsTrigger>
          <TabsTrigger value="timesheets" className="gap-1 text-xs"><Clock className="h-3.5 w-3.5"/>Timesheets</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <ProjectsTab projects={projects} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['proj-projects', tid] })} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <TasksTab tasks={tasks} projects={projects} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['proj-tasks', tid] })} />
        </TabsContent>
        <TabsContent value="timesheets" className="mt-4">
          <TimesheetsTab timesheets={timesheets} projects={projects} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['proj-timesheets', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── PROJECTS TAB ─────────────────────────────────────────────────────────────
function ProjectsTab({ projects, cur, tenantId, onRefresh }: { projects: Project[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'planning', start_date: '', end_date: '', budget: '', client_name: '', manager: '', priority: 'medium' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, budget: form.budget ? parseFloat(form.budget) : null, start_date: form.start_date || null, end_date: form.end_date || null };
      if (editing) {
        const { error } = await db.from('proj_projects').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('proj_projects').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Project updated' : 'Project created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('proj_projects').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Project deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', status: 'planning', start_date: '', end_date: '', budget: '', client_name: '', manager: '', priority: 'medium' }); setOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm({ name: p.name, description: p.description??'', status: p.status, start_date: p.start_date??'', end_date: p.end_date??'', budget: String(p.budget??''), client_name: p.client_name??'', manager: p.manager??'', priority: p.priority }); setOpen(true); };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{projects.length} Projects</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5"/>New Project</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {projects.map(p => (
          <Card key={p.id} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <Badge className={`text-[10px] ${PROJ_STATUS[p.status] ?? ''}`}>{p.status}</Badge>
                    <Badge className={`text-[10px] ${PRIORITY_COLOR[p.priority] ?? ''}`}>{p.priority}</Badge>
                  </div>
                  {p.client_name && <p className="text-xs text-muted-foreground mt-0.5">Client: {p.client_name}</p>}
                  {p.manager && <p className="text-xs text-muted-foreground">Manager: {p.manager}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    {p.start_date && <span className="text-[10px] text-muted-foreground">{p.start_date}</span>}
                    {p.end_date && <span className="text-[10px] text-muted-foreground">→ {p.end_date}</span>}
                    {p.budget && <span className="text-[10px] font-mono text-primary">{fmt(p.budget, cur)}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(p)}><Pencil className="h-3 w-3"/></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete project?')) remove(p.id); }}><Trash2 className="h-3 w-3"/></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && <div className="col-span-2 py-10 text-center text-muted-foreground text-sm">No projects yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Project' : 'New Project'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Project Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(PROJ_STATUS).map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(PRIORITY_COLOR).map(pr => <SelectItem key={pr} value={pr} className="text-xs capitalize">{pr}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Client</Label><Input value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Manager</Label><Input value={form.manager} onChange={e => setForm(p => ({ ...p, manager: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Budget</Label><Input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1 text-xs"/></div>
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

// ─── TASKS TAB ────────────────────────────────────────────────────────────────
function TasksTab({ tasks, projects, tenantId, onRefresh }: { tasks: Task[]; projects: Project[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', project_id: '', assignee: '', status: 'todo', priority: 'medium', due_date: '', estimated_hours: '', description: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('proj_tasks').insert([{ ...form, tenant_id: tenantId, estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null, due_date: form.due_date || null, project_id: form.project_id || null }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Task created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db.from('proj_tasks').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Task updated'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('proj_tasks').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Task deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const TASK_STATUSES = Object.keys(TASK_STATUS);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{tasks.length} Tasks</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ title: '', project_id: '', assignee: '', status: 'todo', priority: 'medium', due_date: '', estimated_hours: '', description: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>New Task</Button>
      </div>
      <div className="space-y-2">
        {tasks.map(t => {
          const isOverdue = t.due_date && t.due_date < new Date().toISOString().slice(0,10) && t.status !== 'done';
          return (
            <div key={t.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${t.status === 'done' ? 'opacity-60 bg-muted/20' : 'bg-card'} ${isOverdue ? 'border-red-300 dark:border-red-900/50' : 'border-border'}`}>
              <button onClick={() => updateStatus({ id: t.id, status: t.status === 'done' ? 'todo' : 'done' })} className={`shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${t.status === 'done' ? 'bg-green-500 border-green-500' : 'border-muted-foreground/40 hover:border-primary'}`}>
                {t.status === 'done' && <CheckCircle2 className="h-3 w-3 text-white"/>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${t.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Badge className={`text-[9px] ${TASK_STATUS[t.status] ?? ''}`}>{t.status.replace('_',' ')}</Badge>
                  <Badge className={`text-[9px] ${PRIORITY_COLOR[t.priority] ?? ''}`}>{t.priority}</Badge>
                  {t.assignee && <span className="text-[10px] text-muted-foreground">→ {t.assignee}</span>}
                  {t.due_date && <span className={`text-[10px] ${isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>{t.due_date}</span>}
                  {t.estimated_hours && <span className="text-[10px] text-muted-foreground">{t.estimated_hours}h est.</span>}
                </div>
              </div>
              <Select value={t.status} onValueChange={v => updateStatus({ id: t.id, status: v })}>
                <SelectTrigger className="w-28 h-6 text-[10px] shrink-0"><SelectValue/></SelectTrigger>
                <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive shrink-0" onClick={() => { if (confirm('Delete task?')) remove(t.id); }}><Trash2 className="h-3 w-3"/></Button>
            </div>
          );
        })}
        {tasks.length === 0 && <div className="py-10 text-center text-muted-foreground text-sm">No tasks yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Project</Label>
              <Select value={form.project_id} onValueChange={v => setForm(p => ({ ...p, project_id: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select project…"/></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Assignee</Label><Input value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{Object.keys(PRIORITY_COLOR).map(pr => <SelectItem key={pr} value={pr} className="text-xs capitalize">{pr}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Est. Hours</Label><Input type="number" value={form.estimated_hours} onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))} className="mt-1 text-xs"/></div>
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

// ─── TIMESHEETS TAB ───────────────────────────────────────────────────────────
function TimesheetsTab({ timesheets, projects, tenantId, onRefresh }: { timesheets: Timesheet[]; projects: Project[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_name: '', project_id: '', work_date: new Date().toISOString().slice(0,10), hours: '', description: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const proj = projects.find(p => p.id === form.project_id);
      const { error } = await db.from('proj_timesheets').insert([{ ...form, tenant_id: tenantId, hours: parseFloat(form.hours) || 0, project_name: proj?.name ?? null, project_id: form.project_id || null, description: form.description || null }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Timesheet entry added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('proj_timesheets').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Entry deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalHours = timesheets.reduce((s, t) => s + (t.hours || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{totalHours}h total logged</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ employee_name: '', project_id: '', work_date: new Date().toISOString().slice(0,10), hours: '', description: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>Log Hours</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Employee</th>
            <th className="text-left p-2.5 font-medium">Project</th>
            <th className="text-left p-2.5 font-medium">Date</th>
            <th className="text-right p-2.5 font-medium">Hours</th>
            <th className="text-left p-2.5 font-medium">Description</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {timesheets.map(t => (
              <tr key={t.id} className="hover:bg-muted/20">
                <td className="p-2.5 font-medium">{t.employee_name}</td>
                <td className="p-2.5">{t.project_name ?? '—'}</td>
                <td className="p-2.5">{t.work_date}</td>
                <td className="p-2.5 text-right font-mono font-semibold">{t.hours}h</td>
                <td className="p-2.5 text-muted-foreground truncate max-w-[200px]">{t.description ?? '—'}</td>
                <td className="p-2.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete entry?')) remove(t.id); }}><Trash2 className="h-3 w-3"/></Button></td>
              </tr>
            ))}
            {timesheets.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No timesheets yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Hours</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Employee Name *</Label><Input value={form.employee_name} onChange={e => setForm(p => ({ ...p, employee_name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Project</Label>
              <Select value={form.project_id} onValueChange={v => setForm(p => ({ ...p, project_id: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select project…"/></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date</Label><Input type="date" value={form.work_date} onChange={e => setForm(p => ({ ...p, work_date: e.target.value }))} className="mt-1 text-xs"/></div>
              <div><Label className="text-xs">Hours *</Label><Input type="number" step="0.5" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} className="mt-1 text-xs"/></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1 text-xs"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.employee_name || !form.hours} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
