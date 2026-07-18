import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PartnerLayout from "@/layouts/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Edit, Trash2, RefreshCcw, Search, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyMember = { full_name: "", email: "", role: "staff" };
const ROLES = ["staff", "manager", "partner", "admin"];

export default function PartnerStaff() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyMember);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db.from("user_profiles").select("*").eq("partner_user_id", user.id).order("created_at", { ascending: false });
    setMembers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = members.filter(m =>
    search === "" ||
    (m.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditId(null); setForm(emptyMember); setModal("add"); };
  const openEdit = (m: any) => {
    setEditId(m.id);
    setForm({ full_name: m.full_name || "", email: m.email || "", role: m.role || "staff" });
    setModal("edit");
  };

  const save = async () => {
    if (!form.full_name.trim() || !user) return toast.error(R ? "الاسم مطلوب" : "Name required");
    if (editId) {
      const { error } = await db.from("user_profiles").update({ full_name: form.full_name, role: form.role, updated_at: new Date().toISOString() }).eq("id", editId);
      if (error) return toast.error(error.message);
      toast.success(R ? "تم التحديث" : "Updated");
    } else {
      const { error } = await db.from("user_profiles").insert({ ...form, partner_user_id: user.id });
      if (error) return toast.error(error.message);
      toast.success(R ? "تمت الإضافة" : "Added");
    }
    setModal(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(R ? "إزالة العضو؟" : "Remove member?")) return;
    const { error } = await db.from("user_profiles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الحذف" : "Removed");
    load();
  };

  const ROLE_STYLE: Record<string, string> = {
    admin: "text-red-400 bg-red-500/10 border-red-500/30",
    manager: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    partner: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    staff: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  };

  const initials = (name: string) => name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

  return (
    <PartnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              {R ? "موظفو بيئة العمل" : "Workspace Staff"}
            </h1>
            <p className="text-sm text-muted-foreground">{members.length} {R ? "عضو" : "members"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={openAdd} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" />{R ? "إضافة عضو" : "Add Member"}
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={R ? "بحث بالاسم أو البريد..." : "Search by name or email..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا يوجد موظفون" : "No staff members yet"}</p>
            <Button size="sm" onClick={openAdd} className="mt-4 bg-indigo-600 hover:bg-indigo-700">{R ? "أضف عضواً" : "Add First Member"}</Button>
          </div>
        ) : (
          <Card className="border-border/50">
            <div className="divide-y divide-border/50">
              {filtered.map(m => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                      {initials(m.full_name || m.email || "?")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{m.full_name || R ? "مجهول" : "Unknown"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs", ROLE_STYLE[m.role] || ROLE_STYLE.staff)}>{m.role}</Badge>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(m)}><Edit className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(m.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal === "edit" ? (R ? "تعديل العضو" : "Edit Member") : (R ? "إضافة عضو" : "Add Member")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>{R ? "الاسم الكامل *" : "Full Name *"}</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            {!editId && <div><Label>{R ? "البريد الإلكتروني" : "Email"}</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>}
            <div>
              <Label>{R ? "الدور" : "Role"}</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700">{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PartnerLayout>
  );
}
