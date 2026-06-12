import { useQuery } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, GraduationCap, Calendar, CreditCard, TrendingDown } from "lucide-react";

export default function EducationDashboard() {
  const { activeTenant } = useERP();
  const tid = activeTenant?.id ?? '';

  const { data: courses = [] } = useQuery({
    queryKey: ['edu-courses', tid],
    queryFn: async () => {
      const { data } = await supabase.from('edu_courses' as never).select('*').eq('tenant_id', tid).eq('is_active', true);
      return (data ?? []) as { id: string; title: string; code: string; sessions_count: number; max_students: number }[];
    },
    enabled: !!tid,
  });

  const { data: enrollmentStats } = useQuery({
    queryKey: ['edu-enrollments-stats', tid],
    queryFn: async () => {
      const { data } = await supabase.from('edu_enrollments' as never).select('status, sessions_used, balance_sessions, total_deducted').eq('tenant_id', tid);
      const rows = (data ?? []) as { status: string; sessions_used: number; balance_sessions: number; total_deducted: number }[];
      return {
        total: rows.length,
        active: rows.filter(r => r.status === 'active').length,
        totalSessions: rows.reduce((s, r) => s + r.sessions_used, 0),
        totalDeducted: rows.reduce((s, r) => s + r.total_deducted, 0),
      };
    },
    enabled: !!tid,
  });

  const { data: todaySchedules = [] } = useQuery({
    queryKey: ['edu-schedules-today', tid],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('edu_class_schedules' as never).select('*, edu_courses(title)').eq('tenant_id', tid).eq('session_date', today);
      return (data ?? []) as { id: string; session_date: string; start_time: string; status: string; edu_courses: { title: string } | null }[];
    },
    enabled: !!tid,
  });

  const kpis = [
    { label: 'Active Courses',    value: courses.length,                       icon: <BookOpen className="h-5 w-5" />,      color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Total Enrollments', value: enrollmentStats?.total ?? 0,          icon: <Users className="h-5 w-5" />,         color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Sessions Attended', value: enrollmentStats?.totalSessions ?? 0,  icon: <GraduationCap className="h-5 w-5" />, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Fees Deducted',     value: `$${(enrollmentStats?.totalDeducted ?? 0).toFixed(0)}`, icon: <TrendingDown className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" />Course Catalog</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {courses.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No courses yet</p>
              : courses.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.title}</span>
                  <Badge variant="outline" className="text-xs font-mono">{c.code}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Today's Classes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {todaySchedules.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No classes today</p>
              : todaySchedules.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.edu_courses?.title ?? '–'}</span>
                  <span className="text-muted-foreground">{s.start_time}</span>
                  <Badge variant={s.status === 'completed' ? 'default' : 'outline'} className="text-xs">{s.status}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-indigo-600" />
          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Session Balance Deduction Engine</p>
        </div>
        <p className="text-xs text-indigo-700 dark:text-indigo-400">
          Each student enrollment has a prepaid session balance. When attendance is marked,
          the system automatically deducts the session fee and decrements the balance counter.
          Zero-balance enrollments trigger renewal notifications.
        </p>
      </div>
    </div>
  );
}
