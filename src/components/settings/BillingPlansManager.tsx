import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Crown, CreditCard, Wallet, Building2, Smartphone, DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { settingsApi } from "@/services/system";

export type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly" | "lifetime";
  features: string[];
  highlighted?: boolean;
  active: boolean;
  badge?: string;
};

export type PaymentMethod = {
  id: string;
  type: "instapay" | "vodafone_cash" | "fawry" | "paypal" | "stripe" | "paymob" | "bank_transfer" | "valu" | "meeza" | "crypto" | "apple_pay" | "google_pay";
  label: string;
  identifier: string; // account number / email / IBAN / etc
  enabled: boolean;
  notes?: string;
};

const DEFAULT_PLANS: Plan[] = [
  { id: "free", name: "Free", price: 0, currency: "USD", interval: "monthly", features: ["1 Brand", "5 Projects", "Community Support"], active: true },
  { id: "pro", name: "Pro", price: 29, currency: "USD", interval: "monthly", features: ["10 Brands", "Unlimited Projects", "Priority Support", "API Access"], active: true, highlighted: true, badge: "Most Popular" },
  { id: "business", name: "Business", price: 99, currency: "USD", interval: "monthly", features: ["Unlimited Brands", "Team Collaboration", "Advanced Analytics", "Custom Webhooks", "Dedicated Manager"], active: true },
  { id: "enterprise", name: "Enterprise (Pharaoh)", price: 499, currency: "USD", interval: "monthly", features: ["Everything in Business", "SSO / SAML", "Audit Logs Export", "SLA 99.99%", "On-premise option", "White-label"], active: true, badge: "Premium" },
  { id: "lifetime", name: "Lifetime Deal", price: 1999, currency: "USD", interval: "lifetime", features: ["All Business features forever", "Future updates included"], active: false, badge: "Limited" },
];

const PAYMENT_TYPE_META: Record<PaymentMethod["type"], { label: string; icon: any; color: string; placeholder: string }> = {
  instapay:      { label: "InstaPay",       icon: Smartphone,   color: "text-nile",     placeholder: "user@instapay or mobile" },
  vodafone_cash: { label: "Vodafone Cash",  icon: Smartphone,   color: "text-blood-red",placeholder: "01xxxxxxxxx" },
  fawry:         { label: "Fawry",          icon: Wallet,       color: "text-primary",  placeholder: "Merchant code" },
  paypal:        { label: "PayPal",         icon: DollarSign,   color: "text-nile",     placeholder: "paypal@email.com" },
  stripe:        { label: "Stripe",         icon: CreditCard,   color: "text-primary",  placeholder: "Account / publishable key" },
  paymob:        { label: "Paymob",         icon: CreditCard,   color: "text-scarab",   placeholder: "Integration ID" },
  bank_transfer: { label: "Bank Transfer",  icon: Building2,    color: "text-foreground",placeholder: "IBAN / Account number" },
  valu:          { label: "valU",           icon: Wallet,       color: "text-blood-red",placeholder: "Merchant ID" },
  meeza:         { label: "Meeza",          icon: CreditCard,   color: "text-primary",  placeholder: "Card / Account" },
  crypto:        { label: "Crypto Wallet",  icon: Wallet,       color: "text-primary",  placeholder: "Wallet address" },
  apple_pay:     { label: "Apple Pay",      icon: Smartphone,   color: "text-foreground",placeholder: "Merchant ID" },
  google_pay:    { label: "Google Pay",     icon: Smartphone,   color: "text-foreground",placeholder: "Merchant ID" },
};

const DEFAULT_METHODS: PaymentMethod[] = [
  { id: "m1", type: "instapay",      label: "InstaPay (Main)",   identifier: "kemetrise@instapay", enabled: true },
  { id: "m2", type: "vodafone_cash", label: "Vodafone Cash",      identifier: "01000000000",        enabled: true },
  { id: "m3", type: "paypal",        label: "PayPal Business",    identifier: "billing@kemetrise.com", enabled: true },
  { id: "m4", type: "stripe",        label: "Stripe",             identifier: "acct_xxx",           enabled: false },
  { id: "m5", type: "bank_transfer", label: "CIB Bank — EGP",     identifier: "EG38 0010 0000 0000 0000 1234 567", enabled: true },
];

const BillingPlansManager = () => {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [methods, setMethods] = useState<PaymentMethod[]>(DEFAULT_METHODS);
  const [planForm, setPlanForm] = useState<Plan | null>(null);
  const [methodForm, setMethodForm] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, m] = await Promise.all([settingsApi.get("billing_plans"), settingsApi.get("payment_methods")]);
        if (Array.isArray(p) && p.length) setPlans(p as Plan[]);
        if (Array.isArray(m) && m.length) setMethods(m as PaymentMethod[]);
      } catch { /* ignore */ }
    })();
  }, []);

  const persistPlans = async (next: Plan[]) => { setPlans(next); try { await settingsApi.set("billing_plans", next); } catch (e: any) { toast.error(e.message); } };
  const persistMethods = async (next: PaymentMethod[]) => { setMethods(next); try { await settingsApi.set("payment_methods", next); } catch (e: any) { toast.error(e.message); } };

  const savePlan = () => {
    if (!planForm) return;
    if (!planForm.name.trim()) { toast.error("Plan name required"); return; }
    const exists = plans.some(p => p.id === planForm.id);
    const next = exists ? plans.map(p => p.id === planForm.id ? planForm : p) : [...plans, planForm];
    persistPlans(next);
    setPlanForm(null);
    toast.success(exists ? "Plan updated" : "Plan created");
  };

  const saveMethod = () => {
    if (!methodForm) return;
    if (!methodForm.label.trim() || !methodForm.identifier.trim()) { toast.error("Label & identifier required"); return; }
    const exists = methods.some(m => m.id === methodForm.id);
    const next = exists ? methods.map(m => m.id === methodForm.id ? methodForm : m) : [...methods, methodForm];
    persistMethods(next);
    setMethodForm(null);
    toast.success(exists ? "Method updated" : "Method added");
  };

  return (
    <div className="space-y-8">
      {/* PLANS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm text-primary flex items-center gap-2"><Crown className="w-4 h-4" /> SUBSCRIPTION PLANS</h3>
            <p className="text-[10px] text-muted-foreground">Edit, add or disable plans. Changes are saved instantly.</p>
          </div>
          <Button size="sm" onClick={() => setPlanForm({ id: crypto.randomUUID(), name: "", price: 0, currency: "USD", interval: "monthly", features: [], active: true })} className="gap-1 font-display text-xs">
            <Plus className="w-3.5 h-3.5" /> New Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plans.map(p => (
            <div key={p.id} className={`relative rounded-lg border p-4 ${p.highlighted ? "border-primary/60 bg-primary/5" : "border-border bg-secondary/30"} ${!p.active ? "opacity-50" : ""}`}>
              {p.badge && <span className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-display">{p.badge}</span>}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-display text-sm text-foreground">{p.name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase">{p.interval}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-primary">{p.price === 0 ? "FREE" : `${p.currency} ${p.price}`}</p>
                </div>
              </div>
              <ul className="space-y-1 mb-3">
                {p.features.map((f, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5"><Check className="w-3 h-3 text-scarab mt-0.5 shrink-0" />{f}</li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Switch checked={p.active} onCheckedChange={(v) => persistPlans(plans.map(x => x.id === p.id ? { ...x, active: v } : x))} />
                  {p.active ? "Active" : "Disabled"}
                </label>
                <div className="flex gap-1">
                  <button onClick={() => setPlanForm({ ...p })} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (confirm(`Delete plan "${p.name}"?`)) persistPlans(plans.filter(x => x.id !== p.id)); }} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PAYMENT METHODS */}
      <section className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm text-primary flex items-center gap-2"><CreditCard className="w-4 h-4" /> PAYMENT METHODS</h3>
            <p className="text-[10px] text-muted-foreground">InstaPay, Vodafone Cash, PayPal, Stripe, Paymob, bank transfer & more.</p>
          </div>
          <Button size="sm" onClick={() => setMethodForm({ id: crypto.randomUUID(), type: "instapay", label: "", identifier: "", enabled: true })} className="gap-1 font-display text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Method
          </Button>
        </div>

        <div className="space-y-2">
          {methods.map(m => {
            const meta = PAYMENT_TYPE_META[m.type];
            const Icon = meta.icon;
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                <div className={`w-9 h-9 rounded-md bg-background/50 flex items-center justify-center ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display text-foreground truncate">{m.label} <span className="text-[10px] text-muted-foreground font-body">· {meta.label}</span></p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{m.identifier}</p>
                </div>
                <Switch checked={m.enabled} onCheckedChange={(v) => persistMethods(methods.map(x => x.id === m.id ? { ...x, enabled: v } : x))} />
                <button onClick={() => setMethodForm({ ...m })} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm(`Remove "${m.label}"?`)) persistMethods(methods.filter(x => x.id !== m.id)); }} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
          {methods.length === 0 && <p className="text-xs text-muted-foreground p-3 bg-secondary/30 rounded-lg border border-border">No payment methods configured yet.</p>}
        </div>
      </section>

      {/* PLAN DIALOG */}
      <Dialog open={!!planForm} onOpenChange={(o) => !o && setPlanForm(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{planForm && plans.some(p => p.id === planForm.id) ? "Edit Plan" : "New Plan"}</DialogTitle></DialogHeader>
          {planForm && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2"><Label className="text-xs">Plan Name *</Label><Input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="bg-secondary border-border" /></div>
                <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: +e.target.value })} className="bg-secondary border-border" /></div>
                <div className="space-y-1"><Label className="text-xs">Currency</Label>
                  <select value={planForm.currency} onChange={e => setPlanForm({ ...planForm, currency: e.target.value })} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm">
                    <option>USD</option><option>EUR</option><option>EGP</option><option>SAR</option><option>AED</option>
                  </select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Interval</Label>
                  <select value={planForm.interval} onChange={e => setPlanForm({ ...planForm, interval: e.target.value as Plan["interval"] })} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm">
                    <option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="lifetime">Lifetime</option>
                  </select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Badge (optional)</Label><Input value={planForm.badge || ""} onChange={e => setPlanForm({ ...planForm, badge: e.target.value })} placeholder="Most Popular / Premium" className="bg-secondary border-border" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Features (one per line)</Label>
                <Textarea value={planForm.features.join("\n")} onChange={e => setPlanForm({ ...planForm, features: e.target.value.split("\n").filter(Boolean) })} className="bg-secondary border-border min-h-[120px]" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs"><Switch checked={planForm.active} onCheckedChange={v => setPlanForm({ ...planForm, active: v })} />Active</label>
                <label className="flex items-center gap-2 text-xs"><Switch checked={!!planForm.highlighted} onCheckedChange={v => setPlanForm({ ...planForm, highlighted: v })} />Highlighted</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPlanForm(null)}>Cancel</Button>
            <Button onClick={savePlan} className="font-display text-xs">Save Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* METHOD DIALOG */}
      <Dialog open={!!methodForm} onOpenChange={(o) => !o && setMethodForm(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="font-display text-primary">{methodForm && methods.some(m => m.id === methodForm.id) ? "Edit Method" : "Add Payment Method"}</DialogTitle></DialogHeader>
          {methodForm && (
            <div className="space-y-3">
              <div className="space-y-1"><Label className="text-xs">Type *</Label>
                <select value={methodForm.type} onChange={e => setMethodForm({ ...methodForm, type: e.target.value as PaymentMethod["type"] })} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm">
                  {Object.entries(PAYMENT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Display Label *</Label><Input value={methodForm.label} onChange={e => setMethodForm({ ...methodForm, label: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="space-y-1"><Label className="text-xs">Identifier *</Label><Input value={methodForm.identifier} onChange={e => setMethodForm({ ...methodForm, identifier: e.target.value })} placeholder={PAYMENT_TYPE_META[methodForm.type].placeholder} className="bg-secondary border-border" /></div>
              <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea value={methodForm.notes || ""} onChange={e => setMethodForm({ ...methodForm, notes: e.target.value })} className="bg-secondary border-border" /></div>
              <label className="flex items-center gap-2 text-xs"><Switch checked={methodForm.enabled} onCheckedChange={v => setMethodForm({ ...methodForm, enabled: v })} />Enabled for customers</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMethodForm(null)}>Cancel</Button>
            <Button onClick={saveMethod} className="font-display text-xs">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingPlansManager;
