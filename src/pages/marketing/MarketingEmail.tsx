import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import MarketingLayout from "@/layouts/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Plus, Search, RefreshCcw, Send, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = ["draft","scheduled","sent","failed"];
const statusColor: Record<string,string> = {
  draft:     "bg-muted/50 text-muted-foreground",
  scheduled: "bg-yellow-500/15 text-yellow-400",
  sent:      "bg-green-500/15 text-green-400",
  failed:    "bg-red-500/15 text-red-400",
};

const blank = () => ({ subject: "", preview_text: "", status: "draft", scheduled_at: "", recipient_count: "", open_rate: "", click_rate: "" });

export default function MarketingEmail() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dlg, setDlg] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank());
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, sent: 0, avgOpen: 0, avgClick: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from("marketing_campaigns").select("*").eq("type", "email").order("created_at", { ascending: false });
    const list = data ?? [];
    setEmails(list);
    const sent = list.filter((e: any) => e.status === "sent");
    setStats({
      total: list.length,
      sent: sent.length,
      avgOpen: sent.length > 0 ? sent.reduce((s: number, e: any) => s + (e.open_rate || 0), 0) / sent.length : 0,
      avgClick: sent.length > 0 ? sent.reduce((s: number, e: any) => s + (e.click_rate || 0), 0) / sent.length : 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setEditing(null); setForm(blank()); setDlg(true); };
  const openEdit = (e: any) => { setEditing(e); setForm({ subject: e.subject||"", preview_text: e.preview_text||"", status: e.status||"draft", scheduled_at: e.scheduled_at?.slice(0,16)||"", recipient_count: e.recipient_count||"", open_rate: e.open_rate||"", click_rate: e.click_rate||"" }); setDlg(true); };

  const save = async () => {
    if (!form.subject.trim()) return toast.error(R ? "الموضوع مطلوب" : "Subject required");
    setSaving(true);
    const payload = { ...form, scheduled_at: form.scheduled_at || null, recipient_count: form.recipient_count ? Number(form.recipient_count) : null, open_rate: form.open_rate ? Number(form.open_rate) : null, click_rate: form.click_rate ? Number(form.click_rate) : null, updated_at: new Date().toISOString() };
    let error: any;
    if (editing) ({ error } = await db.from("marketing_campaigns").update(payload).eq("id", editing.id));
    else ({ error } = await db.from("marketing_campaigns").insert({ ...payload, type: "email", created_at: new Date().toISOString() }));
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الحفظ" : "Saved");
    setDlg(false); load();
  };

  const del = async (id: string) => {
    if (!confirm(R ? "حذف الحملة البريدية؟" : "Delete email?")) return;
    await db.from("marketing_campaigns").delete().eq("id", id);
    load();
  };

  const visible = emails.filter(e => !search || e.subject?.toLowerCase().includes(search.toLowerCase()));

  return (
    <MarketingLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Mail className="w-6 h-6 text-pink-400" />
              {R ? "البريد الإلكتروني" : "Email Marketing"}
            </h1>
            <p className="text-sm text-muted-foreground">{stats.total} {R ? "حملة بريدية" : "campaigns"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></Button>
            <Button size="sm" onClick={openNew} className="gap-1.5 bg-pink-600 hover:bg-pink-700"><Plus className="w-4 h-4" />{R ? "حملة جديدة" : "New Email"}</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: R ? "الإجمالي" : "Total",         val: stats.total,                   color: "text-pink-400"   },
            { label: R ? "مُرسلة"   : "Sent",           val: stats.sent,                    color: "text-green-400"  },
            { label: R ? "معدل الفتح"   : "Avg Open",   val: `${stats.avgOpen.toFixed(1)}%`,color: "text-blue-400"   },
            { label: R ? "معدل النقر"   : "Avg Click",  val: `${stats.avgClick.toFixed(1)}%`,color:"text-indigo-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs max-w-64" placeholder={R ? "بحث بالموضوع..." : "Search by subject..."} /></div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16"><Mail className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">{R ? "لا توجد حملات بريدية" : "No email campaigns"}</p></div>
        ) : (
          <div className="space-y-2">
            {visible.map(e => (
              <Card key={e.id} className="border-border/50 hover:border-pink-500/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <Mail className="w-4 h-4 text-pink-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{e.subject}</p>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", statusColor[e.status] || statusColor.draft)}>{e.status}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      {e.recipient_count && <span>{R ? "المستلمون:" : "Recipients:"} {e.recipient_count.toLocaleString()}</span>}
                      {e.open_rate && <span>{R ? "الفتح:" : "Open:"} {e.open_rate}%</span>}
                      {e.click_rate && <span>{R ? "النقر:" : "Click:"} {e.click_rate}%</span>}
                      {e.scheduled_at && <span>{R ? "مجدول:" : "Scheduled:"} {new Date(e.scheduled_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => del(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dlg} onOpenChange={setDlg}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? (R ? "تعديل" : "Edit Email") : (R ? "حملة بريدية جديدة" : "New Email Campaign")}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>{R ? "الموضوع *" : "Subject *"}</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-1" /></div>
              <div><Label>{R ? "نص المعاينة" : "Preview Text"}</Label><Input value={form.preview_text} onChange={e => setForm({ ...form, preview_text: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{R ? "الحالة" : "Status"}</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>{R ? "عدد المستلمين" : "Recipients"}</Label><Input type="number" value={form.recipient_count} onChange={e => setForm({ ...form, recipient_count: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label>{R ? "موعد الإرسال" : "Scheduled At"}</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{R ? "معدل الفتح (%)" : "Open Rate (%)"}</Label><Input type="number" value={form.open_rate} onChange={e => setForm({ ...form, open_rate: e.target.value })} className="mt-1" /></div>
                <div><Label>{R ? "معدل النقر (%)" : "Click Rate (%)"}</Label><Input type="number" value={form.click_rate} onChange={e => setForm({ ...form, click_rate: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDlg(false)}>{R ? "إلغاء" : "Cancel"}</Button><Button onClick={save} disabled={saving} className="bg-pink-600 hover:bg-pink-700">{saving ? "…" : (R ? "حفظ" : "Save")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MarketingLayout>
  );
}
