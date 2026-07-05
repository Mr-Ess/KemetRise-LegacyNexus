import { useState, useCallback } from "react";

export interface AIAgentState {
  businessName: string;
  agentName: string;
  role: string;
  welcomeMessage: string;
  systemPrompt: string;
  tone: string;
  creativityLevel: number;
  rules: string[];
  guardrails: string[];
  workingHours: { [key: string]: { enabled: boolean; start?: string; end?: string } };
  escalationLimit: number;
  connected: boolean;
  aiProvider: string;
  channels: { [key: string]: boolean };
  capabilities: string[];
  responsesToday: number;
  autoResolutionRate: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  analyticsData: {
    dailyConversations: Array<{ day: string; count: number }>;
    topQuestions: Array<{ question: string; count: number }>;
    escalationRate: number;
  };
  n8nEnabled?: boolean;
  n8nWebhookUrl?: string;
}

const DEFAULT_STATE: AIAgentState = {
  businessName: "اسم النشاط",
  agentName: "نوفا",
  role: "sales_assistant",
  welcomeMessage: "أهلاً بيك في [اسم النشاط] 👋 معاك [اسم الروبوت]، أقدر أساعدك في إيه النهاردة؟",
  systemPrompt: `أنت مساعد ذكي محترف لشركة [اسم النشاط].

القواعد الأساسية:
• تحدّث باللهجة العربية المناسبة للجمهور المستهدف
• قدّم معلومات دقيقة فقط بناءً على قاعدة المعرفة المرفقة
• كن ودوداً ومحترفاً في نفس الوقت
• اقترح الحلول المناسبة للمشكلة
• حوّل المحادثة لموظف بشري إذا لم تتمكن من الحل

التخصصات:
• حجز المواعيد والخدمات
• الإجابة على الأسئلة الشائعة
• تقديم عروض وخصومات مناسبة
• متابعة الطلبات والشكاوى`,
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
    whatsapp: true,
    instagram: true,
    messenger: true,
    webchat: true,
    telegram: false,
    email: false,
  },
  capabilities: [
    "حجز مواعيد",
    "اقتراح منتجات/خدمات",
    "أكواد خصم",
    "إجابات أسئلة شائعة",
    "تحويل لموظف",
    "تتبع الطلبات",
  ],
  responsesToday: 147,
  autoResolutionRate: 78,
  avgResponseTime: 320,
  customerSatisfaction: 4.2,
  analyticsData: {
    dailyConversations: [
      { day: "السبت", count: 45 },
      { day: "الأحد", count: 52 },
      { day: "الاثنين", count: 48 },
      { day: "الثلاثاء", count: 61 },
      { day: "الأربعاء", count: 55 },
      { day: "الخميس", count: 58 },
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

export const useAIAgentState = () => {
  const [state, setState] = useState<AIAgentState>(DEFAULT_STATE);

  const updateBasicInfo = useCallback(
    (updates: Partial<AIAgentState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const updateSystemPrompt = useCallback((prompt: string) => {
    setState((prev) => ({ ...prev, systemPrompt: prompt }));
  }, []);

  const setTone = useCallback((tone: string) => {
    setState((prev) => ({ ...prev, tone }));
  }, []);

  const setCreativityLevel = useCallback((level: number) => {
    setState((prev) => ({ ...prev, creativityLevel: level }));
  }, []);

  const addRule = useCallback((rule: string) => {
    setState((prev) => ({ ...prev, rules: [...prev.rules, rule] }));
  }, []);

  const removeRule = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  }, []);

  const updateRule = useCallback((index: number, rule: string) => {
    setState((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) => (i === index ? rule : r)),
    }));
  }, []);

  const addGuardrail = useCallback((guardrail: string) => {
    setState((prev) => ({ ...prev, guardrails: [...prev.guardrails, guardrail] }));
  }, []);

  const removeGuardrail = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      guardrails: prev.guardrails.filter((_, i) => i !== index),
    }));
  }, []);

  const setConnected = useCallback((connected: boolean) => {
    setState((prev) => ({ ...prev, connected }));
  }, []);

  const setAIProvider = useCallback((provider: string) => {
    setState((prev) => ({ ...prev, aiProvider: provider }));
  }, []);

  const toggleChannel = useCallback((channel: string) => {
    setState((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }));
  }, []);

  const addCapability = useCallback((capability: string) => {
    setState((prev) => ({
      ...prev,
      capabilities: [...prev.capabilities, capability],
    }));
  }, []);

  const removeCapability = useCallback((capability: string) => {
    setState((prev) => ({
      ...prev,
      capabilities: prev.capabilities.filter((c) => c !== capability),
    }));
  }, []);

  const setWorkingHours = useCallback(
    (day: string, hours: { enabled: boolean; start?: string; end?: string }) => {
      setState((prev) => ({
        ...prev,
        workingHours: {
          ...prev.workingHours,
          [day]: hours,
        },
      }));
    },
    []
  );

  const setEscalationLimit = useCallback((limit: number) => {
    setState((prev) => ({ ...prev, escalationLimit: limit }));
  }, []);

  return {
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
  };
};
