import { useQuery } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel, MapPin, Users, DollarSign, Calendar } from "lucide-react";

export default function TourismDashboard() {
  const { activeTenant } = useERP();
  const tid = activeTenant?.id ?? '';

  const { data: stats } = useQuery({
    queryKey: ['tur-stats', tid],
    queryFn: async () => {
      const [trips, bookings, commissions] = await Promise.all([
        supabase.from('tur_trips' as never).select('id, status, booked_count, max_capacity').eq('tenant_id', tid),
        supabase.from('tur_bookings' as never).select('id, status, total_amount, paid_amount').eq('tenant_id', tid),
        supabase.from('tur_agent_commissions' as never).select('commission_amount, status').eq('tenant_id', tid),
      ]);
      const t = (trips.data ?? []) as { id: string; status: string; booked_count: number; max_capacity: number }[];
      const b = (bookings.data ?? []) as { id: string; status: string; total_amount: number; paid_amount: number }[];
      const c = (commissions.data ?? []) as { commission_amount: number; status: string }[];
      return {
        activeTrips: t.filter(x => x.status === 'active').length,
        totalBookings: b.length,
        confirmedBookings: b.filter(x => x.status === 'confirmed').length,
        totalRevenue: b.reduce((s, x) => s + x.paid_amount, 0),
        pendingCommissions: c.filter(x => x.status === 'pending').reduce((s, x) => s + x.commission_amount, 0),
        avgOccupancy: t.length > 0
          ? Math.round(t.reduce((s, x) => s + (x.booked_count / Math.max(x.max_capacity, 1)), 0) / t.length * 100)
          : 0,
      };
    },
    enabled: !!tid,
  });

  const { data: recentBookings = [] } = useQuery({
    queryKey: ['tur-recent-bookings', tid],
    queryFn: async () => {
      const { data } = await supabase
        .from('tur_bookings' as never)
        .select('*, tur_trips(title)')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data ?? []) as { id: string; booking_number: string; customer_name: string; passenger_count: number; total_amount: number; status: string; tur_trips: { title: string } | null }[];
    },
    enabled: !!tid,
  });

  const currency = activeTenant?.default_currency ?? 'USD';

  const kpis = [
    { label: 'Active Trips',    value: stats?.activeTrips ?? 0,                         icon: <Plane className="h-5 w-5" />,     color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Confirmed Bookings', value: stats?.confirmedBookings ?? 0,                icon: <Users className="h-5 w-5" />,     color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Total Revenue',   value: `$${(stats?.totalRevenue ?? 0).toFixed(0)}`,     icon: <DollarSign className="h-5 w-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Pending Commissions', value: `$${(stats?.pendingCommissions ?? 0).toFixed(0)}`, icon: <MapPin className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Plane className="h-4 w-4 text-blue-500" />Recent Bookings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentBookings.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No bookings yet</p>
              : recentBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <div>
                    <span className="font-medium">{b.customer_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">→ {b.tur_trips?.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{b.passenger_count} pax</span>
                    <span className="font-mono text-xs">${b.total_amount}</span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Hotel className="h-4 w-4 text-green-500" />Module Features</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: '✈️', label: 'Trip Management',      desc: 'Group, private & corporate tours' },
              { icon: '🏨', label: 'Hotel Allotments',     desc: 'Contracted rooms per trip package' },
              { icon: '🎟️', label: 'Ticketing System',     desc: 'Flight & event ticket allocation' },
              { icon: '💰', label: 'Agent Commissions',    desc: 'Auto-calc on trip completion' },
              { icon: '📋', label: 'Visa Tracking',        desc: 'Visa status per passenger' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 text-sm">
                <span>{f.icon}</span>
                <div><span className="font-medium">{f.label}</span><span className="text-xs text-muted-foreground ml-2">{f.desc}</span></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800', completed: 'bg-green-100 text-green-800',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}
