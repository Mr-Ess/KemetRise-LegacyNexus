import { useQuery } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, CreditCard, DoorOpen, Calendar, Users, AlertCircle } from "lucide-react";

export default function SportsDashboard() {
  const { activeTenant } = useERP();
  const tid = activeTenant?.id ?? '';

  const { data: stats } = useQuery({
    queryKey: ['spt-stats', tid],
    queryFn: async () => {
      const [members, subs, accessLogs] = await Promise.all([
        supabase.from('spt_members' as never).select('id, is_active').eq('tenant_id', tid),
        supabase.from('spt_subscriptions' as never).select('id, status, end_date').eq('tenant_id', tid),
        supabase.from('spt_access_logs' as never).select('id, access_time').eq('tenant_id', tid)
          .gte('access_time', new Date(Date.now() - 86400000).toISOString()),
      ]);
      const m = (members.data ?? []) as { id: string; is_active: boolean }[];
      const s = (subs.data ?? []) as { id: string; status: string; end_date: string }[];
      const today = new Date().toISOString().split('T')[0];
      const expiringSoon = s.filter(sub => {
        const daysLeft = (new Date(sub.end_date).getTime() - Date.now()) / 86400000;
        return daysLeft >= 0 && daysLeft <= 7 && sub.status === 'active';
      });
      return {
        totalMembers: m.length,
        activeMembers: m.filter(x => x.is_active).length,
        activeSubs: s.filter(x => x.status === 'active').length,
        expiringSoon: expiringSoon.length,
        todayAccess: (accessLogs.data ?? []).length,
      };
    },
    enabled: !!tid,
  });

  const { data: recentAccess = [] } = useQuery({
    queryKey: ['spt-access-recent', tid],
    queryFn: async () => {
      const { data } = await supabase
        .from('spt_access_logs' as never)
        .select('*, spt_members(full_name)')
        .eq('tenant_id', tid)
        .order('access_time', { ascending: false })
        .limit(8);
      return (data ?? []) as { id: string; access_time: string; access_type: string; access_method: string; was_granted: boolean; spt_members: { full_name: string } | null }[];
    },
    enabled: !!tid,
  });

  const kpis = [
    { label: 'Active Members',   value: stats?.activeMembers ?? 0, icon: <Users className="h-5 w-5" />,        color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Active Subs',      value: stats?.activeSubs ?? 0,    icon: <CreditCard className="h-5 w-5" />,   color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: "Today's Access",   value: stats?.todayAccess ?? 0,   icon: <DoorOpen className="h-5 w-5" />,     color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Expiring in 7d',   value: stats?.expiringSoon ?? 0,  icon: <AlertCircle className="h-5 w-5" />,  color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
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
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DoorOpen className="h-4 w-4 text-indigo-500" />Live Access Gate Log</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentAccess.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No access events</p>
              : recentAccess.map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span className="font-medium">{a.spt_members?.full_name ?? 'Unknown'}</span>
                  <Badge variant="outline" className="text-xs">{a.access_method}</Badge>
                  <span className={`text-xs font-medium ${a.was_granted ? 'text-green-600' : 'text-red-600'}`}>
                    {a.was_granted ? '✓ Granted' : '✗ Denied'}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(a.access_time).toLocaleTimeString()}</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Dumbbell className="h-4 w-4 text-amber-500" />Module Features</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: '🔑', label: 'RFID/QR Gate Control', desc: 'Access control integration' },
              { icon: '📅', label: 'Session Booking', desc: 'Trainer & class scheduling' },
              { icon: '🧴', label: 'Supplement Store', desc: 'Inventory tracking for supplements' },
              { icon: '❄️', label: 'Freeze Subscriptions', desc: 'Pause & resume memberships' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 text-sm">
                <span>{f.icon}</span>
                <div>
                  <span className="font-medium">{f.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{f.desc}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
