import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

export default function VoiceAssistant() {
  const nav = useNavigate();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "ar-EG";
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      ask(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
  }, []);

  const toggle = () => {
    if (!recogRef.current) { toast.error("Speech recognition not supported"); return; }
    if (listening) recogRef.current.stop();
    else { setTranscript(""); setResponse(""); recogRef.current.start(); setListening(true); }
  };

  const ask = async (text: string) => {
    setLoading(true);
    try {
      let cid = conversationId;
      if (!cid) {
        const conv = await tenantDb.insert("chat_conversations", {
          title: "Voice Assistant",
          agent_kind: "voice_assistant",
          metadata: { source: "voice" },
        });
        cid = (conv as any)?.id || null;
        setConversationId(cid);
      }

      if (cid) {
        await tenantDb.insert("chat_messages", {
          conversation_id: cid,
          role: "user",
          content: text,
        });
      }

      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: { messages: [{ role: "user", content: text }] }
      });
      if (error) throw error;
      const reply = data?.choices?.[0]?.message?.content || data?.message || "No response";
      setResponse(reply);

      if (cid) {
        await tenantDb.insert("chat_messages", {
          conversation_id: cid,
          role: "assistant",
          content: reply,
        });
        await tenantDb.update("chat_conversations", { updated_at: new Date().toISOString() }, { id: cid });
      }

      const utter = new SpeechSynthesisUtterance(reply);
      utter.lang = "ar-EG";
      speechSynthesis.speak(utter);
    } catch (e: any) {
      toast.error(e.message || "AI request failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => nav("/")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2 mb-6" style={{ fontFamily: "Orbitron" }}>
          <Volume2 className="w-6 h-6" /> AI Voice Assistant
        </h1>

        <Card className="p-8 text-center space-y-6">
          <button
            onClick={toggle}
            disabled={loading}
            className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-all ${
              listening ? "bg-destructive animate-pulse" : "bg-primary hover:scale-105"
            }`}
          >
            {listening ? <MicOff className="w-12 h-12 text-white" /> : <Mic className="w-12 h-12 text-primary-foreground" />}
          </button>
          <p className="text-muted-foreground text-sm">
            {listening ? "🎙️ Listening... اضغط للإيقاف" : loading ? "🤖 Thinking..." : "اضغط للتحدث"}
          </p>

          {transcript && (
            <div className="text-left p-4 bg-secondary/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">You said:</div>
              <div className="font-body">{transcript}</div>
            </div>
          )}
          {response && (
            <div className="text-left p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="text-xs text-primary mb-1">Assistant:</div>
              <div className="font-body">{response}</div>
            </div>
          )}
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4">
          يستخدم Web Speech API + Lovable AI Gateway
        </p>
      </div>
    </div>
  );
}
