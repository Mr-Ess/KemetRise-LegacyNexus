import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRole } from "@/context/UserRoleContext";
import { supabase } from "@/integrations/supabase/client";
import ProviderLayout from "@/layouts/ProviderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, ShoppingBag, Package, DollarSign, Star,
  ArrowRight, BarChart3, Clock, CheckCircle, XCircle,
  AlertCircle, Plus, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalListings: number;
  activeListings: number;
  rating: number;
}

export default function ProviderDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile, providerProfile, isProvider, isAdmin } = useRole();
  const db = supabase as any;
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalOrders: 0, pendingOrders: 0,
    totalListings: 0, activeListings: 0, rating: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!profile) return;
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Listings count
      const { count: totalListings } = await db
        .from("marketplace_listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", profile!.id);
      const { count: activeListings } = await db
        .from("marketplace_listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", profile!.id)
        .eq("status", "active");

      // Orders stats scoped to this provider's listings
      const { data: orders } = await db
        .from("mp_orders")
        .select("id, total_cents, status, created_at, buyer_name, buyer_email, order_number")
        .eq("seller_user_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const recent = orders || [];
      const pending = recent.filter((o: any) => o.status === "pending").length;
      const revenue = recent
        .filter((o: any) => o.status === "completed")
        .reduce((s: number, o: any) => s + (o.total_cents || 0), 0);

      setStats({
        totalRevenue: revenue,
        totalOrders: recent.length,
        pendingOrders: pending,
        totalListings: totalListings || 0,
        activeListings: activeListings || 0,
        rating: providerProfile?.rating || 0,
      });
      setRecentOrders(recent.slice(0, 5));
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const KPI_CARDS = [
    {
      icon: DollarSign, label: isRTL ? "إجمالي الإيرادات" : "Total Revenue",
      value: `$${(stats.totalRevenue / 100).toFixed(2)}`,
      color: "text-green-400", bg: "bg-green-500/10 border-green-500/20",
    },
    {
      icon: ShoppingBag, label: isRTL ? "إجمالي الطلبات" : "Total Orders",
      value: stats.totalOrders,
      color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Clock, label: isRTL ? "طلبات معلقة" : "Pending Orders",
      value: stats.pendingOrders,
      color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      icon: Package, label: isRTL ? "المنتجات النشطة" : "Active Listings",
      value: `${stats.activeListings} / ${stats.totalListings}`,
      color: "text-primary", bg: "bg-primary/10 border-primary/20",
    },
    {
      icon: Star, label: isRTL ? "التقييم" : "Rating",
      value: stats.rating ? `${stats.rating.toFixed(1)} ★` : "N/A",
      color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20",
    },
  ];

  const statusConfig: Record<string, { icon: any; color: string; label: string; labelAr: string }> = {
    pending:    { icon: Clock,         color: "text-yellow-400", label: "Pending",    labelAr: "معلق"    },
    processing: { icon: AlertCircle,   color: "text-blue-400",   label: "Processing", labelAr: "قيد التنفيذ" },
    completed:  { icon: CheckCircle,   color: "text-green-400",  label: "Completed",  labelAr: "مكتمل"   },
    cancelled:  { icon: XCircle,       color: "text-red-400",    label: "Cancelled",  labelAr: "ملغي"    },
    refunded:   { icon: AlertCircle,   color: "text-orange-400", label: "Refunded",   labelAr: "مسترد"   },
  };

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6">
        {/* Welcome banner */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {isRTL
                ? `مرحباً، ${providerProfile?.business_name || profile?.full_name || "مزود الخدمة"}`
                : `Welcome, ${providerProfile?.business_name || profile?.full_name || "Provider"}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isRTL ? "هذه نظرة عامة على أداء متجرك اليوم" : "Here's an overview of your store performance today"}
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => navigate("/marketplace")}>
            <Plus className="w-4 h-4" />
            {isRTL ? "منتج جديد" : "New Listing"}
          </Button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {KPI_CARDS.map(card => (
            <Card key={card.label} className={cn("border", card.bg)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <card.icon className={cn("w-5 h-5", card.color)} />
                </div>
                <p className={cn("text-xl font-bold font-display", card.color)}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Provider approval notice */}
        {providerProfile && !providerProfile.is_approved && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-400">
                  {isRTL ? "حسابك قيد المراجعة" : "Account Pending Approval"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRTL
                    ? "سيتم مراجعة حسابك من فريق الإدارة خلال 24-48 ساعة"
                    : "Your account is being reviewed by the admin team within 24-48 hours"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent orders */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">{isRTL ? "أحدث الطلبات" : "Recent Orders"}</CardTitle>
              <button
                onClick={() => navigate("/provider/orders")}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                {isRTL ? "عرض الكل" : "View All"} <ArrowRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {isRTL ? "لا توجد طلبات حتى الآن" : "No orders yet"}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map(order => {
                    const s = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-2">
                          <s.icon className={cn("w-3.5 h-3.5", s.color)} />
                          <div>
                            <p className="text-xs font-semibold">{order.order_number}</p>
                            <p className="text-[10px] text-muted-foreground">{order.buyer_name || order.buyer_email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold">${((order.total_cents || 0) / 100).toFixed(2)}</p>
                          <Badge className={cn("text-[8px] px-1 py-0", s.color)}>
                            {isRTL ? s.labelAr : s.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{isRTL ? "إجراءات سريعة" : "Quick Actions"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: Plus,        label: isRTL ? "إضافة منتج"       : "Add Listing",    path: "/marketplace",        color: "text-primary" },
                { icon: ShoppingBag, label: isRTL ? "إدارة الطلبات"    : "Manage Orders",  path: "/provider/orders",    color: "text-blue-400" },
                { icon: BarChart3,   label: isRTL ? "تحليلات الأداء"   : "Analytics",      path: "/provider/analytics", color: "text-green-400" },
                { icon: ExternalLink,label: isRTL ? "زيارة متجري"      : "View My Store",  path: "/provider/store",     color: "text-purple-400" },
                { icon: DollarSign,  label: isRTL ? "الإيرادات والمدفوعات" : "Revenue",     path: "/provider/revenue",   color: "text-yellow-400" },
              ].map(a => (
                <button key={a.path} onClick={() => navigate(a.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-all text-left">
                  <a.icon className={cn("w-4 h-4 shrink-0", a.color)} />
                  <span className="text-xs">{a.label}</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProviderLayout>
  );
}
