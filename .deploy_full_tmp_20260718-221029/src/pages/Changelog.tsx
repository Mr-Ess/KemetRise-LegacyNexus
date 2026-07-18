import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Shield, Zap, Bug, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Entry = { date: string; version: string; items: { type: "feature"|"security"|"perf"|"fix"; text: string }[] };

const ICONS = { feature: Plus, security: Shield, perf: Zap, fix: Bug };
const COLORS: Record<string, string> = {
  feature: "bg-primary/15 text-primary",
  security: "bg-destructive/15 text-destructive",
  perf: "bg-accent/15 text-accent-foreground",
  fix: "bg-secondary text-secondary-foreground",
};

const CHANGELOG: Entry[] = [
  {
    date: "2026-05-03", version: "v1.4.0",
    items: [
      { type: "feature", text: "Global Search موحد عبر كل الجداول الرئيسية" },
      { type: "feature", text: "Changelog page لتتبع كل التحديثات" },
      { type: "perf", text: "Code Splitting لـ 56 صفحة (lazy loading)" },
      { type: "perf", text: "26 Database Index لتسريع RLS والاستعلامات" },
      { type: "feature", text: "Confirmation Dialogs قبل الحذف في كل المودولز" },
      { type: "feature", text: "Loading Skeletons وEmpty States موحّدة" },
    ],
  },
  {
    date: "2026-05-02", version: "v1.3.0",
    items: [
      { type: "security", text: "تحصين دوال SECURITY DEFINER" },
      { type: "security", text: "إغلاق قراءة brand_invitations العامة + RPC آمن" },
      { type: "feature", text: "Marketplace: 24+ تطبيق جاهز" },
      { type: "feature", text: "Blog: 12+ مقال عربي" },
    ],
  },
  {
    date: "2026-05-01", version: "v1.2.0",
    items: [
      { type: "feature", text: "Voice Assistant + Video Conference" },
      { type: "feature", text: "Help Center مع شرح كامل" },
      { type: "feature", text: "Presence Indicator (online/offline)" },
    ],
  },
  {
    date: "2026-04-28", version: "v1.1.0",
    items: [
      { type: "feature", text: "16 مودول CRUD جديد (Materials, Inventory, CRM, Logistics...)" },
      { type: "feature", text: "Notification Rules قابلة للتخصيص" },
      { type: "feature", text: "Payment Gateways UI" },
    ],
  },
];

export default function Changelog() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => nav("/")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <Sparkles className="w-7 h-7" /> سجل التحديثات
          </h1>
          <p className="text-muted-foreground">كل ما هو جديد في المنصة</p>
        </div>

        <div className="space-y-4">
          {CHANGELOG.map((e) => (
            <Card key={e.version} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary" style={{ fontFamily: "Orbitron" }}>{e.version}</h2>
                <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("ar-EG", { year:"numeric", month:"long", day:"numeric" })}</span>
              </div>
              <ul className="space-y-2">
                {e.items.map((it, i) => {
                  const Icon = ICONS[it.type];
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="secondary" className={`${COLORS[it.type]} gap-1 shrink-0`}>
                        <Icon className="w-3 h-3" />
                        {it.type === "feature" ? "ميزة" : it.type === "security" ? "أمان" : it.type === "perf" ? "أداء" : "إصلاح"}
                      </Badge>
                      <span>{it.text}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
