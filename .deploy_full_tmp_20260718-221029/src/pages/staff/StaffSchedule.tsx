import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StaffLayout from "@/layouts/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, RefreshCcw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_AR = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

const STATUS_COLOR: Record<string, string> = {
  present:   "bg-green-500/20 text-green-400 border-green-500/30",
  absent:    "bg-red-500/20 text-red-400 border-red-500/30",
  late:      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "half-day":"bg-blue-500/20 text-blue-400 border-blue-500/30",
  holiday:   "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function StaffSchedule() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [records, setRecords] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: att }, { data: lv }] = await Promise.all([
      db.from("hr_attendance").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
      db.from("hr_leave_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setRecords(att ?? []);
    setLeaves(lv ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // Build a 4-week grid
  const today = new Date();
  const weeks: Date[][] = [];
  for (let w = 3; w >= 0; w--) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(today);
      day.setDate(today.getDate() - w * 7 - (today.getDay() - d));
      week.push(day);
    }
    weeks.push(week);
  }

  const attMap = Object.fromEntries(records.map(r => [r.date, r]));
  const presentDays = records.filter(r => r.status === "present" || r.status === "half-day").length;
  const absentDays  = records.filter(r => r.status === "absent").length;
  const lateDays    = records.filter(r => r.status === "late").length;

  const fmtDate = (d: Date) => d.toISOString().split("T")[0];
  const LEAVE_BADGE: Record<string, string> = {
    pending:  "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    approved: "text-green-400 border-green-400/30 bg-green-400/10",
    rejected: "text-red-400 border-red-400/30 bg-red-400/10",
  };

  return (
    <StaffLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Calendar className="w-6 h-6 text-violet-400" />
              {R ? "جدولي" : "My Schedule"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "آخر 4 أسابيع" : "Last 4 weeks"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: R ? "أيام الحضور" : "Days Present", value: presentDays, icon: CheckCircle, color: "text-green-400" },
            { label: R ? "أيام الغياب" : "Days Absent",  value: absentDays,  icon: XCircle,    color: "text-red-400"   },
            { label: R ? "تأخير"       : "Late Days",    value: lateDays,    icon: AlertCircle,color: "text-yellow-400"},
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn("w-6 h-6", s.color)} />
                <div>
                  <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calendar Grid */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{R ? "سجل الحضور" : "Attendance Calendar"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-40 bg-muted/30 rounded animate-pulse" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      {(R ? DAYS_AR : DAYS_EN).map(d => (
                        <th key={d} className="text-center py-2 text-muted-foreground font-medium w-[14.28%]">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week, wi) => (
                      <tr key={wi}>
                        {week.map((day, di) => {
                          const key = fmtDate(day);
                          const rec = attMap[key];
                          const isToday = key === fmtDate(today);
                          const isFuture = day > today;
                          return (
                            <td key={di} className="p-1 text-center">
                              <div className={cn(
                                "mx-auto w-8 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] border",
                                isToday ? "border-violet-500 bg-violet-500/20 font-bold text-violet-400" :
                                isFuture ? "border-transparent text-muted-foreground/40" :
                                rec ? cn("border", STATUS_COLOR[rec.status] ?? "border-border text-muted-foreground") :
                                "border-dashed border-border/40 text-muted-foreground/40"
                              )}>
                                <span>{day.getDate()}</span>
                                {rec && <span className="text-[7px] leading-none mt-0.5">{rec.status?.slice(0,3)}</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
              {Object.entries(STATUS_COLOR).map(([s, cls]) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={cn("w-3 h-3 rounded border text-[8px]", cls)} />
                  <span className="text-xs text-muted-foreground capitalize">{s}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              {R ? "طلبات الإجازة" : "My Leave Requests"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leaves.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{R ? "لا توجد طلبات" : "No leave requests"}</p>
            ) : (
              <div className="divide-y divide-border/50">
                {leaves.map(l => (
                  <div key={l.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{l.leave_type || "General"}</span>
                        <Badge variant="outline" className={cn("text-xs", LEAVE_BADGE[l.status] ?? "")}>{l.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {l.start_date} → {l.end_date}
                      </p>
                    </div>
                    {l.reason && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{l.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
