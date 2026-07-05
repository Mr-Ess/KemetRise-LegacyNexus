import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield, Users, Key, Globe, Plus,
  RefreshCw, Check, X, UserPlus, ArrowLeft,
} from "lucide-react";
import { Button }        from "@/components/ui/button";
import { Input }         from "@/components/ui/input";
import { Label }         from "@/components/ui/label";
import { Card }          from "@/components/ui/card";
import { Badge }         from "@/components/ui/badge";
import { Switch }        from "@/components/ui/switch";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { toast }         from "sonner";
import { supabase }      from "@/integrations/supabase/client";
import { useUserRole }   from "@/context/UserRoleContext";
import { usePagePerms }  from "@/hooks/usePagePerms";
import { ROLE_META, ROLE_MAP, PAGE_PERMS, type AppRole, type RoleMeta } from "@/lib/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow {
  id:           string;
  email:        string;
  full_name:    string;
  phone?:       string;
  role:         string;
  is_verified:  boolean;
  is_suspended: boolean;
  created_at:   string;
}
interface UserRoleRow { user_id: string; role: string; }

// ─── Zod schema ───────────────────────────────────────────────────────────────
const createUserSchema = z.object({
  full_name: z.string().min(2),
  email:     z.string().email(),
  password:  z.string().min(8),
  phone:     z.string().optional(),
  role:      z.string().min(1),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const db = supabase as any;
async function rpc(name: string, params: Record<string, unknown>) {
  const { error } = await db.rpc(name, params);
  if (error) throw new Error(error.message);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Permissions() {
  const navigate         = useNavigate();
  const { i18n }         = useTranslation();
  const R                = i18n.language === "ar";
  const { role: myRole } = useUserRole();
  const { perms: dbPerms, reload: reloadPerms } = usePagePerms();
  const isAdmin = myRole === "superadmin" || myRole === "admin";

  useEffect(() => {
    if (!isAdmin) navigate("/unauthorized", { replace: true });
  }, [isAdmin, navigate]);

  const [tab,       setTab]       = useState("users");
  const [loading,   setLoading]   = useState(false);
  const [users,     setUsers]     = useState<UserRow[]>([]);
  const [addOpen,   setAddOpen]   = useState(false);
  const [selUser,   setSelUser]   = useState<UserRow | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
  const [pageMtx,   setPageMtx]   = useState<Record<string, Set<string>>>({});
  const [savingPP,  setSavingPP]  = useState(false);

  // ─── Custom items states ────────────────────────────────────────────────────
  const [customRoles, setCustomRoles] = useState<RoleMeta[]>(() => {
    try {
      const stored = localStorage.getItem("custom_roles");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return [];
  });

  const [customPages, setCustomPages] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("custom_pages");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return [];
  });

  // Dialog triggers
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [addAssignOpen, setAddAssignOpen] = useState(false);

  // Add Role Form State
  const [newRoleVal, setNewRoleVal] = useState("");
  const [newRoleLabelEn, setNewRoleLabelEn] = useState("");
  const [newRoleLabelAr, setNewRoleLabelAr] = useState("");
  const [newRoleDescEn, setNewRoleDescEn] = useState("");
  const [newRoleDescAr, setNewRoleDescAr] = useState("");

  // Add Page Form State
  const [newPath, setNewPath] = useState("");

  // Add Assignment Form State
  const [assignUser, setAssignUser] = useState("");
  const [assignRoleVal, setAssignRoleVal] = useState("");

  // Combine static and custom roles
  const rolesList = [...ROLE_META, ...customRoles];
  const dynamicRoleMap = {
    ...ROLE_MAP,
    ...Object.fromEntries(customRoles.map(r => [r.value, r])),
  } as Record<string, RoleMeta>;

  const {
    register, handleSubmit, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>({ resolver: zodResolver(createUserSchema) });

  // ── Load users ──────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db.rpc("get_users_with_profiles");
      if (error) throw new Error(error.message);
      setUsers((data as UserRow[]) || []);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin, loadUsers]);

  // ── Build page-perm matrix ──────────────────────────────────────────────────
  useEffect(() => {
    const mtx: Record<string, Set<string>> = {};
    Object.keys(PAGE_PERMS).forEach(p => { mtx[p] = new Set(PAGE_PERMS[p]); });
    customPages.forEach(p => { if (!mtx[p]) mtx[p] = new Set(); });
    dbPerms.forEach(p => { mtx[p.path] = new Set(p.allowed_roles); });
    setPageMtx(mtx);
  }, [dbPerms, customPages]);

  // ── Load user roles ─────────────────────────────────────────────────────────
  const loadUserRoles = useCallback(async (userId: string) => {
    const { data } = await db.from("user_roles").select("user_id,role").eq("user_id", userId);
    setUserRoles((data as UserRoleRow[]) || []);
  }, []);

  useEffect(() => {
    if (selUser) loadUserRoles(selUser.id);
    else setUserRoles([]);
  }, [selUser, loadUserRoles]);

  // ── Create user via Edge Function ───────────────────────────────────────────
  const onCreateUser = async (form: CreateUserForm) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(form),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create user");
      toast.success(R ? "تم إنشاء المستخدم بنجاح" : "User created successfully");
      setAddOpen(false); reset(); loadUsers();
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  // ── Toggle page-perm matrix ─────────────────────────────────────────────────
  const togglePP = (path: string, role: string) => {
    setPageMtx(prev => {
      const next = { ...prev };
      const set  = new Set(next[path] || []);
      if (set.has(role)) set.delete(role); else set.add(role);
      next[path] = set;
      return next;
    });
  };

  // ── Save page permissions ───────────────────────────────────────────────────
  const savePagePerms = async () => {
    setSavingPP(true);
    try {
      for (const [path, roles] of Object.entries(pageMtx)) {
        await rpc("update_page_permission", {
          p_path:          path,
          p_allowed_roles: Array.from(roles),
          p_is_public:     false,
        });
      }
      toast.success(R ? "تم حفظ الصلاحيات" : "Page permissions saved");
      reloadPerms();
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setSavingPP(false); }
  };

  // ── Assign / Revoke ─────────────────────────────────────────────────────────
  const assignRole = async (userId: string, role: string) => {
    try {
      await rpc("assign_user_role", { p_user_id: userId, p_role: role });
      toast.success(R ? `تم إسناد دور ${role}` : `Role "${role}" assigned`);
      if (selUser?.id === userId) loadUserRoles(userId);
      loadUsers();
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  const revokeRole = async (userId: string, role: string) => {
    try {
      await rpc("revoke_user_role", { p_user_id: userId, p_role: role });
      toast.success(R ? `تم إزالة دور ${role}` : `Role "${role}" revoked`);
      if (selUser?.id === userId) loadUserRoles(userId);
      loadUsers();
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  // ── Add Custom Page Path ────────────────────────────────────────────────────
  const handleAddPage = () => {
    const cleanPath = newPath.trim();
    if (!cleanPath.startsWith("/")) {
      toast.error(R ? "يجب أن يبدأ المسار بـ /" : "Path must start with /");
      return;
    }
    if (pagePaths.includes(cleanPath)) {
      toast.error(R ? "المسار موجود بالفعل" : "Path already exists");
      return;
    }
    const next = [...customPages, cleanPath];
    setCustomPages(next);
    localStorage.setItem("custom_pages", JSON.stringify(next));
    setNewPath("");
    setAddPageOpen(false);
    toast.success(R ? "تمت إضافة مسار الصفحة بنجاح" : "Page route added successfully");
  };

  // ── Add Custom Role ─────────────────────────────────────────────────────────
  const handleAddRole = () => {
    const cleanVal = newRoleVal.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleanVal || !newRoleLabelEn || !newRoleLabelAr) {
      toast.error(R ? "الرجاء تعبئة الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    if (rolesList.some(r => r.value === cleanVal)) {
      toast.error(R ? "هذا الدور موجود بالفعل" : "Role already exists");
      return;
    }
    const newRole: RoleMeta = {
      value: cleanVal as AppRole,
      labelEn: newRoleLabelEn.trim(),
      labelAr: newRoleLabelAr.trim(),
      descEn: newRoleDescEn.trim(),
      descAr: newRoleDescAr.trim(),
      color: "bg-teal-500/15 text-teal-400 border border-teal-500/30",
      badge: "bg-teal-500/20 text-teal-300",
    };
    const next = [...customRoles, newRole];
    setCustomRoles(next);
    localStorage.setItem("custom_roles", JSON.stringify(next));

    setNewRoleVal("");
    setNewRoleLabelEn("");
    setNewRoleLabelAr("");
    setNewRoleDescEn("");
    setNewRoleDescAr("");
    setAddRoleOpen(false);
    toast.success(R ? "تم إضافة الدور بنجاح" : "Role added successfully");
  };

  // ── Add Custom Assignment ───────────────────────────────────────────────────
  const handleAddAssignment = () => {
    if (!assignUser || !assignRoleVal) {
      toast.error(R ? "الرجاء اختيار المستخدم والدور" : "Please select both user and role");
      return;
    }
    assignRole(assignUser, assignRoleVal);
    setAssignUser("");
    setAssignRoleVal("");
    setAddAssignOpen(false);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const roleCounts: Record<string, number> = {};
  users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
  const pagePaths = Object.keys(pageMtx);
  const colRoles  = rolesList.map(r => r.value);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-background ${R ? "rtl" : "ltr"}`}>
      {/* ── Header ── */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">
              {R ? "الصلاحيات وإدارة المستخدمين" : "Permissions & User Management"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {R ? "إدارة الأدوار والمستخدمين وصلاحيات الصفحات" : "Manage roles, users, and page access control"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="users"  className="gap-1.5 text-xs"><Users    className="w-3.5 h-3.5"/>{R ? "المستخدمون" : "Users"}</TabsTrigger>
            <TabsTrigger value="roles"  className="gap-1.5 text-xs"><Key      className="w-3.5 h-3.5"/>{R ? "الأدوار" : "Roles"}</TabsTrigger>
            <TabsTrigger value="assign" className="gap-1.5 text-xs"><UserPlus className="w-3.5 h-3.5"/>{R ? "الإسناد" : "Assignments"}</TabsTrigger>
            <TabsTrigger value="pages"  className="gap-1.5 text-xs"><Globe    className="w-3.5 h-3.5"/>{R ? "صلاحيات الصفحات" : "Page Perms"}</TabsTrigger>
          </TabsList>

          {/* ── USERS ── */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{users.length} {R ? "مستخدم" : "users"}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadUsers} className="gap-1.5 text-xs">
                  <RefreshCw className="w-3.5 h-3.5"/>{R ? "تحديث" : "Refresh"}
                </Button>
                {isAdmin && (
                  <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5"/>{R ? "إضافة مستخدم" : "Add User"}
                  </Button>
                )}
              </div>
            </div>
            <Card className="bg-card border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs text-muted-foreground">{R ? "الاسم / البريد" : "Name / Email"}</TableHead>
                      <TableHead className="text-xs text-muted-foreground">{R ? "الدور" : "Role"}</TableHead>
                      <TableHead className="text-xs text-muted-foreground">{R ? "الهاتف" : "Phone"}</TableHead>
                      <TableHead className="text-xs text-muted-foreground">{R ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-xs text-muted-foreground">{R ? "تاريخ الإنشاء" : "Created"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <TableRow key={i} className="border-border">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse"/></TableCell>
                            ))}
                          </TableRow>
                        ))
                      : users.map(u => {
                          const meta = dynamicRoleMap[u.role];
                          return (
                            <TableRow key={u.id} className="border-border hover:bg-secondary/30">
                              <TableCell>
                                <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${meta?.color || "bg-muted text-muted-foreground"}`}>
                                  {R ? (meta?.labelAr || u.role) : (meta?.labelEn || u.role)}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{u.phone || "—"}</TableCell>
                              <TableCell>
                                {u.is_suspended
                                  ? <Badge variant="destructive" className="text-[10px]">{R ? "موقوف" : "Suspended"}</Badge>
                                  : u.is_verified
                                    ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">{R ? "موثق" : "Verified"}</Badge>
                                    : <Badge variant="outline" className="text-[10px]">{R ? "بانتظار" : "Pending"}</Badge>
                                }
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(u.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    }
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* ── ROLES ── */}
          <TabsContent value="roles" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{R ? "الأدوار المتاحة في المنصة" : "Available platform roles"}</p>
              {isAdmin && (
                <Button size="sm" onClick={() => setAddRoleOpen(true)} className="gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5"/>{R ? "إضافة دور جديد" : "Add New Role"}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rolesList.map(meta => (
                <Card key={meta.value} className="bg-card border-border p-4 space-y-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                      {R ? meta.labelAr : meta.labelEn}
                    </span>
                    <span className="text-lg font-display font-bold text-foreground">{roleCounts[meta.value] ?? 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{R ? meta.descAr : meta.descEn}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/60">{meta.value}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── ASSIGNMENTS ── */}
          <TabsContent value="assign" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{R ? "اختر مستخدماً لإدارة أدواره أو أضف إسناداً جديداً" : "Select a user or create a new assignment"}</p>
              {isAdmin && (
                <Button size="sm" onClick={() => setAddAssignOpen(true)} className="gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5"/>{R ? "إضافة إسناد جديد" : "Add New Assignment"}
                </Button>
              )}
            </div>
            <Card className="bg-card border-border p-4 space-y-3">
              <Label className="text-xs text-muted-foreground">{R ? "اختر المستخدم" : "Select User"}</Label>
              <Select value={selUser?.id ?? ""} onValueChange={id => setSelUser(users.find(u => u.id === id) ?? null)}>
                <SelectTrigger className="bg-secondary/50 border-border text-sm">
                  <SelectValue placeholder={R ? "اختر..." : "Select user..."} />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {selUser && (
              <Card className="bg-card border-border p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{selUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{R ? "الأدوار الحالية" : "Current Roles"}</p>
                  <div className="flex flex-wrap gap-2">
                    {userRoles.length === 0 && (
                      <span className="text-xs text-muted-foreground">{R ? "لا توجد أدوار" : "No roles"}</span>
                    )}
                    {userRoles.map(ur => {
                      const meta = dynamicRoleMap[ur.role];
                      return (
                        <span key={ur.role} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${meta?.color || "bg-muted text-muted-foreground"}`}>
                          {R ? (meta?.labelAr || ur.role) : (meta?.labelEn || ur.role)}
                          {ur.role !== "superadmin" && (
                            <button onClick={() => revokeRole(selUser.id, ur.role)} className="opacity-60 hover:opacity-100">
                              <X className="w-3 h-3"/>
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{R ? "إسناد دور جديد" : "Assign New Role"}</p>
                  <div className="flex flex-wrap gap-2">
                    {rolesList.filter(m => m.value !== "superadmin").map(meta => {
                      const hasRole = userRoles.some(ur => ur.role === meta.value);
                      return (
                        <button
                          key={meta.value}
                          onClick={() => hasRole ? revokeRole(selUser.id, meta.value) : assignRole(selUser.id, meta.value)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${hasRole ? meta.color : "bg-transparent text-muted-foreground border-border hover:border-primary/50"}`}
                        >
                          {hasRole ? <Check className="w-3 h-3"/> : <Plus className="w-3 h-3"/>}
                          {R ? meta.labelAr : meta.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* ── PAGE PERMISSIONS ── */}
          <TabsContent value="pages" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {R ? "حدد الأدوار المسموح لها بالوصول لكل صفحة" : "Toggle role access per page"}
              </p>
              <div className="flex gap-2">
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => setAddPageOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5"/>
                    {R ? "إضافة مسار صفحة" : "Add Page Route"}
                  </Button>
                )}
                <Button size="sm" onClick={savePagePerms} disabled={savingPP} className="gap-1.5 text-xs">
                  {savingPP ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Check className="w-3.5 h-3.5"/>}
                  {R ? "حفظ التغييرات" : "Save Changes"}
                </Button>
              </div>
            </div>
            <Card className="bg-card border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="sticky left-0 bg-card px-4 py-3 text-left text-muted-foreground font-medium w-48 min-w-[192px]">
                        {R ? "المسار" : "Route"}
                      </th>
                      {colRoles.map(r => {
                        const meta = dynamicRoleMap[r];
                        return (
                          <th key={r} className="px-2 py-3 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${meta?.badge || "bg-muted text-muted-foreground"}`}>
                              {R ? meta?.labelAr : meta?.labelEn}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {pagePaths.map((path, idx) => {
                      const rowRoles = pageMtx[path] ?? new Set();
                      return (
                        <tr key={path} className={`border-b border-border/50 hover:bg-secondary/20 ${idx % 2 === 0 ? "" : "bg-muted/20"}`}>
                          <td className="sticky left-0 bg-inherit px-4 py-2 font-mono text-muted-foreground text-[11px]">{path}</td>
                          {colRoles.map(r => {
                            const checked = rowRoles.has(r);
                            return (
                              <td key={r} className="px-2 py-2 text-center">
                                <Switch
                                  checked={checked}
                                  onCheckedChange={() => togglePP(path, r)}
                                  disabled={r === "superadmin"}
                                  className="scale-75"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Add User Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary"/>
              {R ? "إضافة مستخدم جديد" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "الاسم الكامل" : "Full Name"} *</Label>
              <Input {...register("full_name")} placeholder={R ? "محمد أحمد" : "John Doe"} className="bg-secondary/50 border-border text-sm"/>
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "البريد الإلكتروني" : "Email"} *</Label>
              <Input {...register("email")} type="email" placeholder="user@example.com" className="bg-secondary/50 border-border text-sm" dir="ltr"/>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "كلمة المرور" : "Password"} *</Label>
              <Input {...register("password")} type="password" placeholder="••••••••" className="bg-secondary/50 border-border text-sm" dir="ltr"/>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "رقم الهاتف" : "Phone"}</Label>
              <Input {...register("phone")} placeholder="+966 5xx xxx xxxx" className="bg-secondary/50 border-border text-sm" dir="ltr"/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "الدور" : "Role"} *</Label>
              <Select onValueChange={v => setValue("role", v)} defaultValue="user">
                <SelectTrigger className="bg-secondary/50 border-border text-sm">
                  <SelectValue placeholder={R ? "اختر الدور" : "Select role"}/>
                </SelectTrigger>
                <SelectContent>
                  {rolesList.filter(m => m.value !== "superadmin").map(meta => (
                    <SelectItem key={meta.value} value={meta.value}>
                      {R ? meta.labelAr : meta.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); reset(); }} className="text-xs">
                {R ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="text-xs gap-1.5">
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <UserPlus className="w-3.5 h-3.5"/>}
                {R ? "إنشاء المستخدم" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Page Route Dialog ── */}
      <Dialog open={addPageOpen} onOpenChange={setAddPageOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary"/>
              {R ? "إضافة مسار صفحة جديد" : "Add New Page Route"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "المسار" : "Route"} *</Label>
              <Input
                value={newPath}
                onChange={e => setNewPath(e.target.value)}
                placeholder="/dashboard/reports"
                className="bg-secondary/50 border-border text-sm"
                dir="ltr"
              />
              <p className="text-[10px] text-muted-foreground">{R ? "يجب أن يبدأ بـ /" : "Must start with /"}</p>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddPageOpen(false)} className="text-xs">
              {R ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddPage} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5"/>
              {R ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Role Dialog ── */}
      <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-primary"/>
              {R ? "إضافة دور جديد" : "Add New Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "معرف الدور (قيمة برمجية)" : "Role Key (value)"} *</Label>
              <Input
                value={newRoleVal}
                onChange={e => setNewRoleVal(e.target.value)}
                placeholder="supervisor"
                className="bg-secondary/50 border-border text-sm"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{R ? "الاسم (إنجليزي)" : "Label (English)"} *</Label>
                <Input
                  value={newRoleLabelEn}
                  onChange={e => setNewRoleLabelEn(e.target.value)}
                  placeholder="Supervisor"
                  className="bg-secondary/50 border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{R ? "الاسم (عربي)" : "Label (Arabic)"} *</Label>
                <Input
                  value={newRoleLabelAr}
                  onChange={e => setNewRoleLabelAr(e.target.value)}
                  placeholder="مشرف"
                  className="bg-secondary/50 border-border text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
              <Input
                value={newRoleDescEn}
                onChange={e => setNewRoleDescEn(e.target.value)}
                placeholder="Manage operations and reviews"
                className="bg-secondary/50 border-border text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
              <Input
                value={newRoleDescAr}
                onChange={e => setNewRoleDescAr(e.target.value)}
                placeholder="إدارة العمليات والمراجعات"
                className="bg-secondary/50 border-border text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddRoleOpen(false)} className="text-xs">
              {R ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddRole} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5"/>
              {R ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Assignment Dialog ── */}
      <Dialog open={addAssignOpen} onOpenChange={setAddAssignOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary"/>
              {R ? "إضافة إسناد جديد" : "Add New Assignment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "المستخدم" : "User"} *</Label>
              <Select value={assignUser} onValueChange={setAssignUser}>
                <SelectTrigger className="bg-secondary/50 border-border text-sm">
                  <SelectValue placeholder={R ? "اختر المستخدم" : "Select user..."} />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{R ? "الدور" : "Role"} *</Label>
              <Select value={assignRoleVal} onValueChange={setAssignRoleVal}>
                <SelectTrigger className="bg-secondary/50 border-border text-sm">
                  <SelectValue placeholder={R ? "اختر الدور" : "Select role..."} />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.filter(m => m.value !== "superadmin").map(meta => (
                    <SelectItem key={meta.value} value={meta.value}>
                      {R ? meta.labelAr : meta.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddAssignOpen(false)} className="text-xs">
              {R ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddAssignment} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5"/>
              {R ? "إسناد الدور" : "Assign Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
