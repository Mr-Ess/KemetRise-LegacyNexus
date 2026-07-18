import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/context/UserRoleContext";
import StaffLayout from "@/layouts/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Phone, Briefcase, Edit, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StaffProfile() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const { profile, refresh } = useRole();
  const db = supabase as any;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [empData, setEmpData] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || "", phone: (profile as any).phone || "" });
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    db.from("hr_employees").select("*").eq("user_id", user.id).single()
      .then(({ data }: any) => setEmpData(data));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await db.from("user_profiles").update({ full_name: form.full_name }).eq("id", user.id);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(R ? "تم الحفظ" : "Saved");
    await refresh();
    setEditing(false);
    setSaving(false);
  };

  const fields = [
    { label: R ? "الاسم الكامل" : "Full Name", value: profile?.full_name, icon: User, color: "text-violet-400" },
    { label: R ? "البريد الإلكتروني" : "Email", value: user?.email, icon: Mail, color: "text-blue-400" },
    { label: R ? "الدور" : "Role", value: profile?.role, icon: Briefcase, color: "text-emerald-400" },
  ];

  const empFields = empData ? [
    { label: R ? "المسمى الوظيفي" : "Job Title", value: empData.job_title },
    { label: R ? "القسم" : "Department", value: empData.department },
    { label: R ? "نوع التوظيف" : "Employment", value: empData.employment_type },
    { label: R ? "تاريخ التعيين" : "Hire Date", value: empData.hire_date ? new Date(empData.hire_date).toLocaleDateString(R ? "ar-EG" : "en-US") : "—" },
    { label: R ? "الهاتف" : "Phone", value: empData.phone },
    { label: R ? "الحالة" : "Status", value: empData.status },
  ] : [];

  return (
    <StaffLayout>
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-black flex items-center gap-2">
            <User className="w-6 h-6 text-violet-400" />
            {R ? "ملفي الشخصي" : "My Profile"}
          </h1>
          {!editing
            ? <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2"><Edit className="w-4 h-4" />{R ? "تعديل" : "Edit"}</Button>
            : <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
                <Button size="sm" onClick={save} disabled={saving} className="bg-violet-600 hover:bg-violet-700 gap-2"><Save className="w-4 h-4" />{R ? "حفظ" : "Save"}</Button>
              </div>
          }
        </div>

        {/* Avatar + name */}
        <Card className="border-border/50">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-violet-500/20 border-2 border-violet-500/40 flex items-center justify-center text-2xl font-bold text-violet-400 shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">{R ? "الاسم الكامل" : "Full Name"}</Label>
                    <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="h-8 text-sm" />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold">{profile?.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge className="mt-1 text-xs bg-violet-500/20 text-violet-400 border-violet-500/40">{profile?.role?.toUpperCase()}</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "معلومات الحساب" : "Account Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map(f => (
              <div key={f.label} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                <f.icon className={cn("w-4 h-4 shrink-0", f.color)} />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium">{f.value || "—"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Employee record */}
        {empData && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{R ? "بيانات الموظف" : "Employee Record"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {empFields.map(f => (
                  <div key={f.label}>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-medium capitalize">{f.value || "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
}
