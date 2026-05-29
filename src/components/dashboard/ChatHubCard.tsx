import { Send, Bot, Cpu, Mic, Filter, PenSquare, Trash2, Paperclip, X, Play, Pause, FileText, Square, MapPin, User as UserIcon, Phone, Image as ImageIcon, Plus } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import anubisAvatar from "@/assets/anubis-avatar.jpg";
import { chatApi, tasksApi } from "@/services/system";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { tenantDb } from "@/lib/tenantDb";

type AgentStatus = "online" | "offline" | "busy";
type AgentType = "AI" | "Human";

type Agent = {
  id: string;
  name: string;
  icon: typeof Bot;
  color: string;
  type: AgentType;
  status: AgentStatus;
  role: string;
  avatar?: string;
  system?: string;
};

const agents: Agent[] = [
  { id: "anubis", name: "Anubis", icon: Bot, color: "text-primary", type: "AI", status: "online", role: "AI Data Analyst", avatar: anubisAvatar, system: "You are Anubis, an Egyptian-themed AI data analyst. Be concise and insightful." },
  { id: "isis", name: "Isis", icon: Cpu, color: "text-scarab", type: "AI", status: "online", role: "AI Legal Assistant", system: "You are Isis, an AI legal assistant. Be precise and formal." },
  { id: "horus", name: "Horus", icon: Bot, color: "text-nile", type: "AI", status: "busy", role: "AI Strategy", system: "You are Horus, a strategic AI advisor. Think in frameworks." },
  { id: "hathor", name: "Hathor", icon: Bot, color: "text-primary", type: "AI", status: "offline", role: "AI Creative", system: "You are Hathor, a creative AI director." },
  { id: "khaled", name: "Khaled M.", icon: Bot, color: "text-papyrus", type: "Human", status: "online", role: "Branch Manager" },
  { id: "ahmed", name: "Ahmed S.", icon: Bot, color: "text-papyrus", type: "Human", status: "busy", role: "Legal Advisor" },
];

type DbMessage = { id: string; role: string; content: string; metadata?: any };

// Render an attachment from message metadata
const Attachment = ({ meta }: { meta: any }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  if (!meta) return null;
  if (meta.kind === "audio") {
    return (
      <div className="flex items-center gap-2 mt-1 p-2 bg-background/40 rounded-md max-w-[260px]">
        <button onClick={() => { const a = audioRef.current; if (!a) return; if (playing) { a.pause(); } else { a.play(); } }} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <audio ref={audioRef} src={meta.url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} className="hidden" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-muted-foreground">🎤 Voice • {meta.duration ? `${meta.duration}s` : ""}</div>
          <div className="h-1 bg-primary/30 rounded-full" />
        </div>
      </div>
    );
  }
  if (meta.kind === "image") {
    return <a href={meta.url} target="_blank" rel="noreferrer"><img src={meta.url} alt={meta.name || "image"} className="mt-1 max-w-[220px] max-h-[180px] rounded-md object-cover border border-border" /></a>;
  }
  if (meta.kind === "file") {
    return (
      <a href={meta.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-1 p-2 bg-background/40 rounded-md hover:bg-background/60 max-w-[260px]">
        <FileText className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-display truncate">{meta.name}</div>
          <div className="text-[10px] text-muted-foreground">{meta.size ? `${(meta.size/1024).toFixed(1)} KB` : "file"}</div>
        </div>
      </a>
    );
  }
  if (meta.kind === "location") {
    const url = `https://www.google.com/maps?q=${meta.lat},${meta.lng}`;
    const img = `https://staticmap.openstreetmap.de/staticmap.php?center=${meta.lat},${meta.lng}&zoom=14&size=260x140&markers=${meta.lat},${meta.lng},red-pushpin`;
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-1 max-w-[260px] rounded-md overflow-hidden border border-border bg-background/40 hover:bg-background/60">
        <img src={img} alt="map" className="w-full h-[120px] object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <div className="flex items-center gap-2 p-2">
          <MapPin className="w-4 h-4 text-blood-red shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-display truncate">{meta.label || "Shared Location"}</div>
            <div className="text-[10px] text-muted-foreground">{Number(meta.lat).toFixed(5)}, {Number(meta.lng).toFixed(5)}</div>
          </div>
        </div>
      </a>
    );
  }
  if (meta.kind === "contact") {
    return (
      <div className="flex items-center gap-2 mt-1 p-2 bg-background/40 rounded-md max-w-[260px] border border-border">
        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0"><UserIcon className="w-4 h-4" /></div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-display truncate">{meta.name || "Contact"}</div>
          {meta.phone && <a href={`tel:${meta.phone}`} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"><Phone className="w-3 h-3" />{meta.phone}</a>}
          {meta.email && <div className="text-[10px] text-muted-foreground truncate">{meta.email}</div>}
        </div>
      </div>
    );
  }
  return null;
};

const ChatHubCard = () => {
  const [activeAgent, setActiveAgent] = useState("anubis");
  const [conversations, setConversations] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, DbMessage[]>>({});
  const [streaming, setStreaming] = useState("");
  const [input, setInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "AI" | "Human">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AgentStatus>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load or create conversations per agent
  useEffect(() => {
    (async () => {
      try {
        const convs = await chatApi.listConversations();
        const map: Record<string, string> = {};
        for (const c of convs) {
          const aid = (c.metadata as any)?.agent_id;
          if (aid && !map[aid]) map[aid] = c.id;
        }
        setConversations(map);
      } catch { /* ignore */ }
    })();
  }, []);

  // Realtime messages
  useEffect(() => {
    const ch = supabase.channel("chat-msg-rt").on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
      const m: any = payload.new;
      setMessages((prev) => {
        const agentId = Object.entries(conversations).find(([, cid]) => cid === m.conversation_id)?.[0];
        if (!agentId) return prev;
        const list = prev[agentId] || [];
        if (list.find((x) => x.id === m.id)) return prev;
        return { ...prev, [agentId]: [...list, { id: m.id, role: m.role, content: m.content, metadata: m.metadata }] };
      });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversations]);

  // Load messages on agent change
  useEffect(() => {
    const cid = conversations[activeAgent];
    if (!cid) { setMessages((p) => ({ ...p, [activeAgent]: [] })); return; }
    chatApi.listMessages(cid).then((m) => {
      setMessages((p) => ({ ...p, [activeAgent]: m.map((x: any) => ({ id: x.id, role: x.role, content: x.content, metadata: x.metadata })) }));
    }).catch(() => {});
  }, [activeAgent, conversations]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9 }); }, [messages, streaming, activeAgent]);

  const filteredAgents = useMemo(() => agents.filter((a) => {
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  }), [typeFilter, statusFilter]);

  const ensureConversation = async (agent: Agent) => {
    if (conversations[agent.id]) return conversations[agent.id];
    const c = await chatApi.createConversation({
      title: agent.name,
      agent_kind: agent.type === "AI" ? "ai" : "human",
      metadata: { agent_id: agent.id, role: agent.role },
    });
    setConversations((p) => ({ ...p, [agent.id]: c.id }));
    return c.id;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const agent = agents.find((a) => a.id === activeAgent);
    if (!agent) return;
    setInput("");
    setLoading(true);
    try {
      const cid = await ensureConversation(agent);
      await chatApi.sendMessage(cid, "user", text);

      if (agent.type === "AI") {
        const history = (messages[activeAgent] || []).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
        history.push({ role: "user", content: text });
        let acc = "";
        await chatApi.streamAI(history, (chunk) => { acc += chunk; setStreaming(acc); }, agent.system);
        setStreaming("");
        if (acc.trim()) await chatApi.sendMessage(cid, "assistant", acc);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const createTaskFromChat = async () => {
    const last = messages[activeAgent]?.slice(-1)[0];
    if (!last) { toast.info("No message to convert"); return; }
    try {
      const agent = agents.find((a) => a.id === activeAgent)!;
      await tasksApi.create({
        title: last.content.slice(0, 80),
        description: last.content,
        agent_kind: agent.type === "AI" ? "ai" : "human",
        assignee: agent.name,
      });
      toast.success("Task created");
    } catch (e: any) { toast.error(e.message); }
  };

  const clearChat = async () => {
    const cid = conversations[activeAgent];
    if (!cid) return;
    try {
      await chatApi.deleteConversation(cid);
      setConversations((p) => { const n = { ...p }; delete n[activeAgent]; return n; });
      setMessages((p) => ({ ...p, [activeAgent]: [] }));
      toast.success("Chat cleared");
    } catch (e: any) { toast.error(e.message); }
  };

  // === Attachments & voice ===
  const sendAttachmentMessage = async (meta: any, contentText = "") => {
    const agent = agents.find((a) => a.id === activeAgent);
    if (!agent) return;
    const cid = await ensureConversation(agent);
    let data: any;
    try {
      data = await tenantDb.insert("chat_messages", {
        conversation_id: cid,
        role: "user",
        content: contentText,
        metadata: meta,
      } as any);
    } catch (error: any) {
      toast.error(String(error?.message || error));
      return;
    }
    await tenantDb.update("chat_conversations", { updated_at: new Date().toISOString() }, { id: cid });
    setMessages((p) => ({ ...p, [activeAgent]: [...(p[activeAgent] || []), { id: (data as any).id, role: "user", content: contentText, metadata: meta }] }));
  };

  const uploadFile = async (file: File): Promise<{ url: string; path: string } | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); return null; }
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("chat-uploads").upload(path, file, { contentType: file.type });
    if (error) { toast.error(error.message); return null; }
    const { data: pub } = supabase.storage.from("chat-uploads").getPublicUrl(path);
    return { url: pub.publicUrl, path };
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setLoading(true);
    try {
      for (const f of Array.from(files)) {
        const up = await uploadFile(f);
        if (!up) continue;
        const isImage = f.type.startsWith("image/");
        await sendAttachmentMessage({ kind: isImage ? "image" : "file", url: up.url, name: f.name, size: f.size, mime: f.type });
      }
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
        const duration = recSeconds;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        setRecording(false); setRecSeconds(0);
        setLoading(true);
        try {
          const up = await uploadFile(file);
          if (up) await sendAttachmentMessage({ kind: "audio", url: up.url, name: file.name, size: file.size, mime: file.type, duration });
        } finally { setLoading(false); }
      };
      mediaRecRef.current = mr;
      mr.start();
      setRecording(true); setRecSeconds(0);
      recTimerRef.current = window.setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch (e: any) {
      toast.error(e.message || "Microphone permission denied");
    }
  };

  const stopRecording = () => { mediaRecRef.current?.stop(); };
  const cancelRecording = () => {
    const mr = mediaRecRef.current; if (!mr) return;
    mr.onstop = () => { mr.stream.getTracks().forEach((t) => t.stop()); };
    mr.stop();
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
    setRecording(false); setRecSeconds(0);
  };

  const shareLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setAttachOpen(false);
    toast.info("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await sendAttachmentMessage({ kind: "location", lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Current Location" });
      },
      (err) => toast.error(err.message || "Failed to get location"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const shareContact = async () => {
    setAttachOpen(false);
    const name = window.prompt("Contact name:")?.trim();
    if (!name) return;
    const phone = window.prompt("Phone (optional):")?.trim() || "";
    const email = window.prompt("Email (optional):")?.trim() || "";
    await sendAttachmentMessage({ kind: "contact", name, phone, email });
  };

  const currentAgent = agents.find((a) => a.id === activeAgent);
  const statusColor = (s: AgentStatus) => s === "online" ? "bg-scarab" : s === "busy" ? "bg-primary" : "bg-muted-foreground/50";

  return (
    <div className="bg-card rounded-lg border border-border p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h3 className="font-display text-xs font-bold text-foreground tracking-wider">
            ACTIVE AGENT CHAT HUB <span className="text-muted-foreground font-body text-xs">(مركز الدردشة)</span>
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10" title="Clear chat"><Trash2 className="w-4 h-4" /></button>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-md transition-colors ${showFilters ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-2 p-2.5 bg-secondary/30 rounded-md border border-border/50">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-display text-muted-foreground">النوع:</span>
            {(["all", "AI", "Human"] as const).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-2.5 py-1 rounded text-[10px] font-display transition-colors ${typeFilter === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
                {t === "all" ? "الكل" : t === "AI" ? "🤖 AI" : "👤 Human"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {filteredAgents.map((agent) => (
          <button key={agent.id} onClick={() => setActiveAgent(agent.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display transition-all shrink-0 ${activeAgent === agent.id ? "bg-primary/15 text-primary border border-primary/40" : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"}`}>
            <div className="relative">
              {agent.avatar ? <img src={agent.avatar} alt={agent.name} className="w-5 h-5 rounded-full object-cover" /> : <agent.icon className={`w-3.5 h-3.5 ${agent.color}`} />}
              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-card ${statusColor(agent.status)}`} />
            </div>
            {agent.name}
          </button>
        ))}
      </div>

      {currentAgent && (
        <div className="flex gap-3 mb-3 flex-1 min-h-0">
          <div className="shrink-0">
            {currentAgent.avatar ? <img src={currentAgent.avatar} alt={currentAgent.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" /> : (
              <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"><currentAgent.icon className={`w-6 h-6 ${currentAgent.color}`} /></div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-sm font-display font-bold text-primary">{currentAgent.name} <span className="text-muted-foreground font-body font-normal text-xs">({currentAgent.role})</span></p>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-2 h-2 rounded-full ${statusColor(currentAgent.status)}`} />
              <span className="text-[10px] text-muted-foreground">{currentAgent.type} • {currentAgent.status}</span>
            </div>
            <div ref={scrollRef} className="space-y-2 max-h-[140px] overflow-y-auto flex-1">
              {(messages[activeAgent] || []).map((m) => (
                <div key={m.id} className={`px-3 py-2 rounded-lg text-xs ${m.role === "user" ? "bg-nile/10 ml-4" : "bg-secondary"}`}>
                  <div className={`font-display font-bold ${m.role === "user" ? "text-nile" : "text-primary"}`}>{m.role === "user" ? "You" : currentAgent.name}</div>
                  {m.content && <span className="font-body text-sm text-card-foreground whitespace-pre-wrap">{m.content}</span>}
                  <Attachment meta={m.metadata} />
                </div>
              ))}
              {streaming && (
                <div className="px-3 py-2 rounded-lg text-xs bg-secondary">
                  <span className="font-display font-bold text-primary">{currentAgent.name}:</span>{" "}
                  <span className="font-body text-sm text-card-foreground whitespace-pre-wrap">{streaming}<span className="animate-pulse">▍</span></span>
                </div>
              )}
              {!messages[activeAgent]?.length && !streaming && (
                <p className="text-xs text-muted-foreground italic">ابدأ المحادثة مع {currentAgent.name}...</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
        <button onClick={createTaskFromChat} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary text-foreground text-xs font-display hover:bg-secondary/80 transition-colors shrink-0" title="Create task from last message">
          <PenSquare className="w-3.5 h-3.5" />
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => onPickFiles(e.target.files)} accept="application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
        <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => onPickFiles(e.target.files)} />
        <div className="relative shrink-0">
          <button onClick={() => setAttachOpen((v) => !v)} disabled={loading || recording} className={`p-2 rounded-md transition-colors disabled:opacity-50 ${attachOpen ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-primary hover:bg-secondary"}`} title="Attach">
            <Paperclip className="w-4 h-4" />
          </button>
          {attachOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAttachOpen(false)} />
              <div className="absolute bottom-full mb-2 left-0 z-50 w-44 bg-popover border border-border rounded-md shadow-xl p-1 grid grid-cols-2 gap-1">
                <button onClick={() => { setAttachOpen(false); imageInputRef.current?.click(); }} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-secondary text-foreground">
                  <ImageIcon className="w-5 h-5 text-nile" />
                  <span className="text-[10px] font-display">Image</span>
                </button>
                <button onClick={() => { setAttachOpen(false); fileInputRef.current?.click(); }} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-secondary text-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-display">File</span>
                </button>
                <button onClick={shareLocation} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-secondary text-foreground">
                  <MapPin className="w-5 h-5 text-blood-red" />
                  <span className="text-[10px] font-display">Location</span>
                </button>
                <button onClick={shareContact} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-secondary text-foreground">
                  <UserIcon className="w-5 h-5 text-scarab" />
                  <span className="text-[10px] font-display">Contact</span>
                </button>
              </div>
            </>
          )}
        </div>

        {recording ? (
          <div className="flex-1 flex items-center gap-2 bg-blood-red/10 border border-blood-red/40 rounded-md px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-blood-red animate-pulse" />
            <span className="text-xs font-display text-blood-red">REC {Math.floor(recSeconds/60)}:{String(recSeconds%60).padStart(2,"0")}</span>
            <div className="flex-1" />
            <button onClick={cancelRecording} className="p-1 text-muted-foreground hover:text-blood-red"><X className="w-4 h-4" /></button>
            <button onClick={stopRecording} className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/80" title="Send voice"><Send className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
            placeholder={loading ? "Sending..." : `Message ${currentAgent?.name}...`}
            className="flex-1 bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 min-w-0"
          />
        )}

        {!recording && !input.trim() ? (
          <button onClick={startRecording} disabled={loading} className="p-2 rounded-md bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 disabled:opacity-50" title="Record voice message">
            <Mic className="w-4 h-4" />
          </button>
        ) : !recording ? (
          <button onClick={sendMessage} disabled={loading} className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition-colors shrink-0 disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ChatHubCard;
