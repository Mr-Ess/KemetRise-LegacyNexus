import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Search } from "lucide-react";
import { auditApi } from "@/services/system";
import ExportButton from "@/components/shared/ExportButton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogs() {
  const nav = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    auditApi.list(500).then(setLogs).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => logs.filter(l => {
    if (level !== "all" && l.level !== level) return false;
    if (q && !`${l.action} ${l.module} ${l.table_name}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (from && new Date(l.created_at) < new Date(from)) return false;
    if (to && new Date(l.created_at) > new Date(to + "T23:59:59")) return false;
    return true;
  }), [logs, q, level, from, to]);

  const presets: [string, () => void][] = [
    ["اليوم", () => { const d = new Date().toISOString().slice(0,10); setFrom(d); setTo(d); }],
    ["7 أيام", () => { const d = new Date(); d.setDate(d.getDate()-7); setFrom(d.toISOString().slice(0,10)); setTo(new Date().toISOString().slice(0,10)); }],
    ["30 يوم", () => { const d = new Date(); d.setDate(d.getDate()-30); setFrom(d.toISOString().slice(0,10)); setTo(new Date().toISOString().slice(0,10)); }],
    ["مسح", () => { setFrom(""); setTo(""); }],
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={() => nav("/settings")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <FileText className="w-6 h-6" /> سجلات النظام
          </h1>
          <ExportButton data={filtered} filename="audit-logs" title="Audit Logs" />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث..." className="pl-9" />
          </div>
          {["all", "info", "warning", "error"].map(l => (
            <Button key={l} size="sm" variant={level === l ? "default" : "outline"} onClick={() => setLevel(l)}>
              {l === "all" ? "الكل" : l === "info" ? "معلومة" : l === "warning" ? "تحذير" : "خطأ"}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">من:</span>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-auto" />
          <span className="text-xs text-muted-foreground">إلى:</span>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-auto" />
          {presets.map(([label, fn]) => (
            <Button key={label} size="sm" variant="ghost" onClick={fn}>{label}</Button>
          ))}
        </div>

        <Card className="overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs">
                <tr>
                  <th className="text-left p-3">الوقت</th>
                  <th className="text-left p-3">المستوى</th>
                  <th className="text-left p-3">الوحدة</th>
                  <th className="text-left p-3">الجدول</th>
                  <th className="text-left p-3">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد سجلات تطابق التصفية</td></tr>
                ) : filtered.map(l => (
                  <tr key={l.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="p-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("ar-EG")}</td>
                    <td className="p-3"><Badge variant={l.level === "error" ? "destructive" : "outline"}>{l.level}</Badge></td>
                    <td className="p-3">{l.module || "-"}</td>
                    <td className="p-3 text-xs font-mono">{l.table_name}</td>
                    <td className="p-3 text-xs">{l.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <p className="text-xs text-muted-foreground text-center">عرض {filtered.length} من {logs.length}</p>
      </div>
    </div>
  );
}
