import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, Search, Shield, UserCheck, UserX, Key,
  MoreHorizontal, RefreshCcw, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserProfile = {
  id: string;
  username?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  is_suspended?: boolean;
  created_at?: string;
};

const ROLES = ["user", "partner", "agent", "vendor", "provider", "marketing", "admin", "superadmin"];

const ROLE_COLORS: Record<string, string> = {
  superadmin: "text-red-400 border-red-400/30 bg-red-400/10",
  admin: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  partner: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  agent: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  vendor: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  provider: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  marketing: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  user: "text-slate-400 border-slate-400/30 bg-slate-400/10",
};

export default function AdminUsers() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roleModal, setRoleModal] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await db.from("user_profiles").select("*").order("created_at", { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    (roleFilter === "all" || u.role === roleFilter) &&
    (search === "" ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.username ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const changeRole = async () => {
    if (!roleModal || !newRole) return;
    const { error } = await db.from("user_profiles").update({ role: newRole }).eq("id", roleModal.id);
    if (error) { toast.error(error.message); return; }
    toast.success(R ? "تم تغيير الدور" : "Role updated");
    setRoleModal(null);
    load();
  };

  const toggleSuspend = async (u: UserProfile) => {
    const next = !u.is_suspended;
    const { error } = await db.from("user_profiles").update({ is_suspended: next }).eq("id", u.id);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? (R ? "تم تعليق المستخدم" : "User suspended") : (R ? "تم رفع التعليق" : "User unsuspended"));
    load();
  };

  const fmt = (s?: string) => s ? new Date(s).toLocaleDateString(R ? "ar-EG" : "en-US") : "—";
  const avatar = (u: UserProfile) => u.full_name?.charAt(0).toUpperCase() ?? u.username?.charAt(0).toUpperCase() ?? "?";

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black">{R ? "إدارة المستخدمين" : "User Management"}</h1>
            <p className="text-sm text-muted-foreground">{users.length} {R ? "مستخدم إجمالاً" : "total users"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["admin", "partner", "vendor", "user"].map(r => {
            const count = users.filter(u => u.role === r).length;
            return (
              <Card key={r} className="border-border/40 cursor-pointer hover:border-primary/20 transition-all" onClick={() => setRoleFilter(roleFilter === r ? "all" : r)}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground capitalize mb-1">{r}</p>
                  <p className="text-2xl font-display font-black text-primary">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={R ? "ابحث بالاسم أو البريد..." : "Search by name or email..."} className="pl-9 text-xs h-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setRoleFilter("all")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", roleFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground border border-border/40")}>
              {R ? "الكل" : "All"}
            </button>
            {ROLES.map(r => (
              <button key={r} onClick={() => setRoleFilter(roleFilter === r ? "all" : r)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all", roleFilter === r ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground border border-border/40")}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <Card className="border-border/40">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">{R ? "لا توجد نتائج" : "No results found"}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground">
                      <th className="text-left px-4 py-3 font-medium">{R ? "المستخدم" : "User"}</th>
                      <th className="text-left px-4 py-3 font-medium">{R ? "الدور" : "Role"}</th>
                      <th className="text-left px-4 py-3 font-medium">{R ? "تاريخ الإنشاء" : "Created"}</th>
                      <th className="text-left px-4 py-3 font-medium">{R ? "الحالة" : "Status"}</th>
                      <th className="text-left px-4 py-3 font-medium">{R ? "إجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-[11px]">
                              {avatar(u)}
                            </div>
                            <div>
                              <p className="font-semibold">{u.full_name || u.username || "—"}</p>
                              {u.email && <p className="text-muted-foreground text-[10px]">{u.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-[9px]", ROLE_COLORS[u.role ?? "user"] ?? ROLE_COLORS.user)}>
                            {u.role ?? "user"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-[9px]", u.is_suspended ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-green-500/10 text-green-400 border-green-500/30")}>
                            {u.is_suspended ? (R ? "معلق" : "Suspended") : (R ? "نشط" : "Active")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => { setRoleModal(u); setNewRole(u.role ?? "user"); }} className="h-6 px-2 text-[10px] gap-1">
                              <Key className="w-2.5 h-2.5" />{R ? "دور" : "Role"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggleSuspend(u)} className={cn("h-6 px-2 text-[10px]", u.is_suspended ? "text-green-400" : "text-red-400")}>
                              {u.is_suspended ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Change Modal */}
      <Dialog open={!!roleModal} onOpenChange={() => setRoleModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{R ? "تغيير دور المستخدم" : "Change User Role"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-3">{R ? `المستخدم: ${roleModal?.full_name || roleModal?.username}` : `User: ${roleModal?.full_name || roleModal?.username}`}</p>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full text-xs h-9 rounded-md border border-border bg-background px-2">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRoleModal(null)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button size="sm" onClick={changeRole} className="gold-glow">{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
