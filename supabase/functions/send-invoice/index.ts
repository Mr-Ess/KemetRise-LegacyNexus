import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = Deno.env.get("INVOICE_FROM_EMAIL") || "orders@kemetrise.com";
const FROM_NAME = Deno.env.get("INVOICE_FROM_NAME") || "KemetRise Marketplace";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch order with items
    const { data: order, error } = await supabase
      .from("mp_orders")
      .select("*, mp_order_items(*)")
      .eq("id", order_id)
      .single();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no Resend key, just mark as sent and return
    if (!RESEND_API_KEY) {
      await supabase.from("mp_orders").update({ invoice_sent: true }).eq("id", order_id);
      return new Response(JSON.stringify({ success: true, note: "No email provider configured — invoice marked as sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build HTML invoice
    const invoiceHtml = buildInvoiceHtml(order);

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [order.buyer_email],
        subject: `🧾 Invoice ${order.order_number} — ${FROM_NAME}`,
        html: invoiceHtml,
      }),
    });

    if (res.ok) {
      await supabase.from("mp_orders").update({ invoice_sent: true }).eq("id", order_id);
    }

    const resBody = await res.json();
    return new Response(JSON.stringify({ success: res.ok, resend: resBody }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/* ── HTML Invoice Builder ─────────────────────────────── */
function buildInvoiceHtml(order: any): string {
  const items: any[] = order.mp_order_items || [];
  const currency = order.currency || "USD";
  const fmt = (c: number) => `${(c / 100).toFixed(2)} ${currency}`;
  const date = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const statusColor: Record<string, string> = {
    pending: "#d97706", processing: "#2563eb",
    completed: "#059669", cancelled: "#dc2626",
    refunded: "#7c3aed", failed: "#dc2626",
  };
  const sBg: Record<string, string> = {
    pending: "#fef3c7", processing: "#dbeafe",
    completed: "#d1fae5", cancelled: "#fee2e2",
    refunded: "#ede9fe", failed: "#fee2e2",
  };

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#374151">${item.listing_name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;color:#374151">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:#374151">${fmt(item.unit_price)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#111">${fmt(item.total_price)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Invoice ${order.order_number}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:620px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:36px 40px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px">KemetRise</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px">Marketplace Invoice</p>
    </div>

    <!-- Invoice Meta -->
    <div style="padding:32px 40px 0">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
        <div>
          <p style="margin:0;font-size:22px;font-weight:700;color:#111">${order.order_number}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280">Issued on ${date}</p>
        </div>
        <span style="display:inline-block;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${sBg[order.status] || "#f3f4f6"};color:${statusColor[order.status] || "#374151"};text-transform:uppercase;letter-spacing:0.5px">
          ${order.status}
        </span>
      </div>
    </div>

    <!-- Addresses -->
    <div style="display:flex;gap:20px;padding:24px 40px;flex-wrap:wrap">
      <div style="flex:1;min-width:180px;padding:16px;background:#f9fafb;border-radius:10px">
        <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Bill To</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#111">${order.buyer_name}</p>
        <p style="margin:3px 0 0;font-size:13px;color:#6b7280">${order.buyer_email}</p>
        ${order.buyer_phone ? `<p style="margin:3px 0 0;font-size:13px;color:#6b7280">${order.buyer_phone}</p>` : ""}
        ${order.buyer_address ? `<p style="margin:3px 0 0;font-size:13px;color:#6b7280">${order.buyer_address}</p>` : ""}
      </div>
      <div style="flex:1;min-width:180px;padding:16px;background:#f9fafb;border-radius:10px">
        <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Payment Method</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#111">${order.payment_method.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
      </div>
    </div>

    <!-- Items Table -->
    <div style="padding:0 40px 24px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#6366f1">
            <th style="padding:12px;text-align:left;color:#fff;font-weight:600;border-radius:8px 0 0 0">Item</th>
            <th style="padding:12px;text-align:center;color:#fff;font-weight:600">Qty</th>
            <th style="padding:12px;text-align:right;color:#fff;font-weight:600">Unit Price</th>
            <th style="padding:12px;text-align:right;color:#fff;font-weight:600;border-radius:0 8px 0 0">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:14px 12px;text-align:right;font-weight:600;font-size:14px;color:#374151;border-top:2px solid #e5e7eb">Total Amount</td>
            <td style="padding:14px 12px;text-align:right;font-weight:800;font-size:20px;color:#6366f1;border-top:2px solid #e5e7eb">${fmt(order.total_cents)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${order.notes ? `
    <div style="margin:0 40px 24px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase">Notes</p>
      <p style="margin:0;font-size:13px;color:#78350f">${order.notes}</p>
    </div>` : ""}

    <!-- Footer -->
    <div style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:13px;color:#374151;font-weight:500">Thank you for your purchase! 🎉</p>
      <p style="margin:8px 0 0;font-size:12px;color:#9ca3af">If you have any questions, please contact our support team.</p>
      <p style="margin:8px 0 0;font-size:11px;color:#d1d5db">KemetRise Marketplace • legends-hub.lovable.app</p>
    </div>
  </div>
</body>
</html>`;
}
