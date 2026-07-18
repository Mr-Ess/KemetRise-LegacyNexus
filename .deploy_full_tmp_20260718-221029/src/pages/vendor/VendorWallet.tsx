import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import VendorLayout from "@/layouts/VendorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, DollarSign, TrendingUp,
  Clock, CheckCircle, AlertCircle, Banknote, CreditCard,
  Download, RefreshCw, Lock, ArrowRight, Plus, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface WalletData {
  id: string;
  balance_cents: number;
  pending_cents: number;
  total_earned_cents: number;
  total_fees_cents: number;
  currency: string;
  is_frozen: boolean;
  freeze_reason?: string;
  payout_method: string;
}

interface Transaction {
  id: string;
  type: string;
  gross_cents: number;
  fee_cents: number;
  net_cents: number;
  balance_after: number;
  description?: string;
  status: string;
  created_at: string;
}

interface Payout {
  id: string;
  amount_cents: number;
  net_cents: number;
  method: string;
  status: string;
  created_at: string;
  processed_at?: string;
}

export default function VendorWallet() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const db = supabase as any;
  const R = i18n.language === "ar";
  const locale = R ? ar : enUS;
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: w }, { data: tx }, { data: po }] = await Promise.all([
      db.from("vendor_wallets").select("*").eq("user_id", user.id).single(),
      db.from("vendor_transactions").select("*").eq("vendor_user_id", user.id).order("created_at", { ascending: false }).limit(50),
      db.from("vendor_payouts").select("*").eq("vendor_user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setWallet(w);
    setTransactions(tx || []);
    setPayouts(po || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const requestPayout = async () => {
    if (!wallet || wallet.is_frozen) return;
    const cents = Math.round(parseFloat(payoutAmount) * 100);
    if (isNaN(cents) || cents <= 0) { toast.error(R ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount"); return; }
    if (cents > wallet.balance_cents) { toast.error(R ? "الرصيد غير كافٍ" : "Insufficient balance"); return; }
    if (cents < 500) { toast.error(R ? "الحد الأدنى للسحب $5" : "Minimum payout is $5"); return; }
    setRequestingPayout(true);
    const fee = Math.round(cents * 0.015); // 1.5% payout fee
    const { error } = await db.from("vendor_payouts").insert({
      vendor_user_id: user!.id, wallet_id: wallet.id,
      amount_cents: cents, fee_cents: fee, net_cents: cents - fee,
      currency: wallet.currency, method: wallet.payout_method,
    });
    if (error) { toast.error(error.message); }
    else {
      toast.success(R ? "تم إرسال طلب السحب — سيتم المعالجة خلال 2-5 أيام عمل" : "Payout requested — processing in 2-5 business days");
      setPayoutAmount("");
      load();
    }
    setRequestingPayout(false);
  };

  const txTypeConfig: Record<string, { icon: any; color: string; label: string; labelAr: string }> = {
    sale:       { icon: ArrowUpRight,  color: "text-green-400",  label: "Sale",       labelAr: "مبيعات"     },
    refund:     { icon: ArrowDownLeft, color: "text-red-400",    label: "Refund",     labelAr: "استرداد"    },
    fee:        { icon: DollarSign,    color: "text-orange-400", label: "Fee",        labelAr: "رسوم"       },
    payout:     { icon: Banknote,      color: "text-blue-400",   label: "Payout",     labelAr: "سحب"        },
    adjustment: { icon: RefreshCw,     color: "text-yellow-400", label: "Adjustment", labelAr: "تعديل"      },
    bonus:      { icon: TrendingUp,    color: "text-primary",    label: "Bonus",      labelAr: "مكافأة"     },
  };

  const payoutStatusConfig: Record<string, { color: string; label: string; labelAr: string }> = {
    pending:    { color: "text-yellow-400", label: "Pending",    labelAr: "معلق"   },
    processing: { color: "text-blue-400",   label: "Processing", labelAr: "جارٍ"   },
    completed:  { color: "text-green-400",  label: "Completed",  labelAr: "مكتمل"  },
    failed:     { color: "text-red-400",    label: "Failed",     labelAr: "فشل"    },
  };

  return (
    <VendorLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-400" />
            {R ? "محفظتي وسجل التسوية" : "My Wallet & Settlement"}
          </h1>
          <Button size="sm" variant="outline" onClick={load} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Wallet frozen notice */}
        {wallet?.is_frozen && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">{R ? "المحفظة مجمدة" : "Wallet Frozen"}</p>
              <p className="text-xs text-muted-foreground">{wallet.freeze_reason || (R ? "تواصل مع الدعم" : "Contact support")}</p>
            </div>
          </div>
        )}

        {/* Balance cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: R ? "الرصيد المتاح"   : "Available Balance",  value: wallet?.balance_cents || 0,       color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",  icon: Wallet    },
            { label: R ? "قيد الانتظار"    : "Pending",            value: wallet?.pending_cents || 0,       color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20",icon: Clock     },
            { label: R ? "إجمالي الأرباح"  : "Total Earned",       value: wallet?.total_earned_cents || 0,  color: "text-primary",    bg: "bg-primary/10 border-primary/20",      icon: TrendingUp },
            { label: R ? "إجمالي الرسوم"   : "Total Fees Paid",    value: wallet?.total_fees_cents || 0,    color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", icon: DollarSign },
          ].map(k => (
            <Card key={k.label} className={cn("border", k.bg)}>
              <CardContent className="p-4">
                <k.icon className={cn("w-5 h-5 mb-2", k.color)} />
                <p className={cn("text-xl font-bold font-display", k.color)}>
                  ${((k.value) / 100).toLocaleString("en", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payout request */}
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <Banknote className="w-4 h-4" />{R ? "طلب سحب" : "Request Payout"}
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">{R ? "المبلغ (USD)" : "Amount (USD)"}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <input
                    type="number" min="5" step="0.01"
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={wallet?.is_frozen}
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/40 disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground mb-1">{R ? "رسوم السحب: 1.5%" : "Payout fee: 1.5%"}</p>
                {payoutAmount && !isNaN(parseFloat(payoutAmount)) && (
                  <p className="text-[10px] text-green-400 mb-1">{R ? "ستستلم: " : "You'll receive: "}${(parseFloat(payoutAmount) * 0.985).toFixed(2)}</p>
                )}
              </div>
              <Button onClick={requestPayout} disabled={requestingPayout || wallet?.is_frozen} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                <Banknote className="w-3.5 h-3.5" />{R ? "سحب" : "Payout"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {R ? `طريقة الدفع: ${wallet?.payout_method || "—"} · الحد الأدنى: $5` : `Method: ${wallet?.payout_method || "—"} · Minimum: $5`}
            </p>
          </CardContent>
        </Card>

        {/* Tabs: transactions / payouts */}
        <Tabs defaultValue="transactions">
          <TabsList className="bg-secondary/30 border border-border">
            <TabsTrigger value="transactions">{R ? "سجل الحركات" : "Transactions"}</TabsTrigger>
            <TabsTrigger value="payouts">{R ? "سجل السحوبات" : "Payout History"}</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20">
                        <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">{R ? "النوع" : "Type"}</th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{R ? "الإجمالي" : "Gross"}</th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{R ? "الرسوم" : "Fee"}</th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{R ? "الصافي" : "Net"}</th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{R ? "الرصيد" : "Balance"}</th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{R ? "التاريخ" : "Date"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{R ? "لا توجد حركات" : "No transactions"}</td></tr>
                      ) : transactions.map(tx => {
                        const cfg = txTypeConfig[tx.type] || txTypeConfig.adjustment;
                        return (
                          <tr key={tx.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className={cn("flex items-center gap-1.5 font-medium", cfg.color)}>
                                <cfg.icon className="w-3.5 h-3.5" />
                                {R ? cfg.labelAr : cfg.label}
                              </span>
                              {tx.description && <p className="text-[9px] text-muted-foreground mt-0.5">{tx.description}</p>}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold">${(tx.gross_cents/100).toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right text-orange-400">-${(tx.fee_cents/100).toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-green-400">${(tx.net_cents/100).toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">${(tx.balance_after/100).toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">{format(new Date(tx.created_at), "dd MMM yy", { locale })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20">
                        <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">{R ? "المبلغ" : "Amount"}</th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{R ? "الصافي" : "Net"}</th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{R ? "الطريقة" : "Method"}</th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{R ? "الحالة" : "Status"}</th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{R ? "التاريخ" : "Date"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{R ? "لا توجد سحوبات" : "No payouts yet"}</td></tr>
                      ) : payouts.map(p => {
                        const cfg = payoutStatusConfig[p.status] || payoutStatusConfig.pending;
                        return (
                          <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-2.5 font-semibold">${(p.amount_cents/100).toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right text-green-400 font-bold">${(p.net_cents/100).toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">{p.method}</td>
                            <td className="px-4 py-2.5 text-right"><Badge className={cn("text-[9px] px-1.5", cfg.color)}>{R ? cfg.labelAr : cfg.label}</Badge></td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">{format(new Date(p.created_at), "dd MMM yy", { locale })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </VendorLayout>
  );
}
