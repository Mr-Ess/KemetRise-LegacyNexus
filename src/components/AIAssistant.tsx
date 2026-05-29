import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are KEMET AI — an assistant for the KemetRise empire OS. 
Help the user manage brands, projects, employees, customers, finances, and tasks. 
Be concise, professional, and respond in the user's language (Arabic or English).`;

export const AIAssistant = () => {
  const [open, setOpen] = useState(false);
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
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/chat-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: next, system: SYSTEM }),
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
            if (delta) {
              acc += delta;
              setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      setMessages(m => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: `⚠ ${e.message}` }; return c; });
    } finally { setLoading(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg gold-glow flex items-center justify-center hover:scale-105 transition-transform">
        <Sparkles className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[80vh] bg-card border border-border rounded-lg shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-display text-xs tracking-wider text-primary">KEMET AI ASSISTANT</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
            Ask me anything about your empire
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm font-body whitespace-pre-wrap ${
              m.role === "user" ? "bg-primary/20 text-foreground" : "bg-secondary/60 text-foreground"
            }`}>
              {m.content || (loading && i === messages.length - 1 ? <Loader2 className="w-3 h-3 animate-spin" /> : "")}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type a message..." disabled={loading}
          className="flex-1 bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary/50" />
        <Button size="sm" onClick={send} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
};

export default AIAssistant;
