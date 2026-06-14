import { useState, useEffect } from "react";
import {
  Check, ChevronRight, RefreshCw, Receipt, ShoppingBag,
  PartyPopper, Copy,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

/* ── Constants ─────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Review" },
  { id: 2, label: "Details" },
  { id: 3, label: "Payment" },
  { id: 4, label: "Confirm" },
];

const PAYMENT_METHODS = [
  { id: "credit_card",   label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, Amex" },
  { id: "bank_transfer", label: "Bank Transfer",        icon: "🏦", desc: "Direct bank transfer"   },
  { id: "cash",          label: "Cash on Delivery",     icon: "💵", desc: "Pay when received"      },
  { id: "wallet",        label: "Digital Wallet",       icon: "📱", desc: "PayPal, Fawry, Vodafone Cash" },
  { id: "other",         label: "Other / Contact Us",   icon: "📞", desc: "We will contact you"    },
];

interface BuyerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  typeConfigMap: Record<string, any>;
  onOrderComplete: (orderNumber: string) => void;
}

/* ── Component ─────────────────────────────────────────── */
export default function CheckoutWizard({ open, onClose, typeConfigMap, onOrderComplete }: Props) {
  const { items, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [buyer, setBuyer] = useState<BuyerForm>({
    name: "", email: "", phone: "", address: "", notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [loading, setLoading] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);
  const db = supabase as any;

  useEffect(() => {
    if (open) {
      setStep(1);
      setCompletedOrderNumber(null);
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setBuyer(prev => ({
            ...prev,
            email: prev.email || user.email || "",
            name: prev.name || user.user_metadata?.full_name || user.user_metadata?.name || "",
          }));
        }
      });
    }
  }, [open]);

  const hasPhysical = items.some(i => i.listing_type === "physical");
  const currency = items[0]?.currency || "USD";
  const formatPrice = (cents: number) =>
    cents === 0 ? "Free" : `${(cents / 100).toFixed(2)} ${currency}`;

  const validateStep2 = () => {
    if (!buyer.name.trim()) { toast.error("Please enter your full name"); return false; }
    if (!buyer.email.trim() || !buyer.email.includes("@")) { toast.error("Please enter a valid email address"); return false; }
    return true;
  };

  const placeOrder = async () => {
    if (!validateStep2()) { setStep(2); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create order
      const { data: order, error: orderErr } = await db.from("mp_orders").insert({
        user_id: user?.id ?? null,
        buyer_name: buyer.name.trim(),
        buyer_email: buyer.email.trim(),
        buyer_phone: buyer.phone.trim() || null,
        buyer_address: buyer.address.trim() || null,
        payment_method: paymentMethod,
        status: "pending",
        subtotal_cents: cartTotal,
        total_cents: cartTotal,
        currency,
        notes: buyer.notes.trim() || null,
      }).select().single();

      if (orderErr) throw orderErr;

      // 2. Create order items
      await db.from("mp_order_items").insert(
        items.map(item => ({
          order_id: order.id,
          listing_id: item.listing_id,
          listing_name: item.name,
          listing_type: item.listing_type,
          quantity: item.quantity,
          unit_price: item.price_cents,
          total_price: item.price_cents * item.quantity,
          currency: item.currency,
          meta: item.meta || {},
        }))
      );

      // 3. Also record in mp_purchases for "owned" tracking
      if (user) {
        for (const item of items) {
          try {
            await db.from("mp_purchases").insert({
              listing_id: item.listing_id,
              user_id: user.id,
              amount_cents: item.price_cents * item.quantity,
              buyer_name: buyer.name.trim(),
              buyer_email: buyer.email.trim(),
            });
          } catch { /* already purchased, ignore */ }
        }
      }

      // 4. Send invoice email (fire-and-forget)
      try {
        await supabase.functions.invoke("send-invoice", { body: { order_id: order.id } });
      } catch { /* optional — don't block on email failure */ }

      // 5. Clear cart
      await clearCart();

      setCompletedOrderNumber(order.order_number);
      onOrderComplete(order.order_number);
      toast.success(`Order ${order.order_number} placed successfully! 🎉`);
    } catch (err: any) {
      toast.error("Failed to place order: " + (err.message || "Please try again"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ─────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Receipt className="w-4 h-4 text-primary shrink-0" />
            {completedOrderNumber ? "Order Confirmed!" : "Checkout"}
          </DialogTitle>
        </DialogHeader>

        {/* ── Success State ── */}
        {completedOrderNumber ? (
          <div className="flex flex-col items-center py-8 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <PartyPopper className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-bold mb-1">Order Placed Successfully!</p>
              <p className="text-xs text-muted-foreground">
                An invoice has been sent to <span className="font-medium text-foreground">{buyer.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-secondary/20">
              <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-mono font-bold">{completedOrderNumber}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(completedOrderNumber); toast.success("Copied!"); }}
                className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              Your order is now <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/40">Pending</Badge> and will be processed shortly.
            </p>
            <Button onClick={onClose} className="mt-2">Continue Shopping</Button>
          </div>
        ) : (
          <>
            {/* ── Step Indicator ── */}
            <div className="flex items-center mb-5">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > s.id ? "bg-emerald-500 text-white"
                      : step === s.id ? "bg-primary text-primary-foreground"
                      : "bg-secondary/40 text-muted-foreground"
                    }`}>
                      {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                    </div>
                    <span className={`text-[10px] mt-1 leading-none ${
                      step === s.id ? "text-primary font-semibold" : "text-muted-foreground"
                    }`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-1 mb-4 transition-all ${step > s.id ? "bg-emerald-500" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Step 1: Review Cart ── */}
            {step === 1 && (
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Your cart is empty</div>
                ) : (
                  <>
                    {items.map(item => {
                      const cfg = typeConfigMap[item.listing_type];
                      return (
                        <div key={item.listing_id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-secondary/10">
                          <div className={`text-lg w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${cfg?.gradient || "from-violet-600/20"} border ${cfg?.border || "border-violet-500/40"} shrink-0 overflow-hidden`}>
                            {item.thumbnail_url
                              ? <img src={item.thumbnail_url} className="w-7 h-7 object-contain" alt="" />
                              : (cfg?.icon || "📦")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.publisher_name}</p>
                            <Badge className={`mt-0.5 text-[9px] px-1.5 py-0 ${cfg?.badgeClass || ""}`}>{cfg?.label || item.listing_type}</Badge>
                          </div>
                          <span className="text-xs font-bold text-primary shrink-0">{formatPrice(item.price_cents)}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-sm font-semibold">Total ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                      <span className="text-base font-bold text-primary">{formatPrice(cartTotal)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Step 2: Buyer Details ── */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Full Name *</Label>
                    <Input className="mt-1 h-9" value={buyer.name} onChange={e => setBuyer(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Email Address *</Label>
                    <Input className="mt-1 h-9" type="email" value={buyer.email} onChange={e => setBuyer(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
                    <p className="text-[10px] text-muted-foreground mt-1">Invoice will be sent to this email</p>
                  </div>
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input className="mt-1 h-9" value={buyer.phone} onChange={e => setBuyer(p => ({ ...p, phone: e.target.value }))} placeholder="+20 100 000 0000" />
                  </div>
                  {hasPhysical && (
                    <div className="col-span-2">
                      <Label className="text-xs">Delivery Address</Label>
                      <Input className="mt-1 h-9" value={buyer.address} onChange={e => setBuyer(p => ({ ...p, address: e.target.value }))} placeholder="Street, City, Country" />
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label className="text-xs">Notes / Special Instructions</Label>
                    <Textarea className="mt-1 text-xs" rows={2} value={buyer.notes} onChange={e => setBuyer(p => ({ ...p, notes: e.target.value }))} placeholder="Any special instructions…" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Payment Method ── */}
            {step === 3 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">Select your preferred payment method</p>
                {PAYMENT_METHODS
                  .filter(m => m.id !== "cash" || hasPhysical)
                  .map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                        paymentMethod === method.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border hover:bg-secondary/20"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{method.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{method.label}</p>
                        <p className="text-[10px] text-muted-foreground">{method.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        paymentMethod === method.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}>
                        {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {/* ── Step 4: Confirm ── */}
            {step === 4 && (
              <div className="space-y-4">
                {/* Order summary */}
                <div className="p-4 rounded-xl border border-border/50 bg-secondary/10 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Order Summary</p>
                  {items.map(item => (
                    <div key={item.listing_id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[220px]">{item.name}</span>
                      <span className="font-medium shrink-0 ml-2">{formatPrice(item.price_cents)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-border/50 mt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                {/* Buyer + Payment summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-border/50 bg-secondary/10">
                    <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">Bill To</p>
                    <p className="text-xs font-semibold">{buyer.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{buyer.email}</p>
                    {buyer.phone && <p className="text-[10px] text-muted-foreground">{buyer.phone}</p>}
                  </div>
                  <div className="p-3 rounded-xl border border-border/50 bg-secondary/10">
                    <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">Payment</p>
                    <p className="text-xl">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.icon}</p>
                    <p className="text-xs font-semibold">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</p>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground text-center bg-secondary/20 rounded-lg px-3 py-2">
                  📧 Invoice will be sent to <span className="font-semibold text-foreground">{buyer.email}</span>
                </p>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <Button
                variant="ghost" size="sm"
                onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
              >
                {step === 1 ? "Cancel" : "← Back"}
              </Button>

              {step < 4 ? (
                <Button
                  size="sm"
                  onClick={() => {
                    if (step === 2 && !validateStep2()) return;
                    setStep(s => s + 1);
                  }}
                  disabled={items.length === 0}
                  className="gap-1.5"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={placeOrder}
                  disabled={loading}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Placing Order…</>
                    : <><Check className="w-3.5 h-3.5" />Place Order</>}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
