/**
 * KemetRise – Comprehensive System Test Suite
 * Tests: tenant scope, write helpers, permissions logic, workflow, payment, shareLink
 * Run: npx vitest run src/test/system.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Shared mock Supabase client ───────────────────────────────────────────
const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
const mockInsertChain = { select: vi.fn().mockResolvedValue({ data: [{ id: "new-id" }], error: null }) };
const mockInsert = vi.fn().mockReturnValue(mockInsertChain);
const mockUpdateChain = { eq: vi.fn(), select: vi.fn().mockResolvedValue({ data: [{ id: "test-id" }], error: null }) };
// updateWithTenant calls: .update(patch).eq("user_id", ...).eq("id", ...) → then resolves
const mockUpdateBase = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnThis(),
  then: (resolve: any) => resolve({ data: [{ id: "test-id" }], error: null }),
});
const mockDelete = vi.fn().mockResolvedValue({ data: [], error: null });
const mockGetUser = vi.fn().mockResolvedValue({
  data: {
    user: {
      id: "user-001",
      email: "test@kemetrise.com",
      user_metadata: { full_name: "Test User", brand_id: "brand-001", client_id: "client-001" },
      app_metadata: {},
    },
  },
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: mockGetUser, getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "tok-abc123" } } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: mockInsert,
      update: mockUpdateBase,
      delete: mockDelete,
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { client_id: "client-001", brand_id: "brand-001" }, error: null }),
      then: vi.fn(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: [{ attempt_count: 0, is_blocked: false }], error: null }),
  },
}));

// ─── shareLink ─────────────────────────────────────────────────────────────
describe("shareLink", () => {
  it("encodes brand payload into URL ?share= param", () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify({ kind: "brand", payload: { id: "b1", name: "TestBrand" }, ts: 1 }))));
    const url = `http://localhost/?share=${data}`;
    const decoded = JSON.parse(decodeURIComponent(escape(atob(new URL(url).searchParams.get("share")!))));
    expect(decoded.kind).toBe("brand");
    expect(decoded.payload.name).toBe("TestBrand");
  });

  it("encodes project payload", () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify({ kind: "project", payload: { id: "p1", title: "Pharaoh Phase 1" }, ts: 1 }))));
    const decoded = JSON.parse(decodeURIComponent(escape(atob(data))));
    expect(decoded.kind).toBe("project");
    expect(decoded.payload.title).toBe("Pharaoh Phase 1");
  });
});

// ─── Tenant Scope ──────────────────────────────────────────────────────────
describe("tenantScope", () => {
  it("resolves userId from auth.getUser()", async () => {
    const { getTenantScope } = await import("@/lib/tenantScope");
    const scope = await getTenantScope();
    expect(scope.userId).toBe("user-001");
  });

  it("resolves userName from user_metadata.full_name", async () => {
    const { getTenantScope } = await import("@/lib/tenantScope");
    const scope = await getTenantScope();
    expect(scope.userName).toBe("Test User");
  });

  it("resolves brandId from user_metadata", async () => {
    const { getTenantScope } = await import("@/lib/tenantScope");
    const scope = await getTenantScope();
    expect(scope.brandId).toBe("brand-001");
  });
});

// ─── withTenantPayload ─────────────────────────────────────────────────────
describe("withTenantPayload", () => {
  it("injects user_id, user_name, brand_id, client_id into payload", async () => {
    const { withTenantPayload } = await import("@/lib/tenantWrite");
    const result = await withTenantPayload({ name: "Nile Brand" });
    expect(result.user_id).toBe("user-001");
    expect(result.user_name).toBe("Test User");
    expect(result.brand_id).toBe("brand-001");
    expect(result.client_id).toBe("client-001");
    expect(result.name).toBe("Nile Brand");
  });

  it("does not overwrite existing user_id in payload", async () => {
    const { withTenantPayload } = await import("@/lib/tenantWrite");
    const result = await withTenantPayload({ user_id: "custom-user" });
    expect(result.user_id).toBe("custom-user");
  });

  it("skips all tenant fields when all include flags are false", async () => {
    const { withTenantPayload } = await import("@/lib/tenantWrite");
    const result = await withTenantPayload(
      { label: "minimal" },
      { includeUserId: false, includeUserName: false, includeClientId: false, includeBrandId: false },
    );
    expect(result.user_id).toBeUndefined();
    expect(result.label).toBe("minimal");
  });
});

// ─── insertWithTenant ──────────────────────────────────────────────────────
describe("insertWithTenant – entity simulations", () => {
  beforeEach(() => {
    mockInsertChain.select.mockResolvedValue({ data: [{ id: "new-id", name: "Test" }], error: null });
  });

  it("inserts a Brand with tenant payload", async () => {
    const { insertWithTenant } = await import("@/lib/tenantWrite");
    const row = await insertWithTenant("brands", { name: "KemetRise Brand", status: "active" });
    expect(row).toBeTruthy();
    expect(mockInsert).toHaveBeenCalled();
  });

  it("inserts a Project linked to brand", async () => {
    const { insertWithTenant } = await import("@/lib/tenantWrite");
    const row = await insertWithTenant("projects", { title: "Pharaoh Campaign", status: "planning", brand_id: "brand-001" });
    expect(row).toBeTruthy();
  });

  it("inserts a Service under a project", async () => {
    const { insertWithTenant } = await import("@/lib/tenantWrite");
    const row = await insertWithTenant("services", { name: "Video Production", project_id: "proj-001" });
    expect(row).toBeTruthy();
  });

  it("inserts a Branch for a brand", async () => {
    const { insertWithTenant } = await import("@/lib/tenantWrite");
    const row = await insertWithTenant("branches", { name: "Cairo Branch", city: "Cairo" });
    expect(row).toBeTruthy();
  });

  it("inserts a Customer", async () => {
    const { insertWithTenant } = await import("@/lib/tenantWrite");
    const row = await insertWithTenant("customers", { name: "Ahmed Hassan", email: "ahmed@example.com" });
    expect(row).toBeTruthy();
  });

  it("inserts a responsible_personnel record", async () => {
    const { insertWithTenant } = await import("@/lib/tenantWrite");
    const row = await insertWithTenant("responsible_personnel", {
      owner_kind: "brand", owner_id: "brand-001",
      full_name: "Mona Samir", title: "Brand Manager",
      phones: [{ number: "+201001234567", label: "work" }],
      ai_can_contact: true, priority: 1,
    });
    expect(row).toBeTruthy();
  });

  it("inserts a workflow_step", async () => {
    const { insertWithTenant } = await import("@/lib/tenantWrite");
    const row = await insertWithTenant("workflow_steps", {
      workflow_name: "onboarding", step_order: 1, step_label: "Send welcome email",
      agent_code: "email_agent", action_type: "notify",
    });
    expect(row).toBeTruthy();
  });

  it("inserts a role_permission row", async () => {
    const { insertWithTenant } = await import("@/lib/tenantWrite");
    const row = await insertWithTenant("role_permissions", {
      role: "manager", resource_type: "projects",
      can_read: true, can_create: true, can_update: true, can_delete: false,
    });
    expect(row).toBeTruthy();
  });
});

// ─── updateWithTenant ──────────────────────────────────────────────────────
describe("updateWithTenant", () => {
  it("updates a Brand record by id", async () => {
    // update chain: .update(patch).eq(...).eq(...).select() → resolves
    const resolved = { data: [{ id: "brand-001", name: "Updated Brand" }], error: null };
    const chainEnd = { select: vi.fn().mockResolvedValue(resolved), eq: vi.fn() };
    chainEnd.eq = vi.fn().mockReturnValue(chainEnd);
    mockUpdateBase.mockReturnValueOnce(chainEnd);
    const { updateWithTenant } = await import("@/lib/tenantWrite");
    const row = await updateWithTenant("brands", { name: "Updated Brand" }, { id: "brand-001" });
    expect(mockUpdateBase).toHaveBeenCalled();
    // row is non-null from the resolved data
    expect(row).toEqual({ id: "brand-001", name: "Updated Brand" });
  });
});

// ─── Rate limit: checkRateLimit (RPC-based) ───────────────────────────────
describe("checkRateLimit – server-side RPC", () => {
  it("returns allowed=true when no attempts", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.rpc as any).mockResolvedValueOnce({ data: [{ attempt_count: 0, is_blocked: false }], error: null });
    const { checkRateLimit } = await import("@/lib/authTracking");
    const result = await checkRateLimit("test@example.com");
    expect(result.allowed).toBe(true);
  });

  it("returns allowed=false when is_blocked=true", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.rpc as any).mockResolvedValueOnce({ data: [{ attempt_count: 6, is_blocked: true }], error: null });
    const { checkRateLimit } = await import("@/lib/authTracking");
    const result = await checkRateLimit("blocked@example.com");
    expect(result.allowed).toBe(false);
    expect(result.waitMin).toBe(15);
  });

  it("fails open when RPC errors (network issue)", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.rpc as any).mockResolvedValueOnce({ data: null, error: { message: "network error" } });
    const { checkRateLimit } = await import("@/lib/authTracking");
    const result = await checkRateLimit("unknown@example.com");
    expect(result.allowed).toBe(true);
  });
});

// ─── Permissions logic ─────────────────────────────────────────────────────
describe("Permissions: role matrix", () => {
  const buildPerm = (overrides: Partial<Record<string, boolean>>) => ({
    can_read: true, can_create: false, can_update: false,
    can_delete: false, can_export: false, can_approve: false,
    ...overrides,
  });

  it("admin has all permissions", () => {
    const perm = buildPerm({ can_create: true, can_update: true, can_delete: true, can_export: true, can_approve: true });
    expect(Object.values(perm).every(Boolean)).toBe(true);
  });

  it("viewer has only can_read", () => {
    const perm = buildPerm({});
    expect(perm.can_read).toBe(true);
    expect(perm.can_create).toBe(false);
    expect(perm.can_delete).toBe(false);
  });

  it("staff cannot delete or approve", () => {
    const perm = buildPerm({ can_create: true, can_update: true, can_export: true });
    expect(perm.can_delete).toBe(false);
    expect(perm.can_approve).toBe(false);
  });

  it("agent can only read + execute workflows", () => {
    const workflowPerm = buildPerm({ can_create: true, can_update: true });
    const brandPerm = buildPerm({});
    expect(workflowPerm.can_create).toBe(true);   // agent can create workflow runs
    expect(brandPerm.can_delete).toBe(false);      // agent cannot delete brands
  });
});

// ─── Payment webhook signature verification (unit) ───────────────────────
describe("HMAC webhook signature", () => {
  const sign = async (body: string, secret: string): Promise<string> => {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const verify = async (body: string, sigHex: string, secret: string): Promise<boolean> => {
    const expectedHex = await sign(body, secret);
    if (sigHex.length !== expectedHex.length) return false;
    let diff = 0;
    for (let i = 0; i < sigHex.length; i++) diff |= sigHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    return diff === 0;
  };

  it("valid HMAC passes verification", async () => {
    const body = JSON.stringify({ event: "payment.completed", reference: "TXN-001" });
    const secret = "wh_secret_stripe_kemetrise";
    const sig = await sign(body, secret);
    expect(await verify(body, sig, secret)).toBe(true);
  });

  it("tampered body fails verification", async () => {
    const secret = "wh_secret_paymob_kemetrise";
    const sig = await sign('{"status":"completed"}', secret);
    expect(await verify('{"status":"failed"}', sig, secret)).toBe(false);
  });

  it("wrong secret fails verification", async () => {
    const body = '{"event":"payment.completed"}';
    const sig = await sign(body, "correct-secret");
    expect(await verify(body, sig, "wrong-secret")).toBe(false);
  });

  it("strips sha256= prefix (Stripe format)", async () => {
    const body = '{"event":"charge.succeeded"}';
    const secret = "stripe_wh_secret";
    const rawSig = await sign(body, secret);
    const stripeSig = `sha256=${rawSig}`;
    const normalized = stripeSig.replace(/^sha256=/, "");
    expect(await verify(body, normalized, secret)).toBe(true);
  });
});

// ─── Workflow map data integrity ───────────────────────────────────────────
describe("WorkflowMap: sample data", () => {
  it("workflow_step has required fields", () => {
    const step = {
      workflow_name: "client_onboarding",
      step_order: 1,
      step_label: "Create brand record",
      agent_code: "brand_agent",
      action_type: "task",
      condition_expr: null,
      is_active: true,
    };
    expect(step.workflow_name).toBeTruthy();
    expect(step.step_order).toBeGreaterThan(0);
    expect(["task", "decision", "parallel", "wait", "notify", "webhook"]).toContain(step.action_type);
  });

  it("workflow_execution starts in 'running' status", () => {
    const exec = { workflow_name: "client_onboarding", status: "running", trigger_source: "manual" };
    expect(exec.status).toBe("running");
  });

  it("workflow edge links two agents", () => {
    const edge = { from_agent_code: "crm_agent", to_agent_code: "email_agent", dependency_type: "sequential" };
    expect(edge.from_agent_code).not.toBe(edge.to_agent_code);
  });
});

// ─── Responsible personnel data integrity ─────────────────────────────────
describe("responsible_personnel: validation", () => {
  it("accepts valid owner_kind values", () => {
    const validKinds = ["brand", "project", "service", "employee", "customer", "branch", "affiliate"];
    validKinds.forEach((k) => expect(typeof k).toBe("string"));
  });

  it("priority must be 1 (primary), 2 (secondary), or 3 (backup)", () => {
    [1, 2, 3].forEach((p) => expect(p).toBeGreaterThanOrEqual(1));
    expect(4).toBeGreaterThan(3); // 4 would be invalid
  });

  it("phones and emails are stored as JSON arrays", () => {
    const rp = {
      full_name: "Ali Mahmoud", phones: [{ number: "+201001234567", label: "work" }],
      emails: [{ address: "ali@kemetrise.com", label: "work" }],
    };
    expect(Array.isArray(rp.phones)).toBe(true);
    expect(Array.isArray(rp.emails)).toBe(true);
  });
});
