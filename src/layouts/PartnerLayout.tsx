import { useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRole } from "@/context/UserRoleContext";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Building2, BarChart3, Settings, LogOut,
  Menu, Bell, Languages, ChevronDown, Users, FileText,
  Layers, DollarSign, Globe, Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { group: "main",     ar: "الرئيسية",  en: "Main",     items: [
    { icon: LayoutDashboard, ar: "لوحتي",         en: "Dashboard",    path: "/partner" },
    { icon: BarChart3,       ar: "التحليلات",     en: "Analytics",    path: "/partner/analytics" },
  ]},
  { group: "workspace", ar: "بيئة العمل", en: "Workspace", items: [
    { icon: Building2,  ar: "علاماتي التجارية", en: "My Brands",    path: "/partner/brands" },
    { icon: Users,      ar: "الموظفون",         en: "Staff",        path: "/partner/staff" },
    { icon: Layers,     ar: "القطاعات",         en: "Sectors",      path: "/partner/sectors" },
    { icon: Briefcase,  ar: "العمليات",          en: "Operations",   path: "/partner/operations" },
  ]},
  { group: "finance",  ar: "المالية",   en: "Finance",  items: [
    { icon: DollarSign, ar: "الإيرادات",  en: "Revenue",    path: "/partner/revenue" },
    { icon: FileText,   ar: "التقارير",   en: "Reports",    path: "/partner/reports" },
  ]},
  { group: "settings", ar: "الإعدادات", en: "Settings", items: [
    { icon: Globe,      ar: "الإعدادات العامة", en: "Workspace Settings", path: "/partner/settings" },
  ]},
];

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useRole();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ main: true, workspace: true });
  const R = i18n.language === "ar";

  const active = (p: string) => location.pathname === p || location.pathname.startsWith(p + "/");
  const signout = async () => { await signOut(); navigate("/auth"); toast.success("تم تسجيل الخروج"); };

  return (
    <div className={cn("flex h-screen bg-background overflow-hidden", R && "rtl")}>
      <aside className={cn("h-screen bg-sidebar border-border flex flex-col shrink-0 transition-all duration-300 border-r", collapsed ? "w-14" : "w-56")}>
        {/* Logo */}
        <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
          {!collapsed && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /><span className="font-display text-xs font-bold text-indigo-400 tracking-widest">{R ? "شريك" : "PARTNER"}</span></div>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md hover:bg-secondary transition-colors ml-auto"><Menu className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        {/* Profile */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0">{profile?.full_name?.charAt(0)?.toUpperCase() || "P"}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{profile?.full_name}</p>
              <Badge className="text-[8px] px-1 py-0 bg-indigo-500/20 text-indigo-400 border-indigo-500/40">PARTNER</Badge>
            </div>
          </div>
        )}
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {NAV.map(({ group, ar, en, items }) => (
            <div key={group}>
              {!collapsed && (
                <button onClick={() => setOpen(p => ({ ...p, [group]: !p[group] }))}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground">
                  {R ? ar : en}<ChevronDown className={cn("w-3 h-3 transition-transform", !open[group] && "-rotate-90")} />
                </button>
              )}
              {(collapsed || open[group] !== false) && items.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className={cn("w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all", active(item.path) ? "bg-indigo-500/15 text-indigo-400 font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}
                  title={collapsed ? (R ? item.ar : item.en) : undefined}>
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  {!collapsed && <span className="truncate">{R ? item.ar : item.en}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {/* Footer */}
        <div className="border-t border-border py-2 px-1.5 space-y-0.5 shrink-0">
          <button onClick={() => navigate("/partner/settings")} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"><Settings className="w-3.5 h-3.5 shrink-0" />{!collapsed && <span>{R ? "الإعدادات" : "Settings"}</span>}</button>
          <button onClick={signout} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-red-400 hover:bg-red-500/10 transition-all"><LogOut className="w-3.5 h-3.5 shrink-0" />{!collapsed && <span>{R ? "خروج" : "Sign Out"}</span>}</button>
        </div>
      </aside>
      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
          <span className="text-xs text-muted-foreground">{R ? "بوابة الشركاء" : "Partner Gateway"}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors text-xs"><Globe className="w-3.5 h-3.5" />{R ? "الموقع" : "Site"}</button>
            <button onClick={() => i18n.changeLanguage(R ? "en" : "ar")} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"><Languages className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"><Bell className="w-4 h-4" /></button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
