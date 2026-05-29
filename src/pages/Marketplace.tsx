import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, Star, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

export default function Marketplace() {
  const nav = useNavigate();
  const [apps, setApps] = useState<any[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("All");

  useEffect(() => {
    (async () => {
      const data = await tenantDb.select("marketplace_apps", { orderBy: "featured", ascending: false });
      setApps((data as any) || []);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const ins = await tenantDb.select("installed_apps", { eq: { user_id: user.id } });
        setInstalled(new Set((ins as any)?.map((x: any) => x.app_id) || []));
      }
    })();
  }, []);

  const install = async (app: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Sign in required");
    const isInstalled = installed.has(app.id);
    if (isInstalled) {
      await tenantDb.remove("installed_apps", { eq: { user_id: user.id, app_id: app.id } });
      setInstalled(s => { const n = new Set(s); n.delete(app.id); return n; });
      toast.success(`${app.name} uninstalled`);
    } else {
      await tenantDb.insert("installed_apps", { user_id: user.id, app_id: app.id });
      setInstalled(s => new Set(s).add(app.id));
      toast.success(`${app.name} installed`);
    }
  };

  const cats = ["All", ...Array.from(new Set(apps.map(a => a.category).filter(Boolean)))];
  const filtered = apps.filter(a =>
    (cat === "All" || a.category === cat) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => nav("/")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl text-primary flex items-center gap-2"><Store className="w-5 h-5" />Marketplace</h1>
            <p className="text-sm text-muted-foreground">Extend KemetRise with apps and integrations.</p>
          </div>
          <Input placeholder="Search apps..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {cats.map(c => (
            <Button key={c} variant={cat === c ? "default" : "outline"} size="sm" onClick={() => setCat(c)}>{c}</Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(app => {
            const isI = installed.has(app.id);
            return (
              <Card key={app.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{app.icon}</div>
                  {app.featured && <Badge>Featured</Badge>}
                </div>
                <h3 className="font-display text-lg text-primary">{app.name}</h3>
                <p className="text-xs text-muted-foreground mb-3 flex-1">{app.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary fill-primary" />{app.rating}</span>
                  <span>{app.installs?.toLocaleString()} installs</span>
                  <span className="ml-auto font-medium">{app.price_cents > 0 ? `$${(app.price_cents/100).toFixed(2)}/mo` : "Free"}</span>
                </div>
                <Button onClick={() => install(app)} variant={isI ? "outline" : "default"} className="w-full">
                  {isI ? <><Check className="w-4 h-4 mr-2" />Installed</> : <><Download className="w-4 h-4 mr-2" />Install</>}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
