import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StaffLayout from "@/layouts/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, RefreshCcw, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  present:   "text-green-400 border-green-400/30 bg-green-400/10",
  absent:    "text-red-400 border-red-400/30 bg-red-400/10",
  late:      "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  "half-day":"text-blue-400 border-blue-400/30 bg-blue-400/10",
};

export default function StaffAttendance() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type: "Annual", start_date: "", end_date: "", reason: "" });

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db
      .from("hr_attendance")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);
    setRecords(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const todayRecord = records.find(r => r.date === today);
  const isCheckedIn = !!todayRecord?.check_in && !todayRecord?.check_out;

  const checkIn = async () => {
    if (!user) return;
    setCheckingIn(true);
    const isLate = now > "09:30";
    if (todayRecord) {
      const { error } = await db.from("hr_attendance").update({ check_in: now, status: isLate ? "late" : "present" }).eq("id", todayRecord.id);
      if (error) { toast.error(error.message); setCheckingIn(false); return; }
    } else {
      const { error } = await db.from("hr_attendance").insert({ user_id: user.id, date: today, check_in: now, status: isLate ? "late" : "present" });
      if (error) { toast.error(error.message); setCheckingIn(false); return; }
    }
    toast.success(isLate ? (R ? "تم تسجيل الحضور (متأخر)" : "Checked in (late)") : (R ? "تم تسجيل الحضور" : "Checked in!"));
    setCheckingIn(false);
    load();
  };

  const checkOut = async () => {
    if (!todayRecord) return;
    setCheckingIn(true);
    const { error } = await db.from("hr_attendance").update({ check_out: now }).eq("id", todayRecord.id);
    if (error) { toast.error(error.message); setCheckingIn(false); return; }
    toast.success(R ? "تم تسجيل الانصراف" : "Checked out!");
    setCheckingIn(false);
    load();
  };

  const submitLeave = async () => {
    if (!user || !leaveForm.start_date || !leaveForm.end_date) {
      return toast.error(R ? "التواريخ مطلوبة" : "Dates required");
    }
    const { error } = await db.from("hr_leave_requests").insert({ ...leaveForm, user_id: user.id, status: "pending" });
    if (error) return toast.error(error.message);
    toast.success(R ? "تم إرسال طلب الإجازة" : "Leave request submitted");
    setLeaveModal(false);
    setLeaveForm({ leave_type: "Annual", start_date: "", end_date: "", reason: "" });
  };

  const presentCount = records.filter(r => r.status === "present" || r.status === "half-day").length;
  const lateCount    = records.filter(r => r.status === "late").length;
  const absentCount  = records.filter(r => r.status === "absent").length;

  const fmtTime = (t?: string) => t || "—";

  return (
    <StaffLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Clock className="w-6 h-6 text-violet-400" />
              {R ? "الحضور والانصراف" : "Attendance"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "سجل حضورك اليومي" : "Track your daily attendance"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Today Check-in Card */}
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{R ? "اليوم" : "Today"} — {today}</p>
                <p className="text-lg font-bold mt-1">
                  {todayRecord
                    ? todayRecord.check_out
                      ? `${R ? "دخول" : "In"}: ${fmtTime(todayRecord.check_in)} / ${R ? "خروج" : "Out"}: ${fmtTime(todayRecord.check_out)}`
                      : `${R ? "دخول" : "In"}: ${fmtTime(todayRecord.check_in)}`
                    : (R ? "لم تسجل بعد" : "Not checked in yet")
                  }
                </p>
                {todayRecord && (
                  <Badge variant="outline" className={cn("mt-2 text-xs", STATUS_COLOR[todayRecord.status] ?? "")}>
                    {todayRecord.status}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {!todayRecord?.check_in && (
                  <Button onClick={checkIn} disabled={checkingIn} className="gap-2 bg-violet-600 hover:bg-violet-700">
                    <LogIn className="w-4 h-4" />{R ? "تسجيل دخول" : "Check In"}
                  </Button>
                )}
                {isCheckedIn && (
                  <Button onClick={checkOut} disabled={checkingIn} variant="outline" className="gap-2">
                    <LogOut className="w-4 h-4" />{R ? "تسجيل خروج" : "Check Out"}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setLeaveModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />{R ? "إجازة" : "Request Leave"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: R ? "أيام الحضور" : "Present Days",  value: presentCount, icon: CheckCircle, color: "text-green-400" },
            { label: R ? "أيام الغياب" : "Absent Days",   value: absentCount,  icon: XCircle,    color: "text-red-400"   },
            { label: R ? "تأخير"       : "Late Arrivals", value: lateCount,    icon: AlertCircle,color: "text-yellow-400"},
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

        {/* History Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "سجل الحضور (آخر 30 يوم)" : "Attendance History (last 30 days)"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-11 bg-muted/30 rounded animate-pulse" />)}</div>
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{R ? "لا يوجد سجل" : "No records yet"}</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs">
                  <tr>
                    <th className="text-left p-3">{R ? "التاريخ" : "Date"}</th>
                    <th className="text-left p-3">{R ? "الدخول" : "In"}</th>
                    <th className="text-left p-3">{R ? "الخروج" : "Out"}</th>
                    <th className="text-left p-3">{R ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/10">
                      <td className="p-3 font-medium">{r.date === today ? <span className="text-violet-400 font-bold">{R ? "اليوم" : "Today"}</span> : r.date}</td>
                      <td className="p-3 text-xs">{r.check_in || "—"}</td>
                      <td className="p-3 text-xs">{r.check_out || "—"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn("text-xs", STATUS_COLOR[r.status] ?? "")}>
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leave Modal */}
      <Dialog open={leaveModal} onOpenChange={setLeaveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{R ? "طلب إجازة" : "Request Leave"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{R ? "نوع الإجازة" : "Leave Type"}</Label>
              <Select value={leaveForm.leave_type} onValueChange={v => setLeaveForm({ ...leaveForm, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">{R ? "سنوية" : "Annual"}</SelectItem>
                  <SelectItem value="Sick">{R ? "مرضية" : "Sick"}</SelectItem>
                  <SelectItem value="Emergency">{R ? "طارئة" : "Emergency"}</SelectItem>
                  <SelectItem value="Unpaid">{R ? "بدون راتب" : "Unpaid"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{R ? "من تاريخ *" : "From *"}</Label>
                <input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm" />
              </div>
              <div>
                <Label>{R ? "إلى تاريخ *" : "To *"}</Label>
                <input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm" />
              </div>
            </div>
            <div>
              <Label>{R ? "السبب" : "Reason"}</Label>
              <Textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveModal(false)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={submitLeave} className="bg-violet-600 hover:bg-violet-700">{R ? "إرسال" : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
