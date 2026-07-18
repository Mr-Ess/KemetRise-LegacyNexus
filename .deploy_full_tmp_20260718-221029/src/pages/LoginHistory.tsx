import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { tenantDb } from "@/lib/tenantDb";
import { useAuth } from "@/hooks/useAuth";

export default function LoginHistory() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    tenantDb.select("login_history", { orderBy: "created_at", ascending: false, limit: 30 })
      .then((data) => { setItems(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> رجوع</Button>
        <h1 className="text-2xl font-display text-primary flex items-center gap-2"><History /> سجل تسجيل الدخول</h1>

        {loading ? <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full"/>)}</div>
          : items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">مفيش سجل بعد</Card>
          : items.map(it => (
            <Card key={it.id} className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {it.success ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                <div className="min-w-0">
                  <div className="font-display text-sm">{it.browser || "Unknown"} · {it.os || it.device || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">{it.ip_address || "—"} · {it.location || "—"}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={it.success ? "default" : "destructive"}>{it.success ? "نجح" : "فشل"}</Badge>
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(it.created_at).toLocaleString("ar-EG")}</div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
