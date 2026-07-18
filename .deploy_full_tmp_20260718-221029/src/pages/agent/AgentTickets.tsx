import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AgentLayout from "@/layouts/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Ticket, Plus, MessageSquare, RefreshCcw, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIO_STYLE: Record<string, string> = {
  low:    "text-muted-foreground bg-muted border-border",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  high:   "text-orange-400 bg-orange-500/10 border-orange-500/30",
  urgent: "text-red-400 bg-red-500/10 border-red-500/30",
};
const STATUS_STYLE: Record<string, string> = {
  open:        "text-blue-400 bg-blue-500/10 border-blue-500/30",
  in_progress: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  resolved:    "text-green-400 bg-green-500/10 border-green-500/30",
  closed:      "text-muted-foreground bg-muted border-border",
};
const STATUS_AR: Record<string, string> = { open: "مفتوح", in_progress: "قيد المعالجة", resolved: "محلول", closed: "مغلق" };
const PRIO_AR: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "عالي", urgent: "عاجل" };

export default function AgentTickets() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | "view" | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium" });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = db.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setTickets(data ?? []);
    setLoading(false);
  }, [user, filter]);

  useEffect(() => { load(); }, [load]);

  const openTicket = async (t: any) => {
    setSelected(t);
    setModal("view");
    const { data } = await db.from("ticket_replies").select("*").eq("ticket_id", t.id).order("created_at", { ascending: true });
    setReplies(data ?? []);
  };

  const create = async () => {
    if (!form.subject.trim()) return toast.error(R ? "العنوان مطلوب" : "Subject required");
    const { error } = await db.from("support_tickets").insert({ subject: form.subject, description: form.description, priority: form.priority, status: "open", category: "agent", user_id: user!.id });
    if (error) return toast.error(error.message);
    toast.success(R ? "تم إنشاء التذكرة" : "Ticket created");
    setForm({ subject: "", description: "", priority: "medium" });
    setModal(null);
    load();
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    const { error } = await db.from("ticket_replies").insert({ ticket_id: selected.id, message: replyText, sender_id: user!.id, is_staff: false });
    if (error) return toast.error(error.message);
    setReplyText("");
    const { data } = await db.from("ticket_replies").select("*").eq("ticket_id", selected.id).order("created_at", { ascending: true });
    setReplies(data ?? []);
  };

  return (
    <AgentLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Ticket className="w-6 h-6 text-emerald-400" />
              {R ? "تذاكر الدعم" : "Support Tickets"}
            </h1>
            <p className="text-sm text-muted-foreground">{tickets.length} {R ? "تذكرة" : "tickets"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={() => setModal("new")} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />{R ? "تذكرة جديدة" : "New Ticket"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{ v: "all", l: R ? "الكل" : "All" }, { v: "open", l: R ? "مفتوح" : "Open" }, { v: "in_progress", l: R ? "قيد المعالجة" : "In Progress" }, { v: "resolved", l: R ? "محلول" : "Resolved" }, { v: "closed", l: R ? "مغلق" : "Closed" }].map(opt => (
            <Button key={opt.v} size="sm" variant={filter === opt.v ? "default" : "outline"} className={cn(filter === opt.v && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => setFilter(opt.v)}>{opt.l}</Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد تذاكر" : "No tickets found"}</p>
          </div>
        ) : (
          <Card className="border-border/50">
            <div className="divide-y divide-border/50">
              {tickets.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => openTicket(t)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn("text-xs", PRIO_STYLE[t.priority] || "")}>{R ? PRIO_AR[t.priority] : t.priority}</Badge>
                    <Badge variant="outline" className={cn("text-xs", STATUS_STYLE[t.status] || "")}>{R ? STATUS_AR[t.status] : t.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* New ticket */}
      <Dialog open={modal === "new"} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{R ? "تذكرة جديدة" : "New Ticket"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{R ? "العنوان *" : "Subject *"}</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>{R ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div>
              <Label>{R ? "الأولوية" : "Priority"}</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["low","medium","high","urgent"].map(p => <SelectItem key={p} value={p}>{R ? PRIO_AR[p] : p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={create} className="bg-emerald-600 hover:bg-emerald-700">{R ? "إرسال" : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View ticket */}
      <Dialog open={modal === "view"} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {selected?.subject}
              <Badge variant="outline" className={cn("text-xs", STATUS_STYLE[selected?.status] || "")}>{R ? STATUS_AR[selected?.status] : selected?.status}</Badge>
            </DialogTitle>
          </DialogHeader>
          {selected?.description && <p className="text-sm text-muted-foreground border-b border-border/50 pb-3">{selected.description}</p>}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {replies.map(r => (
              <div key={r.id} className={cn("px-3 py-2 rounded-lg text-sm max-w-[85%]", r.is_staff ? "bg-muted/40 text-muted-foreground" : "bg-emerald-500/10 text-emerald-300 ml-auto text-right")}>
                <p>{r.message}</p>
                <p className="text-[10px] opacity-60 mt-1">{new Date(r.created_at).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
          {selected?.status !== "closed" && (
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={R ? "اكتب رداً..." : "Write a reply..."} onKeyDown={e => e.key === "Enter" && sendReply()} />
              <Button size="sm" onClick={sendReply} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">{R ? "إرسال" : "Send"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AgentLayout>
  );
}
