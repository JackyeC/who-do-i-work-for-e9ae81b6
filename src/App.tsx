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
import VoterLookup from "./pages/VoterLookup";
import NotFound from "./pages/NotFound";

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
            <Route path="/voter-lookup" element={
              <ProtectedRoute>
                <VoterLookup />
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
