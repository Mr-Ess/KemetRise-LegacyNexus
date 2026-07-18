// supabase/functions/ai-factory-approve/index.ts
//
// This is the endpoint your Tier-1 / Tier-2 messaging buttons point to
// (WhatsApp/Telegram inline buttons, or a simple signed link opened from an
// email/SMS). It is PUBLIC (no user JWT — the approver may be clicking from
// a chat app, not a logged-in browser session) so security relies on:
//   - an unguessable `queue_id` (uuid)
//   - the responder_id being checked against super_admin_id (tier 1) or
//     tier2_candidate_ids (tier 2)
//
// GET  /ai-factory-approve?queue_id=...&tier=1&decision=approved&responder_id=...
// (GET is used so it also works as a plain tappable link in WhatsApp/Telegram)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function html(body: string) {
  return new Response(
    `<html><body style="font-family:sans-serif;text-align:center;padding:40px">${body}</body></html>`,
    { headers: { ...corsHeaders, "Content-Type": "text/html" } }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const params = new URL(req.url).searchParams;
  const queue_id = params.get("queue_id");
  const tier = Number(params.get("tier"));
  const decision = params.get("decision"); // 'approved' | 'rejected'
  const responder_id = params.get("responder_id");
  const note = params.get("note") ?? null;

  if (!queue_id || !tier || !decision || !responder_id) {
    return html("Missing parameters.");
  }
  if (!["approved", "rejected"].includes(decision)) return html("Invalid decision.");

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: queueRow, error: qErr } = await service
    .from("aidpf_approval_queue").select("*").eq("id", queue_id).single();
  if (qErr || !queueRow) return html("Approval request not found.");

  // Validate the responder is actually eligible for this tier
  if (tier === 1 && responder_id !== queueRow.super_admin_id) {
    return html("You are not the Tier-1 approver for this request.");
  }
  if (tier === 2 && !(queueRow.tier2_candidate_ids || []).includes(responder_id)) {
    return html("You are not one of the Tier-2 approvers for this request.");
  }

  const expectedStatus = tier === 1 ? "awaiting_tier1" : "awaiting_tier2";

  // ── ATOMIC "first responder wins" update ────────────────────────────────
  // This UPDATE only succeeds if the row is STILL in the expected waiting
  // state. Two people clicking at once → only one UPDATE affects a row;
  // the second gets rowCount 0 and is told the window already closed.
  const { data: updated, error: updErr } = await service
    .from("aidpf_approval_queue")
    .update({
      status: decision, // 'approved' | 'rejected'
      decided_by: responder_id,
      decision,
      decision_tier: tier,
    })
    .eq("id", queue_id)
    .eq("status", expectedStatus)
    .select()
    .maybeSingle();

  if (updErr) return html("Server error recording decision.");
  if (!updated) {
    return html("This request was already resolved by someone else or has expired.");
  }

  // Log every response attempt (including the one that "won")
  await service.from("aidpf_approval_responses").insert({
    queue_id, tier, responder_id, decision, note,
  });

  await service.from("aidpf_generation_logs").insert({
    run_id: queueRow.run_id, product_id: queueRow.product_id,
    step: tier === 1 ? "approval_tier1" : "approval_tier2",
    level: "info",
    message: `Tier ${tier} decision: ${decision} by ${responder_id}`,
  });

  // ── Resume the correct n8n Wait node so the workflow continues NOW ──────
  // instead of waiting out the full 2-hour timeout.
  const resumeUrl = tier === 1 ? queueRow.n8n_resume_url_t1 : queueRow.n8n_resume_url_t2;
  if (resumeUrl) {
    try {
      await fetch(resumeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, tier, decided_by: responder_id, queue_id }),
      });
    } catch (_e) {
      // Non-fatal: if the resume call fails, n8n will still pick up the
      // decision via its own polling/timeout path on the next tier check.
    }
  }

  return html(
    decision === "approved"
      ? "✅ Approved — the product will now be published automatically."
      : "❌ Rejected — the product will not be published."
  );
});
