import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useAuth } from "@/contexts/AuthContext";
import { SignupGate } from "@/components/SignupGate";
import { fetchFollowTheMoney, fetchCompaniesWithMoneyTrail } from "@/lib/follow-the-money-api";
import type { FollowTheMoneyResponse } from "@/types/follow-the-money";

import { FollowTheMoneyHeader } from "@/components/follow-the-money/FollowTheMoneyHeader";
import { DisclaimerBlock } from "@/components/follow-the-money/DisclaimerBlock";
import { CoverageStatusBadge } from "@/components/follow-the-money/CoverageStatusBadge";
import { CycleTotalsCard } from "@/components/follow-the-money/CycleTotalsCard";
import { TopRecipientsList } from "@/components/follow-the-money/TopRecipientsList";
import { AliasSearchPanel } from "@/components/follow-the-money/AliasSearchPanel";
import { MatchConfidenceBadge } from "@/components/follow-the-money/MatchConfidenceBadge";
import { DataStatePanel } from "@/components/follow-the-money/DataStatePanel";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Clock, DollarSign, FileText } from "lucide-react";

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function FollowTheMoney() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const companyParam = searchParams.get("company");

  usePageSEO({
    title: "Follow the Money — Federal Political Contributions",
    description:
      "See the federal political contribution footprint connected to employer names across recent election cycles. Built from FEC filings and verified public records.",
    path: "/follow-the-money",
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Follow the Money</h1>
            <p className="text-muted-foreground text-sm">
              See the federal political contribution footprint connected to employer names across recent election cycles.
            </p>
          </div>
          <SignupGate feature="the Follow the Money investigation board" blurPreview={false} />
        </main>
      </div>
    );
  }

  return companyParam ? (
    <CompanyMoneyTrail companyId={companyParam} />
  ) : (
    <CompanySelector />
  );
}

function CompanyMoneyTrail({ companyId }: { companyId: string }) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<FollowTheMoneyResponse>({
    queryKey: ["follow-the-money", companyId],
    queryFn: () => fetchFollowTheMoney(companyId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const status = isLoading ? "loading" as const : isError ? "error" as const : data?.status || "none" as const;

  // Aggregate all top recipients across cycles
  const allRecipients = data?.cycles.flatMap((c) => c.topRecipients) || [];
  const recipientMap = new Map<string, number>();
  for (const r of allRecipients) {
    recipientMap.set(r.name, (recipientMap.get(r.name) || 0) + r.amount);
  }
  const topRecipients = Array.from(recipientMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount }));

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <FollowTheMoneyHeader companyName={data?.companyName} />

        {/* Status & metadata bar */}
        {data && (
          <div className="flex flex-wrap items-center gap-3">
            <CoverageStatusBadge status={data.status} />
            <MatchConfidenceBadge confidence={data.matchConfidence} />
            {data.summary.lastRefreshedAt && (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last refreshed{" "}
                {formatDistanceToNow(new Date(data.summary.lastRefreshedAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        )}

        <DataStatePanel
          status={status}
          companyName={data?.companyName}
          onRetry={() => refetch()}
        >
          {data && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Linked Contributions</p>
                      <p className="text-lg font-bold font-mono text-foreground">
                        {formatCurrency(data.summary.totalLinkedContributions)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Records Found</p>
                      <p className="text-lg font-bold font-mono text-foreground">
                        {data.summary.contributionCount.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cycle breakdown */}
              <CycleTotalsCard cycles={data.cycles} />

              {/* Top recipients */}
              <TopRecipientsList recipients={topRecipients} />

              {/* Aliases */}
              <AliasSearchPanel aliases={data.aliasesSearched} />

              {/* Disclaimer */}
              <DisclaimerBlock />
            </div>
          )}
        </DataStatePanel>
      </main>
    </div>
  );
}

function CompanySelector() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ["follow-the-money-companies"],
    queryFn: () => fetchCompaniesWithMoneyTrail(30),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <FollowTheMoneyHeader />
        <DisclaimerBlock />

        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : !companies || companies.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-muted/10 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No verified federal contribution activity imported yet for this employer name.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Employers with Federal Contribution Records
            </h2>
            <div className="divide-y divide-border/30 rounded-lg border border-border/40 overflow-hidden">
              {companies.map((c) => (
                <a
                  key={c.id}
                  href={`/follow-the-money?company=${c.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{c.industry}</span>
                  </div>
                  <span className="text-xs font-mono text-primary">
                    {c.total_pac_spending > 0
                      ? formatCurrency(c.total_pac_spending)
                      : c.lobbying_spend && c.lobbying_spend > 0
                      ? formatCurrency(c.lobbying_spend)
                      : "PAC active"}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
