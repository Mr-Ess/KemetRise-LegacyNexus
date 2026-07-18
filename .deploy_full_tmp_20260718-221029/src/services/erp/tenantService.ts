import { supabase } from "@/integrations/supabase/client";

export type SectorCode = 'EDU-01' | 'MED-01' | 'SPT-01' | 'LEG-01' | 'TUR-01' | 'CMP-01' | 'RET-01' | 'MULTI';

export interface Tenant {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  sector_code: SectorCode;
  subscription_plan: string;
  is_active: boolean;
  logo_url?: string | null;
  primary_color: string;
  timezone: string;
  default_currency: string;
  country_code: string;
  tax_id?: string | null;
  legal_name?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowEntry {
  id: string;
  tenant_id: string;
  workflow_code: string;
  workflow_name: string;
  module_layer: 'horizontal' | 'vertical';
  sector_code?: string | null;
  is_enabled: boolean;
  trigger_event?: string | null;
  active_agent_id?: string | null;
  config: Record<string, unknown>;
  n8n_webhook_url?: string | null;
  retry_attempts: number;
  retry_delay_ms: number;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  sector_code: SectorCode;
  subscription_plan?: string;
  logo_url?: string;
  primary_color?: string;
  timezone?: string;
  default_currency?: string;
  country_code?: string;
  tax_id?: string;
  legal_name?: string;
}

// ─── TENANT CRUD ───────────────────────────────────────────────────────────

export async function createTenant(dto: CreateTenantDto): Promise<Tenant> {
  // Use SECURITY DEFINER RPC to bypass RLS on initial tenant creation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('fn_create_tenant', {
    p_name:              dto.name,
    p_slug:              dto.slug,
    p_sector_code:       dto.sector_code,
    p_subscription_plan: dto.subscription_plan ?? 'starter',
    p_default_currency:  dto.default_currency  ?? 'USD',
    p_country_code:      dto.country_code       ?? 'US',
    p_timezone:          dto.timezone           ?? 'UTC',
    p_primary_color:     dto.primary_color      ?? '#6366f1',
    p_logo_url:          dto.logo_url           ?? null,
    p_tax_id:            dto.tax_id             ?? null,
    p_legal_name:        dto.legal_name         ?? null,
  });

  if (error) throw error;
  return data as Tenant;
}

export async function listTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('tenants' as never)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Tenant[];
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants' as never)
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error) return null;
  return data as Tenant;
}

export async function updateTenant(tenantId: string, updates: Partial<CreateTenantDto>): Promise<Tenant> {
  const { data, error } = await supabase
    .from('tenants' as never)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', tenantId)
    .select()
    .single();

  if (error) throw error;
  return data as Tenant;
}

export async function deleteTenant(tenantId: string): Promise<void> {
  const { error } = await supabase
    .from('tenants' as never)
    .delete()
    .eq('id', tenantId);
  if (error) throw error;
}

// ─── WORKFLOW REGISTRY ─────────────────────────────────────────────────────

export async function listWorkflows(tenantId: string): Promise<WorkflowEntry[]> {
  const { data, error } = await supabase
    .from('workflow_registry' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('module_layer')
    .order('workflow_code');

  if (error) throw error;
  return (data ?? []) as WorkflowEntry[];
}

export async function toggleWorkflow(workflowId: string, isEnabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('workflow_registry' as never)
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq('id', workflowId);

  if (error) throw error;
}

export async function updateWorkflowConfig(
  workflowId: string,
  config: Record<string, unknown>,
  n8nWebhookUrl?: string
): Promise<void> {
  const { error } = await supabase
    .from('workflow_registry' as never)
    .update({
      config,
      ...(n8nWebhookUrl ? { n8n_webhook_url: n8nWebhookUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId);

  if (error) throw error;
}

// ─── SECTOR CONFIG ─────────────────────────────────────────────────────────

export async function getSectorConfig(tenantId: string, sectorCode: SectorCode) {
  const { data, error } = await supabase
    .from('sector_configs' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('sector_code', sectorCode)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertSectorConfig(
  tenantId: string,
  sectorCode: SectorCode,
  updates: { ui_widgets?: unknown[]; form_schemas?: unknown; report_pipelines?: unknown[] }
) {
  const { data, error } = await supabase
    .from('sector_configs' as never)
    .upsert({
      tenant_id: tenantId,
      sector_code: sectorCode,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,sector_code' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── SECTOR METADATA ───────────────────────────────────────────────────────
export const SECTOR_META: Record<SectorCode, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  'EDU-01': { label: 'Education & Courses', icon: '🎓', color: '#6366f1', description: 'Courses, instructors, enrollments & attendance' },
  'MED-01': { label: 'Medical & Healthcare', icon: '🏥', color: '#10b981', description: 'EHR, appointments, prescriptions & billing' },
  'SPT-01': { label: 'Sports & Gyms', icon: '🏋️', color: '#f59e0b', description: 'Members, subscriptions, access gates & sessions' },
  'LEG-01': { label: 'Legal Services', icon: '⚖️', color: '#8b5cf6', description: 'Cases, documents, schedules & hourly billing' },
  'TUR-01': { label: 'Tourism & Travel', icon: '✈️', color: '#06b6d4', description: 'Bookings, trips, hotels & agent commissions' },
  'CMP-01': { label: 'Companies & Services', icon: '🏢', color: '#64748b', description: 'Projects, milestones, tickets & SLA tracking' },
  'RET-01': { label: 'Retail',              icon: '🛒', color: '#ec4899', description: 'POS, inventory, loyalty & multi-location retail' },
  'MULTI':  { label: 'Multi-Sector',        icon: '🔮', color: '#a855f7', description: 'Full ERP across all business units' },
};
