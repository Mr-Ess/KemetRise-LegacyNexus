import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRole } from "@/context/UserRoleContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import UserPortalLayout from "@/layouts/UserPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag, Heart, FileText, Star, ArrowRight, Clock,
  CheckCircle, XCircle, Package, TrendingUp, Crown, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_cents: number;
  created_at: string;
  buyer_name?: string;
}

export default function UserDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useRole();
  const { user } = useAuth();
  const db = supabase as any;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-redirect based on role so admins/vendors/etc. don't land here
  useEffect(() => {
    if (!profile) return;
    const role = profile.role;
    if (role === "admin" || role === "superadmin") navigate("/admin", { replace: true });
    else if (role === "partner")   navigate("/partner",   { replace: true });
    else if (role === "agent")     navigate("/agent",     { replace: true });
    else if (role === "vendor" || role === "provider") navigate("/vendor", { replace: true });
    else if (role === "marketing") navigate("/marketing", { replace: true });
  }, [profile, navigate]);
  const isRTL = i18n.language === "ar";
  const locale = isRTL ? ar : enUS;

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await db
        .from("mp_orders")
        .select("id, order_number, status, total_cents, created_at, buyer_name")
        .eq("buyer_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setOrders(data || []);
      setLoading(false);
    })();
  }, [user]);

  const statusConfig: Record<string, { icon: any; color: string; label: string; labelAr: string }> = {
    pending:    { icon: Clock,       color: "text-yellow-400", label: "Pending",    labelAr: "معلق"        },
    processing: { icon: Package,     color: "text-blue-400",   label: "Processing", labelAr: "قيد التنفيذ" },
    completed:  { icon: CheckCircle, color: "text-green-400",  label: "Completed",  labelAr: "مكتمل"       },
    cancelled:  { icon: XCircle,     color: "text-red-400",    label: "Cancelled",  labelAr: "ملغي"        },
  };

  const QUICK_LINKS = [
    { icon: ShoppingBag, label: isRTL ? "مشترياتي"  : "My Orders",  path: "/portal/orders",   color: "bg-blue-500/10   border-blue-500/20   text-blue-400"   },
    { icon: Heart,       label: isRTL ? "المفضلة"   : "Wishlist",   path: "/portal/wishlist", color: "bg-pink-500/10   border-pink-500/20   text-pink-400"   },
    { icon: FileText,    label: isRTL ? "الفواتير"  : "Invoices",   path: "/portal/invoices", color: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
    { icon: Star,        label: isRTL ? "تقييماتي"  : "My Reviews", path: "/portal/reviews",  color: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
  ];

  return (
    <UserPortalLayout>
      <div className="space-y-6">
        {/* Hero welcome */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background rounded-2xl p-6 border border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {isRTL ? "مرحباً بك في" : "Welcome to"}
              </p>
              <h1 className="text-2xl font-display font-bold text-foreground mt-1">
                {isRTL
                  ? `${profile?.full_name || "مستخدم"} ✨`
                  : `${profile?.full_name || "User"} ✨`}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {isRTL
                  ? "هنا يمكنك متابعة مشترياتك وإدارة حسابك"
                  : "Track your purchases and manage your account here"}
              </p>
            </div>
            <button
              onClick={() => navigate("/marketplace")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors text-sm font-medium">
              <Zap className="w-4 h-4" />
              {isRTL ? "تصفح المنتجات" : "Browse Products"}
            </button>
          </div>
        </div>

        {/* Quick links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_LINKS.map(link => (
            <button key={link.path}
              onClick={() => navigate(link.path)}
              className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-xl border transition-all hover:scale-105 active:scale-95",
                link.color.split(" ").slice(0, 2).join(" "), "border", link.color.split(" ")[2]
              )}>
              <link.icon className={cn("w-6 h-6", link.color.split(" ")[3])} />
              <span className={cn("text-sm font-medium", link.color.split(" ")[3])}>{link.label}</span>
            </button>
          ))}
        </div>

        {/* Recent orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              {isRTL ? "آخر مشترياتك" : "Recent Purchases"}
            </CardTitle>
            <button
              onClick={() => navigate("/portal/orders")}
              className="text-xs text-primary hover:underline flex items-center gap-1">
              {isRTL ? "عرض الكل" : "View All"} <ArrowRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {isRTL ? "جارٍ التحميل..." : "Loading..."}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "لا توجد مشتريات حتى الآن" : "No purchases yet"}
                </p>
                <Button size="sm" className="mt-3" onClick={() => navigate("/marketplace")}>
                  {isRTL ? "تصفح المنتجات" : "Browse Marketplace"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const s = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <div key={order.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/portal/orders")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", `bg-${s.color.split("-")[1]}-500/20`)}>
                          <s.icon className={cn("w-4 h-4", s.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{order.order_number}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${((order.total_cents || 0) / 100).toFixed(2)}</p>
                        <Badge className={cn("text-[9px] px-1.5", s.color)}>
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

        {/* Upgrade CTA */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {isRTL ? "ترقية إلى Premium" : "Upgrade to Premium"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRTL
                    ? "استمتع بميزات حصرية ودعم متميز"
                    : "Enjoy exclusive features and priority support"}
                </p>
              </div>
              <button
                onClick={() => navigate("/portal/profile")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                {isRTL ? "ترقية" : "Upgrade"} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserPortalLayout>
  );
}
