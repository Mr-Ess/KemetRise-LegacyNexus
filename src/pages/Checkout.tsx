import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Upload, CheckCircle2, CreditCard, Smartphone, Wallet, Building2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { plansApi, type Plan, couponsApi, invoicesApi, paymentsApi, subscriptionsApi, calcTax, TAX_RATES } from "@/services/billing";
import { settingsApi } from "@/services/system";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

type Method = { id: string; type: string; label: string; identifier: string; enabled: boolean };

const ICONS: Record<string, any> = { instapay: Smartphone, vodafone_cash: Smartphone, paypal: DollarSign, stripe: CreditCard, paymob: CreditCard, bank_transfer: Building2, fawry: Wallet, valu: Wallet, meeza: CreditCard, crypto: Wallet, apple_pay: Smartphone, google_pay: Smartphone };

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [country, setCountry] = useState("EG");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const planId = params.get("plan");
  const plan = plans.find(p => p.id === planId);

  useEffect(() => {
    plansApi.listPublic().then(setPlans);
    settingsApi.get("payment_methods").then((m: any) => setMethods(((m as Method[]) || []).filter(x => x.enabled)));
  }, []);

  const totals = useMemo(() => {
    if (!plan) return { sub: 0, discount: 0, tax: 0, total: 0 };
    const sub = plan.price;
    let discount = 0;
    if (appliedCoupon) {
      discount = appliedCoupon.discount_type === "percent" ? sub * (appliedCoupon.discount_value / 100) : appliedCoupon.discount_value;
    }
    const taxable = Math.max(0, sub - discount);
    const tax = calcTax(taxable, country);
    return { sub, discount, tax, total: taxable + tax };
  }, [plan, appliedCoupon, country]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    const r = await couponsApi.validate(coupon.trim(), planId || undefined);
    if (!r.ok) { toast.error(r.error || "Invalid coupon"); setAppliedCoupon(null); return; }
    setAppliedCoupon(r.coupon);
    toast.success("Coupon applied");
  };

  const submit = async () => {
    if (!plan || !selectedMethod) { toast.error("Choose a payment method"); return; }
    if (!user) { toast.error("Please login first"); navigate("/auth"); return; }
    setSubmitting(true);
    try {
      const inv = await invoicesApi.create({
        amount: totals.sub, tax_amount: totals.tax, discount_amount: totals.discount,
        total: totals.total, currency: plan.currency, status: "pending",
        payment_method: selectedMethod.type, payment_reference: reference,
        coupon_code: appliedCoupon?.code,
        line_items: [{ description: `${plan.name} (${plan.interval})`, qty: 1, price: plan.price }],
        billing_info: { country },
      });
      let proof_url: string | undefined;
      if (proofFile) proof_url = await paymentsApi.uploadProof(proofFile, (inv as any).id);
      await paymentsApi.create({
        invoice_id: (inv as any).id, amount: totals.total, currency: plan.currency,
        method: selectedMethod.type, reference, proof_url, status: "pending",
      });
      // Create subscription (pending until verified)
      const periodEnd = new Date();
      if (plan.interval === "monthly") periodEnd.setMonth(periodEnd.getMonth() + 1);
      else if (plan.interval === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setFullYear(periodEnd.getFullYear() + 100);
      await subscriptionsApi.create({
        plan_id: plan.id, plan_name: plan.name, price: plan.price, currency: plan.currency,
        interval: plan.interval, status: "trialing", current_period_end: periodEnd.toISOString(),
      });
      if (appliedCoupon) await couponsApi.redeem(appliedCoupon.id, (inv as any).id, totals.discount);
      setDone(true);
      toast.success("Order submitted! We'll verify your payment shortly.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  if (!plan) return <div className="p-8 text-center text-muted-foreground">{t("no_results")} <Button variant="link" onClick={() => navigate("/pricing")}>{t("back")}</Button></div>;

  if (done) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4 p-8 rounded-xl border border-scarab/30 bg-scarab/5">
        <CheckCircle2 className="w-16 h-16 text-scarab mx-auto" />
        <h2 className="font-display text-xl text-primary">{t("payment_success")}</h2>
        <p className="text-sm text-muted-foreground">{t("payment_processing")}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => navigate("/portal")} className="font-display text-xs">{t("customer_portal")}</Button>
          <Button variant="outline" onClick={() => navigate("/")} className="font-display text-xs">{t("dashboard")}</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/pricing")} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">{t("back")}</span>
        </button>
        <h1 className="font-display text-xl text-primary mb-6">{t("checkout").toUpperCase()}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: methods */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h3 className="font-display text-xs text-primary">1 · {t("country").toUpperCase()}</h3>
              <select value={country} onChange={e => setCountry(e.target.value)} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm">
                {Object.entries(TAX_RATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h3 className="font-display text-xs text-primary">2 · {t("payment_method").toUpperCase()}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {methods.map(m => {
                  const Icon = ICONS[m.type] || CreditCard;
                  const active = selectedMethod?.id === m.id;
                  return (
                    <button key={m.id} onClick={() => setSelectedMethod(m)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-border bg-secondary/30 hover:border-primary/40"}`}>
                      <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display text-foreground truncate">{m.label}</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{m.identifier}</p>
                      </div>
                    </button>
                  );
                })}
                {methods.length === 0 && <p className="col-span-2 text-xs text-muted-foreground p-3">{t("no_results")}</p>}
              </div>
            </div>

            {selectedMethod && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <h3 className="font-display text-xs text-primary">3 · {t("billing_info").toUpperCase()}</h3>
                <div className="p-3 rounded-md bg-secondary/40 border border-border text-xs space-y-1">
                  <p className="text-muted-foreground">{t("amount")}: <span className="text-primary font-display">{plan.currency} {totals.total.toFixed(2)}</span></p>
                  <p className="font-mono text-foreground break-all">{selectedMethod.identifier}</p>
                </div>
                <div className="space-y-1"><Label className="text-xs">{t("code")} / ID</Label>
                  <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="txn_123456789" className="bg-secondary border-border" />
                </div>
                <div className="space-y-1"><Label className="text-xs">{t("upload_receipt")}</Label>
                  <label className="flex items-center gap-2 p-3 rounded-md border border-dashed border-border bg-secondary/30 cursor-pointer hover:border-primary/40">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{proofFile?.name || t("upload_receipt")}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setProofFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: summary */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-primary/30 rounded-lg p-5 space-y-4 sticky top-4">
              <h3 className="font-display text-sm text-primary">{t("order_summary").toUpperCase()}</h3>
              <div className="p-3 rounded-md bg-secondary/40 border border-border">
                <p className="font-display text-sm text-foreground">{plan.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{t(plan.interval as any)}</p>
              </div>
              <div className="flex gap-2">
                <Input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder={t("coupon_code")} className="bg-secondary border-border text-xs" />
                <Button size="sm" variant="outline" onClick={applyCoupon} className="font-display text-xs">{t("apply_coupon")}</Button>
              </div>
              <div className="space-y-1.5 text-xs border-t border-border pt-3">
                <div className="flex justify-between text-muted-foreground"><span>{t("subtotal")}</span><span>{plan.currency} {totals.sub.toFixed(2)}</span></div>
                {totals.discount > 0 && <div className="flex justify-between text-scarab"><span>{t("discount")}</span><span>-{plan.currency} {totals.discount.toFixed(2)}</span></div>}
                {totals.tax > 0 && <div className="flex justify-between text-muted-foreground"><span>{t("tax")}</span><span>{plan.currency} {totals.tax.toFixed(2)}</span></div>}
                <div className="flex justify-between font-display text-base text-primary border-t border-border pt-2"><span>{t("total").toUpperCase()}</span><span>{plan.currency} {totals.total.toFixed(2)}</span></div>
              </div>
              <Button onClick={submit} disabled={submitting || !selectedMethod} className="w-full font-display">
                {submitting ? t("payment_processing") : t("complete_payment")}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">By placing the order, you agree to our Terms.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
