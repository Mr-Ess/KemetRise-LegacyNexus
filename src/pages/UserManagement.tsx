import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Users, Mail, Shield, Bot, Layers, Plus, Trash2, Edit, Copy, RefreshCw, UserCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { teamApi } from "@/services/system";
import { extApi } from "@/services/extended";
import { supabase } from "@/integrations/supabase/client";
import { useBrands } from "@/context/BrandsContext";
import BrandSelector from "@/components/shared/BrandSelector";
import ExportButton from "@/components/shared/ExportButton";

const ROLES = ["admin","manager","staff","viewer","agent"];
const SECTORS = ["brands","projects","services","employees","customers","branches","affiliates","success_partners","digital_inheritance","legendary_journey","inventory","materials","logistics","legal","finance","marketing","ai_agents","settings","reports","payments","workflows","audit_logs"];
const RC: Record<string,string> = { admin:"bg-red-500/20 text-red-400 border-red-500/30", manager:"bg-orange-500/20 text-orange-400 border-orange-500/30", staff:"bg-blue-500/20 text-blue-400 border-blue-500/30", viewer:"bg-gray-500/20 text-gray-300 border-gray-500/30", agent:"bg-purple-500/20 text-purple-400 border-purple-500/30" };
const emptyRP = { role:"staff", resource_type:"brands", can_read:true, can_create:false, can_update:false, can_delete:false, can_export:false, can_approve:false };
const emptySP = { target_user_id:"", sector:"brands", can_read:true, can_write:false, can_delete:false, can_approve:false, can_export:false, ai_managed:false, ai_agent_codes:"", notes:"" };
const emptyAP = { agent_code:"", allowed_tables:"", allowed_actions:"read", max_daily_ops:1000, max_spend_eur:0, can_escalate:true, requires_approval:false, sandbox_mode:false, notes:"" };
const Dot = ({ v }:{ v:boolean }) => <span className={`inline-block w-2.5 h-2.5 rounded-full ${v?"bg-emerald-500":"bg-secondary"}`}/>;

export default function UserManagement() {
  const nav = useNavigate();
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { brands } = useBrands();
  const [brandId, setBrandId] = useState("");
  const [tab, setTab] = useState("members");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [invOpen, setInvOpen] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("member");
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [rpOpen, setRpOpen] = useState(false);
  const [rpForm, setRpForm] = useState<any>(emptyRP);
  const [rpId, setRpId] = useState<string|null>(null);
  const [sectorPerms, setSectorPerms] = useState<any[]>([]);
  const [spOpen, setSpOpen] = useState(false);
  const [spForm, setSpForm] = useState<any>(emptySP);
  const [spId, setSpId] = useState<string|null>(null);
  const [agentPerms, setAgentPerms] = useState<any[]>([]);
  const [apOpen, setApOpen] = useState(false);
  const [apForm, setApForm] = useState<any>(emptyAP);
  const [apId, setApId] = useState<string|null>(null);

  useEffect(() => { if (!brandId && brands.length > 0) setBrandId(brands[0].id); }, [brands, brandId]);

  const loadAll = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const [m,i,rp,sp,ap] = await Promise.all([
        teamApi.members(brandId).catch(()=>[]),
        teamApi.invitations(brandId).catch(()=>[]),
        extApi.list("role_permissions",{eq:{brand_id:brandId}}).catch(()=>[]),
        extApi.list("sector_permissions",{eq:{brand_id:brandId}}).catch(()=>[]),
        extApi.list("agent_permissions",{eq:{brand_id:brandId}}).catch(()=>[]),
      ]);
      setMembers(m as any[]); setInvites(i as any[]);
      setRolePerms(rp as any[]); setSectorPerms(sp as any[]); setAgentPerms(ap as any[]);
    } finally { setLoading(false); }
  }, [brandId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const sendInvite = async () => {
    if (!invEmail.trim()) return toast.error(R ? "البريد الإلكتروني مطلوب" : "Email required");
    try {
      const inv:any = await teamApi.invite(brandId, invEmail.trim(), invRole);
      await navigator.clipboard.writeText(`${location.origin}/accept-invite/${inv.token}`).catch(()=>{});
      toast.success(R ? "تم إرسال الدعوة — تم نسخ الرابط" : "Invite sent — link copied"); setInvEmail(""); setInvOpen(false); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const saveRP = async () => {
    if (!rpForm.resource_type) return toast.error(R ? "المورد مطلوب" : "Resource required");
    try {
      if (rpId) await extApi.update("role_permissions",rpId,{...rpForm,brand_id:brandId});
      else await extApi.create("role_permissions",{...rpForm,brand_id:brandId});
      toast.success(R ? "تم الحفظ" : "Saved"); setRpOpen(false); setRpId(null); setRpForm(emptyRP); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const saveSP = async () => {
    if (!spForm.sector) return toast.error(R ? "القطاع مطلوب" : "Sector required");
    const pl = {...spForm,brand_id:brandId,ai_agent_codes:spForm.ai_agent_codes?spForm.ai_agent_codes.split(",").map((s:string)=>s.trim()).filter(Boolean):[]};
    try {
      if (spId) await extApi.update("sector_permissions",spId,pl);
      else await extApi.create("sector_permissions",pl);
      toast.success(R ? "تم الحفظ" : "Saved"); setSpOpen(false); setSpId(null); setSpForm(emptySP); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const saveAP = async () => {
    if (!apForm.agent_code) return toast.error(R ? "كود الوكيل مطلوب" : "Agent code required");
    const pl = {...apForm,brand_id:brandId,allowed_tables:apForm.allowed_tables?apForm.allowed_tables.split(",").map((s:string)=>s.trim()).filter(Boolean):[],allowed_actions:apForm.allowed_actions?apForm.allowed_actions.split(",").map((s:string)=>s.trim()).filter(Boolean):["read"]};
    try {
      if (apId) await extApi.update("agent_permissions",apId,pl);
      else await extApi.create("agent_permissions",pl);
      toast.success(R ? "تم الحفظ" : "Saved"); setApOpen(false); setApId(null); setApForm(emptyAP); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const seedDefaults = async () => {
    try {
      const {data:{user}} = await supabase.auth.getUser();
      const {error} = await supabase.rpc("seed_default_role_permissions" as any,{p_brand_id:brandId,p_user_id:user?.id});
      if (error) throw error;
      toast.success(R ? "تم تطبيق الصلاحيات الافتراضية" : "Default permissions seeded"); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const TABS = [
    {key:"members",    label: R ? "الأعضاء"            : "Members",      icon:Users,  cnt:members.length},
    {key:"invitations",label: R ? "الدعوات"            : "Invitations",  icon:Mail,   cnt:invites.filter(i=>!i.accepted_at).length},
    {key:"roles",      label: R ? "صلاحيات الأدوار"   : "Role Perms",   icon:Shield, cnt:rolePerms.length},
    {key:"sectors",    label: R ? "صلاحيات القطاعات"  : "Sector Perms", icon:Layers, cnt:sectorPerms.length},
    {key:"agents",     label: R ? "صلاحيات الوكلاء"   : "Agent Perms",  icon:Bot,    cnt:agentPerms.length},
  ];

  const frp = rolePerms.filter(r=>!search||r.role?.includes(search)||r.resource_type?.includes(search));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <button onClick={()=>nav("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm"><ArrowLeft className="w-4 h-4"/>{R ? "رجوع" : "Back"}</button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="font-display text-xl text-primary flex items-center gap-2"><Users className="w-5 h-5"/>{R ? "إدارة المستخدمين" : "User Management"}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <BrandSelector value={brandId} onChange={setBrandId}/>
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/></Button>
          </div>
        </div>

        {brandId && (
          <div className="grid grid-cols-5 gap-2">
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} className={`p-3 rounded-lg border text-center transition-all ${tab===t.key?"bg-primary/10 border-primary/40 text-primary":"bg-card border-border text-muted-foreground hover:bg-secondary/50"}`}>
                <t.icon className="w-4 h-4 mx-auto mb-1"/>
                <p className="text-[10px] font-display tracking-wide hidden sm:block">{t.label}</p>
                <p className="font-display text-lg">{t.cnt}</p>
              </button>
            ))}
          </div>
        )}

        {!brandId ? (
          <Card className="p-12 text-center text-muted-foreground text-sm">{R ? "اختر علامة تجارية لإدارة مستخدميها وصلاحياتها." : "Select a brand to manage its users and permissions."}</Card>
        ):(
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-5 h-auto">
              {TABS.map(t=>(
                <TabsTrigger key={t.key} value={t.key} className="text-[11px] py-2 flex items-center gap-1">
                  <t.icon className="w-3 h-3"/><span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="members">
              <Card>
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <p className="text-sm font-medium">{members.length} {R ? "عضو" : "member(s)"}</p>
                  <div className="flex gap-2"><ExportButton data={members} filename="members" title={R ? "الأعضاء" : "Members"}/><Button size="sm" onClick={()=>setInvOpen(true)}><Plus className="w-4 h-4 mr-1"/>{R ? "دعوة" : "Invite"}</Button></div>
                </div>
                {members.length===0?<p className="p-10 text-center text-sm text-muted-foreground">{R ? "لا يوجد أعضاء بعد." : "No members yet."}</p>:(
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs"><tr><th className="text-left p-3">{R ? "معرف المستخدم" : "User ID"}</th><th className="text-left p-3">{R ? "الدور" : "Role"}</th><th className="text-left p-3">{R ? "انضم" : "Joined"}</th><th className="p-3 w-12"/></tr></thead>
                    <tbody>
                      {members.map(m=>(
                        <tr key={m.id} className="border-t border-border hover:bg-secondary/20">
                          <td className="p-3 font-mono text-xs text-muted-foreground">{m.user_id?.slice(0,16)}…</td>
                          <td className="p-3"><Badge className={`text-[10px] border ${RC[m.role]||"bg-muted border-border"}`}>{m.role}</Badge></td>
                          <td className="p-3 text-xs text-muted-foreground">{m.created_at?new Date(m.created_at).toLocaleDateString():"—"}</td>
                          <td className="p-3"><Button size="sm" variant="ghost" onClick={async()=>{if(!confirm(R ? "إزالة العضو؟" : "Remove member?"))return;await teamApi.removeMember(m.id);toast.success(R ? "تمت الإزالة" : "Removed");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="invitations">
              <Card>
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <p className="text-sm font-medium">{R ? "معلق" : "Pending"}: {invites.filter(i=>!i.accepted_at).length} / {R ? "الإجمالي" : "Total"}: {invites.length}</p>
                  <Button size="sm" onClick={()=>setInvOpen(true)}><Plus className="w-4 h-4 mr-1"/>{R ? "دعوة جديدة" : "New Invite"}</Button>
                </div>
                {invites.length===0?<p className="p-10 text-center text-sm text-muted-foreground">{R ? "لم يتم إرسال دعوات بعد." : "No invitations sent yet."}</p>:(
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs"><tr><th className="text-left p-3">{R ? "البريد" : "Email"}</th><th className="text-left p-3">{R ? "الدور" : "Role"}</th><th className="text-left p-3">{R ? "الحالة" : "Status"}</th><th className="text-left p-3">{R ? "ينتهي" : "Expires"}</th><th className="p-3 w-24"/></tr></thead>
                    <tbody>
                      {invites.map(i=>(
                        <tr key={i.id} className="border-t border-border hover:bg-secondary/20">
                          <td className="p-3">{i.email}</td>
                          <td className="p-3"><Badge className={`text-[10px] border ${RC[i.role]||"bg-muted border-border"}`}>{i.role}</Badge></td>
                          <td className="p-3"><Badge variant={i.accepted_at?"default":"secondary"} className="text-[10px]">{i.accepted_at?(R?"✓ مقبولة":"✓ Accepted"):(R?"⏳ معلقة":"⏳ Pending")}</Badge></td>
                          <td className="p-3 text-xs text-muted-foreground">{i.expires_at?new Date(i.expires_at).toLocaleDateString():"—"}</td>
                          <td className="p-3 flex gap-1">
                            {!i.accepted_at&&<Button size="sm" variant="ghost" onClick={()=>{navigator.clipboard.writeText(`${location.origin}/accept-invite/${i.token}`);toast.success(R?"تم نسخ الرابط":"Link copied");}}><Copy className="w-3.5 h-3.5"/></Button>}
                            <Button size="sm" variant="ghost" onClick={async()=>{await teamApi.revoke(i.id);toast.success(R?"تم السحب":"Revoked");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="roles">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <div className="relative"><Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground"/><Input placeholder={R ? "فلتر الدور أو المورد…" : "Filter role or resource…"} value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 w-64"/></div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={seedDefaults}><UserCheck className="w-4 h-4 mr-1"/>{R ? "تطبيق الافتراضيات" : "Seed Defaults"}</Button>
                    <ExportButton data={rolePerms} filename="role_permissions" title={R ? "صلاحيات الأدوار" : "Role Permissions"}/>
                    <Button size="sm" onClick={()=>{setRpId(null);setRpForm(emptyRP);setRpOpen(true);}}><Plus className="w-4 h-4 mr-1"/>{R ? "إضافة قاعدة" : "Add Rule"}</Button>
                  </div>
                </div>
                <Card className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs"><tr><th className="text-left p-3">{R?"الدور":"Role"}</th><th className="text-left p-3">{R?"المورد":"Resource"}</th><th className="p-3 text-center">{R?"قراءة":"Read"}</th><th className="p-3 text-center">{R?"إنشاء":"Create"}</th><th className="p-3 text-center">{R?"تعديل":"Update"}</th><th className="p-3 text-center">{R?"حذف":"Delete"}</th><th className="p-3 text-center">{R?"تصدير":"Export"}</th><th className="p-3 text-center">{R?"موافقة":"Approve"}</th><th className="p-3 w-20"/></tr></thead>
                    <tbody>
                      {frp.length===0?<tr><td colSpan={9} className="p-10 text-center text-muted-foreground text-sm">{R ? 'لا توجد قواعد بعد. اضغط "تطبيق الافتراضيات" للتعبئة التلقائية.' : 'No rules yet. Click "Seed Defaults" to auto-populate.'}</td></tr>:frp.map(r=>(
                        <tr key={r.id} className="border-t border-border hover:bg-secondary/20">
                          <td className="p-3"><Badge className={`text-[10px] border ${RC[r.role]||"bg-muted border-border"}`}>{r.role}</Badge></td>
                          <td className="p-3 text-xs font-mono">{r.resource_type}</td>
                          <td className="p-3 text-center"><Dot v={r.can_read}/></td>
                          <td className="p-3 text-center"><Dot v={r.can_create}/></td>
                          <td className="p-3 text-center"><Dot v={r.can_update}/></td>
                          <td className="p-3 text-center"><Dot v={r.can_delete}/></td>
                          <td className="p-3 text-center"><Dot v={r.can_export}/></td>
                          <td className="p-3 text-center"><Dot v={r.can_approve}/></td>
                          <td className="p-3 flex gap-1">
                            <Button size="sm" variant="ghost" onClick={()=>{setRpId(r.id);setRpForm({role:r.role,resource_type:r.resource_type,can_read:r.can_read,can_create:r.can_create,can_update:r.can_update,can_delete:r.can_delete,can_export:r.can_export,can_approve:r.can_approve});setRpOpen(true);}}><Edit className="w-3.5 h-3.5"/></Button>
                            <Button size="sm" variant="ghost" onClick={async()=>{await extApi.remove("role_permissions",r.id);toast.success("Deleted");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sectors">
              <div className="space-y-3">
                <div className="flex justify-end gap-2">
                  <ExportButton data={sectorPerms} filename="sector_permissions" title={R ? "صلاحيات القطاعات" : "Sector Permissions"}/>
                  <Button size="sm" onClick={()=>{setSpId(null);setSpForm({...emptySP,brand_id:brandId});setSpOpen(true);}}><Plus className="w-4 h-4 mr-1"/>{R ? "إضافة قاعدة قطاع" : "Add Sector Rule"}</Button>
                </div>
                {sectorPerms.length===0?<Card className="p-10 text-center text-sm text-muted-foreground">{R ? "لا توجد صلاحيات قطاعات. امنح وصولاً لكل مستخدم وقطاع هنا." : "No sector permissions. Grant per-user, per-sector access here."}</Card>:(
                  <div className="space-y-2">
                    {sectorPerms.map(s=>(
                      <Card key={s.id} className="p-4 bg-card border-border">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/30">{s.sector}</Badge>
                              {s.ai_managed&&<Badge className="text-[10px] bg-purple-500/20 text-purple-400">{R?"مُدار بالذكاء الاصطناعي":"AI Managed"}</Badge>}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">{s.target_user_id||"—"}</p>
                            <div className="flex gap-2 flex-wrap text-[10px]">
                              {s.can_read&&<span className="text-emerald-400">✓ {R?"قراءة":"Read"}</span>}
                              {s.can_write&&<span className="text-blue-400">✓ {R?"كتابة":"Write"}</span>}
                              {s.can_delete&&<span className="text-red-400">✓ {R?"حذف":"Delete"}</span>}
                              {s.can_approve&&<span className="text-yellow-400">✓ {R?"موافقة":"Approve"}</span>}
                              {s.can_export&&<span className="text-cyan-400">✓ {R?"تصدير":"Export"}</span>}
                            </div>
                            {Array.isArray(s.ai_agent_codes)&&s.ai_agent_codes.length>0&&<p className="text-[10px] text-purple-400">{R?"وكلاء":"Agents"}: {s.ai_agent_codes.join(", ")}</p>}
                            {s.notes&&<p className="text-xs text-muted-foreground">{s.notes}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="ghost" onClick={()=>{setSpId(s.id);setSpForm({...s,ai_agent_codes:Array.isArray(s.ai_agent_codes)?s.ai_agent_codes.join(", "):""});setSpOpen(true);}}><Edit className="w-3.5 h-3.5"/></Button>
                            <Button size="sm" variant="ghost" onClick={async()=>{await extApi.remove("sector_permissions",s.id);toast.success("Deleted");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="agents">
              <div className="space-y-3">
                <div className="flex justify-end gap-2">
                  <ExportButton data={agentPerms} filename="agent_permissions" title={R ? "صلاحيات الوكلاء" : "Agent Permissions"}/>
                  <Button size="sm" onClick={()=>{setApId(null);setApForm({...emptyAP,brand_id:brandId});setApOpen(true);}}><Plus className="w-4 h-4 mr-1"/>{R ? "إضافة قاعدة وكيل" : "Add Agent Rule"}</Button>
                </div>
                {agentPerms.length===0?<Card className="p-10 text-center text-sm text-muted-foreground">{R ? "لا توجد صلاحيات وكلاء. حدد ما يُسمح لكل وكيل ذكاء اصطناعي بالوصول إليه." : "No agent permissions. Define what each AI agent is authorized to access."}</Card>:(
                  <div className="space-y-2">
                    {agentPerms.map(a=>(
                      <Card key={a.id} className="p-4 bg-card border-border">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Bot className="w-4 h-4 text-nile"/>
                              <span className="font-display text-sm text-primary">{a.agent_code}</span>
                              {a.sandbox_mode&&<Badge className="text-[10px] bg-yellow-500/20 text-yellow-400">{R?"وضع الاختبار":"Sandbox"}</Badge>}
                              {a.requires_approval&&<Badge className="text-[10px] bg-orange-500/20 text-orange-400">{R?"يحتاج موافقة":"Needs Approval"}</Badge>}
                              {a.can_escalate&&<Badge className="text-[10px] bg-emerald-500/20 text-emerald-400">{R?"يمكنه التصعيد":"Can Escalate"}</Badge>}
                            </div>
                            <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap">
                              {a.max_daily_ops&&<span>{R?"أقصى عمليات/يوم":"Max ops/day"}: <strong>{a.max_daily_ops}</strong></span>}
                              {!!a.max_spend_eur&&<span>{R?"حد الإنفاق":"Spend cap"}: <strong>{a.max_spend_eur} EUR</strong></span>}
                            </div>
                            {Array.isArray(a.allowed_actions)&&<p className="text-[10px] text-nile">{R?"الإجراءات":"Actions"}: {a.allowed_actions.join(", ")}</p>}
                            {Array.isArray(a.allowed_tables)&&a.allowed_tables.length>0&&<p className="text-[10px] text-muted-foreground">{R?"الجداول":"Tables"}: {a.allowed_tables.join(", ")}</p>}
                            {a.notes&&<p className="text-xs text-muted-foreground">{a.notes}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="ghost" onClick={()=>{setApId(a.id);setApForm({...a,allowed_tables:Array.isArray(a.allowed_tables)?a.allowed_tables.join(", "):"",allowed_actions:Array.isArray(a.allowed_actions)?a.allowed_actions.join(", "):"read"});setApOpen(true);}}><Edit className="w-3.5 h-3.5"/></Button>
                            <Button size="sm" variant="ghost" onClick={async()=>{await extApi.remove("agent_permissions",a.id);toast.success("Deleted");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={invOpen} onOpenChange={setInvOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{R ? "دعوة مستخدم للعلامة التجارية" : "Invite User to Brand"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>{R ? "البريد الإلكتروني" : "Email"}</Label><Input type="email" placeholder="user@example.com" value={invEmail} onChange={e=>setInvEmail(e.target.value)}/></div>
            <div><Label>{R ? "الدور" : "Role"}</Label><Select value={invRole} onValueChange={setInvRole}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ROLES.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setInvOpen(false)}>{R ? "إلغاء" : "Cancel"}</Button><Button onClick={sendInvite}><Mail className="w-4 h-4 mr-1"/>{R ? "إرسال الدعوة" : "Send Invite"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rpOpen} onOpenChange={setRpOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{rpId ? (R?"تعديل":"Edit") : (R?"إضافة":"Add")} {R ? "صلاحية دور" : "Role Permission"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{R ? "الدور" : "Role"}</Label><Select value={rpForm.role} onValueChange={v=>setRpForm((p:any)=>({...p,role:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ROLES.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>{R ? "المورد" : "Resource"}</Label><Select value={rpForm.resource_type} onValueChange={v=>setRpForm((p:any)=>({...p,resource_type:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{SECTORS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["can_read","can_create","can_update","can_delete","can_export","can_approve"] as const).map(k=>(
                <div key={k} className="flex items-center justify-between p-2 border border-border rounded"><span className="text-xs capitalize">{k.replace("can_","")}</span><Switch checked={!!rpForm[k]} onCheckedChange={v=>setRpForm((p:any)=>({...p,[k]:v}))}/></div>
              ))}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setRpOpen(false)}>{R ? "إلغاء" : "Cancel"}</Button><Button onClick={saveRP}>{R ? "حفظ" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={spOpen} onOpenChange={setSpOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{spId ? (R?"تعديل":"Edit") : (R?"إضافة":"Add")} {R ? "صلاحية قطاع" : "Sector Permission"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>{R ? "معرف المستخدم المستهدف" : "Target User ID"}</Label><Input placeholder="UUID of the user" value={spForm.target_user_id} onChange={e=>setSpForm((p:any)=>({...p,target_user_id:e.target.value}))}/></div>
            <div><Label>{R ? "القطاع" : "Sector"}</Label><Select value={spForm.sector} onValueChange={v=>setSpForm((p:any)=>({...p,sector:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{SECTORS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-2">
              {(["can_read","can_write","can_delete","can_approve","can_export","ai_managed"] as const).map(k=>(
                <div key={k} className="flex items-center justify-between p-2 border border-border rounded"><span className="text-xs capitalize">{k.replace("can_","").replace("ai_","AI ")}</span><Switch checked={!!spForm[k]} onCheckedChange={v=>setSpForm((p:any)=>({...p,[k]:v}))}/></div>
              ))}
            </div>
            <div><Label>{R ? "أكواد وكلاء الذكاء الاصطناعي (مفصولة بفواصل)" : "AI Agent Codes (comma-separated)"}</Label><Input placeholder="anubis, isis" value={spForm.ai_agent_codes} onChange={e=>setSpForm((p:any)=>({...p,ai_agent_codes:e.target.value}))}/></div>
            <div><Label>{R ? "ملاحظات" : "Notes"}</Label><Textarea rows={2} value={spForm.notes} onChange={e=>setSpForm((p:any)=>({...p,notes:e.target.value}))}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setSpOpen(false)}>{R ? "إلغاء" : "Cancel"}</Button><Button onClick={saveSP}>{R ? "حفظ" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={apOpen} onOpenChange={setApOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{apId ? (R?"تعديل":"Edit") : (R?"إضافة":"Add")} {R ? "صلاحية وكيل" : "Agent Permission"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>{R ? "كود الوكيل" : "Agent Code"}</Label><Input placeholder="e.g. anubis" value={apForm.agent_code} onChange={e=>setApForm((p:any)=>({...p,agent_code:e.target.value}))}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{R ? "أقصى عمليات يومية" : "Max Daily Ops"}</Label><Input type="number" value={apForm.max_daily_ops} onChange={e=>setApForm((p:any)=>({...p,max_daily_ops:+e.target.value}))}/></div>
              <div><Label>{R ? "حد الإنفاق (EUR)" : "Spend Cap (EUR)"}</Label><Input type="number" value={apForm.max_spend_eur} onChange={e=>setApForm((p:any)=>({...p,max_spend_eur:+e.target.value}))}/></div>
            </div>
            <div><Label>{R ? "الجداول المسموحة (مفصولة بفواصل)" : "Allowed Tables (comma-separated)"}</Label><Input placeholder="tasks, employees" value={apForm.allowed_tables} onChange={e=>setApForm((p:any)=>({...p,allowed_tables:e.target.value}))}/></div>
            <div><Label>{R ? "الإجراءات المسموحة (مفصولة بفواصل)" : "Allowed Actions (comma-separated)"}</Label><Input placeholder="read, create" value={apForm.allowed_actions} onChange={e=>setApForm((p:any)=>({...p,allowed_actions:e.target.value}))}/></div>
            <div className="grid grid-cols-3 gap-2">
              {(["can_escalate","requires_approval","sandbox_mode"] as const).map(k=>(
                <div key={k} className="flex items-center justify-between p-2 border border-border rounded"><span className="text-[10px] capitalize">{k.replace(/_/g," ")}</span><Switch checked={!!apForm[k]} onCheckedChange={v=>setApForm((p:any)=>({...p,[k]:v}))}/></div>
              ))}
            </div>
            <div><Label>{R ? "ملاحظات" : "Notes"}</Label><Textarea rows={2} value={apForm.notes} onChange={e=>setApForm((p:any)=>({...p,notes:e.target.value}))}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setApOpen(false)}>{R ? "إلغاء" : "Cancel"}</Button><Button onClick={saveAP}>{R ? "حفظ" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}