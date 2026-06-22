import { useTranslation } from "react-i18next";
import { useTenant } from "@/context/TenantContext";
import PartnerLayout from "@/layouts/PartnerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, CheckCircle, XCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PartnerSectors() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { activeSectors } = useTenant();

  const COLOR_MAP: Record<string, string> = {
    indigo: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    green: "bg-green-500/10 border-green-500/30 text-green-400",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    pink: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    teal: "bg-teal-500/10 border-teal-500/30 text-teal-400",
    cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  };

  return (
    <PartnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-400" />
              {R ? "القطاعات المفعّلة" : "Active Sectors"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeSectors.length} {R ? "قطاع مفعّل" : "active sector(s)"}
            </p>
          </div>
        </div>

        {activeSectors.length === 0 ? (
          <div className="text-center py-20">
            <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{R ? "لا توجد قطاعات مفعّلة حالياً" : "No active sectors at this time"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSectors.map(sector => {
              const colorClass = COLOR_MAP[sector.color ?? "indigo"] ?? COLOR_MAP.indigo;
              const modules: string[] = Array.isArray(sector.modules) ? sector.modules as string[] : [];
              return (
                <Card key={sector.id} className="border-border/50 hover:border-indigo-500/30 transition-colors">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", colorClass)}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{R ? sector.name_ar : sector.name}</p>
                          <p className="text-xs text-muted-foreground">{sector.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", sector.is_active ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-muted-foreground")}>
                        {sector.is_active ? (R ? "نشط" : "Active") : (R ? "معطّل" : "Inactive")}
                      </Badge>
                    </div>

                    {modules.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground mb-2 font-medium tracking-wider">
                          {R ? "الوحدات" : "Modules"} ({modules.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {modules.map(mod => (
                            <Badge key={mod} variant="outline" className="text-[10px] text-muted-foreground">
                              <Package className="w-2.5 h-2.5 mr-1" />{mod}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                      {sector.is_active ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {R ? "تحكم بالقطاع من لوحة الادارة" : "Manage sectors from Admin panel"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
