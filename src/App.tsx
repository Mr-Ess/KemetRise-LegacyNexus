import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandsProvider } from "@/context/BrandsContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import OnboardingWizard from "@/components/OnboardingWizard";
import OnboardingTour from "@/components/OnboardingTour";
import AIAssistant from "@/components/AIAssistant";
import CommandPalette from "@/components/CommandPalette";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly loaded (small/critical)
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy-loaded routes (code splitting)
const Sessions = lazy(() => import("./pages/Sessions"));
const IPWhitelist = lazy(() => import("./pages/IPWhitelist"));
const SSO = lazy(() => import("./pages/SSO"));
const WhiteLabel = lazy(() => import("./pages/WhiteLabel"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Landing = lazy(() => import("./pages/Landing"));
const Blog = lazy(() => import("./pages/Blog"));
const Referrals = lazy(() => import("./pages/Referrals"));
const BrowserExtension = lazy(() => import("./pages/BrowserExtension"));
const AddBrand = lazy(() => import("./pages/AddBrand.tsx"));
const BrandDetails = lazy(() => import("./pages/BrandDetails.tsx"));
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
const Materials = lazy(() => import("./pages/Materials.tsx"));
const Inventory = lazy(() => import("./pages/Inventory.tsx"));
const CrmInteractions = lazy(() => import("./pages/CrmInteractions.tsx"));
const MarketingCampaigns = lazy(() => import("./pages/MarketingCampaigns.tsx"));
const Logistics = lazy(() => import("./pages/Logistics.tsx"));
const LegalVault = lazy(() => import("./pages/LegalVault.tsx"));
const Assets = lazy(() => import("./pages/Assets.tsx"));
const PaymentGateways = lazy(() => import("./pages/PaymentGateways.tsx"));
const ArtisticProduction = lazy(() => import("./pages/ArtisticProduction.tsx"));
const ImportExport = lazy(() => import("./pages/ImportExport.tsx"));

const FinanceAnalytics = lazy(() => import("./pages/FinanceAnalytics.tsx"));

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
const UserManagement = lazy(() => import("./pages/UserManagement.tsx"));

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
  <ProtectedRoute><BrandsProvider><OnboardingTour /><CommandPalette />{children}<AIAssistant /></BrandsProvider></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/accept-invite/:token" element={<AcceptInvite />} />
                <Route path="/b/:id" element={<PublicBrand />} />
                <Route path="/" element={<Protected><Index /></Protected>} />
                <Route path="/brands/add" element={<Protected><AddBrand /></Protected>} />
                <Route path="/brands/:id" element={<Protected><BrandDetails /></Protected>} />
                <Route path="/brands/edit/:id" element={<Protected><AddBrand /></Protected>} />
                <Route path="/projects" element={<Protected><Projects /></Protected>} />
                <Route path="/customers" element={<Protected><Customers /></Protected>} />
                <Route path="/branches" element={<Protected><Branches /></Protected>} />
                <Route path="/services" element={<Protected><Services /></Protected>} />
                <Route path="/employees" element={<Protected><Employees /></Protected>} />
                <Route path="/affiliates" element={<Protected><Affiliates /></Protected>} />
                <Route path="/success-partners" element={<Protected><SuccessPartners /></Protected>} />
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
                <Route path="/webhooks" element={<Protected><WebhooksDashboard /></Protected>} />
                <Route path="/api-docs" element={<Protected><ApiDocs /></Protected>} />
                <Route path="/security/sessions" element={<Protected><Sessions /></Protected>} />
                <Route path="/security/ip-whitelist" element={<Protected><IPWhitelist /></Protected>} />
                <Route path="/security/sso" element={<Protected><SSO /></Protected>} />
                <Route path="/white-label" element={<Protected><WhiteLabel /></Protected>} />
                <Route path="/marketplace" element={<Protected><Marketplace /></Protected>} />
                <Route path="/referrals" element={<Protected><Referrals /></Protected>} />
                <Route path="/extension" element={<Protected><BrowserExtension /></Protected>} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<Blog />} />
                <Route path="/materials" element={<Protected><Materials /></Protected>} />
                <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
                <Route path="/crm-interactions" element={<Protected><CrmInteractions /></Protected>} />
                <Route path="/marketing" element={<Protected><MarketingCampaigns /></Protected>} />
                <Route path="/logistics" element={<Protected><Logistics /></Protected>} />
                <Route path="/legal-vault" element={<Protected><LegalVault /></Protected>} />
                <Route path="/assets" element={<Protected><Assets /></Protected>} />
                <Route path="/payment-gateways" element={<Protected><PaymentGateways /></Protected>} />
                <Route path="/artistic-production" element={<Protected><ArtisticProduction /></Protected>} />
                <Route path="/import-export" element={<Protected><ImportExport /></Protected>} />
                <Route path="/clients" element={<Navigate to="/customers" replace />} />
                <Route path="/finance-analytics" element={<Protected><FinanceAnalytics /></Protected>} />
                <Route path="/heirs" element={<Navigate to="/digital-inheritance" replace />} />
                <Route path="/affiliated-agents" element={<Protected><AffiliatedAgents /></Protected>} />
                <Route path="/notification-rules" element={<Protected><NotificationRules /></Protected>} />
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
                <Route path="/user-management" element={<Protected><UserManagement /></Protected>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
