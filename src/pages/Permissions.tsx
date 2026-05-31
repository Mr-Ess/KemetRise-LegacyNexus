import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit, Shield, Users, Bot, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { extApi } from "@/services/extended";
import BrandSelector from "@/components/shared/BrandSelector";
import ExportButton from "@/components/shared/ExportButton";

const ROLES = ["admin", "manager", "staff", "viewer", "agent"];
const SECTORS = [
  "brands", "projects", "services", "employees", "customers", "branches",
  "affiliates", "success_partners", "digital_inheritance", "legendary_journey",
  "inventory", "materials", "logistics", "legal", "finance", "marketing",
  "ai_agents", "settings", "reports", "payments", "workflows", "audit_logs",
];

type RolePerm = {
  id: string; role: string; resource_type: string; brand_id?: string;
  can_read: boolean; can_create: boolean; can_update: boolean;
  can_delete: boolean; can_export: boolean; can_approve: boolean;
  created_at: string;
};

type SectorPerm = {
  id: string; target_user_id: string; brand_id: string; sector: string;
  can_read: boolean; can_write: boolean; can_delete: boolean;
  can_approve: boolean; can_export: boolean;
  ai_managed: boolean; ai_agent_codes?: string[]; notes?: string;
  created_at: string;
};

type AgentPerm = {
  id: string; agent_code: string; brand_id?: string;
  allowed_tables: string[]; allowed_actions: string[];
  max_daily_ops?: number; max_spend_eur?: number;
  can_escalate: boolean; requires_approval: boolean; sandbox_mode: boolean;
  notes?: string; created_at: string;
};

const emptyRole: any = {
  role: "staff", resource_type: "brands", brand_id: null,
  can_read: true, can_create: false, can_update: false,
  can_delete: false, can_export: false, can_approve: false,
};

const emptySector: any = {
  target_user_id: "", brand_id: null, sector: "brands",
  can_read: true, can_write: false, can_delete: false,
  can_approve: false, can_export: false,
  ai_managed: false, ai_agent_codes: "", notes: "",
};

const emptyAgent: any = {
  agent_code: "", brand_id: null,
  allowed_tables: "", allowed_actions: "read",
  max_daily_ops: 1000, max_spend_eur: 0,
  can_escalate: true, requires_approval: false, sandbox_mode: false, notes: "",
};

export default function Permissions() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"roles" | "sectors" | "agents">("roles");
  const [rolePerms, setRolePerms] = useState<RolePerm[]>([]);
  const [sectorPerms, setSectorPerms] = useState<SectorPerm[]>([]);
  const [agentPerms, setAgentPerms] = useState<AgentPerm[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleForm, setRoleForm] = useState<any>(emptyRole);
  const [sectorForm, setSectorForm] = useState<any>(emptySector);
  const [agentForm, setAgentForm] = useState<any>(emptyAgent);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showSectorForm, setShowSectorForm] = useState(false);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editSectorId, setEditSectorId] = useState<string | null>(null);
  const [editAgentId, setEditAgentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s, a] = await Promise.all([
        extApi.list("role_permissions"),
        extApi.list("sector_permissions"),
        extApi.list("agent_permissions"),
      ]);
      setRolePerms(r as RolePerm[]);
      setSectorPerms(s as SectorPerm[]);
      setAgentPerms(a as AgentPerm[]);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveRole = async () => {
    if (!roleForm.resource_type) { toast.error("Resource type required"); return; }
    try {
      if (editRoleId) { await extApi.update("role_permissions", editRoleId, roleForm); toast.success("Updated"); }
      else { await extApi.create("role_permissions", roleForm); toast.success("Permission added"); }
      setShowRoleForm(false); setRoleForm(emptyRole); setEditRoleId(null); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const saveSector = async () => {
    if (!sectorForm.brand_id || !sectorForm.sector) { toast.error("Brand & sector required"); return; }
    const payload = {
      ...sectorForm,
      ai_agent_codes: sectorForm.ai_agent_codes ? sectorForm.ai_agent_codes.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    };
    try {
      if (editSectorId) { await extApi.update("sector_permissions", editSectorId, payload); toast.success("Updated"); }
      else { await extApi.create("sector_permissions", payload); toast.success("Sector permission added"); }
      setShowSectorForm(false); setSectorForm(emptySector); setEditSectorId(null); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const saveAgent = async () => {
    if (!agentForm.agent_code) { toast.error("Agent code required"); return; }
    const payload = {
      ...agentForm,
      allowed_tables: agentForm.allowed_tables ? agentForm.allowed_tables.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      allowed_actions: agentForm.allowed_actions ? agentForm.allowed_actions.split(",").map((s: string) => s.trim()).filter(Boolean) : ["read"],
    };
    try {
      if (editAgentId) { await extApi.update("agent_permissions", editAgentId, payload); toast.success("Updated"); }
      else { await extApi.create("agent_permissions", payload); toast.success("Agent permission added"); }
      setShowAgentForm(false); setAgentForm(emptyAgent); setEditAgentId(null); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteRole = async (id: string) => { await extApi.remove("role_permissions", id); setRolePerms(p => p.filter(r => r.id !== id)); };
  const deleteSector = async (id: string) => { await extApi.remove("sector_permissions", id); setSectorPerms(p => p.filter(s => s.id !== id)); };
  const deleteAgent = async (id: string) => { await extApi.remove("agent_permissions", id); setAgentPerms(p => p.filter(a => a.id !== id)); };

  const openEditRole = (r: RolePerm) => { setRoleForm({ ...r }); setEditRoleId(r.id); setShowRoleForm(true); };
  const openEditSector = (s: SectorPerm) => { setSectorForm({ ...s, ai_agent_codes: Array.isArray(s.ai_agent_codes) ? s.ai_agent_codes.join(", ") : "" }); setEditSectorId(s.id); setShowSectorForm(true); };
  const openEditAgent = (a: AgentPerm) => { setAgentForm({ ...a, allowed_tables: Array.isArray(a.allowed_tables) ? a.allowed_tables.join(", ") : "", allowed_actions: Array.isArray(a.allowed_actions) ? a.allowed_actions.join(", ") : "read" }); setEditAgentId(a.id); setShowAgentForm(true); };

  const roleColor: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400",
    manager: "bg-orange-500/20 text-orange-400",
    staff: "bg-blue-500/20 text-blue-400",
    viewer: "bg-gray-500/20 text-gray-400",
    agent: "bg-purple-500/20 text-purple-400",
  };

  const PermDot = ({ yes }: { yes: boolean }) => (
    <span className={`inline-block w-2 h-2 rounded-full ${yes ? "bg-green-400" : "bg-gray-600"}`} />
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span>
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg text-primary">PERMISSIONS</h1>
          </div>
          <div className="flex gap-2">
            <ExportButton data={tab === "roles" ? rolePerms : tab === "sectors" ? sectorPerms : agentPerms} filename="permissions" title="Permissions" />
            {tab === "roles" && <Button onClick={() => { setRoleForm(emptyRole); setEditRoleId(null); setShowRoleForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Role Perm</Button>}
            {tab === "sectors" && <Button onClick={() => { setSectorForm(emptySector); setEditSectorId(null); setShowSectorForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Sector Perm</Button>}
            {tab === "agents" && <Button onClick={() => { setAgentForm(emptyAgent); setEditAgentId(null); setShowAgentForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Agent Perm</Button>}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 bg-card border-border text-center cursor-pointer" onClick={() => setTab("roles")}>
            <Users className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="font-display text-xs text-muted-foreground">ROLE PERMS</p>
            <p className="font-display text-2xl text-primary">{rolePerms.length}</p>
          </Card>
          <Card className="p-3 bg-card border-border text-center cursor-pointer" onClick={() => setTab("sectors")}>
            <Layers className="w-4 h-4 text-nile mx-auto mb-1" />
            <p className="font-display text-xs text-muted-foreground">SECTOR PERMS</p>
            <p className="font-display text-2xl text-nile">{sectorPerms.length}</p>
          </Card>
          <Card className="p-3 bg-card border-border text-center cursor-pointer" onClick={() => setTab("agents")}>
            <Bot className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="font-display text-xs text-muted-foreground">AGENT PERMS</p>
            <p className="font-display text-2xl text-purple-400">{agentPerms.length}</p>
          </Card>
        </div>

        <div className="flex gap-2 mb-4">
          {(["roles", "sectors", "agents"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-display transition-colors ${tab === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>
              {t === "roles" ? <Users className="w-3 h-3" /> : t === "sectors" ? <Layers className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              {t === "roles" ? `Role Permissions (${rolePerms.length})` : t === "sectors" ? `Sector Permissions (${sectorPerms.length})` : `Agent Permissions (${agentPerms.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
        ) : tab === "roles" ? (
          <div className="space-y-2">
            {rolePerms.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No role permissions. Add role-level permissions to control access per resource.</p>}
            {/* Header */}
            {rolePerms.length > 0 && (
              <div className="grid grid-cols-8 gap-2 text-[10px] font-display text-muted-foreground px-4 mb-1">
                <span className="col-span-2">Role / Resource</span>
                <span className="text-center">Read</span><span className="text-center">Create</span>
                <span className="text-center">Update</span><span className="text-center">Delete</span>
                <span className="text-center">Export</span><span className="text-center">Approve</span>
              </div>
            )}
            {rolePerms.map(r => (
              <Card key={r.id} className="p-3 bg-card border-border">
                <div className="grid grid-cols-8 gap-2 items-center">
                  <div className="col-span-2 flex items-center gap-2">
                    <Badge className={`text-[10px] ${roleColor[r.role] || "bg-muted"}`}>{r.role}</Badge>
                    <span className="text-xs text-foreground">{r.resource_type}</span>
                  </div>
                  <span className="text-center"><PermDot yes={r.can_read} /></span>
                  <span className="text-center"><PermDot yes={r.can_create} /></span>
                  <span className="text-center"><PermDot yes={r.can_update} /></span>
                  <span className="text-center"><PermDot yes={r.can_delete} /></span>
                  <span className="text-center"><PermDot yes={r.can_export} /></span>
                  <span className="text-center flex items-center justify-between">
                    <PermDot yes={r.can_approve} />
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => openEditRole(r)} className="p-1 rounded text-muted-foreground hover:text-primary"><Edit className="w-3 h-3" /></button>
                      <button onClick={() => deleteRole(r.id)} className="p-1 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : tab === "sectors" ? (
          <div className="space-y-3">
            {sectorPerms.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No sector permissions. Grant per-user, per-brand, per-sector access here.</p>}
            {sectorPerms.map(s => (
              <Card key={s.id} className="p-4 bg-card border-border">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="text-[10px] bg-primary/10 text-primary">{s.sector}</Badge>
                      {s.ai_managed && <Badge className="text-[10px] bg-purple-500/20 text-purple-400">AI Managed</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{s.target_user_id}</p>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      {s.can_read && <span className="text-green-400">✓ Read</span>}
                      {s.can_write && <span className="text-blue-400">✓ Write</span>}
                      {s.can_delete && <span className="text-red-400">✓ Delete</span>}
                      {s.can_approve && <span className="text-yellow-400">✓ Approve</span>}
                      {s.can_export && <span className="text-cyan-400">✓ Export</span>}
                    </div>
                    {Array.isArray(s.ai_agent_codes) && s.ai_agent_codes.length > 0 && (
                      <p className="text-[10px] text-purple-400">Agents: {s.ai_agent_codes.join(", ")}</p>
                    )}
                    {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditSector(s)} className="p-1.5 rounded text-muted-foreground hover:text-primary"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteSector(s.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {agentPerms.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No agent permissions. Define what each AI agent is authorized to access.</p>}
            {agentPerms.map(a => (
              <Card key={a.id} className="p-4 bg-card border-border">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bot className="w-4 h-4 text-nile" />
                      <span className="font-display text-sm text-primary">{a.agent_code}</span>
                      {a.sandbox_mode && <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400">Sandbox</Badge>}
                      {a.requires_approval && <Badge className="text-[10px] bg-orange-500/20 text-orange-400">Needs Approval</Badge>}
                      {a.can_escalate && <Badge className="text-[10px] bg-green-500/20 text-green-400">Can Escalate</Badge>}
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      {a.max_daily_ops && <span>Max ops/day: {a.max_daily_ops}</span>}
                      {!!a.max_spend_eur && <span>Spend cap: {a.max_spend_eur} EUR</span>}
                    </div>
                    {Array.isArray(a.allowed_actions) && <p className="text-[10px] text-nile">Actions: {a.allowed_actions.join(", ")}</p>}
                    {Array.isArray(a.allowed_tables) && a.allowed_tables.length > 0 && <p className="text-[10px] text-muted-foreground">Tables: {a.allowed_tables.join(", ")}</p>}
                    {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditAgent(a)} className="p-1.5 rounded text-muted-foreground hover:text-primary"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteAgent(a.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Role Perm Form */}
      <Dialog open={showRoleForm} onOpenChange={setShowRoleForm}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="font-display text-primary">{editRoleId ? "Edit" : "New"} Role Permission</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Role</Label>
                <Select value={roleForm.role} onValueChange={v => setRoleForm((p: any) => ({ ...p, role: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Resource</Label>
                <Select value={roleForm.resource_type} onValueChange={v => setRoleForm((p: any) => ({ ...p, resource_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <BrandSelector value={roleForm.brand_id} onChange={id => setRoleForm((p: any) => ({ ...p, brand_id: id }))} />
            <div className="grid grid-cols-3 gap-3">
              {(["can_read", "can_create", "can_update", "can_delete", "can_export", "can_approve"] as const).map(k => (
                <div key={k} className="flex items-center gap-2">
                  <Switch checked={!!roleForm[k]} onCheckedChange={v => setRoleForm((p: any) => ({ ...p, [k]: v }))} />
                  <Label className="text-xs">{k.replace("can_", "")}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter><Button onClick={saveRole} className="font-display text-xs">{editRoleId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sector Perm Form */}
      <Dialog open={showSectorForm} onOpenChange={setShowSectorForm}>
        <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editSectorId ? "Edit" : "New"} Sector Permission</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Target User ID *</Label><Input value={sectorForm.target_user_id} onChange={e => setSectorForm((p: any) => ({ ...p, target_user_id: e.target.value }))} placeholder="UUID of the user" className="bg-secondary border-border text-foreground font-mono text-xs" /></div>
            <BrandSelector value={sectorForm.brand_id} onChange={id => setSectorForm((p: any) => ({ ...p, brand_id: id }))} />
            <div className="space-y-2"><Label>Sector</Label>
              <Select value={sectorForm.sector} onValueChange={v => setSectorForm((p: any) => ({ ...p, sector: v }))}>
                <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["can_read", "can_write", "can_delete", "can_approve", "can_export", "ai_managed"] as const).map(k => (
                <div key={k} className="flex items-center gap-1">
                  <Switch checked={!!sectorForm[k]} onCheckedChange={v => setSectorForm((p: any) => ({ ...p, [k]: v }))} />
                  <Label className="text-xs">{k.replace("can_", "").replace("ai_managed", "AI")}</Label>
                </div>
              ))}
            </div>
            {sectorForm.ai_managed && (
              <div className="space-y-2"><Label>AI Agent Codes (comma-separated)</Label><Input value={sectorForm.ai_agent_codes} onChange={e => setSectorForm((p: any) => ({ ...p, ai_agent_codes: e.target.value }))} placeholder="AG-001, AG-002" className="bg-secondary border-border text-foreground" /></div>
            )}
            <div className="space-y-2"><Label>Notes</Label><Textarea value={sectorForm.notes} onChange={e => setSectorForm((p: any) => ({ ...p, notes: e.target.value }))} rows={2} className="bg-secondary border-border text-foreground" /></div>
          </div>
          <DialogFooter><Button onClick={saveSector} className="font-display text-xs">{editSectorId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Perm Form */}
      <Dialog open={showAgentForm} onOpenChange={setShowAgentForm}>
        <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editAgentId ? "Edit" : "New"} Agent Permission</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Agent Code *</Label><Input value={agentForm.agent_code} onChange={e => setAgentForm((p: any) => ({ ...p, agent_code: e.target.value }))} placeholder="AG-001" className="bg-secondary border-border text-foreground" /></div>
            <BrandSelector value={agentForm.brand_id} onChange={id => setAgentForm((p: any) => ({ ...p, brand_id: id }))} />
            <div className="space-y-2"><Label>Allowed Actions (comma-separated)</Label><Input value={agentForm.allowed_actions} onChange={e => setAgentForm((p: any) => ({ ...p, allowed_actions: e.target.value }))} placeholder="read, create, update" className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Allowed Tables (comma-separated)</Label><Input value={agentForm.allowed_tables} onChange={e => setAgentForm((p: any) => ({ ...p, allowed_tables: e.target.value }))} placeholder="employees, customers" className="bg-secondary border-border text-foreground" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Max Ops/Day</Label><Input type="number" value={agentForm.max_daily_ops} onChange={e => setAgentForm((p: any) => ({ ...p, max_daily_ops: Number(e.target.value) }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Spend Cap (EUR)</Label><Input type="number" value={agentForm.max_spend_eur} onChange={e => setAgentForm((p: any) => ({ ...p, max_spend_eur: Number(e.target.value) }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1"><Switch checked={!!agentForm.can_escalate} onCheckedChange={v => setAgentForm((p: any) => ({ ...p, can_escalate: v }))} /><Label className="text-xs">Escalate</Label></div>
              <div className="flex items-center gap-1"><Switch checked={!!agentForm.requires_approval} onCheckedChange={v => setAgentForm((p: any) => ({ ...p, requires_approval: v }))} /><Label className="text-xs">Approval</Label></div>
              <div className="flex items-center gap-1"><Switch checked={!!agentForm.sandbox_mode} onCheckedChange={v => setAgentForm((p: any) => ({ ...p, sandbox_mode: v }))} /><Label className="text-xs">Sandbox</Label></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={agentForm.notes} onChange={e => setAgentForm((p: any) => ({ ...p, notes: e.target.value }))} rows={2} className="bg-secondary border-border text-foreground" /></div>
          </div>
          <DialogFooter><Button onClick={saveAgent} className="font-display text-xs">{editAgentId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
