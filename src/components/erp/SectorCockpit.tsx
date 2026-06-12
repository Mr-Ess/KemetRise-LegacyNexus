import { lazy, Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import { SECTOR_META, type SectorCode, type WorkflowEntry } from "@/services/erp/tenantService";
import { listSectors, type SectorEntry } from "@/services/erp/sectorRegistryService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTenant } from "@/services/erp/tenantService";
import { toast } from "sonner";
import { Settings2, Zap, LayoutDashboard, DollarSign, ShoppingCart, Users, Activity, PlusCircle, Building2, CheckCircle, Circle, GraduationCap, Globe, Trash2, BookOpen, Target, Truck, Warehouse, FolderKanban, Banknote, Laptop, Wrench, ShieldCheck } from "lucide-react";
import FinanceEngine from "./modules/FinanceEngine";
import CommerceStore from "./modules/CommerceStore";
import HRSystem from "./modules/HRSystem";
import EducationModule from "./modules/EducationModule";
import AccountingModule from "./modules/AccountingModule";
import CRMModule from "./modules/CRMModule";
import ProcurementModule from "./modules/ProcurementModule";
import InventoryModule from "./modules/InventoryModule";
import ProjectsModule from "./modules/ProjectsModule";
import PayrollModule from "./modules/PayrollModule";
import AssetsModule from "./modules/AssetsModule";
import MaintenanceModule from "./modules/MaintenanceModule";
import QualityModule from "./modules/QualityModule";
import SectorManager from "./SectorManager";
import TenantSetupModal from "./TenantSetupModal";

// Lazy-load heavy sector dashboards
const EducationDashboard = lazy(() => import("./sectors/EducationDashboard"));
const MedicalDashboard   = lazy(() => import("./sectors/MedicalDashboard"));
const SportsDashboard    = lazy(() => import("./sectors/SportsDashboard"));
const LegalDashboard     = lazy(() => import("./sectors/LegalDashboard"));
const TourismDashboard   = lazy(() => import("./sectors/TourismDashboard"));
const CompaniesDashboard = lazy(() => import("./sectors/CompaniesDashboard"));

const SECTOR_DASHBOARDS: Record<string, React.ComponentType | null> = {
  'EDU-01': EducationDashboard,
  'MED-01': MedicalDashboard,
  'SPT-01': SportsDashboard,
  'LEG-01': LegalDashboard,
  'TUR-01': TourismDashboard,
  'CMP-01': CompaniesDashboard,
  'RET-01': CompaniesDashboard,
  'MULTI':  null,
};

const SectorFallback = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
  </div>
);


export default function SectorCockpit() {
  const { activeTenant, tenants, sectorCode, setSectorCode, setActiveTenant, refetchTenants, workflowRegistry, isLoading } = useERP();
  const [activeTab, setActiveTab] = useState("overview");
  const [showSetup, setShowSetup] = useState(false);
  const qc = useQueryClient();

  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      toast.success('Tenant deleted');
      refetchTenants();
      qc.invalidateQueries({ queryKey: ['erp-tenants'] });
      setActiveTenant(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDeleteTenant = () => {
    if (!activeTenant) return;
    if (!confirm(`Delete "${activeTenant.name}"? This cannot be undone.`)) return;
    doDelete(activeTenant.id);
  };

  const { data: sectorRegistry = [] } = useQuery<SectorEntry[]>({
    queryKey: ['sector-registry'],
    queryFn: listSectors,
  });

  const getSectorMeta = (code: string) => {
    const reg = sectorRegistry.find(s => s.code === code);
    if (reg) return { icon: reg.icon, color: reg.color, label: reg.label, description: reg.description ?? '' };
    return SECTOR_META[code as SectorCode] ?? { icon: '🏢', color: '#6366f1', label: code, description: '' };
  };

  const meta = getSectorMeta(sectorCode);
  const SectorDash = SECTOR_DASHBOARDS[sectorCode] ?? null;
  const horizontalWorkflows = workflowRegistry.filter(w => w.module_layer === 'horizontal');
  const verticalWorkflows   = workflowRegistry.filter(w => w.module_layer === 'vertical');
  const activeSectors = sectorRegistry.filter(s => s.is_active);
  // Fallback to built-in SECTOR_META when DB registry is empty (migration not yet applied)
  const sectorOptions: { code: string; icon: string; label: string }[] =
    activeSectors.length > 0
      ? activeSectors
      : (Object.entries(SECTOR_META) as [SectorCode, typeof SECTOR_META[SectorCode]][]).map(([code, m]) => ({ code, icon: m.icon, label: m.label }));

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* ── COCKPIT HEADER ── */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden shadow-lg"
          style={{ background: `linear-gradient(135deg, ${meta.color}dd 0%, ${meta.color}88 100%)` }}>
          <span className="pointer-events-none absolute right-4 top-1 text-[7rem] leading-none opacity-[0.08] select-none">{meta.icon}</span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-4xl shrink-0">{meta.icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-mono opacity-60 uppercase tracking-widest">KemetRise ERP · {activeSectors.length} sectors active</p>
                <h1 className="text-xl font-bold truncate">{activeTenant?.name ?? 'No Tenant Selected'}</h1>
                <p className="text-xs opacity-75">{meta.label} · {sectorCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {tenants.length > 0 && (
                <Select value={activeTenant?.id ?? ''} onValueChange={id => setActiveTenant(tenants.find(t => t.id === id) ?? null)}>
                  <SelectTrigger className="w-44 h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select tenant…" /></SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => { const m = getSectorMeta(t.sector_code); return <SelectItem key={t.id} value={t.id} className="text-xs">{m.icon} {t.name}</SelectItem>; })}
                  </SelectContent>
                </Select>
              )}
              {activeTenant && (
                <Button
                  size="sm" variant="outline"
                  className="h-8 w-8 p-0 bg-red-500/20 border-red-300/30 text-white hover:bg-red-500/40"
                  title="Delete active tenant"
                  disabled={deleting}
                  onClick={handleDeleteTenant}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="sm" className="h-8 text-xs bg-white text-gray-900 hover:bg-white/90 font-semibold gap-1.5 shadow" onClick={() => setShowSetup(true)}>
                <PlusCircle className="h-3.5 w-3.5" /> Add Tenant
              </Button>
              <Select value={sectorCode} onValueChange={v => setSectorCode(v as SectorCode)}>
                <SelectTrigger className="w-48 h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sectorOptions.map(s => <SelectItem key={s.code} value={s.code} className="text-xs">{s.icon} {s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Badge className="h-8 px-3 bg-white/15 text-white border-white/20 text-xs gap-1">
                <Zap className="h-3 w-3" />{horizontalWorkflows.filter(w => w.is_enabled).length} flows
              </Badge>
            </div>
          </div>
          {verticalWorkflows.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap relative z-10">
              {verticalWorkflows.slice(0, 5).map(w => (
                <span key={w.id} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-white/20 ${w.is_enabled ? 'bg-white/15' : 'bg-white/5 opacity-50'}`}>
                  {w.is_enabled ? <CheckCircle className="h-2.5 w-2.5 text-green-300" /> : <Circle className="h-2.5 w-2.5" />}
                  {w.workflow_name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── MAIN TABS ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex w-max gap-0.5 min-w-full">
              <TabsTrigger value="overview"     className="gap-1 text-xs shrink-0"><LayoutDashboard className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Overview</span></TabsTrigger>
              <TabsTrigger value="accounting"   className="gap-1 text-xs shrink-0"><BookOpen className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Accounting</span></TabsTrigger>
              <TabsTrigger value="finance"      className="gap-1 text-xs shrink-0"><DollarSign className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Finance</span></TabsTrigger>
              <TabsTrigger value="payroll"      className="gap-1 text-xs shrink-0"><Banknote className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Payroll</span></TabsTrigger>
              <TabsTrigger value="hr"           className="gap-1 text-xs shrink-0"><Users className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">HR</span></TabsTrigger>
              <TabsTrigger value="crm"          className="gap-1 text-xs shrink-0"><Target className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">CRM</span></TabsTrigger>
              <TabsTrigger value="commerce"     className="gap-1 text-xs shrink-0"><ShoppingCart className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Commerce</span></TabsTrigger>
              <TabsTrigger value="inventory"    className="gap-1 text-xs shrink-0"><Warehouse className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Inventory</span></TabsTrigger>
              <TabsTrigger value="procurement"  className="gap-1 text-xs shrink-0"><Truck className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Procurement</span></TabsTrigger>
              <TabsTrigger value="projects"     className="gap-1 text-xs shrink-0"><FolderKanban className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Projects</span></TabsTrigger>
              <TabsTrigger value="assets"       className="gap-1 text-xs shrink-0"><Laptop className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Assets</span></TabsTrigger>
              <TabsTrigger value="maintenance"  className="gap-1 text-xs shrink-0"><Wrench className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Maintenance</span></TabsTrigger>
              <TabsTrigger value="quality"      className="gap-1 text-xs shrink-0"><ShieldCheck className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Quality</span></TabsTrigger>
              <TabsTrigger value="education"    className="gap-1 text-xs shrink-0"><GraduationCap className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Education</span></TabsTrigger>
              <TabsTrigger value="workflows"    className="gap-1 text-xs shrink-0"><Settings2 className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Workflows</span></TabsTrigger>
              <TabsTrigger value="sectors"      className="gap-1 text-xs shrink-0"><Globe className="h-3.5 w-3.5 shrink-0"/><span className="hidden sm:inline">Sectors</span></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-4">
            {isLoading ? <SectorFallback /> : !activeTenant ? (
              <NoTenantState onCreateClick={() => setShowSetup(true)} />
            ) : SectorDash ? (
              <Suspense fallback={<SectorFallback />}><SectorDash /></Suspense>
            ) : (
              <MultiSectorOverview sectors={activeSectors.filter(s => s.code !== 'MULTI')} onSectorSelect={v => setSectorCode(v as SectorCode)} />
            )}
          </TabsContent>
          <TabsContent value="accounting"  className="mt-4"><AccountingModule /></TabsContent>
          <TabsContent value="finance"     className="mt-4"><FinanceEngine /></TabsContent>
          <TabsContent value="payroll"     className="mt-4"><PayrollModule /></TabsContent>
          <TabsContent value="hr"          className="mt-4"><HRSystem /></TabsContent>
          <TabsContent value="crm"         className="mt-4"><CRMModule /></TabsContent>
          <TabsContent value="commerce"    className="mt-4"><CommerceStore /></TabsContent>
          <TabsContent value="inventory"   className="mt-4"><InventoryModule /></TabsContent>
          <TabsContent value="procurement" className="mt-4"><ProcurementModule /></TabsContent>
          <TabsContent value="projects"    className="mt-4"><ProjectsModule /></TabsContent>
          <TabsContent value="assets"      className="mt-4"><AssetsModule /></TabsContent>
          <TabsContent value="maintenance" className="mt-4"><MaintenanceModule /></TabsContent>
          <TabsContent value="quality"     className="mt-4"><QualityModule /></TabsContent>
          <TabsContent value="education"   className="mt-4"><EducationModule /></TabsContent>
          <TabsContent value="workflows"   className="mt-4"><WorkflowRegistryPanel horizontal={horizontalWorkflows} vertical={verticalWorkflows} /></TabsContent>
          <TabsContent value="sectors"     className="mt-4"><SectorManager /></TabsContent>
        </Tabs>
      </div>
      {showSetup && <TenantSetupModal onClose={() => setShowSetup(false)} />}
    </>
  );
}

// ─── NO TENANT STATE ──────────────────────────────────────────────────────
function NoTenantState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 rounded-2xl border-2 border-dashed border-muted-foreground/20">
      <Building2 className="h-12 w-12 text-muted-foreground/30" />
      <div className="text-center">
        <p className="text-lg font-semibold">No Business Tenant Yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">Create your first tenant to activate the ERP Cockpit. Workflows auto-seed based on sector.</p>
      </div>
      <Button className="gap-2" onClick={onCreateClick}><PlusCircle className="h-4 w-4" /> Create First Tenant</Button>
    </div>
  );
}

// ─── MULTI-SECTOR OVERVIEW ────────────────────────────────────────────────
function MultiSectorOverview({ sectors, onSectorSelect }: { sectors: SectorEntry[]; onSectorSelect: (c: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sectors.map(s => (
        <Card key={s.code} className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border-l-4"
          style={{ borderLeftColor: s.color }} onClick={() => onSectorSelect(s.code)}>
          <CardContent className="p-4">
            <div className="text-3xl mb-2">{s.icon}</div>
            <p className="font-semibold text-sm leading-tight">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
            <Badge variant="outline" className="mt-2 text-[10px] font-mono">{s.code}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── WORKFLOW REGISTRY ────────────────────────────────────────────────────
function WorkflowRegistryPanel({ horizontal, vertical }: { horizontal: WorkflowEntry[]; vertical: WorkflowEntry[] }) {
  return (
    <div className="space-y-6">
      <WorkflowGroup title="Horizontal Modules" subtitle="Active for ALL sectors" icon="⚡" items={horizontal} />
      {vertical.length > 0 && (
        <WorkflowGroup title="Vertical Sector Workflows" subtitle="Loaded based on sector_code" icon="🎯" items={vertical} />
      )}
      {horizontal.length === 0 && vertical.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">Select a tenant to view workflow registry</div>
      )}
    </div>
  );
}

function WorkflowGroup({ title, subtitle, icon, items }: { title: string; subtitle: string; icon: string; items: WorkflowEntry[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(w => (
          <div key={w.id} className={`rounded-xl border p-4 transition-all ${w.is_enabled ? 'bg-card' : 'opacity-50 bg-muted/20'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{w.workflow_name}</p>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{w.workflow_code}</p>
              </div>
              <Badge variant={w.is_enabled ? 'default' : 'outline'} className="text-[10px] shrink-0">{w.is_enabled ? 'Active' : 'Off'}</Badge>
            </div>
            {w.trigger_event && (
              <div className="mt-2 flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-mono text-muted-foreground truncate">{w.trigger_event}</span>
              </div>
            )}
            {w.active_agent_id && <Badge variant="outline" className="mt-2 text-[10px] font-mono">{w.active_agent_id}</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}
