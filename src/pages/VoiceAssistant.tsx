import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mic, MicOff, Volume2, Video, VideoOff, PhoneOff, Copy,
  Users, MessageSquare, Bot, RefreshCw, Trash2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

/* ─────────────────────────────────────────────── VOICE TAB ──── */
function VoiceTab() {
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
    r.continuous = false; r.interimResults = false; r.lang = "ar-EG";
    r.onresult = (e: any) => { const text = e.results[0][0].transcript; setTranscript(text); ask(text); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
  }, []);

  const toggle = () => {
    if (!recogRef.current) { toast.error("Speech recognition not supported in this browser"); return; }
    if (listening) recogRef.current.stop();
    else { setTranscript(""); setResponse(""); recogRef.current.start(); setListening(true); }
  };

  const ask = async (text: string) => {
    setLoading(true);
    try {
      let cid = conversationId;
      if (!cid) {
        const conv = await tenantDb.insert("chat_conversations", { title: "Voice Assistant", agent_kind: "voice_assistant", metadata: { source: "voice" } });
        cid = (conv as any)?.id ?? null;
        setConversationId(cid);
      }
      if (cid) await tenantDb.insert("chat_messages", { conversation_id: cid, role: "user", content: text });

      const { data, error } = await supabase.functions.invoke("chat-ai", { body: { messages: [{ role: "user", content: text }] } });
      if (error) throw error;
      const reply = data?.choices?.[0]?.message?.content || data?.message || "No response";
      setResponse(reply);

      if (cid) {
        await tenantDb.insert("chat_messages", { conversation_id: cid, role: "assistant", content: reply });
        await tenantDb.update("chat_conversations", { updated_at: new Date().toISOString() }, { id: cid });
      }
      const utter = new SpeechSynthesisUtterance(reply);
      utter.lang = "ar-EG";
      speechSynthesis.speak(utter);
    } catch (e: any) { toast.error(e.message || "AI request failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card className="p-8 text-center space-y-6">
        <div>
          <h3 className="font-display text-primary mb-1">AI Voice Assistant</h3>
          <p className="text-xs text-muted-foreground">Speak in Arabic or English — the AI will respond and read the answer aloud.</p>
        </div>

        <button
          onClick={toggle} disabled={loading}
          className={`w-36 h-36 rounded-full flex items-center justify-center mx-auto transition-all shadow-lg ${
            listening ? "bg-destructive animate-pulse scale-110" : "bg-primary hover:scale-105 hover:shadow-primary/40"
          }`}
        >
          {listening ? <MicOff className="w-14 h-14 text-white"/> : <Mic className="w-14 h-14 text-primary-foreground"/>}
        </button>
        <p className="text-muted-foreground text-sm font-medium">
          {listening ? "🎙️ Listening… tap to stop" : loading ? "🤖 Thinking…" : "Tap to speak"}
        </p>

        {transcript && (
          <div className="text-left p-4 bg-secondary/40 rounded-lg border border-border">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Mic className="w-3 h-3"/>You said</div>
            <div className="font-body text-sm">{transcript}</div>
          </div>
        )}
        {response && (
          <div className="text-left p-4 bg-primary/10 rounded-lg border border-primary/30">
            <div className="text-xs text-primary mb-1 flex items-center gap-1"><Bot className="w-3 h-3"/>Assistant</div>
            <div className="font-body text-sm">{response}</div>
          </div>
        )}
        {conversationId && (
          <Button size="sm" variant="ghost" onClick={()=>{setConversationId(null);setTranscript("");setResponse("");}}>
            <RefreshCw className="w-3.5 h-3.5 mr-1"/>New Conversation
          </Button>
        )}
      </Card>
      <p className="text-xs text-muted-foreground text-center">Uses Web Speech API + KemetRise AI Gateway</p>
    </div>
  );
}

/* ─────────────────────────────────────────────── VIDEO TAB ──── */
function VideoTab() {
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("room");
    if (r) setRoom(r);
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const generateRoom = () => setRoom("room-" + Math.random().toString(36).slice(2,10));

  const join = async () => {
    if (!room.trim()) return toast.error("Enter a room ID");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setJoined(true);
      toast.success(`Joined room: ${room}`);
    } catch { toast.error("Camera/microphone access denied"); }
  };

  const leave = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setJoined(false); };

  const toggleCam = () => { streamRef.current?.getVideoTracks().forEach(t=>{t.enabled = !camOn;}); setCamOn(v=>!v); };
  const toggleMic = () => { streamRef.current?.getAudioTracks().forEach(t=>{t.enabled = !micOn;}); setMicOn(v=>!v); };

  const copyLink = () => { navigator.clipboard.writeText(`${window.location.origin}/voice?room=${room}`); toast.success("Room link copied"); };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {!joined ? (
        <Card className="p-6 max-w-md mx-auto space-y-4">
          <div className="text-center mb-2">
            <Video className="w-10 h-10 text-primary mx-auto mb-2"/>
            <h3 className="font-display text-primary">Video Conference</h3>
            <p className="text-xs text-muted-foreground">Start or join a video room. Share the Room ID with participants.</p>
          </div>
          <div>
            <Label>Room ID</Label>
            <div className="flex gap-2 mt-1">
              <Input value={room} onChange={e=>setRoom(e.target.value)} placeholder="e.g. team-meeting"/>
              <Button variant="outline" onClick={generateRoom}>Generate</Button>
            </div>
          </div>
          {room && (
            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded text-xs font-mono">
              <span className="truncate flex-1">{window.location.origin}/voice?room={room}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyLink}><Copy className="w-3 h-3"/></Button>
            </div>
          )}
          <Button onClick={join} className="w-full font-display"><Video className="w-4 h-4 mr-2"/>Join Room</Button>
        </Card>
      ) : (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary"/>
              Room: <span className="font-mono text-primary font-bold">{room}</span>
              <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-400">Live</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={copyLink}><Copy className="w-3 h-3 mr-1"/>Share Link</Button>
          </div>
          <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-lg">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"/>
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded text-xs text-white flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>You (local preview)
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" variant={micOn?"default":"destructive"} onClick={toggleMic} className="w-14 h-14 rounded-full p-0">
              {micOn?<Mic className="w-6 h-6"/>:<MicOff className="w-6 h-6"/>}
            </Button>
            <Button size="lg" variant={camOn?"default":"destructive"} onClick={toggleCam} className="w-14 h-14 rounded-full p-0">
              {camOn?<Video className="w-6 h-6"/>:<VideoOff className="w-6 h-6"/>}
            </Button>
            <Button size="lg" variant="destructive" onClick={leave} className="w-14 h-14 rounded-full p-0">
              <PhoneOff className="w-6 h-6"/>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">Local preview. Full peer-to-peer WebRTC requires a TURN server (next phase).</p>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────── HISTORY TAB ── */
function HistoryTab() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await tenantDb.select("chat_conversations", { orderBy: "updated_at", ascending: false, limit: 50 });
      setConversations(data || []);
    } finally { setLoading(false); }
  };

  const loadMessages = async (id: string) => {
    setSelected(id); setMsgLoading(true);
    try {
      const data = await tenantDb.select("chat_messages", { eq: { conversation_id: id }, orderBy: "created_at", ascending: true });
      setMessages(data || []);
    } finally { setMsgLoading(false); }
  };

  const deleteConversation = async (id: string) => {
    await tenantDb.remove("chat_conversations", { id });
    if (selected === id) { setSelected(null); setMessages([]); }
    load();
    toast.success("Conversation deleted");
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Conversations</p>
          <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="w-3.5 h-3.5"/></Button>
        </div>
        {loading ? [1,2,3].map(i=><Skeleton key={i} className="h-14 w-full"/>) :
         conversations.length === 0 ? (
           <Card className="p-6 text-center text-muted-foreground text-sm">
             <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20"/>No conversations yet
           </Card>
         ) : conversations.map(c=>(
           <Card key={c.id} onClick={()=>loadMessages(c.id)}
             className={`p-3 cursor-pointer hover:bg-secondary/40 transition-colors ${selected===c.id?"border-primary bg-primary/5":""}`}>
             <div className="flex items-start justify-between gap-2">
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold truncate">{c.title || "Untitled"}</p>
                 <div className="flex items-center gap-1 mt-0.5">
                   <Badge variant="outline" className="text-[9px]">{c.agent_kind || "chat"}</Badge>
                   <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                     <Clock className="w-2.5 h-2.5"/>{new Date(c.updated_at||c.created_at).toLocaleDateString()}
                   </span>
                 </div>
               </div>
               <Button size="icon" variant="ghost" className="w-6 h-6 shrink-0" onClick={e=>{e.stopPropagation();deleteConversation(c.id);}}>
                 <Trash2 className="w-3 h-3 text-destructive"/>
               </Button>
             </div>
           </Card>
         ))
        }
      </div>

      {/* Messages */}
      <div className="md:col-span-2">
        {!selected ? (
          <Card className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20"/><p className="text-sm">Select a conversation to view messages</p></div>
          </Card>
        ) : msgLoading ? (
          <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>
        ) : messages.length === 0 ? (
          <Card className="h-40 flex items-center justify-center text-muted-foreground text-sm">No messages</Card>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {messages.map(m=>(
              <div key={m.id} className={`flex gap-2 ${m.role==="user"?"justify-end":""}`}>
                {m.role==="assistant"&&<div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-primary"/></div>}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.role==="user"?"bg-primary text-primary-foreground":"bg-secondary/60"}`}>
                  {m.content}
                  <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString()}</p>
                </div>
                {m.role==="user"&&<div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 text-xs font-bold">U</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── MAIN COMPONENT ─── */
export default function VirtualAssistant() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={()=>nav("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4"/><span className="font-body text-sm">Back</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Bot className="w-6 h-6 text-primary"/></div>
          <div>
            <h1 className="font-display text-xl text-primary">VIRTUAL ASSISTANT</h1>
            <p className="text-xs text-muted-foreground">AI Voice · Video Conference · Conversation History</p>
          </div>
        </div>

        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-sm">
            <TabsTrigger value="voice" className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5"/>Voice AI
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5"/>Video Call
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5"/>History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice"   className="mt-4"><VoiceTab/></TabsContent>
          <TabsContent value="video"   className="mt-4"><VideoTab/></TabsContent>
          <TabsContent value="history" className="mt-4"><HistoryTab/></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

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
