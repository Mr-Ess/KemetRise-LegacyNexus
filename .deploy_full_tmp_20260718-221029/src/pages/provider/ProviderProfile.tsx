import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/context/UserRoleContext";
import ProviderLayout from "@/layouts/ProviderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Briefcase, Save, Check, Globe, Phone, Mail, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["retail", "services", "food", "tech", "education", "health", "finance", "real_estate", "other"];

export default function ProviderProfile() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { profile, providerProfile } = useRole();
  const db = supabase as any;

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    business_name: "", description: "", category: "other",
    contact_email: "", contact_phone: "", website_url: "",
    address: "", tax_id: "", bank_iban: "",
  });

  useEffect(() => {
    if (providerProfile) {
      setForm({
        business_name: providerProfile.business_name || "",
        description: providerProfile.description || "",
        category: (providerProfile as any).category || "other",
        contact_email: (providerProfile as any).contact_email || "",
        contact_phone: (providerProfile as any).contact_phone || "",
        website_url: (providerProfile as any).website_url || "",
        address: (providerProfile as any).address || "",
        tax_id: (providerProfile as any).tax_id || "",
        bank_iban: (providerProfile as any).bank_iban || "",
      });
    }
  }, [providerProfile]);

  const save = async () => {
    if (!(providerProfile as any)?.id) return toast.error(R ? "لم يتم العثور على ملف تجاري" : "No provider profile found");
    setLoading(true);
    const { error } = await db.from("provider_profiles").update({ ...form, updated_at: new Date().toISOString() }).eq("id", (providerProfile as any).id);
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
            <Briefcase className="w-6 h-6 text-blue-400" />
            {R ? "الملف التجاري" : "Business Profile"}
          </h1>
          <p className="text-sm text-muted-foreground">{R ? "بيانات نشاطك التجاري العامة" : "Your public business information"}</p>
        </div>

        {/* Approval status */}
        {providerProfile && (
          <div className={cn("flex items-center gap-3 p-3 rounded-lg border", (providerProfile as any).is_approved ? "bg-green-500/5 border-green-500/20" : "bg-yellow-500/5 border-yellow-500/20")}>
            <Star className={cn("w-5 h-5", (providerProfile as any).is_approved ? "text-green-400" : "text-yellow-400")} />
            <div>
              <p className="text-sm font-semibold">{(providerProfile as any).is_approved ? (R ? "حساب معتمد" : "Approved Account") : (R ? "قيد المراجعة" : "Pending Approval")}</p>
              {(providerProfile as any).rating > 0 && <p className="text-xs text-muted-foreground">{R ? "التقييم:" : "Rating:"} {(providerProfile as any).rating.toFixed(1)} ★</p>}
            </div>
            <Badge variant="outline" className={cn("ml-auto text-xs", (providerProfile as any).is_approved ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30")}>
              {(providerProfile as any).is_approved ? (R ? "معتمد" : "Approved") : (R ? "معلق" : "Pending")}
            </Badge>
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "معلومات النشاط التجاري" : "Business Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{R ? "اسم النشاط التجاري *" : "Business Name *"}</Label><Input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} className="mt-1" /></div>
            <div><Label>{R ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1" /></div>
            <div>
              <Label>{R ? "الفئة" : "Category"}</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{R ? "البريد" : "Contact Email"}</Label><Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} className="mt-1" /></div>
              <div><Label>{R ? "الهاتف" : "Phone"}</Label><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>{R ? "الموقع الإلكتروني" : "Website"}</Label><Input type="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} className="mt-1" placeholder="https://" /></div>
            <div><Label>{R ? "العنوان" : "Address"}</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "البيانات المالية" : "Financial Data"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{R ? "الرقم الضريبي" : "Tax ID"}</Label><Input value={form.tax_id} onChange={e => setForm({ ...form, tax_id: e.target.value })} className="mt-1" /></div>
            <div><Label>{R ? "رقم الحساب المصرفي (IBAN)" : "Bank IBAN"}</Label><Input value={form.bank_iban} onChange={e => setForm({ ...form, bank_iban: e.target.value })} className="mt-1" placeholder="SA..." /></div>
          </CardContent>
        </Card>

        <Button onClick={save} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? (R ? "تم الحفظ!" : "Saved!") : (R ? "حفظ الملف التجاري" : "Save Business Profile")}
        </Button>
      </div>
    </ProviderLayout>
  );
}
