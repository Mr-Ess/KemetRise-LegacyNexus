import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MarketingLayout from "@/layouts/MarketingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Megaphone, TrendingUp, Users, Target, BarChart3,
  ArrowRight, CheckCircle, Clock, XCircle, Plus,
  Mail, MousePointerClick, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget?: number;
  spent?: number;
  impressions: number;
  clicks: number;
  conversions: number;
  start_date?: string;
  end_date?: string;
}

interface LeadSummary {
  total: number;
  new: number;
  won: number;
  lost: number;
}

export default function MarketingDashboard() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const db = supabase as any;
  const R = i18n.language === "ar";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<LeadSummary>({ total: 0, new: 0, won: 0, lost: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: camps }, { data: leadData }] = await Promise.all([
        db.from("marketing_campaigns").select("*").eq("created_by", user.id).order("created_at", { ascending: false }).limit(8),
        db.from("marketing_leads").select("status").eq("assigned_to", user.id),
      ]);
      setCampaigns(camps || []);
      const ls = (leadData || []) as { status: string }[];
      setLeads({
        total: ls.length,
        new: ls.filter(l => l.status === "new").length,
        won: ls.filter(l => l.status === "won").length,
        lost: ls.filter(l => l.status === "lost").length,
      });
      setLoading(false);
    })();
  }, [user]);

  const kpis = [
    { label: R ? "إجمالي العملاء المحتملين" : "Total Leads",    value: leads.total,                                                   icon: Users,           color: "text-pink-400",   bg: "bg-pink-500/10" },
    { label: R ? "عملاء جدد" : "New Leads",                      value: leads.new,                                                     icon: Plus,            color: "text-blue-400",   bg: "bg-blue-500/10" },
    { label: R ? "صفقات مُغلقة" : "Won Deals",                   value: leads.won,                                                     icon: CheckCircle,     color: "text-green-400",  bg: "bg-green-500/10" },
    { label: R ? "معدل التحويل" : "Conversion Rate",             value: leads.total ? `${Math.round((leads.won / leads.total) * 100)}%` : "0%", icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  const statusConfig: Record<string, { color: string; labelAr: string }> = {
    draft:    { color: "text-muted-foreground", labelAr: "مسودة"    },
    active:   { color: "text-green-400",        labelAr: "نشطة"     },
    paused:   { color: "text-yellow-400",       labelAr: "متوقفة"   },
    ended:    { color: "text-red-400",          labelAr: "منتهية"   },
    scheduled:{ color: "text-blue-400",         labelAr: "مجدولة"   },
  };

  const typeIcons: Record<string, typeof Megaphone> = {
    email: Mail, social: Megaphone, ads: MousePointerClick, referral: Users,
  };

  const ctr = (camp: Campaign) => camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(1) + "%" : "—";
  const roi  = (camp: Campaign) => camp.spent && camp.spent > 0 ? ((camp.conversions * 50 - camp.spent) / camp.spent * 100).toFixed(0) + "%" : "—";

  return (
    <MarketingLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-pink-400" />
              {R ? "مركز التسويق" : "Marketing Hub"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "حملاتك وخط أنابيب العملاء المحتملين" : "Your campaigns and leads pipeline"}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/marketing/leads")} className="gap-1.5 text-xs">
              <Target className="w-3.5 h-3.5" />{R ? "خط العملاء" : "Pipeline"}
            </Button>
            <Button size="sm" onClick={() => navigate("/marketing/campaigns/new")} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />{R ? "حملة جديدة" : "New Campaign"}
            </Button>
          </div>
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
                  <p className={cn("text-xl font-display font-bold", k.color)}>{loading ? "…" : k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: R ? "خط أنابيب العملاء" : "Leads Pipeline", icon: Target,   path: "/marketing/leads",     color: "text-pink-400"   },
            { label: R ? "كل الحملات" : "All Campaigns",          icon: Megaphone,path: "/marketing/campaigns", color: "text-indigo-400" },
            { label: R ? "تقارير الأداء" : "Performance Reports", icon: BarChart3,path: "/marketing/analytics", color: "text-orange-400" },
            { label: R ? "روابط الإحالة" : "Referral Links",      icon: Users,    path: "/marketing/referrals", color: "text-blue-400"   },
          ].map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-pink-500/20 bg-background hover:bg-pink-500/5 transition-all text-left group">
              <a.icon className={cn("w-5 h-5 shrink-0", a.color)} />
              <span className="text-xs font-medium">{a.label}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto group-hover:text-pink-400 transition-colors" />
            </button>
          ))}
        </div>

        {/* Campaigns table */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-pink-400" />{R ? "الحملات الأخيرة" : "Recent Campaigns"}
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/marketing/campaigns")} className="text-[10px] h-7">
                {R ? "كل الحملات" : "View All"}
              </Button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/10">
                  <th className="text-left px-4 py-2.5 text-muted-foreground">{R ? "الحملة" : "Campaign"}</th>
                  <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "النوع" : "Type"}</th>
                  <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "الحالة" : "Status"}</th>
                  <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "الانطباعات" : "Impressions"}</th>
                  <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "نسبة النقر" : "CTR"}</th>
                  <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "الميزانية" : "Budget"}</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">{R ? "لا توجد حملات بعد" : "No campaigns yet"}</td></tr>
                ) : campaigns.map(c => {
                  const TypeIcon = typeIcons[c.type] || Megaphone;
                  const s = statusConfig[c.status] || statusConfig.draft;
                  return (
                    <tr key={c.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{c.name}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TypeIcon className="w-3.5 h-3.5 text-pink-400" />
                          <span className="capitalize">{c.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center"><Badge className={cn("text-[9px] px-1.5", s.color)}>{R ? s.labelAr : c.status}</Badge></td>
                      <td className="px-4 py-2.5 text-center">{c.impressions?.toLocaleString() || 0}</td>
                      <td className="px-4 py-2.5 text-center">{ctr(c)}</td>
                      <td className="px-4 py-2.5 text-center">{c.budget ? `$${c.budget}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </MarketingLayout>
  );
}
