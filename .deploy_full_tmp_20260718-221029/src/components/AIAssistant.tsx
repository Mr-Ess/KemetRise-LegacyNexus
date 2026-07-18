import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  MessageCircle, X, Send, Sparkles, Loader2, Ticket,
  Plus, ChevronLeft, CheckCircle, Clock,
  Circle, RefreshCw, Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";
import { useUserRole } from "@/context/UserRoleContext";

type Msg = { role: "user" | "assistant"; content: string };

const ROLE_SUGGESTIONS: Record<string, string[]> = {
  superadmin: ["كيف أدير صلاحيات المستخدمين?", "دلّني على أهم أقسام المنصة", "What can I do as superadmin?"],
  admin: ["كيف أضيف مستخدم جديد?", "أين صفحة الصلاحيات?", "Show me platform stats"],
  manager: ["كيف أتابع أداء الفريق?", "أين جداول الموظفين?", "How to create a report?"],
  staff: ["كيف أسجل حضوري?", "أين مهامي اليومية?", "How do I view my schedule?"],
  partner: ["كيف أتابع إيراداتي?", "أين بوابة الشركاء?", "Show me my analytics"],
  agent: ["كيف أتابع عمولاتي?", "أين عملائي?", "How to log a conversion?"],
  vendor: ["كيف أضيف منتج جديد?", "أين طلباتي?", "How to manage my wallet?"],
  provider: ["كيف أضيف خدمة جديدة?", "أين طلباتي?", "How to manage listings?"],
  marketing: ["كيف أنشئ حملة تسويقية?", "أين خط أنابيب الليدز?", "Show marketing ROI"],
  user: ["كيف أتابع طلباتي?", "كيف أتواصل مع الدعم?", "Where is my wishlist?"],
  guest: ["ماذا تقدم KemetRise?", "كيف أسجل دخول?", "What is this platform?"],
  default: ["دلّني على المنصة", "ماذا يمكنني فعله هنا?", "Help me get started"],
};

/* ─── Ticket Types ───────────────────────────────────────────────────────── */
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "critical";
type SupportTicket = {
  id: string; title: string; description: string;
  category: string; priority: TicketPriority; status: TicketStatus;
  created_at: string; updated_at?: string; replies?: TicketReply[];
};
type TicketReply = { id: string; ticket_id: string; message: string; is_staff: boolean; created_at: string; };

/* ─── Status helpers ─────────────────────────────────────────────────────── */
const STATUS_COLOR: Record<TicketStatus, string> = {
  open:        "border-blue-500 text-blue-400 bg-blue-500/10",
  in_progress: "border-amber-500 text-amber-400 bg-amber-500/10",
  resolved:    "border-emerald-500 text-emerald-400 bg-emerald-500/10",
  closed:      "border-muted text-muted-foreground bg-muted/10",
};
const STATUS_ICON: Record<TicketStatus, React.ElementType> = {
  open: Circle, in_progress: Clock, resolved: CheckCircle, closed: X,
};
const PRIORITY_COLOR: Record<TicketPriority, string> = {
  low: "text-muted-foreground", medium: "text-blue-400",
  high: "text-amber-400", critical: "text-red-400",
};

const SYSTEM = `You are KEMET AI — an assistant for the KemetRise empire OS. 
Help the user manage brands, projects, employees, customers, finances, and tasks. 
Be concise, professional, and respond in the user's language (Arabic or English).`;

/* ─── AI Chat Panel ──────────────────────────────────────────────────────── */
function ChatPanel({ userRole, currentPage }: { userRole: string; currentPage: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ messages: next, system: SYSTEM, currentPage }),
      });
      if (!resp.ok || !resp.body) throw new Error("AI request failed");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) { acc += delta; setMessages(m => { const c = [...m]; c[c.length-1] = { role:"assistant", content:acc }; return c; }); }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      setMessages(m => { const c=[...m]; c[c.length-1]={ role:"assistant", content:`⚠ ${e.message}` }; return c; });
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="py-6 px-2 space-y-3">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {userRole === "guest" ? "مرحباً! أنا KEMET AI" : `أهلاً! أنا KEMET AI`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                كيف يمكنني مساعدتك اليوم؟
              </p>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {(ROLE_SUGGESTIONS[userRole] ?? ROLE_SUGGESTIONS.default).map((s, i) => (
                <button key={i} onClick={() => { setInput(s); }}
                  className="text-right text-[11px] px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/30 text-foreground/80 hover:text-foreground transition-all text-start">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm font-body whitespace-pre-wrap ${m.role==="user"?"bg-primary/20 text-foreground":"bg-secondary/60 text-foreground"}`}>
              {m.content || (loading && i===messages.length-1 ? <Loader2 className="w-3 h-3 animate-spin"/> : "")}
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="اسألني أي شيء... / Ask me anything..." disabled={loading}
          className="flex-1 bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary/50"/>
        <Button size="sm" onClick={send} disabled={loading||!input.trim()}>
          {loading?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Send className="w-3.5 h-3.5"/>}
        </Button>
      </div>
    </>
  );
}

/* ─── Support Ticket Panel ───────────────────────────────────────────────── */
function SupportPanel() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selected, setSelected] = useState<SupportTicket|null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({
    title: "", description: "",
    category: "General", priority: "medium" as TicketPriority,
  });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await tenantDb.select("support_tickets", { orderBy: "created_at", ascending: false }) as any[];
      setTickets(data || []);
    } catch { setTickets([]); } finally { setLoading(false); }
  };

  const loadReplies = async (ticketId: string) => {
    try {
      const { data } = await supabase
        .from("ticket_replies" as any)
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      setReplies((data as any[]) || []);
    } catch { setReplies([]); }
  };

  useEffect(() => { loadTickets(); }, []);

  const createTicket = async () => {
    if (!form.title.trim() || !form.description.trim()) return toast.error("Title and description required");
    setSubmitting(true);
    try {
      await tenantDb.insert("support_tickets", { ...form, status: "open" });
      toast.success("Ticket submitted! We'll respond shortly.");
      setForm({ title:"", description:"", category:"General", priority:"medium" });
      setView("list");
      loadTickets();
    } catch { toast.error("Failed to submit ticket"); } finally { setSubmitting(false); }
  };

  const openTicket = async (t: SupportTicket) => {
    setSelected(t); setView("detail");
    await loadReplies(t.id);
  };

  const submitReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSubmitting(true);
    try {
      await tenantDb.insert("ticket_replies", { ticket_id: selected.id, message: replyText.trim(), is_staff: false });
      setReplyText("");
      await loadReplies(selected.id);
    } catch { toast.error("Failed to send reply"); } finally { setSubmitting(false); }
  };

  const changeStatus = async (status: TicketStatus) => {
    if (!selected) return;
    try {
      await tenantDb.update("support_tickets", { status }, { id: selected.id } as any);
      setSelected(p => p ? {...p, status} : p);
      setTickets(p => p.map(t => t.id===selected.id ? {...t, status} : t));
      toast.success("Status updated");
    } catch { toast.error("Failed to update status"); }
  };

  const filtered = statusFilter === "all" ? tickets : tickets.filter(t => t.status === statusFilter);
  const openCount = tickets.filter(t => t.status === "open").length;

  /* ── LIST VIEW ── */
  if (view === "list") return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{openCount > 0 ? `${openCount} open ticket${openCount>1?"s":""}` : "No open tickets"}</span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={loadTickets}><RefreshCw className="w-3 h-3"/></Button>
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => setView("create")}><Plus className="w-3 h-3"/>New</Button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {["all","open","in_progress","resolved","closed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap transition-colors ${statusFilter===s?"bg-primary text-primary-foreground border-primary":"border-border text-muted-foreground hover:border-primary/50"}`}>
              {s==="all"?"All":s.replace("_"," ")}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-3 space-y-2">{[1,2,3].map(i=><div key={i} className="h-14 bg-secondary/30 rounded animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground px-4">
            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30"/>
            {statusFilter==="all"?"No tickets yet. Create one to get help.":"No tickets with this status."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(t => {
              const SIcon = STATUS_ICON[t.status];
              return (
                <button key={t.id} onClick={() => openTicket(t)} className="w-full text-left p-3 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-start gap-2">
                    <SIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${STATUS_COLOR[t.status].split(" ")[1]}`}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0 rounded-full border ${STATUS_COLOR[t.status]}`}>{t.status.replace("_"," ")}</span>
                        <span className={`text-[10px] ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  /* ── CREATE VIEW ── */
  if (view === "create") return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setView("list")}><ChevronLeft className="w-4 h-4"/></Button>
        <span className="text-xs font-semibold">New Support Ticket</span>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Title *</label>
          <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Brief summary of your issue"
            className="w-full mt-1 bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"/>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Category</label>
          <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
            className="w-full mt-1 bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
            {["General","Billing","Technical","Feature Request","Bug Report","Account","Other"].map(c=>(
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Priority</label>
          <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value as TicketPriority}))}
            className="w-full mt-1 bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Description *</label>
          <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
            placeholder="Describe your issue in detail…" rows={5}
            className="w-full mt-1 bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"/>
        </div>
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setView("list")} className="flex-1">Cancel</Button>
        <Button size="sm" onClick={createTicket} disabled={submitting||!form.title.trim()||!form.description.trim()} className="flex-1">
          {submitting?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:"Submit Ticket"}
        </Button>
      </div>
    </div>
  );

  /* ── DETAIL VIEW ── */
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setView("list")}><ChevronLeft className="w-4 h-4"/></Button>
          <p className="text-xs font-semibold flex-1 truncate">{selected?.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_COLOR[selected!.status]}`}>{selected?.status.replace("_"," ")}</span>
          <span className={`text-[10px] ${PRIORITY_COLOR[selected!.priority]}`}>{selected?.priority}</span>
          <span className="text-[10px] text-muted-foreground">{selected?.category}</span>
          <div className="ml-auto">
            <select value={selected?.status} onChange={e=>changeStatus(e.target.value as TicketStatus)}
              className="text-[10px] bg-secondary/50 border border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/50">
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Original message */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground mb-1">{selected && new Date(selected.created_at).toLocaleString()}</p>
          <p className="text-xs whitespace-pre-wrap">{selected?.description}</p>
        </div>
        {/* Replies */}
        {replies.map(r => (
          <div key={r.id} className={`rounded-lg p-3 ${r.is_staff ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-semibold ${r.is_staff?"text-primary":"text-muted-foreground"}`}>{r.is_staff?"Support Team":"You"}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <p className="text-xs whitespace-pre-wrap">{r.message}</p>
          </div>
        ))}
        {replies.length === 0 && <p className="text-center text-[10px] text-muted-foreground py-2">No replies yet</p>}
      </div>
      {selected?.status !== "closed" && (
        <div className="p-3 border-t border-border flex gap-2">
          <input value={replyText} onChange={e=>setReplyText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&submitReply()}
            placeholder="Add a reply…"
            className="flex-1 bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"/>
          <Button size="sm" onClick={submitReply} disabled={submitting||!replyText.trim()}>
            {submitting?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Send className="w-3.5 h-3.5"/>}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Main AI Assistant ──────────────────────────────────────────────────── */
export const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "support">("chat");
  const location = useLocation();
  const { role } = useUserRole();
  const userRole = role ?? "guest";

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg gold-glow flex items-center justify-center hover:scale-105 transition-transform">
        <Sparkles className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[85vh] bg-card border border-border rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-display text-xs tracking-wider text-primary">KEMET AI</span>
        </div>
        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-secondary/50 rounded-md p-0.5">
          <button onClick={() => setActiveTab("chat")}
            className={`text-[11px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${activeTab==="chat"?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground"}`}>
            <Sparkles className="w-3 h-3"/>دردشة AI
          </button>
          <button onClick={() => setActiveTab("support")}
            className={`text-[11px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${activeTab==="support"?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground"}`}>
            <Ticket className="w-3 h-3"/>دعم فني
          </button>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "chat"
          ? <ChatPanel userRole={userRole} currentPage={location.pathname} />
          : <SupportPanel />}
      </div>
    </div>
  );
};

export default AIAssistant;

