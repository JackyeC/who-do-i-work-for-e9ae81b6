import { Suspense, lazy, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { DossierLensProvider } from "@/contexts/DossierLensContext";
import { DemoSafeModeProvider } from "@/contexts/DemoSafeModeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { Loader2 } from "lucide-react";

// Only the landing page is eagerly loaded
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Everything else is lazy-loaded per route
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Browse = lazy(() => import("./pages/Browse"));
const Methodology = lazy(() => import("./pages/Methodology"));
const Login = lazy(() => import("./pages/Login"));
const WhoDoIWorkFor = lazy(() => import("./pages/WhoDoIWorkFor"));
const VoterLookup = lazy(() => import("./pages/VoterLookup"));
const RepresentativeProfile = lazy(() => import("./pages/RepresentativeProfile"));
const AddCompany = lazy(() => import("./pages/AddCompany"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobIntegrityBoard = lazy(() => import("./pages/JobIntegrityBoard"));
const JobBoardEmbed = lazy(() => import("./pages/JobBoardEmbed"));
const JobDetailPage = lazy(() => import("./pages/JobDetailPage"));
const RequestCorrection = lazy(() => import("./pages/RequestCorrection"));
const OfferCheck = lazy(() => import("./pages/OfferCheck"));
const MyOfferChecks = lazy(() => import("./pages/MyOfferChecks"));
const CompareOfferChecks = lazy(() => import("./pages/CompareOfferChecks"));
const JobDashboard = lazy(() => import("./pages/JobDashboard"));
const OfferReview = lazy(() => import("./pages/OfferReview"));
const MyOfferReviews = lazy(() => import("./pages/MyOfferReviews"));
const SignalAlerts = lazy(() => import("./pages/SignalAlerts"));
const OfferReviewDirect = lazy(() => import("./pages/OfferReviewDirect"));
const CareerIntelligence = lazy(() => import("./pages/CareerIntelligence"));
const Check = lazy(() => import("./pages/Check"));
const CareerMap = lazy(() => import("./pages/CareerMap"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Examples = lazy(() => import("./pages/Examples"));
const SearchYourEmployer = lazy(() => import("./pages/SearchYourEmployer"));
const ValuesSearch = lazy(() => import("./pages/ValuesSearch"));
const IntelligenceReports = lazy(() => import("./pages/IntelligenceReports"));
const IntelligenceReport = lazy(() => import("./pages/IntelligenceReport"));
const ReportsList = lazy(() => import("./pages/ReportsList"));
const ReportEditor = lazy(() => import("./pages/ReportEditor"));
const RecruitingIntelligence = lazy(() => import("./pages/RecruitingIntelligence"));
const CompanyDossier = lazy(() => import("./pages/CompanyDossier"));
const Pricing = lazy(() => import("./pages/Pricing"));
const RelationshipIntelligence = lazy(() => import("./pages/RelationshipIntelligence"));
const StrategicOfferReview = lazy(() => import("./pages/StrategicOfferReview"));
const PolicyHub = lazy(() => import("./pages/PolicyHub"));
const PolicyDetail = lazy(() => import("./pages/PolicyDetail"));
const EconomyDashboard = lazy(() => import("./pages/EconomyDashboard"));
const FollowTheMoney = lazy(() => import("./pages/FollowTheMoney"));
const AskJackye = lazy(() => import("./pages/AskJackye"));
const OnePager = lazy(() => import("./pages/OnePager"));
const Demo = lazy(() => import("./pages/Demo"));
const WouldYouWorkHere = lazy(() => import("./pages/WouldYouWorkHere"));
const WorkWithJackye = lazy(() => import("./pages/WorkWithJackye"));
const Contact = lazy(() => import("./pages/Contact"));
const EmployerReceipt = lazy(() => import("./pages/EmployerReceipt"));
const EVPRealityCheck = lazy(() => import("./pages/EVPRealityCheck"));
const WhatAmISupporting = lazy(() => import("./pages/WhatAmISupporting"));
const OfferClarity = lazy(() => import("./pages/OfferClarity"));
const IntelligenceChain = lazy(() => import("./pages/IntelligenceChain"));
const BoardIntelligence = lazy(() => import("./pages/BoardIntelligence"));
const LeaderProfile = lazy(() => import("./pages/LeaderProfile"));
const Disclaimers = lazy(() => import("./pages/Disclaimers"));
const CompareCompanies = lazy(() => import("./pages/CompareCompanies"));
const InvestigativeExplorer = lazy(() => import("./pages/InvestigativeExplorer"));
const SiteMap = lazy(() => import("./pages/SiteMap"));
const Rivalries = lazy(() => import("./pages/Rivalries"));
const BrandMadness = lazy(() => import("./pages/BrandMadness"));
const SignalFeed = lazy(() => import("./pages/SignalFeed"));
const EEOCTracker = lazy(() => import("./pages/EEOCTracker"));
const WorkIndex = lazy(() => import("./pages/WorkIndex"));
const WorkforceBrief = lazy(() => import("./pages/WorkforceBrief"));
const Rankings = lazy(() => import("./pages/Rankings"));
const RealityCheck = lazy(() => import("./pages/RealityCheck"));
const FounderConsole = lazy(() => import("./pages/FounderConsole"));
const EmployerVerificationPending = lazy(() => import("./pages/EmployerVerificationPending"));
const ForEmployers = lazy(() => import("./pages/ForEmployers"));
const CorporateImpactMap = lazy(() => import("./pages/CorporateImpactMap"));
const InfluenceGraph = lazy(() => import("./pages/InfluenceGraph"));
const CorporateAlignment = lazy(() => import("./pages/CorporateAlignment"));
const PolicyIntelligence = lazy(() => import("./pages/PolicyIntelligence"));
const NegotiationSimulator = lazy(() => import("./pages/NegotiationSimulator"));
const DecisionEngine = lazy(() => import("./pages/DecisionEngine"));
const Hire = lazy(() => import("./pages/Hire"));
const AutoApplyOnboarding = lazy(() => import("./pages/AutoApply"));
const SampleDossier = lazy(() => import("./pages/SampleDossier"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Quiz = lazy(() => import("./pages/Quiz"));
const EarlyAccess = lazy(() => import("./pages/EarlyAccess"));
const AdminTicker = lazy(() => import("./pages/AdminTicker"));
const About = lazy(() => import("./pages/About"));
const Companies = lazy(() => import("./pages/Companies"));
const Talent = lazy(() => import("./pages/Talent"));
const JobsFeed = lazy(() => import("./pages/JobsFeed"));
const ResumeOptimizer = lazy(() => import("./pages/ResumeOptimizer"));
const CoverLetterOptimizer = lazy(() => import("./pages/CoverLetterOptimizer"));
const MockInterviewPage = lazy(() => import("./pages/MockInterview"));
const InboxPage = lazy(() => import("./pages/Inbox"));
const SavedPage = lazy(() => import("./pages/Saved"));
const TrackerPage = lazy(() => import("./pages/Tracker"));
const ApplyKitPage = lazy(() => import("./pages/ApplyKit"));
const DossierCoachingGuide = lazy(() => import("./pages/DossierCoachingGuide"));
const InterviewDossier = lazy(() => import("./pages/InterviewDossier"));
const InterviewKits = lazy(() => import("./pages/InterviewKits"));
const RecruiterBrief = lazy(() => import("./pages/RecruiterBrief"));
const BriefingPage = lazy(() => import("./pages/BriefingPage"));
const Tools = lazy(() => import("./pages/Tools"));
const NewsOnboarding = lazy(() => import("./components/NewsOnboarding"));
const ReportConfirmation = lazy(() => import("./pages/ReportConfirmation"));

// Lazy-load floating widgets — not needed on first paint
const AskJackyeWidget = lazy(() => import("./components/AskJackyeWidget").then(m => ({ default: m.AskJackyeWidget })));
const BetaFeedbackWidget = lazy(() => import("./components/BetaFeedbackWidget").then(m => ({ default: m.BetaFeedbackWidget })));
const CookieNotice = lazy(() => import("./components/CookieNotice").then(m => ({ default: m.CookieNotice })));
const PreviewTierToolbar = lazy(() => import("./components/PreviewTierToolbar").then(m => ({ default: m.PreviewTierToolbar })));
const Receipts = lazy(() => import("./pages/Receipts"));
const ReceiptsReport = lazy(() => import("./pages/ReceiptsReport"));

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DemoSafeModeProvider>
        <ViewModeProvider>
        <DossierLensProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AppShell>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/interview" element={<ProtectedRoute><InterviewDossier /></ProtectedRoute>} />
                  <Route path="/interview-dossier" element={<ProtectedRoute><InterviewDossier /></ProtectedRoute>} />
                  <Route path="/recruiter" element={<RecruiterBrief />} />
                  <Route path="/recruiter-brief" element={<RecruiterBrief />} />
                  <Route path="/ask-jackye" element={<AskJackye />} />
                  <Route path="/reality-check" element={<ProtectedRoute><RealityCheck /></ProtectedRoute>} />
                  <Route path="/would-you-work-here" element={<WouldYouWorkHere />} />
                  <Route path="/work-with-jackye" element={<WorkWithJackye />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/employer-receipt" element={<EmployerReceipt />} />
                  <Route path="/employer-promise-check" element={<EVPRealityCheck />} />
                  <Route path="/evp-reality-check" element={<EVPRealityCheck />} />
                  <Route path="/what-am-i-supporting" element={<WhatAmISupporting />} />
                  <Route path="/intelligence-chain" element={<IntelligenceChain />} />
                  <Route path="/board-intelligence" element={<BoardIntelligence />} />
                  <Route path="/leader/:id" element={<LeaderProfile />} />
                  <Route path="/one-pager" element={<OnePager />} />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="/check" element={<Check />} />
                  <Route path="/policy" element={<PolicyHub />} />
                  <Route path="/policy/:id" element={<PolicyDetail />} />
                  <Route path="/economy" element={<EconomyDashboard />} />
                  <Route path="/follow-the-money" element={<FollowTheMoney />} />
                  <Route path="/receipts" element={<Receipts />} />
                  <Route path="/receipts/:slug" element={<ReceiptsReport />} />
                  <Route path="/company/:id" element={<CompanyProfile />} />
                  <Route path="/company/:id/influence" element={<ProtectedRoute><InfluenceGraph /></ProtectedRoute>} />
                  <Route path="/dossier/:id" element={<CompanyDossier />} />
                  <Route path="/dossier/guide/:slug" element={<DossierCoachingGuide />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/methodology" element={<Methodology />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/disclaimers" element={<Disclaimers />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/companies" element={<Companies />} />
                  <Route path="/talent" element={<ProtectedRoute><Talent /></ProtectedRoute>} />
                  <Route path="/examples" element={<Examples />} />
                  <Route path="/signals" element={<SignalFeed />} />
                  <Route path="/workforce-brief" element={<WorkforceBrief />} />
                  <Route path="/eeoc-tracker" element={<EEOCTracker />} />
                  <Route path="/search-your-employer" element={<SearchYourEmployer />} />
                  <Route path="/values-search" element={<ValuesSearch />} />
                  <Route path="/who-do-i-work-for" element={<ProtectedRoute><WhoDoIWorkFor /></ProtectedRoute>} />
                  <Route path="/voter-lookup" element={<ProtectedRoute><VoterLookup /></ProtectedRoute>} />
                  <Route path="/representative/:name" element={<ProtectedRoute><RepresentativeProfile /></ProtectedRoute>} />
                  <Route path="/add-company" element={<AddCompany />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/jobs-feed" element={<ProtectedRoute><JobsFeed /></ProtectedRoute>} />
                  <Route path="/resume" element={<ProtectedRoute><ResumeOptimizer /></ProtectedRoute>} />
                  <Route path="/cover-letter" element={<ProtectedRoute><CoverLetterOptimizer /></ProtectedRoute>} />
                  <Route path="/mock-interview" element={<ProtectedRoute><MockInterviewPage /></ProtectedRoute>} />
                  <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
                  <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
                  <Route path="/tracker" element={<ProtectedRoute><TrackerPage /></ProtectedRoute>} />
                  <Route path="/apply-kit" element={<ProtectedRoute><ApplyKitPage /></ProtectedRoute>} />
                  <Route path="/interview-kits" element={<ProtectedRoute><InterviewKits /></ProtectedRoute>} />
                  <Route path="/job-board" element={<JobBoardEmbed />} />
                  <Route path="/job-board/:id" element={<JobDetailPage />} />
                  <Route path="/request-correction" element={<RequestCorrection />} />
                  <Route path="/offer-check/:companyId" element={<ProtectedRoute><OfferCheck /></ProtectedRoute>} />
                  <Route path="/strategic-offer-review" element={<StrategicOfferReview />} />
                  <Route path="/offer-review/:companyId" element={<ProtectedRoute><OfferReview /></ProtectedRoute>} />
                  <Route path="/offer-review-direct" element={<ProtectedRoute><OfferReviewDirect /></ProtectedRoute>} />
                  <Route path="/compare-offer-checks" element={<CompareOfferChecks />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/briefing" element={<ProtectedRoute><BriefingPage /></ProtectedRoute>} />
                  <Route path="/news-setup" element={<ProtectedRoute><NewsOnboarding /></ProtectedRoute>} />
                  <Route path="/career-map" element={<ProtectedRoute><CareerMap /></ProtectedRoute>} />
                  <Route path="/job-dashboard" element={<ProtectedRoute><JobDashboard /></ProtectedRoute>} />
                  <Route path="/my-offer-checks" element={<ProtectedRoute><MyOfferChecks /></ProtectedRoute>} />
                  <Route path="/my-offer-reviews" element={<ProtectedRoute><MyOfferReviews /></ProtectedRoute>} />
                  <Route path="/signal-alerts" element={<ProtectedRoute><SignalAlerts /></ProtectedRoute>} />
                  <Route path="/career-intelligence" element={<ProtectedRoute><CareerIntelligence /></ProtectedRoute>} />
                  <Route path="/intelligence" element={<IntelligenceReports />} />
                  <Route path="/intelligence/:slug" element={<IntelligenceReport />} />
                  <Route path="/admin/reports" element={<AdminRoute><ReportsList /></AdminRoute>} />
                  <Route path="/admin/reports/:id" element={<AdminRoute><ReportEditor /></AdminRoute>} />
                  <Route path="/founder-console" element={<AdminRoute><FounderConsole /></AdminRoute>} />
                  <Route path="/admin/ticker" element={<AdminRoute><AdminTicker /></AdminRoute>} />
                  <Route path="/recruiting" element={<RecruitingIntelligence />} />
                  <Route path="/employer/verification-pending" element={<ProtectedRoute><EmployerVerificationPending /></ProtectedRoute>} />
                  <Route path="/for-employers" element={<ForEmployers />} />
                  <Route path="/relationship-intelligence" element={<ProtectedRoute><RelationshipIntelligence /></ProtectedRoute>} />
                  <Route path="/compare" element={<CompareCompanies />} />
                  <Route path="/investigative" element={<InvestigativeExplorer />} />
                  <Route path="/auto-apply" element={<AutoApplyOnboarding />} />
                  <Route path="/my-values" element={<Navigate to="/dashboard?tab=values" replace />} />
                  <Route path="/how-do-i-get-there" element={<Navigate to="/dashboard?tab=how" replace />} />
                  <Route path="/offer-checks" element={<Navigate to="/my-offer-checks" replace />} />
                  <Route path="/outreach" element={<Navigate to="/dashboard?tab=outreach" replace />} />
                  <Route path="/offer-clarity" element={<OfferClarity />} />
                  <Route path="/site-map" element={<SiteMap />} />
                  <Route path="/rivalries" element={<Rivalries />} />
                  <Route path="/brand-madness" element={<BrandMadness />} />
                  <Route path="/work-index" element={<WorkIndex />} />
                  <Route path="/rankings" element={<Rankings />} />
                  <Route path="/corporate-impact" element={<CorporateImpactMap />} />
                  <Route path="/alignment/:slug" element={<CorporateAlignment />} />
                  <Route path="/policy-intelligence" element={<PolicyIntelligence />} />
                  <Route path="/negotiation-simulator" element={<NegotiationSimulator />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/join" element={<EarlyAccess />} />
                  <Route path="/early-access" element={<Navigate to="/join" replace />} />
                  <Route path="/decision-engine" element={<DecisionEngine />} />
                  <Route path="/hire" element={<Hire />} />
                  <Route path="/dossier" element={<SampleDossier />} />
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/report-confirmation" element={<ReportConfirmation />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Suspense fallback={null}>
                <AskJackyeWidget />
                <BetaFeedbackWidget />
                <CookieNotice />
                <PreviewTierToolbar />
              </Suspense>
            </AppShell>
          </BrowserRouter>
        </TooltipProvider>
        </DossierLensProvider>
        </ViewModeProvider>
        </DemoSafeModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
);

export default App;
