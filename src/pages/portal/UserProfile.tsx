import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import UserPortalLayout from "@/layouts/UserPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Save, Check, Shield, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UserProfile() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", avatar_url: "", address: "", city: "", country: "" });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await db.from("user_profiles").select("full_name,phone,avatar_url,address,city,country").eq("user_id", user.id).maybeSingle();
      if (data) setForm({ full_name: data.full_name || "", phone: data.phone || "", avatar_url: data.avatar_url || "", address: data.address || "", city: data.city || "", country: data.country || "" });
    };
    load();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await db.from("user_profiles").upsert({ user_id: user.id, ...form, email: user.email, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    toast.success(R ? "تم حفظ الملف الشخصي" : "Profile saved");
  };

  return (
    <UserPortalLayout>
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-2xl font-display font-black flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            {R ? "حسابي" : "My Profile"}
          </h1>
          <p className="text-sm text-muted-foreground">{R ? "بيانات حسابك الشخصية" : "Your personal account details"}</p>
        </div>

        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center overflow-hidden">
            {form.avatar_url ? <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-primary">{form.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}</span>}
          </div>
          <div>
            <p className="text-sm font-semibold">{form.full_name || user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "المعلومات الشخصية" : "Personal Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{R ? "الاسم الكامل" : "Full Name"}</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>{R ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={user?.email || ""} disabled className="mt-1 opacity-60" />
              <p className="text-xs text-muted-foreground mt-1">{R ? "لا يمكن تغيير البريد من هنا" : "Email cannot be changed here"}</p>
            </div>
            <div><Label>{R ? "رقم الهاتف" : "Phone"}</Label><Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>{R ? "رابط الصورة الشخصية" : "Avatar URL"}</Label><Input type="url" value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} className="mt-1" placeholder="https://..." /></div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "العنوان" : "Address"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{R ? "العنوان" : "Street Address"}</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{R ? "المدينة" : "City"}</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
              <div><Label>{R ? "الدولة" : "Country"}</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="mt-1" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" />{R ? "معلومات الحساب" : "Account Info"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{R ? "معرف المستخدم" : "User ID"}</span>
              <span className="font-mono text-xs">{user?.id?.slice(0, 16)}…</span>
            </div>
            <Separator className="opacity-30" />
            <div className="flex justify-between text-muted-foreground">
              <span>{R ? "آخر تسجيل دخول" : "Last Sign In"}</span>
              <span className="text-xs">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString(R ? "ar-EG" : "en-US") : "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Button onClick={save} disabled={loading} className="gap-2 w-full sm:w-auto">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? (R ? "تم الحفظ!" : "Saved!") : (R ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>
    </UserPortalLayout>
  );
}
