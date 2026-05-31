import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Bell, BellRing, AlertTriangle, Info, AlertCircle, Check, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { auditApi, settingsApi } from "@/services/system";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

const EMPTY_RULE = { name:"", table_name:"", field:"", operator:"lt", threshold:0, channel:"in_app", active:true };

export default function Notifications() {
  const nav = useNavigate();

  // ── Inbox state ─────────────────────────────────────────────────
  const [logs, setLogs] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all"|"unread"|"warning"|"error">("all");

  // ── Rules state ─────────────────────────────────────────────────
  const [rules, setRules] = useState<any[]>([]);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState<any>(EMPTY_RULE);

  const loadRules = async () => {
    try { const data = await tenantDb.select("notification_rules", { orderBy: "created_at", ascending: false }); setRules(data || []); }
    catch (e: any) { toast.error(e?.message || "Failed to load rules"); }
  };

  const submitRule = async () => {
    if (!form.name || !form.table_name || !form.field) return toast.error("Name, table, and field are required");
    const payload = { ...form, threshold: Number(form.threshold) };
    try {
      if (editId) await tenantDb.update("notification_rules", payload, { id: editId });
      else        await tenantDb.insert("notification_rules", payload);
    } catch (e: any) { return toast.error(e?.message || "Save failed"); }
    toast.success("Rule saved"); setRuleOpen(false); setEditId(null); setForm(EMPTY_RULE); loadRules();
  };

  const removeRule = async (id: string) => {
    try { await tenantDb.remove("notification_rules", { id }); }
    catch (e: any) { return toast.error(e?.message || "Delete failed"); }
    toast.success("Rule deleted"); loadRules();
  };

  useEffect(() => {
    Promise.all([auditApi.list(200), settingsApi.get("read_notifications")])
      .then(([l, r]) => { setLogs(l); if (Array.isArray(r)) setReadIds(r as any); });
    loadRules();
    const ch = supabase.channel("notif-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, async () => {
        setLogs(await auditApi.list(200));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const unreadCount = logs.filter(l => !readIds.includes(l.id)).length;

  const filtered = logs.filter(l => {
    if (filter === "unread")  return !readIds.includes(l.id);
    if (filter === "warning" || filter === "error") return l.level === filter;
    return true;
  });

  const markRead = async (id: string) => {
    const next = [...new Set([...readIds, id])];
    setReadIds(next);
    await settingsApi.set("read_notifications", next);
  };
  const markAll = async () => {
    const next = [...new Set([...readIds, ...logs.map(l => l.id)])];
    setReadIds(next);
    await settingsApi.set("read_notifications", next);
    toast.success("All marked as read");
  };

  const NotifIcon = ({ level }: { level: string }) =>
    level === "error"   ? <AlertCircle className="w-4 h-4 text-destructive"/> :
    level === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-400"/> :
                          <Info className="w-4 h-4 text-blue-400"/>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={()=>nav("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4"/><span className="text-sm">Back</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Bell className="w-6 h-6 text-primary"/></div>
          <div>
            <h1 className="font-display text-xl text-primary">NOTIFICATIONS</h1>
            <p className="text-xs text-muted-foreground">Notification Inbox · Automation Rules</p>
          </div>
        </div>

        <Tabs defaultValue="inbox">
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="inbox" className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5"/>Inbox
              {unreadCount > 0 && <Badge variant="destructive" className="ml-1 text-[9px] px-1.5 py-0">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5"/>Rules ({rules.length})
            </TabsTrigger>
          </TabsList>

          {/* ── INBOX TAB ─────────────────────────────────────────── */}
          <TabsContent value="inbox" className="mt-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                {(["all","unread","warning","error"] as const).map(f=>(
                  <Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)} className="text-xs">
                    {f==="all"?"All" : f==="unread"?`Unread (${unreadCount})` : f.charAt(0).toUpperCase()+f.slice(1)}
                  </Button>
                ))}
              </div>
              <Button size="sm" variant="ghost" onClick={markAll} className="gap-1.5 text-xs">
                <Check className="w-3.5 h-3.5"/>Mark All Read
              </Button>
            </div>

            <Card className="divide-y divide-border">
              {filtered.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-20"/>
                  <p>No notifications match this filter</p>
                </div>
              ) : filtered.map(n=>(
                <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-secondary/30 transition-colors ${!readIds.includes(n.id)?"bg-primary/5":""}`}>
                  <NotifIcon level={n.level}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{n.module || n.table_name || "System"}</p>
                      <Badge variant={n.level==="error"?"destructive":"outline"} className="text-[10px]">{n.level}</Badge>
                      {!readIds.includes(n.id)&&<span className="w-2 h-2 rounded-full bg-primary"/>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.action}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!readIds.includes(n.id)&&(
                    <Button size="sm" variant="ghost" onClick={()=>markRead(n.id)} title="Mark read">
                      <Check className="w-4 h-4"/>
                    </Button>
                  )}
                </div>
              ))}
            </Card>
            <p className="text-xs text-muted-foreground text-center">{filtered.length} of {logs.length} notifications</p>
          </TabsContent>

          {/* ── RULES TAB ─────────────────────────────────────────── */}
          <TabsContent value="rules" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Automate alerts when table fields meet a threshold condition.</p>
              <Button size="sm" className="gap-1.5" onClick={()=>{setEditId(null);setForm(EMPTY_RULE);setRuleOpen(true);}}>
                <Plus className="w-3.5 h-3.5"/>New Rule
              </Button>
            </div>

            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Trigger Condition</th>
                    <th className="p-3 text-left">Channel</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3"/>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">
                      <BellRing className="w-10 h-10 mx-auto mb-3 opacity-20"/>No rules yet — create one to get started
                    </td></tr>
                  ) : rules.map(r=>(
                    <tr key={r.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-semibold">{r.name}</td>
                      <td className="p-3 text-xs font-mono text-muted-foreground">
                        <span className="text-primary">{r.table_name}</span>.{r.field}
                        {" "}<Badge variant="outline" className="text-[9px] mx-1">{r.operator==="lt"?"<":r.operator==="gt"?">":"="}</Badge>
                        {r.threshold}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] capitalize">{r.channel.replace("_"," ")}</Badge>
                      </td>
                      <td className="p-3">
                        {r.active
                          ? <Badge variant="default" className="text-[10px]">Active</Badge>
                          : <Badge variant="secondary" className="text-[10px]">Paused</Badge>
                        }
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={()=>{setEditId(r.id);setForm(r);setRuleOpen(true);}}>
                            <Edit className="w-3.5 h-3.5"/>
                          </Button>
                          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={()=>removeRule(r.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive"/>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── RULE DIALOG ─────────────────────────────────────────── */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editId?"Edit":"New"} Notification Rule</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div><Label>Rule Name *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Low stock alert" className="mt-1"/></div>
            <div><Label>Table *</Label><Input value={form.table_name} onChange={e=>setForm({...form,table_name:e.target.value})} placeholder="materials" className="mt-1"/></div>
            <div><Label>Field *</Label><Input value={form.field} onChange={e=>setForm({...form,field:e.target.value})} placeholder="current_stock" className="mt-1"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Operator</Label>
                <Select value={form.operator} onValueChange={v=>setForm({...form,operator:v})}>
                  <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lt">&lt; Less than</SelectItem>
                    <SelectItem value="gt">&gt; Greater than</SelectItem>
                    <SelectItem value="eq">= Equals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Threshold</Label><Input type="number" value={form.threshold} onChange={e=>setForm({...form,threshold:e.target.value})} className="mt-1"/></div>
            </div>
            <div>
              <Label>Delivery Channel</Label>
              <Select value={form.channel} onValueChange={v=>setForm({...form,channel:v})}>
                <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-App</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-3 border border-border rounded-md">
              <Switch checked={form.active} onCheckedChange={v=>setForm({...form,active:v})}/>
              <div><p className="text-sm font-medium">Active</p><p className="text-xs text-muted-foreground">Rule will fire when condition is met</p></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setRuleOpen(false)}>Cancel</Button>
            <Button onClick={submitRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
