import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Smartphone, Tablet, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Sessions() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const data = await tenantDb.select("user_sessions", { eq: { revoked: false }, orderBy: "last_active", ascending: false });
    setSessions(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const revoke = async (id: string) => {
    try {
      await tenantDb.update("user_sessions", { revoked: true }, { id });
    } catch {
      return toast.error("فشل");
    }
    toast.success("تم إنهاء الجلسة");
    load();
  };

  const revokeAll = async () => {
    await tenantDb.update("user_sessions", { revoked: true }, { eq: { user_id: user!.id } });
    await supabase.auth.signOut({ scope: "others" } as any);
    toast.success("تم إنهاء كل الجلسات الأخرى");
    load();
  };

  const Icon = (d: string) => /mobile|phone/i.test(d || "") ? Smartphone : /tablet/i.test(d || "") ? Tablet : Monitor;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> رجوع</Button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-display text-primary flex items-center gap-2"><Shield /> الجلسات النشطة</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive">إنهاء كل الجلسات الأخرى</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>تأكيد</AlertDialogTitle><AlertDialogDescription>هتم تسجيل الخروج من كل الأجهزة الأخرى</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={revokeAll}>تأكيد</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {loading ? <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-20 w-full"/>)}</div>
          : sessions.length === 0 ? <Card className="p-12 text-center text-muted-foreground">مفيش جلسات نشطة</Card>
          : sessions.map(s => {
            const I = Icon(s.device);
            return (
              <Card key={s.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <I className="h-8 w-8 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display">{s.browser || "Browser"} على {s.os || s.device || "—"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{s.ip_address || "—"} · آخر نشاط: {new Date(s.last_active).toLocaleString("ar-EG")}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => revoke(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
