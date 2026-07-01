import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Bot, Sparkles, Save, MessageSquare, Zap, Plus, X, Settings2,
  ShieldCheck, Upload, History, BarChart3, Clock, Users, PlayCircle,
  AlertTriangle, ChevronDown, ToggleRight, Trash2, Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useAIAgentState } from "@/hooks/useAIAgentState";
import { KPICards } from "./AIAgent/KPICards";
import { PreviewChat } from "./AIAgent/PreviewChat";
import { AnalyticsChart } from "./AIAgent/AnalyticsChart";

const TONE_OPTIONS = [
  { id: "friendly", label: "ودود" },
  { id: "formal", label: "رسمي" },
  { id: "warm", label: "دافئ" },
  { id: "professional", label: "احترافي" },
  { id: "humorous", label: "فكاهي خفيف" },
];

const AI_PROVIDERS = [
  { id: "openai", label: "OpenAI GPT-4" },
  { id: "gemini", label: "Google Gemini" },
  { id: "claude", label: "Anthropic Claude" },
  { id: "local", label: "نموذج محلي" },
];

const CHANNELS = [
  { id: "whatsapp", label: "واتساب للأعمال", icon: MessageSquare },
  { id: "instagram", label: "إنستجرام دايركت", icon: MessageSquare },
  { id: "messenger", label: "ماسنجر فيسبوك", icon: MessageSquare },
  { id: "webchat", label: "محادثة الموقع", icon: MessageSquare },
  { id: "telegram", label: "تيليجرام", icon: MessageSquare },
  { id: "email", label: "البريد الإلكتروني", icon: MessageSquare },
];

const DEFAULT_CAPABILITIES = [
  "حجز مواعيد",
  "اقتراح منتجات/خدمات",
  "أكواد خصم",
  "إجابات أسئلة شائعة",
  "تحويل لموظف",
  "تتبع الطلبات",
];

export const AIAgentControlPanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    state,
    updateBasicInfo,
    updateSystemPrompt,
    setTone,
    setCreativityLevel,
    addRule,
    removeRule,
    updateRule,
    addGuardrail,
    removeGuardrail,
    setConnected,
    setAIProvider,
    toggleChannel,
    addCapability,
    removeCapability,
    setWorkingHours,
    setEscalationLimit,
  } = useAIAgentState();

  const [newRule, setNewRule] = useState("");
  const [newGuardrail, setNewGuardrail] = useState("");
  const [newCapability, setNewCapability] = useState("");
  const [selectedDay, setSelectedDay] = useState("السبت");
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSave = useCallback(async () => {
    try {
      // TODO: Save to backend/Supabase
      toast.success(t("settings_saved_successfully"));
    } catch (error) {
      toast.error(t("error_saving_settings"));
    }
  }, [t]);

  const handleAddRule = useCallback(() => {
    if (newRule.trim()) {
      addRule(newRule);
      setNewRule("");
      toast.success(t("rule_added_successfully"));
    }
  }, [newRule, addRule, t]);

  const handleAddGuardrail = useCallback(() => {
    if (newGuardrail.trim()) {
      addGuardrail(newGuardrail);
      setNewGuardrail("");
      toast.success(t("guardrail_added_successfully"));
    }
  }, [newGuardrail, addGuardrail, t]);

  const handleAddCapability = useCallback(() => {
    if (newCapability.trim() && !state.capabilities.includes(newCapability)) {
      addCapability(newCapability);
      setNewCapability("");
    }
  }, [newCapability, state.capabilities, addCapability]);

  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── Header ────────────────────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("ai_agent_control_panel")}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {t("ai_agent_control_description")}
          </p>
        </div>

        {/* ── Action Buttons ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setPreviewOpen(true)}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              {t("test_responses")}
            </Button>
            <Button
              onClick={() => toast.info(t("changelog_coming_soon"))}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <History className="w-4 h-4" />
              {t("edit_history")}
            </Button>
          </div>
          <Button
            onClick={handleSave}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Save className="w-4 h-4" />
            {t("save_settings")}
          </Button>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────────────────────────── */}
        <KPICards state={state} />

        {/* ── Main Grid (Left: 2/3, Right: 1/3) ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Identity */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  {t("basic_identity")}
                </CardTitle>
                <CardDescription>{t("basic_identity_description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agentName">{t("agent_name")}</Label>
                    <Input
                      id="agentName"
                      placeholder="نوفا"
                      value={state.agentName}
                      onChange={(e) => updateBasicInfo({ agentName: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">{t("business_name")}</Label>
                    <Input
                      id="businessName"
                      placeholder={t("your_business_name")}
                      value={state.businessName}
                      onChange={(e) => updateBasicInfo({ businessName: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{t("primary_role")}</Label>
                  <Select value={state.role} onValueChange={(value) => updateBasicInfo({ role: value })}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">{t("welcome_message")}</Label>
                  <Textarea
                    id="welcomeMessage"
                    placeholder={t("welcome_message_placeholder")}
                    value={state.welcomeMessage}
                    onChange={(e) => updateBasicInfo({ welcomeMessage: e.target.value })}
                    rows={2}
                    className="bg-background/50 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Prompt */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t("system_prompt")}
                </CardTitle>
                <CardDescription>{t("system_prompt_description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={t("system_prompt_placeholder")}
                  value={state.systemPrompt}
                  onChange={(e) => updateSystemPrompt(e.target.value)}
                  className="font-mono text-sm bg-background/50 min-h-40 resize-none"
                />
                <Button variant="outline" size="sm" className="w-full">
                  {t("import_from_template")}
                </Button>
              </CardContent>
            </Card>

            {/* Tone & Creativity */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>{t("response_tone")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>{t("select_tone")}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {TONE_OPTIONS.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => setTone(tone.id)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          state.tone === tone.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("creativity_level")}</Label>
                    <span className="text-2xl font-bold text-primary">{state.creativityLevel}</span>
                  </div>
                  <Slider
                    value={[state.creativityLevel]}
                    onValueChange={(value) => setCreativityLevel(value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("precise_literal")}</span>
                    <span>{t("creative_flexible")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rules & Guardrails */}
            <Tabs defaultValue="rules" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-background/50">
                <TabsTrigger value="rules">{t("rules_policies")}</TabsTrigger>
                <TabsTrigger value="guardrails">{t("security_guardrails")}</TabsTrigger>
              </TabsList>

              <TabsContent value="rules" className="space-y-4">
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      {t("rules_policies")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {state.rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border/50 group"
                        >
                          <span className="mt-1 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-sm pt-0.5">{rule}</span>
                          <button
                            onClick={() => removeRule(idx)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                            aria-label="Remove rule"
                            title="Remove rule"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder={t("add_new_rule")}
                        value={newRule}
                        onChange={(e) => setNewRule(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddRule()}
                        className="bg-background/50"
                      />
                      <Button onClick={handleAddRule} size="sm" className="gap-1">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="guardrails" className="space-y-4">
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      {t("security_guardrails")}
                    </CardTitle>
                    <CardDescription>{t("guardrails_description")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {state.guardrails.map((guardrail, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
                        >
                          <span className="text-sm">{guardrail}</span>
                          <button
                            onClick={() => removeGuardrail(idx)}
                            className="p-1 hover:text-destructive transition-all"
                            aria-label="Remove guardrail"
                            title="Remove guardrail"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder={t("add_new_guardrail")}
                        value={newGuardrail}
                        onChange={(e) => setNewGuardrail(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddGuardrail()}
                        className="bg-background/50"
                      />
                      <Button onClick={handleAddGuardrail} size="sm" className="gap-1">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Working Hours */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {t("working_hours")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {days.map((day) => (
                    <div key={day} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                      <Switch
                        checked={state.workingHours[day]?.enabled || false}
                        onCheckedChange={(checked) => {
                          setWorkingHours(day, {
                            ...state.workingHours[day],
                            enabled: checked,
                          });
                        }}
                      />
                      <span className="text-sm font-medium flex-1">{day}</span>
                      {state.workingHours[day]?.enabled && (
                        <div className="flex gap-2">
                          <Input
                            type="time"
                            defaultValue="09:00"
                            className="bg-background w-20"
                            size={5}
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            defaultValue="18:00"
                            className="bg-background w-20"
                            size={5}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-2">
                  <Label htmlFor="escalationLimit">{t("escalation_limit")}</Label>
                  <Input
                    id="escalationLimit"
                    type="number"
                    min="1"
                    value={state.escalationLimit}
                    onChange={(e) => setEscalationLimit(parseInt(e.target.value))}
                    className="bg-background/50"
                    placeholder={t("escalation_limit_placeholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("escalation_limit_help")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status & Channels */}
          <div className="space-y-6">
            {/* AI Connection Status */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {t("ai_connection_status")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium">{state.connected ? t("connected") : t("disconnected")}</span>
                  </div>
                  <Switch checked={state.connected} onCheckedChange={setConnected} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiProvider">{t("ai_provider")}</Label>
                  <Select value={state.aiProvider} onValueChange={setAIProvider}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs space-y-1 p-3 bg-background/50 rounded-lg">
                  <p><span className="font-semibold">{t("model")}:</span> GPT-4 Turbo</p>
                  <p><span className="font-semibold">{t("responses_today")}:</span> {state.responsesToday}</p>
                  <p><span className="font-semibold">{t("avg_response_time")}:</span> {state.avgResponseTime}ms</p>
                </div>
              </CardContent>
            </Card>

            {/* Channels */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {t("channels_features")}
                </CardTitle>
                <CardDescription>{t("enable_allowed_channels")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {CHANNELS.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
                  >
                    <span className="text-sm">{channel.label}</span>
                    <Switch
                      checked={state.channels[channel.id] || false}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                  </div>
                ))}

                <div className="pt-3 space-y-2">
                  <Label>{t("enabled_capabilities")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {state.capabilities.map((cap) => (
                      <Badge key={cap} variant="secondary" className="cursor-pointer">
                        {cap}
                        <button
                          onClick={() => removeCapability(cap)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder={t("add_capability")}
                      value={newCapability}
                      onChange={(e) => setNewCapability(e.target.value)}
                      className="bg-background/50 text-xs"
                      size={1}
                    />
                    <Button
                      onClick={handleAddCapability}
                      size="sm"
                      className="gap-1"
                      disabled={!newCapability.trim()}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  {t("live_preview")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PreviewChat
                  systemPrompt={state.systemPrompt}
                  tone={state.tone}
                  agentName={state.agentName}
                />
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {t("analytics_reports")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart data={state.analyticsData} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-96 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{t("test_responses")}</CardTitle>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1 hover:bg-background rounded-lg"
                aria-label="Close preview"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <PreviewChat
                systemPrompt={state.systemPrompt}
                tone={state.tone}
                agentName={state.agentName}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
