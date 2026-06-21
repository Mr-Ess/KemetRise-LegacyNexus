import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Shield, Layers, Bot, Plus, Trash2, Edit, RefreshCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { extApi } from "@/services/extended";
import BrandSelector from "@/components/shared/BrandSelector";
import ExportButton from "@/components/shared/ExportButton";

const ROLES    = ["superadmin","admin","manager","staff","provider","partner","agent","vendor","marketing","viewer","user"];
const SECTORS  = ["brands","projects","services","employees","customers","branches","affiliates","success_partners","inventory","materials","logistics","legal","finance","marketing","ai_agents","settings","reports","payments","workflows","audit_logs"];
const Dot = ({ v }: { v: boolean }) => <span className={`inline-block w-2.5 h-2.5 rounded-full ${v ? "bg-emerald-500" : "bg-secondary"}`}/>;

const emptyRP = { role: "staff", resource_type: "brands", can_read: true, can_create: false, can_update: false, can_delete: false, can_export: false, can_approve: false };
const emptySP = { target_user_id: "", sector: "brands", can_read: true, can_write: false, can_delete: false, can_approve: false, can_export: false, ai_managed: false, ai_agent_codes: "", notes: "" };
const emptyAP = { agent_code: "", allowed_tables: "", allowed_actions: "read", max_daily_ops: 1000, max_spend_eur: 0, can_escalate: true, requires_approval: false, sandbox_mode: false, notes: "" };

export default function Permissions() {
  const nav = useNavigate();
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const [brandId, setBrandId] = useState("");
  const [tab, setTab] = useState("roles");
  const [loading, setLoading] = useState(false);

  const [rolePerms,   setRolePerms]   = useState<any[]>([]);
  const [sectorPerms, setSectorPerms] = useState<any[]>([]);
  const [agentPerms,  setAgentPerms]  = useState<any[]>([]);

  // Role perm form
  const [rpOpen, setRpOpen] = useState(false);
  const [rpId,   setRpId]   = useState<string | null>(null);
  const [rpForm, setRpForm] = useState<any>(emptyRP);

  // Sector perm form
  const [spOpen, setSpOpen] = useState(false);
  const [spId,   setSpId]   = useState<string | null>(null);
  const [spForm, setSpForm] = useState<any>(emptySP);

  // Agent perm form
  const [apOpen, setApOpen] = useState(false);
  const [apId,   setApId]   = useState<string | null>(null);
  const [apForm, setApForm] = useState<any>(emptyAP);

  const loadAll = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const [rp, sp, ap] = await Promise.all([
        extApi.list("role_permissions",   { eq: { brand_id: brandId } }).catch(() => []),
        extApi.list("sector_permissions", { eq: { brand_id: brandId } }).catch(() => []),
        extApi.list("agent_permissions",  { eq: { brand_id: brandId } }).catch(() => []),
      ]);
      setRolePerms(rp as any[]);
      setSectorPerms(sp as any[]);
      setAgentPerms(ap as any[]);
    } finally { setLoading(false); }
  }, [brandId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Role Permissions CRUD ──────────────────────────────────────────
  const saveRP = async () => {
    if (!rpForm.resource_type) return toast.error(R ? "المورد مطلوب" : "Resource required");
    try {
      if (rpId) await extApi.update("role_permissions", rpId, { ...rpForm, brand_id: brandId });
      else      await extApi.create("role_permissions", { ...rpForm, brand_id: brandId });
      toast.success(R ? "تم الحفظ" : "Saved"); setRpOpen(false); setRpId(null); setRpForm(emptyRP); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteRP = async (id: string) => {
    if (!confirm(R ? "حذف هذه الصلاحية؟" : "Delete this permission?")) return;
    try { await extApi.remove("role_permissions", id); toast.success(R ? "تم الحذف" : "Deleted"); loadAll(); }
    catch (e: any) { toast.error(e.message); }
  };

  // ── Sector Permissions CRUD ────────────────────────────────────────
  const saveSP = async () => {
    if (!spForm.sector) return toast.error(R ? "القطاع مطلوب" : "Sector required");
    const pl = { ...spForm, brand_id: brandId, ai_agent_codes: spForm.ai_agent_codes ? spForm.ai_agent_codes.split(",").map((s: string) => s.trim()).filter(Boolean) : [] };
    try {
      if (spId) await extApi.update("sector_permissions", spId, pl);
      else      await extApi.create("sector_permissions", pl);
      toast.success(R ? "تم الحفظ" : "Saved"); setSpOpen(false); setSpId(null); setSpForm(emptySP); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteSP = async (id: string) => {
    if (!confirm(R ? "حذف صلاحية القطاع هذه؟" : "Delete this sector permission?")) return;
    try { await extApi.remove("sector_permissions", id); toast.success(R ? "تم الحذف" : "Deleted"); loadAll(); }
    catch (e: any) { toast.error(e.message); }
  };

  // ── Agent Permissions CRUD ─────────────────────────────────────────
  const saveAP = async () => {
    if (!apForm.agent_code) return toast.error(R ? "كود الوكيل مطلوب" : "Agent code required");
    const pl = { ...apForm, brand_id: brandId, allowed_tables: apForm.allowed_tables ? apForm.allowed_tables.split(",").map((s: string) => s.trim()).filter(Boolean) : [], allowed_actions: apForm.allowed_actions ? apForm.allowed_actions.split(",").map((s: string) => s.trim()).filter(Boolean) : ["read"] };
    try {
      if (apId) await extApi.update("agent_permissions", apId, pl);
      else      await extApi.create("agent_permissions", pl);
      toast.success(R ? "تم الحفظ" : "Saved"); setApOpen(false); setApId(null); setApForm(emptyAP); loadAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteAP = async (id: string) => {
    if (!confirm(R ? "حذف صلاحية الوكيل هذه؟" : "Delete this agent permission?")) return;
    try { await extApi.remove("agent_permissions", id); toast.success(R ? "تم الحذف" : "Deleted"); loadAll(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <button onClick={() => nav(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm">
          <ArrowLeft className="w-4 h-4"/>{R ? "رجوع" : "Back"}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="font-display text-xl text-primary flex items-center gap-2">
            <Shield className="w-5 h-5"/>{R ? "مدير الصلاحيات" : "Permissions Manager"}
          </h1>
          <div className="flex items-center gap-2">
            <BrandSelector value={brandId} onChange={setBrandId}/>
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}/>
            </Button>
          </div>
        </div>

        {!brandId ? (
          <Card className="p-12 text-center text-muted-foreground text-sm">{R ? "اختر علامة تجارية لإدارة صلاحياتها." : "Select a brand to manage its permissions."}</Card>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-3 h-auto">
              <TabsTrigger value="roles"   className="text-xs py-2 flex items-center gap-1"><Shield className="w-3 h-3"/>{R ? "صلاحيات الأدوار" : "Role Perms"} <Badge variant="outline" className="ml-1 text-[10px]">{rolePerms.length}</Badge></TabsTrigger>
              <TabsTrigger value="sectors" className="text-xs py-2 flex items-center gap-1"><Layers className="w-3 h-3"/>{R ? "صلاحيات القطاعات" : "Sector Perms"} <Badge variant="outline" className="ml-1 text-[10px]">{sectorPerms.length}</Badge></TabsTrigger>
              <TabsTrigger value="agents"  className="text-xs py-2 flex items-center gap-1"><Bot className="w-3 h-3"/>{R ? "صلاحيات الوكلاء" : "Agent Perms"} <Badge variant="outline" className="ml-1 text-[10px]">{agentPerms.length}</Badge></TabsTrigger>
            </TabsList>

            {/* ── ROLE PERMISSIONS ── */}
            <TabsContent value="roles">
              <Card>
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <p className="text-sm font-medium">{rolePerms.length} {R ? "قاعدة" : "rule(s)"}</p>
                  <div className="flex gap-2">
                    <ExportButton data={rolePerms} filename="role_permissions" title={R ? "صلاحيات الأدوار" : "Role Perms"}/>
                    <Button size="sm" onClick={() => { setRpId(null); setRpForm(emptyRP); setRpOpen(true); }}><Plus className="w-4 h-4 mr-1"/>{R ? "إضافة قاعدة" : "Add Rule"}</Button>
                  </div>
                </div>
                {rolePerms.length === 0 ? (
                  <p className="p-10 text-center text-sm text-muted-foreground">{R ? "لم تُحدد صلاحيات أدوار بعد." : "No role permissions defined yet."}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary/40">
                        <tr>
                          <th className="text-left p-3">{R?"الدور":"Role"}</th>
                          <th className="text-left p-3">{R?"المورد":"Resource"}</th>
                          <th className="p-2 text-center">{R?"قراءة":"Read"}</th>
                          <th className="p-2 text-center">{R?"إنشاء":"Create"}</th>
                          <th className="p-2 text-center">{R?"تعديل":"Update"}</th>
                          <th className="p-2 text-center">{R?"حذف":"Delete"}</th>
                          <th className="p-2 text-center">{R?"تصدير":"Export"}</th>
                          <th className="p-2 text-center">{R?"موافقة":"Approve"}</th>
                          <th className="p-3 w-16"/>
                        </tr>
                      </thead>
                      <tbody>
                        {rolePerms.map(r => (
                          <tr key={r.id} className="border-t border-border hover:bg-secondary/20">
                            <td className="p-3"><Badge variant="outline" className="text-[10px]">{r.role}</Badge></td>
                            <td className="p-3 font-mono text-[10px]">{r.resource_type}</td>
                            <td className="p-2 text-center"><Dot v={r.can_read}/></td>
                            <td className="p-2 text-center"><Dot v={r.can_create}/></td>
                            <td className="p-2 text-center"><Dot v={r.can_update}/></td>
                            <td className="p-2 text-center"><Dot v={r.can_delete}/></td>
                            <td className="p-2 text-center"><Dot v={r.can_export}/></td>
                            <td className="p-2 text-center"><Dot v={r.can_approve}/></td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setRpId(r.id); setRpForm({ role: r.role, resource_type: r.resource_type, can_read: r.can_read, can_create: r.can_create, can_update: r.can_update, can_delete: r.can_delete, can_export: r.can_export, can_approve: r.can_approve }); setRpOpen(true); }}><Edit className="w-3 h-3"/></Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteRP(r.id)}><Trash2 className="w-3 h-3 text-destructive"/></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ── SECTOR PERMISSIONS ── */}
            <TabsContent value="sectors">
              <Card>
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <p className="text-sm font-medium">{sectorPerms.length} {R ? "قاعدة" : "rule(s)"}</p>
                  <div className="flex gap-2">
                    <ExportButton data={sectorPerms} filename="sector_permissions" title={R ? "صلاحيات القطاعات" : "Sector Perms"}/>
                    <Button size="sm" onClick={() => { setSpId(null); setSpForm(emptySP); setSpOpen(true); }}><Plus className="w-4 h-4 mr-1"/>{R ? "إضافة قاعدة" : "Add Rule"}</Button>
                  </div>
                </div>
                {sectorPerms.length === 0 ? (
                  <p className="p-10 text-center text-sm text-muted-foreground">{R ? "لم تُحدد صلاحيات قطاعات بعد." : "No sector permissions defined yet."}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary/40">
                        <tr>
                          <th className="text-left p-3">{R?"معرف المستخدم":"User ID"}</th>
                          <th className="text-left p-3">{R?"القطاع":"Sector"}</th>
                          <th className="p-2 text-center">{R?"قراءة":"Read"}</th>
                          <th className="p-2 text-center">{R?"كتابة":"Write"}</th>
                          <th className="p-2 text-center">{R?"حذف":"Delete"}</th>
                          <th className="p-2 text-center">{R?"موافقة":"Approve"}</th>
                          <th className="p-2 text-center">AI</th>
                          <th className="p-3 w-16"/>
                        </tr>
                      </thead>
                      <tbody>
                        {sectorPerms.map(s => (
                          <tr key={s.id} className="border-t border-border hover:bg-secondary/20">
                            <td className="p-3 font-mono text-[10px] text-muted-foreground">{s.target_user_id?.slice(0,14)}…</td>
                            <td className="p-3 font-mono text-[10px]">{s.sector}</td>
                            <td className="p-2 text-center"><Dot v={s.can_read}/></td>
                            <td className="p-2 text-center"><Dot v={s.can_write}/></td>
                            <td className="p-2 text-center"><Dot v={s.can_delete}/></td>
                            <td className="p-2 text-center"><Dot v={s.can_approve}/></td>
                            <td className="p-2 text-center"><Dot v={s.ai_managed}/></td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setSpId(s.id); setSpForm({ ...s, ai_agent_codes: Array.isArray(s.ai_agent_codes) ? s.ai_agent_codes.join(",") : (s.ai_agent_codes||"") }); setSpOpen(true); }}><Edit className="w-3 h-3"/></Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteSP(s.id)}><Trash2 className="w-3 h-3 text-destructive"/></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ── AGENT PERMISSIONS ── */}
            <TabsContent value="agents">
              <Card>
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <p className="text-sm font-medium">{agentPerms.length} {R ? "قاعدة" : "rule(s)"}</p>
                  <div className="flex gap-2">
                    <ExportButton data={agentPerms} filename="agent_permissions" title={R ? "صلاحيات الوكلاء" : "Agent Perms"}/>
                    <Button size="sm" onClick={() => { setApId(null); setApForm(emptyAP); setApOpen(true); }}><Plus className="w-4 h-4 mr-1"/>{R ? "إضافة قاعدة" : "Add Rule"}</Button>
                  </div>
                </div>
                {agentPerms.length === 0 ? (
                  <p className="p-10 text-center text-sm text-muted-foreground">{R ? "لم تُحدد صلاحيات وكلاء بعد." : "No agent permissions defined yet."}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary/40">
                        <tr>
                          <th className="text-left p-3">{R?"كود الوكيل":"Agent Code"}</th>
                          <th className="text-left p-3">{R?"الجداول":"Tables"}</th>
                          <th className="text-left p-3">{R?"الإجراءات":"Actions"}</th>
                          <th className="p-2 text-center">{R?"أقصى عمليات":"Max Ops/d"}</th>
                          <th className="p-2 text-center">{R?"اختبار":"Sandbox"}</th>
                          <th className="p-2 text-center">{R?"تصعيد":"Escalate"}</th>
                          <th className="p-3 w-16"/>
                        </tr>
                      </thead>
                      <tbody>
                        {agentPerms.map(a => (
                          <tr key={a.id} className="border-t border-border hover:bg-secondary/20">
                            <td className="p-3 font-mono text-[10px] text-primary">{a.agent_code}</td>
                            <td className="p-3 text-[10px] text-muted-foreground max-w-[120px] truncate">{Array.isArray(a.allowed_tables) ? a.allowed_tables.join(", ") : a.allowed_tables}</td>
                            <td className="p-3 text-[10px]">{Array.isArray(a.allowed_actions) ? a.allowed_actions.join(", ") : a.allowed_actions}</td>
                            <td className="p-2 text-center">{a.max_daily_ops}</td>
                            <td className="p-2 text-center"><Dot v={a.sandbox_mode}/></td>
                            <td className="p-2 text-center"><Dot v={a.can_escalate}/></td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setApId(a.id); setApForm({ ...a, allowed_tables: Array.isArray(a.allowed_tables) ? a.allowed_tables.join(",") : (a.allowed_tables||""), allowed_actions: Array.isArray(a.allowed_actions) ? a.allowed_actions.join(",") : (a.allowed_actions||"read") }); setApOpen(true); }}><Edit className="w-3 h-3"/></Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteAP(a.id)}><Trash2 className="w-3 h-3 text-destructive"/></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ── Role Perm Dialog ── */}
      <Dialog open={rpOpen} onOpenChange={setRpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{rpId ? (R?"تعديل":"إEdit") : (R?"إضافة":"Add")} {R ? "صلاحية دور" : "Role Permission"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{R ? "الدور" : "Role"}</Label>
                <Select value={rpForm.role} onValueChange={v => setRpForm((p: any) => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{R ? "المورد" : "Resource"}</Label>
                <Select value={rpForm.resource_type} onValueChange={v => setRpForm((p: any) => ({ ...p, resource_type: v }))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["can_read","can_create","can_update","can_delete","can_export","can_approve"] as const).map(k => (
                <div key={k} className="flex items-center gap-2">
                  <Switch checked={rpForm[k]} onCheckedChange={v => setRpForm((p: any) => ({ ...p, [k]: v }))}/>
                  <Label className="text-xs">{k.replace("can_","")}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRpOpen(false)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveRP}>{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sector Perm Dialog ── */}
      <Dialog open={spOpen} onOpenChange={setSpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{spId ? (R?"تعديل":"Edit") : (R?"إضافة":"Add")} {R ? "صلاحية قطاع" : "Sector Permission"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>{R ? "معرف المستخدم المستهدف" : "Target User ID"}</Label>
              <Input value={spForm.target_user_id} onChange={e => setSpForm((p: any) => ({ ...p, target_user_id: e.target.value }))} placeholder="UUID of user"/>
            </div>
            <div className="space-y-1">
              <Label>{R ? "القطاع" : "Sector"}</Label>
              <Select value={spForm.sector} onValueChange={v => setSpForm((p: any) => ({ ...p, sector: v }))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["can_read","can_write","can_delete","can_approve","can_export","ai_managed"] as const).map(k => (
                <div key={k} className="flex items-center gap-2">
                  <Switch checked={spForm[k]} onCheckedChange={v => setSpForm((p: any) => ({ ...p, [k]: v }))}/>
                  <Label className="text-xs">{k.replace("can_","").replace("ai_managed","ai")}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label>{R ? "أكواد وكلاء الذكاء الاصطناعي (مفصولة بفواصل)" : "AI Agent Codes (comma-separated)"}</Label>
              <Input value={spForm.ai_agent_codes} onChange={e => setSpForm((p: any) => ({ ...p, ai_agent_codes: e.target.value }))} placeholder="anubis,horus"/>
            </div>
            <div className="space-y-1">
              <Label>{R ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={spForm.notes} onChange={e => setSpForm((p: any) => ({ ...p, notes: e.target.value }))} rows={2}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpOpen(false)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveSP}>{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Agent Perm Dialog ── */}
      <Dialog open={apOpen} onOpenChange={setApOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{apId ? (R?"تعديل":"Edit") : (R?"إضافة":"Add")} {R ? "صلاحية وكيل" : "Agent Permission"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{R ? "كود الوكيل" : "Agent Code"}</Label>
                <Input value={apForm.agent_code} onChange={e => setApForm((p: any) => ({ ...p, agent_code: e.target.value }))} placeholder="ANUBIS"/>
              </div>
              <div className="space-y-1">
                <Label>{R ? "أقصى عمليات يومية" : "Max Daily Ops"}</Label>
                <Input type="number" value={apForm.max_daily_ops} onChange={e => setApForm((p: any) => ({ ...p, max_daily_ops: +e.target.value }))}/>
              </div>
            </div>
            <div className="space-y-1">
              <Label>{R ? "الجداول المسموحة (مفصولة بفواصل)" : "Allowed Tables (comma-separated)"}</Label>
              <Input value={apForm.allowed_tables} onChange={e => setApForm((p: any) => ({ ...p, allowed_tables: e.target.value }))} placeholder="customers,invoices"/>
            </div>
            <div className="space-y-1">
              <Label>{R ? "الإجراءات المسموحة (مفصولة بفواصل)" : "Allowed Actions (comma-separated)"}</Label>
              <Input value={apForm.allowed_actions} onChange={e => setApForm((p: any) => ({ ...p, allowed_actions: e.target.value }))} placeholder="read,create"/>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["can_escalate","requires_approval","sandbox_mode"] as const).map(k => (
                <div key={k} className="flex items-center gap-2">
                  <Switch checked={apForm[k]} onCheckedChange={v => setApForm((p: any) => ({ ...p, [k]: v }))}/>
                  <Label className="text-xs">{k.replace(/_/g," ")}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label>{R ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={apForm.notes} onChange={e => setApForm((p: any) => ({ ...p, notes: e.target.value }))} rows={2}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApOpen(false)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={saveAP}>{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}