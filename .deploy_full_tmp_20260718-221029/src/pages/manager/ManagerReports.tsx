import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import ManagerLayout from "@/layouts/ManagerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, RefreshCcw, Download, Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ManagerReports() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [report, setReport] = useState({
    orders: { total: 0, completed: 0, pending: 0, revenue: 0, cancelled: 0 },
    team: { total: 0, active: 0, onLeave: 0 },
    performance: { avg: 0, reviews: 0 },
    attendance: { total: 0, present: 0, absent: 0, late: 0 },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - Number(period) * 24 * 3600 * 1000).toISOString();
      const [
        { data: orders },
        { count: teamTotal },
        { count: teamActive },
        { count: onLeave },
        { data: perfs },
        { data: att },
      ] = await Promise.all([
        db.from("mp_orders").select("status,total_cents").gte("created_at", since),
        db.from("hr_employees").select("*", { count: "exact", head: true }),
        db.from("hr_employees").select("*", { count: "exact", head: true }).eq("status", "active"),
        db.from("hr_employees").select("*", { count: "exact", head: true }).eq("status", "on-leave"),
        db.from("hr_performance").select("score").gte("created_at", since),
        db.from("hr_attendance").select("status").gte("created_at", since),
      ]);

      const completed = (orders || []).filter((o: any) => o.status === "completed");
      const revenue = completed.reduce((s: number, o: any) => s + (o.total_cents || 0), 0);
      const scores = (perfs || []).map((p: any) => p.score).filter(Boolean);
      const avgScore = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

      setReport({
        orders: {
          total: (orders || []).length,
          completed: completed.length,
          pending: (orders || []).filter((o: any) => o.status === "pending").length,
          cancelled: (orders || []).filter((o: any) => o.status === "cancelled").length,
          revenue,
        },
        team: { total: teamTotal || 0, active: teamActive || 0, onLeave: onLeave || 0 },
        performance: { avg: avgScore, reviews: (perfs || []).length },
        attendance: {
          total: (att || []).length,
          present: (att || []).filter((a: any) => a.status === "present").length,
          absent: (att || []).filter((a: any) => a.status === "absent").length,
          late: (att || []).filter((a: any) => a.status === "late").length,
        },
      });
    } catch {}
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const exportReport = () => {
    const rows = [
      ["Category", "Metric", "Value"],
      ["Orders", "Total", report.orders.total],
      ["Orders", "Completed", report.orders.completed],
      ["Orders", "Pending", report.orders.pending],
      ["Orders", "Cancelled", report.orders.cancelled],
      ["Orders", "Revenue (USD)", (report.orders.revenue / 100).toFixed(2)],
      ["Team", "Total Employees", report.team.total],
      ["Team", "Active", report.team.active],
      ["Team", "On Leave", report.team.onLeave],
      ["Performance", "Reviews", report.performance.reviews],
      ["Performance", "Average Score", report.performance.avg.toFixed(1)],
      ["Attendance", "Total Records", report.attendance.total],
      ["Attendance", "Present", report.attendance.present],
      ["Attendance", "Absent", report.attendance.absent],
      ["Attendance", "Late", report.attendance.late],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manager-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sections = [
    {
      title: R ? "الطلبات" : "Orders",
      icon: ShoppingBag,
      color: "text-blue-400",
      items: [
        { label: R ? "الإجمالي" : "Total", value: report.orders.total },
        { label: R ? "مكتملة" : "Completed", value: report.orders.completed, color: "text-green-400" },
        { label: R ? "معلقة" : "Pending", value: report.orders.pending, color: "text-yellow-400" },
        { label: R ? "ملغاة" : "Cancelled", value: report.orders.cancelled, color: "text-red-400" },
        { label: R ? "الإيرادات" : "Revenue", value: `$${(report.orders.revenue / 100).toFixed(2)}`, color: "text-emerald-400" },
      ],
    },
    {
      title: R ? "الفريق" : "Team",
      icon: Users,
      color: "text-purple-400",
      items: [
        { label: R ? "الإجمالي" : "Total", value: report.team.total },
        { label: R ? "نشط" : "Active", value: report.team.active, color: "text-green-400" },
        { label: R ? "في إجازة" : "On Leave", value: report.team.onLeave, color: "text-yellow-400" },
      ],
    },
    {
      title: R ? "الأداء" : "Performance",
      icon: TrendingUp,
      color: "text-orange-400",
      items: [
        { label: R ? "عدد التقييمات" : "Reviews", value: report.performance.reviews },
        { label: R ? "متوسط الدرجة" : "Average Score", value: `${report.performance.avg.toFixed(1)}/10`, color: report.performance.avg >= 7 ? "text-green-400" : report.performance.avg >= 5 ? "text-yellow-400" : "text-red-400" },
      ],
    },
    {
      title: R ? "الحضور" : "Attendance",
      icon: DollarSign,
      color: "text-emerald-400",
      items: [
        { label: R ? "السجلات" : "Records", value: report.attendance.total },
        { label: R ? "حضور" : "Present", value: report.attendance.present, color: "text-green-400" },
        { label: R ? "غياب" : "Absent", value: report.attendance.absent, color: "text-red-400" },
        { label: R ? "متأخر" : "Late", value: report.attendance.late, color: "text-yellow-400" },
      ],
    },
  ];

  return (
    <ManagerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400" />
              {R ? "التقارير" : "Reports"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {R ? "تقرير شامل لأداء الفريق" : "Comprehensive team performance report"}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{R ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
                <SelectItem value="30">{R ? "آخر 30 يوم" : "Last 30 days"}</SelectItem>
                <SelectItem value="90">{R ? "آخر 90 يوم" : "Last 90 days"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={exportReport} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-4 h-4" />{R ? "تصدير CSV" : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Report Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map(sec => (
            <Card key={sec.title} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <sec.icon className={cn("w-4 h-4", sec.color)} />
                  {sec.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {sec.items.map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className={cn("text-sm font-bold", item.color || "")}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ManagerLayout>
  );
}
