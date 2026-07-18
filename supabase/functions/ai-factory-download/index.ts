// supabase/functions/ai-factory-download/index.ts
//
// Called from the STOREFRONT (authenticated user session) when a buyer clicks
// "Download" on a purchased AI-factory digital product. Verifies real
// ownership via mp_purchases before minting a short-lived signed URL against
// the private 'ai-digital-products' bucket. Also mints/reuses a row in
// aidpf_download_tokens purely for audit + max-use tracking.
//
// Body: { "listing_id": "<mp_listings.id>" }
// Auth: standard user JWT (Authorization: Bearer <user_access_token>)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { listing_id } = await req.json();
    if (!listing_id) return new Response(JSON.stringify({ error: "listing_id required" }), { status: 400, headers: corsHeaders });

    const authHeader = req.headers.get("Authorization") ?? "";
    const supUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supUrl, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    const user_id = userData.user.id;

    const service = createClient(supUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Verify a completed purchase exists for this user + listing
    const { data: purchase } = await service
      .from("mp_purchases").select("*")
      .eq("listing_id", listing_id).eq("user_id", user_id).eq("status", "completed")
      .order("purchased_at", { ascending: false }).limit(1).maybeSingle();
    if (!purchase) {
      return new Response(JSON.stringify({ error: "no completed purchase found for this product" }), { status: 403, headers: corsHeaders });
    }

    // 2. Resolve the underlying AI-factory product + file path
    const { data: listing } = await service.from("mp_listings").select("id, meta").eq("id", listing_id).single();
    const aidpfProductId = listing?.meta?.aidpf_product_id;
    if (!aidpfProductId) {
      return new Response(JSON.stringify({ error: "this listing is not an AI-factory product" }), { status: 400, headers: corsHeaders });
    }
    const { data: product } = await service.from("aidpf_products").select("id, file_path").eq("id", aidpfProductId).single();
    if (!product?.file_path) {
      return new Response(JSON.stringify({ error: "file not available" }), { status: 404, headers: corsHeaders });
    }

    // 3. Find or create a token row for audit/rate-limiting
    let { data: token } = await service
      .from("aidpf_download_tokens").select("*")
      .eq("purchase_id", purchase.id).eq("product_id", product.id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!token) {
      const { data: newToken, error: tErr } = await service.from("aidpf_download_tokens").insert({
        product_id: product.id, purchase_id: purchase.id, user_id,
      }).select().single();
      if (tErr) throw tErr;
      token = newToken;
    }

    if (token.use_count >= token.max_uses) {
      return new Response(JSON.stringify({ error: "download limit reached for this purchase" }), { status: 429, headers: corsHeaders });
    }

    // 4. Mint a short-lived signed URL (10 minutes) against the private bucket
    const { data: signed, error: signErr } = await service.storage
      .from("ai-digital-products")
      .createSignedUrl(product.file_path, 600);
    if (signErr) throw signErr;

    await service.from("aidpf_download_tokens").update({ use_count: token.use_count + 1 }).eq("id", token.id);

    return new Response(JSON.stringify({ url: signed.signedUrl, expires_in: 600 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
