import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { DossierLensProvider } from "@/contexts/DossierLensContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { AskJackyeWidget } from "@/components/AskJackyeWidget";
import Index from "./pages/Index";
import CompanyProfile from "./pages/CompanyProfile";
import SearchResults from "./pages/SearchResults";
import Browse from "./pages/Browse";
import Methodology from "./pages/Methodology";
import Login from "./pages/Login";
import WhoDoIWorkFor from "./pages/WhoDoIWorkFor";
import VoterLookup from "./pages/VoterLookup";
import AddCompany from "./pages/AddCompany";
import Jobs from "./pages/Jobs";
import NotFound from "./pages/NotFound";
import RequestCorrection from "./pages/RequestCorrection";
import OfferCheck from "./pages/OfferCheck";
import MyOfferChecks from "./pages/MyOfferChecks";
import CompareOfferChecks from "./pages/CompareOfferChecks";
import JobDashboard from "./pages/JobDashboard";
import OfferReview from "./pages/OfferReview";
import MyOfferReviews from "./pages/MyOfferReviews";
import SignalAlerts from "./pages/SignalAlerts";
import OfferReviewDirect from "./pages/OfferReviewDirect";
import CareerIntelligence from "./pages/CareerIntelligence";
import Check from "./pages/Check";
import CareerMap from "./pages/CareerMap";
import Dashboard from "./pages/Dashboard";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Examples from "./pages/Examples";
import SearchYourEmployer from "./pages/SearchYourEmployer";
import ValuesSearch from "./pages/ValuesSearch";
import IntelligenceReports from "./pages/IntelligenceReports";
import IntelligenceReport from "./pages/IntelligenceReport";
import ReportsList from "./pages/ReportsList";
import ReportEditor from "./pages/ReportEditor";
import RecruitingIntelligence from "./pages/RecruitingIntelligence";
import CompanyDossier from "./pages/CompanyDossier";
import Pricing from "./pages/Pricing";
import RelationshipIntelligence from "./pages/RelationshipIntelligence";
import StrategicOfferReview from "./pages/StrategicOfferReview";
import PolicyHub from "./pages/PolicyHub";
import PolicyDetail from "./pages/PolicyDetail";
import EconomyDashboard from "./pages/EconomyDashboard";
import FollowTheMoney from "./pages/FollowTheMoney";
import AskJackye from "./pages/AskJackye";
import OnePager from "./pages/OnePager";
import WouldYouWorkHere from "./pages/WouldYouWorkHere";
import WorkWithJackye from "./pages/WorkWithJackye";
import EmployerReceipt from "./pages/EmployerReceipt";
import EVPRealityCheck from "./pages/EVPRealityCheck";
import WhatAmISupporting from "./pages/WhatAmISupporting";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewModeProvider>
        <DossierLensProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AppShell>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ask-jackye" element={<AskJackye />} />
                <Route path="/would-you-work-here" element={<WouldYouWorkHere />} />
                <Route path="/work-with-jackye" element={<WorkWithJackye />} />
                <Route path="/employer-receipt" element={<EmployerReceipt />} />
                <Route path="/evp-reality-check" element={<EVPRealityCheck />} />
                <Route path="/what-am-i-supporting" element={<WhatAmISupporting />} />
                <Route path="/one-pager" element={<OnePager />} />
                <Route path="/check" element={<Check />} />
                <Route path="/policy" element={<PolicyHub />} />
                <Route path="/policy/:id" element={<PolicyDetail />} />
                <Route path="/economy" element={<EconomyDashboard />} />
                <Route path="/follow-the-money" element={<FollowTheMoney />} />
                <Route path="/company/:id" element={<CompanyProfile />} />
                <Route path="/dossier/:id" element={<CompanyDossier />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/methodology" element={<Methodology />} />
                <Route path="/login" element={<Login />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/examples" element={<Examples />} />
                <Route path="/search-your-employer" element={<SearchYourEmployer />} />
                <Route path="/values-search" element={<ValuesSearch />} />
                <Route path="/who-do-i-work-for" element={
                  <ProtectedRoute>
                    <WhoDoIWorkFor />
                  </ProtectedRoute>
                } />
                <Route path="/voter-lookup" element={
                  <ProtectedRoute>
                    <VoterLookup />
                  </ProtectedRoute>
                } />
                <Route path="/add-company" element={<AddCompany />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/request-correction" element={<RequestCorrection />} />
                <Route path="/offer-check/:companyId" element={<OfferCheck />} />
                <Route path="/strategic-offer-review" element={<StrategicOfferReview />} />
                <Route path="/offer-review/:companyId" element={
                  <ProtectedRoute>
                    <OfferReview />
                  </ProtectedRoute>
                } />
                <Route path="/offer-review-direct" element={
                  <ProtectedRoute>
                    <OfferReviewDirect />
                  </ProtectedRoute>
                } />
                <Route path="/compare-offer-checks" element={<CompareOfferChecks />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/career-map" element={
                  <ProtectedRoute>
                    <CareerMap />
                  </ProtectedRoute>
                } />
                <Route path="/job-dashboard" element={
                  <ProtectedRoute>
                    <JobDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/my-offer-checks" element={
                  <ProtectedRoute>
                    <MyOfferChecks />
                  </ProtectedRoute>
                } />
                <Route path="/my-offer-reviews" element={
                  <ProtectedRoute>
                    <MyOfferReviews />
                  </ProtectedRoute>
                } />
                <Route path="/signal-alerts" element={
                  <ProtectedRoute>
                    <SignalAlerts />
                  </ProtectedRoute>
                } />
                <Route path="/career-intelligence" element={
                  <ProtectedRoute>
                    <CareerIntelligence />
                  </ProtectedRoute>
                } />
                <Route path="/intelligence" element={<IntelligenceReports />} />
                <Route path="/intelligence/:slug" element={<IntelligenceReport />} />
                <Route path="/admin/reports" element={<ProtectedRoute><ReportsList /></ProtectedRoute>} />
                <Route path="/admin/reports/:id" element={<ProtectedRoute><ReportEditor /></ProtectedRoute>} />
                <Route path="/recruiting" element={<RecruitingIntelligence />} />
                <Route path="/relationship-intelligence" element={
                  <ProtectedRoute>
                    <RelationshipIntelligence />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <AskJackyeWidget />
            </AppShell>
          </BrowserRouter>
        </TooltipProvider>
        </DossierLensProvider>
        </ViewModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
