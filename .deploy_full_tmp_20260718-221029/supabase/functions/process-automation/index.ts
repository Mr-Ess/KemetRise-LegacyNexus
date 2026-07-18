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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pull queued runs
    const { data: runs, error } = await supabase
      .from("automation_runs")
      .select("*, automations(*)")
      .eq("status", "queued")
      .limit(50);

    if (error) throw error;

    const results: any[] = [];
    for (const run of runs || []) {
      const auto = (run as any).automations;
      if (!auto) continue;
      try {
        // Evaluate conditions
        const conds = (auto.conditions || []) as any[];
        const payload = run.payload || {};
        const passes = conds.every((c: any) => {
          const v = payload[c.field];
          switch (c.operator) {
            case "=": return String(v) === String(c.value);
            case "!=": return String(v) !== String(c.value);
            case ">": return Number(v) > Number(c.value);
            case "<": return Number(v) < Number(c.value);
            case "contains": return String(v ?? "").includes(c.value);
            default: return true;
          }
        });

        if (!passes) {
          await supabase.from("automation_runs").update({ status: "skipped" }).eq("id", run.id);
          continue;
        }

        // Execute actions
        for (const act of (auto.actions || []) as any[]) {
          if (act.type === "webhook" && act.value) {
            await fetch(act.value, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ automation: auto.name, payload }),
            }).catch(() => {});
          } else if (act.type === "log") {
            await supabase.from("audit_logs").insert({
              user_id: auto.user_id,
              action: `Automation: ${auto.name}`,
              table_name: auto.trigger_table,
              level: "info",
              module: "Automation",
              details: { action: act, payload },
            });
          } else if (act.type === "notify") {
            await supabase.from("audit_logs").insert({
              user_id: auto.user_id,
              action: act.value || `Automation triggered: ${auto.name}`,
              table_name: auto.trigger_table,
              level: "warning",
              module: "Notification",
              details: { automation_id: auto.id },
            });
          }
        }

        await supabase.from("automation_runs").update({ status: "success" }).eq("id", run.id);
        results.push({ id: run.id, status: "success" });
      } catch (e: any) {
        await supabase.from("automation_runs").update({ status: "error", error: e.message }).eq("id", run.id);
        results.push({ id: run.id, status: "error", error: e.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
