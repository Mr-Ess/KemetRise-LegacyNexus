import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { getTenantScope } from "@/lib/tenantScope";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

export default function WhiteLabel() {
  const nav = useNavigate();
  const [form, setForm] = useState<any>({
    brand_name: "", logo_url: "", primary_color: "#d4af37", accent_color: "#8b0000", custom_domain: "", hide_branding: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const rows = await tenantDb.select("white_label", { limit: 1 });
        const data = rows[0] || null;
        if (data) setForm(data);
      } catch {
        // White label settings are only available for authenticated users.
      }
    })();
  }, []);

  const save = async () => {
    try {
      const scope = await getTenantScope();
      const payload = {
        ...form,
        user_id: scope.userId,
        client_id: scope.clientId,
        brand_id: scope.brandId,
        user_name: scope.userName,
        updated_at: new Date().toISOString(),
      };
      const onConflict = scope.brandId ? "brand_id" : "user_id";
      await tenantDb.upsert("white_label", payload as any, { onConflict });
      toast.success("Branding saved");
    } catch {
      toast.error("Not signed in");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => nav("/settings")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <h1 className="font-display text-2xl text-primary mb-2 flex items-center gap-2"><Globe className="w-5 h-5" />White Label</h1>
        <p className="text-sm text-muted-foreground mb-6">Customize the platform with your own branding for your customers.</p>

        <Card className="p-6 space-y-4">
          <div><Label>Brand Name</Label><Input value={form.brand_name || ""} onChange={e => setForm({ ...form, brand_name: e.target.value })} placeholder="Acme Corp" /></div>
          <div><Label>Logo URL</Label><Input value={form.logo_url || ""} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-16 h-10 p-1" />
                <Input value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} className="w-16 h-10 p-1" />
                <Input value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} />
              </div>
            </div>
          </div>
          <div><Label>Custom Domain</Label><Input value={form.custom_domain || ""} onChange={e => setForm({ ...form, custom_domain: e.target.value })} placeholder="app.yourdomain.com" /></div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <div className="font-body font-medium">Hide "Powered by KemetRise"</div>
              <div className="text-xs text-muted-foreground">Premium plan required</div>
            </div>
            <Switch checked={form.hide_branding} onCheckedChange={c => setForm({ ...form, hide_branding: c })} />
          </div>
          <Button onClick={save} className="w-full"><Save className="w-4 h-4 mr-2" />Save Branding</Button>
        </Card>
      </div>
    </div>
  );
}
