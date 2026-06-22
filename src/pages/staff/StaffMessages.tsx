import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StaffLayout from "@/layouts/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquare, Plus, RefreshCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  open:     "text-blue-400 border-blue-400/30 bg-blue-400/10",
  resolved: "text-green-400 border-green-400/30 bg-green-400/10",
  closed:   "text-muted-foreground border-border",
};

export default function StaffMessages() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [newModal, setNewModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .in("category", ["Message", "General"])
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openTicket = async (t: any) => {
    setSelected(t);
    const { data } = await db.from("ticket_replies").select("*").eq("ticket_id", t.id).order("created_at");
    setReplies(data ?? []);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected || !user) return;
    const { error } = await db.from("ticket_replies").insert({ ticket_id: selected.id, user_id: user.id, message: reply, is_staff: false });
    if (error) return toast.error(error.message);
    setReply("");
    const { data } = await db.from("ticket_replies").select("*").eq("ticket_id", selected.id).order("created_at");
    setReplies(data ?? []);
  };

  const createMessage = async () => {
    if (!form.title.trim() || !user) return toast.error(R ? "الموضوع مطلوب" : "Subject required");
    const { error } = await db.from("support_tickets").insert({ ...form, user_id: user.id, status: "open", category: "Message" });
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الإرسال" : "Message sent");
    setNewModal(false);
    setForm({ title: "", description: "", priority: "medium" });
    load();
  };

  const fmt = (s: string) => new Date(s).toLocaleString(R ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const unread = tickets.filter(t => t.status === "open").length;

  return (
    <StaffLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-violet-400" />
              {R ? "الرسائل" : "Messages"}
              {unread > 0 && <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">{unread}</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">{tickets.length} {R ? "محادثة" : "conversations"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={() => setNewModal(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4" />{R ? "رسالة جديدة" : "New Message"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 220px)" }}>
          {/* List */}
          <Card className="border-border/50 overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-3 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />)}</div>
              ) : tickets.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{R ? "لا توجد رسائل" : "No messages yet"}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {tickets.map(t => (
                    <button key={t.id} onClick={() => openTicket(t)}
                      className={cn("w-full text-left px-3 py-3 hover:bg-muted/30 transition-colors", selected?.id === t.id && "bg-violet-500/10")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium truncate">{t.title}</p>
                        <Badge variant="outline" className={cn("text-[10px] shrink-0", STATUS_COLOR[t.status] ?? "")}>{t.status}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{fmt(t.created_at)}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thread */}
          <Card className="border-border/50 lg:col-span-2 overflow-hidden flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{R ? "اختر محادثة" : "Select a conversation"}</p>
                </div>
              </div>
            ) : (
              <>
                <CardHeader className="pb-2 border-b border-border shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{selected.title}</p>
                    <Badge variant="outline" className={cn("text-xs", STATUS_COLOR[selected.status] ?? "")}>{selected.status}</Badge>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="bg-muted/20 rounded-lg p-3 max-w-[80%]">
                    <p className="text-[10px] text-muted-foreground mb-1">{R ? "أنت" : "You"} · {fmt(selected.created_at)}</p>
                    <p className="text-sm">{selected.description}</p>
                  </div>
                  {replies.map(r => (
                    <div key={r.id} className={cn("rounded-lg p-3 max-w-[80%]", r.is_staff ? "ml-auto bg-violet-500/10 border border-violet-500/20" : "bg-muted/20")}>
                      <p className="text-[10px] text-muted-foreground mb-1">{r.is_staff ? (R ? "الدعم" : "Support") : (R ? "أنت" : "You")} · {fmt(r.created_at)}</p>
                      <p className="text-sm">{r.message}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-3 flex gap-2 shrink-0">
                  <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder={R ? "اكتب رسالة..." : "Write a message..."}
                    className="min-h-[60px] resize-none text-sm" onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) sendReply(); }} />
                  <Button onClick={sendReply} className="bg-violet-600 hover:bg-violet-700 px-3 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* New Message Modal */}
      <Dialog open={newModal} onOpenChange={setNewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{R ? "رسالة جديدة" : "New Message"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{R ? "الموضوع *" : "Subject *"}</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>{R ? "الرسالة" : "Message"}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div>
              <Label>{R ? "الأولوية" : "Priority"}</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewModal(false)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={createMessage} className="bg-violet-600 hover:bg-violet-700">{R ? "إرسال" : "Send"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
