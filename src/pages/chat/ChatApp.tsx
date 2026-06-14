import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ChatLayout from "@/layouts/ChatLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send, Plus, Bot, User, Trash2, MessageSquare, Sparkles,
  ChevronRight, RefreshCw, ThumbsUp, ThumbsDown, Copy,
  MoreVertical, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface Agent {
  id: string;
  agent_name: string;
  agent_name_ar?: string;
  agent_type: string;
  system_prompt: string;
  avatar_url?: string;
  color: string;
  model: string;
  is_active: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  is_liked?: boolean;
}

interface Session {
  id: string;
  title: string;
  agent_id: string;
  message_count: number;
  last_message_at: string;
}

const AGENT_TYPE_ICONS: Record<string, string> = {
  general: "🤖", social: "📱", financial: "💰", legal: "⚖️",
  support: "🎧", sales: "📊", fashion: "👗", research: "🔬", custom: "✨",
};

export default function ChatApp() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const db = supabase as any;
  const R = i18n.language === "ar";
  const bottomRef = useRef<HTMLDivElement>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load agents (public + own)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await db.from("ai_brand_agents").select("*").eq("is_active", true).or(`owner_user_id.eq.${user.id},is_public.eq.true`);
      setAgents(data || []);
      if (data?.length > 0) setSelectedAgent(data[0]);
    })();
  }, [user]);

  // Load sessions for selected agent
  useEffect(() => {
    if (!selectedAgent || !user) return;
    (async () => {
      const { data } = await db.from("chat_sessions").select("*")
        .eq("user_id", user.id).eq("agent_id", selectedAgent.id)
        .order("last_message_at", { ascending: false }).limit(20);
      setSessions(data || []);
    })();
  }, [selectedAgent, user]);

  // Load messages for active session
  useEffect(() => {
    if (!activeSession) { setMessages([]); return; }
    (async () => {
      const { data } = await db.from("chat_messages").select("*")
        .eq("session_id", activeSession.id).order("created_at", { ascending: true });
      setMessages(data || []);
    })();
  }, [activeSession]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createSession = async (): Promise<Session | null> => {
    if (!selectedAgent || !user) return null;
    const { data } = await db.from("chat_sessions").insert({
      user_id: user.id, agent_id: selectedAgent.id, title: "New Chat",
    }).select().single();
    if (data) {
      setSessions(p => [data, ...p]);
      setActiveSession(data);
    }
    return data;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");

    let session = activeSession;
    if (!session) { session = await createSession(); }
    if (!session) return;

    // Optimistic user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`, role: "user", content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(p => [...p, tempUserMsg]);

    // Save user message
    await db.from("chat_messages").insert({ session_id: session.id, role: "user", content: text });

    setLoading(true);
    setStreaming(true);

    // Optimistic assistant placeholder
    const tempAsstMsg: Message = {
      id: `streaming-${Date.now()}`, role: "assistant", content: "",
      created_at: new Date().toISOString(),
    };
    setMessages(p => [...p, tempAsstMsg]);

    try {
      // Call Supabase edge function for AI response
      const { data: fnData, error: fnErr } = await (supabase.functions as any).invoke("ai-chat", {
        body: {
          session_id: session.id,
          agent_id: selectedAgent!.id,
          message: text,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        },
      });

      const reply = fnData?.reply || (R
        ? "عذراً، لم أتمكن من الاستجابة في الوقت الحالي. تأكد من ضبط مفتاح OpenAI API."
        : "Sorry, I couldn't respond right now. Please ensure the OpenAI API key is configured.");

      // Replace streaming placeholder with real message
      const { data: saved } = await db.from("chat_messages").insert({
        session_id: session.id, role: "assistant", content: reply,
      }).select().single();

      setMessages(p => p.map(m => m.id === tempAsstMsg.id ? (saved || { ...tempAsstMsg, content: reply }) : m));

      // Update session
      await db.from("chat_sessions").update({ last_message_at: new Date().toISOString(), message_count: (session.message_count || 0) + 2 }).eq("id", session.id);

      // Auto-title after first message
      if (!session.message_count || session.message_count < 2) {
        const title = text.slice(0, 40) + (text.length > 40 ? "..." : "");
        await db.from("chat_sessions").update({ title }).eq("id", session.id);
        setSessions(p => p.map(s => s.id === session!.id ? { ...s, title } : s));
      }
    } catch {
      const errMsg = R ? "حدث خطأ في الاتصال بالذكاء الاصطناعي" : "AI connection error";
      setMessages(p => p.map(m => m.id === tempAsstMsg.id ? { ...tempAsstMsg, content: errMsg } : m));
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const deleteSession = async (id: string) => {
    await db.from("chat_sessions").delete().eq("id", id);
    setSessions(p => p.filter(s => s.id !== id));
    if (activeSession?.id === id) { setActiveSession(null); setMessages([]); }
  };

  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const likeMessage = async (id: string, liked: boolean) => {
    await db.from("chat_messages").update({ is_liked: liked }).eq("id", id);
    setMessages(p => p.map(m => m.id === id ? { ...m, is_liked: liked } : m));
  };

  return (
    <ChatLayout>
      <div className="flex h-full">
        {/* Sidebar: agents + sessions */}
        <aside className={cn(
          "flex-col bg-sidebar border-r border-border transition-all duration-300 h-full overflow-hidden",
          sidebarOpen ? "flex w-64" : "hidden w-0"
        )}>
          {/* Agent selector */}
          <div className="p-3 border-b border-border shrink-0">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
              {R ? "وكلاء الذكاء الاصطناعي" : "AI Agents"}
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {agents.map(agent => (
                <button key={agent.id}
                  onClick={() => { setSelectedAgent(agent); setActiveSession(null); setMessages([]); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-all",
                    selectedAgent?.id === agent.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}>
                  <span className="text-sm">{AGENT_TYPE_ICONS[agent.agent_type] || "🤖"}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="truncate font-medium">{R && agent.agent_name_ar ? agent.agent_name_ar : agent.agent_name}</p>
                    <p className="text-[9px] opacity-60 capitalize">{agent.agent_type}</p>
                  </div>
                  {selectedAgent?.id === agent.id && <ChevronRight className="w-3 h-3 shrink-0" />}
                </button>
              ))}
              {agents.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-3">{R ? "لا يوجد وكلاء بعد" : "No agents configured"}</p>}
            </div>
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{R ? "المحادثات" : "Chats"}</span>
              <button onClick={createSession} disabled={!selectedAgent} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {sessions.map(s => (
              <div key={s.id}
                className={cn("group flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-all mb-0.5",
                  activeSession?.id === s.id ? "bg-primary/10 text-primary" : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveSession(s)}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{s.title}</p>
                  <p className="text-[9px] opacity-50">{s.message_count} msgs</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-all shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toggle sidebar + agent info */}
          <div className="h-10 border-b border-border flex items-center gap-3 px-3 shrink-0 bg-background/50">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground transition-colors">
              <MessageSquare className="w-4 h-4" />
            </button>
            {selectedAgent && (
              <div className="flex items-center gap-2">
                <span className="text-sm">{AGENT_TYPE_ICONS[selectedAgent.agent_type] || "🤖"}</span>
                <span className="text-xs font-semibold">{R && selectedAgent.agent_name_ar ? selectedAgent.agent_name_ar : selectedAgent.agent_name}</span>
                <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">{selectedAgent.model}</Badge>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!activeSession && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold">{R ? "KemetRise AI" : "KemetRise AI"}</h2>
                  <p className="text-sm text-muted-foreground">{R ? "اختر وكيلاً وابدأ المحادثة" : "Select an agent and start chatting"}</p>
                </div>
                {selectedAgent && (
                  <Button size="sm" onClick={createSession} className="gap-2">
                    <Plus className="w-3.5 h-3.5" />{R ? "محادثة جديدة" : "New Chat"}
                  </Button>
                )}
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3 group", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar */}
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5",
                  msg.role === "user" ? "bg-primary/20 border border-primary/40 text-primary" : "bg-secondary border border-border"
                )}>
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <span>{AGENT_TYPE_ICONS[selectedAgent?.agent_type || "general"]}</span>}
                </div>

                {/* Bubble */}
                <div className={cn("max-w-[75%] space-y-1", msg.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-secondary/60 border border-border rounded-tl-sm"
                  )}>
                    {msg.id.startsWith("streaming-") && !msg.content
                      ? <span className="flex gap-1"><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0ms]" /><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:150ms]" /><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:300ms]" /></span>
                      : <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                  </div>
                  {/* Message actions */}
                  {msg.role === "assistant" && msg.content && !msg.id.startsWith("streaming-") && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                      <button onClick={() => copyMessage(msg.content, msg.id)} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button onClick={() => likeMessage(msg.id, true)} className={cn("p-1 rounded hover:bg-secondary/50 transition-colors", msg.is_liked === true ? "text-green-400" : "text-muted-foreground hover:text-foreground")}>
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => likeMessage(msg.id, false)} className={cn("p-1 rounded hover:bg-secondary/50 transition-colors", msg.is_liked === false ? "text-red-400" : "text-muted-foreground hover:text-foreground")}>
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border p-3 bg-background/80 backdrop-blur-sm shrink-0">
            {!activeSession && selectedAgent && (
              <p className="text-center text-xs text-muted-foreground mb-2">{R ? "اضغط Enter أو أرسل لبدء محادثة جديدة" : "Press Enter or send to start a new chat"}</p>
            )}
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={selectedAgent ? (R ? `اكتب رسالة لـ ${R && selectedAgent.agent_name_ar ? selectedAgent.agent_name_ar : selectedAgent.agent_name}...` : `Message ${selectedAgent.agent_name}...`) : (R ? "اختر وكيلاً أولاً" : "Select an agent first")}
                  disabled={loading || !selectedAgent}
                  rows={1}
                  className={cn(
                    "w-full resize-none px-4 py-2.5 rounded-xl bg-secondary/30 border border-border text-sm",
                    "focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40",
                    "placeholder:text-muted-foreground/50 disabled:opacity-50",
                    "max-h-32 overflow-y-auto"
                  )}
                  style={{ fieldSizing: "content" } as any}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim() || !selectedAgent}
                size="sm"
                className="h-10 w-10 p-0 shrink-0">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
              {R ? "Shift+Enter للسطر الجديد · Enter للإرسال" : "Shift+Enter for new line · Enter to send"}
            </p>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
