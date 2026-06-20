import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── n8n Webhook (configure via env or leave empty) ──────────────
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL ?? "";

async function fireWebhook(payload: Record<string, unknown>) {
  if (!N8N_WEBHOOK_URL) return;
  try {
    await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-fatal — DB insert already succeeded
  }
}

// ─── Types ───────────────────────────────────────────────────────
export type LeadType =
  | "service"
  | "product"
  | "project"
  | "partner"
  | "agent"
  | "demo";

export interface LeadMeta {
  /** human-readable name/title of the item being requested */
  refName?: string;
  /** accent colour for the modal header */
  color?: string;
  /** emoji / icon character */
  icon?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  type: LeadType;
  isAr: boolean;
  meta?: LeadMeta;
}

// ─── Field helpers ───────────────────────────────────────────────
const f = (v: string) => v.trim();

// ─── Label map ───────────────────────────────────────────────────
const MODAL_TITLES: Record<LeadType, { ar: string; en: string }> = {
  service:  { ar: "طلب خدمة", en: "Request a Service" },
  product:  { ar: "طلب منتج / استفسار", en: "Product Inquiry" },
  project:  { ar: "طلب شراكة / تنفيذ مشروع", en: "Project Collaboration Request" },
  partner:  { ar: "التقدم كشريك معتمد", en: "Apply as a Partner" },
  agent:    { ar: "التقدم كوكيل معتمد", en: "Apply as an Authorized Agent" },
  demo:     { ar: "طلب عرض تجريبي", en: "Request a Demo" },
};

const MODAL_SUBTITLES: Record<LeadType, { ar: string; en: string }> = {
  service: { ar: "أرسل تفاصيل طلبك وسيتواصل معك الفريق المختص خلال 24 ساعة.", en: "Submit your request and our specialist team will contact you within 24 hours." },
  product: { ar: "أرسل استفساراً أو طلب شراء وسنتواصل معك بالتفاصيل.", en: "Send an order or inquiry and we'll get back to you with details." },
  project: { ar: "صف مشروعك ونطاقه وسيقوم الفريق التقني بمراجعته وتقديم عرض.", en: "Describe your project scope and our technical team will review and submit a proposal." },
  partner: { ar: "انضم لشبكة شركائنا العالميين — سواء كنت موزعاً أو موردaً أو شريكاً تقنياً.", en: "Join our global partner network — distributor, supplier, or technology partner." },
  agent:   { ar: "تقدّم للحصول على حقوق التوزيع الإقليمية في منطقتك الجغرافية.", en: "Apply for exclusive territorial distribution rights in your geographic region." },
  demo:    { ar: "احجز جلسة عرض تجريبي مع أحد متخصصينا لاستعراض كامل إمكانيات المنصة.", en: "Book a live demo session with one of our specialists to explore the full platform." },
};

// ─── Table routing ────────────────────────────────────────────────
type TableName = "service_requests" | "website_partner_applications" | "website_agent_applications" | "website_project_requests";

const TYPE_TABLE: Record<LeadType, TableName> = {
  service:  "service_requests",
  product:  "service_requests",
  project:  "website_project_requests",
  partner:  "website_partner_applications",
  agent:    "website_agent_applications",
  demo:     "service_requests",
};

// ─── Main component ───────────────────────────────────────────────
export default function LeadCaptureModal({ open, onClose, type, isAr, meta }: Props) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    country: "",
    message: "",
    // partner / agent extras
    partner_type: "",
    website_url: "",
    annual_revenue: "",
    region: "",
    territory: "",
    experience_years: "",
    existing_network: "",
    // project extras
    project_type: "",
    project_scope: "",
    budget_range: "",
    timeline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm({ full_name:"", email:"", phone:"", company_name:"", country:"", message:"", partner_type:"", website_url:"", annual_revenue:"", region:"", territory:"", experience_years:"", existing_network:"", project_type:"", project_scope:"", budget_range:"", timeline:"" });
      setSuccess(false);
      setError("");
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;

  const accentColor = meta?.color ?? "#D4A017";
  const titleObj = MODAL_TITLES[type];
  const subtitleObj = MODAL_SUBTITLES[type];
  const title = isAr ? titleObj.ar : titleObj.en;
  const subtitle = isAr ? subtitleObj.ar : subtitleObj.en;

  const handleSubmit = async () => {
    if (!f(form.full_name) || !f(form.email)) {
      setError(isAr ? "الاسم والبريد الإلكتروني حقلان مطلوبان." : "Full name and email are required.");
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(isAr ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const db = supabase as any;
      const table = TYPE_TABLE[type];

      // Build payload based on type
      let payload: Record<string, unknown> = {
        full_name: f(form.full_name),
        email: f(form.email),
        phone: f(form.phone) || null,
        company_name: f(form.company_name) || null,
        country: f(form.country) || null,
        message: f(form.message) || null,
        status: "pending",
      };

      if (type === "service" || type === "product" || type === "demo") {
        payload = {
          ...payload,
          service_name: meta?.refName ?? (isAr ? "استفسار عام" : "General Inquiry"),
          service_name_ar: meta?.refName ?? "استفسار عام",
          source: type === "demo" ? "landing_demo" : type === "product" ? "products_page" : "services_page",
          customer_name: f(form.full_name),
          customer_email: f(form.email),
          customer_phone: f(form.phone) || null,
        };
      }

      if (type === "partner") {
        payload = {
          ...payload,
          partner_type: f(form.partner_type) || null,
          website_url: f(form.website_url) || null,
          annual_revenue: f(form.annual_revenue) || null,
        };
      }

      if (type === "agent") {
        payload = {
          ...payload,
          region: f(form.region) || null,
          territory: f(form.territory) || null,
          experience_years: f(form.experience_years) || null,
          existing_network: f(form.existing_network) || null,
        };
      }

      if (type === "project") {
        payload = {
          ...payload,
          project_type: f(form.project_type) || null,
          project_scope: f(form.project_scope) || null,
          budget_range: f(form.budget_range) || null,
          timeline: f(form.timeline) || null,
        };
      }

      const { error: dbErr } = await db.from(table).insert(payload);
      if (dbErr) throw dbErr;

      // Fire n8n webhook (non-blocking)
      fireWebhook({ type, table, ...payload, meta, submitted_at: new Date().toISOString() });

      setSuccess(true);
    } catch {
      setError(isAr ? "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-lg max-h-[90vh] flex flex-col",
          "bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl",
          "overflow-hidden",
        )}
        style={{ boxShadow: `0 0 60px ${accentColor}18, 0 25px 50px rgba(0,0,0,0.6)` }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b border-white/10 shrink-0"
          style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, transparent 60%)` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {meta?.icon && (
                <span className="text-2xl shrink-0">{meta.icon}</span>
              )}
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
                {meta?.refName && (
                  <p className="text-xs mt-0.5" style={{ color: accentColor }}>{meta.refName}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">{subtitle}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {success ? (
            <SuccessState isAr={isAr} onClose={onClose} />
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  {error}
                </div>
              )}

              {/* ── Base fields (all types) ── */}
              <div className="grid grid-cols-2 gap-3">
                <Field label={isAr ? "الاسم الكامل *" : "Full Name *"} isAr={isAr}>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={set("full_name")}
                    className={inputCls}
                    placeholder={isAr ? "محمد أحمد" : "John Doe"}
                  />
                </Field>
                <Field label={isAr ? "البريد الإلكتروني *" : "Corporate Email *"} isAr={isAr}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    className={inputCls}
                    placeholder="you@company.com"
                    dir="ltr"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={isAr ? "رقم الهاتف" : "Phone Number"} isAr={isAr}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    className={inputCls}
                    placeholder={isAr ? "+966 5X XXX XXXX" : "+1 (555) 000-0000"}
                    dir="ltr"
                  />
                </Field>
                <Field label={isAr ? "اسم الشركة / المؤسسة" : "Company / Organization"} isAr={isAr}>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={set("company_name")}
                    className={inputCls}
                    placeholder={isAr ? "شركة ABC" : "ABC Corp"}
                  />
                </Field>
              </div>

              {/* ── Country (partner, agent, project, demo) ── */}
              {(type === "partner" || type === "agent" || type === "project" || type === "demo") && (
                <Field label={isAr ? "الدولة" : "Country"} isAr={isAr}>
                  <input
                    type="text"
                    value={form.country}
                    onChange={set("country")}
                    className={inputCls}
                    placeholder={isAr ? "مثال: المملكة العربية السعودية" : "e.g. Saudi Arabia"}
                  />
                </Field>
              )}

              {/* ── Partner-specific fields ── */}
              {type === "partner" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={isAr ? "نوع الشراكة" : "Partner Type"} isAr={isAr}>
                      <select value={form.partner_type} onChange={set("partner_type")} className={inputCls}>
                        <option value="">{isAr ? "اختر..." : "Select..."}</option>
                        <option value="reseller">{isAr ? "موزع / وسيط" : "Reseller"}</option>
                        <option value="supplier">{isAr ? "مورد / منتج" : "Supplier / Manufacturer"}</option>
                        <option value="technology">{isAr ? "شريك تقني" : "Technology Partner"}</option>
                        <option value="logistics">{isAr ? "شركة شحن ولوجستيات" : "Shipping / Logistics"}</option>
                        <option value="integration">{isAr ? "شريك تكامل" : "Integration Partner"}</option>
                      </select>
                    </Field>
                    <Field label={isAr ? "الإيرادات السنوية (تقديرية)" : "Approx. Annual Revenue"} isAr={isAr}>
                      <select value={form.annual_revenue} onChange={set("annual_revenue")} className={inputCls}>
                        <option value="">{isAr ? "اختر..." : "Select..."}</option>
                        <option value="<100k">{isAr ? "أقل من $100K" : "< $100K"}</option>
                        <option value="100k-500k">$100K – $500K</option>
                        <option value="500k-1m">$500K – $1M</option>
                        <option value="1m-5m">$1M – $5M</option>
                        <option value=">5m">{isAr ? "أكثر من $5M" : "> $5M"}</option>
                      </select>
                    </Field>
                  </div>
                  <Field label={isAr ? "موقع الشركة / LinkedIn" : "Website / LinkedIn"} isAr={isAr}>
                    <input
                      type="url"
                      value={form.website_url}
                      onChange={set("website_url")}
                      className={inputCls}
                      placeholder="https://yourcompany.com"
                      dir="ltr"
                    />
                  </Field>
                </>
              )}

              {/* ── Agent-specific fields ── */}
              {type === "agent" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={isAr ? "المنطقة الجغرافية المستهدفة" : "Target Region"} isAr={isAr}>
                      <select value={form.region} onChange={set("region")} className={inputCls}>
                        <option value="">{isAr ? "اختر..." : "Select..."}</option>
                        <option value="الشام">{isAr ? "بلاد الشام" : "The Levant"}</option>
                        <option value="الخليج">{isAr ? "الخليج العربي" : "GCC"}</option>
                        <option value="أوروبا">{isAr ? "أوروبا" : "Europe"}</option>
                        <option value="أمريكا الشمالية">{isAr ? "أمريكا الشمالية" : "North America"}</option>
                        <option value="أفريقيا">{isAr ? "شمال أفريقيا" : "North Africa"}</option>
                        <option value="other">{isAr ? "أخرى" : "Other"}</option>
                      </select>
                    </Field>
                    <Field label={isAr ? "سنوات الخبرة في التوزيع" : "Distribution Experience (years)"} isAr={isAr}>
                      <select value={form.experience_years} onChange={set("experience_years")} className={inputCls}>
                        <option value="">{isAr ? "اختر..." : "Select..."}</option>
                        <option value="<2">{isAr ? "أقل من سنتين" : "< 2 years"}</option>
                        <option value="2-5">{isAr ? "2 – 5 سنوات" : "2 – 5 years"}</option>
                        <option value="5-10">{isAr ? "5 – 10 سنوات" : "5 – 10 years"}</option>
                        <option value=">10">{isAr ? "أكثر من 10 سنوات" : "> 10 years"}</option>
                      </select>
                    </Field>
                  </div>
                  <Field label={isAr ? "الأراضي / المناطق التي تغطيها حالياً" : "Currently Covered Territories"} isAr={isAr}>
                    <input
                      type="text"
                      value={form.territory}
                      onChange={set("territory")}
                      className={inputCls}
                      placeholder={isAr ? "مثال: الرياض، جدة، الدمام" : "e.g. Riyadh, Jeddah, Dammam"}
                    />
                  </Field>
                  <Field label={isAr ? "وصف شبكتك التوزيعية الحالية" : "Describe Your Current Distribution Network"} isAr={isAr}>
                    <textarea
                      value={form.existing_network}
                      onChange={set("existing_network")}
                      rows={2}
                      className={cn(inputCls, "resize-none")}
                      placeholder={isAr ? "صف عملاءك ونقاط البيع وشبكة الشركاء الحاليين..." : "Describe your clients, points of sale and current partner network..."}
                    />
                  </Field>
                </>
              )}

              {/* ── Project-specific fields ── */}
              {type === "project" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={isAr ? "نوع المشروع" : "Project Type"} isAr={isAr}>
                      <select value={form.project_type} onChange={set("project_type")} className={inputCls}>
                        <option value="">{isAr ? "اختر..." : "Select..."}</option>
                        <option value="saas">{isAr ? "منصة SaaS / ERP" : "SaaS / ERP Platform"}</option>
                        <option value="ecommerce">{isAr ? "تجارة إلكترونية" : "E-Commerce"}</option>
                        <option value="ai">{isAr ? "ذكاء اصطناعي / أتمتة" : "AI / Automation"}</option>
                        <option value="media">{isAr ? "إعلام وإنتاج" : "Media & Production"}</option>
                        <option value="logistics">{isAr ? "لوجستيات وتوزيع" : "Logistics & Distribution"}</option>
                        <option value="custom">{isAr ? "مشروع مخصص" : "Custom Project"}</option>
                      </select>
                    </Field>
                    <Field label={isAr ? "الميزانية التقديرية" : "Estimated Budget"} isAr={isAr}>
                      <select value={form.budget_range} onChange={set("budget_range")} className={inputCls}>
                        <option value="">{isAr ? "اختر..." : "Select..."}</option>
                        <option value="<10k">{isAr ? "أقل من $10K" : "< $10K"}</option>
                        <option value="10k-50k">$10K – $50K</option>
                        <option value="50k-150k">$50K – $150K</option>
                        <option value="150k-500k">$150K – $500K</option>
                        <option value=">500k">{isAr ? "أكثر من $500K" : "> $500K"}</option>
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={isAr ? "الإطار الزمني المتوقع" : "Expected Timeline"} isAr={isAr}>
                      <select value={form.timeline} onChange={set("timeline")} className={inputCls}>
                        <option value="">{isAr ? "اختر..." : "Select..."}</option>
                        <option value="urgent">{isAr ? "عاجل — أقل من شهر" : "Urgent — < 1 month"}</option>
                        <option value="1-3m">{isAr ? "1 – 3 أشهر" : "1 – 3 months"}</option>
                        <option value="3-6m">{isAr ? "3 – 6 أشهر" : "3 – 6 months"}</option>
                        <option value=">6m">{isAr ? "أكثر من 6 أشهر" : "> 6 months"}</option>
                      </select>
                    </Field>
                    <Field label={isAr ? "نطاق المشروع (ملخص)" : "Project Scope (summary)"} isAr={isAr}>
                      <input
                        type="text"
                        value={form.project_scope}
                        onChange={set("project_scope")}
                        className={inputCls}
                        placeholder={isAr ? "مثال: منصة SaaS متعددة المستأجرين" : "e.g. Multi-tenant SaaS platform"}
                      />
                    </Field>
                  </div>
                </>
              )}

              {/* ── Message / details (all types) ── */}
              <Field
                label={
                  type === "agent"   ? (isAr ? "تفاصيل إضافية عن طلب التوكيل" : "Additional Details About Your Agency Request") :
                  type === "partner" ? (isAr ? "لماذا تريد الانضمام كشريك؟" : "Why do you want to join as a partner?") :
                  type === "project" ? (isAr ? "تفاصيل إضافية عن المشروع" : "Additional Project Details") :
                                       (isAr ? "تفاصيل الطلب" : "Request Details")
                }
                isAr={isAr}
              >
                <textarea
                  value={form.message}
                  onChange={set("message")}
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                  placeholder={
                    type === "agent"   ? (isAr ? "صف خلفيتك وخبرتك وسبب تقدمك لهذا التوكيل..." : "Describe your background, experience and motivation for this agency...") :
                    type === "partner" ? (isAr ? "صف طبيعة أعمالك وما تبحث عنه في الشراكة..." : "Describe your business and what you're looking for in this partnership...") :
                    type === "project" ? (isAr ? "أضف أي تفاصيل إضافية أو متطلبات خاصة..." : "Add any additional details or special requirements...") :
                                         (isAr ? "أضف أي ملاحظات أو تفاصيل حول طلبك..." : "Add any notes or details about your request...")
                  }
                />
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
            <p className="text-[10px] text-white/30">
              {isAr ? "* حقل مطلوب — بياناتك محمية ولا تُشارك مع أطراف ثالثة." : "* Required — your data is protected and never shared."}
            </p>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={submitting}
                className="text-white/50 hover:text-white text-xs"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-1.5 text-xs text-black font-semibold"
                style={{ background: accentColor }}
              >
                {submitting ? (
                  <><Loader2 className="w-3 h-3 animate-spin" />{isAr ? "جاري الإرسال..." : "Sending..."}</>
                ) : (
                  <><Send className="w-3 h-3" />{isAr ? "إرسال الطلب" : "Send Request"}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────
function Field({ label, isAr, children }: { label: string; isAr: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1", isAr && "items-end")}>
      <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

// ─── Input class ─────────────────────────────────────────────────
const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-colors";

// ─── Success state ────────────────────────────────────────────────
function SuccessState({ isAr, onClose }: { isAr: boolean; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">
          {isAr ? "تم استلام طلبك بنجاح!" : "Request Received!"}
        </h3>
        <p className="text-sm text-white/60 leading-relaxed max-w-sm">
          {isAr
            ? "تم استلام طلبك بنجاح، وسيقوم الموظف الرقمي المختص بالتواصل معك فوراً خلال 24 ساعة عمل."
            : "Your request has been received. Our specialist digital agent will contact you within 24 business hours."}
        </p>
      </div>
      <Button
        size="sm"
        onClick={onClose}
        className="text-xs"
        variant="outline"
      >
        {isAr ? "حسناً، شكراً!" : "Got it, thanks!"}
      </Button>
    </div>
  );
}
