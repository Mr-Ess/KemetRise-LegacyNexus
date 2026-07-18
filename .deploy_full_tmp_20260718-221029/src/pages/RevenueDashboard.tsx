import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, DollarSign, Users, RefreshCw, Tag, Plus, Trash2, Check, X, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { revenueApi, couponsApi, refundsApi, commissionsApi } from "@/services/billing";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const RevenueDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"metrics" | "coupons" | "refunds" | "commissions" | "insights">("metrics");
  const [insights, setInsights] = useState<{ summary?: any; insights?: string; loading?: boolean }>({});

  const loadInsights = async () => {
    setInsights({ loading: true });
    try {
      const { data, error } = await supabase.functions.invoke("ai-sales-insights");
      if (error) throw error;
      setInsights({ summary: data.summary, insights: data.insights });
    } catch (e: any) {
      toast.error(e.message || "Failed to load insights");
      setInsights({});
    }
  };
  const [m, setM] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState<any | null>(null);

  const load = () => {
    revenueApi.metrics().then(setM).catch(() => {});
    couponsApi.list().then(setCoupons).catch(() => {});
    refundsApi.list().then(setRefunds).catch(() => {});
    commissionsApi.list().then(setCommissions).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const saveCoupon = async () => {
    if (!couponForm.code?.trim()) return toast.error("Code required");
    try {
      if (couponForm.id) await couponsApi.update(couponForm.id, couponForm);
      else await couponsApi.create(couponForm);
      toast.success("Saved"); setCouponForm(null); load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">{t("back")}</span>
        </button>
        <h1 className="font-display text-xl text-primary mb-6">💰 {t("revenue_dashboard").toUpperCase()}</h1>

        <div className="flex gap-2 mb-6 border-b border-border">
          {[["metrics", t("metrics")], ["coupons", t("coupons")], ["refunds", t("refunds")], ["commissions", t("commissions")], ["insights", t("ai_insights")]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as any)} className={`px-4 py-2 text-xs font-display uppercase border-b-2 transition-colors ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>

        {tab === "metrics" && m && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "MRR", v: `$${m.mrr.toFixed(0)}`, i: TrendingUp, c: "text-scarab" },
              { l: "ARR", v: `$${m.arr.toFixed(0)}`, i: TrendingUp, c: "text-primary" },
              { l: "Total Revenue", v: `$${m.totalRevenue.toFixed(0)}`, i: DollarSign, c: "text-scarab" },
              { l: "Active Subs", v: m.activeSubs, i: Users, c: "text-nile" },
              { l: "Cancelled", v: m.cancelledSubs, i: X, c: "text-blood-red" },
              { l: "Churn Rate", v: `${m.churnRate.toFixed(1)}%`, i: RefreshCw, c: "text-primary" },
              { l: "Invoices Paid", v: `${m.paidInvoices}/${m.totalInvoices}`, i: Check, c: "text-scarab" },
              { l: "Top Plan", v: m.topPlan, i: Award, c: "text-primary" },
            ].map(s => (
              <div key={s.l} className="bg-card border border-border rounded-lg p-4">
                <s.i className={`w-4 h-4 mb-2 ${s.c}`} />
                <p className="text-[10px] text-muted-foreground uppercase font-display">{s.l}</p>
                <p className="font-display text-lg text-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "coupons" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{coupons.length} coupons</p>
              <Button size="sm" onClick={() => setCouponForm({ code: "", discount_type: "percent", discount_value: 10, active: true, applies_to_plans: [] })} className="gap-1 font-display text-xs"><Plus className="w-3.5 h-3.5" />New Coupon</Button>
            </div>
            {coupons.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <Tag className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-foreground">{c.code}</p>
                  <p className="text-[10px] text-muted-foreground">{c.discount_type === "percent" ? `${c.discount_value}% off` : `$${c.discount_value} off`} · used {c.used_count}/{c.max_uses ?? "∞"}{c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString()}` : ""}</p>
                </div>
                <Switch checked={c.active} onCheckedChange={(v) => couponsApi.update(c.id, { active: v }).then(load)} />
                <button onClick={() => { if (confirm("Delete?")) couponsApi.remove(c.id).then(load); }} className="p-1.5 text-blood-red"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {coupons.length === 0 && <p className="text-xs text-muted-foreground p-4 bg-secondary/30 rounded-lg border border-border">No coupons yet.</p>}
          </div>
        )}

        {tab === "refunds" && (
          <div className="space-y-3">
            {refunds.length === 0 && <p className="text-xs text-muted-foreground p-4 bg-secondary/30 rounded-lg border border-border">No refund requests.</p>}
            {refunds.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <p className="font-display text-sm text-foreground">{r.currency} {r.amount}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()} · {r.reason || "—"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${r.status === "approved" ? "bg-scarab/20 text-scarab" : r.status === "rejected" ? "bg-blood-red/20 text-blood-red" : "bg-primary/20 text-primary"}`}>{r.status.toUpperCase()}</span>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" className="text-scarab text-xs" onClick={() => refundsApi.approve(r.id).then(() => { toast.success("Approved"); load(); })}>Approve</Button>
                      <Button size="sm" variant="ghost" className="text-blood-red text-xs" onClick={() => refundsApi.reject(r.id).then(() => { toast.success("Rejected"); load(); })}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "commissions" && (
          <div className="space-y-3">
            {commissions.length === 0 && <p className="text-xs text-muted-foreground p-4 bg-secondary/30 rounded-lg border border-border">No commissions tracked yet.</p>}
            {commissions.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <Award className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-foreground">{c.currency} {c.commission_amount} <span className="text-[10px] text-muted-foreground">({(c.commission_rate * 100).toFixed(0)}% of {c.base_amount})</span></p>
                  <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${c.status === "paid" ? "bg-scarab/20 text-scarab" : "bg-primary/20 text-primary"}`}>{c.status.toUpperCase()}</span>
                {c.status === "pending" && <Button size="sm" variant="ghost" className="text-xs" onClick={() => commissionsApi.markPaid(c.id).then(load)}>Mark Paid</Button>}
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!couponForm} onOpenChange={(o) => !o && setCouponForm(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader><DialogTitle className="font-display text-primary">{couponForm?.id ? "Edit" : "New"} Coupon</DialogTitle></DialogHeader>
            {couponForm && (
              <div className="space-y-3">
                <div className="space-y-1"><Label className="text-xs">Code *</Label><Input value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="bg-secondary border-border" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Type</Label>
                    <select value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm">
                      <option value="percent">Percent %</option><option value="fixed">Fixed amount</option>
                    </select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Value</Label><Input type="number" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: +e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="space-y-1"><Label className="text-xs">Max uses</Label><Input type="number" value={couponForm.max_uses || ""} onChange={e => setCouponForm({ ...couponForm, max_uses: e.target.value ? +e.target.value : null })} className="bg-secondary border-border" /></div>
                  <div className="space-y-1"><Label className="text-xs">Expires</Label><Input type="date" value={couponForm.expires_at?.slice(0, 10) || ""} onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="bg-secondary border-border" /></div>
                </div>
              </div>
            )}
            <DialogFooter><Button variant="ghost" onClick={() => setCouponForm(null)}>Cancel</Button><Button onClick={saveCoupon}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {tab === "insights" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm text-foreground flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Sales Insights</h2>
              <Button onClick={loadInsights} disabled={insights.loading}>
                {insights.loading ? "Analyzing..." : "Generate Insights"}
              </Button>
            </div>
            {insights.summary && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(insights.summary).map(([k, v]) => (
                  <div key={k} className="bg-card border border-border rounded-lg p-3">
                    <p className="text-[10px] uppercase text-muted-foreground font-display">{k.replace(/_/g, " ")}</p>
                    <p className="font-display text-sm text-foreground">{Array.isArray(v) ? v.join(", ") || "—" : String(v)}</p>
                  </div>
                ))}
              </div>
            )}
            {insights.insights && (
              <div className="bg-card border border-border rounded-lg p-4 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {insights.insights}
              </div>
            )}
            {!insights.summary && !insights.loading && (
              <p className="text-xs text-muted-foreground">Click "Generate Insights" to get AI-powered recommendations based on your revenue data.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueDashboard;
