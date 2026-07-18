import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/context/UserRoleContext";
import ProviderLayout from "@/layouts/ProviderLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare, Plus, RefreshCcw, Send, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  open: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  in_progress: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  resolved: "text-green-400 bg-green-500/10 border-green-500/30",
  closed: "text-muted-foreground bg-muted border-border",
};
const STATUS_AR: Record<string, string> = { open: "مفتوح", in_progress: "جارٍ", resolved: "محلول", closed: "مغلق" };

export default function ProviderMessages() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { profile } = useRole();
  const db = supabase as any;

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | "view" | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await db.from("support_tickets").select("*").eq("user_id", profile.id).eq("category", "provider").order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const openTicket = async (t: any) => {
    setSelected(t); setModal("view");
    const { data } = await db.from("ticket_replies").select("*").eq("ticket_id", t.id).order("created_at", { ascending: true });
    setReplies(data ?? []);
  };

  const createTicket = async () => {
    if (!newSubject.trim()) return toast.error(R ? "الموضوع مطلوب" : "Subject required");
    const { error } = await db.from("support_tickets").insert({ subject: newSubject, description: newBody, category: "provider", status: "open", user_id: profile!.id, priority: "medium" });
    if (error) return toast.error(error.message);
    toast.success(R ? "تم إرسال الرسالة" : "Message sent");
    setNewSubject(""); setNewBody(""); setModal(null); load();
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    const { error } = await db.from("ticket_replies").insert({ ticket_id: selected.id, message: replyText, sender_id: profile!.id, is_staff: false });
    if (error) return toast.error(error.message);
    setReplyText("");
    const { data } = await db.from("ticket_replies").select("*").eq("ticket_id", selected.id).order("created_at", { ascending: true });
    setReplies(data ?? []);
  };

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              {R ? "الرسائل" : "Messages"}
            </h1>
            <p className="text-sm text-muted-foreground">{tickets.length} {R ? "محادثة" : "conversations"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={() => setModal("new")} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />{R ? "رسالة جديدة" : "New Message"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد رسائل" : "No messages yet"}</p>
            <Button size="sm" onClick={() => setModal("new")} className="mt-4 bg-blue-600 hover:bg-blue-700">{R ? "أرسل رسالة" : "Send a Message"}</Button>
          </div>
        ) : (
          <Card className="border-border/50">
            <div className="divide-y divide-border/50">
              {tickets.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => openTicket(t)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-xs shrink-0", STATUS_STYLE[t.status] || "")}>{R ? STATUS_AR[t.status] : t.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={modal === "new"} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{R ? "رسالة جديدة" : "New Message"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder={R ? "الموضوع..." : "Subject..."} value={newSubject} onChange={e => setNewSubject(e.target.value)} />
            <Textarea placeholder={R ? "محتوى الرسالة..." : "Message..."} value={newBody} onChange={e => setNewBody(e.target.value)} rows={4} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={createTicket} className="bg-blue-600 hover:bg-blue-700 gap-2"><Send className="w-4 h-4" />{R ? "إرسال" : "Send"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "view"} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.subject}</DialogTitle></DialogHeader>
          {selected?.description && <p className="text-sm text-muted-foreground border-b border-border/50 pb-3">{selected.description}</p>}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {replies.map(r => (
              <div key={r.id} className={cn("px-3 py-2 rounded-lg text-sm max-w-[85%]", r.is_staff ? "bg-muted/40 text-muted-foreground" : "bg-blue-500/10 text-blue-300 ml-auto text-right")}>
                <p>{r.message}</p>
                <p className="text-[10px] opacity-60 mt-1">{new Date(r.created_at).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
          {selected?.status !== "closed" && (
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={R ? "اكتب رداً..." : "Write a reply..."} onKeyDown={e => e.key === "Enter" && sendReply()} />
              <Button size="sm" onClick={sendReply} className="bg-blue-600 hover:bg-blue-700 shrink-0"><Send className="w-3 h-3" /></Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProviderLayout>
  );
}
