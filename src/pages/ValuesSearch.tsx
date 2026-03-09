import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Sparkles, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IssueRelatedReports } from "@/components/IssueRelatedReports";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { VALUES_LENSES, type ValuesLensKey } from "@/lib/valuesLenses";
import { ValuesLensGrid } from "@/components/values-lens/ValuesLensGrid";
import { ValuesLensResults } from "@/components/values-lens/ValuesLensResults";

// Map new lens keys to old issue_category keys for backward compat
const LENS_TO_ISSUE: Record<string, string> = {
  labor_rights: "labor_rights",
  environment_climate: "climate",
  lgbtq_rights: "lgbtq_rights",
  reproductive_rights: "reproductive_rights",
  voting_rights: "voting_rights",
  consumer_protection: "consumer_protection",
  healthcare: "healthcare",
  immigration: "immigration",
  dei_equity: "civil_rights",
};

export default function ValuesSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLens = searchParams.get("lens") as ValuesLensKey | null;
  // Backward compat: support ?issue= param
  const legacyIssue = searchParams.get("issue");
  const activeLens = selectedLens || (legacyIssue ? Object.entries(LENS_TO_ISSUE).find(([, v]) => v === legacyIssue)?.[0] as ValuesLensKey : null);

  // Count signals per lens
  const { data: lensCounts } = useQuery({
    queryKey: ["values-lens-counts"],
    queryFn: async () => {
      const counts: Record<string, number> = {};

      // Count from company_values_signals
      for (const lens of VALUES_LENSES) {
        const { count } = await (supabase as any)
          .from("company_values_signals")
          .select("id", { count: "exact", head: true })
          .or(`values_lens.eq.${lens.key},value_category.eq.${lens.key}`);
        counts[lens.key] = count || 0;
      }

      // Add counts from issue_signals for mapped lenses
      for (const [lensKey, issueKey] of Object.entries(LENS_TO_ISSUE)) {
        const { count } = await (supabase as any)
          .from("issue_signals")
          .select("id", { count: "exact", head: true })
          .eq("issue_category", issueKey);
        counts[lensKey] = (counts[lensKey] || 0) + (count || 0);
      }

      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSelectLens = (key: ValuesLensKey) => {
    setSearchParams({ lens: key });
  };

  const handleBack = () => {
    setSearchParams({});
  };

  const lensInfo = VALUES_LENSES.find((l) => l.key === activeLens);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
          <div className="container mx-auto px-4 py-16 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="w-3 h-3" />
                Values Lens Engine
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4">
                Explore Companies Through Your Values
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Filter and explore companies based on public signals connected to the values
                or issues you care about — before you apply, recruit, invest, or support.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12">
          {!activeLens ? (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-2 font-display">Choose a values lens</h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
                Select a values or issue area to see which companies have related public signals in our database.
                These are lenses for filtering — not conclusions.
              </p>

              {/* Transparency disclaimer */}
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-muted/40 border border-border/40 mb-8 max-w-2xl">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This platform surfaces publicly documented signals connected to the values or issues you choose.
                  It does not assign moral or legal judgments. Interpretation is left to the user.
                </p>
              </div>

              <ValuesLensGrid counts={lensCounts} onSelect={handleSelectLens} />
            </>
          ) : (
            <>
              <ValuesLensResults lensKey={activeLens} onBack={handleBack} />

              {/* Related reports */}
              {lensInfo && LENS_TO_ISSUE[activeLens] && (
                <IssueRelatedReports
                  issueCategory={LENS_TO_ISSUE[activeLens]}
                  issueLabel={lensInfo.label}
                />
              )}
            </>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-border/30 bg-muted/20">
          <div className="container mx-auto px-4 py-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
              Don't see the company you're looking for?
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Search any company by name and we'll automatically scan public records for signals.
            </p>
            <Link to="/search-your-employer">
              <Button className="gap-2">
                <Search className="w-4 h-4" />
                Search by Company Name
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
