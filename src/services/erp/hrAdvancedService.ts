import { supabase } from "@/integrations/supabase/client";
import { emitQRScan, emitPayrollRun } from "./telemetryService";
import type { SectorCode } from "./tenantService";

// ─── QR ATTENDANCE ────────────────────────────────────────────────────────

export async function generateQRToken(tenantId: string, employeeId: string): Promise<string> {
  const { data, error } = await supabase.rpc('fn_generate_qr_token' as never, {
    p_tenant_id: tenantId,
    p_employee_id: employeeId,
  });

  if (error) throw error;
  return data as string;
}

export async function processQRScan(
  tenantId: string,
  sectorCode: SectorCode,
  qrPayload: string,
  eventType: 'check_in' | 'check_out' = 'check_in'
) {
  const { data, error } = await supabase.rpc('fn_process_qr_scan' as never, {
    p_tenant_id: tenantId,
    p_qr_payload: qrPayload,
    p_event_type: eventType,
  });

  if (error) throw error;
  const result = data as { success: boolean; event_id?: string; employee_id?: string; error?: string };

  if (result.success && result.event_id && result.employee_id) {
    await emitQRScan(tenantId, sectorCode, result.event_id, result.employee_id);
  }

  return result;
}

// ─── ATTENDANCE EVENTS ─────────────────────────────────────────────────────

export async function listAttendanceEvents(tenantId: string, date?: string) {
  let q = supabase
    .from('hr_attendance_events' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('scan_timestamp', { ascending: false });

  if (date) q = q.eq('event_date', date);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getAttendanceSummary(tenantId: string, dateFrom?: string, dateTo?: string) {
  let q = supabase
    .from('hr_attendance_summary' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('summary_date', { ascending: false });

  if (dateFrom) q = q.gte('summary_date', dateFrom);
  if (dateTo)   q = q.lte('summary_date', dateTo);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// ─── BIOMETRIC DEVICES ─────────────────────────────────────────────────────

export async function listBiometricDevices(tenantId: string) {
  const { data, error } = await supabase
    .from('hr_biometric_devices' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function registerBiometricDevice(tenantId: string, device: {
  device_name: string;
  device_type: 'fingerprint' | 'facial' | 'iris' | 'rfid';
  device_serial?: string;
  ip_address?: string;
  location?: string;
  api_endpoint?: string;
}) {
  const { data, error } = await supabase
    .from('hr_biometric_devices' as never)
    .insert({ tenant_id: tenantId, ...device })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── PAYROLL OPERATIONS ────────────────────────────────────────────────────

export async function createPayrollCycle(tenantId: string, cycle: {
  cycle_name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('hr_payroll_cycles' as never)
    .insert({ tenant_id: tenantId, ...cycle })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listPayrollCycles(tenantId: string) {
  const { data, error } = await supabase
    .from('hr_payroll_cycles' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('pay_period_start', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function approvePayrollCycle(cycleId: string, tenantId: string, sectorCode: SectorCode) {
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('hr_payroll_cycles' as never)
    .update({
      status: 'approved',
      processed_by: user.user?.id,
      processed_at: new Date().toISOString(),
    })
    .eq('id', cycleId)
    .select()
    .single();

  if (error) throw error;
  await emitPayrollRun(tenantId, sectorCode, cycleId);
  return data;
}

export async function upsertPayrollEntry(tenantId: string, entry: {
  cycle_id: string;
  employee_id: string;
  base_salary: number;
  bonuses?: number;
  allowances?: number;
  commissions?: number;
  tax_deduction?: number;
  social_insurance?: number;
  absence_deduction?: number;
  late_deduction?: number;
  session_deduction?: number;
  other_deductions?: number;
  days_present?: number;
  days_absent?: number;
  days_late?: number;
  payment_method?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('hr_payroll_entries' as never)
    .upsert({ tenant_id: tenantId, ...entry }, { onConflict: 'cycle_id,employee_id' as never })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listPayrollEntries(cycleId: string) {
  const { data, error } = await supabase
    .from('hr_payroll_entries' as never)
    .select('*')
    .eq('cycle_id', cycleId);

  if (error) throw error;
  return data ?? [];
}

// ─── DEDUCTION RULES ───────────────────────────────────────────────────────

export async function listDeductionRules(tenantId: string) {
  const { data, error } = await supabase
    .from('hr_deduction_rules' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('rule_name');

  if (error) throw error;
  return data ?? [];
}

export async function createDeductionRule(tenantId: string, rule: {
  rule_name: string;
  rule_type: string;
  applies_to?: string;
  amount?: number;
  percentage?: number;
  trigger_event?: string;
  max_deduction?: number;
  description?: string;
}) {
  const { data, error } = await supabase
    .from('hr_deduction_rules' as never)
    .insert({ tenant_id: tenantId, ...rule })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── HR DASHBOARD KPIs ────────────────────────────────────────────────────

export async function getHRKPIs(tenantId: string, date: string) {
  const [summaryRes, cyclesRes] = await Promise.all([
    supabase
      .from('hr_attendance_summary' as never)
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('summary_date', date),
    supabase
      .from('hr_payroll_cycles' as never)
      .select('status, total_net')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const summary = (summaryRes.data ?? []) as { status: string }[];
  const lastCycle = ((cyclesRes.data ?? []) as { status: string; total_net: number }[])[0];

  return {
    presentToday:  summary.filter(s => s.status === 'present').length,
    absentToday:   summary.filter(s => s.status === 'absent').length,
    lateToday:     summary.filter(s => s.status === 'late').length,
    onLeaveToday:  summary.filter(s => s.status === 'on_leave').length,
    lastPayrollNet: lastCycle?.total_net ?? 0,
    lastPayrollStatus: lastCycle?.status ?? 'N/A',
  };
}
