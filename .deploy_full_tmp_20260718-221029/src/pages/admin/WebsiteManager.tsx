import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Globe, Layers, Package, Briefcase, Users, Star, HelpCircle,
  Newspaper, Phone, Settings2, BarChart3, Home, Edit, Trash2,
  Plus, Eye, EyeOff, Save, Loader2, RefreshCw, CheckCircle,
  MessageSquare, Bot, ChevronUp, ChevronDown, Layout, Cpu,
} from "lucide-react";

const db = supabase as any;

/* ─── types ─────────────────────────────────────────────────────── */
interface Row { [k: string]: any }

/* ─── Tab config ─────────────────────────────────────────────────── */
const TABS = [
  { id: "landing",       labelAr: "الصفحة الرئيسية",  labelEn: "Landing Page",   icon: Home        },
  { id: "services",      labelAr: "الخدمات",            labelEn: "Services",        icon: Layers      },
  { id: "products",      labelAr: "المنتجات",           labelEn: "Products",        icon: Package     },
  { id: "projects",      labelAr: "المشاريع",           labelEn: "Projects",        icon: Briefcase   },
  { id: "agents",        labelAr: "الوكلاء",            labelEn: "Agents",          icon: Users       },
  { id: "partners",      labelAr: "الشركاء",            labelEn: "Partners",        icon: CheckCircle },
  { id: "tech_stack",    labelAr: "التقنيات",           labelEn: "Tech Stack",      icon: Cpu         },
  { id: "testimonials",  labelAr: "آراء العملاء",       labelEn: "Testimonials",    icon: Star        },
  { id: "faqs",          labelAr: "الأسئلة الشائعة",    labelEn: "FAQs",            icon: HelpCircle  },
  { id: "news",          labelAr: "الأخبار",            labelEn: "News",            icon: Newspaper   },
  { id: "contact",       labelAr: "طلبات التواصل",      labelEn: "Contact Leads",   icon: Phone       },
  { id: "plans",         labelAr: "الباقات",            labelEn: "Plans",           icon: BarChart3   },
  { id: "stats",         labelAr: "الإحصائيات",         labelEn: "Stats",           icon: BarChart3   },
  { id: "settings",      labelAr: "الإعدادات",          labelEn: "Settings",        icon: Settings2   },
] as const;
type TabId = typeof TABS[number]["id"];

/* ─── Generic CRUD hook ─────────────────────────────────────────── */
function useCrud(table: string) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      let { data, error } = await db.from(table).select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false });
      if (error) {
        // Some tables lack created_at — retry with sort_order only
        ({ data, error } = await db.from(table).select("*")
          .order("sort_order", { ascending: true, nullsFirst: false }));
      }
      if (error) {
        // Some tables lack sort_order too — plain select
        ({ data } = await db.from(table).select("*"));
      }
      setRows(data ?? []);
    } catch {
      try {
        const { data } = await db.from(table).select("*");
        setRows(data ?? []);
      } catch { setRows([]); }
    } finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    await db.from(table).delete().eq("id", id);
    setRows(prev => prev.filter(r => r.id !== id));
    toast.success("Deleted");
  };

  const toggle = async (id: string, field: string, current: boolean) => {
    await db.from(table).update({ [field]: !current }).eq("id", id);
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: !current } : r));
  };

  const upsert = async (row: Row) => {
    const { error } = await db.from(table).upsert(row);
    if (error) throw error;
    await fetch();
    toast.success("Saved");
  };

  useEffect(() => { fetch(); }, [table]);
  return { rows, loading, fetch, remove, toggle, upsert };
}

/* ─── Generic Row Editor Dialog ─────────────────────────────────── */
function RowDialog({
  title, open, onClose, fields, initial, onSave,
}: {
  title: string; open: boolean; onClose: () => void;
  fields: { key: string; label: string; type?: "text" | "textarea" | "switch" | "number" }[];
  initial: Row; onSave: (row: Row) => Promise<void>;
}) {
  const [form, setForm] = useState<Row>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(initial), [initial, open]);

  const save = async () => {
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2">
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-xs mb-1 block">{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea rows={3} value={form[f.key] ?? ""} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} />
              ) : f.type === "switch" ? (
                <Switch checked={!!form[f.key]} onCheckedChange={v => setForm(p => ({...p, [f.key]: v}))} />
              ) : f.type === "number" ? (
                <Input type="number" value={form[f.key] ?? 0} onChange={e => setForm(p => ({...p, [f.key]: +e.target.value}))} />
              ) : (
                <Input value={form[f.key] ?? ""} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            &nbsp;Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Sub-panels ─────────────────────────────────────────────────── */

function ServicesPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_services");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "name_ar", label: "الاسم بالعربية" },
    { key: "name_en", label: "Name (English)" },
    { key: "desc_ar", label: "الوصف بالعربية", type: "textarea" as const },
    { key: "desc_en", label: "Description (English)", type: "textarea" as const },
    { key: "category", label: "Category" },
    { key: "color", label: "Color (hex)" },
    { key: "icon_name", label: "Icon Name (lucide)" },
    { key: "sort_order", label: "Sort Order", type: "number" as const },
    { key: "is_active", label: "Active", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "الخدمات" : "Services"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["الاسم / Name", "Category", "Color", "Active", "Actions"]}
      rows={rows.map(r => [
        <span className="font-medium">{R ? r.name_ar : r.name_en}</span>,
        <Badge variant="outline" className="text-[10px]">{r.category}</Badge>,
        <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: `${r.color}20`, color: r.color }}>{r.color}</span>,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Service" : "New Service"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function ProductsPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_products");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "name_ar", label: "الاسم بالعربية" },
    { key: "name_en", label: "Name (English)" },
    { key: "desc_ar", label: "الوصف", type: "textarea" as const },
    { key: "desc_en", label: "Description", type: "textarea" as const },
    { key: "category", label: "Category" },
    { key: "brand", label: "Brand" },
    { key: "image_url", label: "Image URL" },
    { key: "sort_order", label: "Sort Order", type: "number" as const },
    { key: "is_active", label: "Active", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "المنتجات" : "Products"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["الاسم / Name", "Category", "Brand", "Active", "Actions"]}
      rows={rows.map(r => [
        <span className="font-medium">{R ? r.name_ar : r.name_en}</span>,
        <Badge variant="outline" className="text-[10px]">{r.category}</Badge>,
        <span className="text-xs text-muted-foreground">{r.brand}</span>,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Product" : "New Product"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function ProjectsPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_projects");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "title_ar", label: "العنوان بالعربية" },
    { key: "title_en", label: "Title (English)" },
    { key: "desc_ar", label: "الوصف", type: "textarea" as const },
    { key: "desc_en", label: "Description", type: "textarea" as const },
    { key: "brand", label: "Brand" },
    { key: "sector_ar", label: "القطاع" },
    { key: "sector_en", label: "Sector" },
    { key: "status", label: "Status" },
    { key: "cover_url", label: "Cover URL" },
    { key: "sort_order", label: "Sort Order", type: "number" as const },
    { key: "is_active", label: "Active", type: "switch" as const },
    { key: "is_featured", label: "Featured", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "المشاريع" : "Projects"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["العنوان / Title", "Brand", "Sector", "Featured", "Active", "Actions"]}
      rows={rows.map(r => [
        <span className="font-medium">{R ? r.title_ar : r.title_en}</span>,
        <Badge variant="outline" className="text-[10px]">{r.brand}</Badge>,
        <span className="text-xs text-muted-foreground">{R ? r.sector_ar : r.sector_en}</span>,
        <Switch checked={!!r.is_featured} onCheckedChange={() => toggle(r.id, "is_featured", r.is_featured)} />,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Project" : "New Project"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function AgentsPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_agents");
  const [editing, setEditing] = useState<Row | null>(null);

  // Convert brand_activities JSONB array → editable text (one per line: "emoji | English | عربي")
  const toText = (arr: any[]) =>
    (arr ?? []).map((a: any) => `${a.icon ?? ""} | ${a.label_en ?? ""} | ${a.label_ar ?? ""}`).join("\n");

  // Convert text back → JSONB array
  const fromText = (text: string) =>
    (text ?? "").split("\n").filter(l => l.trim()).map(l => {
      const [icon = "", label_en = "", label_ar = ""] = l.split("|").map(p => p.trim());
      return { icon, label_en, label_ar };
    });

  const openEdit = (r: Row) =>
    setEditing({ ...r, brand_activities_text: toText(r.brand_activities ?? []) });

  const handleSave = async (row: Row) => {
    const { brand_activities_text, ...rest } = row;
    await upsert({ ...rest, brand_activities: fromText(brand_activities_text ?? "") });
  };

  const fields = [
    { key: "name_ar", label: "الاسم بالعربية" },
    { key: "name_en", label: "Name (English)" },
    { key: "region_ar", label: "المنطقة" },
    { key: "region_en", label: "Region" },
    { key: "country_ar", label: "الدولة" },
    { key: "country_en", label: "Country" },
    { key: "bio_ar", label: "النبذة", type: "textarea" as const },
    { key: "bio_en", label: "Bio", type: "textarea" as const },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "brand_activities_text", label: "Brand Activities — سطر لكل نشاط: emoji | English | عربي", type: "textarea" as const },
    { key: "is_active", label: "Active", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "الوكلاء" : "Agents"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["الاسم / Name", "Region", "Country", "Email", "Activities", "Active", "Actions"]}
      rows={rows.map(r => [
        <span className="font-medium">{R ? r.name_ar : r.name_en}</span>,
        <Badge variant="outline" className="text-[10px]">{R ? r.region_ar : r.region_en}</Badge>,
        <span className="text-xs">{R ? r.country_ar : r.country_en}</span>,
        <span className="text-xs text-muted-foreground">{r.email}</span>,
        <span className="text-xs text-muted-foreground">{(r.brand_activities ?? []).length} items</span>,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => openEdit(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Agent" : "New Agent"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={handleSave} />
    </CrudPanel>
  );
}

function PartnersPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_partners");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "name_ar", label: "الاسم بالعربية" },
    { key: "name_en", label: "Name (English)" },
    { key: "desc_ar", label: "الوصف", type: "textarea" as const },
    { key: "desc_en", label: "Description", type: "textarea" as const },
    { key: "website_url", label: "Website URL" },
    { key: "logo_url", label: "Logo URL" },
    { key: "category", label: "Category" },
    { key: "sort_order", label: "Sort Order", type: "number" as const },
    { key: "is_active", label: "Active", type: "switch" as const },
    { key: "is_featured", label: "Featured", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "الشركاء" : "Partners"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["الاسم / Name", "Category", "Website", "Featured", "Active", "Actions"]}
      rows={rows.map(r => [
        <span className="font-medium">{R ? r.name_ar : r.name_en}</span>,
        <Badge variant="outline" className="text-[10px]">{r.category}</Badge>,
        <a href={r.website_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary underline">{r.website_url}</a>,
        <Switch checked={!!r.is_featured} onCheckedChange={() => toggle(r.id, "is_featured", r.is_featured)} />,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Partner" : "New Partner"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function TechStackPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_tech_stack");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "name_ar",     label: "الاسم بالعربية" },
    { key: "name_en",     label: "Name (English)" },
    { key: "icon",        label: "Icon (emoji)" },
    { key: "category",    label: "Category (English)" },
    { key: "category_ar", label: "التصنيف بالعربية" },
    { key: "tier",        label: "Tier (platinum / gold / silver)" },
    { key: "color",       label: "Color key (emerald/violet/cyan/indigo/blue/red/orange/amber/pink)" },
    { key: "desc_ar",     label: "الوصف بالعربية",   type: "textarea" as const },
    { key: "desc_en",     label: "Description (EN)",  type: "textarea" as const },
    { key: "website_url", label: "Website URL" },
    { key: "sort_order",  label: "Sort Order",        type: "number" as const },
    { key: "is_active",   label: "Active",            type: "switch" as const },
  ];
  const TIER_BADGE: Record<string, string> = {
    platinum: "bg-primary/15 text-primary border-primary/30",
    gold:     "bg-amber-500/15 text-amber-400 border-amber-500/30",
    silver:   "bg-slate-400/15 text-slate-400 border-slate-400/30",
  };
  return (
    <CrudPanel title={R ? "التقنيات المستخدمة" : "Tech Stack"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["الاسم / Name", "Tier", "Category", "Active", "Actions"]}
      rows={rows.map(r => [
        <div className="flex items-center gap-2">
          <span>{r.icon}</span>
          <span className="font-medium text-xs">{R ? r.name_ar : r.name_en}</span>
        </div>,
        <Badge variant="outline" className={`text-[10px] ${TIER_BADGE[r.tier] ?? ""}`}>{r.tier}</Badge>,
        <span className="text-xs text-muted-foreground">{R ? r.category_ar : r.category}</span>,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Tech Item" : "New Tech Item"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function TestimonialsPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_testimonials");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "name_ar", label: "الاسم بالعربية" },
    { key: "name_en", label: "Name (English)" },
    { key: "role_ar", label: "المسمى الوظيفي" },
    { key: "role_en", label: "Role" },
    { key: "company", label: "Company" },
    { key: "avatar", label: "Avatar (emoji/url)" },
    { key: "text_ar", label: "النص بالعربية", type: "textarea" as const },
    { key: "text_en", label: "Text (English)", type: "textarea" as const },
    { key: "rating", label: "Rating (1-5)", type: "number" as const },
    { key: "sort_order", label: "Sort Order", type: "number" as const },
    { key: "is_active", label: "Active", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "آراء العملاء" : "Testimonials"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["الاسم / Name", "Company", "Rating", "Active", "Actions"]}
      rows={rows.map(r => [
        <span className="font-medium">{R ? r.name_ar : r.name_en}</span>,
        <span className="text-xs text-muted-foreground">{r.company}</span>,
        <div className="flex">{Array.from({length: r.rating ?? 5}).map((_,i)=><Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400"/>)}</div>,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Testimonial" : "New Testimonial"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function FAQsPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_faqs");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "question_ar", label: "السؤال بالعربية" },
    { key: "question_en", label: "Question (English)" },
    { key: "answer_ar", label: "الجواب بالعربية", type: "textarea" as const },
    { key: "answer_en", label: "Answer (English)", type: "textarea" as const },
    { key: "category", label: "Category (general/pricing/technical/agents)" },
    { key: "sort_order", label: "Sort Order", type: "number" as const },
    { key: "is_active", label: "Active", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "الأسئلة الشائعة" : "FAQs"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["السؤال / Question", "Category", "Active", "Actions"]}
      rows={rows.map(r => [
        <span className="font-medium text-xs">{R ? r.question_ar : r.question_en}</span>,
        <Badge variant="outline" className="text-[10px]">{r.category}</Badge>,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit FAQ" : "New FAQ"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function NewsPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_news");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "title_ar", label: "العنوان بالعربية" },
    { key: "title_en", label: "Title (English)" },
    { key: "slug", label: "Slug (URL)" },
    { key: "excerpt_ar", label: "المقتطف بالعربية", type: "textarea" as const },
    { key: "excerpt_en", label: "Excerpt (English)", type: "textarea" as const },
    { key: "content_ar", label: "المحتوى بالعربية", type: "textarea" as const },
    { key: "content_en", label: "Content (English)", type: "textarea" as const },
    { key: "cover_url", label: "Cover Image URL" },
    { key: "category", label: "Category (news/blog/announcement/update)" },
    { key: "author_name", label: "Author Name" },
    { key: "is_published", label: "Published", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "الأخبار والمدونة" : "News & Blog"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["العنوان / Title", "Category", "Author", "Published", "Views", "Actions"]}
      rows={rows.map(r => [
        <span className="font-medium">{R ? r.title_ar : r.title_en}</span>,
        <Badge variant="outline" className="text-[10px]">{r.category}</Badge>,
        <span className="text-xs text-muted-foreground">{r.author_name}</span>,
        <Switch checked={!!r.is_published} onCheckedChange={() => toggle(r.id, "is_published", r.is_published)} />,
        <span className="text-xs">{r.views ?? 0}</span>,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Article" : "New Article"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function ContactPanel({ R }: { R: boolean }) {
  const { rows, loading, toggle, fetch } = useCrud("website_contact_submissions");
  return (
    <CrudPanel title={R ? "طلبات التواصل" : "Contact Submissions"} loading={loading} onRefresh={fetch}
      columns={["الاسم / Name", "Email", "Type", "Message", "Status", "Date", "Actions"]}
      rows={rows.map(r => [
        <span className="font-medium">{r.name}</span>,
        <span className="text-xs">{r.email}</span>,
        <Badge variant="outline" className="text-[10px]">{r.inquiry_type}</Badge>,
        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{r.message}</span>,
        <Badge className={cn("text-[10px]", r.status === "new" ? "bg-blue-500/20 text-blue-400" : r.status === "replied" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground")}>{r.status}</Badge>,
        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>,
        <div className="flex gap-1">
          {r.status === "new" && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => toggle(r.id, "status", false)}>Mark Read</Button>}
        </div>,
      ])}
    />
  );
}

function PlansPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_plans");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "code", label: "Code (starter/business/enterprise)" },
    { key: "name_ar", label: "الاسم بالعربية" },
    { key: "name_en", label: "Name (English)" },
    { key: "tagline_ar", label: "الشعار بالعربية" },
    { key: "tagline_en", label: "Tagline (English)" },
    { key: "icon_name", label: "Icon Name (lucide)" },
    { key: "sort_order", label: "Sort Order", type: "number" as const },
    { key: "is_highlighted", label: "Highlighted", type: "switch" as const },
    { key: "is_active", label: "Active", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "الباقات" : "Plans"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["Code", "الاسم / Name", "Tagline", "Highlighted", "Active", "Actions"]}
      rows={rows.map(r => [
        <Badge className="bg-primary/10 text-primary text-[10px]">{r.code}</Badge>,
        <span className="font-medium">{R ? r.name_ar : r.name_en}</span>,
        <span className="text-xs text-muted-foreground">{R ? r.tagline_ar : r.tagline_en}</span>,
        <Switch checked={!!r.is_highlighted} onCheckedChange={() => toggle(r.id, "is_highlighted", r.is_highlighted)} />,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Plan" : "New Plan"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function StatsPanel({ R }: { R: boolean }) {
  const { rows, loading, remove, toggle, upsert, fetch } = useCrud("website_stats");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "value", label: "القيمة / Value (e.g. 10+)" },
    { key: "label_ar", label: "التسمية بالعربية" },
    { key: "label_en", label: "Label (English)" },
    { key: "icon_name", label: "Icon Name (lucide)" },
    { key: "sort_order", label: "Sort Order", type: "number" as const },
    { key: "is_active", label: "Active", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "الإحصائيات" : "Stats"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["Value", "التسمية / Label", "Icon", "Active", "Actions"]}
      rows={rows.map(r => [
        <span className="text-xl font-black text-primary">{r.value}</span>,
        <span className="text-xs">{R ? r.label_ar : r.label_en}</span>,
        <span className="text-xs text-muted-foreground">{r.icon_name}</span>,
        <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r.id, "is_active", r.is_active)} />,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Stat" : "New Stat"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

function LandingPanel({ R }: { R: boolean }) {
  const { rows: heroRows, loading: heroLoading, upsert: heroUpsert } = useCrud("website_hero");
  const hero = heroRows[0] ?? {};
  const [form, setForm] = useState<Row>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (heroRows[0]) setForm(heroRows[0]); }, [heroRows]);

  const save = async () => {
    setSaving(true);
    try { await heroUpsert(form); }
    finally { setSaving(false); }
  };

  const fields = [
    { key: "badge_ar", label: "Badge (Arabic)" },
    { key: "badge_en", label: "Badge (English)" },
    { key: "title_ar", label: "العنوان الرئيسي (عربي)" },
    { key: "title_en", label: "Main Title (English)" },
    { key: "subtitle_ar", label: "العنوان الفرعي (عربي)" },
    { key: "subtitle_en", label: "Subtitle (English)" },
    { key: "cta_primary_ar", label: "زر CTA الأول (عربي)" },
    { key: "cta_primary_en", label: "Primary CTA (English)" },
    { key: "cta_secondary_ar", label: "زر CTA الثاني (عربي)" },
    { key: "cta_secondary_en", label: "Secondary CTA (English)" },
    { key: "bg_video_url", label: "Background Video URL" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">{R ? "محتوى Hero الرئيسي" : "Hero Section Content"}</h3>
        <Button onClick={save} disabled={saving || heroLoading} size="sm" className="gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {R ? "حفظ" : "Save"}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key}>
            <Label className="text-xs mb-1 block">{f.label}</Label>
            <Input value={form[f.key] ?? ""} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} />
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl border border-border/40 bg-secondary/10 text-xs text-muted-foreground">
        <p className="font-semibold mb-1">{R ? "ملاحظة:" : "Note:"}</p>
        <p>{R ? "التعديلات على محتوى Hero ستنعكس على الصفحة الرئيسية بعد ربط الداتا ببيز بالـ component." : "Hero content changes will reflect on the landing page once the component is connected to the database."}</p>
      </div>
    </div>
  );
}

function SettingsPanel({ R }: { R: boolean }) {
  const { rows, loading, upsert, fetch } = useCrud("website_settings");
  const [editing, setEditing] = useState<Row | null>(null);
  const fields = [
    { key: "key", label: "Key" },
    { key: "value_ar", label: "القيمة بالعربية" },
    { key: "value_en", label: "Value (English)" },
    { key: "category", label: "Category (general/nav/footer/contact/seo)" },
    { key: "is_active", label: "Active", type: "switch" as const },
  ];
  return (
    <CrudPanel title={R ? "إعدادات الموقع" : "Website Settings"} loading={loading} onAdd={() => setEditing({})} onRefresh={fetch}
      columns={["Key", "Value (AR)", "Value (EN)", "Category", "Actions"]}
      rows={rows.map(r => [
        <code className="text-[10px] bg-secondary/30 px-1 rounded">{r.key}</code>,
        <span className="text-xs">{r.value_ar}</span>,
        <span className="text-xs">{r.value_en}</span>,
        <Badge variant="outline" className="text-[10px]">{r.category}</Badge>,
        <RowActions onEdit={() => setEditing(r)} onDelete={() => {}} />,
      ])}
    >
      <RowDialog title={editing?.id ? "Edit Setting" : "New Setting"} open={!!editing} onClose={() => setEditing(null)}
        fields={fields} initial={editing ?? {}} onSave={upsert} />
    </CrudPanel>
  );
}

/* ─── Shared components ──────────────────────────────────────────── */

function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-1">
      {onEdit && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Edit className="w-3.5 h-3.5" /></Button>}
      {onDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>}
    </div>
  );
}

function CrudPanel({
  title, loading, children, onAdd, onRefresh, columns, rows,
}: {
  title: string; loading: boolean; children?: React.ReactNode;
  onAdd?: () => void; onRefresh?: () => void;
  columns: (string | React.ReactNode)[]; rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">{title}</h3>
        <div className="flex gap-2">
          {onRefresh && <Button size="sm" variant="outline" onClick={onRefresh} className="gap-1.5 text-xs h-8"><RefreshCw className="w-3.5 h-3.5" />Refresh</Button>}
          {onAdd && <Button size="sm" onClick={onAdd} className="gap-1.5 text-xs h-8"><Plus className="w-3.5 h-3.5" />Add New</Button>}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading…
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/20">
                {columns.map((c, i) => <TableHead key={i} className="text-xs py-2">{c}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground text-sm py-8">No records yet</TableCell></TableRow>
              ) : rows.map((row, i) => (
                <TableRow key={i} className="hover:bg-secondary/10">
                  {row.map((cell, j) => <TableCell key={j} className="py-2 text-xs">{cell}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function WebsiteManager() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const [activeTab, setActiveTab] = useState<TabId>("landing");

  const renderPanel = () => {
    switch (activeTab) {
      case "landing":       return <LandingPanel R={R} />;
      case "services":      return <ServicesPanel R={R} />;
      case "products":      return <ProductsPanel R={R} />;
      case "projects":      return <ProjectsPanel R={R} />;
      case "agents":        return <AgentsPanel R={R} />;
      case "partners":      return <PartnersPanel R={R} />;
      case "tech_stack":    return <TechStackPanel R={R} />;
      case "testimonials":  return <TestimonialsPanel R={R} />;
      case "faqs":          return <FAQsPanel R={R} />;
      case "news":          return <NewsPanel R={R} />;
      case "contact":       return <ContactPanel R={R} />;
      case "plans":         return <PlansPanel R={R} />;
      case "stats":         return <StatsPanel R={R} />;
      case "settings":      return <SettingsPanel R={R} />;
      default:              return null;
    }
  };

  const activeTabInfo = TABS.find(t => t.id === activeTab)!;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-black">{R ? "إدارة محتوى الموقع" : "Website Content Manager"}</h1>
            <p className="text-xs text-muted-foreground">{R ? "تحكم كامل في كل محتوى صفحات الموقع العام" : "Full control over all public website page content"}</p>
          </div>
          <Badge className="mr-auto bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
            <CheckCircle className="w-3 h-3 mr-1" />Live
          </Badge>
        </div>

        <div className="flex gap-6" dir="ltr">
          {/* Sidebar tabs */}
          <nav className="w-52 shrink-0 space-y-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                )}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                {R ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0 rounded-2xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/40">
              <activeTabInfo.icon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold">{R ? activeTabInfo.labelAr : activeTabInfo.labelEn}</h2>
            </div>
            {renderPanel()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
