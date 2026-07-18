/**
 * Telemetry Service — KemetRise Nervous System
 *
 * Every transaction, scan, invoice, or failure emits a structured payload
 * to the Central Router Manager via Supabase fn_emit_telemetry().
 *
 * Schema: { tenant_id, sector_code, active_agent_id, status, timestamp }
 * Retry logic: 3 attempts, 5s delay (handled DB-side + client-side fallback)
 */

import { supabase } from "@/integrations/supabase/client";
import type { SectorCode } from "./tenantService";

export type EventStatus = 'success' | 'error' | 'warning' | 'info';

export interface TelemetryPayload {
  tenant_id: string;
  sector_code: SectorCode | 'SYSTEM';
  active_agent_id: string;
  event_name: string;
  status: EventStatus;
  source_table?: string;
  source_id?: string;
  payload?: Record<string, unknown>;
  workflow_code?: string;
  error_message?: string;
}

// Central Router mandatory envelope shape
interface CentralRouterEnvelope {
  tenant_id: string;
  sector_code: string;
  active_agent_id: string;
  status: EventStatus;
  timestamp: string; // ISO 8601
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Emit a telemetry event to the Central Router Manager.
 * Automatically retries up to 3 times with 5s delay on network failures.
 */
export async function emit(payload: TelemetryPayload, attempt = 1): Promise<string | null> {
  const envelope: CentralRouterEnvelope = {
    tenant_id: payload.tenant_id,
    sector_code: payload.sector_code,
    active_agent_id: payload.active_agent_id,
    status: payload.status,
    timestamp: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.rpc('fn_emit_telemetry' as never, {
      p_tenant_id:       payload.tenant_id,
      p_sector_code:     payload.sector_code,
      p_active_agent_id: payload.active_agent_id,
      p_event_name:      payload.event_name,
      p_status:          payload.status,
      p_source_table:    payload.source_table ?? null,
      p_source_id:       payload.source_id ?? null,
      p_payload:         { ...envelope, ...(payload.payload ?? {}) },
      p_workflow_code:   payload.workflow_code ?? null,
      p_error_message:   payload.error_message ?? null,
    });

    if (error) throw error;
    return data as string;
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS * attempt);
      return emit(payload, attempt + 1);
    }
    // Silent degradation — telemetry must never crash the main flow
    console.error('[Telemetry] Failed after', MAX_ATTEMPTS, 'attempts:', err);
    return null;
  }
}

// ─── CONVENIENCE WRAPPERS ──────────────────────────────────────────────────

export function emitInvoiceCreated(tenantId: string, sectorCode: SectorCode, invoiceId: string) {
  return emit({
    tenant_id: tenantId, sector_code: sectorCode,
    active_agent_id: 'A-AGENT-FIN', event_name: 'invoice.created', status: 'success',
    source_table: 'fin_invoices', source_id: invoiceId,
    workflow_code: 'FIN-001',
  });
}

export function emitInvoiceSubmittedToETA(tenantId: string, sectorCode: SectorCode, invoiceId: string) {
  return emit({
    tenant_id: tenantId, sector_code: sectorCode,
    active_agent_id: 'A-AGENT-TAX', event_name: 'invoice.submitted', status: 'success',
    source_table: 'fin_invoices', source_id: invoiceId,
    workflow_code: 'FIN-002',
  });
}

export function emitOrderPlaced(tenantId: string, sectorCode: SectorCode, orderId: string) {
  return emit({
    tenant_id: tenantId, sector_code: sectorCode,
    active_agent_id: 'A-AGENT-COM', event_name: 'order.placed', status: 'success',
    source_table: 'com_orders', source_id: orderId,
    workflow_code: 'COM-001',
  });
}

export function emitQRScan(tenantId: string, sectorCode: SectorCode, eventId: string, employeeId: string) {
  return emit({
    tenant_id: tenantId, sector_code: sectorCode,
    active_agent_id: 'A-AGENT-HR', event_name: 'attendance.qr.scan', status: 'success',
    source_table: 'hr_attendance_events', source_id: eventId,
    workflow_code: 'HR-001', payload: { employee_id: employeeId },
  });
}

export function emitBiometricEvent(tenantId: string, sectorCode: SectorCode, eventId: string) {
  return emit({
    tenant_id: tenantId, sector_code: sectorCode,
    active_agent_id: 'A-AGENT-BIO', event_name: 'biometric.event', status: 'success',
    source_table: 'hr_biometric_events', source_id: eventId,
    workflow_code: 'HR-003',
  });
}

export function emitPayrollRun(tenantId: string, sectorCode: SectorCode, cycleId: string) {
  return emit({
    tenant_id: tenantId, sector_code: sectorCode,
    active_agent_id: 'A-AGENT-PAY', event_name: 'payroll.run', status: 'success',
    source_table: 'hr_payroll_cycles', source_id: cycleId,
    workflow_code: 'HR-002',
  });
}

export function emitError(tenantId: string, sectorCode: SectorCode | 'SYSTEM', eventName: string, error: string) {
  return emit({
    tenant_id: tenantId, sector_code: sectorCode,
    active_agent_id: 'A-AGENT-SYS', event_name: eventName, status: 'error',
    error_message: error,
  });
}

// Sector-specific emitters
export function emitEduSessionDeduction(tenantId: string, enrollmentId: string, amount: number) {
  return emit({
    tenant_id: tenantId, sector_code: 'EDU-01',
    active_agent_id: 'A-AGENT-EDU', event_name: 'session.attended', status: 'success',
    source_table: 'edu_session_attendance', source_id: enrollmentId,
    workflow_code: 'EDU-001', payload: { deducted_amount: amount },
  });
}

export function emitMedAppointmentReminder(tenantId: string, appointmentId: string) {
  return emit({
    tenant_id: tenantId, sector_code: 'MED-01',
    active_agent_id: 'A-AGENT-MED', event_name: 'appointment.upcoming', status: 'info',
    source_table: 'med_appointments', source_id: appointmentId,
    workflow_code: 'MED-001',
  });
}

export function emitSptAccessGranted(tenantId: string, memberId: string, accessLogId: string) {
  return emit({
    tenant_id: tenantId, sector_code: 'SPT-01',
    active_agent_id: 'A-AGENT-SPT', event_name: 'access.scan', status: 'success',
    source_table: 'spt_access_logs', source_id: accessLogId,
    workflow_code: 'SPT-001', payload: { member_id: memberId },
  });
}

export function emitLegCaseUpdated(tenantId: string, caseId: string) {
  return emit({
    tenant_id: tenantId, sector_code: 'LEG-01',
    active_agent_id: 'A-AGENT-LEG', event_name: 'case.updated', status: 'success',
    source_table: 'leg_cases', source_id: caseId,
    workflow_code: 'LEG-001',
  });
}

export function emitTurBookingConfirmed(tenantId: string, bookingId: string) {
  return emit({
    tenant_id: tenantId, sector_code: 'TUR-01',
    active_agent_id: 'A-AGENT-TUR', event_name: 'booking.confirmed', status: 'success',
    source_table: 'tur_bookings', source_id: bookingId,
    workflow_code: 'TUR-001',
  });
}

export function emitCmpSLABreach(tenantId: string, ticketId: string) {
  return emit({
    tenant_id: tenantId, sector_code: 'CMP-01',
    active_agent_id: 'A-AGENT-CMP', event_name: 'ticket.sla_breach', status: 'warning',
    source_table: 'cmp_service_tickets', source_id: ticketId,
    workflow_code: 'CMP-002',
  });
}
