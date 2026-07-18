import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY        = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEFAULT_ADMIN_EMAIL   = "the.one.behind.kemetrise@gmail.com";
const FROM_EMAIL            = Deno.env.get("CONTACT_FROM_EMAIL") || "noreply@kemetrise.com";
const FROM_NAME             = "KemetRise — Legacy Nexus";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Logo SVG (inline) ───────────────────────────────────────────
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="120" height="120">
  <rect width="512" height="512" fill="#000000"/>
  <path d="M 80 230 Q 256 90 432 230" fill="none" stroke="#d4af37" stroke-width="11" stroke-linecap="round"/>
  <text x="256" y="305" font-family="Georgia,'Times New Roman',serif" font-size="60" fill="#d4af37" text-anchor="middle" letter-spacing="12">KEMETRISE</text>
  <text x="256" y="348" font-family="Georgia,'Times New Roman',serif" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="10">LEGACY NEXUS</text>
</svg>`;
const LOGO_DATA = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`;

// ─── Email builders ───────────────────────────────────────────────
function row(label: string, value: string) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 12px;font-weight:bold;background:#111;color:#d4af37;border:1px solid #333;width:160px;font-size:13px;">${label}</td>
      <td style="padding:8px 12px;background:#1a1a1a;color:#e5e5e5;border:1px solid #333;font-size:13px;">${value}</td>
    </tr>`;
}

function buildAdminEmail(params: {
  sectionEn: string; sectionAr: string;
  data: Record<string, string>;
}): string {
  const { sectionEn, sectionAr, data } = params;
  const now = new Date().toLocaleString("en-GB", { timeZone: "Africa/Cairo", hour12: false });

  const tableRows = [
    row("Full Name / الاسم",         data.name    || ""),
    row("Email / البريد",            data.email   || ""),
    row("Phone / الهاتف",            data.phone   || ""),
    row("Company / الشركة",          data.company || ""),
    row("Topic / الموضوع",           data.topic   || ""),
    row("Product / المنتج",          data.product || ""),
    row("Message / الرسالة",        (data.message || "").replace(/\n/g, "<br>")),
    row("Submitted / وقت الإرسال",   now),
  ].join("");

  return `<!DOCTYPE html>
<html dir="ltr"><head><meta charset="UTF-8"><title>New Request</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;">
    <!-- Header -->
    <tr><td style="background:#000;padding:32px 24px;text-align:center;border-bottom:2px solid #d4af37;">
      <img src="${LOGO_DATA}" width="90" height="90" alt="KemetRise" style="display:inline-block;"/>
      <h1 style="color:#d4af37;margin:12px 0 4px;font-size:20px;letter-spacing:3px;">KEMETRISE</h1>
      <p style="color:#888;margin:0;font-size:12px;letter-spacing:2px;">LEGACY NEXUS</p>
    </td></tr>
    <!-- Alert banner -->
    <tr><td style="background:#1a0f00;padding:16px 24px;border-bottom:1px solid #d4af37/30;">
      <p style="margin:0;color:#d4af37;font-size:15px;font-weight:bold;text-align:center;">
        🔔 New Inquiry — ${sectionEn} &nbsp;|&nbsp; طلب جديد — ${sectionAr}
      </p>
    </td></tr>
    <!-- Table -->
    <tr><td style="padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;">
        ${tableRows}
      </table>
    </td></tr>
    <!-- Footer -->
    <tr><td style="background:#111;padding:16px 24px;text-align:center;border-top:1px solid #333;">
      <p style="margin:0;color:#555;font-size:11px;">KemetRise — Legacy Nexus &nbsp;•&nbsp; Auto-generated notification</p>
    </td></tr>
  </table>
</body></html>`;
}

function buildCustomerEmail(params: {
  sectionEn: string; sectionAr: string;
  customerName: string; customerEmail: string;
}): string {
  const { sectionEn, sectionAr, customerName } = params;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Request Received</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <!-- Header -->
    <tr><td style="background:#000;padding:40px 24px;text-align:center;border-bottom:2px solid #d4af37;">
      <img src="${LOGO_DATA}" width="100" height="100" alt="KemetRise" style="display:inline-block;"/>
      <h1 style="color:#d4af37;margin:14px 0 4px;font-size:22px;letter-spacing:4px;">KEMETRISE</h1>
      <p style="color:#888;margin:0;font-size:12px;letter-spacing:3px;">LEGACY NEXUS</p>
    </td></tr>
    <!-- Body EN -->
    <tr><td style="padding:32px 32px 16px;background:#111;">
      <p style="color:#d4af37;font-size:18px;font-weight:bold;margin:0 0 8px;">Thank you, ${customerName}!</p>
      <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">
        We have successfully received your inquiry from the <strong style="color:#d4af37;">${sectionEn}</strong> section.<br>
        Our team will review it and get back to you as soon as possible — usually within <strong style="color:#d4af37;">24 hours</strong>.
      </p>
      <div style="background:#1a1a1a;border-left:3px solid #d4af37;padding:12px 16px;border-radius:4px;margin-bottom:24px;">
        <p style="color:#888;font-size:12px;margin:0 0 4px;">Reference Section / القسم المرجعي</p>
        <p style="color:#d4af37;font-size:14px;font-weight:bold;margin:0;">${sectionEn} — ${sectionAr}</p>
      </div>
    </td></tr>
    <!-- Body AR -->
    <tr><td style="padding:16px 32px 32px;background:#111;border-top:1px solid #222;" dir="rtl">
      <p style="color:#d4af37;font-size:18px;font-weight:bold;margin:0 0 8px;">شكراً لك، ${customerName}!</p>
      <p style="color:#ccc;font-size:14px;line-height:1.8;margin:0 0 16px;">
        تم استلام استفساركم بنجاح من قسم <strong style="color:#d4af37;">${sectionAr}</strong>.<br>
        سيقوم فريقنا بمراجعته والتواصل معكم في أقرب وقت ممكن — في الغالب خلال <strong style="color:#d4af37;">٢٤ ساعة</strong>.
      </p>
      <div style="background:#1a1a1a;border-right:3px solid #d4af37;border-left:none;padding:12px 16px;border-radius:4px;">
        <p style="color:#888;font-size:12px;margin:0 0 4px;">البريد الإلكتروني للتواصل</p>
        <p style="color:#d4af37;font-size:14px;font-weight:bold;margin:0;">support@kemetrise.com</p>
      </div>
    </td></tr>
    <!-- Footer -->
    <tr><td style="background:#000;padding:20px 24px;text-align:center;border-top:2px solid #d4af37;">
      <p style="margin:0 0 4px;color:#d4af37;font-size:12px;letter-spacing:2px;">KEMETRISE — LEGACY NEXUS</p>
      <p style="margin:0;color:#555;font-size:11px;">support@kemetrise.com &nbsp;•&nbsp; kemetrise.com</p>
    </td></tr>
  </table>
</body></html>`;
}

// ─── Main handler ─────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json() as {
      section_en: string;
      section_ar: string;
      data: Record<string, string>;
    };

    const { section_en, section_ar, data } = body;
    if (!data?.email || !data?.name) {
      return new Response(JSON.stringify({ error: "name and email are required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Read admin email from app_settings (fallback to default)
    let adminEmail = DEFAULT_ADMIN_EMAIL;
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: setting } = await sb
        .from("app_settings")
        .select("value")
        .eq("key", "admin_notification_email")
        .maybeSingle();
      if (setting?.value && typeof setting.value === "string") {
        adminEmail = setting.value;
      } else if (setting?.value?.email) {
        adminEmail = setting.value.email;
      }
    } catch { /* use default */ }

    // If no Resend key, just return success (email logging only)
    if (!RESEND_API_KEY) {
      console.log("No RESEND_API_KEY — would have sent to", adminEmail);
      return new Response(JSON.stringify({ success: true, note: "No email provider configured" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const adminHtml    = buildAdminEmail({ sectionEn: section_en, sectionAr: section_ar, data });
    const customerHtml = buildCustomerEmail({
      sectionEn: section_en, sectionAr: section_ar,
      customerName: data.name, customerEmail: data.email,
    });

    const adminSubject    = `🔔 New ${section_en} Request — KemetRise`;
    const customerSubject = `✅ Request Received | تم استلام طلبك — KemetRise`;

    // Send both in parallel
    const [adminRes, customerRes] = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [adminEmail],
          subject: adminSubject,
          html: adminHtml,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [data.email],
          subject: customerSubject,
          html: customerHtml,
          reply_to: adminEmail,
        }),
      }),
    ]);

    const [adminBody, customerBody] = await Promise.all([adminRes.json(), customerRes.json()]);
    const success = adminRes.ok;

    return new Response(JSON.stringify({
      success,
      admin_sent: adminRes.ok,
      customer_sent: customerRes.ok,
      warning: adminRes.ok && !customerRes.ok
        ? "Admin email sent, but customer confirmation email failed."
        : undefined,
      admin: adminBody,
      customer: customerBody,
    }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
