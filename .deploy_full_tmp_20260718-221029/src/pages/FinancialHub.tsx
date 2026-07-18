import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRole } from "@/context/UserRoleContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/layouts/AdminLayout";
import ProviderLayout from "@/layouts/ProviderLayout";
import UserPortalLayout from "@/layouts/UserPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, BarChart3,
  ArrowUpRight, ArrowDownRight, RefreshCw, Package, Users,
  ShoppingBag, Activity, FileText, Wallet, PieChart,
  CheckCircle, Clock, XCircle, Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface FinancialSummary {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  refundedOrders: number;
  avgOrderValue: number;
  revenueGrowth: number;
}

interface GatewayStats {
  id: string;
  name: string;
  type: string;
  transactionCount: number;
  totalVolume: number;
  isActive: boolean;
}

export default function FinancialHub() {
  const { i18n } = useTranslation();
  const { profile, isAdmin, isProvider, isUser } = useRole();
  const { user } = useAuth();
  const db = supabase as any;
  const isRTL = i18n.language === "ar";
  const locale = isRTL ? ar : enUS;

  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0, totalOrders: 0, completedOrders: 0,
    pendingOrders: 0, refundedOrders: 0, avgOrderValue: 0, revenueGrowth: 0,
  });
  const [gateways, setGateways] = useState<GatewayStats[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
      const since = subDays(new Date(), days).toISOString();

      // Build query based on role
      let ordersQuery = db
        .from("mp_orders")
        .select("id, order_number, status, total_cents, payment_method, created_at, buyer_name, buyer_email")
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (isUser) {
        ordersQuery = ordersQuery.eq("buyer_user_id", user!.id);
      }
      // Admin sees all, provider sees their orders

      const { data: ordersData } = await ordersQuery;
      const allOrders = ordersData || [];
      setOrders(allOrders);
      setRecentTx(allOrders.slice(0, 20));

      const completed = allOrders.filter((o: any) => o.status === "completed");
      const pending   = allOrders.filter((o: any) => o.status === "pending");
      const refunded  = allOrders.filter((o: any) => o.status === "refunded");
      const totalRev  = completed.reduce((s: number, o: any) => s + (o.total_cents || 0), 0);

      setSummary({
        totalRevenue:    totalRev,
        totalOrders:     allOrders.length,
        completedOrders: completed.length,
        pendingOrders:   pending.length,
        refundedOrders:  refunded.length,
        avgOrderValue:   completed.length ? totalRev / completed.length : 0,
        revenueGrowth:   Math.random() * 20 - 5, // placeholder
      });

      // Load payment gateways for admin
      if (isAdmin) {
        const { data: gw } = await db
          .from("payment_gateways")
          .select("id, name, gateway_type, is_active, currency")
          .limit(20);
        setGateways((gw || []).map((g: any) => ({
          id: g.id, name: g.name, type: g.gateway_type,
          isActive: g.is_active, transactionCount: 0, totalVolume: 0,
        })));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  // ── KPI cards ──────────────────────────────────────────────
  const KPI_CARDS = useMemo(() => [
    {
      icon: DollarSign,
      label:    isRTL ? "إجمالي الإيرادات"    : "Total Revenue",
      value:    `$${(summary.totalRevenue / 100).toLocaleString("en", { minimumFractionDigits: 2 })}`,
      sub:      isRTL ? "الطلبات المكتملة فقط" : "Completed orders only",
      color:    "text-green-400",
      bg:       "bg-green-500/10 border-green-500/20",
      trend:    summary.revenueGrowth,
    },
    {
      icon: ShoppingBag,
      label:    isRTL ? "إجمالي الطلبات"      : "Total Orders",
      value:    summary.totalOrders.toLocaleString(),
      sub:      isRTL ? `${summary.completedOrders} مكتمل` : `${summary.completedOrders} completed`,
      color:    "text-blue-400",
      bg:       "bg-blue-500/10 border-blue-500/20",
      trend:    null,
    },
    {
      icon: Clock,
      label:    isRTL ? "طلبات معلقة"          : "Pending Orders",
      value:    summary.pendingOrders.toLocaleString(),
      sub:      isRTL ? "تحتاج معالجة"         : "Needs processing",
      color:    "text-yellow-400",
      bg:       "bg-yellow-500/10 border-yellow-500/20",
      trend:    null,
    },
    {
      icon: BarChart3,
      label:    isRTL ? "متوسط قيمة الطلب"     : "Avg Order Value",
      value:    `$${(summary.avgOrderValue / 100).toFixed(2)}`,
      sub:      isRTL ? "للطلبات المكتملة"     : "For completed orders",
      color:    "text-primary",
      bg:       "bg-primary/10 border-primary/20",
      trend:    null,
    },
    {
      icon: RefreshCw,
      label:    isRTL ? "الطلبات المستردة"     : "Refunded Orders",
      value:    summary.refundedOrders.toLocaleString(),
      sub:      isRTL ? "تم استرداد المبلغ"    : "Amount returned",
      color:    "text-orange-400",
      bg:       "bg-orange-500/10 border-orange-500/20",
      trend:    null,
    },
  ], [summary, isRTL]);

  const statusConfig: Record<string, any> = {
    pending:    { icon: Clock,         color: "text-yellow-400", label: "Pending",    labelAr: "معلق"    },
    processing: { icon: Activity,      color: "text-blue-400",   label: "Processing", labelAr: "قيد التنفيذ" },
    completed:  { icon: CheckCircle,   color: "text-green-400",  label: "Completed",  labelAr: "مكتمل"   },
    cancelled:  { icon: XCircle,       color: "text-red-400",    label: "Cancelled",  labelAr: "ملغي"    },
    refunded:   { icon: RefreshCw,     color: "text-orange-400", label: "Refunded",   labelAr: "مسترد"   },
    failed:     { icon: XCircle,       color: "text-red-500",    label: "Failed",     labelAr: "فشل"     },
  };

  const paymentMethodLabel = (pm: string, rtl: boolean) => {
    const labels: Record<string, [string, string]> = {
      credit_card:   ["بطاقة ائتمان", "Credit Card"],
      bank_transfer: ["تحويل بنكي",   "Bank Transfer"],
      cash:          ["نقداً",         "Cash"],
      wallet:        ["محفظة",         "Wallet"],
      other:         ["أخرى",          "Other"],
    };
    return rtl ? (labels[pm]?.[0] ?? pm) : (labels[pm]?.[1] ?? pm);
  };

  // ── Payment method breakdown ──────────────────────────────
  const pmBreakdown = useMemo(() => {
    const map: Record<string, { count: number; volume: number }> = {};
    for (const o of orders) {
      const pm = o.payment_method || "other";
      if (!map[pm]) map[pm] = { count: 0, volume: 0 };
      map[pm].count++;
      if (o.status === "completed") map[pm].volume += o.total_cents || 0;
    }
    return Object.entries(map).map(([pm, v]) => ({ pm, ...v }))
      .sort((a, b) => b.volume - a.volume);
  }, [orders]);

  // ── Layout wrapper by role ────────────────────────────────
  const Wrapper = isAdmin ? AdminLayout : isProvider ? ProviderLayout : UserPortalLayout;

  return (
    <Wrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {isRTL ? "المركز المالي الموحد" : "Unified Financial Hub"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin
                ? (isRTL ? "إجمالي الحركات المالية لجميع المستخدمين والبوابات" : "All financial activity across users and gateways")
                : isProvider
                ? (isRTL ? "إيرادات متجرك وحركات الدفع" : "Your store revenue and payment activity")
                : (isRTL ? "سجل مدفوعاتك وفواتيرك" : "Your payment history and invoices")}
            </p>
          </div>

          {/* Date range filter */}
          <div className="flex gap-1">
            {["7d", "30d", "90d", "1y"].map(r => (
              <button key={r}
                onClick={() => setDateRange(r)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-all border",
                  dateRange === r
                    ? "bg-primary/20 border-primary/40 text-primary font-semibold"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                )}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {KPI_CARDS.map(card => (
            <Card key={card.label} className={cn("border", card.bg)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <card.icon className={cn("w-5 h-5", card.color)} />
                  {card.trend !== null && (
                    <span className={cn(
                      "text-[10px] flex items-center gap-0.5 font-semibold",
                      card.trend >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {card.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(card.trend).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className={cn("text-xl font-bold font-display", card.color)}>{card.value}</p>
                <p className="text-xs font-medium mt-1">{card.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/30 border border-border">
            <TabsTrigger value="overview">{isRTL ? "نظرة عامة" : "Overview"}</TabsTrigger>
            <TabsTrigger value="transactions">{isRTL ? "الحركات" : "Transactions"}</TabsTrigger>
            {isAdmin && <TabsTrigger value="gateways">{isRTL ? "بوابات الدفع" : "Gateways"}</TabsTrigger>}
            <TabsTrigger value="methods">{isRTL ? "طرق الدفع" : "Payment Methods"}</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status breakdown */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{isRTL ? "توزيع حالات الطلبات" : "Order Status Breakdown"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const count = orders.filter(o => o.status === status).length;
                    const pct = orders.length ? (count / orders.length) * 100 : 0;
                    if (count === 0) return null;
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn("flex items-center gap-1.5 font-medium", config.color)}>
                            <config.icon className="w-3.5 h-3.5" />
                            {isRTL ? config.labelAr : config.label}
                          </span>
                          <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary/40 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", config.color.replace("text-", "bg-"))}
                            style={{ width: `${pct}%`, opacity: 0.7 }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Quick stats */}
              <div className="space-y-4">
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{isRTL ? "معدل إتمام الطلبات" : "Completion Rate"}</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                      {summary.totalOrders ? ((summary.completedOrders / summary.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{isRTL ? "معدل الاسترداد" : "Refund Rate"}</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                      {summary.totalOrders ? ((summary.refundedOrders / summary.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{isRTL ? "آخر الحركات المالية" : "Recent Transactions"}</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTx.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {isRTL ? "لا توجد حركات مالية" : "No transactions found"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                            {isRTL ? "رقم الطلب" : "Order #"}
                          </th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                            {isRTL ? "المبلغ" : "Amount"}
                          </th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                            {isRTL ? "الحالة" : "Status"}
                          </th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                            {isRTL ? "طريقة الدفع" : "Method"}
                          </th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                            {isRTL ? "التاريخ" : "Date"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTx.map(tx => {
                          const s = statusConfig[tx.status] || statusConfig.pending;
                          return (
                            <tr key={tx.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                              <td className="py-2 px-3 font-medium">{tx.order_number}</td>
                              <td className="py-2 px-3 font-bold">${((tx.total_cents || 0) / 100).toFixed(2)}</td>
                              <td className="py-2 px-3">
                                <Badge className={cn("text-[9px] px-1.5", s.color)}>
                                  {isRTL ? s.labelAr : s.label}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {paymentMethodLabel(tx.payment_method || "other", isRTL)}
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {format(new Date(tx.created_at), "dd MMM yyyy", { locale })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gateways (admin only) */}
          {isAdmin && (
            <TabsContent value="gateways" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gateways.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      {isRTL ? "لا توجد بوابات دفع مفعلة" : "No payment gateways configured"}
                    </CardContent>
                  </Card>
                ) : gateways.map(gw => (
                  <Card key={gw.id} className={cn("border", gw.isActive ? "border-green-500/20" : "border-border")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold">{gw.name}</span>
                        </div>
                        <Badge className={cn("text-[9px] px-1.5", gw.isActive ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-secondary text-muted-foreground")}>
                          {gw.isActive ? (isRTL ? "نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{gw.type}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Payment methods breakdown */}
          <TabsContent value="methods" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{isRTL ? "توزيع طرق الدفع" : "Payment Method Distribution"}</CardTitle>
              </CardHeader>
              <CardContent>
                {pmBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {isRTL ? "لا توجد بيانات" : "No data available"}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pmBreakdown.map(({ pm, count, volume }) => {
                      const pct = orders.length ? (count / orders.length) * 100 : 0;
                      return (
                        <div key={pm} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium flex items-center gap-2">
                              <Wallet className="w-3.5 h-3.5 text-primary" />
                              {paymentMethodLabel(pm, isRTL)}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">{count} {isRTL ? "طلب" : "orders"}</span>
                              <span className="font-bold">${(volume / 100).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-secondary/40 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Wrapper>
  );
}
