import { useQuery } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GitCommit, Ticket, Clock, AlertTriangle, TrendingUp } from "lucide-react";

export default function CompaniesDashboard() {
  const { activeTenant } = useERP();
  const tid = activeTenant?.id ?? '';

  const { data: stats } = useQuery({
    queryKey: ['cmp-stats', tid],
    queryFn: async () => {
      const [projects, tickets, timesheets] = await Promise.all([
        supabase.from('cmp_projects' as never).select('id, status, completion_pct, budget, spent_amount').eq('tenant_id', tid),
        supabase.from('cmp_service_tickets' as never).select('id, status, priority, sla_breached').eq('tenant_id', tid),
        supabase.from('cmp_timesheets' as never).select('hours, billable_amount, is_billable, status').eq('tenant_id', tid),
      ]);
      const p = (projects.data ?? []) as { id: string; status: string; completion_pct: number; budget: number; spent_amount: number }[];
      const t = (tickets.data ?? []) as { id: string; status: string; priority: string; sla_breached: boolean }[];
      const ts = (timesheets.data ?? []) as { hours: number; billable_amount: number; is_billable: boolean; status: string }[];
      return {
        activeProjects: p.filter(x => x.status === 'active').length,
        openTickets: t.filter(x => ['open', 'in_progress', 'pending_client'].includes(x.status)).length,
        slaBreached: t.filter(x => x.sla_breached).length,
        urgentTickets: t.filter(x => x.priority === 'urgent' || x.priority === 'critical').length,
        totalBillableHours: ts.filter(x => x.is_billable).reduce((s, x) => s + x.hours, 0),
        unbilledAmount: ts.filter(x => x.is_billable && x.status === 'approved').reduce((s, x) => s + x.billable_amount, 0),
        avgCompletion: p.length > 0
          ? Math.round(p.reduce((s, x) => s + x.completion_pct, 0) / p.length)
          : 0,
      };
    },
    enabled: !!tid,
  });

  const { data: recentTickets = [] } = useQuery({
    queryKey: ['cmp-tickets-recent', tid],
    queryFn: async () => {
      const { data } = await supabase
        .from('cmp_service_tickets' as never)
        .select('*')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data ?? []) as { id: string; ticket_number: string; subject: string; status: string; priority: string; sla_breached: boolean }[];
    },
    enabled: !!tid,
  });

  const { data: recentProjects = [] } = useQuery({
    queryKey: ['cmp-projects-recent', tid],
    queryFn: async () => {
      const { data } = await supabase
        .from('cmp_projects' as never)
        .select('*')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false })
        .limit(4);
      return (data ?? []) as { id: string; project_code: string; title: string; status: string; completion_pct: number; budget: number }[];
    },
    enabled: !!tid,
  });

  const kpis = [
    { label: 'Active Projects',   value: stats?.activeProjects ?? 0,                   icon: <Briefcase className="h-5 w-5" />,   color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Open Tickets',      value: stats?.openTickets ?? 0,                      icon: <Ticket className="h-5 w-5" />,      color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'SLA Breached',      value: stats?.slaBreached ?? 0,                      icon: <AlertTriangle className="h-5 w-5" />, color: 'text-red-600',  bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Billable Hours',    value: `${(stats?.totalBillableHours ?? 0).toFixed(1)}h`, icon: <Clock className="h-5 w-5" />, color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${k.bg} ${k.color} mb-3`}>{k.icon}</div>
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-indigo-500" />Project Tracker</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No projects yet</p>
              : recentProjects.map(p => (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.title}</span>
                    <Badge variant="outline" className="text-xs">{p.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.completion_pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{p.completion_pct}%</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Ticket className="h-4 w-4 text-blue-500" />Recent Tickets</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentTickets.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No tickets yet</p>
              : recentTickets.map(t => (
                <div key={t.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {t.sla_breached && <span title="SLA Breached" className="text-red-500 shrink-0">⚠</span>}
                    <span className="truncate">{t.subject}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <TicketStatusBadge status={t.status} />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '📈', label: 'Avg Project Completion', value: `${stats?.avgCompletion ?? 0}%` },
          { icon: '💰', label: 'Unbilled Amount',         value: `$${(stats?.unbilledAmount ?? 0).toFixed(0)}` },
          { icon: '🚨', label: 'Urgent Tickets',          value: stats?.urgentTickets ?? 0 },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600', normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700', critical: 'bg-red-200 text-red-900',
  };
  return <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${map[priority] ?? 'bg-gray-100 text-gray-700'}`}>{priority}</span>;
}

function TicketStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800', in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-700',
  };
  return <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}
