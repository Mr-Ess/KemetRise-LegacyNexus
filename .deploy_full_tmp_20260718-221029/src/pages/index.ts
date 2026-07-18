// supabase/functions/ai-factory-submit/index.ts
//
// Called by n8n (HTTP Request node, "Create Draft + Request Approval") right after
// idea generation, content generation, and image generation are done and the file
// has already been uploaded by n8n into the 'ai-digital-products' storage bucket.
//
// Auth: this endpoint is called with the SERVICE ROLE KEY in an `apikey` /
// `Authorization: Bearer <service_role_key>` header set inside n8n credentials —
// never expose this key anywhere in the frontend.
//
// Body:
// {
//   "run_id": "<n8n execution id, or any uuid you generate at Cron start>",
//   "n8n_execution_id": "12345",
//   "n8n_resume_url_t1": "https://n8n.yourdomain.com/webhook-waiting/<...>",  // from the Tier-1 Wait node
//   "product": {
//     "name": "...", "slug": "...", "description": "...", "long_description": "...",
//     "category": "...", "sub_category": "...", "tags": ["..."],
//     "thumbnail_url": "...", "gallery_urls": ["..."],
//     "price_cents": 4900, "currency": "USD", "pricing_model": "one_time",
//     "file_path": "ai-digital-products/2026/07/06/<run_id>.zip",
//     "file_size_bytes": 1048576, "file_type": "application/zip",
//     "meta": { "model_used": "...", "prompt_used": "...", "generation_cost_usd": 0.42 }
//   }
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { run_id, n8n_execution_id, n8n_resume_url_t1, product } = await req.json();
    if (!run_id || !product?.name) {
      return new Response(JSON.stringify({ error: "run_id and product.name are required" }), { status: 400, headers: corsHeaders });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Insert the draft product
    const { data: draft, error: draftErr } = await service.from("aidpf_products").insert({
      run_id,
      name: product.name,
      slug: product.slug ?? null,
      description: product.description ?? null,
      long_description: product.long_description ?? null,
      category: product.category ?? null,
      sub_category: product.sub_category ?? null,
      tags: product.tags ?? [],
      thumbnail_url: product.thumbnail_url ?? null,
      gallery_urls: product.gallery_urls ?? [],
      price_cents: product.price_cents ?? 0,
      currency: product.currency ?? "USD",
      pricing_model: product.pricing_model ?? "one_time",
      file_path: product.file_path ?? null,
      file_size_bytes: product.file_size_bytes ?? null,
      file_type: product.file_type ?? null,
      meta: product.meta ?? {},
      status: "in_review",
    }).select().single();
    if (draftErr) throw draftErr;

    // 2. Read factory settings (super admin + timeouts)
    const { data: settings } = await service.from("aidpf_settings").select("*").eq("id", 1).single();
    const tier1Minutes = settings?.tier1_timeout_minutes ?? 120;

    // 3. Create the Tier-1 approval queue row
    const tier1Deadline = new Date(Date.now() + tier1Minutes * 60_000).toISOString();
    const { data: queueRow, error: queueErr } = await service.from("aidpf_approval_queue").insert({
      product_id: draft.id,
      run_id,
      tier: 1,
      status: "awaiting_tier1",
      super_admin_id: settings?.super_admin_id ?? null,
      tier2_candidate_ids: settings?.tier2_pool_ids ?? [],
      tier1_deadline: tier1Deadline,
      n8n_execution_id: n8n_execution_id ?? null,
      n8n_resume_url_t1: n8n_resume_url_t1 ?? null,
    }).select().single();
    if (queueErr) throw queueErr;

    // 4. Notify the super admin in-app (existing notifications table)
    if (settings?.super_admin_id) {
      await service.from("notifications").insert({
        user_id: settings.super_admin_id,
        title: "منتج جديد بانتظار موافقتك — AI Product Factory",
        message: `"${product.name}" تم توليده وينتظر موافقتك خلال ${tier1Minutes} دقيقة قبل التصعيد التلقائي.`,
        type: "ai_factory_approval",
      });
    }

    // 5. Log
    await service.from("aidpf_generation_logs").insert({
      run_id, product_id: draft.id, step: "content_generation", level: "info",
      message: "Draft created, Tier-1 approval requested",
      payload: { queue_id: queueRow.id, tier1_deadline: tier1Deadline },
    });

    return new Response(JSON.stringify({
      product_id: draft.id,
      queue_id: queueRow.id,
      tier1_deadline: tier1Deadline,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
