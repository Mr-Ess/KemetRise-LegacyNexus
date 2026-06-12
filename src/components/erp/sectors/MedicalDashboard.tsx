import { useQuery } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, FileText, Pill, UserCheck, Clock } from "lucide-react";

export default function MedicalDashboard() {
  const { activeTenant } = useERP();
  const tid = activeTenant?.id ?? '';

  const { data: stats } = useQuery({
    queryKey: ['med-stats', tid],
    queryFn: async () => {
      const [pats, appts, ehrs] = await Promise.all([
        supabase.from('med_patients' as never).select('id, is_active').eq('tenant_id', tid),
        supabase.from('med_appointments' as never).select('id, status, appointment_date').eq('tenant_id', tid),
        supabase.from('med_ehr_records' as never).select('id').eq('tenant_id', tid),
      ]);
      const patients = (pats.data ?? []) as { id: string; is_active: boolean }[];
      const appointments = (appts.data ?? []) as { id: string; status: string; appointment_date: string }[];
      const today = new Date().toISOString().split('T')[0];
      return {
        totalPatients: patients.length,
        activePatients: patients.filter(p => p.is_active).length,
        todayAppts: appointments.filter(a => a.appointment_date === today).length,
        pendingAppts: appointments.filter(a => a.status === 'scheduled').length,
        totalEHR: (ehrs.data ?? []).length,
      };
    },
    enabled: !!tid,
  });

  const { data: todayAppts = [] } = useQuery({
    queryKey: ['med-today-appts', tid],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('med_appointments' as never)
        .select('*, med_patients(full_name), med_doctors(full_name, specialization)')
        .eq('tenant_id', tid)
        .eq('appointment_date', today)
        .order('start_time');
      return (data ?? []) as { id: string; start_time: string; status: string; appointment_type: string; med_patients: { full_name: string } | null; med_doctors: { full_name: string; specialization: string } | null }[];
    },
    enabled: !!tid,
  });

  const kpis = [
    { label: 'Total Patients',  value: stats?.totalPatients ?? 0,  icon: <Heart className="h-5 w-5" />,      color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: "Today's Appts",   value: stats?.todayAppts ?? 0,     icon: <Calendar className="h-5 w-5" />,   color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Pending Appts',   value: stats?.pendingAppts ?? 0,   icon: <Clock className="h-5 w-5" />,      color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'EHR Records',     value: stats?.totalEHR ?? 0,       icon: <FileText className="h-5 w-5" />,   color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
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

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-green-500" />Today's Appointments</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {todayAppts.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No appointments today</p>
            : todayAppts.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <div>
                  <span className="font-medium">{a.med_patients?.full_name ?? '–'}</span>
                  <span className="text-muted-foreground text-xs ml-2">→ Dr. {a.med_doctors?.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{a.start_time}</span>
                  <Badge variant="outline" className="text-xs">{a.appointment_type}</Badge>
                  <ApptStatusBadge status={a.status} />
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <Heart className="h-5 w-5 text-red-500" />,   title: 'EHR Records',     desc: 'Electronic health records with full history, vitals, diagnoses & lab results' },
          { icon: <Pill className="h-5 w-5 text-green-500" />,  title: 'e-Prescriptions', desc: 'Digital prescriptions with QR delivery and pharmacy dispensing tracking' },
          { icon: <UserCheck className="h-5 w-5 text-blue-500" />, title: 'Medical Billing', desc: 'Configurable billing categories: consultations, labs, imaging, procedures' },
        ].map(item => (
          <div key={item.title} className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">{item.icon}<p className="font-semibold text-sm">{item.title}</p></div>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApptStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}
