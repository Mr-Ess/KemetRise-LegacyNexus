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
import { Users2, TrendingUp, Phone, Mail, Target, Plus, Pencil, Trash2, Activity, Star } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Lead {
  id: string; name: string; email: string | null; phone: string | null;
  company: string | null; source: string | null; stage: string;
  value: number | null; assigned_to: string | null; notes: string | null;
  created_at: string;
}
interface CRMActivity {
  id: string; lead_id: string | null; activity_type: string; subject: string;
  due_date: string | null; is_done: boolean; notes: string | null; created_at: string;
}
interface Contact {
  id: string; name: string; email: string | null; phone: string | null;
  company: string | null; contact_type: string; tags: string[] | null;
}

const STAGES = ['new','contacted','qualified','proposal','negotiation','won','lost'];
const STAGE_COLOR: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600', contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-violet-100 text-violet-700', proposal: 'bg-amber-100 text-amber-700',
  negotiation: 'bg-orange-100 text-orange-700', won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
};
const ACTIVITY_TYPES = ['call','email','meeting','task','note','demo'];

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}
function NoTenant() {
  return <div className="py-12 text-center text-muted-foreground text-sm">Select a tenant to view CRM data.</div>;
}

export default function CRMModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;
  const cur = activeTenant?.default_currency ?? 'USD';

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['crm-leads', tid],
    queryFn: async () => {
      const { data, error } = await db.from('crm_leads').select('*').eq('tenant_id', tid).order('created_at', { ascending: false });
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: activities = [] } = useQuery<CRMActivity[]>({
    queryKey: ['crm-activities', tid],
    queryFn: async () => {
      const { data, error } = await db.from('crm_activities').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['crm-contacts', tid],
    queryFn: async () => {
      const { data, error } = await db.from('crm_contacts').select('*').eq('tenant_id', tid).order('name');
      if (error) throw error; return data ?? [];
    },
    enabled: !!tid,
  });

  if (!activeTenant) return <NoTenant />;

  const wonLeads = leads.filter(l => l.stage === 'won');
  const pipeline = leads.filter(l => !['won','lost'].includes(l.stage));
  const pipelineValue = pipeline.reduce((s, l) => s + (l.value || 0), 0);
  const pendingActivities = activities.filter(a => !a.is_done).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads',       val: String(leads.length),        icon: <Target className="h-4 w-4"/>,   col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Won Deals',         val: String(wonLeads.length),     icon: <Star className="h-4 w-4"/>,     col: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Pipeline Value',    val: fmt(pipelineValue, cur),     icon: <TrendingUp className="h-4 w-4"/>,col:'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Pending Activities',val: String(pendingActivities),   icon: <Activity className="h-4 w-4"/>, col: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
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

      <Tabs defaultValue="pipeline">
        <TabsList className="flex gap-1 flex-wrap h-auto">
          <TabsTrigger value="pipeline"   className="gap-1 text-xs"><TrendingUp className="h-3.5 w-3.5"/>Pipeline</TabsTrigger>
          <TabsTrigger value="leads"      className="gap-1 text-xs"><Target className="h-3.5 w-3.5"/>Leads</TabsTrigger>
          <TabsTrigger value="contacts"   className="gap-1 text-xs"><Users2 className="h-3.5 w-3.5"/>Contacts</TabsTrigger>
          <TabsTrigger value="activities" className="gap-1 text-xs"><Activity className="h-3.5 w-3.5"/>Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <PipelineView leads={leads} cur={cur} />
        </TabsContent>
        <TabsContent value="leads" className="mt-4">
          <LeadsTab leads={leads} cur={cur} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['crm-leads', tid] })} />
        </TabsContent>
        <TabsContent value="contacts" className="mt-4">
          <ContactsTab contacts={contacts} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['crm-contacts', tid] })} />
        </TabsContent>
        <TabsContent value="activities" className="mt-4">
          <ActivitiesTab activities={activities} tenantId={tid!} onRefresh={() => qc.invalidateQueries({ queryKey: ['crm-activities', tid] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── PIPELINE KANBAN ──────────────────────────────────────────────────────────
function PipelineView({ leads, cur }: { leads: Lead[]; cur: string }) {
  const activeStages = STAGES.filter(s => s !== 'lost');
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {activeStages.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage);
          const stageValue = stageLeads.reduce((s, l) => s + (l.value || 0), 0);
          return (
            <div key={stage} className="w-48 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <Badge className={`text-[10px] capitalize ${STAGE_COLOR[stage]}`}>{stage}</Badge>
                <span className="text-[10px] text-muted-foreground">{stageLeads.length}</span>
              </div>
              <div className="space-y-2">
                {stageLeads.map(l => (
                  <Card key={l.id} className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-2.5">
                      <p className="text-xs font-semibold truncate">{l.name}</p>
                      {l.company && <p className="text-[10px] text-muted-foreground truncate">{l.company}</p>}
                      {l.value ? <p className="text-[10px] font-mono text-primary mt-1">{fmt(l.value, cur)}</p> : null}
                      {l.assigned_to && <p className="text-[10px] text-muted-foreground mt-0.5">→ {l.assigned_to}</p>}
                    </CardContent>
                  </Card>
                ))}
                {stageLeads.length === 0 && <div className="h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground/50">Empty</div>}
              </div>
              {stageValue > 0 && <p className="text-[10px] font-mono text-muted-foreground mt-2 text-center">{fmt(stageValue, cur)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LEADS TAB ───────────────────────────────────────────────────────────────
function LeadsTab({ leads, cur, tenantId, onRefresh }: { leads: Lead[]; cur: string; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: '', stage: 'new', value: '', assigned_to: '', notes: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tenant_id: tenantId, value: parseFloat(form.value) || null };
      if (editing) {
        const { error } = await db.from('crm_leads').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('crm_leads').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? 'Lead updated' : 'Lead created'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('crm_leads').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Lead deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm({ name: '', email: '', phone: '', company: '', source: '', stage: 'new', value: '', assigned_to: '', notes: '' }); setOpen(true); };
  const openEdit = (l: Lead) => { setEditing(l); setForm({ name: l.name, email: l.email??'', phone: l.phone??'', company: l.company??'', source: l.source??'', stage: l.stage, value: String(l.value??''), assigned_to: l.assigned_to??'', notes: l.notes??'' }); setOpen(true); };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{leads.length} Leads</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5"/>New Lead</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr>
            <th className="text-left p-2.5 font-medium">Name</th>
            <th className="text-left p-2.5 font-medium">Company</th>
            <th className="text-left p-2.5 font-medium">Stage</th>
            <th className="text-right p-2.5 font-medium">Value</th>
            <th className="text-left p-2.5 font-medium">Assigned</th>
            <th className="p-2.5"/>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {leads.map(l => (
              <tr key={l.id} className="hover:bg-muted/20">
                <td className="p-2.5">
                  <p className="font-medium">{l.name}</p>
                  {l.email && <p className="text-[10px] text-muted-foreground">{l.email}</p>}
                </td>
                <td className="p-2.5">{l.company ?? '—'}</td>
                <td className="p-2.5"><Badge className={`text-[10px] capitalize ${STAGE_COLOR[l.stage]}`}>{l.stage}</Badge></td>
                <td className="p-2.5 text-right font-mono">{l.value ? fmt(l.value, cur) : '—'}</td>
                <td className="p-2.5">{l.assigned_to ?? '—'}</td>
                <td className="p-2.5 flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(l)}><Pencil className="h-3 w-3"/></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete lead?')) remove(l.id); }}><Trash2 className="h-3 w-3"/></Button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No leads yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Lead' : 'New Lead'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Full Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Company</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Source</Label><Input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="website, referral…" className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Stage</Label>
              <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Deal Value</Label><Input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Assigned To</Label><Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="mt-1 text-xs"/></div>
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

// ─── CONTACTS TAB ─────────────────────────────────────────────────────────────
function ContactsTab({ contacts, tenantId, onRefresh }: { contacts: Contact[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', contact_type: 'prospect' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('crm_contacts').insert([{ ...form, tenant_id: tenantId }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Contact added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from('crm_contacts').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { toast.success('Contact deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{contacts.length} Contacts</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ name: '', email: '', phone: '', company: '', contact_type: 'prospect' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>New Contact</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {contacts.map(c => (
          <Card key={c.id} className="border shadow-sm">
            <CardContent className="p-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                {c.company && <p className="text-xs text-muted-foreground truncate">{c.company}</p>}
                {c.email && <div className="flex items-center gap-1 mt-1"><Mail className="h-2.5 w-2.5 text-muted-foreground"/><span className="text-[10px] truncate">{c.email}</span></div>}
                {c.phone && <div className="flex items-center gap-1"><Phone className="h-2.5 w-2.5 text-muted-foreground"/><span className="text-[10px]">{c.phone}</span></div>}
                <Badge variant="outline" className="text-[9px] mt-1 capitalize">{c.contact_type}</Badge>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive shrink-0" onClick={() => { if (confirm('Delete contact?')) remove(c.id); }}><Trash2 className="h-3 w-3"/></Button>
            </CardContent>
          </Card>
        ))}
        {contacts.length === 0 && <div className="col-span-3 py-10 text-center text-muted-foreground text-sm">No contacts yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 text-xs"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 text-xs"/></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 text-xs"/></div>
            </div>
            <div><Label className="text-xs">Company</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Type</Label>
              <Select value={form.contact_type} onValueChange={v => setForm(p => ({ ...p, contact_type: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>
                  {['prospect','customer','partner','vendor','other'].map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}
                </SelectContent>
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

// ─── ACTIVITIES TAB ───────────────────────────────────────────────────────────
function ActivitiesTab({ activities, tenantId, onRefresh }: { activities: CRMActivity[]; tenantId: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ activity_type: 'call', subject: '', due_date: '', notes: '' });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('crm_activities').insert([{ ...form, tenant_id: tenantId, is_done: false, due_date: form.due_date || null }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Activity added'); setOpen(false); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: toggleDone } = useMutation({
    mutationFn: async ({ id, is_done }: { id: string; is_done: boolean }) => {
      const { error } = await db.from('crm_activities').update({ is_done: !is_done }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Activity updated'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const typeIcon: Record<string, string> = { call: '📞', email: '✉️', meeting: '🤝', task: '✅', note: '📝', demo: '🎯' };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{activities.filter(a => !a.is_done).length} pending</p>
        <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => { setForm({ activity_type: 'call', subject: '', due_date: '', notes: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5"/>Add Activity</Button>
      </div>
      <div className="space-y-2">
        {activities.map(a => (
          <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${a.is_done ? 'opacity-50 bg-muted/30' : 'bg-card'}`}>
            <span className="text-lg mt-0.5">{typeIcon[a.activity_type] ?? '📌'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${a.is_done ? 'line-through text-muted-foreground' : ''}`}>{a.subject}</p>
              {a.due_date && <p className="text-[10px] text-muted-foreground">{a.due_date}</p>}
              {a.notes && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{a.notes}</p>}
            </div>
            <Button size="sm" variant={a.is_done ? 'outline' : 'default'} className="h-7 text-xs shrink-0" onClick={() => toggleDone({ id: a.id, is_done: a.is_done })}>{a.is_done ? 'Reopen' : 'Done'}</Button>
          </div>
        ))}
        {activities.length === 0 && <div className="py-10 text-center text-muted-foreground text-sm">No activities yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Activity</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Type</Label>
              <Select value={form.activity_type} onValueChange={v => setForm(p => ({ ...p, activity_type: v }))}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{typeIcon[t]} {t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Subject *</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="mt-1 text-xs"/></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="mt-1 text-xs"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={isPending || !form.subject} onClick={() => save()}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
