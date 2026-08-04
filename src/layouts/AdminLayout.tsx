import { useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRole } from "@/context/UserRoleContext";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, Store, ShoppingBag, CreditCard, BarChart3,
  Settings, LogOut, Menu, Bell, Shield, Cpu, Layers, FileText,
  DollarSign, Package, UserCheck, Building2, Globe, Key, Tag,
  Boxes, RefreshCw, ChevronDown, Sun, Moon, Languages, Crown,
  AlertTriangle, Activity, Webhook, Code, Newspaper, Sparkles, Factory,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV_ITEMS = [
  { group: "Core", items: [
    { icon: LayoutDashboard, label: "لوحة التحكم",    labelEn: "Dashboard",         path: "/admin"                  },
    { icon: BarChart3,       label: "التحليلات",       labelEn: "Analytics",         path: "/admin/analytics"        },
    { icon: Cpu,             label: "القيادة المركزية",labelEn: "Executive Cockpit", path: "/cockpit"                },
    { icon: Layers,          label: "القطاعات",        labelEn: "Sectors",           path: "/admin/sectors"          },
    { icon: Activity,        label: "المراقبة الآنية", labelEn: "Live Monitor",      path: "/admin/monitor"          },
    { icon: Cpu,             label: "ERP",             labelEn: "ERP Cockpit",       path: "/erp"                    },
    { icon: Sparkles,        label: "لوحة تحكم الإيجنت",labelEn: "AI Agent Control",  path: "/admin/ai-agent"         },
    { icon: Factory,         label: "مصنع المنتجات الذكي",labelEn: "AI Product Factory", path: "/admin/ai-factory"     },
  ]},
  { group: "Users & Providers", items: [
    { icon: Users,     label: "المستخدمون",      labelEn: "Users",             path: "/admin/users"            },
    { icon: UserCheck, label: "مزودو الخدمة",   labelEn: "Providers",         path: "/admin/providers"        },
    { icon: Building2, label: "العلامات التجارية",labelEn: "Brands",           path: "/brands"                 },
    { icon: Shield,    label: "الأدوار والصلاحيات",labelEn: "Roles & Perms",   path: "/permissions"            },
  ]},
  { group: "Commerce", items: [
    { icon: Store,       label: "المنتجات",      labelEn: "Products",          path: "/products"              },
    { icon: ShoppingBag, label: "الطلبات",        labelEn: "Orders",            path: "/admin/orders"           },
    { icon: Tag,         label: "الكوبونات",      labelEn: "Coupons",           path: "/admin/coupons"          },
    { icon: Package,     label: "المخزون",         labelEn: "Inventory",        path: "/operations"             },
  ]},
  { group: "Finance", items: [
    { icon: DollarSign,  label: "التقارير المالية",labelEn: "Financial Hub",    path: "/admin/finance"          },
    { icon: CreditCard,  label: "بوابات الدفع",   labelEn: "Payment Gateways", path: "/payment-gateways"       },
    { icon: BarChart3,   label: "الإيرادات",       labelEn: "Revenue",          path: "/finance-analytics"      },
    { icon: RefreshCw,   label: "المستردات",       labelEn: "Refunds",          path: "/admin/refunds"          },
  ]},
  { group: "System", items: [
    { icon: Bell,     label: "الإشعارات",    labelEn: "Notifications",   path: "/notifications"          },
    { icon: FileText, label: "سجلات النظام", labelEn: "System Logs",     path: "/audit-logs"             },
    { icon: Key,      label: "الأمان",       labelEn: "Security",        path: "/security/sessions"      },
    { icon: Webhook,  label: "الـ API",      labelEn: "API & Webhooks",  path: "/api-docs"               },
    { icon: Code,     label: "المطورون",     labelEn: "Developer Hub",   path: "/api-docs"               },
    { icon: Globe,    label: "الواجهات",     labelEn: "White Label",          path: "/white-label"            },
    { icon: Globe,    label: "خدمات الموقع", labelEn: "Website Services",      path: "/admin/website-services" },
  ]},
  { group: "Website CMS", items: [
    { icon: Globe,       label: "إدارة الموقع",      labelEn: "Website CMS",          path: "/admin/website?tab=landing"      },
    { icon: FileText,    label: "الصفحة الرئيسية",   labelEn: "Hero & Stats",         path: "/admin/website?tab=landing"      },
    { icon: Layers,      label: "الخدمات والمنتجات",  labelEn: "Services & Products",  path: "/admin/website?tab=services"     },
    { icon: Users,       label: "الشهادات والأسئلة",  labelEn: "Testimonials & FAQs",  path: "/admin/website?tab=testimonials" },
    { icon: Newspaper,   label: "الأخبار والتواصل",   labelEn: "News & Contact",       path: "/admin/website?tab=news"         },
    { icon: Globe,       label: "الفوتر والروابط",    labelEn: "Footer & Links",       path: "/admin/website?tab=footer"       },
  ]},
];

interface Props { children: ReactNode; }

export default function AdminLayout({ children }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isAdmin } = useRole();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Core: true });
  const isRTL = i18n.language === "ar";

  const toggleGroup = (group: string) =>
    setExpandedGroups(p => ({ ...p, [group]: !p[group] }));

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    toast.success("تم تسجيل الخروج");
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className={cn("flex h-screen bg-background overflow-hidden", isRTL && "rtl")}>
      {/* Sidebar */}
      <aside className={cn(
        "h-screen bg-sidebar border-border flex flex-col shrink-0 transition-all duration-300",
        collapsed ? "w-14 border-r" : "w-56 border-r",
        isRTL && !collapsed && "border-r-0 border-l"
      )}>
        {/* Logo */}
        <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="font-display text-xs font-bold text-primary tracking-widest">ADMIN</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors ml-auto">
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Profile strip */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{profile?.full_name || "Admin"}</p>
              <Badge className="text-[8px] px-1 py-0 bg-primary/20 text-primary border-primary/40">ADMIN</Badge>
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
                  {isRTL ? (group === "Core" ? "أساسي" : group === "Finance" ? "المالية" : group === "Commerce" ? "التجارة" : group === "System" ? "النظام" : group) : group}
                  {expandedGroups[group] ? <ChevronDown className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 -rotate-90" />}
                </button>
              )}
              {(collapsed || expandedGroups[group] !== false) && items.map(item => (
                <button
                  key={item.path + item.label}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all",
                    isActive(item.path)
                      ? "bg-primary/15 text-primary font-semibold"
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
          <button onClick={() => navigate("/settings")}
            className={cn("w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all")}>
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-12 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {isRTL ? "لوحة تحكم الإدارة" : "Admin Control Panel"}
            </span>
            <Badge className="text-[9px] px-1.5 py-0 bg-red-500/20 text-red-400 border-red-500/40">
              {isRTL ? "مدير النظام" : "System Admin"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors text-xs"
              title={isRTL ? "العودة للموقع" : "Back to Site"}
            >
              <Globe className="w-3.5 h-3.5" />
              {isRTL ? "الموقع" : "Site"}
            </button>
            <button
              onClick={() => i18n.changeLanguage(isRTL ? "en" : "ar")}
              className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle Language"
            >
              <Languages className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/notifications")}
              className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/settings")}
              className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
