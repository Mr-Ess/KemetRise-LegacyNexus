import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import VendorLayout from "@/layouts/VendorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, Store, User, Shield, Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorSettings() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [store, setStore] = useState({ business_name: "", description: "", contact_email: "", contact_phone: "", bank_iban: "" });
  const [profile, setProfile] = useState({ full_name: "", email: "", avatar_url: "" });
  const [providerProfile, setProviderProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: pp }, { data: up }, { data: w }] = await Promise.all([
        db.from("provider_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        db.from("user_profiles").select("full_name,email,avatar_url").eq("user_id", user.id).maybeSingle(),
        db.from("vendor_wallets").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setProviderProfile(pp);
      setWallet(w);
      if (pp) setStore({ business_name: pp.business_name || "", description: pp.description || "", contact_email: pp.contact_email || "", contact_phone: pp.contact_phone || "", bank_iban: pp.bank_iban || "" });
      if (up) setProfile({ full_name: up.full_name || "", email: up.email || user.email || "", avatar_url: up.avatar_url || "" });
    };
    load();
  }, [user]);

  const saveStore = async () => {
    if (!providerProfile?.id) return;
    setLoading(true);
    const { error } = await db.from("provider_profiles").update({ business_name: store.business_name, description: store.description, contact_email: store.contact_email, contact_phone: store.contact_phone, bank_iban: store.bank_iban, updated_at: new Date().toISOString() }).eq("id", providerProfile.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    toast.success(R ? "تم الحفظ" : "Saved");
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await db.from("user_profiles").update({ full_name: profile.full_name, avatar_url: profile.avatar_url, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم تحديث الملف" : "Profile updated");
  };

  return (
    <VendorLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-black flex items-center gap-2">
            <Settings className="w-6 h-6 text-orange-400" />
            {R ? "الإعدادات" : "Settings"}
          </h1>
          <p className="text-sm text-muted-foreground">{R ? "إدارة متجرك وحسابك" : "Manage your store and account"}</p>
        </div>

        {/* Wallet snapshot */}
        {wallet && (
          <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-transparent">
            <CardContent className="p-4 flex items-center gap-4">
              <CreditCard className="w-8 h-8 text-orange-400" />
              <div className="flex-1 grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">{R ? "الرصيد" : "Balance"}</p><p className="font-bold text-green-400">${((wallet.balance_cents || 0) / 100).toFixed(2)}</p></div>
                <div><p className="text-xs text-muted-foreground">{R ? "معلق" : "Pending"}</p><p className="font-bold text-yellow-400">${((wallet.pending_cents || 0) / 100).toFixed(2)}</p></div>
                <div><p className="text-xs text-muted-foreground">{R ? "الرسوم %" : "Fee %"}</p><p className="font-bold text-orange-400">{((wallet.fee_rate || 0.05) * 100).toFixed(0)}%</p></div>
              </div>
              {wallet.is_frozen && <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">{R ? "مجمّد" : "Frozen"}</Badge>}
            </CardContent>
          </Card>
        )}

        {/* Store info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-orange-400" />
              {R ? "معلومات المتجر" : "Store Info"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{R ? "اسم المتجر / النشاط التجاري" : "Business Name"}</Label><Input value={store.business_name} onChange={e => setStore({ ...store, business_name: e.target.value })} className="mt-1" /></div>
            <div><Label>{R ? "الوصف" : "Description"}</Label><Textarea value={store.description} onChange={e => setStore({ ...store, description: e.target.value })} className="mt-1" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{R ? "البريد الإلكتروني للتواصل" : "Contact Email"}</Label><Input type="email" value={store.contact_email} onChange={e => setStore({ ...store, contact_email: e.target.value })} className="mt-1" /></div>
              <div><Label>{R ? "رقم الهاتف" : "Phone"}</Label><Input value={store.contact_phone} onChange={e => setStore({ ...store, contact_phone: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>{R ? "رقم الحساب المصرفي (IBAN)" : "Bank IBAN"}</Label><Input value={store.bank_iban} onChange={e => setStore({ ...store, bank_iban: e.target.value })} className="mt-1" placeholder="SA..." /></div>
            <Button onClick={saveStore} disabled={loading || !providerProfile} className="gap-2 bg-orange-600 hover:bg-orange-700">
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? (R ? "تم الحفظ!" : "Saved!") : (R ? "حفظ" : "Save Store")}
            </Button>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-orange-400" />
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
            <Button onClick={saveProfile} disabled={loading} className="gap-2 bg-orange-600 hover:bg-orange-700">
              <Save className="w-4 h-4" />{R ? "تحديث الملف" : "Update Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-400" />
              {R ? "معلومات الحساب" : "Account Info"}
            </CardTitle>
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
      </div>
    </VendorLayout>
  );
}
