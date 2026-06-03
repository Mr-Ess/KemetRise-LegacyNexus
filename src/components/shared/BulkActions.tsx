import { useState } from "react";
import { Trash2, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

export const useBulkSelect = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSelected(s => { const n = new Set(s); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  const clear = () => setSelected(new Set());
  const setAll = (ids: string[]) => setSelected(new Set(ids));
  return { selected, toggle, clear, setAll, count: selected.size, has: (id: string) => selected.has(id) };
};

export const BulkActionBar = ({ count, table, ids, onDone }: { count: number; table: string; ids: string[]; onDone: () => void }) => {
  if (count === 0) return null;
  const remove = async () => {
    if (!confirm(`Delete ${count} item(s)?`)) return;
    try {
      await tenantDb.remove(table as any, { in: { id: ids } });
    } catch (error: any) {
      return toast.error(error?.message || "Delete failed");
    }
    toast.success(`Deleted ${count}`);
    onDone();
  };
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border border-primary rounded-lg shadow-xl px-4 py-2 flex items-center gap-3">
      <CheckSquare className="w-4 h-4 text-primary" />
      <span className="text-sm font-body text-foreground">{count} selected</span>
      <Button size="sm" variant="destructive" onClick={remove}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
      <button onClick={onDone} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
    </div>
  );
};
