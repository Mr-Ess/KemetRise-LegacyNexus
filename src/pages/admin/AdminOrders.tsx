import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, Search, RefreshCcw, DollarSign, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  buyer_id?: string;
  total_cents?: number;
  currency?: string;
  status?: string;
  created_at?: string;
  items?: any[];
};

const STATUS_COLORS: Record<string, string> = {
  pending:    "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  processing: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  completed:  "text-green-400 border-green-400/30 bg-green-400/10",
  cancelled:  "text-red-400 border-red-400/30 bg-red-400/10",
  refunded:   "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

const STATUSES = ["all", "pending", "processing", "completed", "cancelled", "refunded"];

export default function AdminOrders() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from("mp_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setOrders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) =>
    (statusFilter === "all" || o.status === statusFilter) &&
    (search === "" || o.id.toLowerCase().includes(search.toLowerCase()))
  );

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const { error } = await db.from("mp_orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); }
    else { toast.success(R ? "تم تحديث الحالة" : "Status updated"); }
    setUpdatingId(null);
    load();
    if (detailOrder?.id === id) setDetailOrder((prev) => prev ? { ...prev, status } : null);
  };

  const fmt = (s?: string) => s ? new Date(s).toLocaleDateString(R ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const fmtAmt = (cents?: number, currency = "USD") =>
    cents != null ? `${(cents / 100).toFixed(2)} ${currency}` : "—";

  // Summary stats
  const totalRevenue = orders.filter(o => o.status === "completed").reduce((s, o) => s + (o.total_cents ?? 0), 0);
  const pending = orders.filter(o => o.status === "pending").length;
  const completed = orders.filter(o => o.status === "completed").length;
  const cancelled = orders.filter(o => o.status === "cancelled").length;

  const StatusIcon = (status?: string) => {
    if (status === "completed") return <CheckCircle className="w-3 h-3" />;
    if (status === "cancelled") return <XCircle className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" />
              {R ? "إدارة الطلبات" : "Orders Management"}
            </h1>
            <p className="text-sm text-muted-foreground">{filtered.length} {R ? "طلب" : "orders"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: R ? "إجمالي الإيرادات" : "Total Revenue", value: fmtAmt(totalRevenue), icon: DollarSign, color: "text-green-400" },
            { label: R ? "معلقة" : "Pending", value: pending, icon: Clock, color: "text-yellow-400" },
            { label: R ? "مكتملة" : "Completed", value: completed, icon: CheckCircle, color: "text-green-400" },
            { label: R ? "ملغاة" : "Cancelled", value: cancelled, icon: XCircle, color: "text-red-400" },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn("w-8 h-8", s.color)} />
                <div>
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={R ? "بحث بـ ID الطلب..." : "Search by order ID..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? (R ? "كل الحالات" : "All Statuses") : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "قائمة الطلبات" : "Orders List"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{R ? "لا توجد طلبات" : "No orders found"}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setDetailOrder(o)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-medium truncate">#{o.id.slice(0, 12)}…</div>
                      <div className="text-xs text-muted-foreground">{fmt(o.created_at)}</div>
                    </div>
                    <div className="text-sm font-semibold">{fmtAmt(o.total_cents, o.currency)}</div>
                    <Badge variant="outline" className={cn("text-xs gap-1", STATUS_COLORS[o.status ?? ""] ?? "")}>
                      {StatusIcon(o.status)}
                      {o.status ?? "—"}
                    </Badge>
                    <Select
                      value={o.status ?? "pending"}
                      onValueChange={(val) => updateStatus(o.id, val)}
                    >
                      <SelectTrigger
                        className="w-32 h-7 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent onClick={(e) => e.stopPropagation()}>
                        {STATUSES.filter(s => s !== "all").map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{R ? "تفاصيل الطلب" : "Order Details"}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground text-xs">{R ? "رقم الطلب" : "Order ID"}</div>
                  <div className="font-mono font-medium">{detailOrder.id.slice(0, 16)}…</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">{R ? "التاريخ" : "Date"}</div>
                  <div>{fmt(detailOrder.created_at)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">{R ? "المبلغ" : "Amount"}</div>
                  <div className="font-semibold">{fmtAmt(detailOrder.total_cents, detailOrder.currency)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">{R ? "الحالة" : "Status"}</div>
                  <Badge variant="outline" className={cn("text-xs mt-1", STATUS_COLORS[detailOrder.status ?? ""] ?? "")}>
                    {detailOrder.status ?? "—"}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">{R ? "تغيير الحالة" : "Update Status"}</div>
                <Select
                  value={detailOrder.status ?? "pending"}
                  onValueChange={(val) => updateStatus(detailOrder.id, val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.filter(s => s !== "all").map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOrder(null)}>
              {R ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
