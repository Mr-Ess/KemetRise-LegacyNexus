// Generic payment-webhook receiver: logs events + dispatches via webhooks table
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json().catch(() => ({}));
    const provider = req.headers.get("x-provider") || payload.provider || "unknown";
    const event = payload.event || payload.type || "payment.event";
    const userId = payload.user_id || payload.metadata?.user_id;
    const status = payload.status || "received";

    // Log to audit
    if (userId) {
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: `Payment webhook: ${provider}.${event}`,
        table_name: "payment_transactions",
        level: status === "failed" ? "error" : "info",
        module: "Payments",
        details: payload,
      });

      // Update transaction if reference present
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
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
