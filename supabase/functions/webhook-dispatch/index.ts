import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { event, payload } = await req.json();
    if (!event) return new Response(JSON.stringify({ error: "event required" }), { status: 400, headers: corsHeaders });

    const authHeader = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    const user_id = userData.user.id;

    const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: hooks } = await service.from("webhooks").select("*").eq("user_id", user_id).eq("active", true);

    const targets = (hooks || []).filter((h: any) => {
      const evs = (h.events || []) as string[];
      return evs.length === 0 || evs.includes(event) || evs.includes("*");
    });

    const results = [];
    for (const h of targets) {
      let response_status = 0, response_body = "", status = "failed";
      try {
        const r = await fetch(h.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Webhook-Event": event, "X-Webhook-Secret": h.secret || "" },
          body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
        });
        response_status = r.status;
        response_body = (await r.text()).slice(0, 2000);
        status = r.ok ? "delivered" : "failed";
      } catch (e) {
        response_body = String(e);
      }
      const { data: del } = await service.from("webhook_deliveries").insert({
        user_id, webhook_id: h.id, event, payload, response_status, response_body, status, attempts: 1, delivered_at: new Date().toISOString(),
      }).select().single();
      results.push(del);
    }
    return new Response(JSON.stringify({ delivered: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
