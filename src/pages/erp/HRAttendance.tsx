import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Clock, CheckCircle, XCircle, QrCode, Download,
  Plus, Edit3, Trash2, RefreshCw, Calendar, Timer,
  Activity, AlertCircle, Fingerprint, Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toAppUrl } from "@/lib/appUrl";
import { toast } from "sonner";
import { format, differenceInHours } from "date-fns";

interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  full_name_ar?: string;
  department?: string;
  position?: string;
  phone?: string;
  email?: string;
  qr_secret: string;
  is_active: boolean;
  hire_date?: string;
}

interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  hours_worked?: number;
  overtime_hrs: number;
  status: string;
  source: string;
  hr_employees?: { full_name: string; department: string };
}

interface QRSession {
  id: string;
  employee_id: string;
  token: string;
  action: string;
  expires_at: string;
  is_used: boolean;
  is_valid: boolean;
  created_at: string;
  hr_employees?: { full_name: string };
}

export default function HRAttendance() {
  const { i18n } = useTranslation();
  const db = supabase as any;
  const R = i18n.language === "ar";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [qrSessions, setQrSessions] = useState<QRSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQR, setActiveQR] = useState<{ employee: Employee; session: QRSession; qrUrl: string } | null>(null);
  const [addingEmp, setAddingEmp] = useState(false);
  const [newEmp, setNewEmp] = useState({ full_name: "", department: "", position: "", phone: "", email: "" });
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: emps }, { data: att }, { data: qrs }] = await Promise.all([
      db.from("hr_employees").select("*").order("full_name"),
      db.from("hr_attendance").select("*, hr_employees(full_name, department)").eq("date", selectedDate).order("check_in"),
      db.from("hr_qr_sessions").select("*, hr_employees(full_name)").order("created_at", { ascending: false }).limit(20),
    ]);
    setEmployees(emps || []);
    setAttendance(att || []);
    setQrSessions(qrs || []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  const generateQR = async (emp: Employee, action: "check_in" | "check_out") => {
    // Expire existing
    await db.from("hr_qr_sessions").update({ is_valid: false }).eq("employee_id", emp.id).eq("action", action).eq("is_valid", true).eq("is_used", false);

    const { data, error } = await db.from("hr_qr_sessions").insert({
      employee_id: emp.id, action,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }).select("*, hr_employees(full_name)").single();

    if (error) { toast.error(error.message); return; }

    // Generate QR URL
    const qrData = toAppUrl(`hr/scan/${encodeURIComponent(data.token)}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&bgcolor=1a1a2e&color=D4A017&format=svg&data=${encodeURIComponent(qrData)}`;

    setActiveQR({ employee: emp, session: data, qrUrl });
    setQrSessions(p => [data, ...p.slice(0, 19)]);
    toast.success(R ? `تم إنشاء QR لـ ${emp.full_name} (صالح 5 دقائق)` : `QR generated for ${emp.full_name} (valid 5 min)`);
  };

  const addEmployee = async () => {
    if (!newEmp.full_name.trim()) return;
    const code = `EMP-${Date.now().toString().slice(-6)}`;
    const { error } = await db.from("hr_employees").insert({ ...newEmp, employee_code: code });
    if (error) { toast.error(error.message); return; }
    toast.success(R ? "تم إضافة الموظف" : "Employee added");
    setNewEmp({ full_name: "", department: "", position: "", phone: "", email: "" });
    setAddingEmp(false);
    load();
  };

  const toggleEmployee = async (id: string, is_active: boolean) => {
    await db.from("hr_employees").update({ is_active: !is_active }).eq("id", id);
    setEmployees(p => p.map(e => e.id === id ? { ...e, is_active: !is_active } : e));
  };

  const manualCheckIn = async (empId: string, type: "check_in" | "check_out") => {
    const now = new Date().toISOString();
    const today = format(new Date(), "yyyy-MM-dd");
    if (type === "check_in") {
      const { error } = await db.from("hr_attendance").upsert({ employee_id: empId, date: today, check_in: now, status: "present", source: "manual" }, { onConflict: "employee_id,date" });
      if (!error) { toast.success(R ? "تم تسجيل الحضور" : "Check-in recorded"); load(); }
    } else {
      const existing = attendance.find(a => a.employee_id === empId);
      if (!existing?.check_in) { toast.error(R ? "لم يتم تسجيل الحضور بعد" : "No check-in recorded"); return; }
      const hours = differenceInHours(new Date(), new Date(existing.check_in));
      await db.from("hr_attendance").update({ check_out: now, hours_worked: hours }).eq("employee_id", empId).eq("date", today);
      toast.success(R ? `تم تسجيل الانصراف (${hours} ساعة)` : `Check-out recorded (${hours}h)`);
      load();
    }
  };

  const statusConfig: Record<string, { color: string; labelAr: string }> = {
    present:  { color: "text-green-400",  labelAr: "حاضر"   },
    absent:   { color: "text-red-400",    labelAr: "غائب"   },
    late:     { color: "text-yellow-400", labelAr: "متأخر"  },
    half_day: { color: "text-orange-400", labelAr: "نصف يوم"},
    leave:    { color: "text-blue-400",   labelAr: "إجازة" },
    holiday:  { color: "text-purple-400", labelAr: "عطلة"  },
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-400" />
              {R ? "الحضور والانصراف — QR & Biometric" : "HR Attendance — QR & Biometric"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "توليد QR ديناميكي + مزامنة البصمات عبر API" : "Dynamic QR generation + biometric sync via API"}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={load} className="gap-2"><RefreshCw className="w-3.5 h-3.5" /></Button>
            <Button size="sm" onClick={() => setAddingEmp(true)} className="gap-2"><Plus className="w-3.5 h-3.5" />{R ? "موظف جديد" : "Add Employee"}</Button>
          </div>
        </div>

        {/* API endpoint notice */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/20 text-xs">
          <Fingerprint className="w-4 h-4 text-violet-400 shrink-0" />
          <div>
            <p className="text-violet-300 font-semibold">{R ? "نقطة نهاية البصمة" : "Biometric Sync Endpoint"}</p>
            <code className="text-[10px] text-muted-foreground">POST /api/v1/hr/biometric-sync · {R ? "يستقبل بيانات أجهزة البصمة الفيزيائية" : "Receives physical fingerprint hardware data"}</code>
          </div>
          <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30 text-[9px]">
            <Wifi className="w-2.5 h-2.5 mr-1" />{R ? "نشط" : "Live"}
          </Badge>
        </div>

        {/* Active QR modal */}
        {activeQR && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <img src={activeQR.qrUrl} alt="QR Code" className="w-28 h-28 rounded-xl border border-primary/20" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">{R ? "QR نشط" : "Active QR"}</span>
                    <Badge className="text-[9px] bg-green-500/20 text-green-400 border-green-500/30">
                      {activeQR.session.action === "check_in" ? (R ? "حضور" : "Check-In") : (R ? "انصراف" : "Check-Out")}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">{activeQR.employee.full_name}</p>
                  <p className="text-xs text-muted-foreground">{activeQR.employee.department}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-orange-400">
                    <Timer className="w-3 h-3" />
                    <span>{R ? "ينتهي في 5 دقائق" : "Expires in 5 minutes"}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a href={activeQR.qrUrl} download="qr-code.svg" className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                      <Download className="w-3 h-3" />{R ? "تحميل" : "Download"}
                    </a>
                    <Button size="sm" variant="outline" onClick={() => setActiveQR(null)} className="h-7 text-[10px]">{R ? "إغلاق" : "Close"}</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add employee form */}
        {addingEmp && (
          <Card className="border-violet-500/30 bg-violet-500/5">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <Input placeholder={R ? "الاسم الكامل *" : "Full Name *"} value={newEmp.full_name} onChange={e => setNewEmp(p => ({ ...p, full_name: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "القسم" : "Department"} value={newEmp.department} onChange={e => setNewEmp(p => ({ ...p, department: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "المنصب الوظيفي" : "Position"} value={newEmp.position} onChange={e => setNewEmp(p => ({ ...p, position: e.target.value }))} className="text-xs h-8" />
                <Input placeholder="Email" value={newEmp.email} onChange={e => setNewEmp(p => ({ ...p, email: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "الهاتف" : "Phone"} value={newEmp.phone} onChange={e => setNewEmp(p => ({ ...p, phone: e.target.value }))} className="text-xs h-8" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addEmployee} className="gap-2"><Plus className="w-3.5 h-3.5" />{R ? "إضافة" : "Add"}</Button>
                <Button size="sm" variant="outline" onClick={() => setAddingEmp(false)}>{R ? "إلغاء" : "Cancel"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="attendance">
          <TabsList className="bg-secondary/30 border border-border">
            <TabsTrigger value="attendance">{R ? "سجل الحضور" : "Attendance"}</TabsTrigger>
            <TabsTrigger value="employees">{R ? "الموظفون" : "Employees"}</TabsTrigger>
            <TabsTrigger value="qr_log">{R ? "سجل QR" : "QR Log"}</TabsTrigger>
          </TabsList>

          {/* Attendance tab */}
          <TabsContent value="attendance" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="text-xs h-8 w-40" />
              <span className="text-xs text-muted-foreground">{R ? `${attendance.length} موظف حضر` : `${attendance.length} employees checked`}</span>
            </div>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left px-4 py-2.5 text-muted-foreground">{R ? "الموظف" : "Employee"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "الحضور" : "Check-In"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "الانصراف" : "Check-Out"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "الساعات" : "Hours"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "الحالة" : "Status"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "المصدر" : "Source"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{R ? "لا توجد سجلات لهذا اليوم" : "No records for this date"}</td></tr>
                    ) : attendance.map(a => {
                      const s = statusConfig[a.status] || statusConfig.present;
                      return (
                        <tr key={a.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-2.5">
                            <p className="font-medium">{a.hr_employees?.full_name || "—"}</p>
                            <p className="text-[9px] text-muted-foreground">{a.hr_employees?.department}</p>
                          </td>
                          <td className="px-4 py-2.5 text-center">{a.check_in ? format(new Date(a.check_in), "HH:mm") : "—"}</td>
                          <td className="px-4 py-2.5 text-center">{a.check_out ? format(new Date(a.check_out), "HH:mm") : "—"}</td>
                          <td className="px-4 py-2.5 text-center font-bold">{a.hours_worked ? `${a.hours_worked}h` : "—"}</td>
                          <td className="px-4 py-2.5 text-center"><Badge className={cn("text-[9px] px-1.5", s.color)}>{R ? s.labelAr : a.status}</Badge></td>
                          <td className="px-4 py-2.5 text-center text-muted-foreground">{a.source}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees tab */}
          <TabsContent value="employees" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map(emp => (
                <Card key={emp.id} className={cn("border", !emp.is_active && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-400">
                          {emp.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{emp.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.department} · {emp.position}</p>
                        </div>
                      </div>
                      <Badge className={cn("text-[9px]", emp.is_active ? "text-green-400 bg-green-500/10" : "text-muted-foreground bg-secondary")}>{emp.employee_code}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" onClick={() => generateQR(emp, "check_in")} className="text-[10px] h-7 gap-1">
                        <QrCode className="w-3 h-3 text-green-400" />{R ? "QR حضور" : "Check-In QR"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => generateQR(emp, "check_out")} className="text-[10px] h-7 gap-1">
                        <QrCode className="w-3 h-3 text-orange-400" />{R ? "QR انصراف" : "Check-Out QR"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => manualCheckIn(emp.id, "check_in")} className="text-[10px] h-7 gap-1">
                        <CheckCircle className="w-3 h-3 text-blue-400" />{R ? "يدوي" : "Manual In"}
                      </Button>
                      <button onClick={() => toggleEmployee(emp.id, emp.is_active)}
                        className={cn("text-[10px] h-7 px-2 rounded-md border transition-colors", emp.is_active ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10")}>
                        {emp.is_active ? (R ? "تعطيل" : "Deactivate") : (R ? "تفعيل" : "Activate")}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {employees.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{R ? "لا يوجد موظفون بعد" : "No employees yet"}</div>}
            </div>
          </TabsContent>

          {/* QR Log tab */}
          <TabsContent value="qr_log" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left px-4 py-2.5 text-muted-foreground">{R ? "الموظف" : "Employee"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "النوع" : "Action"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "الحالة" : "Status"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "ينتهي" : "Expires"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "أُنشئ" : "Created"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qrSessions.map(qr => (
                      <tr key={qr.id} className="border-b border-border/30">
                        <td className="px-4 py-2.5">{qr.hr_employees?.full_name || "—"}</td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge className={qr.action === "check_in" ? "text-green-400 bg-green-500/10" : "text-orange-400 bg-orange-500/10"}>
                            {qr.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {qr.is_used ? <Badge className="text-blue-400 bg-blue-500/10 text-[9px]">{R ? "مستخدم" : "Used"}</Badge>
                          : !qr.is_valid || new Date(qr.expires_at) < new Date() ? <Badge className="text-red-400 bg-red-500/10 text-[9px]">{R ? "منتهي" : "Expired"}</Badge>
                          : <Badge className="text-green-400 bg-green-500/10 text-[9px]">{R ? "نشط" : "Active"}</Badge>}
                        </td>
                        <td className="px-4 py-2.5 text-center text-muted-foreground">{format(new Date(qr.expires_at), "HH:mm")}</td>
                        <td className="px-4 py-2.5 text-center text-muted-foreground">{format(new Date(qr.created_at), "dd MMM HH:mm")}</td>
                      </tr>
                    ))}
                    {qrSessions.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{R ? "لا سجلات QR" : "No QR sessions"}</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
