import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBrands } from "@/context/BrandsContext";
import {
  LayoutDashboard, Crown, Gem, Building2, Database, ShieldCheck,
  Briefcase, FolderOpen, Users, UserCheck, Handshake, Map, Scroll,
  GitBranch, Lock, Heart, AlertTriangle, ChevronDown, ChevronRight,
  Menu, Settings, LogOut, Plus, Search, Layers, Bell, FileText, BarChart3, Tag, RotateCcw, Webhook, Code, DollarSign,
  Store, Globe, Share2, Chrome, Shield, Package, Boxes, MessageCircle, Megaphone, Truck, ScrollText, Building, CreditCard, Palette, Plane, UserCircle, TrendingUp, BellRing, BookOpen, Mic, Video,
} from "lucide-react";

const iconMap: Record<string, any> = { Gem, Building2, Database, ShieldCheck };

const Sidebar = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brands } = useBrands();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Brands: true });
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = (label: string) => setExpanded(prev => ({ ...prev, [label]: !prev[label] }));

  type NavSection = {
    icon: any; label: string; path?: string;
    children?: { icon?: any; label: string; onClick?: () => void }[];
    addButton?: boolean; onAdd?: () => void;
  };

  const navSections: NavSection[] = [
    { icon: LayoutDashboard, label: t("dashboard"), path: "/" },
    { icon: Crown, label: "Brands Hub", path: "/brands" },
    { icon: Lock, label: t("digital_inheritance"), path: "/digital-inheritance" },
    { icon: Scroll, label: t("legendary_journey"), path: "/legendary-journey" },
    { icon: Store, label: "Marketplace", path: "/marketplace" },
    { icon: Layers, label: "Operations Hub", path: "/operations" },
    { icon: CreditCard, label: "Payment Gateways", path: "/payment-gateways" },
    { icon: FileText, label: "System Logs", path: "/audit-logs" },
    { icon: Mic, label: "Virtual Assistant", path: "/voice" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  

  const filteredSections = searchQuery
    ? navSections.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.children?.some(c => c.label.toLowerCase().includes(searchQuery.toLowerCase())))
    : navSections;

  if (collapsed) {
    return (
      <aside className="w-14 h-screen bg-sidebar border-r border-border flex flex-col shrink-0">
        <div className="p-2 border-b border-border flex justify-center">
          <button onClick={onToggle} className="p-2 rounded-md hover:bg-secondary transition-colors"><Menu className="w-5 h-5 text-primary" /></button>
        </div>
        <nav className="flex-1 py-2 space-y-1 px-1 overflow-y-auto">
          {navSections.map(item => (
            <button key={item.label} onClick={() => item.path ? navigate(item.path) : item.children && toggle(item.label)}
              className={`w-full flex items-center justify-center p-2.5 rounded-md transition-all ${
                item.path && location.pathname === item.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`} title={item.label}>
              <item.icon className="w-4 h-4" />
            </button>
          ))}
        </nav>
        <div className="border-t border-border py-2 px-1 space-y-1">
          <button onClick={() => navigate("/settings")} className="w-full flex items-center justify-center p-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary" title="Settings"><Settings className="w-4 h-4" /></button>
          <button className="w-full flex items-center justify-center p-2.5 rounded-md text-blood-red hover:bg-blood-red/10" title="Logout"><LogOut className="w-4 h-4" /></button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-52 h-screen bg-sidebar border-r border-border flex flex-col shrink-0">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="font-display text-[10px] font-bold text-primary tracking-widest">KEMETRISE</span>
        <button onClick={onToggle} className="p-1 rounded hover:bg-secondary transition-colors"><Menu className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Global Search */}
      <div className="px-2 py-2 border-b border-border/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..." className="w-full bg-secondary/50 border border-border rounded-md pl-8 pr-3 py-1.5 text-[11px] font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
        {filteredSections.map(item => (
          <div key={item.label}>
            <div className="flex items-center">
              <button
                onClick={() => item.path && !item.children ? navigate(item.path) : item.children && toggle(item.label)}
                className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all ${
                  item.path && location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}>
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="font-body font-medium text-sm flex-1 text-left">{item.label}</span>
                {item.children && (expanded[item.label] ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />)}
              </button>
              {item.addButton && (
                <button onClick={() => item.onAdd?.()} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title={`Add to ${item.label}`}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {item.children && expanded[item.label] && (
              <div className="ml-4 pl-3 border-l border-border/50 mt-0.5 space-y-0.5">
                {item.children
                  .filter(c => !searchQuery || c.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(child => (
                  <button key={child.label} onClick={() => child.onClick?.()}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                    {child.icon && <child.icon className="w-3.5 h-3.5" />}
                    <span className="font-body">{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-2 py-2 space-y-0.5">
        <button onClick={() => navigate("/settings")} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all ${location.pathname === "/settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
          <Settings className="w-4 h-4 shrink-0" /><span className="font-body font-medium text-sm">Settings</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-blood-red hover:bg-blood-red/10 transition-all">
          <LogOut className="w-4 h-4 shrink-0" /><span className="font-body font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
