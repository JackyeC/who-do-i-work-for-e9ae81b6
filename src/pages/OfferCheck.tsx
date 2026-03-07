import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ClipboardCheck, Building2, Share2, Bookmark,
  BookmarkCheck, Loader2, Search, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PlatformPhilosophy } from "@/components/PlatformPhilosophy";
import { OfferCheckReport } from "@/components/OfferCheckReport";
import { OfferCheckShareCard } from "@/components/OfferCheckShareCard";
import { useOfferCheck } from "@/hooks/use-offer-check";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function OfferCheck() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showShareCard, setShowShareCard] = useState(false);

  const { company, sections, tiCategories, totalSignals, staleSections, isLoading } = useOfferCheck(companyId);

  // Check if user has a saved offer check for this company
  const { data: savedCheck } = useQuery({
    queryKey: ["saved-offer-check", companyId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("offer_checks" as any)
        .select("*")
        .eq("company_id", companyId!)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1);
      return (data as any[])?.[0] || null;
    },
    enabled: !!companyId && !!user,
  });

  const isSaved = !!savedCheck?.is_saved;

  // Sections locked for non-logged-in users
  const lockedSections = useMemo(() => {
    if (user) return [];
    // Show first 2 sections free, lock the rest
    return sections.slice(2).map(s => s.id);
  }, [user, sections]);

  const handleSave = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!companyId) return;

    try {
      const sectionsWithSignals = sections.filter(s => s.hasData);
      const reportData = {
        sections: sections.map(s => ({ id: s.id, title: s.title, signalCount: s.signals.length, hasData: s.hasData, stale: s.stale })),
        tiCategories,
      };

      if (savedCheck) {
        await supabase
          .from("offer_checks" as any)
          .update({ is_saved: !isSaved, updated_at: new Date().toISOString() } as any)
          .eq("id", savedCheck.id);
      } else {
        await supabase
          .from("offer_checks" as any)
          .insert({
            company_id: companyId,
            user_id: user.id,
            sections_included: sections.map(s => s.id),
            signals_count: totalSignals,
            stale_sections_count: staleSections,
            report_data: reportData,
            is_saved: true,
          } as any);
      }

      queryClient.invalidateQueries({ queryKey: ["saved-offer-check", companyId, user.id] });
      queryClient.invalidateQueries({ queryKey: ["my-offer-checks"] });
      toast({ title: isSaved ? "Report unsaved" : "Report saved", description: isSaved ? "Removed from your saved reports." : "Added to your saved Offer Checks." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleUnlock = () => navigate("/login");

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-muted-foreground">Company not found.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const sectionsWithSignals = sections.filter(s => s.hasData).length;
  const transparencyCount = tiCategories.filter(c => c.hasSignals).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back nav */}
        <Link to={`/company/${company.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>

        {/* Report Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Offer Check</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Public signals to review before you say yes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowShareCard(!showShareCard)}>
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={isSaved ? "secondary" : "outline"}
                size="sm"
                onClick={handleSave}
              >
                {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {isSaved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>

          {/* Company Snapshot */}
          <Card className="mb-5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{company.name}</h2>
                  <p className="text-xs text-muted-foreground">{company.industry} · {company.state}{company.employee_count ? ` · ${company.employee_count} employees` : ""}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold text-foreground">{totalSignals}</div>
                  <div className="text-[10px] text-muted-foreground">Total Signals</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold text-foreground">{transparencyCount}/7</div>
                  <div className="text-[10px] text-muted-foreground">Disclosure Categories</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold text-foreground">{staleSections}</div>
                  <div className="text-[10px] text-muted-foreground">Stale Sections</div>
                </div>
              </div>
              {company.last_scan_attempted && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Last scanned: {new Date(company.last_scan_attempted).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          <PlatformPhilosophy />
        </motion.div>

        {/* Share Card */}
        {showShareCard && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-center">
            <OfferCheckShareCard
              companyName={company.name}
              industry={company.industry}
              state={company.state}
              totalSignals={totalSignals}
              sectionsWithSignals={sectionsWithSignals}
              totalSections={sections.length}
              transparencyCount={transparencyCount}
              generatedAt={new Date().toISOString()}
            />
          </motion.div>
        )}

        {/* Signup CTA for non-logged-in users */}
        {!user && (
          <Card className="mb-5 border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">
                Unlock the full Offer Check
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Sign up to access all sections, save reports, and compare companies.
              </p>
              <Button size="sm" onClick={() => navigate("/login")}>
                Sign Up Free
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Report Sections */}
        <OfferCheckReport
          sections={sections}
          lockedSections={lockedSections}
          onUnlock={handleUnlock}
        />

        {/* Bottom CTA */}
        {!user && (
          <Card className="mt-6 border-primary/30 bg-primary/5">
            <CardContent className="p-5 text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                Save this report and compare companies
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Track employer signals over time with a free account.
              </p>
              <Button onClick={() => navigate("/login")}>
                Create Free Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
