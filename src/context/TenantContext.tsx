import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ── Types ──────────────────────────────────────────────────────────────
export interface Sector {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  icon: string;
  color: string;
  is_active: boolean;
  modules: string[];
  config: Record<string, unknown>;
  sort_order: number;
}

export interface TenantCtx {
  activeSectors: Sector[];
  allSectors: Sector[];
  partnerId?: string;
  partnerWorkspace?: Record<string, unknown>;
  reloadSectors: () => Promise<void>;
}

const Ctx = createContext<TenantCtx>({
  activeSectors: [],
  allSectors: [],
  reloadSectors: async () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const db = supabase as any;
  const [allSectors, setAllSectors] = useState<Sector[]>([]);
  const [partnerWorkspace, setPartnerWorkspace] = useState<Record<string, unknown> | undefined>();

  const loadSectors = useCallback(async () => {
    const { data } = await db.from("sectors").select("*").order("sort_order");
    setAllSectors(data || []);
  }, []);

  const loadPartner = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("partner_workspaces")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setPartnerWorkspace(data);
  }, [user]);

  useEffect(() => {
    loadSectors();
    if (user) loadPartner();
  }, [user, loadSectors, loadPartner]);

  // Realtime sector updates
  useEffect(() => {
    const ch = db.channel("sectors")
      .on("postgres_changes", { event: "*", schema: "public", table: "sectors" }, loadSectors)
      .subscribe();
    return () => { db.removeChannel(ch); };
  }, [loadSectors]);

  return (
    <Ctx.Provider value={{
      activeSectors: allSectors.filter(s => s.is_active),
      allSectors,
      partnerWorkspace,
      partnerId: partnerWorkspace ? String(partnerWorkspace.id) : undefined,
      reloadSectors: loadSectors,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTenant() { return useContext(Ctx); }
