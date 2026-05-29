import { supabase } from "@/integrations/supabase/client";
import { getTenantScope } from "@/lib/tenantScope";
import { tenantDb, scopedSelect } from "@/lib/tenantDb";

const uid = async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
};

export type Plan = {
  id: string; name: string; price: number; currency: string;
  interval: "monthly" | "yearly" | "lifetime";
  features: string[]; highlighted?: boolean; active: boolean; badge?: string;
};

export const plansApi = {
  async listPublic(): Promise<Plan[]> {
    const rows = await scopedSelect<any>("app_settings", { select: "value,user_id", eq: { key: "billing_plans" }, limit: 1 });
    const arr = ((rows[0] as any)?.value || []) as Plan[];
    return arr.filter(p => p.active);
  },
};

export const subscriptionsApi = {
  async list() {
    return await tenantDb.select("subscriptions", { orderBy: "created_at", ascending: false });
  },
  async create(p: Partial<any>) {
    return await tenantDb.insert("subscriptions", p as any);
  },
  async update(id: string, patch: any) {
    return await tenantDb.update("subscriptions", patch, { id });
  },
  async cancel(id: string) {
    return this.update(id, { status: "cancelled", auto_renew: false, cancelled_at: new Date().toISOString() });
  },
};

export const invoicesApi = {
  async list() {
    return await tenantDb.select("invoices", { orderBy: "created_at", ascending: false });
  },
  async create(p: Partial<any>) {
    const invoice_number = `INV-${Date.now().toString(36).toUpperCase()}`;
    return await tenantDb.insert("invoices", { invoice_number, ...p } as any);
  },
  async update(id: string, patch: any) {
    return await tenantDb.update("invoices", patch, { id });
  },
};

export const paymentsApi = {
  async list() {
    return await tenantDb.select("payment_transactions", { orderBy: "created_at", ascending: false });
  },
  async create(p: Partial<any>) {
    return await tenantDb.insert("payment_transactions", p as any);
  },
  async uploadProof(file: File, refId: string) {
    const user_id = await uid();
    const path = `${user_id}/payment-proof/${refId}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("entity-files").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  },
};

export const couponsApi = {
  async list() {
    return await tenantDb.select("coupons", { orderBy: "created_at", ascending: false });
  },
  async create(p: Partial<any>) {
    return await tenantDb.insert("coupons", p as any);
  },
  async update(id: string, patch: any) {
    return await tenantDb.update("coupons", patch, { id });
  },
  async remove(id: string) {
    await tenantDb.remove("coupons", { id });
  },
  async validate(code: string, planId?: string): Promise<{ ok: boolean; coupon?: any; error?: string }> {
    const rows = await scopedSelect<any>("coupons", { eq: { code, active: true }, limit: 1 });
    const data = rows[0];
    if (!data) return { ok: false, error: "Invalid code" };
    const c = data as any;
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { ok: false, error: "Expired" };
    if (c.max_uses && c.used_count >= c.max_uses) return { ok: false, error: "Usage limit reached" };
    if (planId && Array.isArray(c.applies_to_plans) && c.applies_to_plans.length && !c.applies_to_plans.includes(planId))
      return { ok: false, error: "Not valid for this plan" };
    return { ok: true, coupon: c };
  },
  async redeem(coupon_id: string, invoice_id: string, discount_applied: number) {
    await tenantDb.insert("coupon_redemptions", { coupon_id, invoice_id, discount_applied } as any);
    // increment used_count
    const rows = await scopedSelect<any>("coupons", { select: "used_count", eq: { id: coupon_id }, limit: 1 });
    await tenantDb.update("coupons", { used_count: ((rows[0] as any)?.used_count || 0) + 1 }, { id: coupon_id });
  },
};

export const refundsApi = {
  async list() {
    return await tenantDb.select("refund_requests", { orderBy: "created_at", ascending: false });
  },
  async create(p: Partial<any>) {
    return await tenantDb.insert("refund_requests", p as any);
  },
  async approve(id: string, notes?: string) {
    const user_id = await uid();
    return await tenantDb.update("refund_requests", {
      status: "approved", admin_notes: notes, processed_at: new Date().toISOString(), processed_by: user_id,
    }, { id });
  },
  async reject(id: string, notes?: string) {
    const user_id = await uid();
    return await tenantDb.update("refund_requests", {
      status: "rejected", admin_notes: notes, processed_at: new Date().toISOString(), processed_by: user_id,
    }, { id });
  },
};

export const commissionsApi = {
  async list() {
    return await tenantDb.select("affiliate_commissions", { orderBy: "created_at", ascending: false });
  },
  async create(p: Partial<any>) {
    return await tenantDb.insert("affiliate_commissions", p as any);
  },
  async markPaid(id: string) {
    const scope = await getTenantScope();
    return await tenantDb.update("affiliate_commissions", {
      status: "paid",
      paid_at: new Date().toISOString(),
      client_id: scope.clientId,
      brand_id: scope.brandId,
      user_name: scope.userName,
    }, { id });
  },
};

export const fxApi = {
  async rates(): Promise<Record<string, number>> {
    const data = await scopedSelect<any>("exchange_rates", { select: "target_currency,rate" });
    const map: Record<string, number> = {};
    ((data as any[]) || []).forEach(r => { map[r.target_currency] = Number(r.rate); });
    return map;
  },
  convert(amount: number, from: string, to: string, rates: Record<string, number>) {
    const usd = amount / (rates[from] || 1);
    return usd * (rates[to] || 1);
  },
};

// Tax/VAT calculator by country
export const TAX_RATES: Record<string, { rate: number; label: string }> = {
  EG: { rate: 0.14, label: "VAT 14% (Egypt)" },
  SA: { rate: 0.15, label: "VAT 15% (Saudi)" },
  AE: { rate: 0.05, label: "VAT 5% (UAE)" },
  GB: { rate: 0.20, label: "VAT 20% (UK)" },
  DE: { rate: 0.19, label: "VAT 19% (Germany)" },
  FR: { rate: 0.20, label: "VAT 20% (France)" },
  US: { rate: 0.00, label: "Sales tax varies" },
};
export const calcTax = (amount: number, country: string) => {
  const t = TAX_RATES[country];
  return t ? +(amount * t.rate).toFixed(2) : 0;
};

// Revenue analytics
export const revenueApi = {
  async metrics() {
    const [subs, inv] = await Promise.all([subscriptionsApi.list(), invoicesApi.list()]);
    const active = subs.filter((s: any) => s.status === "active");
    const cancelled = subs.filter((s: any) => s.status === "cancelled");
    const monthly = active.reduce((sum: number, s: any) => {
      const m = s.interval === "yearly" ? Number(s.price) / 12 : s.interval === "lifetime" ? 0 : Number(s.price);
      return sum + m;
    }, 0);
    const paidInv = inv.filter((i: any) => i.status === "paid");
    const totalRevenue = paidInv.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
    const churnRate = subs.length ? (cancelled.length / subs.length) * 100 : 0;
    const planCounts: Record<string, number> = {};
    subs.forEach((s: any) => { planCounts[s.plan_name] = (planCounts[s.plan_name] || 0) + 1; });
    const topPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return {
      mrr: monthly, arr: monthly * 12, totalRevenue,
      activeSubs: active.length, cancelledSubs: cancelled.length, churnRate,
      totalInvoices: inv.length, paidInvoices: paidInv.length, topPlan, planCounts,
    };
  },
};
