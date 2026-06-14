import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import VendorLayout from "@/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag, Package, TrendingUp, Wallet, Star,
  ArrowRight, AlertCircle, Clock, CheckCircle, XCircle,
  BarChart3, Users, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface WalletData { balance_cents: number; pending_cents: number; total_earned_cents: number; total_fees_cents: number; is_frozen: boolean; }
interface OrderItem { id: string; created_at: string; total_amount: number; status: string; buyer_name?: string; }

export default function VendorDashboard() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const db = supabase as any;
  const R = i18n.language === "ar";

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: w }, { count: pc }] = await Promise.all([
        db.from("vendor_wallets").select("*").eq("user_id", user.id).single(),
        db.from("public_products").select("*", { count: "exact", head: true }).eq("vendor_user_id", user.id),
      ]);
      setWallet(w);
      setProductCount(pc || 0);
      setLoading(false);
    })();
  }, [user]);

  const kpis = [
    { label: R ? "الرصيد المتاح" : "Available Balance",    value: `$${((wallet?.balance_cents ?? 0) / 100).toFixed(2)}`, icon: Wallet,    color: "text-green-400",  bg: "bg-green-500/10" },
    { label: R ? "في الانتظار"   : "Pending Balance",      value: `$${((wallet?.pending_cents ?? 0) / 100).toFixed(2)}`,  icon: Clock,     color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: R ? "إجمالي المكاسب": "Total Earned",         value: `$${((wallet?.total_earned_cents ?? 0) / 100).toFixed(2)}`, icon: TrendingUp,color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: R ? "عدد المنتجات"   : "Products Listed",     value: productCount,                                          icon: Package,   color: "text-indigo-400", bg: "bg-indigo-500/10" },
  ];

  const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
    paid:      { color: "text-green-400",  icon: CheckCircle },
    pending:   { color: "text-yellow-400", icon: Clock },
    refunded:  { color: "text-red-400",    icon: XCircle },
    shipped:   { color: "text-blue-400",   icon: ArrowRight },
    completed: { color: "text-green-400",  icon: CheckCircle },
  };

  return (
    <VendorLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-400" />
              {R ? "لوحة تحكم المتجر" : "Vendor Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "نظرة عامة على متجرك ومحفظتك" : "Overview of your store and wallet"}</p>
          </div>
          {wallet?.is_frozen && (
            <Badge className="text-red-400 bg-red-500/10 border-red-500/20 gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />{R ? "المحفظة مجمدة" : "Wallet Frozen"}
            </Badge>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => (
            <Card key={k.label} className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}>
                  <k.icon className={cn("w-5 h-5", k.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className={cn("text-lg font-display font-bold", k.color)}>{loading ? "…" : k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: R ? "إدارة المنتجات" : "Manage Products", icon: Package, path: "/vendor/products", color: "text-indigo-400" },
            { label: R ? "عرض المحفظة" : "View Wallet",       icon: Wallet,  path: "/vendor/wallet",   color: "text-green-400" },
            { label: R ? "تقارير المبيعات" : "Sales Reports",  icon: BarChart3,path:"/vendor/analytics", color: "text-orange-400" },
            { label: R ? "المراجعات" : "Reviews",              icon: Star,    path: "/vendor/reviews",  color: "text-yellow-400" },
          ].map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-orange-500/20 bg-background hover:bg-orange-500/5 transition-all text-left group">
              <a.icon className={cn("w-5 h-5 shrink-0", a.color)} />
              <span className="text-xs font-medium">{a.label}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto group-hover:text-orange-400 transition-colors" />
            </button>
          ))}
        </div>

        {/* Wallet summary */}
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-orange-400" />
                {R ? "ملخص المحفظة" : "Wallet Summary"}
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/vendor/wallet")} className="text-[10px] h-7 gap-1">
                {R ? "تفاصيل" : "Details"}<ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-display font-black text-green-400">${((wallet?.balance_cents ?? 0) / 100).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{R ? "متاح للسحب" : "Available"}</p>
              </div>
              <div>
                <p className="text-xl font-display font-black text-yellow-400">${((wallet?.pending_cents ?? 0) / 100).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{R ? "قيد المعالجة" : "Pending"}</p>
              </div>
              <div>
                <p className="text-xl font-display font-black text-orange-400">${((wallet?.total_earned_cents ?? 0) / 100).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{R ? "إجمالي الإيرادات" : "Total Earned"}</p>
              </div>
              <div>
                <p className="text-xl font-display font-black text-red-400">${((wallet?.total_fees_cents ?? 0) / 100).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{R ? "رسوم المنصة (10%)" : "Platform Fees (10%)"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent orders placeholder */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-400" />
                {R ? "الطلبات الأخيرة" : "Recent Orders"}
              </h3>
            </div>
            <div className="text-center py-8 text-muted-foreground text-sm">
              {R ? "سيتم عرض الطلبات هنا بعد تفعيل نظام المتجر بالكامل" : "Orders will appear here after the store system is fully activated"}
            </div>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
