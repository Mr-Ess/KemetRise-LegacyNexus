import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import UserPortalLayout from "@/layouts/UserPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag, Clock, CheckCircle, XCircle, Package,
  Search, Filter, FileText, ExternalLink, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type OrderStatus = "all" | "pending" | "processing" | "completed" | "cancelled" | "refunded";

interface OrderItem {
  id: string;
  listing_id: string;
  quantity: number;
  unit_price: number;
  mp_listings?: { name: string; listing_type: string };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_cents: number;
  payment_method?: string;
  created_at: string;
  mp_order_items?: OrderItem[];
}

export default function UserOrders() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const db = supabase as any;
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isRTL = i18n.language === "ar";
  const locale = isRTL ? ar : enUS;

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user]);

  useEffect(() => {
    let result = orders;
    if (statusFilter !== "all") result = result.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.order_number?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [orders, statusFilter, search]);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await db
      .from("mp_orders")
      .select(`
        id, order_number, status, total_cents, payment_method, created_at,
        mp_order_items (id, listing_id, quantity, unit_price,
          mp_listings (name, listing_type))
      `)
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const STATUS_TABS: { value: OrderStatus; label: string; labelAr: string; icon: any; color: string }[] = [
    { value: "all",        label: "All",        labelAr: "الكل",         icon: ShoppingBag, color: "text-foreground"   },
    { value: "pending",    label: "Pending",    labelAr: "معلق",         icon: Clock,       color: "text-yellow-400"  },
    { value: "processing", label: "Processing", labelAr: "قيد التنفيذ", icon: Package,     color: "text-blue-400"    },
    { value: "completed",  label: "Completed",  labelAr: "مكتمل",        icon: CheckCircle, color: "text-green-400"   },
    { value: "cancelled",  label: "Cancelled",  labelAr: "ملغي",         icon: XCircle,     color: "text-red-400"     },
    { value: "refunded",   label: "Refunded",   labelAr: "مسترد",        icon: RefreshCw,   color: "text-orange-400"  },
  ];

  const getStatusConfig = (status: string) =>
    STATUS_TABS.find(t => t.value === status) || STATUS_TABS[0];

  const paymentLabels: Record<string, [string, string]> = {
    credit_card:     ["بطاقة ائتمان", "Credit Card"],
    bank_transfer:   ["تحويل بنكي",  "Bank Transfer"],
    cash:            ["نقداً",        "Cash"],
    wallet:          ["محفظة",        "Wallet"],
    other:           ["أخرى",         "Other"],
  };

  return (
    <UserPortalLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-display font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            {isRTL ? "مشترياتي" : "My Orders"}
          </h1>
          <Button variant="outline" size="sm" onClick={loadOrders} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={isRTL ? "ابحث برقم الطلب..." : "Search by order number..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                statusFilter === tab.value
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
              )}>
              <tab.icon className={cn("w-3 h-3", statusFilter === tab.value ? "text-primary" : tab.color)} />
              {isRTL ? tab.labelAr : tab.label}
              <span className="ml-1 text-[10px] opacity-60">
                ({tab.value === "all" ? orders.length : orders.filter(o => o.status === tab.value).length})
              </span>
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRTL ? "جارٍ التحميل..." : "Loading..."}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">{isRTL ? "لا توجد طلبات" : "No orders found"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const s = getStatusConfig(order.status);
              const isExpanded = expandedId === order.id;
              return (
                <Card key={order.id} className={cn("cursor-pointer transition-all hover:border-primary/30", isExpanded && "border-primary/30")}>
                  {/* Order header */}
                  <CardContent className="p-4" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center">
                          <s.icon className={cn("w-4 h-4", s.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{order.order_number}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(order.created_at), "dd MMM yyyy", { locale })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${((order.total_cents || 0) / 100).toFixed(2)}</p>
                        <Badge className={cn("text-[9px] px-1.5 border mt-1", s.color)}>
                          {isRTL ? s.labelAr : s.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Payment method */}
                    {order.payment_method && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {isRTL ? "طريقة الدفع: " : "Payment: "}
                        <span className="text-foreground">
                          {isRTL
                            ? (paymentLabels[order.payment_method]?.[0] ?? order.payment_method)
                            : (paymentLabels[order.payment_method]?.[1] ?? order.payment_method)}
                        </span>
                      </p>
                    )}
                  </CardContent>

                  {/* Expanded items */}
                  {isExpanded && order.mp_order_items && order.mp_order_items.length > 0 && (
                    <div className="border-t border-border px-4 pb-4 pt-3 bg-secondary/10">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {isRTL ? "المنتجات" : "Items"}
                      </p>
                      <div className="space-y-2">
                        {order.mp_order_items.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <div>
                              <p className="font-medium">{item.mp_listings?.name || "—"}</p>
                              <p className="text-muted-foreground text-[10px]">
                                {isRTL ? "الكمية: " : "Qty: "}{item.quantity} × ${((item.unit_price || 0) / 100).toFixed(2)}
                              </p>
                            </div>
                            <p className="font-bold">
                              ${((item.quantity * item.unit_price_cents) / 100).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors">
                          <FileText className="w-3 h-3" />
                          {isRTL ? "تحميل الفاتورة" : "Download Invoice"}
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </UserPortalLayout>
  );
}
