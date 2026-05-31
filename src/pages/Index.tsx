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
              <div className="md:col-span-3"><BranchActivityCard globalStatusFilter={statusFilter} /></div>
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
              <SystemAnalyticsCard globalEntityFilter={activeFilter} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
