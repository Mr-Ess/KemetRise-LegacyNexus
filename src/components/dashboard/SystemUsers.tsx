import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Users, Search, RefreshCw, Shield, ArrowRight,
  UserCheck, Building2, ShoppingBag, TrendingUp,
  MoreHorizontal, Check, X, Pencil, ExternalLink,
  ChevronDown, Filter, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

/* ─── Types ───────────────────────────────────────────────────── */
interface SystemUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  extra_portals: string[];
  is_verified: boolean;
  is_suspended: boolean;
  onboarding_done: boolean;
  created_at: string;
  last_sign_in?: string;
}

/* ─── Config ──────────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { label: string; color: string; badge: string; icon: string; portal: string }> = {
  superadmin: { label: "Super Admin", color: "text-red-400",     badge: "bg-red-500/15 text-red-400 border-red-500/30",         icon: "🛡️", portal: "/admin"     },
  admin:      { label: "Admin",       color: "text-primary",     badge: "bg-primary/15 text-primary border-primary/30",         icon: "⚙️", portal: "/admin"     },
  partner:    { label: "Partner",     color: "text-indigo-400",  badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",icon: "🤝", portal: "/partner"   },
  agent:      { label: "Agent",       color: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",icon:"🧑‍💼",portal: "/agent"   },
  vendor:     { label: "Vendor",      color: "text-orange-400",  badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: "🏪", portal: "/vendor"    },
  provider:   { label: "Provider",    color: "text-yellow-400",  badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: "🔧", portal: "/provider"  },
  marketing:  { label: "Marketing",   color: "text-pink-400",    badge: "bg-pink-500/15 text-pink-400 border-pink-500/30",       icon: "📣", portal: "/marketing" },
  user:       { label: "User",        color: "text-blue-400",    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",       icon: "👤", portal: "/portal"    },
};

const ALL_ROLES = Object.keys(ROLE_CFG);

export default function SystemUsers() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const db = supabase as any;

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from("user_profiles")
        .select("id, full_name, role, extra_portals, is_verified, is_suspended, onboarding_done, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Try to get emails from auth admin view
      let emailMap: Record<string, string> = {};
      try {
        const { data: authUsers } = await db.rpc("get_users_with_email");
        if (Array.isArray(authUsers)) {
          authUsers.forEach((u: any) => { emailMap[u.id] = u.email || ""; });
        }
      } catch {
        // RPC not available — use id prefix as fallback
      }

      setUsers((data || []).map((p: any) => ({
        id: p.id,
        email: emailMap[p.id] || (p.id.slice(0, 8) + "…"),
        full_name: p.full_name,
        role: p.role || "user",
        extra_portals: Array.isArray(p.extra_portals) ? p.extra_portals : [],
        is_verified: p.is_verified ?? false,
        is_suspended: p.is_suspended ?? false,
        onboarding_done: p.onboarding_done ?? false,
        created_at: p.created_at,
      })));
    } catch (e: any) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── Stats ────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total:      users.length,
    admins:     users.filter((u) => ["admin","superadmin"].includes(u.role)).length,
    partners:   users.filter((u) => u.role === "partner").length,
    vendors:    users.filter((u) => ["vendor","provider"].includes(u.role)).length,
    agents:     users.filter((u) => u.role === "agent").length,
    marketing:  users.filter((u) => u.role === "marketing").length,
    regular:    users.filter((u) => u.role === "user").length,
    suspended:  users.filter((u) => u.is_suspended).length,
    verified:   users.filter((u) => u.is_verified).length,
  }), [users]);

  /* ── Filter ───────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchQ = !q || u.email.toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all"
        || (statusFilter === "active" && !u.is_suspended)
        || (statusFilter === "suspended" && u.is_suspended)
        || (statusFilter === "verified" && u.is_verified)
        || (statusFilter === "pending" && !u.onboarding_done);
      return matchQ && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  /* ── Save role change ─────────────────────────────────────── */
  const saveRole = async (userId: string, newRole: string) => {
    setSaving(true);
    try {
      const { error } = await db.from("user_profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setEditingId(null);
      toast.success("Role updated");
    } catch (e: any) {
      toast.error("Failed: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspend = async (u: SystemUser) => {
    const { error } = await db.from("user_profiles").update({ is_suspended: !u.is_suspended }).eq("id", u.id);
    if (error) { toast.error(error.message); return; }
    setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, is_suspended: !u.is_suspended } : p));
    toast.success(u.is_suspended ? "User unsuspended" : "User suspended");
  };

  const toggleVerify = async (u: SystemUser) => {
    const { error } = await db.from("user_profiles").update({ is_verified: !u.is_verified }).eq("id", u.id);
    if (error) { toast.error(error.message); return; }
    setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, is_verified: !u.is_verified } : p));
    toast.success(u.is_verified ? "Verification removed" : "User verified");
  };

  return (
    <Card className="p-5 border border-border/50 bg-secondary/5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">System Users</h2>
            <p className="text-[11px] text-muted-foreground">All registered accounts — roles & portal permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 text-xs w-48 bg-secondary/20" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 text-xs w-32 gap-1"><Filter className="w-3 h-3 shrink-0" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_CFG[r].icon} {ROLE_CFG[r].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending Onboard</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/admin/users")}>
            <ExternalLink className="w-3.5 h-3.5" />Full Admin
          </Button>
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-5">
        {[
          { label: "Total",     value: stats.total,     color: "text-blue-400"    },
          { label: "Admins",    value: stats.admins,    color: "text-red-400"     },
          { label: "Partners",  value: stats.partners,  color: "text-indigo-400"  },
          { label: "Vendors",   value: stats.vendors,   color: "text-orange-400"  },
          { label: "Agents",    value: stats.agents,    color: "text-emerald-400" },
          { label: "Marketing", value: stats.marketing, color: "text-pink-400"    },
          { label: "Users",     value: stats.regular,   color: "text-blue-300"    },
          { label: "Verified",  value: stats.verified,  color: "text-green-400"   },
          { label: "Suspended", value: stats.suspended, color: "text-red-400"     },
        ].map((s) => (
          <div key={s.label} className="p-2 rounded-xl border border-border/40 bg-secondary/10 text-center">
            <p className={`text-lg font-display font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── User Table ────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-secondary/20 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{search || roleFilter !== "all" ? "No users match your filters." : "No users registered yet."}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            <span className="col-span-4">User</span>
            <span className="col-span-2">Role</span>
            <span className="col-span-2">Portal Access</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          {filtered.map((u) => {
            const cfg = ROLE_CFG[u.role] || ROLE_CFG.user;
            const isMe = u.id === me?.id;
            const editing = editingId === u.id;

            return (
              <div key={u.id}
                className={cn("rounded-xl border transition-all hover:border-border/70",
                  u.is_suspended ? "border-red-500/20 bg-red-500/5" : isMe ? "border-primary/20 bg-primary/5" : "border-border/30 bg-secondary/5")}>

                <div className="grid grid-cols-12 gap-2 items-center px-3 py-2.5">
                  {/* User info */}
                  <div className="col-span-12 sm:col-span-4 flex items-center gap-2.5 min-w-0">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0", cfg.badge.split(" ")[0])}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold truncate">{u.full_name || "—"}</span>
                        {isMe && <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/30 text-primary">you</Badge>}
                        {u.is_verified && <Badge variant="outline" className="text-[8px] px-1 py-0 border-green-500/30 text-green-400">✓</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-6 sm:col-span-2">
                    {editing ? (
                      <Select value={editRole} onValueChange={setEditRole}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_CFG[r].icon} {ROLE_CFG[r].label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 capitalize cursor-pointer hover:opacity-80", cfg.badge)}
                        onClick={() => { setEditingId(u.id); setEditRole(u.role); }}>
                        {cfg.icon} {cfg.label}
                      </Badge>
                    )}
                  </div>

                  {/* Portal access */}
                  <div className="col-span-6 sm:col-span-2">
                    <button
                      onClick={() => navigate(cfg.portal)}
                      className={cn("text-[10px] flex items-center gap-1 hover:underline", cfg.color)}>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {cfg.label.replace(" Portal","").replace(" Dashboard","")} Portal
                    </button>
                    {u.extra_portals?.length > 0 && (
                      <p className="text-[9px] text-muted-foreground">+{u.extra_portals.length} extra</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-6 sm:col-span-2 flex items-center gap-1.5 flex-wrap">
                    {u.is_suspended ? (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-500/10 text-red-400 border-red-500/30">Suspended</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-green-500/10 text-green-400 border-green-500/30">Active</Badge>
                    )}
                    {!u.onboarding_done && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30">Setup</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-1">
                    {editing ? (
                      <>
                        <button onClick={() => saveRole(u.id, editRole)} disabled={saving}
                          className="p-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                          {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(u.id); setEditRole(u.role); }} title="Edit role"
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => toggleVerify(u)} title={u.is_verified ? "Remove verification" : "Verify user"}
                          className={cn("p-1.5 rounded-md transition-colors", u.is_verified ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:text-green-400 hover:bg-green-500/10")}>
                          <UserCheck className="w-3 h-3" />
                        </button>
                        {!isMe && (
                          <button onClick={() => toggleSuspend(u)} title={u.is_suspended ? "Unsuspend" : "Suspend"}
                            className={cn("p-1.5 rounded-md transition-colors", u.is_suspended ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10")}>
                            <Shield className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => navigate(cfg.portal)} title="Go to portal"
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Joined date — visible on hover/expanded */}
                <div className="px-3 pb-1.5 flex items-center gap-4 text-[9px] text-muted-foreground/60">
                  <span>ID: {u.id.slice(0,8)}…</span>
                  <span>Joined: {format(new Date(u.created_at), "dd MMM yyyy")}</span>
                  {u.extra_portals?.length > 0 && (
                    <span>Extra access: {u.extra_portals.join(", ")}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Showing {filtered.length} of {users.length} users</span>
        <button onClick={() => navigate("/admin/users")} className="text-primary hover:underline flex items-center gap-1">
          Full User Management <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </Card>
  );
}
