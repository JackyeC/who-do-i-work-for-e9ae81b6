import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Search, Sparkles, Info, HelpCircle } from "lucide-react";
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
  usePageSEO({
    title: "Values Search — Find Employers Aligned with Your Values",
    description: "Search companies by values: climate action, racial equity, labor rights, LGBTQ+ inclusion, and more. Evidence-based employer alignment signals.",
    path: "/values-search",
    jsonLd: {
      "@type": "SearchAction",
      target: "https://wdiwf.jackyeclayton.com/values-search?lens={lens}",
      name: "Values-Based Employer Search",
      description: "Find employers aligned with your values using evidence-based signals across climate, equity, labor, and inclusion categories.",
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLens = searchParams.get("lens") as ValuesLensKey | null;
  const legacyIssue = searchParams.get("issue");
  const activeLens = selectedLens || (legacyIssue ? Object.entries(LENS_TO_ISSUE).find(([, v]) => v === legacyIssue)?.[0] as ValuesLensKey : null);

  const { data: lensCounts } = useQuery({
    queryKey: ["values-lens-counts"],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const lens of VALUES_LENSES) {
        const { count } = await (supabase as any)
          .from("company_values_signals")
          .select("id", { count: "exact", head: true })
          .or(`values_lens.eq.${lens.key},value_category.eq.${lens.key}`);
        counts[lens.key] = count || 0;
      }
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
                Employer Signal Explorer
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4">
                What Does This Company <em>Actually</em> Support?
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Companies spend money on politics, lobbying, and advocacy. That spending is public record.
                Pick a topic below to see where companies put their money — not just what they say.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12">
          {!activeLens ? (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-2 font-display">Pick a topic you care about</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                We'll show you which companies have public spending records connected to that topic.
                This isn't opinion — it's what's in the public filings.
              </p>

              {/* How it works — plain language */}
              <div className="p-5 rounded-xl bg-muted/40 border border-border/40 mb-8 max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">How does this work?</h3>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Every company that wants to influence laws or politicians has to file paperwork with the government.
                    That paperwork is public — anyone can look it up.
                  </p>
                  <p>We read those filings and sort them by topic so you don't have to.</p>
                  <p className="text-xs border-t border-border/40 pt-3">
                    <strong className="text-foreground">We don't take sides.</strong> We just show you what the records say. You decide what it means to you.
                  </p>
                </div>
              </div>

              <ValuesLensGrid counts={lensCounts} onSelect={handleSelectLens} />
            </>
          ) : (
            <>
              <ValuesLensResults lensKey={activeLens} onBack={handleBack} />
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
              Looking for a specific company?
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Type any company name and we'll pull their public records for you.
            </p>
            <Link to="/search-your-employer">
              <Button className="gap-2">
                <Search className="w-4 h-4" />
                Search a Company
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
