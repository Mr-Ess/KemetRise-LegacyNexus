import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Mail, Shield, Plus, Trash2, Copy, Edit,
  RefreshCw, UserCheck, Bot, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { teamApi } from "@/services/system";
import { extApi } from "@/services/extended";
import { useBrands } from "@/context/BrandsContext";
import BrandSelector from "@/components/shared/BrandSelector";
import ExportButton from "@/components/shared/ExportButton";

const ROLES = ["admin", "manager", "staff", "viewer", "agent"];
const SECTORS = [
  "brands", "projects", "services", "employees", "customers", "branches",
  "affiliates", "inventory", "materials", "finance", "payments",
  "workflows", "marketing", "legal", "settings", "audit_logs",
];

export default function UserManagement() {
  const nav = useNavigate();
  const { brands } = useBrands();
  const [brandId, setBrandId] = useState<string>("");
  const [tab, setTab] = useState("members");
  const [search, setSearch] = useState("");

  // Members
  const [members, setMembers] = useState<any[]>([]);
  // Invitations
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  // Role permissions
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [rpOpen, setRpOpen] = useState(false);
  const [rpForm, setRpForm] = useState<any>({
    role: "staff", resource_type: "brands",
    can_read: true, can_create: false, can_update: false,
    can_delete: false, can_export: false, can_approve: false,
  });
  const [rpEditId, setRpEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId && brands.length > 0) setBrandId(brands[0].id);
  }, [brands, brandId]);

  const loadAll = useCallback(async () => {
    if (!brandId) return;
    const [m, i, rp] = await Promise.all([
      teamApi.members(brandId).catch(() => []),
      teamApi.invitations(brandId).catch(() => []),
      extApi.list("role_permissions", { eq: { brand_id: brandId } }).catch(() => []),
    ]);
    setMembers(m as any[]);
    setInvites(i as any[]);
    setRolePerms(rp as any[]);
  }, [brandId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Invite ────────────────────────────────────────────────────────────────
  const sendInvite = async () => {
    if (!inviteEmail.trim()) return toast.error("Email required");
    if (!brandId) return toast.error("Select a brand first");
    try {
      const inv: any = await teamApi.invite(brandId, inviteEmail.trim(), inviteRole);
      const url = `${window.location.origin}/accept-invite/${inv.token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Invite link copied to clipboard");
      setInviteEmail(""); setInviteOpen(false);
      await loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Role Permissions ──────────────────────────────────────────────────────
  const saveRolePerm = async () => {
    try {
      if (rpEditId) {
        await extApi.update("role_permissions", rpEditId, { ...rpForm, brand_id: brandId });
        toast.success("Updated");
      } else {
        await extApi.create("role_permissions", { ...rpForm, brand_id: brandId });
        toast.success("Created");
      }
      setRpOpen(false); setRpEditId(null);
      setRpForm({ role: "staff", resource_type: "brands", can_read: true, can_create: false, can_update: false, can_delete: false, can_export: false, can_approve: false });
      await loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const removeRolePerm = async (id: string) => {
    if (!confirm("Delete this permission rule?")) return;
    await extApi.remove("role_permissions", id);
    toast.success("Deleted");
    await loadAll();
  };

  // ── Seed defaults ─────────────────────────────────────────────────────────
  const seedDefaults = async () => {
    if (!brandId) return;
    // Call the DB function via RPC
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.rpc("seed_default_role_permissions" as any, {
      p_brand_id: brandId,
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Default permissions seeded for all 5 roles");
    await loadAll();
  };

  const filteredRolePerms = rolePerms.filter(r =>
    !search || r.role?.includes(search) || r.resource_type?.includes(search)
  );

  const permDot = (val: boolean) => (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${val ? "bg-emerald-500" : "bg-secondary"}`} />
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <button onClick={() => nav("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="font-display text-xl text-primary flex items-center gap-2">
            <Users className="w-5 h-5" /> User Management
          </h1>
          <div className="flex items-center gap-2">
            <BrandSelector value={brandId} onChange={setBrandId} />
            <Button variant="outline" size="sm" onClick={loadAll}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!brandId ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Select a brand to manage its users and permissions.
          </Card>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="members"><Users className="w-3.5 h-3.5 mr-1" />Members</TabsTrigger>
              <TabsTrigger value="invitations"><Mail className="w-3.5 h-3.5 mr-1" />Invitations</TabsTrigger>
              <TabsTrigger value="permissions"><Shield className="w-3.5 h-3.5 mr-1" />Permissions</TabsTrigger>
            </TabsList>

            {/* ── MEMBERS ──────────────────────────────────────────────── */}
            <TabsContent value="members">
              <Card className="overflow-x-auto">
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <p className="text-sm font-medium">{members.length} member(s)</p>
                  <ExportButton data={members} filename="members" title="Members" />
                </div>
                {members.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">No members yet. Invite someone below.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs">
                      <tr>
                        <th className="text-left p-3">User ID</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Joined</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id} className="border-t border-border hover:bg-secondary/20">
                          <td className="p-3 font-mono text-xs text-muted-foreground">{m.user_id?.slice(0, 12)}…</td>
                          <td className="p-3"><Badge variant="outline">{m.role}</Badge></td>
                          <td className="p-3 text-xs text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}</td>
                          <td className="p-3">
                            <Button size="sm" variant="ghost" onClick={async () => { if (!confirm("Remove member?")) return; await teamApi.removeMember(m.id); toast.success("Removed"); loadAll(); }}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="p-3 border-t border-border">
                  <Button size="sm" onClick={() => setInviteOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Invite User
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* ── INVITATIONS ──────────────────────────────────────────── */}
            <TabsContent value="invitations">
              <Card>
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <p className="text-sm font-medium">Pending: {invites.filter(i => !i.accepted_at).length}</p>
                  <Button size="sm" onClick={() => setInviteOpen(true)}><Plus className="w-4 h-4 mr-1" />New Invite</Button>
                </div>
                {invites.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">No invitations sent yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs">
                      <tr>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Sent</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map(i => (
                        <tr key={i.id} className="border-t border-border hover:bg-secondary/20">
                          <td className="p-3">{i.email}</td>
                          <td className="p-3"><Badge variant="outline">{i.role}</Badge></td>
                          <td className="p-3">
                            <Badge variant={i.accepted_at ? "default" : "secondary"}>
                              {i.accepted_at ? "Accepted" : "Pending"}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</td>
                          <td className="p-3 flex gap-1">
                            {!i.accepted_at && (
                              <Button size="sm" variant="ghost" title="Copy link" onClick={() => {
                                navigator.clipboard.writeText(`${location.origin}/accept-invite/${i.token}`);
                                toast.success("Link copied");
                              }}>
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={async () => { await teamApi.revoke(i.id); toast.success("Revoked"); loadAll(); }}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </TabsContent>

            {/* ── PERMISSIONS ──────────────────────────────────────────── */}
            <TabsContent value="permissions">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter by role or resource…"
                      value={search} onChange={e => setSearch(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={seedDefaults}>
                      <UserCheck className="w-4 h-4 mr-1" /> Seed Defaults
                    </Button>
                    <Button size="sm" onClick={() => { setRpEditId(null); setRpOpen(true); }}>
                      <Plus className="w-4 h-4 mr-1" /> Add Rule
                    </Button>
                  </div>
                </div>

                <Card className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs">
                      <tr>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Resource</th>
                        <th className="p-3 text-center">Read</th>
                        <th className="p-3 text-center">Create</th>
                        <th className="p-3 text-center">Update</th>
                        <th className="p-3 text-center">Delete</th>
                        <th className="p-3 text-center">Export</th>
                        <th className="p-3 text-center">Approve</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRolePerms.length === 0 ? (
                        <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No rules yet. Click "Seed Defaults" to auto-populate.</td></tr>
                      ) : filteredRolePerms.map(r => (
                        <tr key={r.id} className="border-t border-border hover:bg-secondary/20">
                          <td className="p-3"><Badge variant="outline" className="capitalize">{r.role}</Badge></td>
                          <td className="p-3 text-xs font-mono">{r.resource_type}</td>
                          <td className="p-3 text-center">{permDot(r.can_read)}</td>
                          <td className="p-3 text-center">{permDot(r.can_create)}</td>
                          <td className="p-3 text-center">{permDot(r.can_update)}</td>
                          <td className="p-3 text-center">{permDot(r.can_delete)}</td>
                          <td className="p-3 text-center">{permDot(r.can_export)}</td>
                          <td className="p-3 text-center">{permDot(r.can_approve)}</td>
                          <td className="p-3 flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => {
                              setRpEditId(r.id);
                              setRpForm({ role: r.role, resource_type: r.resource_type, can_read: r.can_read, can_create: r.can_create, can_update: r.can_update, can_delete: r.can_delete, can_export: r.can_export, can_approve: r.can_approve });
                              setRpOpen(true);
                            }}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => removeRolePerm(r.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ── Invite Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invite User to Brand</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={sendInvite}><Mail className="w-4 h-4 mr-1" />Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Role Permission Dialog ────────────────────────────────────────── */}
      <Dialog open={rpOpen} onOpenChange={setRpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{rpEditId ? "Edit" : "Add"} Permission Rule</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={rpForm.role} onValueChange={v => setRpForm((p: any) => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resource</Label>
                <Select value={rpForm.resource_type} onValueChange={v => setRpForm((p: any) => ({ ...p, resource_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["can_read", "can_create", "can_update", "can_delete", "can_export", "can_approve"] as const).map(k => (
                <div key={k} className="flex items-center justify-between p-2 border border-border rounded">
                  <span className="text-xs capitalize">{k.replace("can_", "")}</span>
                  <Switch checked={rpForm[k]} onCheckedChange={v => setRpForm((p: any) => ({ ...p, [k]: v }))} />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRpOpen(false)}>Cancel</Button>
            <Button onClick={saveRolePerm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
