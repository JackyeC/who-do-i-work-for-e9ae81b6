import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import CareerIntelligence from "./pages/CareerIntelligence";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/company/:id" element={<CompanyProfile />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/login" element={<Login />} />
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
            <Route path="/offer-review/:companyId" element={
              <ProtectedRoute>
                <OfferReview />
              </ProtectedRoute>
            } />
            <Route path="/compare-offer-checks" element={<CompareOfferChecks />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
