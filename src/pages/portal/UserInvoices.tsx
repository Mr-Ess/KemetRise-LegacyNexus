import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import UserPortalLayout from "@/layouts/UserPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Download, RefreshCcw, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColor: Record<string, string> = {
  paid:     "bg-green-500/15 text-green-400 border-green-500/30",
  pending:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  overdue:  "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled:"bg-muted/50 text-muted-foreground border-border",
};

export default function UserInvoices() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ count: 0, paid: 0, pending: 0 });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Try invoices table first, fallback to completed mp_orders
    const { data: inv } = await db.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (inv && inv.length > 0) {
      setInvoices(inv);
      setTotals({
        count: inv.length,
        paid: inv.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (i.amount || 0), 0),
        pending: inv.filter((i: any) => i.status === "pending").length,
      });
    } else {
      // Fallback: show orders as invoices
      const { data: orders } = await db
        .from("mp_orders")
        .select("id, order_number, status, total_cents, created_at, payment_method")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const mapped = (orders ?? []).map((o: any) => ({
        id: o.id,
        invoice_number: `INV-${o.order_number || o.id.slice(0, 8).toUpperCase()}`,
        status: o.status === "completed" ? "paid" : o.status === "cancelled" ? "cancelled" : "pending",
        amount: o.total_cents ? o.total_cents / 100 : 0,
        payment_method: o.payment_method,
        created_at: o.created_at,
      }));
      setInvoices(mapped);
      setTotals({
        count: mapped.length,
        paid: mapped.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0),
        pending: mapped.filter((i: any) => i.status === "pending").length,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const downloadInvoice = (inv: any) => {
    const rows = [
      ["Invoice", inv.invoice_number],
      ["Date", new Date(inv.created_at).toLocaleDateString()],
      ["Amount", `$${Number(inv.amount || 0).toFixed(2)}`],
      ["Status", inv.status],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `${inv.invoice_number}.csv`; a.click();
    toast.success(R ? "تم التحميل" : "Downloaded");
  };

  return (
    <UserPortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-400" />
              {R ? "فواتيري" : "My Invoices"}
            </h1>
            <p className="text-sm text-muted-foreground">{totals.count} {R ? "فاتورة" : "invoices"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: R ? "الإجمالي" : "Total",         val: totals.count,                            color: "text-primary"    },
            { label: R ? "إجمالي المدفوع" : "Paid",    val: `$${totals.paid.toFixed(2)}`,            color: "text-green-400"  },
            { label: R ? "معلقة" : "Pending",           val: totals.pending,                          color: "text-yellow-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 text-center">
                <div className={cn("text-xl font-bold font-display", s.color)}>{loading ? "—" : s.val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد فواتير" : "No invoices yet"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => (
              <Card key={inv.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{inv.invoice_number}</p>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5", statusColor[inv.status] || statusColor.pending)}>
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">${Number(inv.amount || 0).toFixed(2)}</span>
                      {inv.payment_method && <span>{inv.payment_method}</span>}
                      <span>{new Date(inv.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => downloadInvoice(inv)} title={R ? "تحميل" : "Download"}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </UserPortalLayout>
  );
}
