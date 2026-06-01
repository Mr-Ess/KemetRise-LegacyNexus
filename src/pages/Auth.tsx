import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import * as OTPAuth from "otpauth";
import { trackLoginSuccess, trackFailedLogin, checkRateLimit } from "@/lib/authTracking";
import { tenantDb } from "@/lib/tenantDb";

export default function Auth() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingSecret, setPendingSecret] = useState("");

  useEffect(() => { if (user && !needs2fa) nav("/", { replace: true }); }, [user, nav, needs2fa]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const limit = await checkRateLimit(email);
    if (!limit.allowed) {
      setBusy(false);
      toast.error(`تم تجاوز عدد المحاولات. حاول بعد ${limit.waitMin} دقيقة`);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      await trackFailedLogin(email);
      toast.error(error.message);
      return;
    }
    await trackLoginSuccess(data.user!.id);
    const tfaRows = await tenantDb.select("user_2fa", { eq: { user_id: data.user!.id }, limit: 1 });
    const tfa = (tfaRows?.[0] || null) as any;
    if (tfa && tfa.enabled) {
      setPendingSecret(tfa.secret);
      setNeeds2fa(true);
    } else {
      nav("/");
    }
  };

  const verify2fa = async () => {
    const totp = new OTPAuth.TOTP({ issuer: "KemetRise", label: email, secret: OTPAuth.Secret.fromBase32(pendingSecret) });
    const delta = totp.validate({ token: otp, window: 1 });
    if (delta === null) { toast.error("كود خاطئ"); return; }
    setNeeds2fa(false);
    nav("/");
  };

  const cancel2fa = async () => {
    await supabase.auth.signOut();
    setNeeds2fa(false); setOtp(""); setPendingSecret("");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Check for referral code in URL (e.g. /auth?ref=KEMET-XXXXXX)
    const refCode = new URLSearchParams(window.location.search).get("ref");
    const { data: signUpData, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { display_name: name } },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created. Check your email to verify.");

    // Credit referrer if a valid code was provided
    if (refCode && signUpData.user) {
      try {
        const { data: refs } = await supabase
          .from("referrals")
          .select("id, total_referred, total_earned, reward_amount")
          .eq("code", refCode)
          .limit(1);
        const ref = refs?.[0];
        if (ref) {
          await supabase
            .from("referrals")
            .update({
              total_referred: (ref.total_referred || 0) + 1,
              total_earned: (ref.total_earned || 0) + (ref.reward_amount || 0),
            })
            .eq("id", ref.id);
        }
      } catch { /* non-blocking */ }
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error("Google sign-in failed: " + error.message);
  };

  if (needs2fa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6 space-y-4 border-primary/30">
          <h1 className="text-xl font-bold text-primary text-center">🔐 Two-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground text-center">أدخل الكود من تطبيق المصادقة</p>
          <Input value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} placeholder="123456" className="text-center text-2xl tracking-widest" />
          <Button onClick={verify2fa} className="w-full">تحقق</Button>
          <Button variant="ghost" onClick={cancel2fa} className="w-full">إلغاء</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 space-y-4 border-primary/30">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary" style={{ fontFamily: "Orbitron" }}>KemetRise</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your command center</p>
        </div>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-3 mt-4">
              <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
              <Button type="submit" disabled={busy} className="w-full">{busy ? "..." : "Sign In"}</Button>
              <button type="button" onClick={async () => {
                if (!email) { toast.error("أدخل البريد أولاً"); return; }
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                if (error) toast.error(error.message); else toast.success("تم إرسال رابط إعادة التعيين");
              }} className="text-xs text-primary hover:underline w-full text-center">نسيت كلمة المرور؟</button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-3 mt-4">
              <div><Label>Display Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
              <Button type="submit" disabled={busy} className="w-full">{busy ? "..." : "Create Account"}</Button>
            </form>
          </TabsContent>
        </Tabs>
        <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-primary/20" /></div><div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">OR</span></div></div>
        <Button variant="outline" onClick={google} className="w-full">Continue with Google</Button>
      </Card>
    </div>
  );
}
