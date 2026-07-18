import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Shield, Users, Search, RefreshCw, Check, X,
  ChevronDown, ChevronRight, Settings, Save, Plus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ─── Portal definitions ──────────────────────────────────────────── */
type PortalDef = { id: string; label: string; href: string; icon: string; color: string; roles: string[] };

const PORTALS: PortalDef[] = [
  { id: "admin",     label: "Admin Portal",     href: "/admin",     icon: "⚙️",  color: "text-primary",    roles: ["admin","superadmin"] },
  { id: "partner",   label: "Partner Portal",   href: "/partner",   icon: "🤝",  color: "text-indigo-400", roles: ["partner"] },
  { id: "agent",     label: "Agent Portal",     href: "/agent",     icon: "🧑‍💼",  color: "text-emerald-400",roles: ["agent"] },
  { id: "vendor",    label: "Vendor Portal",    href: "/vendor",    icon: "🏪",  color: "text-orange-400", roles: ["vendor"] },
  { id: "provider",  label: "Provider Portal",  href: "/provider",  icon: "🔧",  color: "text-yellow-400", roles: ["provider"] },
  { id: "marketing", label: "Marketing Portal", href: "/marketing", icon: "📣",  color: "text-pink-400",   roles: ["marketing"] },
  { id: "portal",    label: "User Portal",      href: "/portal",    icon: "👤",  color: "text-blue-400",   roles: ["user"] },
  { id: "erp",       label: "ERP Cockpit",      href: "/erp",       icon: "📊",  color: "text-cyan-400",   roles: ["admin","superadmin","vendor","provider"] },
  { id: "dashboard", label: "Dashboard",        href: "/dashboard", icon: "🖥️",  color: "text-primary",    roles: ["admin","superadmin","partner","agent","vendor","provider","marketing"] },
  { id: "chat",      label: "AI Chat",          href: "/chat",      icon: "🤖",  color: "text-cyan-400",   roles: [] /* everyone */ },
];

const ALL_ROLES = ["superadmin","admin","partner","agent","vendor","provider","marketing","user"] as const;
type Role = typeof ALL_ROLES[number];

const ROLE_COLOR: Record<string, string> = {
  superadmin: "bg-red-500/20 text-red-400 border-red-500/30",
  admin:      "bg-primary/15 text-primary border-primary/30",
  partner:    "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  agent:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  vendor:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  provider:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  marketing:  "bg-pink-500/15 text-pink-400 border-pink-500/30",
  user:       "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

/* portals user can access given a role */
function accessiblePortals(role: string): string[] {
  if (role === "superadmin" || role === "admin") return PORTALS.map((p) => p.id);
  return PORTALS.filter((p) => p.roles.includes(role) || p.roles.length === 0).map((p) => p.id);
}

interface UserProfile {
  id: string; email: string; role: string;
  full_name?: string; extra_portals?: string[];
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function UserPortalAccess() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const db = supabase as any;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  // Per-user editable state: role + extra portals
  const [edits, setEdits] = useState<Record<string, { role: string; extra: string[] }>>({});

  const load = async () => {
    setLoading(true);
    try {
      // Fetch from user_profiles (has role) joined with auth users via email
      const { data: profiles } = await db.from("user_profiles").select("id, role, full_name, extra_portals").order("role");
      if (!profiles?.length) { setUsers([]); setLoading(false); return; }

      // Get emails from auth.users via admin — fallback to id if not available
      let authData: any = null;
      try {
        const { data } = await db.rpc("get_users_with_email");
        authData = data;
      } catch { /* RPC not available, emails will show as partial IDs */ }
      const emailMap: Record<string, string> = {};
      if (Array.isArray(authData)) {
        authData.forEach((u: any) => { emailMap[u.id] = u.email; });
      }

      const list: UserProfile[] = profiles.map((p: any) => ({
        id: p.id,
        email: emailMap[p.id] || p.id.slice(0, 8) + "...",
        role: p.role || "user",
        full_name: p.full_name,
        extra_portals: Array.isArray(p.extra_portals) ? p.extra_portals : [],
      }));
      setUsers(list);

      // Init edits map
      const initEdits: Record<string, { role: string; extra: string[] }> = {};
      list.forEach((u) => { initEdits[u.id] = { role: u.role, extra: u.extra_portals || [] }; });
      setEdits(initEdits);
    } catch (e: any) {
      toast.error("Failed to load users: " + (e?.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const toggleExtra = (userId: string, portalId: string) => {
    setEdits((prev) => {
      const curr = prev[userId] || { role: "user", extra: [] };
      const has = curr.extra.includes(portalId);
      return { ...prev, [userId]: { ...curr, extra: has ? curr.extra.filter((e) => e !== portalId) : [...curr.extra, portalId] } };
    });
  };

  const setRole = (userId: string, role: string) => {
    setEdits((prev) => ({ ...prev, [userId]: { ...(prev[userId] || { extra: [] }), role } }));
  };

  const save = async (userId: string) => {
    const edit = edits[userId];
    if (!edit) return;
    setSaving(userId);
    try {
      const { error } = await db.from("user_profiles").update({
        role: edit.role,
        extra_portals: edit.extra,
      }).eq("id", userId);
      if (error) throw error;
      // Update local list
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: edit.role, extra_portals: edit.extra } : u));
      toast.success("Saved!");
    } catch (e: any) {
      toast.error("Save failed: " + (e?.message || ""));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="p-5 border border-border/50 bg-secondary/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">User Portal Access</h2>
            <p className="text-[11px] text-muted-foreground">Manage roles & portal permissions per user</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 text-xs w-52 bg-secondary/20" placeholder="Search by email or role…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: "Total Users", value: users.length, color: "text-primary" },
          { label: "Admins",    value: users.filter((u) => ["admin","superadmin"].includes(u.role)).length, color: "text-red-400" },
          { label: "Vendors",   value: users.filter((u) => ["vendor","provider"].includes(u.role)).length, color: "text-orange-400" },
          { label: "Partners",  value: users.filter((u) => ["partner","agent"].includes(u.role)).length, color: "text-indigo-400" },
        ].map((s) => (
          <div key={s.label} className="p-2.5 rounded-xl border border-border/40 bg-secondary/10 text-center">
            <p className={`text-xl font-display font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Users list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-secondary/20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{search ? "No users match your search." : "No user profiles found."}</p>
          <p className="text-xs mt-1 text-muted-foreground/60">Users appear here after they sign up and have a profile created.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((u) => {
            const edit = edits[u.id] || { role: u.role, extra: [] };
            const isExpanded = expandedId === u.id;
            const portalsFromRole = accessiblePortals(edit.role);
            const allAccess = Array.from(new Set([...portalsFromRole, ...edit.extra]));
            const isDirty = edit.role !== u.role || JSON.stringify(edit.extra.sort()) !== JSON.stringify((u.extra_portals || []).sort());
            const isMe = u.id === me?.id;

            return (
              <div key={u.id} className={cn("rounded-xl border transition-all", isExpanded ? "border-primary/30 bg-primary/5" : "border-border/40 hover:border-border/70 bg-secondary/5")}>
                {/* Row */}
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}>
                  <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-sm shrink-0 font-bold text-primary">
                    {(u.full_name || u.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold truncate">{u.full_name || u.email}</span>
                      {isMe && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">You</Badge>}
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 capitalize ${ROLE_COLOR[edit.role] || ROLE_COLOR.user}`}>{edit.role}</Badge>
                      {isDirty && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400">Unsaved</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{u.full_name ? u.email : ""}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{allAccess.length} portals</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded edit panel */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border/30 pt-3 space-y-4">
                    {/* Role selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Primary Role</label>
                      <Select value={edit.role} onValueChange={(v) => setRole(u.id, v)}>
                        <SelectTrigger className="h-8 text-xs w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              <span className={cn("text-xs font-medium capitalize", ROLE_COLOR[r]?.split(" ")[1])}>{r}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        This role grants automatic access to: {portalsFromRole.map((id) => PORTALS.find((p) => p.id === id)?.label).join(", ")}
                      </p>
                    </div>

                    {/* Portal access toggles */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                        <Plus className="w-3 h-3" />Extra Portal Access
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                        {PORTALS.map((portal) => {
                          const fromRole = portalsFromRole.includes(portal.id);
                          const hasExtra = edit.extra.includes(portal.id);
                          const active = fromRole || hasExtra;
                          return (
                            <button
                              key={portal.id}
                              onClick={() => !fromRole && toggleExtra(u.id, portal.id)}
                              disabled={fromRole}
                              title={fromRole ? "Granted by role" : hasExtra ? "Click to remove" : "Click to add"}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all",
                                active
                                  ? fromRole
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default opacity-80"
                                    : "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground",
                              )}>
                              <span className="text-sm shrink-0">{portal.icon}</span>
                              <span className="truncate">{portal.label.replace(" Portal", "")}</span>
                              {fromRole && <Check className="w-2.5 h-2.5 shrink-0 text-emerald-400 ml-auto" />}
                              {!fromRole && hasExtra && <X className="w-2.5 h-2.5 shrink-0 text-primary ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        🟢 Green = granted by role (read-only) &nbsp;|&nbsp; 🟡 Gold = extra access added manually
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                      <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => save(u.id)} disabled={saving === u.id || !isDirty}>
                        {saving === u.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        {saving === u.id ? "Saving…" : "Save Changes"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => {
                        setEdits((prev) => ({ ...prev, [u.id]: { role: u.role, extra: u.extra_portals || [] } }));
                      }}>
                        Reset
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs ml-auto text-muted-foreground hover:text-foreground" onClick={() => navigate(`/admin/users`)}>
                        <Settings className="w-3 h-3" /> Full User Admin
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
