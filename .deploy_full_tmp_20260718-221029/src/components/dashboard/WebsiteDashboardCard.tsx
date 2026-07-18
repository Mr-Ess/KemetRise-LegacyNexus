import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Globe, Layers, Package, Briefcase, Users, Star, Newspaper,
  MessageSquare, HelpCircle, ArrowRight, CheckCircle, BarChart3,
  RefreshCw,
} from "lucide-react";

const db = supabase as any;

interface SectionStat {
  icon: React.ElementType;
  labelAr: string;
  labelEn: string;
  table: string;
  path: string;
  color: string;
}

const SECTIONS: SectionStat[] = [
  { icon: Layers,        labelAr: "الخدمات",          labelEn: "Services",      table: "website_services",      path: "/admin/website", color: "#f59e0b"  },
  { icon: Package,       labelAr: "المنتجات",          labelEn: "Products",      table: "website_products",      path: "/admin/website", color: "#3b82f6"  },
  { icon: Briefcase,     labelAr: "المشاريع",          labelEn: "Projects",      table: "website_projects",      path: "/admin/website", color: "#10b981"  },
  { icon: Users,         labelAr: "الوكلاء",           labelEn: "Agents",        table: "website_agents",        path: "/admin/website", color: "#8b5cf6"  },
  { icon: CheckCircle,   labelAr: "الشركاء",           labelEn: "Partners",      table: "website_partners",      path: "/admin/website", color: "#06b6d4"  },
  { icon: Star,          labelAr: "آراء العملاء",      labelEn: "Testimonials",  table: "website_testimonials",  path: "/admin/website", color: "#ec4899"  },
  { icon: HelpCircle,    labelAr: "الأسئلة الشائعة",  labelEn: "FAQs",          table: "website_faqs",          path: "/admin/website", color: "#f97316"  },
  { icon: Newspaper,     labelAr: "الأخبار",           labelEn: "News",          table: "website_news",          path: "/admin/website", color: "#84cc16"  },
  { icon: MessageSquare, labelAr: "طلبات التواصل",    labelEn: "Contact Leads", table: "website_contact_submissions", path: "/admin/website", color: "#ef4444" },
];

export default function WebsiteDashboardCard() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newLeads, setNewLeads] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        SECTIONS.map(s => db.from(s.table).select("*", { count: "exact", head: true }))
      );
      const c: Record<string, number> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") c[SECTIONS[i].table] = r.value.count ?? 0;
      });
      setCounts(c);

      // New contact submissions
      const { count: nl } = await db
        .from("website_contact_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");
      setNewLeads(nl ?? 0);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-secondary/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Globe className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{R ? "لوحة إدارة الموقع" : "Website Management"}</h3>
            <p className="text-[10px] text-muted-foreground">{R ? "كل محتوى الموقع العام" : "All public website content"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newLeads > 0 && (
            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
              {newLeads} {R ? "طلب جديد" : "new leads"}
            </Badge>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" className="gap-1.5 text-xs h-7 gold-glow" onClick={() => navigate("/admin/website")}>
            <Globe className="w-3 h-3" />{R ? "فتح CMS" : "Open CMS"}
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-0 divide-x divide-border/30 rtl:divide-x-reverse">
        {SECTIONS.map(s => (
          <button key={s.table} onClick={() => navigate("/admin/website")}
            className="flex flex-col items-center gap-1 py-4 px-2 hover:bg-secondary/20 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            </div>
            <span className="text-base font-black" style={{ color: s.color }}>
              {counts[s.table] ?? "–"}
            </span>
            <span className="text-[9px] text-muted-foreground text-center leading-tight">
              {R ? s.labelAr : s.labelEn}
            </span>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-border/40 bg-secondary/5">
        {[
          { labelAr: "الصفحة الرئيسية", labelEn: "Landing", href: "/" },
          { labelAr: "الخدمات", labelEn: "Services", href: "/services" },
          { labelAr: "المشاريع", labelEn: "Projects", href: "/our-projects" },
          { labelAr: "الوكلاء", labelEn: "Agents", href: "/our-agents" },
          { labelAr: "الشركاء", labelEn: "Partners", href: "/partners" },
          { labelAr: "الأخبار", labelEn: "News", href: "/news" },
        ].map(l => (
          <a key={l.href} href={l.href} target="_blank" rel="noreferrer"
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            {R ? l.labelAr : l.labelEn} <ArrowRight className="w-2.5 h-2.5" />
          </a>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">{R ? "افتح في تبويب جديد" : "Opens in new tab"}</span>
      </div>
    </div>
  );
}
