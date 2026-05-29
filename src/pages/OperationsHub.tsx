import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useExtTable } from "@/hooks/useExtTable";
import { ExtTable } from "@/services/extended";
import { EmptyState, EntityListSkeleton } from "@/components/shared/EntitySkeleton";

type FieldDef = { key: string; label: string; type?: "text" | "number" | "date" };
type ModuleDef = { table: ExtTable; title: string; fields: FieldDef[]; titleKey: string };

const MODULES: Record<string, ModuleDef[]> = {
  inventory: [
    { table: "materials", title: "المواد الخام", titleKey: "name", fields: [
      { key: "name", label: "الاسم" }, { key: "unit", label: "الوحدة" },
      { key: "current_stock", label: "المخزون", type: "number" }, { key: "min_stock_level", label: "الحد الأدنى", type: "number" },
    ]},
    { table: "inventory", title: "المخزون", titleKey: "id", fields: [
      { key: "branch_id", label: "الفرع (ID)" }, { key: "material_id", label: "المادة (ID)" },
      { key: "quantity", label: "الكمية", type: "number" },
    ]},
    { table: "suppliers", title: "الموردين", titleKey: "company_name", fields: [
      { key: "company_name", label: "اسم الشركة" }, { key: "contact_person", label: "جهة الاتصال" },
      { key: "email", label: "البريد" }, { key: "phone", label: "التليفون" }, { key: "category", label: "الفئة" },
    ]},
  ],
  logistics: [
    { table: "logistics_shipping", title: "الشحن", titleKey: "tracking_number", fields: [
      { key: "tracking_number", label: "رقم التتبع" }, { key: "carrier", label: "الشركة الناقلة" },
      { key: "status", label: "الحالة" }, { key: "estimated_delivery", label: "التسليم المتوقع", type: "date" },
    ]},
    { table: "import_export", title: "الاستيراد/التصدير", titleKey: "document_type", fields: [
      { key: "document_type", label: "نوع المستند" }, { key: "country_of_origin", label: "بلد المنشأ" }, { key: "status", label: "الحالة" },
    ]},
    { table: "artistic_production", title: "الإنتاج الفني", titleKey: "project_name", fields: [
      { key: "project_name", label: "اسم المشروع" }, { key: "media_type", label: "نوع الوسيط" }, { key: "production_status", label: "الحالة" },
    ]},
  ],
  finance: [
    { table: "finance_analytics", title: "التحليلات المالية", titleKey: "month_year", fields: [
      { key: "month_year", label: "الشهر/السنة" }, { key: "total_revenue", label: "الإيرادات", type: "number" },
      { key: "total_expenses", label: "المصروفات", type: "number" }, { key: "net_profit", label: "صافي الربح", type: "number" },
    ]},
    { table: "payment_gateways", title: "بوابات الدفع", titleKey: "gateway_name", fields: [
      { key: "gateway_name", label: "اسم البوابة" },
    ]},
    { table: "assets_management", title: "الأصول", titleKey: "asset_name", fields: [
      { key: "asset_name", label: "اسم الأصل" }, { key: "purchase_date", label: "تاريخ الشراء", type: "date" },
      { key: "value", label: "القيمة", type: "number" }, { key: "location", label: "الموقع" },
    ]},
  ],
  crm: [
    { table: "clients", title: "العملاء (CRM)", titleKey: "full_name", fields: [
      { key: "full_name", label: "الاسم الكامل" }, { key: "email", label: "البريد" },
      { key: "phone", label: "التليفون" }, { key: "loyalty_points", label: "نقاط الولاء", type: "number" },
    ]},
    { table: "affiliated_agents", title: "الوكلاء التابعين", titleKey: "agent_name", fields: [
      { key: "agent_name", label: "الاسم" }, { key: "commission_rate", label: "نسبة العمولة", type: "number" },
      { key: "total_sales", label: "إجمالي المبيعات", type: "number" },
    ]},
    { table: "crm_interactions", title: "تفاعلات CRM", titleKey: "notes", fields: [
      { key: "client_id", label: "العميل (ID)" }, { key: "notes", label: "الملاحظات" },
    ]},
    { table: "marketing_campaigns", title: "الحملات التسويقية", titleKey: "campaign_name", fields: [
      { key: "campaign_name", label: "اسم الحملة" }, { key: "budget", label: "الميزانية", type: "number" },
      { key: "leads_generated", label: "العملاء المحتملين", type: "number" },
    ]},
  ],
  legacy: [
    { table: "legal_vault", title: "الخزنة القانونية", titleKey: "doc_title", fields: [
      { key: "doc_title", label: "عنوان المستند" }, { key: "expiry_date", label: "انتهاء الصلاحية", type: "date" },
    ]},
    { table: "system_alerts", title: "تنبيهات النظام", titleKey: "message", fields: [
      { key: "level", label: "المستوى" }, { key: "module", label: "الوحدة" }, { key: "message", label: "الرسالة" },
    ]},
  ],
};

function ModuleCard({ mod }: { mod: ModuleDef }) {
  const { items, loading, create, remove } = useExtTable(mod.table);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const submit = async () => {
    const payload: Record<string, any> = {};
    for (const f of mod.fields) {
      if (form[f.key] === undefined || form[f.key] === "") continue;
      payload[f.key] = f.type === "number" ? Number(form[f.key]) : form[f.key];
    }
    if (Object.keys(payload).length === 0) return;
    await create(payload);
    setForm({}); setOpen(false);
  };

  return (
    <Card className="p-4 bg-card/50 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-primary">{mod.title} <span className="text-xs text-muted-foreground">({items.length})</span></h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-3 h-3 ml-1" />إضافة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>إضافة إلى {mod.title}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {mod.fields.map(f => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input type={f.type || "text"} value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <Button onClick={submit} className="w-full">حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <EntityListSkeleton rows={2} /> : items.length === 0 ? (
        <EmptyState title="لا توجد بيانات" hint="ابدأ بإضافة عنصر جديد" />
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {items.slice(0, 10).map((it: any) => (
            <div key={it.id} className="flex items-center justify-between text-sm p-2 hover:bg-muted/30 rounded">
              <span className="truncate">{it[mod.titleKey] || it.id?.slice(0, 8)}</span>
              <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function OperationsHub() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-2"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <div>
          <h1 className="text-3xl font-orbitron text-primary">مركز العمليات</h1>
          <p className="text-muted-foreground">إدارة المخزون، اللوجستيات، المالية، CRM، والإرث</p>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
            <TabsTrigger value="logistics">اللوجستيات</TabsTrigger>
            <TabsTrigger value="finance">المالية</TabsTrigger>
            <TabsTrigger value="crm">CRM</TabsTrigger>
            <TabsTrigger value="legacy">الإرث</TabsTrigger>
          </TabsList>
          {Object.entries(MODULES).map(([key, mods]) => (
            <TabsContent key={key} value={key} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {mods.map(m => <ModuleCard key={m.table} mod={m} />)}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
