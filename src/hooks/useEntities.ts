import { useEffect, useState, useCallback } from "react";
import { entitiesApi, EntityKind, EntityRow } from "@/services/entities";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useEntities = (kind: EntityKind) => {
  const { user } = useAuth();
  const [items, setItems] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try { setItems(await entitiesApi.list(kind)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [user, kind]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: { name: string; status?: string; data?: any }) => {
    try { const row = await entitiesApi.create(kind, payload); setItems(p => [row, ...p]); return row; }
    catch (e: any) { toast.error(e.message); throw e; }
  };
  const update = async (id: string, patch: any) => {
    try { const row = await entitiesApi.update(kind, id, patch); setItems(p => p.map(x => x.id === id ? row : x)); return row; }
    catch (e: any) { toast.error(e.message); throw e; }
  };
  const remove = async (id: string) => {
    try { await entitiesApi.remove(kind, id); setItems(p => p.filter(x => x.id !== id)); }
    catch (e: any) { toast.error(e.message); throw e; }
  };

  return { items, loading, refresh, create, update, remove };
};
