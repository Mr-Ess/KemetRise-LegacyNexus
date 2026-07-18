import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTenants, listWorkflows, type Tenant, type WorkflowEntry, type SectorCode } from "@/services/erp/tenantService";

interface ERPContextType {
  activeTenant: Tenant | null;
  tenants: Tenant[];
  sectorCode: SectorCode;
  workflowRegistry: WorkflowEntry[];
  isLoading: boolean;
  setActiveTenant: (tenant: Tenant | null) => void;
  setSectorCode: (code: SectorCode) => void;
  refetchTenants: () => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export function ERPProvider({ children }: { children: ReactNode }) {
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);
  const [sectorCode, setSectorCodeState] = useState<SectorCode>('CMP-01');

  const {
    data: tenants = [],
    isLoading: tenantsLoading,
    refetch: refetchTenants,
  } = useQuery({
    queryKey: ['erp-tenants'],
    queryFn: listTenants,
    staleTime: 60_000,
  });

  const {
    data: workflowRegistry = [],
    isLoading: workflowsLoading,
  } = useQuery({
    queryKey: ['erp-workflows', activeTenant?.id],
    queryFn: () => activeTenant ? listWorkflows(activeTenant.id) : Promise.resolve([]),
    enabled: !!activeTenant,
  });

  // Auto-select first tenant and sync sector code
  useEffect(() => {
    if (tenants.length > 0 && !activeTenant) {
      const first = tenants[0];
      setActiveTenantState(first);
      setSectorCodeState(first.sector_code);
    }
  }, [tenants, activeTenant]);

  const setActiveTenant = useCallback((tenant: Tenant | null) => {
    setActiveTenantState(tenant);
    if (tenant) setSectorCodeState(tenant.sector_code);
  }, []);

  const setSectorCode = useCallback((code: SectorCode) => {
    setSectorCodeState(code);
  }, []);

  return (
    <ERPContext.Provider value={{
      activeTenant,
      tenants,
      sectorCode,
      workflowRegistry,
      isLoading: tenantsLoading || workflowsLoading,
      setActiveTenant,
      setSectorCode,
      refetchTenants,
    }}>
      {children}
    </ERPContext.Provider>
  );
}

export function useERP(): ERPContextType {
  const ctx = useContext(ERPContext);
  if (!ctx) throw new Error('useERP must be used inside <ERPProvider>');
  return ctx;
}
