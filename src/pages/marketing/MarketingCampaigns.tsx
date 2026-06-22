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
import { toast } from "sonner";
import { Megaphone, Plus, Search, RefreshCcw, Pause, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES    = ["email","social","search","display","video","other"];
const STATUSES = ["draft","active","paused","ended"];

const statusColor: Record<string,string> = {
  active:  "bg-green-500/15 text-green-400 border-green-500/30",
  paused:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  draft:   "bg-muted/50 text-muted-foreground border-border",
  ended:   "bg-red-500/15 text-red-400 border-red-500/30",
};

const blank = () => ({ name: "", type: "email", status: "draft", budget: "", start_date: "", end_date: "", description: "" });

export default function MarketingCampaigns() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dlg, setDlg] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from("marketing_campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(blank()); setDlg(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, type: c.type||"email", status: c.status||"draft", budget: c.budget||"", start_date: c.start_date?.slice(0,10)||"", end_date: c.end_date?.slice(0,10)||"", description: c.description||"" }); setDlg(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error(R ? "الاسم مطلوب" : "Name is required");
    setSaving(true);
    const payload = { ...form, budget: form.budget ? Number(form.budget) : null, start_date: form.start_date || null, end_date: form.end_date || null, updated_at: new Date().toISOString() };
    let error: any;
    if (editing) ({ error } = await db.from("marketing_campaigns").update(payload).eq("id", editing.id));
    else ({ error } = await db.from("marketing_campaigns").insert({ ...payload, impressions: 0, clicks: 0, conversions: 0, spent: 0, created_at: new Date().toISOString() }));
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? (R ? "تم التحديث" : "Updated") : (R ? "تم الإضافة" : "Created"));
    setDlg(false); load();
  };

  const toggleStatus = async (c: any) => {
    const next = c.status === "active" ? "paused" : "active";
    await db.from("marketing_campaigns").update({ status: next }).eq("id", c.id);
    load();
  };

  const del = async (id: string) => {
    if (!confirm(R ? "حذف الحملة؟" : "Delete campaign?")) return;
    await db.from("marketing_campaigns").delete().eq("id", id);
    load();
  };

  const visible = campaigns.filter(c => {
    const q = search.toLowerCase();
    const match = !q || c.name?.toLowerCase().includes(q);
    const stat  = filter === "all" || c.status === filter;
    return match && stat;
  });

  return (
    <MarketingLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-pink-400" />
              {R ? "الحملات الإعلانية" : "Campaigns"}
            </h1>
            <p className="text-sm text-muted-foreground">{campaigns.length} {R ? "حملة" : "campaigns"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></Button>
            <Button size="sm" onClick={openNew} className="gap-1.5 bg-pink-600 hover:bg-pink-700"><Plus className="w-4 h-4" />{R ? "حملة جديدة" : "New Campaign"}</Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" placeholder={R ? "بحث..." : "Search..."} /></div>
          {["all", ...STATUSES].map(s => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} className={cn("h-8 text-xs", filter === s && "bg-pink-600 hover:bg-pink-700")} onClick={() => setFilter(s)}>{s === "all" ? (R ? "الكل" : "All") : s}</Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16"><Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">{R ? "لا توجد حملات" : "No campaigns found"}</p></div>
        ) : (
          <div className="space-y-2">
            {visible.map(c => (
              <Card key={c.id} className="border-border/50 hover:border-pink-500/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5", statusColor[c.status] || statusColor.draft)}>{c.status || "draft"}</Badge>
                      <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{c.type}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      {c.budget && <span>{R ? "الميزانية:" : "Budget:"} ${c.budget}</span>}
                      {c.impressions > 0 && <span>{R ? "ظهورات:" : "Impr:"} {c.impressions.toLocaleString()}</span>}
                      {c.clicks > 0 && <span>{R ? "نقرات:" : "Clicks:"} {c.clicks.toLocaleString()}</span>}
                      {c.conversions > 0 && <span>{R ? "تحويلات:" : "Conv:"} {c.conversions.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleStatus(c)} title={c.status === "active" ? (R?"إيقاف":"Pause") : (R?"تفعيل":"Activate")}>{c.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Megaphone className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => del(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dlg} onOpenChange={setDlg}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? (R ? "تعديل الحملة" : "Edit Campaign") : (R ? "حملة جديدة" : "New Campaign")}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>{R ? "اسم الحملة *" : "Campaign Name *"}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{R ? "النوع" : "Type"}</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>{R ? "الحالة" : "Status"}</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div><Label>{R ? "الميزانية ($)" : "Budget ($)"}</Label><Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{R ? "تاريخ البداية" : "Start Date"}</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="mt-1" /></div>
                <div><Label>{R ? "تاريخ النهاية" : "End Date"}</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDlg(false)}>{R ? "إلغاء" : "Cancel"}</Button><Button onClick={save} disabled={saving} className="bg-pink-600 hover:bg-pink-700">{saving ? "…" : (R ? "حفظ" : "Save")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MarketingLayout>
  );
}
