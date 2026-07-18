// Drains pending webhook_deliveries created by audit_logs trigger and sends them.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: pending } = await service
      .from("webhook_deliveries")
      .select("*, webhooks!inner(*)")
      .eq("status", "pending")
      .lt("attempts", 5)
      .limit(50);

    let sent = 0, failed = 0;
    for (const d of (pending as any[]) || []) {
      const wh = (d as any).webhooks;
      if (!wh?.url) continue;
      let response_status = 0, response_body = "", status = "failed";
      try {
        const r = await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Webhook-Event": d.event, "X-Webhook-Secret": wh.secret || "" },
          body: JSON.stringify({ event: d.event, payload: d.payload, timestamp: new Date().toISOString() }),
        });
        response_status = r.status;
        response_body = (await r.text()).slice(0, 2000);
        status = r.ok ? "delivered" : "failed";
        if (r.ok) sent++; else failed++;
      } catch (e) {
        response_body = String(e); failed++;
      }
      await service.from("webhook_deliveries").update({
        response_status, response_body, status, attempts: (d.attempts || 0) + 1,
        delivered_at: status === "delivered" ? new Date().toISOString() : null,
      }).eq("id", d.id);
    }
    return new Response(JSON.stringify({ processed: (pending || []).length, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
