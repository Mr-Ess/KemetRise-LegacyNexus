// Generic payment-webhook receiver: verifies HMAC signature, logs events + dispatches
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  // Webhooks are server-to-server; restrict CORS to Supabase dashboard only
  "Access-Control-Allow-Origin": "https://supabase.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

/**
 * Verify HMAC-SHA256 signature sent by a payment gateway.
 * Supports "sha256=<hex>" (Stripe-style) and plain hex formats.
 */
async function verifyHmacSignature(body: string, signatureHeader: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedHex = Array.from(new Uint8Array(expected))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const received = signatureHeader.replace(/^sha256=/, "").toLowerCase().trim();
    // Constant-time comparison to prevent timing attacks
    if (received.length !== expectedHex.length) return false;
    let diff = 0;
    for (let i = 0; i < received.length; i++) diff |= received.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Read body as text first (needed for HMAC verification)
    const rawBody = await req.text();
    let payload: Record<string, any> = {};
    try { payload = JSON.parse(rawBody); } catch { /* non-JSON webhook */ }

    const provider = req.headers.get("x-provider") || payload.provider || "unknown";

    // ── Signature Verification ──────────────────────────────────────────────
    // Look up the gateway's webhook_secret by provider_code
    if (provider !== "unknown") {
      const { data: gw } = await supabase
        .from("payment_gateways")
        .select("webhook_secret, signature_header, test_mode")
        .eq("provider_code", provider)
        .eq("test_mode", false)   // only enforce signature for live gateways
        .maybeSingle();

      if (gw?.webhook_secret) {
        const sigHeader = gw.signature_header || "x-webhook-signature";
        const receivedSig = req.headers.get(sigHeader) || "";
        const valid = await verifyHmacSignature(rawBody, receivedSig, gw.webhook_secret);
        if (!valid) {
          console.error(`[payment-webhook] Invalid signature from provider=${provider}`);
          return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const event = payload.event || payload.type || "payment.event";
    const userId = payload.user_id || payload.metadata?.user_id;
    const status = payload.status || "received";

    if (userId) {
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: `Payment webhook: ${provider}.${event}`,
        table_name: "payment_transactions",
        level: status === "failed" ? "error" : "info",
        module: "Payments",
        details: payload,
      });

      if (payload.reference) {
        await supabase
          .from("payment_transactions")
          .update({ status: payload.status || "completed", metadata: payload })
          .eq("user_id", userId)
          .eq("reference", payload.reference);
      }
    }

    return new Response(JSON.stringify({ received: true, provider, event }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
