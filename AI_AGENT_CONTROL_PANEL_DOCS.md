# AI Agent Control Panel - توثيق شامل

## 📋 نظرة عامة

لوحة تحكم الإيجنت الذكي (AI Agent Control Panel) هي منصة شاملة وقابلة للتخصيص بالكامل لإدارة وتكوين وكلاء الذكاء الاصطناعي.

**المميزات الرئيسية:**
- ✅ تصميم عصري وأنيق (React + TailwindCSS + shadcn/ui)
- ✅ دعم كامل للغتين العربية والإنجليزية (i18n)
- ✅ دعم الأرقام العربية (٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩)
- ✅ RTL/LTR تلقائي حسب اللغة
- ✅ قابلة للتخصيص لأي نشاط تجاري (صالون، فندق، عيادة، متجر إلكتروني، مطعم، إلخ)
- ✅ ترث الألوان والخطوط من Design System المضيف تلقائياً
- ✅ Responsive (Mobile/Tablet/Desktop)
- ✅ إمكانية وصول عالية (Accessibility)

---

## 🗂️ البنية الملفية

```
src/
├── components/
│   └── dashboard/
│       ├── AIAgentControlPanel.tsx          # المكون الرئيسي
│       └── AIAgent/
│           ├── KPICards.tsx                 # بطاقات المؤشرات الرئيسية
│           ├── PreviewChat.tsx              # معاينة الردود الحية
│           └── AnalyticsChart.tsx           # التحليلات والرسوم البيانية
├── hooks/
│   └── useAIAgentState.ts                   # إدارة حالة الإيجنت
├── lib/
│   └── numberFormatter.ts                   # دعم الأرقام العربية والإنجليزية
├── pages/
│   ├── AIAgentControlPanel.tsx              # صفحة Dashboard
│   └── admin/
│       └── AdminAIAgentPanel.tsx            # صفحة Admin
├── i18n.ts                                  # ترجمات (عربي + إنجليزي)
└── App.tsx                                  # المسارات والمسارات
```

---

## 🚀 المسارات (Routes)

### للوصول العام:
```
/dashboard/ai-agent  →  لوحة تحكم الإيجنت الذكي (مستخدمون عاديون)
```

### للإدارة:
```
/admin/ai-agent      →  لوحة تحكم الإيجنت الذكي (مسؤولون فقط)
```

---

## 🎨 الأقسام الرئيسية

### 1️⃣ الهيدر (Header)
- عنوان الصفحة: "إعدادات الروبوت الذكي / لوحة تحكم الإيجنت الذكي"
- وصف: "تحديد وظيفة الروبوت، شخصيته، ونبرة تفاعله"
- أزرار الإجراءات:
  - "اختبار الردود" (Outline)
  - "حفظ الإعدادات" (Primary - متدرج)
  - "سجل التعديلات" (History icon)

### 2️⃣ بطاقات المؤشرات (KPI Cards)
شبكة من 4 بطاقات:

| المؤشر | الوصف | الأيقونة |
|--------|-------|---------|
| محادثات اليوم | عدد المحادثات | 💬 MessageSquare |
| معدل الحل التلقائي | نسبة مئوية | ✨ Sparkles |
| متوسط وقت الاستجابة | بالميلي ثانية | ⚡ Zap |
| رضا العملاء | من 5 نجوم | 🤖 Bot |

### 3️⃣ الشبكة الرئيسية (3 أعمدة)

#### العمود الأيسر (2/3)
1. **الهوية الأساسية**
   - اسم الإيجنت (placeholder: "نوفا")
   - اسم النشاط
   - الدور الأساسي (dropdown)
   - رسالة الترحيب

2. **البرومبت النظام**
   - Textarea كبير بخط mono
   - قيمة افتراضية عامة
   - زر "استيراد من قالب جاهز"

3. **نبرة الرد**
   - أزرار متعددة: ودود، رسمي، دافئ، احترافي، فكاهي
   - Slider درجة الإبداع (0-100)

4. **القواعس والسياسات**
   - قائمة مرقمة بدوائر ملونة
   - زر + للإضافة
   - زر X للحذف

5. **حدود الأمان (Guardrails)**
   - مواضيع محظورة
   - حد أقصى للرسائل قبل التصعيد
   - تنبيهات عند طلبات حساسة

6. **ساعات العمل والتصعيد**
   - جدول أيام الأسبوع مع Switch
   - حقول وقت البداية/النهاية
   - حد التحويل للموظف البشري

#### العمود الأيمن (1/3)
1. **حالة الاتصال بالذكاء الاصطناعي**
   - Badge أخضر "متصل"
   - Switch للتفعيل العام
   - اختيار مزود AI (OpenAI, Gemini, Claude, محلي)
   - إحصائيات سريعة

2. **القنوات والوظائف**
   - قائمة قنوات بـ Switches:
     - واتساب للأعمال
     - إنستجرام دايركت
     - ماسنجر فيسبوك
     - محادثة الموقع
     - تيليجرام
     - البريد الإلكتروني
   - Badges للوظائف المُفعّلة

3. **معاينة الردود (Live Preview)**
   - محادثة تفاعلية حقيقية
   - أمثلة سريعة
   - زر "تشغيل محادثة تجريبية"

4. **التقارير والتحليلات**
   - رسم بياني (آخر 7 أيام)
   - أكثر 3 أسئلة تكرارًا
   - نسبة المحادثات التي احتاجت تحويل

---

## 💾 إدارة الحالة (State Management)

استخدام custom hook `useAIAgentState`:

```typescript
const {
  state,                    // الحالة الحالية
  updateBasicInfo,         // تحديث البيانات الأساسية
  updateSystemPrompt,      // تحديث البرومبت
  setTone,                 // تعيين النبرة
  setCreativityLevel,      // تعيين درجة الإبداع
  addRule,                 // إضافة قاعدة
  removeRule,              // حذف قاعدة
  updateRule,              // تحديث قاعدة
  addGuardrail,            // إضافة حد حماية
  removeGuardrail,         // حذف حد حماية
  setConnected,            // تعيين حالة الاتصال
  setAIProvider,           // تعيين مزود AI
  toggleChannel,           // تفعيل/تعطيل قناة
  addCapability,           // إضافة وظيفة
  removeCapability,        // حذف وظيفة
  setWorkingHours,         // تعيين ساعات العمل
  setEscalationLimit,      // تعيين حد التصعيد
} = useAIAgentState();
```

---

## 🌍 الترجمات (i18n)

### إضافة ترجمات جديدة

1. **في ملف `src/i18n.ts`:**

```typescript
const en = {
  // ... الترجمات الإنجليزية
  ai_agent_control_panel: "AI Agent Control Panel",
  // ...
};

const ar = {
  // ... الترجمات العربية
  ai_agent_control_panel: "لوحة تحكم الإيجنت الذكي",
  // ...
};
```

2. **الاستخدام في المكونات:**

```typescript
import { useTranslation } from "react-i18next";

export const MyComponent = () => {
  const { t } = useTranslation();
  
  return <h1>{t("ai_agent_control_panel")}</h1>;
};
```

### قائمة الترجمات الجديدة

- `ai_agent_control_panel`
- `ai_agent_control_description`
- `test_responses`
- `edit_history`
- `save_settings`
- `settings_saved_successfully`
- `error_saving_settings`
- `conversations_today`
- `auto_resolution_rate`
- `avg_response_time`
- `customer_satisfaction`
- `basic_identity`
- `system_prompt`
- `response_tone`
- `security_guardrails`
- `working_hours`
- `channels_features`
- `ai_connection_status`
- `live_preview`
- `analytics_reports`
- ... (المزيد في `i18n.ts`)

---

## 🔢 دعم الأرقام العربية

استخدم `numberFormatter.ts` لتنسيق الأرقام:

```typescript
import { formatNumber, formatPercentage, formatCurrency } from "@/lib/numberFormatter";

// تنسيق رقم عادي
formatNumber(123, 'ar')         // ١٢٣
formatNumber(123, 'en')         // 123

// تنسيق نسبة مئوية
formatPercentage(78, 'ar')      // ٧٨%
formatPercentage(78, 'en')      // 78%

// تنسيق عملة
formatCurrency(1500, 'EGP', 'ar') // ١٥٠٠.٠٠ EGP
formatCurrency(1500, 'EGP', 'en') // EGP 1500.00
```

---

## 🎯 الحالات الافتراضية

كل حقل له قيمة افتراضية قابلة للتخصيص:

```typescript
{
  businessName: "اسم النشاط",
  agentName: "نوفا",
  role: "sales_assistant",
  welcomeMessage: "أهلاً بيك في [اسم النشاط] 👋 معاك [اسم الروبوت]، أقدر أساعدك في إيه النهاردة؟",
  systemPrompt: "...برومبت افتراضي عام...",
  tone: "friendly",
  creativityLevel: 60,
  rules: ["لا تذكر أسعارًا غير معتمدة", ...],
  guardrails: ["مواضيع محظورة: سياسة، دين، كره", ...],
  escalationLimit: 3,
  connected: true,
  aiProvider: "openai",
  channels: { whatsapp: true, instagram: true, ... },
  capabilities: ["حجز مواعيد", "اقتراح منتجات/خدمات", ...]
}
```

---

## 🧪 الاختبار والمعاينة

### Test Responses Dialog
- يفتح نافذة محادثة تفاعلية
- يستدعي الإعدادات الحالية (البرومبت + النبرة + القواعد)
- يعرض رد حي من الإيجنت

### Live Preview Component
- معاينة تجريبية بدون حفظ
- رسائل عينية جاهزة
- يحاكي الاتصال بـ API

---

## 🔐 الأمان والإمكانية الوصول

### الأمان:
- جميع الأزرار بدون نص لها `aria-label` و `title`
- حماية من XSS عبر معالجة المدخلات
- لا حفظ في localStorage (Backend فقط)

### الإمكانية الوصول:
- دعم قارئ الشاشة الكامل
- تنقل بلوحة المفاتيح
- ألوان متباينة (موروثة من النظام)
- Labels واضحة لكل input

---

## 📱 الاستجابة

البنية تدعم:
- **Mobile** (من 320px)
- **Tablet** (من 768px)
- **Desktop** (من 1024px)

الشبكة تتحول تلقائياً من عمود واحد إلى 3 أعمدة.

---

## 🚀 الخطوات التالية

### لربط بـ Backend:
1. في `useAIAgentState.ts` - حفظ إلى Supabase
2. في المكون الرئيسي - استدعاء API عند الحفظ
3. إضافة loading states و error handling

### لإضافة ميزات جديدة:
1. أضف الحقل للـ state (في `useAIAgentState.ts`)
2. أضف callback function (setter)
3. أضف UI component
4. أضف ترجمات (في `i18n.ts`)

---

## 📞 الدعم والمساهمة

للأسئلة أو الاقتراحات:
- تحقق من قسم البرومبت الأصلي
- اطلع على ملف الترجمات لأحدث المصطلحات
- استخدم الـ custom hook للحالة

---

**آخر تحديث:** 2026-07-01
**الإصدار:** 1.0.0
