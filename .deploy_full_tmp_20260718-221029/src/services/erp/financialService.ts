import { supabase } from "@/integrations/supabase/client";
import { emitInvoiceCreated } from "./telemetryService";
import type { SectorCode } from "./tenantService";

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface CreateInvoiceDto {
  tenant_id: string;
  sector_code: SectorCode;
  invoice_number: string;
  invoice_type?: string;
  client_name?: string;
  client_tax_id?: string;
  client_email?: string;
  issue_date?: string;
  due_date?: string;
  currency?: string;
  items: InvoiceItemDto[];
  tax_rule_id?: string;
  notes?: string;
  payment_terms?: string;
}

export interface InvoiceItemDto {
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct?: number;
  tax_rate?: number;
  sku?: string;
  unit?: string;
}

export interface CreateReceiptDto {
  tenant_id: string;
  sector_code: SectorCode;
  receipt_number: string;
  invoice_id?: string;
  client_name?: string;
  amount: number;
  currency?: string;
  payment_method: string;
  gateway_ref?: string;
  payment_date?: string;
  notes?: string;
}

// ─── INVOICE OPERATIONS ────────────────────────────────────────────────────

export async function createInvoice(dto: CreateInvoiceDto) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Unauthenticated');

  const { items, ...invoiceData } = dto;

  const { data: invoice, error } = await supabase
    .from('fin_invoices' as never)
    .insert({ ...invoiceData, user_id: user.user.id })
    .select()
    .single();

  if (error) throw error;

  // Insert line items
  if (items.length > 0) {
    const lineItems = items.map((item, idx) => ({
      invoice_id: (invoice as { id: string }).id,
      tenant_id: dto.tenant_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_pct: item.discount_pct ?? 0,
      tax_rate: item.tax_rate ?? 0,
      tax_amount: (item.unit_price * item.quantity * (item.tax_rate ?? 0)) / 100,
      line_total: item.unit_price * item.quantity * (1 - (item.discount_pct ?? 0) / 100),
      sku: item.sku,
      unit: item.unit ?? 'unit',
      sort_order: idx,
    }));

    const { error: itemsError } = await supabase
      .from('fin_invoice_items' as never)
      .insert(lineItems);

    if (itemsError) throw itemsError;
  }

  // Emit telemetry
  await emitInvoiceCreated(dto.tenant_id, dto.sector_code, (invoice as { id: string }).id);

  return invoice;
}

export async function listInvoices(tenantId: string, filters?: {
  status?: string;
  sector_code?: SectorCode;
  from_date?: string;
  to_date?: string;
}) {
  let q = supabase
    .from('fin_invoices' as never)
    .select('*, fin_invoice_items(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.sector_code) q = q.eq('sector_code', filters.sector_code);
  if (filters?.from_date) q = q.gte('issue_date', filters.from_date);
  if (filters?.to_date) q = q.lte('issue_date', filters.to_date);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateInvoicePayment(invoiceId: string, paidAmount: number) {
  const { data, error } = await supabase
    .from('fin_invoices' as never)
    .update({ paid_amount: paidAmount })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitEInvoice(invoiceId: string, tenantId: string, sectorCode: SectorCode) {
  const { data, error } = await supabase
    .from('fin_invoices' as never)
    .update({ einvoice_status: 'submitted' })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;

  // Insert e-invoice webhook log
  await supabase.from('fin_einvoice_webhooks' as never).insert({
    tenant_id: tenantId,
    invoice_id: invoiceId,
    event_type: 'submission',
    authority: 'ETA',
    payload: { invoice_id: invoiceId, sector_code: sectorCode },
    status: 'pending',
  });

  return data;
}

// ─── RECEIPT OPERATIONS ────────────────────────────────────────────────────

export async function createReceipt(dto: CreateReceiptDto) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('fin_receipts' as never)
    .insert({ ...dto, user_id: user.user.id })
    .select()
    .single();

  if (error) throw error;

  // If linked to invoice, update paid amount
  if (dto.invoice_id) {
    const { data: existingReceipts } = await supabase
      .from('fin_receipts' as never)
      .select('amount')
      .eq('invoice_id', dto.invoice_id)
      .eq('status', 'completed');

    const totalPaid = ((existingReceipts ?? []) as { amount: number }[])
      .reduce((sum, r) => sum + r.amount, 0);

    await updateInvoicePayment(dto.invoice_id, totalPaid);
  }

  return data;
}

export async function listReceipts(tenantId: string) {
  const { data, error } = await supabase
    .from('fin_receipts' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── LEDGER OPERATIONS ─────────────────────────────────────────────────────

export async function getLedgerSummary(tenantId: string, fiscalYear?: number) {
  const year = fiscalYear ?? new Date().getFullYear();

  const { data, error } = await supabase
    .from('fin_ledger_entries' as never)
    .select('entry_type, amount, fiscal_month')
    .eq('tenant_id', tenantId)
    .eq('fiscal_year', year);

  if (error) throw error;

  const entries = (data ?? []) as { entry_type: string; amount: number; fiscal_month: number }[];
  const totalDebits  = entries.filter(e => e.entry_type === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredits = entries.filter(e => e.entry_type === 'credit').reduce((s, e) => s + e.amount, 0);

  return { totalDebits, totalCredits, netBalance: totalDebits - totalCredits, entries };
}

// ─── CURRENCY RATES ────────────────────────────────────────────────────────

export async function upsertCurrencyRate(tenantId: string, baseCurrency: string, targetCurrency: string, rate: number) {
  const { data, error } = await supabase
    .from('fin_currency_rates' as never)
    .upsert({
      tenant_id: tenantId,
      base_currency: baseCurrency,
      target_currency: targetCurrency,
      rate,
      rate_date: new Date().toISOString().split('T')[0],
    }, { onConflict: 'tenant_id,base_currency,target_currency,rate_date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function convertCurrency(
  tenantId: string,
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;

  const { data } = await supabase
    .from('fin_currency_rates' as never)
    .select('rate')
    .eq('tenant_id', tenantId)
    .eq('base_currency', from)
    .eq('target_currency', to)
    .order('rate_date', { ascending: false })
    .limit(1)
    .single();

  const rate = (data as { rate: number } | null)?.rate ?? 1;
  return amount * rate;
}

// ─── DASHBOARD KPIs ────────────────────────────────────────────────────────

export async function getFinancialKPIs(tenantId: string) {
  const [invoicesRes, receiptsRes] = await Promise.all([
    supabase.from('fin_invoices' as never).select('total_amount, paid_amount, status').eq('tenant_id', tenantId),
    supabase.from('fin_receipts' as never).select('amount').eq('tenant_id', tenantId).eq('status', 'completed'),
  ]);

  const invoices = (invoicesRes.data ?? []) as { total_amount: number; paid_amount: number; status: string }[];
  const receipts = (receiptsRes.data ?? []) as { amount: number }[];

  return {
    totalInvoiced:   invoices.reduce((s, i) => s + i.total_amount, 0),
    totalCollected:  receipts.reduce((s, r) => s + r.amount, 0),
    totalOutstanding: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total_amount - i.paid_amount), 0),
    overdueCount:    invoices.filter(i => i.status === 'overdue').length,
    paidCount:       invoices.filter(i => i.status === 'paid').length,
    draftCount:      invoices.filter(i => i.status === 'draft').length,
  };
}
