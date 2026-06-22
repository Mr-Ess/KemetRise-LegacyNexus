import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import MarketingLayout from "@/layouts/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Zap, Plus, RefreshCcw, Play, Pause, Trash2, ToggleLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const TRIGGERS = ["new_lead","form_submit","purchase","page_visit","email_open","custom"];
const ACTIONS  = ["send_email","send_sms","add_tag","notify_team","create_task","webhook","custom"];

const blank = () => ({ name: "", trigger_table: "marketing_leads", trigger_event: "INSERT", enabled: true, description: "" });

export default function MarketingAutomation() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from("automations").select("*").order("created_at", { ascending: false });
    setRules(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setEditing(null); setForm(blank()); setDlg(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ name: r.name||"", trigger_table: r.trigger_table||"marketing_leads", trigger_event: r.trigger_event||"INSERT", enabled: r.enabled !== false, description: r.description||"" }); setDlg(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error(R ? "الاسم مطلوب" : "Name required");
    setSaving(true);
    const payload = { name: form.name, trigger_table: form.trigger_table, trigger_event: form.trigger_event, enabled: form.enabled, conditions: {}, actions: {}, updated_at: new Date().toISOString() };
    let error: any;
    if (editing) ({ error } = await db.from("automations").update(payload).eq("id", editing.id));
    else ({ error } = await db.from("automations").insert({ ...payload, run_count: 0, created_at: new Date().toISOString() }));
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الحفظ" : "Saved");
    setDlg(false); load();
  };

  const toggle = async (r: any) => {
    await db.from("automations").update({ enabled: !r.enabled }).eq("id", r.id);
    load();
  };

  const del = async (id: string) => {
    if (!confirm(R ? "حذف؟" : "Delete?")) return;
    await db.from("automations").delete().eq("id", id);
    load();
  };

  const active = rules.filter(r => r.enabled).length;

  return (
    <MarketingLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Zap className="w-6 h-6 text-pink-400" />
              {R ? "التشغيل الآلي" : "Automation"}
            </h1>
            <p className="text-sm text-muted-foreground">{active} {R ? "قاعدة نشطة" : "active rules"} / {rules.length} {R ? "إجمالي" : "total"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></Button>
            <Button size="sm" onClick={openNew} className="gap-1.5 bg-pink-600 hover:bg-pink-700"><Plus className="w-4 h-4" />{R ? "قاعدة جديدة" : "New Rule"}</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: R ? "الإجمالي"    : "Total Rules", val: rules.length,  color: "text-pink-400"  },
            { label: R ? "نشطة"        : "Active",      val: active,         color: "text-green-400" },
            { label: R ? "إجمالي التشغيل" : "Total Runs", val: rules.reduce((s,r)=>s+(r.run_count||0),0).toLocaleString(), color: "text-blue-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4">
                <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16"><Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">{R ? "لا توجد قواعد آلية" : "No automation rules yet"}</p></div>
        ) : (
          <div className="space-y-2">
            {rules.map(r => (
              <Card key={r.id} className={cn("border-border/50 transition-colors", r.enabled ? "hover:border-pink-500/30" : "opacity-60")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Zap className={cn("w-4 h-4 shrink-0", r.enabled ? "text-pink-400" : "text-muted-foreground/40")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="bg-muted/50 px-1.5 py-0.5 rounded">{R ? "جدول:" : "Table:"} {r.trigger_table}</span>
                      <span className="bg-muted/50 px-1.5 py-0.5 rounded">{R ? "حدث:" : "Event:"} {r.trigger_event}</span>
                      {r.run_count > 0 && <span>{R ? "تشغيلات:" : "Runs:"} {r.run_count}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={r.enabled} onCheckedChange={() => toggle(r)} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Zap className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => del(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dlg} onOpenChange={setDlg}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? (R ? "تعديل القاعدة" : "Edit Rule") : (R ? "قاعدة جديدة" : "New Automation Rule")}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>{R ? "الاسم *" : "Name *"}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{R ? "الجدول" : "Table"}</Label><Input value={form.trigger_table} onChange={e => setForm({ ...form, trigger_table: e.target.value })} className="mt-1" placeholder="e.g. marketing_leads" /></div>
                <div><Label>{R ? "الحدث" : "Event"}</Label><Select value={form.trigger_event} onValueChange={v => setForm({ ...form, trigger_event: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INSERT">INSERT</SelectItem><SelectItem value="UPDATE">UPDATE</SelectItem><SelectItem value="DELETE">DELETE</SelectItem></SelectContent></Select></div>
              </div>
              <div className="flex items-center gap-3"><Label>{R ? "مفعلة" : "Enabled"}</Label><Switch checked={form.enabled} onCheckedChange={v => setForm({ ...form, enabled: v })} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDlg(false)}>{R ? "إلغاء" : "Cancel"}</Button><Button onClick={save} disabled={saving} className="bg-pink-600 hover:bg-pink-700">{saving ? "…" : (R ? "حفظ" : "Save")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MarketingLayout>
  );
}
