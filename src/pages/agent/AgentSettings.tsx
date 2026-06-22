import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AgentLayout from "@/layouts/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, User, Shield, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgentSettings() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [profile, setProfile] = useState({ full_name: "", email: "", avatar_url: "" });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: ap }, { data: up }] = await Promise.all([
        db.from("agent_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        db.from("user_profiles").select("full_name,email,avatar_url").eq("user_id", user.id).maybeSingle(),
      ]);
      setAgent(ap);
      if (up) setProfile({ full_name: up.full_name || "", email: up.email || user.email || "", avatar_url: up.avatar_url || "" });
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

  const regions: string[] = Array.isArray(agent?.regions) ? agent.regions : [];

  return (
    <AgentLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-black flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            {R ? "الإعدادات" : "Settings"}
          </h1>
          <p className="text-sm text-muted-foreground">{R ? "بيانات حسابك كوكيل" : "Your agent account settings"}</p>
        </div>

        {/* Agent info */}
        {agent && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {R ? "بيانات الوكيل" : "Agent Info"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">{R ? "رمز الوكيل" : "Agent Code"}</p>
                  <p className="font-mono font-bold text-emerald-400">{agent.agent_code}</p>
                </div>
                <Badge variant="outline" className={cn("text-xs", agent.status === "active" ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30")}>
                  {agent.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{R ? "نسبة العمولة" : "Commission Rate"}</p>
                  <p className="font-semibold text-emerald-400">{agent.commission_rate ?? 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{R ? "إجمالي العملاء" : "Total Clients"}</p>
                  <p className="font-semibold">{agent.total_clients ?? 0}</p>
                </div>
              </div>
              {regions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{R ? "المناطق المخصصة" : "Assigned Regions"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {regions.map(r => (
                      <Badge key={r} variant="outline" className="text-xs text-emerald-400 bg-emerald-500/10 border-emerald-500/30">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{R ? "للتعديل على بيانات الوكالة تواصل مع المدير" : "Contact your manager to update agency details"}</p>
            </CardContent>
          </Card>
        )}

        {/* Profile */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
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
            <Button onClick={saveProfile} disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? (R ? "تم الحفظ!" : "Saved!") : (R ? "حفظ" : "Save")}
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
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
    </AgentLayout>
  );
}
