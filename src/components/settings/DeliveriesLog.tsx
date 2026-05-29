import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deliveriesApi } from "@/services/system";
import { RefreshCw } from "lucide-react";

export default function DeliveriesLog() {
  const [list, setList] = useState<any[]>([]);
  const load = async () => setList(await deliveriesApi.list(50));
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold">Webhook Deliveries</h3>
        <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="w-4 h-4"/></Button>
      </div>
      {list.length === 0 && <p className="text-sm opacity-60">No deliveries yet.</p>}
      <div className="space-y-2 max-h-96 overflow-auto">
        {list.map(d => (
          <div key={d.id} className="p-3 border border-primary/20 rounded-lg bg-card text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono">{d.event}</span>
              <Badge variant={d.status === "delivered" ? "default" : "destructive"}>{d.status} · {d.response_status || "—"}</Badge>
            </div>
            <p className="opacity-60">{new Date(d.created_at).toLocaleString()}</p>
            {d.response_body && <pre className="mt-1 opacity-60 truncate">{d.response_body.slice(0,200)}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}
