import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Inbox, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useBulkSelect, BulkActionBar } from "@/components/shared/BulkActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { extApi, ExtTable } from "@/services/extended";
import ExportButton from "@/components/shared/ExportButton";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  max?: number;
};

type Props = {
  title: string;
  table: ExtTable;
  icon: any;
  fields: FieldDef[];
  columns: { key: string; label: string; render?: (v: any, row: any) => any }[];
  emptyHint?: string;
};

export default function SimpleCrud({ title, table, icon: Icon, fields, columns, emptyHint }: Props) {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const empty = Object.fromEntries(fields.map(f => [f.name, f.defaultValue ?? (f.type === "checkbox" ? false : f.type === "number" ? 0 : "")]));
  const [form, setForm] = useState<any>(empty);
  const [search, setSearch] = useState("");
  const bulk = useBulkSelect();

  const filtered = search
    ? items.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))
    : items;

  const load = () => {
    setLoading(true);
    extApi.list(table)
      .then(setItems)
      .catch(e => toast.error(e.message || "فشل تحميل البيانات"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [table]);

  const submit = async () => {
    for (const f of fields) {
      if (f.required && !form[f.name] && form[f.name] !== 0) return toast.error(`${f.label} مطلوب`);
      if (f.max && typeof form[f.name] === "string" && form[f.name].length > f.max)
        return toast.error(`${f.label}: الحد الأقصى ${f.max} حرف`);
    }
    const payload: any = { ...form };
    fields.forEach(f => {
      if (f.type === "date" && !payload[f.name]) payload[f.name] = null;
      if (f.type === "number") payload[f.name] = Number(payload[f.name]) || 0;
      if (typeof payload[f.name] === "string") payload[f.name] = payload[f.name].trim();
    });
    try {
      setSaving(true);
      if (editId) { await extApi.update(table, editId, payload); toast.success("تم التحديث بنجاح"); }
      else { await extApi.create(table, payload); toast.success("تم الإضافة بنجاح"); }
      setOpen(false); setEditId(null); setForm(empty); load();
    } catch (e: any) { toast.error(e.message || "خطأ في الحفظ"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try { await extApi.remove(table, deleteId); toast.success("تم الحذف"); load(); }
    catch (e: any) { toast.error(e.message || "فشل الحذف"); }
    finally { setDeleteId(null); }
  };

  const startEdit = (row: any) => {
    const f: any = { ...empty };
    fields.forEach(fd => { f[fd.name] = row[fd.name] ?? f[fd.name]; if (fd.type === "date" && row[fd.name]) f[fd.name] = String(row[fd.name]).slice(0, 10); });
    setForm(f); setEditId(row.id); setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => nav("/")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <Icon className="w-6 h-6" /> {title}
          </h1>
          <div className="flex gap-2">
            <ExportButton data={filtered} filename={table} title={title} />
            <Button onClick={() => { setEditId(null); setForm(empty); setOpen(true); }}><Plus className="w-4 h-4 mr-1" /> جديد</Button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في كل الأعمدة..." className="pl-9" />
        </div>

        <Card className="overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">{search ? "لا توجد نتائج للبحث" : (emptyHint || `لا توجد بيانات في ${title} بعد`)}</p>
              <Button onClick={() => { setEditId(null); setForm(empty); setOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> أضف أول عنصر
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs">
                <tr>
                  <th className="p-3 w-8">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every(r => bulk.has(r.id))}
                      onCheckedChange={(c) => c ? bulk.setAll(filtered.map(r => r.id)) : bulk.clear()}
                    />
                  </th>
                  {columns.map(c => <th key={c.key} className="text-left p-3">{c.label}</th>)}
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="p-3"><Checkbox checked={bulk.has(row.id)} onCheckedChange={() => bulk.toggle(row.id)} /></td>
                    {columns.map(c => <td key={c.key} className="p-3">{c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}</td>)}
                    <td className="p-3 text-right whitespace-nowrap">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => startEdit(row)} className="p-1.5 text-muted-foreground hover:text-primary"><Edit className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent>تعديل</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => setDeleteId(row.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent>حذف</TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <p className="text-xs text-muted-foreground text-center">
          عرض {filtered.length} من {items.length}
        </p>
      </div>

      <BulkActionBar count={bulk.count} table={table} ids={Array.from(bulk.selected)} onDone={() => { bulk.clear(); load(); }} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "تعديل" : "إضافة"} — {title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.name}>
                <Label>{f.label}{f.required && " *"}</Label>
                {f.type === "textarea" ? (
                  <Textarea value={form[f.name] || ""} maxLength={f.max} onChange={e => setForm({ ...form, [f.name]: e.target.value })} placeholder={f.placeholder} />
                ) : f.type === "select" ? (
                  <Select value={form[f.name] || ""} onValueChange={v => setForm({ ...form, [f.name]: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent>{f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : f.type === "checkbox" ? (
                  <input type="checkbox" checked={!!form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.checked })} className="ml-2" />
                ) : (
                  <Input type={f.type || "text"} maxLength={f.max} value={form[f.name] ?? ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} placeholder={f.placeholder} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>إلغاء</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
