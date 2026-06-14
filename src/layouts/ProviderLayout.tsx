import { useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRole } from "@/context/UserRoleContext";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Package, ShoppingBag, BarChart3, DollarSign,
  Settings, LogOut, Menu, Bell, Store, Star, MessageSquare,
  FileText, TrendingUp, Users, Languages, Briefcase, ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV_ITEMS = [
  { group: "overview", items: [
    { icon: LayoutDashboard, label: "لوحتي", labelEn: "My Dashboard", path: "/provider" },
    { icon: TrendingUp, label: "الإحصائيات", labelEn: "Analytics", path: "/provider/analytics" },
  ]},
  { group: "commerce", items: [
    { icon: Package,     label: "منتجاتي",    labelEn: "My Listings",  path: "/provider/listings"   },
    { icon: ShoppingBag, label: "الطلبات",    labelEn: "Orders",       path: "/provider/orders"     },
    { icon: DollarSign,  label: "الإيرادات",  labelEn: "Revenue",      path: "/provider/revenue"    },
    { icon: FileText,    label: "الفواتير",   labelEn: "Invoices",     path: "/provider/invoices"   },
  ]},
  { group: "customers", items: [
    { icon: Users,       label: "العملاء",    labelEn: "Customers",    path: "/provider/customers"  },
    { icon: MessageSquare,label: "الرسائل",  labelEn: "Messages",     path: "/provider/messages"   },
    { icon: Star,        label: "التقييمات", labelEn: "Reviews",       path: "/provider/reviews"    },
  ]},
  { group: "store", items: [
    { icon: Store,    label: "متجري",          labelEn: "My Store",     path: "/provider/store"      },
    { icon: Briefcase,label: "الملف التجاري", labelEn: "Business Profile", path: "/provider/profile" },
  ]},
];

interface Props { children: ReactNode; }

export default function ProviderLayout({ children }: Props) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, providerProfile } = useRole();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ overview: true, commerce: true });
  const isRTL = i18n.language === "ar";

  const toggleGroup = (g: string) => setExpanded(p => ({ ...p, [g]: !p[g] }));
  const isActive = (p: string) => location.pathname === p || location.pathname.startsWith(p + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    toast.success("تم تسجيل الخروج");
  };

  const groupLabels: Record<string, [string, string]> = {
    overview: ["نظرة عامة", "Overview"],
    commerce: ["التجارة", "Commerce"],
    customers: ["العملاء", "Customers"],
    store: ["المتجر", "Store"],
  };

  return (
    <div className={cn("flex h-screen bg-background overflow-hidden", isRTL && "rtl")}>
      {/* Sidebar */}
      <aside className={cn(
        "h-screen bg-sidebar border-border flex flex-col shrink-0 transition-all duration-300",
        collapsed ? "w-14 border-r" : "w-56 border-r",
      )}>
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-400" />
              <span className="font-display text-xs font-bold text-blue-400 tracking-widest">
                {isRTL ? "مزود" : "PROVIDER"}
              </span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors ml-auto">
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Provider info */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">
                {providerProfile?.business_name?.charAt(0)?.toUpperCase() || profile?.full_name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{providerProfile?.business_name || profile?.full_name || "Provider"}</p>
                <Badge className={cn(
                  "text-[8px] px-1 py-0 border",
                  providerProfile?.is_approved
                    ? "bg-green-500/20 text-green-400 border-green-500/40"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                )}>
                  {providerProfile?.is_approved ? (isRTL ? "معتمد" : "Approved") : (isRTL ? "قيد المراجعة" : "Pending")}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {NAV_ITEMS.map(({ group, items }) => (
            <div key={group}>
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                >
                  {isRTL ? groupLabels[group][0] : groupLabels[group][1]}
                  <ChevronDown className={cn("w-3 h-3 transition-transform", !expanded[group] && "-rotate-90")} />
                </button>
              )}
              {(collapsed || expanded[group] !== false) && items.map(item => (
                <button key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all",
                    isActive(item.path)
                      ? "bg-blue-500/15 text-blue-400 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                  title={collapsed ? (isRTL ? item.label : item.labelEn) : undefined}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  {!collapsed && <span className="truncate">{isRTL ? item.label : item.labelEn}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border py-2 px-1.5 space-y-0.5 shrink-0">
          <button onClick={() => navigate("/provider/settings")}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
            <Settings className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>{isRTL ? "الإعدادات" : "Settings"}</span>}
          </button>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>{isRTL ? "تسجيل الخروج" : "Sign Out"}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
          <span className="text-xs text-muted-foreground">{isRTL ? "بوابة مزود الخدمة" : "Provider Portal"}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => i18n.changeLanguage(isRTL ? "en" : "ar")}
              className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <Languages className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
