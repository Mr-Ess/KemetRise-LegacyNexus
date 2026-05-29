import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, FileText, Trash2, Plus, Pencil } from "lucide-react";
import { tenantDb } from "@/lib/tenantDb";

const iconFor = (action: string) => {
  if (action.startsWith("INSERT")) return Plus;
  if (action.startsWith("UPDATE")) return Pencil;
  if (action.startsWith("DELETE")) return Trash2;
  return FileText;
};

export const ActivityTimeline = ({ table, recordId }: { table?: string; recordId?: string }) => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    tenantDb.select("audit_logs", {
      eq: { table_name: table, record_id: recordId },
      orderBy: "created_at",
      ascending: false,
      limit: 30,
    }).then((data) => setLogs(data || []));
  }, [table, recordId]);

  if (!logs.length) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground font-body">
        <Activity className="w-5 h-5 mx-auto mb-2 opacity-40" />
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map(l => {
        const Icon = iconFor(l.action);
        return (
          <div key={l.id} className="flex gap-3 p-2 rounded-md hover:bg-secondary/30 border-l-2 border-primary/40">
            <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground font-body truncate">{l.action}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
