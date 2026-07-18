import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useTenant, Sector } from "@/context/TenantContext";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Edit3, Save, X, Layers, Zap, AlertTriangle,
  Stethoscope, Dumbbell, Scale, Landmark, MapPin, GraduationCap,
  ShoppingCart, Briefcase, CheckCircle, Globe, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICONS: Record<string, any> = {
  stethoscope: Stethoscope, dumbbell: Dumbbell, scale: Scale,
  landmark: Landmark, "map-pin": MapPin, "graduation-cap": GraduationCap,
  "shopping-cart": ShoppingCart, briefcase: Briefcase, layers: Layers, globe: Globe,
};

const COLOR_PRESETS = ["#EF4444","#10B981","#6366F1","#F59E0B","#14B8A6","#8B5CF6","#F97316","#EC4899","#D4A017","#06B6D4"];

type EditState = Partial<Sector> & { isNew?: boolean };

export default function SectorFactory() {
  const { i18n } = useTranslation();
  const { allSectors, reloadSectors } = useTenant();
  const db = supabase as any;
  const R = i18n.language === "ar";
  const [editing, setEditing] = useState<Record<string, EditState>>({});
  const [newSector, setNewSector] = useState<EditState | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const toggleActive = async (sector: Sector) => {
    setSaving(sector.id);
    const { error } = await db.from("sectors").update({ is_active: !sector.is_active }).eq("id", sector.id);
    if (error) toast.error(R ? "حدث خطأ" : "Error updating sector");
    else {
      toast.success(R ? (sector.is_active ? "تم تعطيل القطاع" : "تم تفعيل القطاع") : (sector.is_active ? "Sector deactivated" : "Sector activated"));
      reloadSectors();
    }
    setSaving(null);
  };

  const saveSector = async (sector: EditState) => {
    setSaving(sector.id || "new");
    const payload = {
      code: sector.code?.toLowerCase().replace(/\s+/g,"-"),
      name: sector.name, name_ar: sector.name_ar,
      icon: sector.icon || "layers",
      color: sector.color || "#D4A017",
      modules: sector.modules || [],
      sort_order: sector.sort_order || 99,
    };
    const { error } = sector.isNew
      ? await db.from("sectors").insert(payload)
      : await db.from("sectors").update(payload).eq("id", sector.id);
    if (error) toast.error(error.message);
    else {
      toast.success(R ? "تم الحفظ بنجاح" : "Saved successfully");
      setEditing(p => { const n = {...p}; if(sector.id) delete n[sector.id]; return n; });
      setNewSector(null);
      reloadSectors();
    }
    setSaving(null);
  };

  const deleteSector = async (id: string) => {
    if (!confirm(R ? "هل أنت متأكد؟" : "Are you sure?")) return;
    await db.from("sectors").delete().eq("id", id);
    toast.success(R ? "تم الحذف" : "Deleted");
    reloadSectors();
  };

  const SectorIcon = ({ code }: { code: string }) => {
    const Icon = ICONS[code] || Layers;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {R ? "مصنع القطاعات الديناميكي" : "Dynamic Sector Factory"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {R ? "إدارة وتفعيل القطاعات التي تُحقن في جميع أجزاء المنصة فوراً" : "Manage & activate sectors that instantly inject specialized modules across the platform"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reloadSectors} className="gap-2"><RefreshCw className="w-3.5 h-3.5" /></Button>
            <Button size="sm" onClick={() => setNewSector({ isNew: true, code:"", name:"", name_ar:"", icon:"layers", color:"#D4A017", modules:[] })} className="gap-2">
              <Plus className="w-3.5 h-3.5" />{R ? "قطاع جديد" : "New Sector"}
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: R ? "إجمالي القطاعات" : "Total Sectors", value: allSectors.length, color: "text-foreground" },
            { label: R ? "قطاعات نشطة" : "Active Sectors",   value: allSectors.filter(s => s.is_active).length, color: "text-green-400" },
            { label: R ? "قطاعات معطلة" : "Inactive",         value: allSectors.filter(s => !s.is_active).length, color: "text-muted-foreground" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className={cn("text-2xl font-bold font-display", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New sector form */}
        {newSector && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />{R ? "إضافة قطاع جديد" : "Add New Sector"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SectorForm sector={newSector} onChange={setNewSector}
                onSave={() => saveSector(newSector)} onCancel={() => setNewSector(null)}
                saving={saving === "new"} R={R} />
            </CardContent>
          </Card>
        )}

        {/* Sectors grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allSectors.map(sector => {
            const ed = editing[sector.id];
            const isEditing = !!ed;

            return (
              <Card key={sector.id} className={cn("border transition-all", sector.is_active ? "border-border" : "border-border/40 opacity-60")}>
                <CardContent className="p-4">
                  {isEditing ? (
                    <SectorForm sector={ed} onChange={s => setEditing(p => ({ ...p, [sector.id]: s }))}
                      onSave={() => saveSector({ ...ed, id: sector.id })} onCancel={() => setEditing(p => { const n={...p}; delete n[sector.id]; return n; })}
                      saving={saving === sector.id} R={R} />
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sector.color + "20", border: `1px solid ${sector.color}40` }}>
                            <SectorIcon code={sector.icon} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{R ? sector.name_ar : sector.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{sector.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditing(p => ({ ...p, [sector.id]: { ...sector } }))}
                            className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteSector(sector.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Modules */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(sector.modules || []).slice(0, 4).map((m: string) => (
                          <Badge key={m} className="text-[8px] px-1.5 py-0 bg-secondary/60">{m}</Badge>
                        ))}
                        {(sector.modules || []).length > 4 && (
                          <Badge className="text-[8px] px-1.5 py-0 bg-secondary/60">+{(sector.modules || []).length - 4}</Badge>
                        )}
                      </div>

                      {/* Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{R ? "تفعيل عبر المنصة" : "Activate platform-wide"}</span>
                        <div className="flex items-center gap-2">
                          {sector.is_active && <Zap className="w-3.5 h-3.5 text-green-400" />}
                          <Switch
                            checked={sector.is_active}
                            disabled={saving === sector.id}
                            onCheckedChange={() => toggleActive(sector)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

function SectorForm({ sector, onChange, onSave, onCancel, saving, R }: {
  sector: EditState; onChange: (s: EditState) => void;
  onSave: () => void; onCancel: () => void; saving: boolean; R: boolean;
}) {
  const COLOR_PRESETS = ["#EF4444","#10B981","#6366F1","#F59E0B","#14B8A6","#8B5CF6","#F97316","#EC4899","#D4A017","#06B6D4"];
  const [modInput, setModInput] = useState("");

  const addModule = () => {
    if (!modInput.trim()) return;
    onChange({ ...sector, modules: [...(sector.modules || []), modInput.trim()] });
    setModInput("");
  };
  const removeModule = (m: string) => onChange({ ...sector, modules: (sector.modules || []).filter((x: string) => x !== m) });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{R ? "الكود (EN)" : "Code (slug)"}</Label>
          <Input value={sector.code || ""} onChange={e => onChange({ ...sector, code: e.target.value })} placeholder="e.g. medical" className="text-xs h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{R ? "الأيقونة" : "Icon key"}</Label>
          <Input value={sector.icon || ""} onChange={e => onChange({ ...sector, icon: e.target.value })} placeholder="e.g. stethoscope" className="text-xs h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{R ? "الاسم بالإنجليزية" : "Name (English)"}</Label>
          <Input value={sector.name || ""} onChange={e => onChange({ ...sector, name: e.target.value })} placeholder="Medical" className="text-xs h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{R ? "الاسم بالعربية" : "Name (Arabic)"}</Label>
          <Input value={sector.name_ar || ""} onChange={e => onChange({ ...sector, name_ar: e.target.value })} placeholder="الطب" className="text-xs h-8" />
        </div>
      </div>
      {/* Color */}
      <div>
        <Label className="text-xs mb-2 block">{R ? "اللون" : "Color"}</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.map(c => <button key={c} onClick={() => onChange({ ...sector, color: c })} className={cn("w-6 h-6 rounded-full border-2 transition-all", sector.color === c ? "border-white scale-110" : "border-transparent")} style={{ backgroundColor: c }} />)}
        </div>
      </div>
      {/* Modules */}
      <div>
        <Label className="text-xs mb-2 block">{R ? "الوحدات المُحقنة" : "Injected Modules"}</Label>
        <div className="flex gap-2 mb-2">
          <Input value={modInput} onChange={e => setModInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addModule()} placeholder={R ? "اسم الوحدة..." : "Module name..."} className="text-xs h-7 flex-1" />
          <Button size="sm" onClick={addModule} className="h-7 px-2"><Plus className="w-3 h-3" /></Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {(sector.modules || []).map((m: string) => (
            <Badge key={m} className="text-[9px] px-2 py-0.5 flex items-center gap-1 bg-secondary">
              {m}<button onClick={() => removeModule(m)}><X className="w-2.5 h-2.5" /></button>
            </Badge>
          ))}
        </div>
      </div>
      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} disabled={saving} className="gap-2"><Save className="w-3.5 h-3.5" />{R ? "حفظ" : "Save"}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}><X className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}
