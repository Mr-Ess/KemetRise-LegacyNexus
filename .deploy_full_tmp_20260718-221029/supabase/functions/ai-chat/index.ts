import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  session_id: string;
  agent_id: string;
  message: string;
  history?: { role: string; content: string }[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_id, agent_id, message, history = [] }: RequestBody = await req.json();

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(JSON.stringify({ reply: "OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase secrets." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch agent config
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const agentRes = await fetch(`${supabaseUrl}/rest/v1/ai_brand_agents?id=eq.${agent_id}&select=*`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const agents = await agentRes.json();
    const agent = agents[0];

    const systemPrompt = agent?.system_prompt || "You are a helpful AI assistant for KemetRise Legacy Nexus platform. Be concise, professional, and helpful. Support both Arabic and English.";
    const model = agent?.model || "gpt-4o-mini";

    // Build messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json();
      console.error("OpenAI error:", err);
      return new Response(JSON.stringify({ reply: `AI error: ${err?.error?.message || "Unknown error"}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || "No response generated.";

    return new Response(JSON.stringify({ reply, model, tokens: data.usage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("ai-chat function error:", err);
    return new Response(JSON.stringify({ reply: "Internal server error. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
