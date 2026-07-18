import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PartnerLayout from "@/layouts/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Activity, ShoppingBag, Clock, CheckCircle, XCircle,
  RefreshCcw, AlertCircle, PackageCheck, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    labelAr: "قيد الانتظار", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",  icon: Clock         },
  processing: { label: "Processing", labelAr: "قيد المعالجة", color: "text-blue-400 bg-blue-500/10 border-blue-500/30",        icon: Activity      },
  shipped:    { label: "Shipped",    labelAr: "تم الشحن",     color: "text-purple-400 bg-purple-500/10 border-purple-500/30",   icon: Truck         },
  completed:  { label: "Completed",  labelAr: "مكتمل",        color: "text-green-400 bg-green-500/10 border-green-500/30",     icon: CheckCircle   },
  cancelled:  { label: "Cancelled",  labelAr: "ملغي",         color: "text-red-400 bg-red-500/10 border-red-500/30",           icon: XCircle       },
  delivered:  { label: "Delivered",  labelAr: "تم التسليم",   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",icon: PackageCheck  },
};

export default function PartnerOperations() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = db.from("mp_orders").select("*").eq("partner_user_id", user.id).order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
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

  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map(s => [s, orders.filter(o => o.status === s).length])
  );

  return (
    <PartnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-400" />
              {R ? "العمليات" : "Operations"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "إدارة الطلبات والمعاملات" : "Manage orders and transactions"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{ value: "all", label: R ? "الكل" : "All" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: R ? v.labelAr : v.label }))].map(opt => (
            <Button key={opt.value} size="sm" variant={filter === opt.value ? "default" : "outline"}
              className={cn(filter === opt.value && "bg-indigo-600 hover:bg-indigo-700")}
              onClick={() => setFilter(opt.value)}>
              {opt.label}
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
            <div className="divide-y divide-border/50">
              {orders.map(order => {
                const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon = sc.icon;
                return (
                  <div key={order.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", sc.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-semibold">#{order.id?.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString(R ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">${((order.total_cents || 0) / 100).toFixed(2)}</span>
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
    </PartnerLayout>
  );
}
