import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import UserPortalLayout from "@/layouts/UserPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { HelpCircle, Plus, MessageSquare, RefreshCcw, ChevronDown, ChevronUp, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["general","order","payment","technical","refund","other"];
const statusColor: Record<string,string> = {
  open:        "bg-blue-500/15 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  resolved:    "bg-green-500/15 text-green-400 border-green-500/30",
  closed:      "bg-muted/50 text-muted-foreground border-border",
};

export default function UserSupport() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "general", message: "" });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const expand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!replies[id]) {
      const { data } = await db.from("ticket_replies").select("*").eq("ticket_id", id).order("created_at", { ascending: true });
      setReplies(p => ({ ...p, [id]: data ?? [] }));
    }
  };

  const sendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    const { error } = await db.from("ticket_replies").insert({ ticket_id: ticketId, user_id: user!.id, message: replyText, is_staff: false, created_at: new Date().toISOString() });
    setSendingReply(false);
    if (error) return toast.error(error.message);
    setReplies(p => ({ ...p, [ticketId]: [...(p[ticketId] ?? []), { message: replyText, is_staff: false, created_at: new Date().toISOString() }] }));
    setReplyText("");
  };

  const save = async () => {
    if (!form.subject.trim() || !form.message.trim()) return toast.error(R ? "الموضوع والرسالة مطلوبان" : "Subject and message required");
    setSaving(true);
    const { error } = await db.from("support_tickets").insert({ user_id: user!.id, subject: form.subject, category: form.category, message: form.message, status: "open", created_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(
      R
        ? "تم استلام طلبك بنجاح، وسيتواصل معك فريق الدعم خلال 24 ساعة عمل."
        : "Your request has been received. Our support team will contact you within 24 business hours."
    );
    setDlg(false); setForm({ subject: "", category: "general", message: "" }); load();
  };

  const openCount = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;

  return (
    <UserPortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              {R ? "الدعم الفني" : "Support"}
            </h1>
            <p className="text-sm text-muted-foreground">{openCount} {R ? "تذكرة مفتوحة" : "open tickets"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /></Button>
            <Button size="sm" onClick={() => setDlg(true)} className="gap-1.5"><Plus className="w-4 h-4" />{R ? "تذكرة جديدة" : "New Ticket"}</Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">{R ? "لا توجد تذاكر دعم" : "No support tickets yet"}</p>
            <Button variant="outline" onClick={() => setDlg(true)}>{R ? "أنشئ تذكرة" : "Create a ticket"}</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map(t => (
              <Card key={t.id} className={cn("border-border/50 transition-colors", expanded === t.id && "border-primary/30")}>
                <CardContent className="p-0">
                  <button className="w-full p-4 flex items-center gap-3 text-start" onClick={() => expand(t.id)}>
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{t.subject}</p>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5", statusColor[t.status] || statusColor.open)}>{t.status}</Badge>
                        <span className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{t.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</p>
                    </div>
                    {expanded === t.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {expanded === t.id && (
                    <div className="border-t border-border/50 p-4 space-y-3">
                      <p className="text-sm text-muted-foreground">{t.message}</p>
                      {(replies[t.id] ?? []).length > 0 && (
                        <div className="space-y-2 mt-2">
                          {(replies[t.id] ?? []).map((r: any, i: number) => (
                            <div key={i} className={cn("p-2 rounded-lg text-xs", r.is_staff ? "bg-primary/10 border border-primary/20" : "bg-muted/30")}>
                              <p className={cn("font-semibold mb-0.5 text-[10px]", r.is_staff ? "text-primary" : "text-muted-foreground")}>{r.is_staff ? (R ? "الدعم" : "Support") : (R ? "أنت" : "You")}</p>
                              <p>{r.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {t.status !== "closed" && t.status !== "resolved" && (
                        <div className="flex gap-2">
                          <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={R ? "ردّ على التذكرة..." : "Reply..."} className="h-8 text-xs" onKeyDown={e => e.key === "Enter" && sendReply(t.id)} />
                          <Button size="sm" className="h-8 gap-1.5" onClick={() => sendReply(t.id)} disabled={sendingReply}><Send className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dlg} onOpenChange={setDlg}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{R ? "تذكرة دعم جديدة" : "New Support Ticket"}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>{R ? "الموضوع *" : "Subject *"}</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-1" /></div>
              <div>
                <Label>{R ? "الفئة" : "Category"}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{R ? "رسالتك *" : "Message *"}</Label><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} className="mt-1" placeholder={R ? "صف مشكلتك..." : "Describe your issue..."} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDlg(false)}>{R ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={save} disabled={saving}>{saving ? "…" : (R ? "إرسال" : "Submit")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UserPortalLayout>
  );
}
