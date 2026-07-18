import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/context/TenantContext";
import PartnerLayout from "@/layouts/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, Building2, User, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PartnerSettings() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const { partnerWorkspace } = useTenant();
  const db = supabase as any;

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ws, setWs] = useState({ name: "", workspace_code: "", contact_email: "", contact_phone: "" });
  const [profile, setProfile] = useState({ full_name: "", email: "", avatar_url: "" });

  useEffect(() => {
    if (partnerWorkspace) {
      setWs({
        name: String(partnerWorkspace.name ?? ""),
        workspace_code: String(partnerWorkspace.workspace_code ?? ""),
        contact_email: String((partnerWorkspace as any).contact_email ?? ""),
        contact_phone: String((partnerWorkspace as any).contact_phone ?? ""),
      });
    }
  }, [partnerWorkspace]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await db.from("user_profiles").select("full_name,email,avatar_url").eq("user_id", user.id).maybeSingle();
      if (data) setProfile({ full_name: data.full_name || "", email: data.email || user.email || "", avatar_url: data.avatar_url || "" });
    };
    load();
  }, [user]);

  const saveWorkspace = async () => {
    if (!partnerWorkspace?.id) return;
    setLoading(true);
    const { error } = await db.from("partner_workspaces")
      .update({ name: ws.name, contact_email: ws.contact_email, contact_phone: ws.contact_phone, updated_at: new Date().toISOString() })
      .eq("id", partnerWorkspace.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    toast.success(R ? "تم الحفظ" : "Saved");
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await db.from("user_profiles")
      .update({ full_name: profile.full_name, avatar_url: profile.avatar_url, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم تحديث الملف الشخصي" : "Profile updated");
  };

  return (
    <PartnerLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-black flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            {R ? "الإعدادات" : "Settings"}
          </h1>
          <p className="text-sm text-muted-foreground">{R ? "إدارة بيئة عملك وملفك الشخصي" : "Manage your workspace and profile"}</p>
        </div>

        {/* Workspace info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              {R ? "بيئة العمل" : "Workspace"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {partnerWorkspace && (
              <div className="flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{R ? "رمز بيئة العمل" : "Workspace Code"}</p>
                  <p className="font-mono text-sm">{ws.workspace_code || "—"}</p>
                </div>
                <Badge variant="outline" className={cn("text-xs", (partnerWorkspace as any).is_approved ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30")}>
                  {(partnerWorkspace as any).is_approved ? (R ? "معتمد" : "Approved") : (R ? "قيد المراجعة" : "Pending")}
                </Badge>
              </div>
            )}
            <div><Label>{R ? "اسم بيئة العمل" : "Workspace Name"}</Label><Input value={ws.name} onChange={e => setWs({ ...ws, name: e.target.value })} className="mt-1" /></div>
            <div><Label>{R ? "البريد الإلكتروني للتواصل" : "Contact Email"}</Label><Input type="email" value={ws.contact_email} onChange={e => setWs({ ...ws, contact_email: e.target.value })} className="mt-1" /></div>
            <div><Label>{R ? "رقم الهاتف" : "Contact Phone"}</Label><Input value={ws.contact_phone} onChange={e => setWs({ ...ws, contact_phone: e.target.value })} className="mt-1" /></div>
            <Button onClick={saveWorkspace} disabled={loading || !partnerWorkspace} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? (R ? "تم الحفظ!" : "Saved!") : (R ? "حفظ" : "Save Workspace")}
            </Button>
          </CardContent>
        </Card>

        {/* Profile info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              {R ? "ملفي الشخصي" : "My Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{R ? "الاسم الكامل" : "Full Name"}</Label><Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>{R ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={profile.email} disabled className="mt-1 opacity-60" />
              <p className="text-xs text-muted-foreground mt-1">{R ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}</p>
            </div>
            <div><Label>{R ? "رابط الصورة الشخصية" : "Avatar URL"}</Label><Input type="url" value={profile.avatar_url} onChange={e => setProfile({ ...profile, avatar_url: e.target.value })} className="mt-1" placeholder="https://" /></div>
            <Button onClick={saveProfile} disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4" />{R ? "تحديث الملف" : "Update Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Account info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
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
    </PartnerLayout>
  );
}
