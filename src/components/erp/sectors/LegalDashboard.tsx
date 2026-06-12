import { useQuery } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, FolderOpen, FileText, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LegalDashboard() {
  const { activeTenant } = useERP();
  const tid = activeTenant?.id ?? '';

  const { data: stats } = useQuery({
    queryKey: ['leg-stats', tid],
    queryFn: async () => {
      const [cases, docs, timesheets] = await Promise.all([
        supabase.from('leg_cases' as never).select('id, status, priority').eq('tenant_id', tid),
        supabase.from('leg_documents' as never).select('id').eq('tenant_id', tid),
        supabase.from('leg_billing_timesheets' as never).select('hours, amount, is_billed').eq('tenant_id', tid),
      ]);
      const c = (cases.data ?? []) as { id: string; status: string; priority: string }[];
      const t = (timesheets.data ?? []) as { hours: number; amount: number; is_billed: boolean }[];
      return {
        totalCases: c.length,
        openCases: c.filter(x => x.status === 'open').length,
        urgentCases: c.filter(x => x.priority === 'urgent').length,
        totalDocs: (docs.data ?? []).length,
        unbilledHours: t.filter(x => !x.is_billed).reduce((s, x) => s + x.hours, 0),
        unbilledAmount: t.filter(x => !x.is_billed).reduce((s, x) => s + x.amount, 0),
      };
    },
    enabled: !!tid,
  });

  const { data: recentCases = [] } = useQuery({
    queryKey: ['leg-recent-cases', tid],
    queryFn: async () => {
      const { data } = await supabase
        .from('leg_cases' as never)
        .select('*')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data ?? []) as { id: string; case_number: string; title: string; case_type: string; status: string; priority: string }[];
    },
    enabled: !!tid,
  });

  const kpis = [
    { label: 'Open Cases',      value: stats?.openCases ?? 0,                          icon: <FolderOpen className="h-5 w-5" />,  color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Urgent Cases',    value: stats?.urgentCases ?? 0,                        icon: <AlertCircle className="h-5 w-5" />, color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Vault Documents', value: stats?.totalDocs ?? 0,                          icon: <FileText className="h-5 w-5" />,    color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Unbilled Hours',  value: `${(stats?.unbilledHours ?? 0).toFixed(1)}h`,   icon: <Clock className="h-5 w-5" />,       color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
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
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-indigo-500" />Recent Cases</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentCases.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No cases yet</p>
              : recentCases.map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">{c.case_number}</span>
                    <span className="ml-2 font-medium">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{c.case_type}</Badge>
                    <CaseStatusBadge status={c.status} />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" />Billing Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unbilled Hours</span>
              <span className="font-bold">{(stats?.unbilledHours ?? 0).toFixed(1)} hrs</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unbilled Amount</span>
              <span className="font-bold text-amber-600">${(stats?.unbilledAmount ?? 0).toFixed(2)}</span>
            </div>
            <div className="pt-2 space-y-1">
              {['Hourly Rate Billing', 'Court Session Billing', 'Retainer Contracts', 'Document Vault'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />{f}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CaseStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800', pending: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-700', won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800', settled: 'bg-purple-100 text-purple-800',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}
