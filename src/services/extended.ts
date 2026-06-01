import { supabase } from "@/integrations/supabase/client";
import { getTenantScope } from "@/lib/tenantScope";
import { tenantDb, scopedSelect } from "@/lib/tenantDb";

export type ExtTable =
  | "brand_owners" | "brand_renewals" | "project_team"
  | "materials" | "inventory" | "suppliers"
  | "logistics_shipping" | "import_export" | "artistic_production"
  | "finance_analytics" | "payment_gateways" | "assets_management"
  | "clients" | "affiliated_agents" | "crm_interactions" | "marketing_campaigns"
  | "heartbeats" | "legal_vault" | "system_alerts"
  | "agent_logs" | "workflow_map"
  | "archive_vault" | "client_mapping" | "client_brand_access"
  | "departments" | "sub_tasks"
  | "responsible_personnel" | "payment_splits" | "payment_methods"
  | "workflow_steps" | "workflow_executions"
  | "role_permissions" | "sector_permissions" | "agent_permissions"
  /* HR & Workforce */
  | "hr_employees" | "hr_attendance" | "hr_leave_requests" | "hr_payroll" | "hr_performance"
  /* Procurement */
  | "purchase_orders" | "vendor_contracts" | "rfq_requests" | "procurement_budget"
  /* Support */
  | "support_tickets" | "ticket_replies";

const TENANT_SCOPED_TABLES: ExtTable[] = [
  "affiliated_agents", "workflow_map",
  "responsible_personnel", "payment_splits", "payment_methods",
  "workflow_steps", "workflow_executions",
  "role_permissions", "sector_permissions", "agent_permissions",
];

const isTenantScopedTable = (table: ExtTable) => TENANT_SCOPED_TABLES.includes(table);

export const extApi = {
  async list(table: ExtTable, opts?: { eq?: Record<string, any>; order?: string }) {
    const eqFilters = { ...(opts?.eq || {}) };
    // Tables without created_at use a fallback order column
    const TABLES_WITHOUT_CREATED_AT: ExtTable[] = ["inventory", "affiliated_agents", "import_export", "assets_management"];
    const TABLE_ORDER_OVERRIDE: Partial<Record<ExtTable, string>> = { crm_interactions: "interaction_date" };
    const defaultOrder = TABLE_ORDER_OVERRIDE[table] ?? (TABLES_WITHOUT_CREATED_AT.includes(table) ? "id" : "created_at");
    return await tenantDb.select(table as any, {
      eq: eqFilters,
      orderBy: opts?.order || defaultOrder,
      ascending: false,
    });
  },
  async create(table: ExtTable, payload: Record<string, any>) {
    const scope = await getTenantScope();
    const rowPayload: Record<string, any> = { ...payload, user_id: scope.userId };

    if (isTenantScopedTable(table)) {
      if (scope.clientId) rowPayload.client_id = scope.clientId;
      if (scope.brandId) rowPayload.brand_id = scope.brandId;
      if (scope.userName) rowPayload.user_name = scope.userName;
    }

    return await tenantDb.insert(table as any, rowPayload);
  },
  async update(table: ExtTable, id: string, patch: Record<string, any>) {
    const scopedPatch: Record<string, any> = { ...patch };
    if (isTenantScopedTable(table)) {
      const scope = await getTenantScope();
      if (scope.clientId && scopedPatch.client_id === undefined) scopedPatch.client_id = scope.clientId;
      if (scope.brandId && scopedPatch.brand_id === undefined) scopedPatch.brand_id = scope.brandId;
      if (scope.userName && scopedPatch.user_name === undefined) scopedPatch.user_name = scope.userName;
    }

    return await tenantDb.update(table as any, scopedPatch, { id }, { includeTenantInPatch: false });
  },
  async remove(table: ExtTable, id: string) {
    await tenantDb.remove(table as any, { id });
  },
};

// Vault settings (singleton per user)
export const vaultSettingsApi = {
  async get() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const rows = await scopedSelect<any>("vault_settings", { eq: { user_id: u.user.id }, limit: 1 });
    return rows[0] || null;
  },
  async upsert(patch: Record<string, any>) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not authenticated");
    return await tenantDb.upsert(
      "vault_settings",
      { user_id: u.user.id, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
      { includeClientId: false, includeBrandId: false },
    );
  },
};
