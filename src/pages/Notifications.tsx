import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, AlertTriangle, Info, AlertCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { auditApi, settingsApi } from "@/services/system";
import { toast } from "sonner";

export default function Notifications() {
  const nav = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "warning" | "error">("all");

  useEffect(() => {
    Promise.all([auditApi.list(200), settingsApi.get("read_notifications")])
      .then(([l, r]) => { setLogs(l); if (Array.isArray(r)) setReadIds(r as any); });
    const ch = supabase.channel("notif-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, async () => {
        setLogs(await auditApi.list(200));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = logs.filter(l => {
    if (filter === "unread") return !readIds.includes(l.id);
    if (filter === "warning" || filter === "error") return l.level === filter;
    return true;
  });

  const markRead = async (id: string) => {
    const next = [...new Set([...readIds, id])];
    setReadIds(next);
    await settingsApi.set("read_notifications", next);
  };
  const markAll = async () => {
    const next = [...new Set([...readIds, ...logs.map(l => l.id)])];
    setReadIds(next);
    await settingsApi.set("read_notifications", next);
    toast.success("تم وضع علامة على الكل كمقروء");
  };

  const Icon = ({ level }: { level: string }) =>
    level === "error" ? <AlertCircle className="w-4 h-4 text-blood-red" /> :
    level === "warning" ? <AlertTriangle className="w-4 h-4 text-primary" /> :
    <Info className="w-4 h-4 text-nile" />;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => nav("/")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <Bell className="w-6 h-6" /> الإشعارات
          </h1>
          <Button size="sm" onClick={markAll}><Check className="w-4 h-4 mr-1" /> الكل مقروء</Button>
        </div>

        <div className="flex gap-2">
          {(["all", "unread", "warning", "error"] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "الكل" : f === "unread" ? "غير مقروء" : f === "warning" ? "تحذير" : "خطأ"}
            </Button>
          ))}
        </div>

        <Card className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">لا توجد إشعارات</div>
          ) : filtered.map(n => (
            <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-secondary/30 ${!readIds.includes(n.id) ? "bg-primary/5" : ""}`}>
              <Icon level={n.level} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{n.module || n.table_name}</p>
                  <Badge variant="outline" className="text-[10px]">{n.level}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{n.action}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleString("ar-EG")}</p>
              </div>
              {!readIds.includes(n.id) && (
                <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}><Check className="w-4 h-4" /></Button>
              )}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
