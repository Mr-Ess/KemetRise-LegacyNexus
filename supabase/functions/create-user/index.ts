import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Auth header check ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing authorization header" }, 401);
    }
    const callerToken = authHeader.slice(7);

    const supabaseUrl      = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Admin client (service role — used for Admin API & privilege checks)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ── 2. Verify caller identity ─────────────────────────────────────────
    const { data: { user: caller }, error: authErr } = await adminClient.auth.getUser(callerToken);
    if (authErr || !caller) {
      return json({ error: "Unauthorized" }, 401);
    }

    // ── 3. Check caller is superadmin or admin ────────────────────────────
    const { data: callerProfile } = await adminClient
      .from("user_profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || !["superadmin", "admin"].includes(callerProfile.role)) {
      return json({ error: "Insufficient privileges: only superadmin/admin can create users" }, 403);
    }

    // ── 4. Parse & validate body ──────────────────────────────────────────
    const { full_name, email, password, phone, role } = await req.json();

    if (!full_name || !email || !password) {
      return json({ error: "full_name, email, and password are required" }, 400);
    }
    if (password.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }

    const validRoles = ["admin","manager","staff","provider","partner","agent","vendor","marketing","viewer","user"];
    const assignedRole = validRoles.includes(role) ? role : "user";

    // ── 5. Create auth user via Admin API ─────────────────────────────────
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone: phone ?? null },
    });

    if (createErr || !newUser.user) {
      return json({ error: createErr?.message ?? "Failed to create user" }, 400);
    }

    const userId = newUser.user.id;

    // ── 6. Upsert user_profile ────────────────────────────────────────────
    await adminClient.from("user_profiles").upsert({
      id:              userId,
      full_name,
      phone:           phone ?? null,
      role:            assignedRole,
      preferred_lang:  "ar",
      preferred_theme: "dark",
      is_verified:     true,
      is_suspended:    false,
      onboarding_done: true,
    });

    // ── 7. Insert into user_roles ─────────────────────────────────────────
    await adminClient.from("user_roles").upsert({
      user_id: userId,
      role:    assignedRole,
    });

    return json({ success: true, user_id: userId });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
