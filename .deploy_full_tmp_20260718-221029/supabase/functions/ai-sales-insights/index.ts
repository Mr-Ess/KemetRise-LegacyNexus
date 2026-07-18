// AI-powered sales/revenue insights using Lovable AI Gateway
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    // Aggregate user's billing data
    const [{ data: invoices }, { data: subs }, { data: txs }] = await Promise.all([
      supabase.from("invoices").select("amount,currency,status,created_at,paid_at").eq("user_id", user.id).limit(500),
      supabase.from("subscriptions" as any).select("plan_name,status,current_period_end,amount").eq("user_id", user.id).limit(500),
      supabase.from("payment_transactions").select("method,status,amount,created_at").eq("user_id", user.id).limit(500),
    ]);

    const summary = {
      total_invoices: invoices?.length ?? 0,
      paid_total: (invoices ?? []).filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
      pending_total: (invoices ?? []).filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
      active_subs: (subs ?? []).filter((s: any) => s.status === "active").length,
      churn_subs: (subs ?? []).filter((s: any) => s.status === "cancelled" || s.status === "suspended").length,
      payment_methods: [...new Set((txs ?? []).map((t: any) => t.method))],
    };

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ summary, insights: "AI gateway not configured", recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `أنت مستشار مبيعات. حلّل بيانات الإيرادات وقدم 5 توصيات عملية موجزة بالعربية.\nالبيانات: ${JSON.stringify(summary)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Expert SaaS revenue advisor. Reply in Arabic. Be concise, actionable." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      return new Response(JSON.stringify({ summary, error: `AI error: ${aiRes.status}`, detail: text }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const insights = aiData.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ summary, insights, generated_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
