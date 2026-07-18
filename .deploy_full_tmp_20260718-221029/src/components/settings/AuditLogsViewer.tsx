import { useEffect, useState } from "react";
import { auditApi } from "@/services/system";
import { Badge } from "@/components/ui/badge";
import ExportButton from "@/components/shared/ExportButton";
import { SavedViews } from "@/components/shared/SavedViews";

export default function AuditLogsViewer() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  useEffect(() => { auditApi.list(200).then(setRows); }, []);
  const filtered = filter === "all" ? rows : rows.filter(r => r.level === filter);
  const colors: Record<string,string> = { info:"bg-nile/20 text-nile", warning:"bg-primary/20 text-primary", error:"bg-blood-red/20 text-blood-red" };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {["all","info","warning","error"].map(l => (
            <button key={l} onClick={()=>setFilter(l)} className={`px-3 py-1 text-xs rounded border ${filter===l?"border-primary text-primary":"border-border text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SavedViews page="audit_logs" currentFilters={{ filter }} onApply={(f)=>setFilter(f.filter ?? "all")} />
          <ExportButton data={filtered} filename="audit-logs" />
        </div>
      </div>
      <div className="border border-border rounded max-h-[500px] overflow-y-auto">
        {filtered.map(r => (
          <div key={r.id} className="px-3 py-2 border-b border-border/50 text-xs flex items-center justify-between">
            <div className="flex-1">
              <div className="text-foreground">{r.action}</div>
              <div className="text-muted-foreground">{r.module} • {new Date(r.created_at).toLocaleString()}</div>
            </div>
            <Badge className={colors[r.level]||""}>{r.level}</Badge>
          </div>
        ))}
        {filtered.length===0 && <div className="p-6 text-center text-muted-foreground text-sm">لا يوجد سجلات</div>}
      </div>
    </div>
  );
}
