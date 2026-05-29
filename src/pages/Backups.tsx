import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, Download, RotateCcw, Trash2, Plus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { backupsApi, gdprApi } from "@/services/system";
import { toast } from "sonner";
import { FileDown } from "lucide-react";

const EXPORT_TABLES = [
  "brands","customers","projects","employees","branches","services","tasks",
  "vault_entries","transactions","affiliates","success_partners","audit_logs",
];

const toCSV = (rows: any[]) => {
  if (!rows.length) return "";
  const set = new Set<string>();
  rows.forEach(r => Object.keys(r).forEach(k => set.add(k)));
  const cols = Array.from(set);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
};

const downloadBlob = (content: string, name: string, type: string) => {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name; a.click();
};

const fmt = (b: number) => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(2)} MB`;

export default function Backups() {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    backupsApi.list().then(setItems).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!label.trim()) return toast.error("أدخل اسم النسخة");
    try {
      setCreating(true);
      await backupsApi.create(label.trim());
      toast.success("تم إنشاء نسخة احتياطية");
      setLabel(""); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const download = async (id: string, name: string) => {
    try {
      const data: any = await backupsApi.download(id);
      const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}-${id.slice(0,8)}.json`;
      a.click();
      toast.success("تم التنزيل");
    } catch (e: any) { toast.error(e.message); }
  };

  const confirmRestore = async () => {
    if (!restoreId) return;
    try {
      const r = await backupsApi.restore(restoreId);
      toast.success(`تم استعادة ${r.restored} عنصر`);
    } catch (e: any) { toast.error(e.message); }
    finally { setRestoreId(null); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try { await backupsApi.remove(deleteId); toast.success("تم الحذف"); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setDeleteId(null); }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => nav("/settings")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <Database className="w-6 h-6" /> النسخ الاحتياطية
          </h1>
        </div>

        <Card className="p-4 flex flex-wrap gap-2 items-center">
          <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="اسم النسخة (مثلاً: قبل التحديث)" className="flex-1 min-w-[220px]" maxLength={80} />
          <Button onClick={create} disabled={creating}>
            <Plus className="w-4 h-4 mr-1" /> {creating ? "جاري الإنشاء..." : "إنشاء نسخة احتياطية الآن"}
          </Button>
        </Card>

        <Card>
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد نسخ احتياطية بعد</p>
              <p className="text-xs text-muted-foreground">أنشئ أول نسخة لحماية بياناتك</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between hover:bg-secondary/20">
                  <div>
                    <div className="font-medium">{b.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleString("ar-EG")} · {fmt(b.size_bytes)} · {b.status}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={() => download(b.id, b.label)}><Download className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>تنزيل JSON</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={() => setRestoreId(b.id)}><RotateCcw className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>استعادة</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={() => setDeleteId(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileDown className="w-4 h-4 text-primary" /> تصدير بيانات Module مفرد (CSV / JSON)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {EXPORT_TABLES.map(t => (
              <div key={t} className="flex items-center justify-between gap-1 p-2 rounded border border-border/50 bg-secondary/10">
                <span className="text-xs truncate">{t}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={async () => {
                    try {
                      const all = await gdprApi.exportAll();
                      const rows = (all as any)[t] || [];
                      downloadBlob(toCSV(rows), `${t}.csv`, "text/csv");
                      toast.success(`صدّر ${rows.length} صف`);
                    } catch (e: any) { toast.error(e.message); }
                  }}>CSV</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={async () => {
                    try {
                      const all = await gdprApi.exportAll();
                      const rows = (all as any)[t] || [];
                      downloadBlob(JSON.stringify(rows, null, 2), `${t}.json`, "application/json");
                      toast.success(`صدّر ${rows.length} صف`);
                    } catch (e: any) { toast.error(e.message); }
                  }}>JSON</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          النسخ الاحتياطية تشمل كل بياناتك (Brands, Customers, Projects, Tasks, Vault...) — احتفظ بنسخة دورية.
        </p>
      </div>

      <AlertDialog open={!!restoreId} onOpenChange={o => !o && setRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الاستعادة</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم استعادة كل البيانات من هذه النسخة وتجاوز البيانات الحالية المتطابقة. هل تريد المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>استعادة</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف النسخة الاحتياطية؟</AlertDialogTitle>
            <AlertDialogDescription>لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
