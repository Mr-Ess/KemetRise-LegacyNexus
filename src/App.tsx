import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandsProvider } from "@/context/BrandsContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import OnboardingWizard from "@/components/OnboardingWizard";
import OnboardingTour from "@/components/OnboardingTour";
import AIAssistant from "@/components/AIAssistant";
import CommandPalette from "@/components/CommandPalette";
import ExecutiveCockpit from "@/components/ExecutiveCockpit";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly loaded (small/critical)
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

// Lazy-loaded routes (code splitting)
const Sessions = lazy(() => import("./pages/Sessions"));
const IPWhitelist = lazy(() => import("./pages/IPWhitelist"));
const SSO = lazy(() => import("./pages/SSO"));
const WhiteLabel = lazy(() => import("./pages/WhiteLabel"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const DigitalMall = lazy(() => import("./pages/DigitalMall"));
const Landing = lazy(() => import("./pages/Landing"));
const Blog = lazy(() => import("./pages/Blog"));
const Referrals = lazy(() => import("./pages/Referrals"));
const BrowserExtension = lazy(() => import("./pages/BrowserExtension"));
const AddBrand = lazy(() => import("./pages/AddBrand.tsx"));
const BrandDetails = lazy(() => import("./pages/BrandDetails.tsx"));
const BrandsHub = lazy(() => import("./pages/BrandsHub.tsx"));
const Projects = lazy(() => import("./pages/Projects.tsx"));
const Customers = lazy(() => import("./pages/Customers.tsx"));
const Branches = lazy(() => import("./pages/Branches.tsx"));
const Services = lazy(() => import("./pages/Services.tsx"));
const Employees = lazy(() => import("./pages/Employees.tsx"));
const Affiliates = lazy(() => import("./pages/Affiliates.tsx"));
const SuccessPartners = lazy(() => import("./pages/SuccessPartners.tsx"));
const DigitalInheritance = lazy(() => import("./pages/DigitalInheritance.tsx"));
const LegendaryJourney = lazy(() => import("./pages/LegendaryJourney.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite.tsx"));
const OperationsHub = lazy(() => import("./pages/OperationsHub.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const AuditLogs = lazy(() => import("./pages/AuditLogs.tsx"));
const SystemLogs = lazy(() => import("./pages/SystemLogs.tsx"));
const Team = lazy(() => import("./pages/Team.tsx"));
const ReportsBuilder = lazy(() => import("./pages/ReportsBuilder.tsx"));
const PublicBrand = lazy(() => import("./pages/PublicBrand.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal.tsx"));
const RevenueDashboard = lazy(() => import("./pages/RevenueDashboard.tsx"));
const Coupons = lazy(() => import("./pages/Coupons.tsx"));
const Refunds = lazy(() => import("./pages/Refunds.tsx"));
const WebhooksDashboard = lazy(() => import("./pages/WebhooksDashboard.tsx"));
const ApiDocs = lazy(() => import("./pages/ApiDocs.tsx"));
const DeveloperHub = lazy(() => import("./pages/DeveloperHub.tsx"));
const Materials = lazy(() => import("./pages/Materials.tsx"));
const Inventory = lazy(() => import("./pages/Inventory.tsx"));
const CrmInteractions = lazy(() => import("./pages/CrmInteractions.tsx"));
const MarketingCampaignsLegacy = lazy(() => import("./pages/MarketingCampaigns.tsx"));
const Logistics = lazy(() => import("./pages/Logistics.tsx"));
const LegalVault = lazy(() => import("./pages/LegalVault.tsx"));
const Assets = lazy(() => import("./pages/Assets.tsx"));
const PaymentGateways = lazy(() => import("./pages/PaymentGateways.tsx"));
const ArtisticProduction = lazy(() => import("./pages/ArtisticProduction.tsx"));
const ImportExport = lazy(() => import("./pages/ImportExport.tsx"));

const FinanceAnalytics = lazy(() => import("./pages/FinanceAnalytics.tsx"));
const ERPCockpit = lazy(() => import("./pages/ERPCockpit.tsx"));
// ExecutiveCockpit: statically imported (also used statically in Index.tsx, so lazy would have no benefit)
// Enterprise portal pages
const AdminDashboard    = lazy(() => import("./pages/admin/AdminDashboard"));
const SectorFactory     = lazy(() => import("./pages/admin/SectorFactory"));
const AIProductFactory  = lazy(() => import("./pages/admin/AIProductFactory"));
const PartnerDashboard   = lazy(() => import("./pages/partner/PartnerDashboard"));
const PartnerAnalytics  = lazy(() => import("./pages/partner/PartnerAnalytics"));
const PartnerBrands     = lazy(() => import("./pages/partner/PartnerBrands"));
const PartnerStaff      = lazy(() => import("./pages/partner/PartnerStaff"));
const PartnerSectors    = lazy(() => import("./pages/partner/PartnerSectors"));
const PartnerOperations = lazy(() => import("./pages/partner/PartnerOperations"));
const PartnerRevenue    = lazy(() => import("./pages/partner/PartnerRevenue"));
const PartnerReports    = lazy(() => import("./pages/partner/PartnerReports"));
const PartnerSettings   = lazy(() => import("./pages/partner/PartnerSettings"));
const AgentDashboard    = lazy(() => import("./pages/agent/AgentDashboard"));
const AgentPerformance  = lazy(() => import("./pages/agent/AgentPerformance"));
const AgentClients      = lazy(() => import("./pages/agent/AgentClients"));
const AgentOnboarding   = lazy(() => import("./pages/agent/AgentOnboarding"));
const AgentConversions  = lazy(() => import("./pages/agent/AgentConversions"));
const AgentCommissions  = lazy(() => import("./pages/agent/AgentCommissions"));
const AgentRegions      = lazy(() => import("./pages/agent/AgentRegions"));
const AgentTickets      = lazy(() => import("./pages/agent/AgentTickets"));
const AgentSettings     = lazy(() => import("./pages/agent/AgentSettings"));
const VendorDashboard   = lazy(() => import("./pages/vendor/VendorDashboard"));
const VendorWallet      = lazy(() => import("./pages/vendor/VendorWallet"));
const VendorAnalytics   = lazy(() => import("./pages/vendor/VendorAnalytics"));
const VendorOrders      = lazy(() => import("./pages/vendor/VendorOrders"));
const VendorReviews     = lazy(() => import("./pages/vendor/VendorReviews"));
const VendorInvoices    = lazy(() => import("./pages/vendor/VendorInvoices"));
const VendorSettlement  = lazy(() => import("./pages/vendor/VendorSettlement"));
const VendorMessages    = lazy(() => import("./pages/vendor/VendorMessages"));
const VendorSettings    = lazy(() => import("./pages/vendor/VendorSettings"));
const MarketingDashboard    = lazy(() => import("./pages/marketing/MarketingDashboard"));
const LeadsPipeline         = lazy(() => import("./pages/marketing/LeadsPipeline"));
const MarketingPerformance  = lazy(() => import("./pages/marketing/MarketingPerformance"));
const MarketingCampaigns    = lazy(() => import("./pages/marketing/MarketingCampaigns"));
const MarketingEmail        = lazy(() => import("./pages/marketing/MarketingEmail"));
const MarketingAutomation   = lazy(() => import("./pages/marketing/MarketingAutomation"));
const MarketingConversions  = lazy(() => import("./pages/marketing/MarketingConversions"));
const MarketingROI          = lazy(() => import("./pages/marketing/MarketingROI"));
const ChatApp           = lazy(() => import("./pages/chat/ChatApp"));
const HRAttendance      = lazy(() => import("./pages/erp/HRAttendance"));
const ERPLedger         = lazy(() => import("./pages/erp/ERPLedger"));
const PublicLanding     = lazy(() => import("./pages/public/PublicLanding"));
const PublicAbout       = lazy(() => import("./pages/public/PublicAbout"));
const PublicContact     = lazy(() => import("./pages/public/PublicContact"));
const PublicServices    = lazy(() => import("./pages/public/PublicServices"));
const PublicProducts    = lazy(() => import("./pages/public/PublicProducts"));
const PublicProjects    = lazy(() => import("./pages/public/PublicProjects"));
const PublicPortfolio   = lazy(() => import("./pages/public/PublicPortfolio"));
const PublicPartners    = lazy(() => import("./pages/public/PublicPartners"));
const PublicAgents      = lazy(() => import("./pages/public/PublicAgents"));
const PublicNews        = lazy(() => import("./pages/public/PublicNews"));
const PrivacyPolicy     = lazy(() => import("./pages/public/PrivacyPolicy"));
const TermsOfService    = lazy(() => import("./pages/public/TermsOfService"));
const VendorProducts    = lazy(() => import("./pages/vendor/VendorProducts"));
const AdminUsers        = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAnalytics    = lazy(() => import("./pages/admin/AdminAnalytics"));
const WebsiteManager    = lazy(() => import("./pages/admin/WebsiteManager"));

import { ERPProvider } from "@/context/ERPContext";
import { CartProvider } from "@/context/CartContext";
import { UserRoleProvider } from "@/context/UserRoleContext";
import { TenantProvider } from "@/context/TenantContext";

// Portal pages
const ProviderDashboard  = lazy(() => import("./pages/provider/ProviderDashboard"));
const ProviderAnalytics  = lazy(() => import("./pages/provider/ProviderAnalytics"));
const ProviderListings   = lazy(() => import("./pages/provider/ProviderListings"));
const ProviderOrders     = lazy(() => import("./pages/provider/ProviderOrders"));
const ProviderRevenue    = lazy(() => import("./pages/provider/ProviderRevenue"));
const ProviderInvoices   = lazy(() => import("./pages/provider/ProviderInvoices"));
const ProviderCustomers  = lazy(() => import("./pages/provider/ProviderCustomers"));
const ProviderMessages   = lazy(() => import("./pages/provider/ProviderMessages"));
const ProviderReviews    = lazy(() => import("./pages/provider/ProviderReviews"));
const ProviderStore      = lazy(() => import("./pages/provider/ProviderStore"));
const ProviderProfile    = lazy(() => import("./pages/provider/ProviderProfile"));
const ProviderSettings   = lazy(() => import("./pages/provider/ProviderSettings"));
const UserDashboard     = lazy(() => import("./pages/portal/UserDashboard"));
const UserOrders        = lazy(() => import("./pages/portal/UserOrders"));
const UserWishlist      = lazy(() => import("./pages/portal/UserWishlist"));
const UserInvoices      = lazy(() => import("./pages/portal/UserInvoices"));
const UserReviews       = lazy(() => import("./pages/portal/UserReviews"));
const UserProfile       = lazy(() => import("./pages/portal/UserProfile"));
const UserSupport       = lazy(() => import("./pages/portal/UserSupport"));
const FinancialHub      = lazy(() => import("./pages/FinancialHub"));
const ManagerDashboard    = lazy(() => import("./pages/manager/ManagerDashboard"));
const ManagerAnalytics    = lazy(() => import("./pages/manager/ManagerAnalytics"));
const ManagerTeam         = lazy(() => import("./pages/manager/ManagerTeam"));
const ManagerSchedules    = lazy(() => import("./pages/manager/ManagerSchedules"));
const ManagerTasks        = lazy(() => import("./pages/manager/ManagerTasks"));
const ManagerPerformance  = lazy(() => import("./pages/manager/ManagerPerformance"));
const ManagerReports      = lazy(() => import("./pages/manager/ManagerReports"));
const ManagerMessages     = lazy(() => import("./pages/manager/ManagerMessages"));
const ManagerAnnouncements= lazy(() => import("./pages/manager/ManagerAnnouncements"));
const StaffDashboard      = lazy(() => import("./pages/staff/StaffDashboard"));
const StaffProfile        = lazy(() => import("./pages/staff/StaffProfile"));
const StaffTasks          = lazy(() => import("./pages/staff/StaffTasks"));
const StaffSchedule       = lazy(() => import("./pages/staff/StaffSchedule"));
const StaffAttendance     = lazy(() => import("./pages/staff/StaffAttendance"));
const StaffMessages       = lazy(() => import("./pages/staff/StaffMessages"));
const StaffNotifications  = lazy(() => import("./pages/staff/StaffNotifications"));
const WebsiteServicesAdmin = lazy(() => import("./pages/admin/WebsiteServicesAdmin"));
const AdminMonitor         = lazy(() => import("./pages/admin/AdminMonitor"));
const AdminProviders       = lazy(() => import("./pages/admin/AdminProviders"));
const AdminOrders          = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCoupons         = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminRefunds         = lazy(() => import("./pages/admin/AdminRefunds"));

const AffiliatedAgents = lazy(() => import("./pages/AffiliatedAgents.tsx"));
const NotificationRules = lazy(() => import("./pages/NotificationRules.tsx"));
const Help = lazy(() => import("./pages/Help.tsx"));
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant.tsx"));
const VideoConference = lazy(() => import("./pages/VideoConference.tsx"));
const Changelog = lazy(() => import("./pages/Changelog.tsx"));
const Backups = lazy(() => import("./pages/Backups.tsx"));
const AutomationBuilder = lazy(() => import("./pages/AutomationBuilder.tsx"));
const LoginHistory = lazy(() => import("./pages/LoginHistory.tsx"));
const AgentLogs = lazy(() => import("./pages/AgentLogs.tsx"));
const WorkflowMap = lazy(() => import("./pages/WorkflowMap.tsx"));
const Permissions = lazy(() => import("./pages/Permissions.tsx"));
const Unauthorized = lazy(() => import("./pages/Unauthorized.tsx"));
const UserManagement = lazy(() => import("./pages/UserManagement.tsx"));
const AIAgentControlPanelPage = lazy(() => import("./pages/AIAgentControlPanel.tsx"));
const AdminAIAgentPanel = lazy(() => import("./pages/admin/AdminAIAgentPanel.tsx"));
const AIProductFactoryPage = lazy(() => import("./pages/AIProductFactory"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

const PageFallback = () => (
  <div className="min-h-screen bg-background p-6">
    <div className="max-w-6xl mx-auto space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><TenantProvider><BrandsProvider><OnboardingTour /><CommandPalette />{children}</BrandsProvider></TenantProvider></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <UserRoleProvider>
            <CartProvider>
            <Suspense fallback={<PageFallback />}>
              <AIAssistant />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/accept-invite/:token" element={<AcceptInvite />} />
                <Route path="/b/:id" element={<PublicBrand />} />
                <Route path="/" element={<PublicLanding />} />
                <Route path="/dashboard" element={<Protected><Index /></Protected>} />
                <Route path="/dashboard/ai-agent" element={<Protected><AIAgentControlPanelPage /></Protected>} />
                <Route path="/about" element={<PublicAbout />} />
                <Route path="/contact" element={<PublicContact />} />
                <Route path="/services" element={<PublicServices />} />
                <Route path="/products" element={<PublicProducts />} />
                <Route path="/our-projects" element={<PublicProjects />} />
                <Route path="/portfolio" element={<PublicPortfolio />} />
                <Route path="/partners" element={<PublicPartners />} />
                <Route path="/our-agents" element={<PublicAgents />} />
                <Route path="/news" element={<PublicNews />} />
                <Route path="/news/:slug" element={<PublicNews />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/erp" element={<Protected><ERPProvider><ERPCockpit /></ERPProvider></Protected>} />
                <Route path="/cockpit" element={<Protected><ExecutiveCockpit /></Protected>} />
                <Route path="/brands" element={<Protected><BrandsHub /></Protected>} />
                <Route path="/brands/add" element={<Navigate to="/brands" replace />} />
                <Route path="/brands/:id" element={<Navigate to="/brands" replace />} />
                <Route path="/brands/edit/:id" element={<Navigate to="/brands" replace />} />
                <Route path="/projects" element={<Navigate to="/brands" replace />} />
                <Route path="/customers" element={<Navigate to="/brands" replace />} />
                <Route path="/branches" element={<Navigate to="/brands" replace />} />
                <Route path="/services" element={<Navigate to="/brands" replace />} />
                <Route path="/employees" element={<Protected><Employees /></Protected>} />
                <Route path="/affiliates" element={<Protected><Affiliates /></Protected>} />
                <Route path="/success-partners" element={<Navigate to="/brands" replace />} />
                <Route path="/digital-inheritance" element={<Protected><DigitalInheritance /></Protected>} />
                <Route path="/legendary-journey" element={<Protected><LegendaryJourney /></Protected>} />
                <Route path="/operations" element={<Protected><OperationsHub /></Protected>} />
                <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
                <Route path="/audit-logs" element={<Protected><SystemLogs /></Protected>} />
                <Route path="/team" element={<Protected><Team /></Protected>} />
                <Route path="/reports" element={<Protected><ReportsBuilder /></Protected>} />
                <Route path="/settings" element={<Protected><Settings /></Protected>} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
                <Route path="/customer-portal" element={<Protected><CustomerPortal /></Protected>} />
                <Route path="/revenue" element={<Navigate to="/finance-analytics" replace />} />
                <Route path="/coupons" element={<Navigate to="/finance-analytics" replace />} />
                <Route path="/refunds" element={<Navigate to="/finance-analytics" replace />} />
                <Route path="/webhooks" element={<Navigate to="/api-docs" replace />} />
                <Route path="/api-docs" element={<Protected><DeveloperHub /></Protected>} />
                <Route path="/security/sessions" element={<Navigate to="/audit-logs" replace />} />
                <Route path="/security/ip-whitelist" element={<Protected><IPWhitelist /></Protected>} />
                <Route path="/security/sso" element={<Protected><SSO /></Protected>} />
                <Route path="/white-label" element={<Navigate to="/api-docs" replace />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/digital-mall" element={<DigitalMall />} />
                <Route path="/referrals" element={<Protected><Referrals /></Protected>} />
                <Route path="/extension" element={<Navigate to="/api-docs" replace />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<Blog />} />
                <Route path="/materials"          element={<Navigate to="/operations" replace />} />
                <Route path="/inventory"          element={<Navigate to="/operations" replace />} />
                <Route path="/crm-interactions"   element={<Navigate to="/operations" replace />} />
                <Route path="/marketing-old"       element={<Navigate to="/marketing" replace />} />
                <Route path="/logistics"          element={<Navigate to="/operations" replace />} />
                <Route path="/legal-vault"        element={<Navigate to="/operations" replace />} />
                <Route path="/assets"             element={<Navigate to="/operations" replace />} />
                <Route path="/payment-gateways"   element={<Protected><PaymentGateways /></Protected>} />
                <Route path="/artistic-production" element={<Navigate to="/operations" replace />} />
                <Route path="/import-export"      element={<Navigate to="/operations" replace />} />
                <Route path="/clients" element={<Navigate to="/customers" replace />} />
                <Route path="/finance-analytics" element={<Protected><FinanceAnalytics /></Protected>} />
                {/* ── Manager Portal ── */}
                <Route path="/manager" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerDashboard /></RoleProtectedRoute></Protected>} />
                <Route path="/manager/analytics" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerAnalytics /></RoleProtectedRoute></Protected>} />
                <Route path="/manager/team" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerTeam /></RoleProtectedRoute></Protected>} />
                <Route path="/manager/schedules" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerSchedules /></RoleProtectedRoute></Protected>} />
                <Route path="/manager/tasks" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerTasks /></RoleProtectedRoute></Protected>} />
                <Route path="/manager/performance" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerPerformance /></RoleProtectedRoute></Protected>} />
                <Route path="/manager/reports" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerReports /></RoleProtectedRoute></Protected>} />
                <Route path="/manager/messages" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerMessages /></RoleProtectedRoute></Protected>} />
                <Route path="/manager/announcements" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerAnnouncements /></RoleProtectedRoute></Protected>} />
                <Route path="/manager/*" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager"]}><ManagerDashboard /></RoleProtectedRoute></Protected>} />
                {/* ── Staff Portal ── */}
                <Route path="/staff" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff"]}><StaffDashboard /></RoleProtectedRoute></Protected>} />
                <Route path="/staff/profile" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff"]}><StaffProfile /></RoleProtectedRoute></Protected>} />
                <Route path="/staff/tasks" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff"]}><StaffTasks /></RoleProtectedRoute></Protected>} />
                <Route path="/staff/schedule" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff"]}><StaffSchedule /></RoleProtectedRoute></Protected>} />
                <Route path="/staff/attendance" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff"]}><StaffAttendance /></RoleProtectedRoute></Protected>} />
                <Route path="/staff/messages" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff"]}><StaffMessages /></RoleProtectedRoute></Protected>} />
                <Route path="/staff/notifications" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff"]}><StaffNotifications /></RoleProtectedRoute></Protected>} />
                <Route path="/staff/*" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff"]}><StaffDashboard /></RoleProtectedRoute></Protected>} />
                {/* ── Provider Portal ── */}
                <Route path="/provider" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderDashboard /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/analytics" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderAnalytics /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/listings" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderListings /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/orders" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderOrders /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/revenue" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderRevenue /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/invoices" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderInvoices /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/customers" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderCustomers /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/messages" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderMessages /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/reviews" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderReviews /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/store" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderStore /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/profile" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderProfile /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/settings" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderSettings /></RoleProtectedRoute></Protected>} />
                <Route path="/provider/*" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","provider"]}><ProviderDashboard /></RoleProtectedRoute></Protected>} />
                {/* ── User Portal ── */}
                <Route path="/portal" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff","partner","agent","vendor","provider","marketing","user"]}><UserDashboard /></RoleProtectedRoute></Protected>} />
                <Route path="/portal/orders" element={<Protected><UserOrders /></Protected>} />
                <Route path="/portal/wishlist" element={<Protected><UserWishlist /></Protected>} />
                <Route path="/portal/invoices" element={<Protected><UserInvoices /></Protected>} />
                <Route path="/portal/reviews" element={<Protected><UserReviews /></Protected>} />
                <Route path="/portal/profile" element={<Protected><UserProfile /></Protected>} />
                <Route path="/portal/support" element={<Protected><UserSupport /></Protected>} />
                <Route path="/portal/*" element={<Protected><UserDashboard /></Protected>} />
                {/* ── Admin Finance Hub ── */}
                <Route path="/admin/finance" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><FinancialHub /></RoleProtectedRoute></Protected>} />
                {/* ── Admin Portal ── */}
                <Route path="/admin" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AdminDashboard /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/ai-agent" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AdminAIAgentPanel /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/sectors" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><SectorFactory /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/ai-factory" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AIProductFactory /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/users" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AdminUsers /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/analytics" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AdminAnalytics /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/website-services" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><WebsiteServicesAdmin /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/website" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><WebsiteManager /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/monitor" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AdminMonitor /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/providers" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AdminProviders /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/orders" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AdminOrders /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/coupons" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AdminCoupons /></RoleProtectedRoute></Protected>} />
                <Route path="/admin/refunds" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AdminRefunds /></RoleProtectedRoute></Protected>} />
                <Route path="/dashboard/website" element={<Navigate to="/admin/website" replace />} />
                {/* ── Partner Portal ── */}
                <Route path="/partner" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerDashboard /></RoleProtectedRoute></Protected>} />
                <Route path="/partner/analytics" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerAnalytics /></RoleProtectedRoute></Protected>} />
                <Route path="/partner/brands" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerBrands /></RoleProtectedRoute></Protected>} />
                <Route path="/partner/staff" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerStaff /></RoleProtectedRoute></Protected>} />
                <Route path="/partner/sectors" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerSectors /></RoleProtectedRoute></Protected>} />
                <Route path="/partner/operations" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerOperations /></RoleProtectedRoute></Protected>} />
                <Route path="/partner/revenue" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerRevenue /></RoleProtectedRoute></Protected>} />
                <Route path="/partner/reports" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerReports /></RoleProtectedRoute></Protected>} />
                <Route path="/partner/settings" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerSettings /></RoleProtectedRoute></Protected>} />
                <Route path="/partner/*" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","partner"]}><PartnerDashboard /></RoleProtectedRoute></Protected>} />
                {/* ── Agent Portal ── */}
                <Route path="/agent" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentDashboard /></RoleProtectedRoute></Protected>} />
                <Route path="/agent/performance" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentPerformance /></RoleProtectedRoute></Protected>} />
                <Route path="/agent/clients" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentClients /></RoleProtectedRoute></Protected>} />
                <Route path="/agent/onboarding" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentOnboarding /></RoleProtectedRoute></Protected>} />
                <Route path="/agent/conversions" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentConversions /></RoleProtectedRoute></Protected>} />
                <Route path="/agent/commissions" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentCommissions /></RoleProtectedRoute></Protected>} />
                <Route path="/agent/regions" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentRegions /></RoleProtectedRoute></Protected>} />
                <Route path="/agent/tickets" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentTickets /></RoleProtectedRoute></Protected>} />
                <Route path="/agent/settings" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentSettings /></RoleProtectedRoute></Protected>} />
                <Route path="/agent/*" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","agent"]}><AgentDashboard /></RoleProtectedRoute></Protected>} />
                {/* ── Vendor Portal ── */}
                <Route path="/vendor" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorDashboard /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/analytics" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorAnalytics /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/products" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorProducts /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/orders" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorOrders /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/reviews" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorReviews /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/wallet" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorWallet /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/invoices" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorInvoices /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/settlement" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorSettlement /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/messages" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorMessages /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/settings" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorSettings /></RoleProtectedRoute></Protected>} />
                <Route path="/vendor/*" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","vendor"]}><VendorDashboard /></RoleProtectedRoute></Protected>} />
                {/* ── Marketing Portal ── */}
                <Route path="/marketing" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","marketing"]}><MarketingDashboard /></RoleProtectedRoute></Protected>} />
                <Route path="/marketing/performance" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","marketing"]}><MarketingPerformance /></RoleProtectedRoute></Protected>} />
                <Route path="/marketing/campaigns" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","marketing"]}><MarketingCampaigns /></RoleProtectedRoute></Protected>} />
                <Route path="/marketing/email" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","marketing"]}><MarketingEmail /></RoleProtectedRoute></Protected>} />
                <Route path="/marketing/automation" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","marketing"]}><MarketingAutomation /></RoleProtectedRoute></Protected>} />
                <Route path="/marketing/leads" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","marketing"]}><LeadsPipeline /></RoleProtectedRoute></Protected>} />
                <Route path="/marketing/conversions" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","marketing"]}><MarketingConversions /></RoleProtectedRoute></Protected>} />
                <Route path="/marketing/roi" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","marketing"]}><MarketingROI /></RoleProtectedRoute></Protected>} />
                <Route path="/marketing/*" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","marketing"]}><MarketingDashboard /></RoleProtectedRoute></Protected>} />
                {/* ── Chat Portal ── */}
                <Route path="/chat" element={<Protected><ChatApp /></Protected>} />
                {/* ── ERP / HR ── */}
                <Route path="/erp/hr" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff","user"]}><HRAttendance /></RoleProtectedRoute></Protected>} />
                <Route path="/erp/ledger" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","user"]}><ERPLedger /></RoleProtectedRoute></Protected>} />
                <Route path="/erp/hr/*" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","staff","user"]}><HRAttendance /></RoleProtectedRoute></Protected>} />
                <Route path="/erp/ledger/*" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin","manager","user"]}><ERPLedger /></RoleProtectedRoute></Protected>} />
                <Route path="/heirs" element={<Navigate to="/digital-inheritance" replace />} />
                <Route path="/affiliated-agents" element={<Navigate to="/affiliates" replace />} />
                <Route path="/notification-rules" element={<Navigate to="/notifications" replace />} />
                <Route path="/help" element={<Protected><Help /></Protected>} />
                <Route path="/voice" element={<Protected><VoiceAssistant /></Protected>} />
                <Route path="/video" element={<Protected><VideoConference /></Protected>} />
                <Route path="/changelog" element={<Protected><Changelog /></Protected>} />
                <Route path="/backups" element={<Protected><Backups /></Protected>} />
                <Route path="/automations" element={<Protected><AutomationBuilder /></Protected>} />
                <Route path="/security/login-history" element={<Protected><LoginHistory /></Protected>} />
                <Route path="/agent-logs" element={<Navigate to="/audit-logs" replace />} />
                <Route path="/workflow-map" element={<Protected><WorkflowMap /></Protected>} />
                <Route path="/permissions" element={<Protected><Permissions /></Protected>} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/user-management" element={<Protected><UserManagement /></Protected>} />
                <Route path="/ai-factory" element={<Protected><AIProductFactoryPage /></Protected>} />
                <Route path="/permissions" element={<Protected><Permissions /></Protected>} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/user-management" element={<Protected><UserManagement /></Protected>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </CartProvider>
            </UserRoleProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
