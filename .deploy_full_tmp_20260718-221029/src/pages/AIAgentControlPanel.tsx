import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Sparkles, Save, MessageSquare, Zap, Plus, X,
  Settings2, ShieldCheck, Upload, History, BarChart3,
  Clock, PlayCircle, AlertTriangle, ArrowLeft, TrendingUp,
  TrendingDown, ChevronDown, Send, Copy, Trash2, ChevronRight,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AIAgentState } from "@/hooks/useAIAgentState";

// ─── Constants ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "aiAgents_v2";

const DEFAULT_STATE: AIAgentState = {
  businessName: "اسم النشاط",
  agentName: "نوفا",
  role: "sales_assistant",
  welcomeMessage: "أهلاً بيك في [اسم النشاط] 👋 معاك [اسم الروبوت]، أقدر أساعدك في إيه النهاردة؟",
  systemPrompt: `أنت مساعد ذكي محترف لشركة [اسم النشاط].\n\nالقواعد الأساسية:\n• تحدّث باللهجة العربية المناسبة للجمهور المستهدف\n• قدّم معلومات دقيقة فقط بناءً على قاعدة المعرفة المرفقة\n• كن ودوداً ومحترفاً في نفس الوقت\n• اقترح الحلول المناسبة للمشكلة\n• حوّل المحادثة لموظف بشري إذا لم تتمكن من الحل\n\nالتخصصات:\n• حجز المواعيد والخدمات\n• الإجابة على الأسئلة الشائعة\n• تقديم عروض وخصومات مناسبة\n• متابعة الطلبات والشكاوى`,
  tone: "friendly",
  creativityLevel: 60,
  rules: [
    "لا تذكر أسعارًا غير معتمدة",
    "اقترح عروض الولاء للعملاء المتكررين",
    "لا تقدّم استشارات خارج نطاق النشاط",
  ],
  guardrails: [
    "مواضيع محظورة: سياسة، دين، كره",
    "حد أقصى للرسائل قبل التصعيد: 5 رسائل",
    "تنبيه عند طلبات حساسة أو معلومات شخصية",
  ],
  workingHours: {
    السبت: { enabled: true, start: "09:00", end: "18:00" },
    الأحد: { enabled: true, start: "09:00", end: "18:00" },
    الاثنين: { enabled: true, start: "09:00", end: "18:00" },
    الثلاثاء: { enabled: true, start: "09:00", end: "18:00" },
    الأربعاء: { enabled: true, start: "09:00", end: "18:00" },
    الخميس: { enabled: true, start: "09:00", end: "18:00" },
    الجمعة: { enabled: false },
  },
  escalationLimit: 3,
  connected: true,
  aiProvider: "openai",
  channels: {
    whatsapp: true, instagram: true, messenger: true,
    webchat: true, telegram: false, email: false,
  },
  capabilities: [
    "حجز مواعيد", "اقتراح منتجات/خدمات", "أكواد خصم",
    "إجابات أسئلة شائعة", "تحويل لموظف", "تتبع الطلبات",
  ],
  responsesToday: 147,
  autoResolutionRate: 78,
  avgResponseTime: 320,
  customerSatisfaction: 4.2,
  analyticsData: {
    dailyConversations: [
      { day: "السبت", count: 45 }, { day: "الأحد", count: 52 },
      { day: "الاثنين", count: 48 }, { day: "الثلاثاء", count: 61 },
      { day: "الأربعاء", count: 55 }, { day: "الخميس", count: 58 },
      { day: "الجمعة", count: 42 },
    ],
    topQuestions: [
      { question: "ما هي أسعار الخدمات؟", count: 125 },
      { question: "كيف يمكن حجز موعد؟", count: 98 },
      { question: "هل لديكم خصومات؟", count: 87 },
    ],
    escalationRate: 12,
  },
  n8nEnabled: false,
  n8nWebhookUrl: "",
};

// ─── Agent Record (wrapper around AIAgentState) ────────────────────────────
type AgentRecord = {
  id: string;
  createdAt: string;
  state: AIAgentState;
};

function newAgentRecord(overrides?: Partial<AIAgentState>): AgentRecord {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    state: { ...DEFAULT_STATE, agentName: "", businessName: "", ...overrides },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function loadAgents(): AgentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AgentRecord[];
  } catch { /* ignore */ }
  return [newAgentRecord({ agentName: "نوفا", businessName: "اسم النشاط" })];
}

function persistAgents(agents: AgentRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

type PreviewMessage = { role: "user" | "agent"; text: string };

function KPICard({
  icon: Icon, label, value, unit, change, tooltip,
}: {
  icon: React.ElementType; label: string; value: string | number;
  unit?: string; change?: number; tooltip: string;
}) {
  const isUp = (change ?? 0) >= 0;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all duration-200 cursor-default">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {change !== undefined && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-emerald-500" : "text-destructive"}`}>
                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(change)}%
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-foreground">
                  {value}
                  {unit && <span className="text-sm font-normal text-muted-foreground ms-1">{unit}</span>}
                </p>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10 mt-0.5 shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function ToneBtn({ value, label, selected, onClick }: {
  value: string; label: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${selected
        ? "bg-primary text-primary-foreground border-primary shadow-sm"
        : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Agent Sidebar Card ─────────────────────────────────────────────────────
function AgentSideCard({
  agent, active, onClick, onDuplicate, onDelete,
}: {
  agent: AgentRecord; active: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 border ${active
        ? "bg-primary/10 border-primary/40 shadow-sm"
        : "bg-card border-border/40 hover:bg-muted/60 hover:border-border"
      }`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        {(agent.state.agentName || "?").charAt(0).toUpperCase()}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${active ? "text-primary" : "text-foreground"}`}>
          {agent.state.agentName || t("agent") || "إيجنت"}
        </p>
        <p className="text-xs text-muted-foreground truncate">{agent.state.businessName || "—"}</p>
      </div>
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${agent.state.connected ? "bg-emerald-500" : "bg-muted-foreground"}`} />
      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted" aria-label="agent actions">
            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            <Copy className="w-3.5 h-3.5 me-2" /> {t("duplicate") || "تكرار"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 me-2" /> {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Agent Settings Panel ───────────────────────────────────────────────────
function AgentSettingsPanel({
  agent, onChange,
}: {
  agent: AgentRecord;
  onChange: (updated: AIAgentState) => void;
}) {
  const { t } = useTranslation();
  const s = agent.state;
  const update = useCallback((patch: Partial<AIAgentState>) => onChange({ ...s, ...patch }), [s, onChange]);

  // Local UI state
  const [newRule, setNewRule] = useState("");
  const [newGuardrail, setNewGuardrail] = useState("");
  const [newCapability, setNewCapability] = useState("");

  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([
    { role: "agent", text: s.welcomeMessage },
  ]);
  const [previewInput, setPreviewInput] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewEndRef = useRef<HTMLDivElement>(null);

  // Reset preview when agent changes
  useEffect(() => {
    setPreviewMessages([{ role: "agent", text: s.welcomeMessage }]);
  }, [agent.id]);

  const tones = [
    { value: "friendly", label: t("friendly") || "ودود" },
    { value: "formal", label: t("formal") || "رسمي" },
    { value: "warm", label: t("warm") || "دافئ" },
    { value: "professional", label: t("professional") || "احترافي" },
    { value: "light_humor", label: t("light_humor") || "فكاهي خفيف" },
  ];

  const providers = [
    { value: "openai", label: "OpenAI (GPT-4)" },
    { value: "gemini", label: "Google Gemini" },
    { value: "claude", label: "Anthropic Claude" },
    { value: "local", label: t("local_model") || "نموذج محلي" },
  ];

  const channels = [
    { key: "whatsapp", label: t("whatsapp") || "واتساب للأعمال" },
    { key: "instagram", label: t("instagram") || "إنستجرام دايركت" },
    { key: "messenger", label: t("messenger") || "ماسنجر فيسبوك" },
    { key: "webchat", label: t("webchat") || "محادثة الموقع" },
    { key: "telegram", label: t("telegram") || "تيليجرام" },
    { key: "email", label: t("email") || "البريد الإلكتروني" },
  ];

  const days = Object.keys(s.workingHours);

  const handlePreviewSend = () => {
    if (!previewInput.trim()) return;
    const userMsg: PreviewMessage = { role: "user", text: previewInput.trim() };
    setPreviewMessages(prev => [...prev, userMsg]);
    setPreviewInput("");
    setPreviewLoading(true);
    setTimeout(() => {
      setPreviewMessages(prev => [...prev, {
        role: "agent",
        text: `[${s.agentName || "الإيجنت"}] ${t("typing") || "يكتب"}... (${t("tone") || "النبرة"}: ${s.tone})`,
      }]);
      setPreviewLoading(false);
      previewEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 1200);
  };

  const addRule = (rule: string) => update({ rules: [...s.rules, rule] });
  const removeRule = (i: number) => update({ rules: s.rules.filter((_, idx) => idx !== i) });
  const addGuardrail = (g: string) => update({ guardrails: [...s.guardrails, g] });
  const removeGuardrail = (i: number) => update({ guardrails: s.guardrails.filter((_, idx) => idx !== i) });
  const addCapability = (c: string) => update({ capabilities: [...s.capabilities, c] });
  const removeCapability = (c: string) => update({ capabilities: s.capabilities.filter(x => x !== c) });
  const toggleChannel = (ch: string) => update({ channels: { ...s.channels, [ch]: !s.channels[ch] } });
  const setWorkingHours = (day: string, hours: { enabled: boolean; start?: string; end?: string }) =>
    update({ workingHours: { ...s.workingHours, [day]: hours } });

  return (
    <div className="space-y-5">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard icon={MessageSquare} label={t("conversations_today")} value={s.responsesToday} change={12} tooltip={t("conversations_today_tooltip")} />
        <KPICard icon={Sparkles} label={t("auto_resolution_rate")} value={s.autoResolutionRate} unit="%" change={5} tooltip={t("auto_resolution_rate_tooltip")} />
        <KPICard icon={Zap} label={t("avg_response_time")} value={s.avgResponseTime} unit="ms" change={-8} tooltip={t("avg_response_time_tooltip")} />
        <KPICard icon={Bot} label={t("customer_satisfaction")} value={s.customerSatisfaction} unit="/ 5" change={3} tooltip={t("customer_satisfaction_tooltip")} />
      </div>

      {/* Main 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* 1) Basic Identity */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardHeader className="pb-3">
              <SectionHeading icon={Settings2} title={t("basic_identity")} description={t("basic_identity_description")} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("agent_name")}</label>
                  <Input value={s.agentName} onChange={e => update({ agentName: e.target.value })} placeholder="نوفا" className="bg-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("business_name")}</label>
                  <Input value={s.businessName} onChange={e => update({ businessName: e.target.value })} placeholder={t("your_business_name") as string} className="bg-input" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("primary_role")}</label>
                <Select value={s.role} onValueChange={v => update({ role: v })}>
                  <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_assistant">{t("sales_assistant")}</SelectItem>
                    <SelectItem value="support">{t("technical_support")}</SelectItem>
                    <SelectItem value="concierge">{t("concierge")}</SelectItem>
                    <SelectItem value="medical">{t("medical_assistant")}</SelectItem>
                    <SelectItem value="shopping">{t("shopping_advisor")}</SelectItem>
                    <SelectItem value="general">{t("general_assistant")}</SelectItem>
                    <SelectItem value="custom">{t("custom_role")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("welcome_message")}</label>
                <Textarea rows={2} value={s.welcomeMessage} onChange={e => update({ welcomeMessage: e.target.value })} className="bg-input resize-none" />
              </div>
            </CardContent>
          </Card>

          {/* 2) System Prompt */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardHeader className="pb-3">
              <SectionHeading icon={Bot} title={t("system_prompt")} description={t("system_prompt_description")} />
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={s.systemPrompt}
                onChange={e => update({ systemPrompt: e.target.value })}
                className="min-h-40 bg-input font-mono text-xs resize-y"
                placeholder={t("system_prompt_placeholder") as string}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{t("system_prompt_description")}</p>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
                  <ChevronDown className="w-3.5 h-3.5" />{t("import_from_template")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3) Tone & Creativity */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardHeader className="pb-3">
              <SectionHeading icon={Sparkles} title={t("response_tone")} description={t("select_tone")} />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {tones.map(tone => {
                  const selectedTones = s.tone ? s.tone.split(",") : [];
                  const isSelected = selectedTones.includes(tone.value);
                  const handleToggleTone = () => {
                    let newTones: string[];
                    if (isSelected) {
                      if (selectedTones.length > 1) {
                        newTones = selectedTones.filter(t => t !== tone.value);
                      } else {
                        newTones = selectedTones;
                      }
                    } else {
                      newTones = [...selectedTones, tone.value];
                    }
                    update({ tone: newTones.join(",") });
                  };
                  return (
                    <ToneBtn
                      key={tone.value}
                      value={tone.value}
                      label={tone.label}
                      selected={isSelected}
                      onClick={handleToggleTone}
                    />
                  );
                })}
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">{t("creativity_level")}</label>
                  <span className="text-xs text-primary font-semibold">{s.creativityLevel}%</span>
                </div>
                <Slider min={0} max={100} step={5} value={[s.creativityLevel]} onValueChange={([v]) => update({ creativityLevel: v })} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("precise_literal")}</span>
                  <span>{t("creative_flexible")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4) Rules & Guardrails */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardHeader className="pb-3">
              <SectionHeading icon={Settings2} title={t("rules_policies")} />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                {s.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/40">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">{idx + 1}</span>
                    <span className="flex-1 text-sm">{rule}</span>
                    <button onClick={() => removeRule(idx)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="delete rule">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Input value={newRule} onChange={e => setNewRule(e.target.value)} placeholder={t("add_new_rule") as string} className="bg-input text-sm flex-1" onKeyDown={e => { if (e.key === "Enter" && newRule.trim()) { addRule(newRule.trim()); setNewRule(""); } }} />
                  <Button size="sm" variant="outline" onClick={() => { if (newRule.trim()) { addRule(newRule.trim()); setNewRule(""); } }} className="gap-1 shrink-0">
                    <Plus className="w-3.5 h-3.5" />{t("add")}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{t("security_guardrails")}</span>
                </div>
                {s.guardrails.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <span className="flex-1 text-sm">{g}</span>
                    <button onClick={() => removeGuardrail(idx)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="delete guardrail">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Input value={newGuardrail} onChange={e => setNewGuardrail(e.target.value)} placeholder={t("add_new_guardrail") as string} className="bg-input text-sm flex-1" onKeyDown={e => { if (e.key === "Enter" && newGuardrail.trim()) { addGuardrail(newGuardrail.trim()); setNewGuardrail(""); } }} />
                  <Button size="sm" variant="outline" onClick={() => { if (newGuardrail.trim()) { addGuardrail(newGuardrail.trim()); setNewGuardrail(""); } }} className="shrink-0 w-8 p-0">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5) Knowledge Base */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardHeader className="pb-3">
              <SectionHeading icon={Upload} title={t("knowledge_base") || "قاعدة المعرفة"} description={t("knowledge_base_description") || "ارفع ملفاتك لتدريب الإيجنت"} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("upload_files") || "PDF / Word / رابط / أسئلة شائعة"}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("drag_drop") || "اسحب وأفلت الملفات هنا أو انقر للتصفح"}</p>
              </div>
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-start p-2.5 font-medium text-muted-foreground">{t("file_name") || "اسم الملف"}</th>
                      <th className="text-start p-2.5 font-medium text-muted-foreground">{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/30">
                      <td className="p-2.5">FAQ_General.pdf</td>
                      <td className="p-2.5"><Badge className="text-xs bg-emerald-500/15 text-emerald-600 border-emerald-500/30">{t("indexed") || "تمت الفهرسة"}</Badge></td>
                    </tr>
                    <tr className="border-t border-border/30">
                      <td className="p-2.5">Products_Catalog.docx</td>
                      <td className="p-2.5"><Badge variant="outline" className="text-xs">{t("processing") || "قيد المعالجة"}</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 6) Working Hours */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardHeader className="pb-3">
              <SectionHeading icon={Clock} title={t("working_hours")} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {days.map(day => {
                  const h = s.workingHours[day];
                  return (
                    <div key={day} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/30">
                      <Switch checked={h.enabled} onCheckedChange={v => setWorkingHours(day, { ...h, enabled: v })} aria-label={day} />
                      <span className="text-sm font-medium w-20 shrink-0">{day}</span>
                      {h.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input type="time" value={h.start || "09:00"} onChange={e => setWorkingHours(day, { ...h, start: e.target.value })} className="bg-input h-7 text-xs w-28" />
                          <span className="text-muted-foreground text-xs">→</span>
                          <Input type="time" value={h.end || "18:00"} onChange={e => setWorkingHours(day, { ...h, end: e.target.value })} className="bg-input h-7 text-xs w-28" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("status_inactive") || "مغلق"}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <Separator />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("escalation_limit")}</label>
                <Input type="number" min={1} value={s.escalationLimit} onChange={e => update({ escalationLimit: Number(e.target.value) })} className="bg-input" placeholder={t("escalation_limit_placeholder") as string} />
                <p className="text-xs text-muted-foreground">{t("escalation_limit_help")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ──────────────────────────────────── */}
        <div className="space-y-5">

          {/* 7) AI Status */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/15">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t("ai_connection_status")}</p>
                    <Badge className={`text-xs mt-0.5 ${s.connected ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}>
                      {s.connected ? t("connected") : t("disconnected")}
                    </Badge>
                  </div>
                </div>
                <Switch checked={s.connected} onCheckedChange={v => update({ connected: v })} aria-label="toggle connection" />
              </div>
              <Separator />
              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("ai_provider")}</label>
                  <Select value={s.aiProvider} onValueChange={v => update({ aiProvider: v })}>
                    <SelectTrigger className="bg-input text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {providers.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">{t("responses_today")}</p>
                    <p className="font-bold mt-0.5">{s.responsesToday}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">{t("avg_response_time")}</p>
                    <p className="font-bold mt-0.5">{s.avgResponseTime}ms</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <Zap className="w-3.5 h-3.5" />{t("connect_ai_provider") || "ربط بمزود AI"}
              </Button>
            </CardContent>
          </Card>

          {/* n8n Integration */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/15">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t("n8n_integration") || "الربط مع n8n"}</p>
                    <Badge className={`text-xs mt-0.5 ${s.n8nEnabled ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground border-border"}`}>
                      {s.n8nEnabled ? (t("active") || "نشط") : (t("inactive") || "غير نشط")}
                    </Badge>
                  </div>
                </div>
                <Switch checked={!!s.n8nEnabled} onCheckedChange={v => update({ n8nEnabled: v })} aria-label="toggle n8n connection" />
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("n8n_webhook_url") || "رابط ويبهوك n8n (Webhook URL)"}</label>
                  <Input
                    disabled={!s.n8nEnabled}
                    value={s.n8nWebhookUrl || ""}
                    onChange={e => update({ n8nWebhookUrl: e.target.value })}
                    placeholder="https://n8n.yourdomain.com/webhook/..."
                    className="bg-input text-xs"
                  />
                </div>
                <Button
                  disabled={!s.n8nEnabled || !s.n8nWebhookUrl}
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => {
                    toast.promise(
                      new Promise((resolve) => setTimeout(resolve, 1500)),
                      {
                        loading: t("testing_connection") || "جاري اختبار الاتصال مع n8n...",
                        success: t("n8n_connected_successfully") || "تم الاتصال بسير عمل n8n بنجاح ✓",
                        error: t("n8n_connection_failed") || "فشل الاتصال، يرجى التحقق من الرابط",
                      }
                    );
                  }}
                >
                  <PlayCircle className="w-3.5 h-3.5" />{t("test_connection") || "اختبار الاتصال"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 8) Channels & Capabilities */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardHeader className="pb-2">
              <SectionHeading icon={MessageSquare} title={t("channels_features")} description={t("enable_allowed_channels")} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                {channels.map(ch => (
                  <div key={ch.key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm">{ch.label}</span>
                    <Switch checked={!!s.channels[ch.key]} onCheckedChange={() => toggleChannel(ch.key)} aria-label={ch.label} />
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("enabled_capabilities")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.capabilities.map((cap, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
                      {cap}
                      <button onClick={() => removeCapability(cap)} className="hover:text-destructive transition-colors" aria-label="remove">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input value={newCapability} onChange={e => setNewCapability(e.target.value)} placeholder={t("add_capability") as string} className="bg-input text-xs h-8 flex-1" onKeyDown={e => { if (e.key === "Enter" && newCapability.trim()) { addCapability(newCapability.trim()); setNewCapability(""); } }} />
                  <Button size="sm" variant="outline" onClick={() => { if (newCapability.trim()) { addCapability(newCapability.trim()); setNewCapability(""); } }} className="h-8 w-8 p-0 shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 9) Live Preview */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardHeader className="pb-2">
              <SectionHeading icon={PlayCircle} title={t("live_preview")} />
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-48 rounded-xl bg-muted/40 p-3">
                <div className="space-y-2">
                  {previewMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border/50 text-foreground rounded-bl-sm"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {previewLoading && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-3 py-2">
                        <div className="flex gap-1">
                          {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={previewEndRef} />
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input value={previewInput} onChange={e => setPreviewInput(e.target.value)} placeholder={t("type_message") as string} className="bg-input text-xs flex-1" onKeyDown={e => e.key === "Enter" && handlePreviewSend()} />
                <Button size="sm" className="shrink-0" onClick={handlePreviewSend} disabled={previewLoading}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 10) Analytics */}
          <Card className="rounded-2xl border border-border/60 bg-card">
            <CardHeader className="pb-2">
              <SectionHeading icon={BarChart3} title={t("analytics_reports")} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t("conversations_last_7_days")}</p>
                <div className="flex items-end gap-1 h-20">
                  {s.analyticsData.dailyConversations.map((d, i) => {
                    const maxVal = Math.max(...s.analyticsData.dailyConversations.map(x => x.count));
                    const h = Math.round((d.count / maxVal) * 100);
                    return (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors cursor-default" style={{ height: `${h}%` }} />
                              <span className="text-[9px] text-muted-foreground truncate w-full text-center">{d.day.substring(0, 3)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">{d.day}: {d.count}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t("top_questions")}</p>
                <div className="space-y-1.5">
                  {s.analyticsData.topQuestions.map((q, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-primary font-bold w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="truncate">{q.question}</span>
                          <span className="text-muted-foreground shrink-0 ms-2">{q.count}</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.round((q.count / s.analyticsData.topQuestions[0].count) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t("escalation_rate") || "نسبة التصعيد"}</span>
                <Badge variant="outline" className="font-semibold">{s.analyticsData.escalationRate}%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
const AIAgentControlPanelPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [agents, setAgents] = useState<AgentRecord[]>(loadAgents);
  const [activeId, setActiveId] = useState<string>(() => loadAgents()[0]?.id ?? "");
  const [showHistory, setShowHistory] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [dialogMessages, setDialogMessages] = useState<PreviewMessage[]>([]);
  const [dialogInput, setDialogInput] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const dialogEndRef = useRef<HTMLDivElement>(null);

  const activeAgent = agents.find(a => a.id === activeId) ?? agents[0];

  // Initialize dialog messages when opened
  useEffect(() => {
    if (showPreviewDialog && activeAgent) {
      setDialogMessages([
        { role: "agent", text: activeAgent.state.welcomeMessage || `أهلاً بك! أنا مساعدك الذكي.` }
      ]);
    }
  }, [showPreviewDialog, activeAgent]);

  const handleDialogSend = () => {
    if (!dialogInput.trim() || !activeAgent) return;
    const userText = dialogInput.trim();
    const userMsg: PreviewMessage = { role: "user", text: userText };
    setDialogMessages(prev => [...prev, userMsg]);
    setDialogInput("");
    setDialogLoading(true);

    setTimeout(() => {
      const s = activeAgent.state;
      let reply = "";

      const textLower = userText.toLowerCase();
      const rulesStr = s.rules.join(" ");
      const isArabic = /[\u0600-\u06FF]/.test(userText);

      if (textLower.includes("سعر") || textLower.includes("اسعار") || textLower.includes("price") || textLower.includes("cost")) {
        if (rulesStr.includes("أسعار") || rulesStr.includes("سعر") || rulesStr.includes("price")) {
          reply = isArabic
            ? `أهلاً بك. وفقاً لتعليمات وتوجهات ${s.businessName || "النشاط"}، لا يمكنني مشاركة أسعار غير معتمدة رسمياً حالياً. يرجى التواصل مع الإدارة للتفاصيل.`
            : `Hello. In accordance with the guidelines of ${s.businessName || "the business"}, I cannot share unapproved prices at this time. Please contact management for details.`;
        } else {
          reply = isArabic
            ? `بخصوص الأسعار في ${s.businessName || "النشاط"}، يرجى تزويدي بالخدمة أو المنتج المطلوب وسأزودك بالتفاصيل المتاحة.`
            : `Regarding prices at ${s.businessName || "the business"}, please let me know which service or product you are interested in so I can provide details.`;
        }
      } else if (textLower.includes("مرحبا") || textLower.includes("اهلا") || textLower.includes("hello") || textLower.includes("hi") || textLower.includes("سلام")) {
        reply = isArabic
          ? `أهلاً بك! معك ${s.agentName || "نوفا"}، مساعدك الذكي لـ ${s.businessName || "نشاطنا"}. كيف يمكنني مساعدتك اليوم؟`
          : `Hello! I am ${s.agentName || "Nova"}, your AI assistant for ${s.businessName || "our business"}. How can I help you today?`;
      } else if (textLower.includes("حجز") || textLower.includes("موعد") || textLower.includes("book") || textLower.includes("appointment")) {
        reply = isArabic
          ? `بالتأكيد، يسعدني مساعدتك في حجز موعد لدى ${s.businessName || "النشاط"}. يرجى تزويدي باليوم والوقت المناسبين لك.`
          : `Certainly! I'd be happy to help you book an appointment with ${s.businessName || "the business"}. Please provide your preferred date and time.`;
      } else {
        const toneMsg = s.tone.includes("friendly") ? "ودود 🌸" : s.tone.includes("formal") ? "رسمي 👔" : s.tone.includes("warm") ? "دافئ ❤️" : s.tone.includes("professional") ? "احترافي 💼" : "فكاهي خفيف ⚡";
        reply = isArabic
          ? `لقد استقبلت رسالتك كـ مساعد ذكي (${s.agentName || "نوفا"}) لشركة (${s.businessName || "النشاط"}) بدقة إبداع ${s.creativityLevel}%. وسأعمل وفق النبرة المطلوبة: [${toneMsg}].`
          : `I have received your message. As an AI assistant (${s.agentName || "Nova"}) for (${s.businessName || "the business"}) with creativity level ${s.creativityLevel}%, I will respond in a [${s.tone}] tone.`;
      }

      setDialogMessages(prev => [...prev, { role: "agent", text: reply }]);
      setDialogLoading(false);
      setTimeout(() => {
        dialogEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }, 1500);
  };

  const updateActiveAgent = useCallback((updatedState: AIAgentState) => {
    setAgents(prev => prev.map(a => a.id === activeId ? { ...a, state: updatedState } : a));
  }, [activeId]);

  useEffect(() => {
    persistAgents(agents);
  }, [agents]);

  const handleAddAgent = () => {
    const newAgent = newAgentRecord();
    setAgents(prev => [...prev, newAgent]);
    setActiveId(newAgent.id);
    toast.success(t("agent_added") || "تم إضافة إيجنت جديد");
  };

  const handleDuplicateAgent = (id: string) => {
    const source = agents.find(a => a.id === id);
    if (!source) return;
    const dup = {
      ...newAgentRecord(),
      state: { ...source.state, agentName: `${source.state.agentName} (نسخة)` },
    };
    setAgents(prev => [...prev, dup]);
    setActiveId(dup.id);
    toast.success(t("agent_duplicated") || "تم تكرار الإيجنت");
  };

  const handleDeleteAgent = (id: string) => {
    if (agents.length <= 1) {
      toast.error(t("cannot_delete_last_agent") || "لا يمكن حذف آخر إيجنت");
      return;
    }
    setAgents(prev => {
      const filtered = prev.filter(a => a.id !== id);
      if (activeId === id) setActiveId(filtered[0].id);
      return filtered;
    });
    setDeleteConfirmId(null);
    toast.success(t("deleted") || "تم الحذف");
  };

  const handleSave = () => {
    persistAgents(agents);
    toast.success(t("settings_saved_successfully") || "تم حفظ الإعدادات بنجاح ✓");
  };

  if (!activeAgent) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Sticky Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={t("back") as string}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {/* Sidebar toggle */}
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="toggle sidebar" className="hidden lg:flex">
                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${sidebarOpen ? "rotate-180" : ""}`} />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">{t("ai_agent_control_panel")}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block truncate">
                  {activeAgent.state.agentName || t("agent") || "الإيجنت"} — {activeAgent.state.businessName || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
              <Badge variant="outline" className="hidden sm:flex text-xs">
                {agents.length} {t("agents") || "إيجنت"}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="gap-1.5 hidden sm:flex">
                <History className="w-4 h-4" />{t("edit_history")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreviewDialog(true)} className="gap-1.5">
                <PlayCircle className="w-4 h-4" />{t("test_responses")}
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="w-4 h-4" />{t("save_settings")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Agents Sidebar ──────────────────────────────────── */}
        <aside className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? "w-64" : "w-0"} border-e border-border/50 bg-muted/20`}>
          <div className="w-64 h-full flex flex-col">
            <div className="p-3 border-b border-border/40">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("agents") || "الإيجنتات"}
                </p>
                <Badge variant="secondary" className="text-xs">{agents.length}</Badge>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddAgent} className="w-full gap-1.5 text-xs border-dashed hover:border-primary/60 hover:text-primary">
                <Plus className="w-3.5 h-3.5" /> {t("add_agent") || "إيجنت جديد"}
              </Button>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1.5">
                {agents.map(agent => (
                  <AgentSideCard
                    key={agent.id}
                    agent={agent}
                    active={agent.id === activeId}
                    onClick={() => setActiveId(agent.id)}
                    onDuplicate={() => handleDuplicateAgent(agent.id)}
                    onDelete={() => setDeleteConfirmId(agent.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6">
            {/* Mobile: agent switcher strip */}
            <div className="lg:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
              {agents.map(a => (
                <button
                  key={a.id}
                  onClick={() => setActiveId(a.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border shrink-0 transition-all ${a.id === activeId ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
                >
                  <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px] font-bold">
                    {(a.state.agentName || "?").charAt(0)}
                  </span>
                  {a.state.agentName || t("agent") || "إيجنت"}
                </button>
              ))}
              <button
                onClick={handleAddAgent}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 shrink-0 transition-all"
              >
                <Plus className="w-3 h-3" /> {t("add")}
              </button>
            </div>

            <AgentSettingsPanel
              key={activeId}
              agent={activeAgent}
              onChange={updateActiveAgent}
            />
          </div>
        </main>
      </div>

      {/* ── Delete Confirm Dialog ─────────────────────────────── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> {t("confirm_delete") || "تأكيد الحذف"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {t("cannot_undo")}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDeleteAgent(deleteConfirmId)}>
              {t("yes_delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── History Dialog ────────────────────────────────────── */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />{t("edit_history")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-sm text-muted-foreground">
            {t("changelog_coming_soon")}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Full Preview Dialog ───────────────────────────────── */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg bg-card border-border flex flex-col h-[500px]">
          <DialogHeader className="shrink-0 pb-2 border-b border-border/40">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <PlayCircle className="w-5 h-5 text-primary" />{t("test_responses")}
              <Badge variant="outline" className="text-xs ms-1 bg-primary/10 text-primary border-primary/20">{activeAgent.state.agentName || "الإيجنت"}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-2 min-h-0">
            <div className="space-y-3 pr-2">
              {dialogMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted/80 border border-border/50 text-foreground rounded-bl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {dialogLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-bl-sm px-4 py-2.5">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={dialogEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-3 border-t border-border/40 shrink-0">
            <Input
              value={dialogInput}
              onChange={e => setDialogInput(e.target.value)}
              placeholder={t("type_message") as string}
              className="bg-input text-sm flex-1"
              onKeyDown={e => { if (e.key === "Enter" && !dialogLoading) handleDialogSend(); }}
            />
            <Button onClick={handleDialogSend} disabled={dialogLoading} className="gap-1.5 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIAgentControlPanelPage;
