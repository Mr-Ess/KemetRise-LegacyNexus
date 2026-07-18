import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AgentLayout from "@/layouts/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCcw, Globe, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgentRegions() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [clientsByRegion, setClientsByRegion] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: ap } = await db.from("agent_profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(ap);
    if (ap) {
      const { data: clients } = await db.from("agent_clients").select("tags").eq("agent_id", ap.id);
      const map: Record<string, number> = {};
      for (const c of clients ?? []) {
        for (const tag of (c.tags ?? [])) {
          map[tag] = (map[tag] || 0) + 1;
        }
      }
      setClientsByRegion(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const regions: string[] = Array.isArray(profile?.regions) ? profile.regions : [];

  return (
    <AgentLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-400" />
              {R ? "مناطقي" : "My Regions"}
            </h1>
            <p className="text-sm text-muted-foreground">{regions.length} {R ? "منطقة مخصصة لك" : "assigned region(s)"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : regions.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{R ? "لا توجد مناطق مخصصة لك بعد" : "No regions assigned yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">{R ? "تواصل مع مديرك لتخصيص مناطق" : "Contact your manager to assign regions"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map(region => (
              <Card key={region} className="border-border/50 hover:border-emerald-500/30 transition-colors">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{region}</p>
                        <p className="text-xs text-muted-foreground">{R ? "المنطقة" : "Region"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                      {R ? "نشط" : "Active"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {clientsByRegion[region] ?? 0} {R ? "عميل بهذا التاغ" : "tagged clients"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* All tags from clients */}
        {Object.keys(clientsByRegion).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{R ? "كل التاغات من العملاء" : "All Client Tags"}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(clientsByRegion).map(([tag, count]) => (
                <Badge key={tag} variant="outline" className={cn("text-xs", regions.includes(tag) ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-muted-foreground")}>
                  {tag} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </AgentLayout>
  );
}
