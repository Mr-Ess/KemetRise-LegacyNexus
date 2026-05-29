import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Zap, Trash2, Edit, Play, Activity } from "lucide-react";

const TABLES = ["brands","customers","clients","projects","tasks","employees","branches","services","marketing_campaigns","transactions"];
const EVENTS = ["insert","update","delete"];
const ACTION_TYPES = ["notify","webhook","email","log","tag"];

type Automation = {
  id: string; name: string; description: string | null; trigger_table: string;
  trigger_event: string; conditions: any[]; actions: any[]; enabled: boolean;
  run_count: number; last_run_at: string | null; created_at: string;
};

const empty = { name: "", description: "", trigger_table: "brands", trigger_event: "insert", conditions: [], actions: [{ type: "notify", value: "" }], enabled: true };

const AutomationBuilder = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [list, setList] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [runs, setRuns] = useState<any[]>([]);
  const [showRuns, setShowRuns] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await tenantDb.select("automations", { orderBy: "created_at", ascending: false });
      setList((data as any) || []);
    } catch {
      toast.error("فشل تحميل الأتمتات");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (a: Automation) => { setEditing(a); setForm({ ...a, conditions: a.conditions || [], actions: a.actions || [] }); setOpen(true); };

  const save = async () => {
    if (!form.name?.trim()) return toast.error("الاسم مطلوب");
    const payload = { ...form };
    try {
      if (editing) await tenantDb.update("automations", payload, { id: editing.id });
      else await tenantDb.insert("automations", payload);
    } catch (error: any) {
      return toast.error("فشل الحفظ: " + (error?.message || ""));
    }
    toast.success(editing ? "تم التحديث" : "تم الإنشاء");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    try {
      await tenantDb.remove("automations", { id });
    } catch {
      return toast.error("فشل الحذف");
    }
    toast.success("تم الحذف");
    load();
  };

  const toggle = async (a: Automation) => {
    try {
      await tenantDb.update("automations", { enabled: !a.enabled }, { id: a.id });
    } catch {
      return toast.error("فشل التحديث");
    }
    load();
  };

  const runNow = async (a: Automation) => {
    await tenantDb.insert("automation_runs", { automation_id: a.id, status: "success", payload: { manual: true } });
    await tenantDb.update("automations", { run_count: (a.run_count || 0) + 1, last_run_at: new Date().toISOString() }, { id: a.id });
    toast.success("تم تنفيذ الأتمتة");
    load();
  };

  const viewRuns = async (id: string) => {
    setShowRuns(id);
    const data = await tenantDb.select("automation_runs", { eq: { automation_id: id }, orderBy: "created_at", ascending: false, limit: 50 });
    setRuns(data || []);
  };

  const addCondition = () => setForm({ ...form, conditions: [...form.conditions, { field: "", operator: "=", value: "" }] });
  const updateCondition = (i: number, key: string, value: string) => {
    const c = [...form.conditions]; c[i] = { ...c[i], [key]: value }; setForm({ ...form, conditions: c });
  };
  const removeCondition = (i: number) => setForm({ ...form, conditions: form.conditions.filter((_: any, x: number) => x !== i) });

  const addAction = () => setForm({ ...form, actions: [...form.actions, { type: "notify", value: "" }] });
  const updateAction = (i: number, key: string, value: string) => {
    const a = [...form.actions]; a[i] = { ...a[i], [key]: value }; setForm({ ...form, actions: a });
  };
  const removeAction = (i: number) => setForm({ ...form, actions: form.actions.filter((_: any, x: number) => x !== i) });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display text-primary flex items-center gap-2"><Zap className="h-6 w-6" /> Workflow Automation</h1>
              <p className="text-sm text-muted-foreground">بناء قواعد if/then بدون كود</p>
            </div>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> أتمتة جديدة</Button>
          </div>

          {loading ? (
            <div className="grid gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : list.length === 0 ? (
            <Card className="p-12 text-center">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-display text-lg mb-2">مفيش أتمتات لسه</h3>
              <p className="text-sm text-muted-foreground mb-4">ابني أول workflow ليك علشان تؤتمت المهام المتكررة</p>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> ابدأ دلوقتي</Button>
            </Card>
          ) : (
            <div className="grid gap-3">
              {list.map(a => (
                <Card key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-base">{a.name}</h3>
                        <Badge variant={a.enabled ? "default" : "secondary"}>{a.enabled ? "نشط" : "متوقف"}</Badge>
                        <Badge variant="outline">{a.trigger_event} على {a.trigger_table}</Badge>
                        <Badge variant="outline" className="gap-1"><Activity className="h-3 w-3" /> {a.run_count} تشغيل</Badge>
                      </div>
                      {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                      <div className="text-[10px] text-muted-foreground mt-2">
                        {(a.conditions?.length || 0)} شرط · {(a.actions?.length || 0)} إجراء
                        {a.last_run_at && ` · آخر تشغيل: ${new Date(a.last_run_at).toLocaleString("ar-EG")}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={a.enabled} onCheckedChange={() => toggle(a)} />
                      <Button size="sm" variant="ghost" onClick={() => runNow(a)} title="تشغيل الآن"><Play className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => viewRuns(a.id)} title="السجل"><Activity className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الأتمتة؟</AlertDialogTitle>
                            <AlertDialogDescription>لا يمكن التراجع. سيتم حذف "{a.name}" والسجل بتاعها.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(a.id)}>حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Form Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "تعديل الأتمتة" : "أتمتة جديدة"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="الاسم" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Textarea placeholder="الوصف (اختياري)" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">عند الجدول</label>
                    <Select value={form.trigger_table} onValueChange={v => setForm({ ...form, trigger_table: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">الحدث</label>
                    <Select value={form.trigger_event} onValueChange={v => setForm({ ...form, trigger_event: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EVENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border border-border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-display">الشروط (IF)</label>
                    <Button size="sm" variant="outline" onClick={addCondition}><Plus className="h-3 w-3" /></Button>
                  </div>
                  {form.conditions.length === 0 && <p className="text-xs text-muted-foreground">بدون شروط = ينفذ دائماً</p>}
                  {form.conditions.map((c: any, i: number) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 mb-2">
                      <Input placeholder="الحقل" value={c.field} onChange={e => updateCondition(i, "field", e.target.value)} />
                      <Select value={c.operator} onValueChange={v => updateCondition(i, "operator", v)}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["=","!=",">","<","contains"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="القيمة" value={c.value} onChange={e => updateCondition(i, "value", e.target.value)} />
                      <Button size="sm" variant="ghost" onClick={() => removeCondition(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>

                <div className="border border-border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-display">الإجراءات (THEN)</label>
                    <Button size="sm" variant="outline" onClick={addAction}><Plus className="h-3 w-3" /></Button>
                  </div>
                  {form.actions.map((a: any, i: number) => (
                    <div key={i} className="grid grid-cols-[150px_1fr_auto] gap-2 mb-2">
                      <Select value={a.type} onValueChange={v => updateAction(i, "type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input placeholder="القيمة (نص الإشعار / URL / إلخ)" value={a.value} onChange={e => updateAction(i, "value", e.target.value)} />
                      <Button size="sm" variant="ghost" onClick={() => removeAction(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={form.enabled} onCheckedChange={v => setForm({ ...form, enabled: v })} />
                  <label className="text-sm">تفعيل فوراً</label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button onClick={save}>{editing ? "تحديث" : "إنشاء"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Runs Dialog */}
          <Dialog open={!!showRuns} onOpenChange={() => setShowRuns(null)}>
            <DialogContent className="max-w-xl max-h-[80vh] overflow-auto">
              <DialogHeader><DialogTitle>سجل التشغيل</DialogTitle></DialogHeader>
              {runs.length === 0 ? <p className="text-sm text-muted-foreground">مفيش تشغيلات بعد</p> : (
                <div className="space-y-2">
                  {runs.map(r => (
                    <div key={r.id} className="border border-border rounded p-2 text-xs">
                      <div className="flex justify-between">
                        <Badge variant={r.status === "success" ? "default" : "destructive"}>{r.status}</Badge>
                        <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("ar-EG")}</span>
                      </div>
                      {r.error && <p className="text-destructive mt-1">{r.error}</p>}
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default AutomationBuilder;
