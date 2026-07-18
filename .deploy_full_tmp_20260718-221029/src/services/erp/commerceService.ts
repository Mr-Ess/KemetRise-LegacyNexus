import { supabase } from "@/integrations/supabase/client";
import { emitOrderPlaced } from "./telemetryService";
import type { SectorCode } from "./tenantService";

// ─── PRODUCTS ─────────────────────────────────────────────────────────────

export async function listProducts(tenantId: string, filters?: {
  product_type?: string;
  is_active?: boolean;
}) {
  let q = supabase
    .from('com_products' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  if (filters?.product_type) q = q.eq('product_type', filters.product_type);
  if (filters?.is_active !== undefined) q = q.eq('is_active', filters.is_active);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(tenantId: string, sectorCode: SectorCode, product: {
  name: string;
  slug: string;
  description?: string;
  product_type: 'physical' | 'digital' | 'service' | 'subscription' | 'bundle';
  sku?: string;
  price: number;
  currency?: string;
  track_inventory?: boolean;
  stock_qty?: number;
  low_stock_alert?: number;
  file_url?: string;
  download_limit?: number;
  license_type?: string;
  category?: string;
  images?: unknown[];
}) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('com_products' as never)
    .insert({ tenant_id: tenantId, sector_code: sectorCode, user_id: user.user.id, ...product })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── INVENTORY ────────────────────────────────────────────────────────────

export async function getInventory(tenantId: string) {
  const { data, error } = await supabase
    .from('com_inventory' as never)
    .select('*, com_products(name, sku, product_type)')
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return data ?? [];
}

export async function adjustInventory(tenantId: string, productId: string, qty: number, reason: string) {
  const { data: existing } = await supabase
    .from('com_inventory' as never)
    .select('qty_on_hand')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .single();

  const currentQty = (existing as { qty_on_hand: number } | null)?.qty_on_hand ?? 0;

  await supabase.from('com_inventory' as never).upsert({
    tenant_id: tenantId,
    product_id: productId,
    qty_on_hand: currentQty + qty,
    last_updated: new Date().toISOString(),
  }, { onConflict: 'tenant_id,product_id,warehouse_id' as never });

  await supabase.from('com_inventory_movements' as never).insert({
    tenant_id: tenantId,
    product_id: productId,
    movement_type: qty >= 0 ? 'in' : 'out',
    qty: Math.abs(qty),
    notes: reason,
  });
}

// ─── ORDERS ───────────────────────────────────────────────────────────────

export interface CreateOrderDto {
  tenant_id: string;
  sector_code: SectorCode;
  order_number: string;
  customer_name?: string;
  customer_email?: string;
  order_type?: string;
  currency?: string;
  gateway?: string;
  items: OrderItemDto[];
  coupon_code?: string;
  notes?: string;
}

export interface OrderItemDto {
  product_id?: string;
  product_name: string;
  sku?: string;
  product_type?: string;
  quantity: number;
  unit_price: number;
  discount_pct?: number;
  tax_rate?: number;
}

export async function createOrder(dto: CreateOrderDto) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Unauthenticated');

  const { items, ...orderData } = dto;

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price * (1 - (i.discount_pct ?? 0) / 100), 0);
  const taxAmount = items.reduce((s, i) => s + (i.quantity * i.unit_price * (i.tax_rate ?? 0)) / 100, 0);
  const total = subtotal + taxAmount;

  const { data: order, error } = await supabase
    .from('com_orders' as never)
    .insert({ ...orderData, user_id: user.user.id, subtotal, tax_amount: taxAmount, total_amount: total })
    .select()
    .single();

  if (error) throw error;

  const lineItems = items.map(item => ({
    order_id: (order as { id: string }).id,
    tenant_id: dto.tenant_id,
    product_id: item.product_id,
    product_name: item.product_name,
    sku: item.sku,
    product_type: item.product_type ?? 'physical',
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_pct: item.discount_pct ?? 0,
    tax_rate: item.tax_rate ?? 0,
    tax_amount: (item.quantity * item.unit_price * (item.tax_rate ?? 0)) / 100,
    line_total: item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100),
  }));

  await supabase.from('com_order_items' as never).insert(lineItems);

  await emitOrderPlaced(dto.tenant_id, dto.sector_code, (order as { id: string }).id);

  return order;
}

export async function listOrders(tenantId: string, filters?: { status?: string; sector_code?: SectorCode }) {
  let q = supabase
    .from('com_orders' as never)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.sector_code) q = q.eq('sector_code', filters.sector_code);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('com_orders' as never)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── PAYMENT TRANSACTIONS ─────────────────────────────────────────────────

export async function recordPaymentTransaction(tenantId: string, txn: {
  order_id?: string;
  invoice_id?: string;
  gateway: string;
  gateway_txn_id?: string;
  amount: number;
  currency?: string;
  status: 'success' | 'failed' | 'pending';
  gateway_response?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('com_payment_transactions' as never)
    .insert({ tenant_id: tenantId, transaction_type: 'charge', ...txn })
    .select()
    .single();

  if (error) throw error;

  // Update order payment status if successful
  if (txn.order_id && txn.status === 'success') {
    await supabase.from('com_orders' as never)
      .update({ payment_status: 'paid', paid_amount: txn.amount, gateway_ref: txn.gateway_txn_id })
      .eq('id', txn.order_id);
  }

  return data;
}

// ─── COMMERCE KPIs ────────────────────────────────────────────────────────

export async function getCommerceKPIs(tenantId: string) {
  const [ordersRes, txnsRes, lowStockRes] = await Promise.all([
    supabase.from('com_orders' as never).select('total_amount, status, payment_status').eq('tenant_id', tenantId),
    supabase.from('com_payment_transactions' as never).select('amount, status').eq('tenant_id', tenantId),
    supabase.from('com_inventory' as never).select('qty_available, reorder_point').eq('tenant_id', tenantId),
  ]);

  const orders = (ordersRes.data ?? []) as { total_amount: number; status: string; payment_status: string }[];
  const txns   = (txnsRes.data ?? []) as { amount: number; status: string }[];
  const inv    = (lowStockRes.data ?? []) as { qty_available: number; reorder_point: number }[];

  return {
    totalOrders:    orders.length,
    totalRevenue:   txns.filter(t => t.status === 'success').reduce((s, t) => s + t.amount, 0),
    pendingOrders:  orders.filter(o => o.status === 'pending').length,
    lowStockItems:  inv.filter(i => i.qty_available <= i.reorder_point).length,
    paidOrders:     orders.filter(o => o.payment_status === 'paid').length,
  };
}
