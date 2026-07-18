import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { tenantDb } from "@/lib/tenantDb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_WIDGETS = [
  { id: "sacred", title: "Sacred Vault", visible: true },
  { id: "deadman", title: "Dead Man Switch", visible: true },
  { id: "tasks", title: "Hybrid Tasks", visible: true },
  { id: "chat", title: "Chat Hub", visible: true },
  { id: "branches", title: "Branch Activity", visible: true },
  { id: "finance", title: "Financial Overview", visible: true },
  { id: "analytics", title: "System Analytics", visible: true },
  { id: "marketing", title: "Marketing", visible: true },
  { id: "api", title: "API Status", visible: true },
];

export default function DashboardCustomizer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !open) return;
    tenantDb.select("dashboard_layouts", { select: "layout", eq: { user_id: user.id }, limit: 1 })
      .then((data) => {
        const saved = ((data as any[])[0]?.layout as any[]) || [];
        if (saved.length) setWidgets(saved);
      });
  }, [user, open]);

  const move = (from: number, to: number) => {
    const next = [...widgets];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setWidgets(next);
  };

  const toggle = (id: string) => setWidgets(w => w.map(x => x.id === id ? { ...x, visible: !x.visible } : x));

  const save = async () => {
    if (!user) return;
    try {
      await tenantDb.upsert(
        "dashboard_layouts",
        { user_id: user.id, layout: widgets, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
        { includeClientId: false, includeBrandId: false },
      );
    } catch {
      return toast.error("فشل الحفظ");
    }
    toast.success("تم حفظ ترتيب الداشبورد");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-4 max-h-[90vh] overflow-auto">
        <h2 className="font-display text-lg text-primary mb-3">تخصيص الداشبورد</h2>
        <p className="text-xs text-muted-foreground mb-3">اسحب لإعادة الترتيب · فعّل/عطّل العرض</p>
        <div className="space-y-1">
          {widgets.map((w, i) => (
            <div
              key={w.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragIdx !== null && dragIdx !== i) move(dragIdx, i); setDragIdx(null); }}
              className={`flex items-center gap-2 p-2 border border-border rounded cursor-move ${dragIdx === i ? "opacity-50" : ""}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{w.title}</span>
              <Switch checked={w.visible} onCheckedChange={() => toggle(w.id)} />
              {w.visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={save}>حفظ</Button>
        </div>
      </Card>
    </div>
  );
}
