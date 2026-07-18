import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, MessageSquare, Settings, Shield, Bell, Users,
  ShoppingBag, BarChart3, ChevronDown, ChevronUp, Search,
  LifeBuoy, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    cat: "account", catAr: "الحساب", icon: Users, color: "text-blue-400",
    items: [
      { q: "How do I change my password?", qAr: "كيف أغيّر كلمة المرور؟", a: "Go to Settings → Security tab, then click \"Change Password\".", aAr: "اذهب إلى الإعدادات → تبويب الأمان، ثم اضغط 'تغيير كلمة المرور'." },
      { q: "How do I enable two-factor authentication?", qAr: "كيف أفعّل التحقق الثنائي؟", a: "Settings → Security → Two-Factor Authentication → Enable and scan the QR code with your authenticator app.", aAr: "الإعدادات → الأمان → التحقق الثنائي → فعّل وامسح رمز QR." },
      { q: "Why is my account suspended?", qAr: "لماذا حسابي موقوف؟", a: "Contact your administrator directly. Suspensions are applied by admins for policy violations.", aAr: "تواصل مع المسؤول مباشرة. تفرض التعليقات من قبل المسؤولين عند انتهاك السياسات." },
    ],
  },
  {
    cat: "orders", catAr: "الطلبيات", icon: ShoppingBag, color: "text-orange-400",
    items: [
      { q: "How do I track my order?", qAr: "كيف أتابع طلبي؟", a: "Go to Portal → My Orders. Click on any order to expand its details and current status.", aAr: "اذهب إلى بوابتي → مشترياتي. اضغط على أي طلب لرؤية تفاصيله." },
      { q: "How do I request a refund?", qAr: "كيف أطلب استرداد؟", a: "Open a support ticket from Portal → Support Tickets with category \"Refund\".", aAr: "افتح تذكرة دعم من بوابتي → تذاكر الدعم بفئة 'استرداد'." },
    ],
  },
  {
    cat: "notifications", catAr: "الإشعارات", icon: Bell, color: "text-yellow-400",
    items: [
      { q: "How do I manage notification preferences?", qAr: "كيف أدير تفضيلات الإشعارات؟", a: "Settings → Notifications tab. Toggle each category on or off.", aAr: "الإعدادات → تبويب الإشعارات. شغّل أو أوقف كل فئة." },
    ],
  },
  {
    cat: "security", catAr: "الأمان", icon: Shield, color: "text-red-400",
    items: [
      { q: "How do I view my login history?", qAr: "كيف أرى سجل دخولي؟", a: "Settings → Security → Login History section.", aAr: "الإعدادات → الأمان → قسم سجل الدخول." },
      { q: "I see a suspicious login — what do I do?", qAr: "رأيت دخولاً مشبوهاً — ماذا أفعل؟", a: "Go to Settings → Security → Sessions and revoke all active sessions immediately, then change your password.", aAr: "اذهب إلى الإعدادات → الأمان → الجلسات وألغِ جميع الجلسات النشطة فوراً، ثم غيّر كلمة المرور." },
    ],
  },
  {
    cat: "settings", catAr: "الإعدادات", icon: Settings, color: "text-purple-400",
    items: [
      { q: "How do I switch the UI language?", qAr: "كيف أغيّر لغة الواجهة؟", a: "Click the language toggle (EN/AR) in the top navigation bar.", aAr: "اضغط على زر تغيير اللغة (EN/AR) في شريط التنقل العلوي." },
      { q: "How do I switch between dark and light mode?", qAr: "كيف أتحوّل بين الوضع المظلم والفاتح؟", a: "Click the sun/moon icon in the top navigation bar.", aAr: "اضغط أيقونة الشمس/القمر في شريط التنقل العلوي." },
    ],
  },
  {
    cat: "analytics", catAr: "التحليلات", icon: BarChart3, color: "text-cyan-400",
    items: [
      { q: "How do I export data to CSV or PDF?", qAr: "كيف أصدّر البيانات CSV أو PDF؟", a: "In any table or report page, use the Export CSV / Export PDF buttons in the top-right toolbar.", aAr: "في أي جدول أو صفحة تقارير، استخدم أزرار 'تصدير CSV / PDF' في شريط الأدوات." },
    ],
  },
];

export default function Help() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const q = search.toLowerCase();
  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !q || (R ? item.qAr : item.q).toLowerCase().includes(q) || (R ? item.aAr : item.a).toLowerCase().includes(q)
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LifeBuoy className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-display font-black">{R ? "مركز المساعدة" : "Help Center"}</h1>
          <p className="text-sm text-muted-foreground">{R ? "أجوبة على أكثر الأسئلة شيوعاً" : "Answers to the most common questions"}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={R ? "ابحث في الأسئلة..." : "Search questions..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => nav("/settings")}>
          <Settings className="w-3.5 h-3.5" />{R ? "الإعدادات" : "Settings"}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => nav("/portal/tickets")}>
          <MessageSquare className="w-3.5 h-3.5" />{R ? "الدعم المباشر" : "Open Support Ticket"}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => nav("/api-docs")}>
          <ExternalLink className="w-3.5 h-3.5" />{R ? "توثيق API" : "API Docs"}
        </Button>
      </div>

      {/* FAQ Accordion */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{R ? "لا توجد نتائج" : "No results found"}</p>
      ) : (
        filtered.map(cat => (
          <Card key={cat.cat} className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <cat.icon className={cn("w-4 h-4", cat.color)} />
                <span className={cat.color}>{R ? cat.catAr : cat.cat.charAt(0).toUpperCase() + cat.cat.slice(1)}</span>
                <Badge variant="outline" className="ml-auto text-[10px]">{cat.items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {cat.items.map((item, i) => {
                const key = `${cat.cat}-${i}`;
                const isOpen = open === key;
                return (
                  <div key={key} className="border border-border/40 rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setOpen(isOpen ? null : key)}
                    >
                      <span>{R ? item.qAr : item.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 text-sm text-muted-foreground border-t border-border/30 bg-muted/10">
                        {R ? item.aAr : item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}

      {/* Contact support */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{R ? "لم تجد إجابة؟" : "Didn't find your answer?"}</p>
            <p className="text-xs text-muted-foreground">{R ? "افتح تذكرة دعم وسيرد عليها فريق الدعم خلال 24 ساعة." : "Open a support ticket and our team will respond within 24 hours."}</p>
          </div>
          <Button size="sm" onClick={() => nav("/portal/tickets")} className="gap-1.5 shrink-0">
            <MessageSquare className="w-4 h-4" />
            {R ? "تواصل معنا" : "Contact Us"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
