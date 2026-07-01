import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Platform knowledge injected into every system prompt ──────────────────
const PLATFORM_KNOWLEDGE = `
## KemetRise Legacy Nexus — دليل المنصة

### الأقسام الرئيسية
- لوحة التحكم (/): KPIs، التحليلات، المهام، نظرة عامة على كل شيء
- ERP Cockpit (/erp): موارد المؤسسة — HR، المخزون، اللوجستيات، الحسابات
- مركز العلامات التجارية (/brands): إنشاء وإدارة العلامات التجارية المتعددة
- مركز العمليات (/operations): الإدارة التشغيلية اليومية
- السوق الرقمي (/marketplace): تجارة B2C للمنتجات والخدمات
- المول الرقمي (/digital-mall): مول متعدد البائعين

### بوابات المستخدمين
- بوابة الأدمن (/admin): مركز القيادة العليا — إدارة كاملة
- بوابة الشركاء (/partner): التحليلات، العلامات، الإيرادات
- بوابة الوكلاء (/agent): العملاء، العمولات، التحويلات، المناطق
- بوابة البائعين (/vendor): المنتجات، الطلبات، المحفظة
- بوابة مزودي الخدمة (/provider): القوائم، الطلبات، العملاء
- بوابة التسويق (/marketing): الحملات، الليدز، العائد على الاستثمار
- بوابة المديرين (/manager): الجداول، المهام، الأداء
- بوابة الموظفين (/staff): المهام، الحضور، الجدول
- بوابة المستخدم (/portal): الطلبات، قائمة الأمنيات، الفواتير

### الوحدات الإدارية
- العملاء (/customers): CRM — ملفات تعريف العملاء
- المشاريع (/projects): إدارة المشاريع
- الفروع (/branches): إدارة الفروع المتعددة
- الخدمات (/services): كتالوج الخدمات
- الموظفون (/employees): الموارد البشرية
- الصلاحيات (/permissions): الأدوار والمستخدمون والتحكم في الوصول
- الفريق (/team): إدارة الفريق الداخلي

### المالية والتجارة
- لوحة الإيرادات (/revenue): تحليلات الإيرادات
- بوابات الدفع (/payment-gateways): تكاملات الدفع
- الكوبونات (/coupons) | المستردات (/refunds) | التحليلات المالية (/finance)

### التقنية والنظام
- سجلات التدقيق (/audit-logs) | توثيق API (/api-docs) | مركز المطورين (/developer)
- النسخ الاحتياطية (/backups) | SSO (/sso) | الويب هوك (/webhooks)

### الذكاء الاصطناعي والإنتاجية
- دردشة AI (/chat) | المساعد الصوتي (/voice) | بناء الأتمتة (/automation)
- لوحة المفاتيح السريعة: Ctrl+K للتنقل السريع بين الأقسام

### الأدوار المتاحة
superadmin: وصول كامل | admin: إدارة المنصة والمستخدمين | manager: إدارة الفريق
staff: مهام تشغيلية | partner: شريك أعمال | agent: مندوب مبيعات
vendor: بائع منتجات | provider: مزود خدمة | marketing: فريق التسويق | user: عميل
`;

const ROLE_GUIDE: Record<string, string> = {
  superadmin: "لديك صلاحية وصول كاملة لجميع أقسام المنصة.",
  admin: "تدير المستخدمين والصلاحيات والإعدادات وكل أقسام المنصة.",
  manager: "تركّز على إدارة الفريق والعمليات والتقارير والجداول الزمنية.",
  staff: "تركّز على المهام اليومية والحضور والجدول الزمني والرسائل.",
  partner: "تركّز على تحليلات الأعمال والعلامات التجارية والإيرادات.",
  agent: "تركّز على إدارة العملاء والعمولات والتحويلات والمناطق.",
  vendor: "تركّز على إدارة المنتجات والطلبات والمحفظة المالية.",
  provider: "تركّز على القوائم والطلبات وإدارة عملائك.",
  marketing: "تركّز على الحملات والليدز والتحليلات والعائد على الاستثمار.",
  user: "يمكنك متابعة طلباتك وفواتيرك والتواصل مع الدعم.",
  viewer: "لديك وصول للقراءة فقط — يمكنك عرض التقارير والتحليلات.",
  guest: "مرحباً بك في KemetRise — يمكنك التسجيل للوصول لكامل المنصة.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Optional auth — read role from token if present, else treat as guest
  let userRole = "guest";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient
        .from("user_profiles")
        .select("role")
        .single();
      if (data?.role) userRole = data.role;
    } catch { /* fallback to guest */ }
  }

  try {
    const { messages, model = "google/gemini-2.5-flash", system, currentPage = "/" } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build rich system prompt combining platform knowledge + role + page context
    const platformSystem = `أنت KEMET AI — المساعد الذكي لمنصة KemetRise Legacy Nexus.
مهمتك: مساعدة أي مستخدم في التنقل والفهم والاستخدام الأمثل للمنصة.

الدور الحالي: ${userRole}
الصفحة الحالية: ${currentPage}
${ROLE_GUIDE[userRole] || ROLE_GUIDE.guest}

## قواعد أساسية
- رد بنفس لغة المستخدم (عربي إذا كتب عربي، إنجليزي إذا كتب إنجليزي)
- كن موجزاً ومفيداً ومحترفاً
- عند الإشارة للصفحات اذكر المسار مثل: اذهب إلى /permissions
- استخدم النقاط والفقرات القصيرة
- كن متحمساً ومشجعاً
${PLATFORM_KNOWLEDGE}
${system ?? ""}`;

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use gemini-2.5-flash via OpenAI-compatible endpoint
    const geminiModel = "gemini-2.5-flash";
    const fullMessages = [{ role: "system", content: platformSystem }, ...messages];

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: geminiModel, messages: fullMessages, stream: true }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
