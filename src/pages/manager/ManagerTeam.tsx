import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import ManagerLayout from "@/layouts/ManagerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Search, Plus, Edit, Trash2, RefreshCcw, Briefcase, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Employee = {
  id: string;
  full_name: string;
  job_title?: string;
  department?: string;
  email?: string;
  phone?: string;
  employment_type?: string;
  status?: string;
  hire_date?: string;
  salary?: number;
};

const DEPTS = ["Engineering", "Sales", "Marketing", "Support", "HR", "Finance", "Operations", "Management"];
const empty: Omit<Employee, "id"> = {
  full_name: "", job_title: "", department: "", email: "", phone: "",
  employment_type: "full-time", status: "active", hire_date: "", salary: undefined,
};

const STATUS_COLOR: Record<string, string> = {
  active:     "text-green-400 border-green-400/30 bg-green-400/10",
  inactive:   "text-red-400 border-red-400/30 bg-red-400/10",
  "on-leave": "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
};

export default function ManagerTeam() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Employee, "id">>(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await db.from("hr_employees").select("*").order("full_name");
    setEmployees(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter(e =>
    (deptFilter === "all" || e.department === deptFilter) &&
    (search === "" ||
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.job_title ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditId(null); setForm(empty); setModal("add"); };
  const openEdit = (e: Employee) => {
    setEditId(e.id);
    setForm({ full_name: e.full_name, job_title: e.job_title ?? "", department: e.department ?? "",
      email: e.email ?? "", phone: e.phone ?? "", employment_type: e.employment_type ?? "full-time",
      status: e.status ?? "active", hire_date: e.hire_date ?? "", salary: e.salary });
    setModal("edit");
  };

  const save = async () => {
    if (!form.full_name.trim()) return toast.error(R ? "الاسم مطلوب" : "Name required");
    const payload = { ...form, salary: form.salary || null, hire_date: form.hire_date || null };
    if (editId) {
      const { error } = await db.from("hr_employees").update(payload).eq("id", editId);
      if (error) return toast.error(error.message);
      toast.success(R ? "تم التحديث" : "Updated");
    } else {
      const { error } = await db.from("hr_employees").insert(payload);
      if (error) return toast.error(error.message);
      toast.success(R ? "تمت الإضافة" : "Added");
    }
    setModal(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm(R ? "حذف الموظف؟" : "Delete employee?")) return;
    const { error } = await db.from("hr_employees").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الحذف" : "Deleted");
    load();
  };

  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const activeCount = employees.filter(e => e.status === "active").length;

  return (
    <ManagerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              {R ? "إدارة الفريق" : "Team Management"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {employees.length} {R ? "موظف" : "employees"} — {activeCount} {R ? "نشط" : "active"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={openAdd} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />{R ? "موظف جديد" : "Add Employee"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
          {[
            { label: R ? "إجمالي" : "Total", value: employees.length, color: "text-blue-400" },
            { label: R ? "نشط" : "Active", value: activeCount, color: "text-green-400" },
            { label: R ? "في إجازة" : "On Leave", value: employees.filter(e => e.status === "on-leave").length, color: "text-yellow-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div>
                  <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={R ? "بحث..." : "Search employees..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{R ? "كل الأقسام" : "All Departments"}</SelectItem>
              {depts.map(d => <SelectItem key={d!} value={d!}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Employee Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا يوجد موظفون" : "No employees found"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(e => (
              <Card key={e.id} className="border-border/50 hover:border-emerald-500/30 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                        {e.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{e.full_name}</p>
                        <p className="text-xs text-muted-foreground">{e.job_title || "—"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", STATUS_COLOR[e.status ?? "active"] ?? "")}>
                      {e.status ?? "active"}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {e.department && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3 h-3" />
                        <span>{e.department}</span>
                      </div>
                    )}
                    {e.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{e.email}</span>
                      </div>
                    )}
                    {e.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        <span>{e.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">{e.employment_type}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(e)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(e.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal === "edit" ? (R ? "تعديل الموظف" : "Edit Employee") : (R ? "إضافة موظف" : "Add Employee")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>{R ? "الاسم الكامل *" : "Full Name *"}</Label>
                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label>{R ? "المسمى الوظيفي" : "Job Title"}</Label>
                <Input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
              </div>
              <div>
                <Label>{R ? "القسم" : "Department"}</Label>
                <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue placeholder={R ? "اختر" : "Select"} /></SelectTrigger>
                  <SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{R ? "البريد الإلكتروني" : "Email"}</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>{R ? "الهاتف" : "Phone"}</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>{R ? "نوع التوظيف" : "Employment Type"}</Label>
                <Select value={form.employment_type} onValueChange={v => setForm({ ...form, employment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{R ? "الحالة" : "Status"}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{R ? "نشط" : "Active"}</SelectItem>
                    <SelectItem value="inactive">{R ? "غير نشط" : "Inactive"}</SelectItem>
                    <SelectItem value="on-leave">{R ? "في إجازة" : "On Leave"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{R ? "تاريخ التعيين" : "Hire Date"}</Label>
                <Input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} />
              </div>
              <div>
                <Label>{R ? "الراتب" : "Salary"}</Label>
                <Input type="number" value={form.salary ?? ""} onChange={e => setForm({ ...form, salary: e.target.value ? +e.target.value : undefined })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  );
}
