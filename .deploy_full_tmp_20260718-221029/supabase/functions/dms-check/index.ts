import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: switches, error } = await supabase
      .from("dead_man_switch")
      .select("*")
      .eq("active", true);

    if (error) throw error;

    const now = Date.now();
    const triggered: string[] = [];
    const reminded: string[] = [];

    for (const s of switches || []) {
      const last = new Date(s.last_heartbeat).getTime();
      const deadlineMs = (s.deadline_days ?? 3) * 24 * 60 * 60 * 1000;
      const elapsed = now - last;

      if (elapsed >= deadlineMs && !s.triggered_at) {
        await supabase.from("dead_man_switch").update({ triggered_at: new Date().toISOString() }).eq("id", s.id);
        triggered.push(s.user_id);
      } else if (elapsed >= deadlineMs * 0.66) {
        reminded.push(s.user_id);
      }
    }

    return new Response(JSON.stringify({ checked: switches?.length || 0, triggered, reminded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
