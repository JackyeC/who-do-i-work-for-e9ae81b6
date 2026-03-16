import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HypocrisyIndexCard, type SayDoGapData } from "@/components/HypocrisyIndexCard";
import { CategoryAlignmentCard } from "@/components/alignment/CategoryAlignmentCard";
import { AlignmentOverviewBar } from "@/components/alignment/AlignmentOverviewBar";
import { usePageSEO } from "@/hooks/use-page-seo";
import { ArrowLeft, Loader2, ShieldAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CorporateAlignment() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch company by slug
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["alignment-company", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, industry, slug, logo_url")
        .eq("slug", slug)
        .maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  // Fetch hypocrisy index
  const { data: hypocrisyIndex } = useQuery({
    queryKey: ["alignment-hypocrisy", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_hypocrisy_index")
        .select("*")
        .eq("company_id", company!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!company?.id,
  });

  // Fetch category scores
  const { data: categories = [] } = useQuery({
    queryKey: ["alignment-categories", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_alignment_categories" as any)
        .select("*")
        .eq("company_id", company!.id)
        .order("alignment_score", { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!company?.id,
  });

  // Fetch approved claims
  const { data: claims = [] } = useQuery({
    queryKey: ["alignment-claims", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_corporate_claims" as any)
        .select("*")
        .eq("company_id", company!.id)
        .eq("is_approved", true);
      return (data || []) as any[];
    },
    enabled: !!company?.id,
  });

  // Fetch public stances for side-by-side view
  const { data: stances = [] } = useQuery({
    queryKey: ["alignment-stances", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances" as any)
        .select("*")
        .eq("company_id", company!.id);
      return (data || []) as any[];
    },
    enabled: !!company?.id,
  });

  usePageSEO({
    title: company ? `${company.name} — Corporate Alignment Report` : "Corporate Alignment Report",
    description: company
      ? `Alignment analysis for ${company.name}: comparing public claims against observable behavior signals.`
      : "Corporate Alignment Analyzer — comparing what companies say vs what records show.",
  });

  const sayDoData: SayDoGapData | null = hypocrisyIndex
    ? {
        chiScore: hypocrisyIndex.chi_score,
        grade: hypocrisyIndex.chi_grade,
        directConflicts: hypocrisyIndex.direct_conflicts,
        indirectConflicts: hypocrisyIndex.indirect_conflicts,
        alignedStances: hypocrisyIndex.aligned_stances,
        totalStances: hypocrisyIndex.total_stances,
      }
    : null;

  // Group claims by category
  const claimsByCategory: Record<string, any[]> = {};
  claims.forEach((c: any) => {
    if (!claimsByCategory[c.category]) claimsByCategory[c.category] = [];
    claimsByCategory[c.category].push(c);
  });

  // Overall alignment score (inverse of chi_score)
  const overallScore = hypocrisyIndex ? 100 - hypocrisyIndex.chi_score : null;

  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Company not found</h1>
          <p className="text-muted-foreground mt-2">The alignment report for this company is not available.</p>
          <Link to="/browse"><Button variant="outline" className="mt-6">Browse Companies</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Back */}
        <Link to={`/company/${company.slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to {company.name}
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Corporate Alignment Report</h1>
          </div>
          <p className="text-lg text-foreground font-medium">{company.name}</p>
          <p className="text-sm text-muted-foreground">{company.industry}</p>

          {overallScore !== null && (
            <div className="mt-4 flex items-center gap-4">
              <div className="text-3xl font-bold text-foreground tabular-nums">{overallScore}<span className="text-base font-normal text-muted-foreground">/100</span></div>
              <Badge variant="outline" className="text-sm">
                Overall Alignment
              </Badge>
            </div>
          )}
        </div>

        {/* Overview Bar */}
        {categories.length > 0 && (
          <div className="mb-8">
            <AlignmentOverviewBar categories={categories} />
          </div>
        )}

        {/* Say-Do Gap Gauge */}
        {sayDoData && (
          <div className="mb-8">
            <HypocrisyIndexCard data={sayDoData} />
          </div>
        )}

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Category Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat: any) => (
                <CategoryAlignmentCard
                  key={cat.category}
                  category={cat.category}
                  alignmentScore={cat.alignment_score}
                  alignmentLevel={cat.alignment_level}
                  claimCount={cat.claim_count}
                  signalCount={cat.signal_count}
                  claims={claimsByCategory[cat.category] || []}
                />
              ))}
            </div>
          </div>
        )}

        {/* Side-by-Side Stances */}
        {stances.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">What They Say vs. What Records Show</h2>
            <div className="space-y-3">
              {stances.map((s: any) => (
                <div key={s.id} className="grid grid-cols-[1fr_1fr_100px] gap-4 p-4 bg-card border border-border rounded-xl">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Public Position</p>
                    <p className="text-sm text-foreground">{s.public_position}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Spending Reality</p>
                    <p className="text-sm text-foreground">{s.spending_reality}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <Badge
                      variant="outline"
                      className={
                        s.gap === "aligned"
                          ? "text-civic-green border-civic-green/30"
                          : s.gap === "direct-conflict"
                          ? "text-destructive border-destructive/30"
                          : "text-civic-yellow border-civic-yellow/30"
                      }
                    >
                      {s.gap === "aligned" ? "Aligned" : s.gap === "direct-conflict" ? "Gap" : "Mixed"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No data state */}
        {categories.length === 0 && !sayDoData && stances.length === 0 && (
          <div className="text-center py-16">
            <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">No alignment data yet</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              This company's alignment report has not been generated. Claims need to be extracted and scored before the analysis is available.
            </p>
          </div>
        )}

        {/* Transparency Safeguards */}
        <div className="mt-12 p-5 bg-muted/30 border border-border rounded-xl space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Transparency Safeguards</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            • Signals do not imply wrongdoing. Alignment analysis surfaces potential inconsistencies for further review.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            • Data reflects public records including lobbying disclosures, campaign finance filings, enforcement records, and corporate reports.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            • Alignment analysis may be incomplete. Not all corporate activities are publicly disclosed or captured in available datasets.
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-3 pt-3 border-t border-border/50">
            WDIWF reports public data and does not provide character assessments. Verified watchdog data is used to connect public dots.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
