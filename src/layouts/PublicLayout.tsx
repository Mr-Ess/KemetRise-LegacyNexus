import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import {
  Globe, Menu, X, ShoppingCart, User, Languages, Sun, Moon,
  ChevronDown, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const PUBLIC_NAV = [
  { ar: "الرئيسية",   en: "Home",        href: "/" },
  { ar: "من نحن",    en: "About Us",     href: "/about" },
  { ar: "خدماتنا",   en: "Services",     href: "/services" },
  { ar: "المنتجات",  en: "Products",     href: "/products" },
  { ar: "الأسعار",   en: "Pricing",      href: "/pricing" },
  { ar: "المدونة",   en: "Blog",         href: "/blog" },
  { ar: "تواصل معنا", en: "Contact",     href: "/contact" },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const R = i18n.language === "ar";

  return (
    <div className={cn("min-h-screen bg-background text-foreground", R && "rtl")}>
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-display text-base font-black text-primary tracking-widest">KemetRise</span>
          </button>
          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {PUBLIC_NAV.map(n => (
              <button key={n.href} onClick={() => navigate(n.href)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-lg transition-all">
                {R ? n.ar : n.en}
              </button>
            ))}
          </nav>
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => i18n.changeLanguage(R ? "en" : "ar")}
              className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              <Languages className="w-4 h-4" />
            </button>
            {user ? (
              <Button size="sm" onClick={() => navigate("/portal")} className="gap-2 text-xs">
                {R ? "لوحة التحكم" : "Dashboard"} <ArrowRight className="w-3 h-3" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs hidden sm:flex">
                  {R ? "تسجيل الدخول" : "Sign In"}
                </Button>
                <Button size="sm" onClick={() => navigate("/auth?tab=signup")} className="text-xs gap-1">
                  {R ? "ابدأ مجاناً" : "Get Started"} <ArrowRight className="w-3 h-3" />
                </Button>
              </>
            )}
            {/* Mobile toggle */}
            <button className="lg:hidden p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 py-3 px-4">
            {PUBLIC_NAV.map(n => (
              <button key={n.href} onClick={() => { navigate(n.href); setMobileOpen(false); }}
                className="w-full text-left py-2.5 px-3 text-sm rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
                {R ? n.ar : n.en}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-sidebar/30 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <span className="font-display text-sm font-black text-primary tracking-widest">KemetRise</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {R ? "منصة موحدة للنظام متعدد المستأجرين — تمكين الأعمال من الإدارة الكاملة." : "Unified multi-tenant SaaS platform empowering businesses with complete management."}
              </p>
            </div>
            {[
              { title: R ? "المنصة" : "Platform",  links: [{ l: R ? "السوق" : "Marketplace", h: "/" }, { l: R ? "الأسعار" : "Pricing", h: "/pricing" }, { l: "API", h: "/api-docs" }] },
              { title: R ? "الشركة" : "Company",   links: [{ l: R ? "من نحن" : "About", h: "/about" }, { l: R ? "المدونة" : "Blog", h: "/blog" }, { l: R ? "اتصل بنا" : "Contact", h: "/contact" }] },
              { title: R ? "القانونية" : "Legal",  links: [{ l: R ? "الخصوصية" : "Privacy", h: "/privacy" }, { l: R ? "الشروط" : "Terms", h: "/terms" }] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(lnk => <li key={lnk.h}><button onClick={() => navigate(lnk.h)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{lnk.l}</button></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} KemetRise: Legacy Nexus. {R ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
