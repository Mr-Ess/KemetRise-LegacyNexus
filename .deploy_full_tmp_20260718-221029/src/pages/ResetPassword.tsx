import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase recovery link sets a session via hash; wait for it
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
    if (password !== confirm) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم تحديث كلمة المرور");
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 space-y-4 border-primary/30">
        <h1 className="text-2xl font-bold text-primary text-center" style={{ fontFamily: "Orbitron" }}>
          إعادة تعيين كلمة المرور
        </h1>
        {!ready ? (
          <p className="text-center text-sm text-muted-foreground">جاري التحقق من الرابط...</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div><Label>كلمة المرور الجديدة</Label><Input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></div>
            <div><Label>تأكيد كلمة المرور</Label><Input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
            <Button type="submit" disabled={busy} className="w-full">{busy ? "..." : "تحديث"}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
