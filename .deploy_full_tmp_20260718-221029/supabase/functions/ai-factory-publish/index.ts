// supabase/functions/ai-factory-publish/index.ts
//
// Called by n8n as the very last step of EVERY path (Tier-1 approved,
// Tier-2 approved, OR Tier-3 auto-fallback). This is the single choke point
// that turns an aidpf_products draft into a live mp_listings row — which is
// what your existing Marketplace.tsx / DigitalMall already query, so the
// product appears in the storefront with ZERO frontend changes.
//
// Body:
// {
//   "product_id": "...",
//   "queue_id": "...",
//   "publish_reason": "tier1_approved" | "tier2_approved" | "auto_fallback",
//   "rejected": false            // if true, marks product 'rejected' and stops
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { product_id, queue_id, publish_reason, rejected } = await req.json();
    if (!product_id) return new Response(JSON.stringify({ error: "product_id required" }), { status: 400, headers: corsHeaders });

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: product, error: pErr } = await service
      .from("aidpf_products").select("*").eq("id", product_id).single();
    if (pErr || !product) return new Response(JSON.stringify({ error: "product not found" }), { status: 404, headers: corsHeaders });

    if (rejected) {
      await service.from("aidpf_products").update({ status: "rejected" }).eq("id", product_id);
      await service.from("aidpf_generation_logs").insert({
        run_id: product.run_id, product_id, step: "publish", level: "info",
        message: "Product rejected, not published",
      });
      return new Response(JSON.stringify({ published: false, status: "rejected" }), { headers: corsHeaders });
    }

    if (product.status === "published" && product.listing_id) {
      return new Response(JSON.stringify({ published: true, listing_id: product.listing_id, already: true }), { headers: corsHeaders });
    }

    // ── Insert into the EXISTING marketplace table — this is the whole trick.
    const { data: listing, error: lErr } = await service.from("mp_listings").insert({
      listing_type: "digital",
      name: product.name,
      slug: product.slug,
      description: product.description,
      long_description: product.long_description,
      thumbnail_url: product.thumbnail_url,
      gallery_urls: product.gallery_urls,
      category: product.category,
      sub_category: product.sub_category,
      tags: product.tags,
      price_cents: product.price_cents,
      currency: product.currency,
      pricing_model: product.pricing_model,
      publisher_name: "KemetRise AI Factory",
      is_verified: true,
      is_new: true,
      is_active: true,
      meta: {
        ...product.meta,
        source: "ai_factory",
        aidpf_product_id: product.id,
        file_type: product.file_type,
        file_size: product.file_size_bytes,
        publish_reason,
      },
    }).select().single();
    if (lErr) throw lErr;

    await service.from("aidpf_products").update({
      status: "published",
      listing_id: listing.id,
    }).eq("id", product_id);

    if (queue_id) {
      await service.from("aidpf_approval_queue").update({ status: publish_reason === "auto_fallback" ? "auto_fallback" : undefined }).eq("id", queue_id);
    }

    await service.from("aidpf_generation_logs").insert({
      run_id: product.run_id, product_id, step: "publish", level: "info",
      message: `Published to mp_listings (${publish_reason})`,
      payload: { listing_id: listing.id },
    });

    // Fire a webhook event through your existing webhook-dispatch pattern if desired:
    // await fetch(`${url}/functions/v1/webhook-dispatch`, { ... event: "product.published" ... })

    return new Response(JSON.stringify({ published: true, listing_id: listing.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
