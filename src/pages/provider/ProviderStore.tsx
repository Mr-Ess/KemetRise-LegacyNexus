import { useEffect, useState, useCallback } from "react";
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
import { Store, Save, Package, Star, TrendingUp, RefreshCcw, Check, Globe, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProviderStore() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { profile, providerProfile } = useRole();
  const db = supabase as any;

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ listings: 0, activeListings: 0, totalOrders: 0, rating: 0 });
  const [storeSettings, setStoreSettings] = useState({ store_name: "", store_description: "", store_banner_url: "", store_logo_url: "", store_slug: "", is_open: true });

  const loadStats = useCallback(async () => {
    if (!profile) return;
    const [{ count: listings }, { count: activeListings }, { count: orders }] = await Promise.all([
      db.from("mp_listings").select("*", { count: "exact", head: true }).eq("publisher_user_id", profile.id),
      db.from("mp_listings").select("*", { count: "exact", head: true }).eq("publisher_user_id", profile.id).eq("is_active", true),
      // Orders via join: mp_listings → mp_order_items → mp_orders
      db.from("mp_listings").select("id").eq("publisher_user_id", profile.id).then(async ({ data: ml }) => {
        const ids = (ml ?? []).map((l: any) => l.id);
        if (!ids.length) return { count: 0 };
        const { data: oi } = await db.from("mp_order_items").select("order_id").in("listing_id", ids);
        const oIds = [...new Set((oi ?? []).map((x: any) => x.order_id))];
        return oIds.length ? db.from("mp_orders").select("*", { count: "exact", head: true }).in("id", oIds) : { count: 0 };
      }),
    ]);
    setStats({ listings: listings ?? 0, activeListings: activeListings ?? 0, totalOrders: orders ?? 0, rating: (providerProfile as any)?.rating ?? 0 });
  }, [profile, providerProfile]);

  useEffect(() => {
    if (providerProfile) {
      setStoreSettings({
        store_name: (providerProfile as any).store_name || providerProfile.business_name || "",
        store_description: (providerProfile as any).store_description || providerProfile.description || "",
        store_banner_url: (providerProfile as any).store_banner_url || "",
        store_logo_url: (providerProfile as any).store_logo_url || (providerProfile as any).logo_url || "",
        store_slug: (providerProfile as any).store_slug || "",
        is_open: (providerProfile as any).is_open !== false,
      });
    }
    loadStats();
  }, [providerProfile, loadStats]);

  const save = async () => {
    if (!(providerProfile as any)?.id) return;
    setLoading(true);
    const { error } = await db.from("provider_profiles").update({ ...storeSettings, updated_at: new Date().toISOString() }).eq("id", (providerProfile as any).id);
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
            <Store className="w-6 h-6 text-blue-400" />
            {R ? "متجري" : "My Store"}
          </h1>
          <p className="text-sm text-muted-foreground">{R ? "إدارة واجهة متجرك" : "Manage your store storefront"}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: R ? "الإدراجات" : "Listings",  value: stats.listings,      color: "text-blue-400"   },
            { label: R ? "نشطة" : "Active",          value: stats.activeListings,color: "text-green-400"  },
            { label: R ? "الطلبات" : "Orders",       value: stats.totalOrders,   color: "text-indigo-400" },
            { label: R ? "التقييم" : "Rating",       value: stats.rating > 0 ? stats.rating.toFixed(1) : "—", color: "text-yellow-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-3 text-center">
                <div className={cn("text-xl font-bold font-display", s.color)}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Store settings */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit className="w-4 h-4 text-blue-400" />
              {R ? "إعدادات المتجر" : "Store Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{R ? "اسم المتجر" : "Store Name"}</Label><Input value={storeSettings.store_name} onChange={e => setStoreSettings({ ...storeSettings, store_name: e.target.value })} className="mt-1" /></div>
            <div><Label>{R ? "وصف المتجر" : "Store Description"}</Label><Textarea value={storeSettings.store_description} onChange={e => setStoreSettings({ ...storeSettings, store_description: e.target.value })} rows={2} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{R ? "شعار المتجر (URL)" : "Store Logo URL"}</Label><Input type="url" value={storeSettings.store_logo_url} onChange={e => setStoreSettings({ ...storeSettings, store_logo_url: e.target.value })} className="mt-1" placeholder="https://" /></div>
              <div><Label>{R ? "صورة البانر (URL)" : "Banner URL"}</Label><Input type="url" value={storeSettings.store_banner_url} onChange={e => setStoreSettings({ ...storeSettings, store_banner_url: e.target.value })} className="mt-1" placeholder="https://" /></div>
            </div>
            <div><Label>{R ? "رابط المتجر (slug)" : "Store Slug"}</Label><Input value={storeSettings.store_slug} onChange={e => setStoreSettings({ ...storeSettings, store_slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className="mt-1" placeholder="my-store" /></div>
            <div className="flex items-center gap-3">
              <Label>{R ? "حالة المتجر" : "Store Status"}</Label>
              <Select value={storeSettings.is_open ? "open" : "closed"} onValueChange={v => setStoreSettings({ ...storeSettings, is_open: v === "open" })}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{R ? "مفتوح" : "Open"}</SelectItem>
                  <SelectItem value="closed">{R ? "مغلق" : "Closed"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? (R ? "تم الحفظ!" : "Saved!") : (R ? "حفظ" : "Save Store")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProviderLayout>
  );
}
