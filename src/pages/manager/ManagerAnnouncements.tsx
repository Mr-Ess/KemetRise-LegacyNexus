import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import ManagerLayout from "@/layouts/ManagerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, Plus, RefreshCcw, Bell, CheckCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// We use the notifications table for team announcements
const TYPE_COLOR: Record<string, string> = {
  announcement: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  task_assigned: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  alert:        "text-red-400 border-red-400/30 bg-red-400/10",
  info:         "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

const empty = { title: "", message: "", type: "announcement", assignee_ref: "" };

export default function ManagerAnnouncements() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [typeFilter, setTypeFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data } = await db
      .from("notifications")
      .select("*")
      .in("type", ["announcement", "alert", "info", "task_assigned"])
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = typeFilter === "all" ? items : items.filter(n => n.type === typeFilter);

  const send = async () => {
    if (!form.title.trim()) return toast.error(R ? "العنوان مطلوب" : "Title required");
    const { error } = await db.from("notifications").insert({ ...form, is_read: false });
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الإرسال" : "Announcement sent");
    setModal(false);
    setForm(empty);
    load();
  };

  const markRead = async (id: string) => {
    await db.from("notifications").update({ is_read: true }).eq("id", id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const remove = async (id: string) => {
    await db.from("notifications").delete().eq("id", id);
    setItems(prev => prev.filter(n => n.id !== id));
    toast.success(R ? "تم الحذف" : "Deleted");
  };

  const fmt = (s: string) =>
    new Date(s).toLocaleString(R ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const unread = items.filter(n => !n.is_read).length;

  return (
    <ManagerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-400" />
              {R ? "الإعلانات" : "Announcements"}
              {unread > 0 && <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">{unread}</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {R ? "إعلان" : "announcements"} — {unread} {R ? "غير مقروء" : "unread"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={() => setModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />{R ? "إعلان جديد" : "New Announcement"}
            </Button>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "announcement", "task_assigned", "alert", "info"] as const).map(t => (
            <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)}>
              {t === "all" ? (R ? "الكل" : "All")
                : t === "announcement" ? (R ? "إعلانات" : "Announcements")
                : t === "task_assigned" ? (R ? "مهام" : "Tasks")
                : t === "alert" ? (R ? "تنبيهات" : "Alerts")
                : (R ? "معلومات" : "Info")}
            </Button>
          ))}
        </div>

        {/* Announcements List */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{R ? "لا توجد إعلانات" : "No announcements"}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map(n => (
                  <div key={n.id} className={cn("flex items-start gap-4 px-4 py-4 hover:bg-muted/10 transition-colors", !n.is_read && "bg-emerald-500/5")}>
                    <div className="mt-0.5">
                      {!n.is_read
                        ? <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />
                        : <CheckCircle className="w-4 h-4 text-muted-foreground/40" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium", !n.is_read && "font-semibold")}>{n.title}</p>
                        <Badge variant="outline" className={cn("text-xs shrink-0", TYPE_COLOR[n.type] ?? "")}>
                          {n.type}
                        </Badge>
                      </div>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">{fmt(n.created_at)}</span>
                        {n.assignee_ref && <span className="text-[10px] text-muted-foreground">→ {n.assignee_ref}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!n.is_read && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300" onClick={() => markRead(n.id)} title={R ? "تعليم كمقروء" : "Mark as read"}>
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(n.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Announcement Modal */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{R ? "إعلان جديد" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{R ? "العنوان *" : "Title *"}</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>{R ? "الرسالة" : "Message"}</Label>
              <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{R ? "النوع" : "Type"}</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">{R ? "إعلان" : "Announcement"}</SelectItem>
                    <SelectItem value="task_assigned">{R ? "مهمة" : "Task"}</SelectItem>
                    <SelectItem value="alert">{R ? "تنبيه" : "Alert"}</SelectItem>
                    <SelectItem value="info">{R ? "معلومة" : "Info"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{R ? "المستلم" : "Recipient"}</Label>
                <Input
                  value={form.assignee_ref}
                  onChange={e => setForm({ ...form, assignee_ref: e.target.value })}
                  placeholder={R ? "الاسم أو الإيميل" : "Name or email"}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={send} className="bg-emerald-600 hover:bg-emerald-700">{R ? "إرسال" : "Send"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  );
}
