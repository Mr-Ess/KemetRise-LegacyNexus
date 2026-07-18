import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import VendorLayout from "@/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShoppingBag, RefreshCcw, Clock, CheckCircle, XCircle, Truck, PackageCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    labelAr: "قيد الانتظار", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",   icon: Clock        },
  processing: { label: "Processing", labelAr: "قيد المعالجة", color: "text-blue-400 bg-blue-500/10 border-blue-500/30",         icon: Activity     },
  shipped:    { label: "Shipped",    labelAr: "تم الشحن",     color: "text-purple-400 bg-purple-500/10 border-purple-500/30",    icon: Truck        },
  completed:  { label: "Completed",  labelAr: "مكتمل",        color: "text-green-400 bg-green-500/10 border-green-500/30",      icon: CheckCircle  },
  paid:       { label: "Paid",       labelAr: "مدفوع",        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: PackageCheck },
  cancelled:  { label: "Cancelled",  labelAr: "ملغي",         color: "text-red-400 bg-red-500/10 border-red-500/30",            icon: XCircle      },
  refunded:   { label: "Refunded",   labelAr: "مسترجع",       color: "text-rose-400 bg-rose-500/10 border-rose-500/30",         icon: XCircle      },
};

export default function VendorOrders() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = db.from("mp_orders").select("*").eq("seller_user_id", user.id).order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setOrders(data ?? []);
    setLoading(false);
  }, [user, filter, page]);

  useEffect(() => { setPage(0); }, [filter]);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await db.from("mp_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم تحديث الحالة" : "Status updated");
    load();
  };

  return (
    <VendorLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-orange-400" />
              {R ? "الطلبات" : "Orders"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "إدارة طلبات متجرك" : "Manage your store orders"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {[{ v: "all", l: R ? "الكل" : "All" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ v: k, l: R ? v.labelAr : v.label }))].map(opt => (
            <Button key={opt.v} size="sm" variant={filter === opt.v ? "default" : "outline"}
              className={cn(filter === opt.v && "bg-orange-600 hover:bg-orange-700")}
              onClick={() => setFilter(opt.v)}>
              {opt.l}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد طلبات" : "No orders found"}</p>
          </div>
        ) : (
          <Card className="border-border/50">
            <div className="grid grid-cols-5 px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/10 border-b border-border/50">
              <span>{R ? "رقم الطلب" : "Order ID"}</span>
              <span>{R ? "المشتري" : "Buyer"}</span>
              <span>{R ? "التاريخ" : "Date"}</span>
              <span className="text-right">{R ? "المبلغ" : "Amount"}</span>
              <span className="text-right">{R ? "الحالة" : "Status"}</span>
            </div>
            <div className="divide-y divide-border/50">
              {orders.map(order => {
                const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon = sc.icon;
                return (
                  <div key={order.id} className="grid grid-cols-5 px-4 py-3 items-center text-sm hover:bg-muted/10 transition-colors">
                    <span className="font-mono text-xs text-muted-foreground">#{order.id?.slice(0, 8)}</span>
                    <span className="truncate text-xs">{order.buyer_name || "—"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</span>
                    <span className="text-right font-semibold">${((order.total_cents || 0) / 100).toFixed(2)}</span>
                    <div className="flex justify-end">
                      <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
                        <SelectTrigger className={cn("h-7 text-xs w-32 border", sc.color)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{R ? v.labelAr : v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>{R ? "السابق" : "Previous"}</Button>
          <span className="text-xs text-muted-foreground">{R ? `الصفحة ${page + 1}` : `Page ${page + 1}`}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={orders.length < PAGE_SIZE}>{R ? "التالي" : "Next"}</Button>
        </div>
      </div>
    </VendorLayout>
  );
}
