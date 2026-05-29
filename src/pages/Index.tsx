import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import DeadManSwitchCard from "@/components/dashboard/DeadManSwitchCard";
import SacredVaultCard from "@/components/dashboard/SacredVaultCard";
import HybridTaskFlowCard from "@/components/dashboard/HybridTaskFlowCard";
import ChatHubCard from "@/components/dashboard/ChatHubCard";
import BranchActivityCard from "@/components/dashboard/BranchActivityCard";
import FinancialOverviewCard from "@/components/dashboard/FinancialOverviewCard";
import SystemAnalyticsCard from "@/components/dashboard/SystemAnalyticsCard";
import ApiIntegrationStatus from "@/components/dashboard/ApiIntegrationStatus";
import MarketingAnalyticsCard from "@/components/dashboard/MarketingAnalyticsCard";

const dashboardFilters = ["All", "Brands", "Customers", "Projects", "Affiliates", "Branches", "Success Partners"] as const;
const statusFilters = ["All", "Active", "Inactive", "Maintenance"] as const;

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        {/* Dashboard Filters */}
        <div className="shrink-0 px-3 pt-2 flex flex-wrap items-center gap-2 border-b border-border/50 pb-2 bg-card/30">
          <span className="text-[10px] font-display text-muted-foreground">Filter:</span>
          {dashboardFilters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`px-2 py-0.5 rounded text-[10px] font-display transition-colors ${activeFilter === f ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>{f}</button>
          ))}
          <span className="text-border mx-1">|</span>
          {statusFilters.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`px-2 py-0.5 rounded text-[10px] font-display transition-colors ${statusFilter === f ? "bg-nile/20 text-nile border border-nile/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>{f}</button>
          ))}
        </div>

        <main className="flex-1 overflow-auto p-3">
          <div className="space-y-3">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-3"><DeadManSwitchCard /></div>
              <div className="md:col-span-2"><SacredVaultCard /></div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><HybridTaskFlowCard /></div>
              <div><ChatHubCard /></div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:auto-rows-fr">
              <div className="md:col-span-3"><BranchActivityCard /></div>
              <div className="md:col-span-2"><FinancialOverviewCard /></div>
            </div>

            {/* Row 4 - Marketing & Finance Analytics */}
            <div className="grid grid-cols-1 gap-3">
              <MarketingAnalyticsCard />
            </div>

            {/* Row 5 - API Integration Status */}
            <div className="grid grid-cols-1 gap-3">
              <ApiIntegrationStatus />
            </div>

            {/* Row 6 - System Analytics */}
            <div className="grid grid-cols-1 gap-3">
              <SystemAnalyticsCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
