const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { kind, text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const categories = kind === "transaction"
      ? ["income", "expense", "salary", "marketing", "subscription", "tax", "refund", "investment", "other"]
      : ["dev", "design", "marketing", "sales", "ops", "research", "support", "admin", "other"];

    const prompt = `Classify the following ${kind} into ONE of these categories: ${categories.join(", ")}. Reply with ONLY the category word, no explanation.\n\nText: ${text}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "ai_failed", detail: t }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const raw = (j.choices?.[0]?.message?.content || "").toLowerCase().trim().split(/\s+/)[0].replace(/[^a-z]/g, "");
    const category = categories.includes(raw) ? raw : "other";
    return new Response(JSON.stringify({ category }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
