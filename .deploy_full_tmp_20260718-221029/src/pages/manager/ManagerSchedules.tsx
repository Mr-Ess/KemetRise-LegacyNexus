import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import ManagerLayout from "@/layouts/ManagerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, RefreshCcw, Plus, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  present:  "text-green-400 border-green-400/30 bg-green-400/10",
  absent:   "text-red-400 border-red-400/30 bg-red-400/10",
  late:     "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  "half-day":"text-blue-400 border-blue-400/30 bg-blue-400/10",
};

const LEAVE_STATUS: Record<string, string> = {
  pending:  "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  approved: "text-green-400 border-green-400/30 bg-green-400/10",
  rejected: "text-red-400 border-red-400/30 bg-red-400/10",
};

export default function ManagerSchedules() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"attendance" | "leaves">("attendance");
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ employee_id: "", date: new Date().toISOString().split("T")[0], check_in: "09:00", check_out: "17:00", status: "present", notes: "" });

  const load = async () => {
    setLoading(true);
    const [{ data: att }, { data: lv }] = await Promise.all([
      db.from("hr_attendance").select("*").order("date", { ascending: false }).limit(100),
      db.from("hr_leave_requests").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setAttendance(att ?? []);
    setLeaves(lv ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveAttendance = async () => {
    const { error } = await db.from("hr_attendance").insert(form);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم التسجيل" : "Saved");
    setAddModal(false);
    load();
  };

  const updateLeave = async (id: string, status: "approved" | "rejected") => {
    const { error } = await db.from("hr_leave_requests").update({ status, approved_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? (R ? "تمت الموافقة" : "Approved") : (R ? "تم الرفض" : "Rejected"));
    load();
  };

  const fmt = (s: string) => new Date(s).toLocaleDateString(R ? "ar-EG" : "en-US");

  const todayAtt = attendance.filter(a => a.date === new Date().toISOString().split("T")[0]);
  const pendingLeaves = leaves.filter(l => l.status === "pending").length;

  return (
    <ManagerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Calendar className="w-6 h-6 text-emerald-400" />
              {R ? "الجداول والحضور" : "Schedules & Attendance"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {todayAtt.length} {R ? "حضور اليوم" : "present today"} — {pendingLeaves} {R ? "طلب إجازة معلق" : "pending leave requests"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            {tab === "attendance" && (
              <Button size="sm" onClick={() => setAddModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />{R ? "تسجيل حضور" : "Log Attendance"}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {(["attendance", "leaves"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                tab === t ? "border-emerald-500 text-emerald-400" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "attendance" ? (R ? "سجل الحضور" : "Attendance Log") : (R ? "طلبات الإجازة" : "Leave Requests")}
            </button>
          ))}
        </div>

        {/* Attendance Tab */}
        {tab === "attendance" && (
          <Card className="border-border/50">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
              ) : attendance.length === 0 ? (
                <div className="py-16 text-center">
                  <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{R ? "لا يوجد سجل حضور" : "No attendance records"}</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs">
                    <tr>
                      <th className="text-left p-3">{R ? "الموظف" : "Employee"}</th>
                      <th className="text-left p-3">{R ? "التاريخ" : "Date"}</th>
                      <th className="text-left p-3">{R ? "الدخول" : "Check In"}</th>
                      <th className="text-left p-3">{R ? "الخروج" : "Check Out"}</th>
                      <th className="text-left p-3">{R ? "الحالة" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id} className="border-t border-border hover:bg-muted/10">
                        <td className="p-3 font-mono text-xs">{a.employee_id?.slice(0,8) || "—"}</td>
                        <td className="p-3 text-xs">{fmt(a.date)}</td>
                        <td className="p-3 text-xs">{a.check_in || "—"}</td>
                        <td className="p-3 text-xs">{a.check_out || "—"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={cn("text-xs", STATUS_COLOR[a.status] ?? "")}>
                            {a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Leave Requests Tab */}
        {tab === "leaves" && (
          <Card className="border-border/50">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />)}</div>
              ) : leaves.length === 0 ? (
                <div className="py-16 text-center">
                  <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{R ? "لا توجد طلبات إجازة" : "No leave requests"}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {leaves.map(l => (
                    <div key={l.id} className="flex items-center gap-4 px-4 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono">{l.employee_id?.slice(0,8) || "—"}</span>
                          <Badge variant="outline" className="text-xs">{l.leave_type || "General"}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {fmt(l.start_date)} → {fmt(l.end_date)}
                        </div>
                        {l.reason && <p className="text-xs text-muted-foreground mt-0.5 truncate">{l.reason}</p>}
                      </div>
                      <Badge variant="outline" className={cn("text-xs", LEAVE_STATUS[l.status] ?? "")}>
                        {l.status}
                      </Badge>
                      {l.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400 hover:text-green-300" onClick={() => updateLeave(l.id, "approved")}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => updateLeave(l.id, "rejected")}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Attendance Modal */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{R ? "تسجيل حضور" : "Log Attendance"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{R ? "معرف الموظف" : "Employee ID"}</Label>
              <Input value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} placeholder="UUID" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{R ? "التاريخ" : "Date"}</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>{R ? "الحالة" : "Status"}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">{R ? "حاضر" : "Present"}</SelectItem>
                    <SelectItem value="absent">{R ? "غائب" : "Absent"}</SelectItem>
                    <SelectItem value="late">{R ? "متأخر" : "Late"}</SelectItem>
                    <SelectItem value="half-day">{R ? "نصف يوم" : "Half Day"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{R ? "وقت الدخول" : "Check In"}</Label>
                <Input type="time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} />
              </div>
              <div>
                <Label>{R ? "وقت الخروج" : "Check Out"}</Label>
                <Input type="time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{R ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModal(false)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveAttendance} className="bg-emerald-600 hover:bg-emerald-700">{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  );
}
