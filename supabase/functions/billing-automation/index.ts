// Auto-suspend overdue subscriptions + send renewal reminders (7/3/1 days)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();
  const results = { suspended: 0, reminders: 0, errors: [] as string[] };

  try {
    // 1. Auto-suspend: subscriptions past current_period_end + 3 day grace, status=active
    const graceCutoff = new Date(now.getTime() - 3 * 86400000).toISOString();
    const { data: overdue } = await supabase
      .from("subscriptions" as any)
      .select("id,user_id,current_period_end,status")
      .eq("status", "active")
      .lt("current_period_end", graceCutoff);

    for (const sub of overdue ?? []) {
      const { error } = await supabase
        .from("subscriptions" as any)
        .update({ status: "suspended" })
        .eq("id", (sub as any).id);
      if (error) results.errors.push(error.message);
      else results.suspended++;
    }

    // 2. Reminders: 7/3/1 day windows
    for (const days of [7, 3, 1]) {
      const start = new Date(now.getTime() + (days - 0.5) * 86400000).toISOString();
      const end = new Date(now.getTime() + (days + 0.5) * 86400000).toISOString();
      const { data: due } = await supabase
        .from("subscriptions" as any)
        .select("id,user_id,current_period_end,plan_name")
        .eq("status", "active")
        .gte("current_period_end", start)
        .lte("current_period_end", end);

      for (const sub of due ?? []) {
        await supabase.from("audit_logs").insert({
          user_id: (sub as any).user_id,
          action: `Renewal reminder - ${days}d`,
          table_name: "subscriptions",
          record_id: (sub as any).id,
          level: days === 1 ? "warning" : "info",
          module: "Billing",
          details: { days_until_renewal: days, plan: (sub as any).plan_name },
        });
        results.reminders++;
      }
    }

    return new Response(JSON.stringify({ ok: true, ...results, ran_at: now.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
