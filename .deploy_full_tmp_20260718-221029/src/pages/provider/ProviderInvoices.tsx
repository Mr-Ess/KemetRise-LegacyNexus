import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/context/UserRoleContext";
import ProviderLayout from "@/layouts/ProviderLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCcw, FileText, DollarSign, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  paid:    "text-green-400 bg-green-500/10 border-green-500/30",
  overdue: "text-red-400 bg-red-500/10 border-red-500/30",
};
const STATUS_AR: Record<string, string> = { pending: "معلق", paid: "مدفوع", overdue: "متأخر" };

export default function ProviderInvoices() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { profile } = useRole();
  const db = supabase as any;

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    // Try provider_invoices, fallback to completed orders
    const { data: inv, error } = await db.from("provider_invoices").select("*").eq("provider_user_id", profile.id).order("created_at", { ascending: false });
    if (!error && inv?.length) {
      setInvoices(filter === "all" ? inv : inv.filter((i: any) => i.status === filter));
    } else {
      const { data: myListings } = await db.from("mp_listings").select("id").eq("publisher_user_id", profile.id);
    const listingIds = (myListings ?? []).map((l: any) => l.id);
    const { data: orderItems } = listingIds.length
      ? await db.from("mp_order_items").select("order_id").in("listing_id", listingIds)
      : { data: [] };
    const orderIds = [...new Set((orderItems ?? []).map((oi: any) => oi.order_id))];
    const { data: orders } = orderIds.length
      ? await db.from("mp_orders").select("id,created_at,total_cents,status,order_number").in("id", orderIds).in("status", ["completed","paid"]).order("created_at", { ascending: false })
      : { data: [] };
      const mapped = (orders ?? []).map((o: any, idx: number) => ({ id: o.id, invoice_number: `INV-${String(idx + 1).padStart(4, "0")}`, amount_cents: o.total_cents, status: "paid", created_at: o.created_at }));
      setInvoices(filter === "all" ? mapped : mapped.filter((i: any) => i.status === filter));
    }
    setLoading(false);
  }, [profile, filter]);

  useEffect(() => { load(); }, [load]);

  const total   = invoices.reduce((s, i) => s + (i.amount_cents || 0), 0);
  const paid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount_cents || 0), 0);
  const pending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + (i.amount_cents || 0), 0);

  const exportCSV = () => {
    const csv = [
      [R ? "رقم الفاتورة" : "Invoice #", R ? "التاريخ" : "Date", R ? "الحالة" : "Status", R ? "المبلغ" : "Amount"].join(","),
      ...invoices.map(i => [`${i.invoice_number || i.id?.slice(0, 8)}`, new Date(i.created_at).toLocaleDateString(), i.status, `$${((i.amount_cents || 0) / 100).toFixed(2)}`].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              {R ? "الفواتير" : "Invoices"}
            </h1>
            <p className="text-sm text-muted-foreground">{invoices.length} {R ? "فاتورة" : "invoices"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={!invoices.length} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4" />{R ? "تصدير CSV" : "Export CSV"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: R ? "الإجمالي" : "Total",   value: `$${(total / 100).toFixed(2)}`,   icon: DollarSign, color: "text-blue-400"   },
            { label: R ? "مدفوع" : "Paid",        value: `$${(paid / 100).toFixed(2)}`,    icon: CheckCircle,color: "text-green-400"  },
            { label: R ? "معلق" : "Pending",      value: `$${(pending / 100).toFixed(2)}`, icon: Clock,      color: "text-yellow-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-5 flex items-center gap-3">
                <s.icon className={cn("w-8 h-8", s.color)} />
                <div>
                  <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          {[{ v: "all", l: R ? "الكل" : "All" }, { v: "paid", l: R ? "مدفوع" : "Paid" }, { v: "pending", l: R ? "معلق" : "Pending" }, { v: "overdue", l: R ? "متأخر" : "Overdue" }].map(opt => (
            <Button key={opt.v} size="sm" variant={filter === opt.v ? "default" : "outline"} className={cn(filter === opt.v && "bg-blue-600 hover:bg-blue-700")} onClick={() => setFilter(opt.v)}>{opt.l}</Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد فواتير" : "No invoices"}</p>
          </div>
        ) : (
          <Card className="border-border/50">
            <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/10 border-b border-border/50">
              <span>{R ? "رقم الفاتورة" : "Invoice #"}</span><span>{R ? "التاريخ" : "Date"}</span>
              <span className="text-center">{R ? "الحالة" : "Status"}</span><span className="text-right">{R ? "المبلغ" : "Amount"}</span>
            </div>
            <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
              {invoices.map(inv => (
                <div key={inv.id} className="grid grid-cols-4 px-4 py-3 items-center text-sm">
                  <span className="font-mono text-xs">{inv.invoice_number || `#${inv.id?.slice(0, 8)}`}</span>
                  <span className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</span>
                  <div className="flex justify-center"><Badge variant="outline" className={cn("text-xs", STATUS_STYLE[inv.status] || "")}>{R ? STATUS_AR[inv.status] : inv.status}</Badge></div>
                  <span className="text-right font-semibold text-green-400">${((inv.amount_cents || 0) / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </ProviderLayout>
  );
}
