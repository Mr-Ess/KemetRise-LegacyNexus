import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Globe, Menu, X, Languages, ArrowRight,
  Sun, Moon, ChevronDown, Layers, ShoppingBag,
  MessageSquare, BarChart3, Building2,
  Phone, Mail, MapPin, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEY = "kemet-theme";
function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (typeof window !== "undefined" && (localStorage.getItem(KEY) as any)) || "dark"
  );
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem(KEY, theme);
  }, [theme]);
  return { theme, toggle: () => setTheme(t => t === "dark" ? "light" : "dark") };
}

const NAV_ITEMS = [
  { ar: "الرئيسية",    en: "Home",      href: "/",         icon: Globe },
  { ar: "من نحن",     en: "About",      href: "/about",    icon: Building2 },
  { ar: "خدماتنا",    en: "Services",   href: "/services", icon: Layers },
  { ar: "المنتجات",   en: "Products",   href: "/products", icon: ShoppingBag },
  { ar: "السوق",      en: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { ar: "المول الرقمي",en: "Digital Mall",href: "/digital-mall",icon: Building2 },
  { ar: "الأسعار",    en: "Pricing",    href: "/pricing", icon: BarChart3 },
  { ar: "المدونة",    en: "Blog",       href: "/blog",     icon: MessageSquare },
  { ar: "تواصل معنا", en: "Contact",    href: "/contact",  icon: Phone },
];

const PORTAL_LINKS = [
  { ar: "الإدارة",    en: "Admin Portal",     href: "/admin",     color: "text-primary" },
  { ar: "الشريك",     en: "Partner Portal",   href: "/partner",   color: "text-indigo-400" },
  { ar: "الوكيل",     en: "Agent Portal",     href: "/agent",     color: "text-emerald-400" },
  { ar: "البائع",     en: "Vendor Portal",    href: "/vendor",    color: "text-orange-400" },
  { ar: "التسويق",    en: "Marketing Portal", href: "/marketing", color: "text-pink-400" },
  { ar: "المستخدم",   en: "User Portal",      href: "/portal",    color: "text-blue-400" },
  { ar: "AI Chat",    en: "AI Chat",          href: "/chat",      color: "text-cyan-400" },
];

const ROLE_PORTAL: Record<string, { ar: string; en: string; href: string; color: string }> = {
  superadmin: { ar: "الإدارة",    en: "Admin Portal",     href: "/admin",     color: "text-primary" },
  admin:      { ar: "الإدارة",    en: "Admin Portal",     href: "/admin",     color: "text-primary" },
  partner:    { ar: "الشريك",     en: "Partner Portal",   href: "/partner",   color: "text-indigo-400" },
  agent:      { ar: "الوكيل",     en: "Agent Portal",     href: "/agent",     color: "text-emerald-400" },
  vendor:     { ar: "البائع",     en: "Vendor Portal",    href: "/vendor",    color: "text-orange-400" },
  provider:   { ar: "البائع",     en: "Vendor Portal",    href: "/vendor",    color: "text-orange-400" },
  marketing:  { ar: "التسويق",    en: "Marketing Portal", href: "/marketing", color: "text-pink-400" },
  user:       { ar: "المستخدم",   en: "User Portal",      href: "/portal",    color: "text-blue-400" },
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const R = i18n.language === "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch user role when logged in
  useEffect(() => {
    if (!user) { setUserRole(null); return; }
    (supabase as any)
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }: any) => setUserRole(data?.role ?? "user"))
      .catch(() => setUserRole("user"));
  }, [user]);

  const portalLink = userRole ? ROLE_PORTAL[userRole] ?? ROLE_PORTAL.user : null;
  const dashHref = portalLink?.href ?? "/dashboard";

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href.split("#")[0]) && href.split("#")[0] !== "/";

  return (
    <div className={cn("min-h-screen bg-background text-foreground", R && "rtl")}>
      {/* Navbar */}
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/95 backdrop-blur-xl border-b border-border/60 shadow-sm" : "bg-background/70 backdrop-blur-md border-b border-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display text-sm font-black text-primary tracking-widest gold-text-glow">KemetRise</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_ITEMS.map(n => (
              <button key={n.href} onClick={() => navigate(n.href)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  isActive(n.href) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
                {R ? n.ar : n.en}
              </button>
            ))}
            {/* Portals dropdown — only for logged-in users */}
            {user && portalLink && (
              <div className="relative" onMouseEnter={() => setPortalOpen(true)} onMouseLeave={() => setPortalOpen(false)}>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all">
                  {R ? "البوابات" : "Portals"} <ChevronDown className={cn("w-3 h-3 transition-transform", portalOpen && "rotate-180")} />
                </button>
                {portalOpen && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-background/98 backdrop-blur-xl border border-border rounded-xl shadow-xl overflow-hidden">
                    {/* My portal */}
                    <button onClick={() => { navigate(portalLink.href); setPortalOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-secondary/50 transition-colors text-left">
                      <div className={cn("w-1.5 h-1.5 rounded-full bg-current", portalLink.color)} />
                      <span className={portalLink.color}>{R ? portalLink.ar : portalLink.en}</span>
                    </button>
                    {/* Central dashboard */}
                    <button onClick={() => { navigate("/dashboard"); setPortalOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-secondary/50 transition-colors text-left border-t border-border/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-current text-primary" />
                      <span className="text-primary">{R ? "لوحة التحكم المركزية" : "Central Dashboard"}</span>
                    </button>
                    {/* AI Chat always available */}
                    <button onClick={() => { navigate("/chat"); setPortalOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-secondary/50 transition-colors text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-current text-cyan-400" />
                      <span className="text-cyan-400">{R ? "AI Chat" : "AI Chat"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => i18n.changeLanguage(R ? "en" : "ar")}
              className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <Languages className="w-4 h-4" />
            </button>
            {user ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <Button size="sm" onClick={() => navigate(dashHref)} className="gap-1.5 text-xs h-8 px-4 gold-glow">
                  {R ? (portalLink ? portalLink.ar : "لوحة التحكم") : (portalLink ? portalLink.en : "Dashboard")} <ArrowRight className="w-3 h-3" />
                </Button>
                <button onClick={signOut} title={R ? "تسجيل خروج" : "Sign out"}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs h-8 px-3 hidden sm:flex">{R ? "دخول" : "Sign In"}</Button>
                <Button size="sm" onClick={() => navigate("/auth?tab=signup")} className="text-xs h-8 px-4 hidden sm:flex gold-glow">{R ? "ابدأ مجاناً" : "Get Started"}</Button>
              </>
            )}
            <button className="lg:hidden p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-background/98 backdrop-blur-xl py-4 px-4">
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[...NAV_ITEMS, ...PORTAL_LINKS.slice(0, 4)].map(n => (
                <button key={n.href} onClick={() => { navigate(n.href); setMobileOpen(false); }}
                  className={cn("flex items-center gap-2 py-2.5 px-3 text-xs rounded-xl transition-all", "hover:bg-secondary/50 text-muted-foreground hover:text-foreground")}>
                  {"icon" in n && <n.icon className="w-3.5 h-3.5" />}
                  {R ? n.ar : n.en}
                </button>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex gap-2">
              {user ? (
                <Button size="sm" onClick={() => { navigate("/portal"); setMobileOpen(false); }} className="flex-1 text-xs">{R ? "لوحة التحكم" : "Dashboard"}</Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => { navigate("/auth"); setMobileOpen(false); }} className="flex-1 text-xs">{R ? "دخول" : "Sign In"}</Button>
                  <Button size="sm" onClick={() => { navigate("/auth?tab=signup"); setMobileOpen(false); }} className="flex-1 text-xs">{R ? "ابدأ" : "Start"}</Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-sidebar/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display text-sm font-black text-primary tracking-widest">KemetRise</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5 max-w-xs">
                {R ? "منصة SaaS + ERP موحدة تجمع ثمانية بوابات في نظام واحد متكامل." : "Unified SaaS + ERP platform uniting eight portals in one integrated system."}
              </p>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /><span>+20 100 000 0000</span></div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary" /><span>support@kemetrise.com</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /><span>{R ? "القاهرة، مصر" : "Cairo, Egypt"}</span></div>
              </div>
            </div>
            {[
              { title: R ? "المنصة" : "Platform", links: [
                { l: R ? "الرئيسية" : "Home", h: "/" },
                { l: R ? "المنتجات" : "Products", h: "/products" },
                { l: R ? "الأسعار" : "Pricing", h: "/pricing" },
                { l: "API", h: "/api-docs" },
              ]},
              { title: R ? "الشركة" : "Company", links: [
                { l: R ? "من نحن" : "About Us", h: "/about" },
                { l: R ? "المدونة" : "Blog", h: "/blog" },
                { l: R ? "اتصل بنا" : "Contact", h: "/contact" },
                { l: R ? "الشركاء" : "Partners", h: "/auth?tab=signup" },
              ]},
              { title: R ? "البوابات" : "Portals", links: PORTAL_LINKS.map(p => ({ l: R ? p.ar : p.en, h: p.href })) },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold mb-3 uppercase tracking-widest text-foreground/70">{col.title}</h4>
                <ul className="space-y-1.5">
                  {col.links.map(lnk => (
                    <li key={lnk.h}>
                      <button onClick={() => navigate(lnk.h)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{lnk.l}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border/40 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} KemetRise: Legacy Nexus. {R ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">{R ? "الخصوصية" : "Privacy"}</button>
              <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">{R ? "الشروط" : "Terms"}</button>
              <button onClick={toggle} className="flex items-center gap-1 hover:text-foreground transition-colors">
                {theme === "dark" ? <><Sun className="w-3 h-3" /> {R ? "مضيء" : "Light"}</> : <><Moon className="w-3 h-3" /> {R ? "مظلم" : "Dark"}</>}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
