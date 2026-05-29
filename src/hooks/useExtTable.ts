import { useEffect, useState, useCallback } from "react";
import { extApi, ExtTable } from "@/services/extended";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useExtTable = (table: ExtTable, opts?: { eq?: Record<string, any> }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try { setItems(await extApi.list(table, opts)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [user, table, JSON.stringify(opts)]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: Record<string, any>) => {
    try { const row = await extApi.create(table, payload); setItems(p => [row, ...p]); return row; }
    catch (e: any) { toast.error(e.message); throw e; }
  };
  const update = async (id: string, patch: Record<string, any>) => {
    try { const row = await extApi.update(table, id, patch); setItems(p => p.map(x => x.id === id ? row : x)); return row; }
    catch (e: any) { toast.error(e.message); throw e; }
  };
  const remove = async (id: string) => {
    try { await extApi.remove(table, id); setItems(p => p.filter(x => x.id !== id)); }
    catch (e: any) { toast.error(e.message); throw e; }
  };

  return { items, loading, refresh, create, update, remove };
};
