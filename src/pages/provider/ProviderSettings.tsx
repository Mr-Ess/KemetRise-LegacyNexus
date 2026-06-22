import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/context/UserRoleContext";
import ProviderLayout from "@/layouts/ProviderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Save, User, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProviderSettings() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const { providerProfile } = useRole();
  const db = supabase as any;

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", email: "", avatar_url: "" });
  const [notifs, setNotifs] = useState({ email_orders: true, email_reviews: true, email_messages: true });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await db.from("user_profiles").select("full_name,email,avatar_url").eq("user_id", user.id).maybeSingle();
      if (data) setProfile({ full_name: data.full_name || "", email: data.email || user.email || "", avatar_url: data.avatar_url || "" });
    };
    load();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await db.from("user_profiles").update({ full_name: profile.full_name, avatar_url: profile.avatar_url, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    toast.success(R ? "تم الحفظ" : "Saved");
  };

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-black flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            {R ? "الإعدادات" : "Settings"}
          </h1>
          <p className="text-sm text-muted-foreground">{R ? "إعدادات حسابك كمزود خدمة" : "Your provider account settings"}</p>
        </div>

        {/* Profile */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              {R ? "ملفي الشخصي" : "My Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{R ? "الاسم الكامل" : "Full Name"}</Label><Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>{R ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={profile.email} disabled className="mt-1 opacity-60" />
              <p className="text-xs text-muted-foreground mt-1">{R ? "لا يمكن تغيير البريد" : "Email cannot be changed"}</p>
            </div>
            <div><Label>{R ? "رابط الصورة الشخصية" : "Avatar URL"}</Label><Input type="url" value={profile.avatar_url} onChange={e => setProfile({ ...profile, avatar_url: e.target.value })} className="mt-1" placeholder="https://" /></div>
            <Button onClick={saveProfile} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? (R ? "تم الحفظ!" : "Saved!") : (R ? "حفظ" : "Save")}
            </Button>
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "تفضيلات الإشعارات" : "Notification Preferences"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "email_orders",   label: R ? "إشعارات الطلبات" : "Order notifications"   },
              { key: "email_reviews",  label: R ? "إشعارات التقييمات" : "Review notifications" },
              { key: "email_messages", label: R ? "إشعارات الرسائل" : "Message notifications" },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between">
                <Label className="font-normal cursor-pointer">{n.label}</Label>
                <button
                  onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                  className={cn("w-10 h-5 rounded-full transition-colors relative", notifs[n.key as keyof typeof notifs] ? "bg-blue-500" : "bg-muted")}>
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow", notifs[n.key as keyof typeof notifs] ? "left-5.5 translate-x-0.5" : "left-0.5")} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              {R ? "معلومات الحساب" : "Account Info"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{R ? "معرف المستخدم" : "User ID"}</span>
              <span className="font-mono text-xs">{user?.id?.slice(0, 16)}…</span>
            </div>
            <Separator className="opacity-30" />
            {(providerProfile as any)?.id && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>{R ? "حالة الحساب" : "Account Status"}</span>
                  <span className={cn("text-xs font-semibold", (providerProfile as any).is_approved ? "text-green-400" : "text-yellow-400")}>
                    {(providerProfile as any).is_approved ? (R ? "معتمد" : "Approved") : (R ? "قيد المراجعة" : "Pending")}
                  </span>
                </div>
                <Separator className="opacity-30" />
              </>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>{R ? "آخر تسجيل دخول" : "Last Sign In"}</span>
              <span className="text-xs">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString(R ? "ar-EG" : "en-US") : "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProviderLayout>
  );
}
