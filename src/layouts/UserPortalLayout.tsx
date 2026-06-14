import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRole } from "@/context/UserRoleContext";
import { useAuth } from "@/hooks/useAuth";
import {
  Home, ShoppingBag, CreditCard, Bell, Settings, LogOut,
  Heart, User, HelpCircle, FileText, Languages, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { icon: Home,        label: "الرئيسية",    labelEn: "Home",        path: "/portal"          },
  { icon: ShoppingBag, label: "مشترياتي",   labelEn: "My Orders",   path: "/portal/orders"   },
  { icon: Heart,       label: "المفضلة",    labelEn: "Wishlist",    path: "/portal/wishlist" },
  { icon: CreditCard,  label: "الفواتير",   labelEn: "Invoices",    path: "/portal/invoices" },
  { icon: Star,        label: "تقييماتي",   labelEn: "My Reviews",  path: "/portal/reviews"  },
  { icon: User,        label: "حسابي",      labelEn: "Profile",     path: "/portal/profile"  },
  { icon: Bell,        label: "الإشعارات",  labelEn: "Notifications",path: "/notifications"  },
  { icon: HelpCircle,  label: "الدعم",      labelEn: "Support",     path: "/portal/support"  },
];

interface Props { children: ReactNode; }

export default function UserPortalLayout({ children }: Props) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useRole();
  const { signOut } = useAuth();
  const isRTL = i18n.language === "ar";

  const isActive = (p: string) => location.pathname === p;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    toast.success("تم تسجيل الخروج");
  };

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")}>
      {/* Top navbar */}
      <header className="sticky top-0 z-50 h-14 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4">
          {/* Logo */}
          <button onClick={() => navigate("/portal")} className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-primary tracking-widest">KemetRise</span>
          </button>

          {/* Navigation (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.slice(0, 5).map(item => (
              <button key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all",
                  isActive(item.path)
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}>
                <item.icon className="w-3.5 h-3.5" />
                <span>{isRTL ? item.label : item.labelEn}</span>
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => i18n.changeLanguage(isRTL ? "en" : "ar")}
              className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <Languages className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/notifications")}
              className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/portal/profile")}
              className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/30 transition-colors">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </button>
            <button onClick={handleSignOut}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around h-14 px-2">
        {NAV.slice(0, 5).map(item => (
          <button key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[9px] transition-all",
              isActive(item.path) ? "text-primary" : "text-muted-foreground"
            )}>
            <item.icon className="w-4 h-4" />
            <span>{isRTL ? item.label : item.labelEn}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}
