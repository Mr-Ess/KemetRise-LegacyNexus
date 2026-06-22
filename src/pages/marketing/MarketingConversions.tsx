import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import MarketingLayout from "@/layouts/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Target, Plus, Search, RefreshCcw, ArrowRight, Trash2, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = ["new","contacted","qualified","proposal","negotiation","won","lost"];
const stageColor: Record<string,string> = {
  new:          "bg-blue-500/15 text-blue-400",
  contacted:    "bg-indigo-500/15 text-indigo-400",
  qualified:    "bg-purple-500/15 text-purple-400",
  proposal:     "bg-yellow-500/15 text-yellow-400",
  negotiation:  "bg-orange-500/15 text-orange-400",
  won:          "bg-green-500/15 text-green-400",
  lost:         "bg-red-500/15 text-red-400",
};
const blank = () => ({ name: "", email: "", phone: "", source: "", stage: "new", value: "", notes: "" });

export default function MarketingConversions() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [dlg, setDlg] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from("marketing_leads").select("*").order("created_at", { ascending: false });
    setLeads(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setEditing(null); setForm(blank()); setDlg(true); };
  const openEdit = (l: any) => { setEditing(l); setForm({ name: l.name||"", email: l.email||"", phone: l.phone||"", source: l.source||"", stage: l.status||"new", value: l.estimated_value||"", notes: l.notes||"" }); setDlg(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error(R ? "الاسم مطلوب" : "Name required");
    setSaving(true);
    const payload = { name: form.name, email: form.email, phone: form.phone, source: form.source, status: form.stage, estimated_value: form.value ? Number(form.value) : null, notes: form.notes, updated_at: new Date().toISOString() };
    let error: any;
    if (editing) ({ error } = await db.from("marketing_leads").update(payload).eq("id", editing.id));
    else ({ error } = await db.from("marketing_leads").insert({ ...payload, created_at: new Date().toISOString() }));
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الحفظ" : "Saved");
    setDlg(false); load();
  };

  const advance = async (l: any) => {
    const idx = STAGES.indexOf(l.status || "new");
    const next = STAGES[Math.min(idx + 1, STAGES.length - 1)];
    await db.from("marketing_leads").update({ status: next }).eq("id", l.id);
    load();
  };

  const del = async (id: string) => {
    if (!confirm(R ? "حذف العميل المحتمل؟" : "Delete lead?")) return;
    await db.from("marketing_leads").delete().eq("id", id);
    load();
  };

  const visible = leads.filter(l => {
    const q = search.toLowerCase();
    const nm = (l.name || "").toLowerCase();
    const st = l.status || "new";
    return (!q || nm.includes(q) || (l.email||"").toLowerCase().includes(q)) && (stageFilter === "all" || st === stageFilter);
  });

  const wonCount   = leads.filter(l => l.status === "won").length;
  const cvr        = leads.length > 0 ? (wonCount / leads.length * 100).toFixed(1) : "0";
  const totalValue = leads.filter(l => l.status === "won").reduce((s,l)=>s+(l.estimated_value||0),0);

  return (
    <MarketingLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Target className="w-6 h-6 text-pink-400" />
              {R ? "معدلات التحويل" : "Conversions"}
            </h1>
            <p className="text-sm text-muted-foreground">{leads.length} {R ? "عميل محتمل" : "leads"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></Button>
            <Button size="sm" onClick={openNew} className="gap-1.5 bg-pink-600 hover:bg-pink-700"><Plus className="w-4 h-4" />{R ? "عميل جديد" : "New Lead"}</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: R ? "الإجمالي" : "Total Leads",  val: leads.length,         color: "text-pink-400"   },
            { label: R ? "محولون"   : "Won",           val: wonCount,             color: "text-green-400"  },
            { label: R ? "معدل التحويل" : "CVR",       val: `${cvr}%`,            color: "text-blue-400"   },
            { label: R ? "إجمالي القيمة" : "Won Value",val: `$${totalValue.toLocaleString()}`, color: "text-indigo-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stage filter */}
        <div className="flex gap-1.5 flex-wrap">
          {["all", ...STAGES].map(s => (
            <Button key={s} size="sm" variant={stageFilter === s ? "default" : "outline"} className={cn("h-7 text-xs", stageFilter === s && "bg-pink-600 hover:bg-pink-700")} onClick={() => setStageFilter(s)}>{s === "all" ? (R ? "الكل" : "All") : s}</Button>
          ))}
        </div>

        <div className="relative max-w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" placeholder={R ? "بحث..." : "Search..."} /></div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16"><Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">{R ? "لا توجد بيانات" : "No leads found"}</p></div>
        ) : (
          <div className="space-y-2">
            {visible.map(l => {
              const st = l.stage || l.status || "new";
              return (
                <Card key={l.id} className="border-border/50 hover:border-pink-500/30 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{l.name || l.contact_name}</p>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", stageColor[st] || stageColor.new)}>{st}</span>
                        {(l.value || l.deal_value) && <span className="text-xs text-muted-foreground">${(l.value||l.deal_value).toLocaleString()}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{l.email} {l.source ? `· ${l.source}` : ""}</p>
                    </div>
                    <div className="flex gap-1">
                      {!["won","lost"].includes(st) && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => advance(l)} title={R ? "التقدم" : "Advance"}><ArrowRight className="w-3.5 h-3.5" /></Button>}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(l)}><Target className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => del(l.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dlg} onOpenChange={setDlg}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? (R ? "تعديل العميل" : "Edit Lead") : (R ? "عميل محتمل جديد" : "New Lead")}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>{R ? "الاسم *" : "Name *"}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{R ? "البريد" : "Email"}</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
                <div><Label>{R ? "الهاتف" : "Phone"}</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{R ? "المصدر" : "Source"}</Label><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="mt-1" placeholder="google, facebook…" /></div>
                <div><Label>{R ? "القيمة ($)" : "Value ($)"}</Label><Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label>{R ? "المرحلة" : "Stage"}</Label><Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>{R ? "ملاحظات" : "Notes"}</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDlg(false)}>{R ? "إلغاء" : "Cancel"}</Button><Button onClick={save} disabled={saving} className="bg-pink-600 hover:bg-pink-700">{saving ? "…" : (R ? "حفظ" : "Save")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MarketingLayout>
  );
}
