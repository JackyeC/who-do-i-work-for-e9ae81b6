import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, Users, Vote, Shield, FileText,
  ChevronDown, AlertTriangle, CheckCircle, Crown,
  ExternalLink, Loader2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProxyIntelligenceCardProps {
  companyId: string;
  companyName: string;
  isPubliclyTraded: boolean;
  secCik: string | null;
}

interface BoardMember {
  name: string;
  title: string;
  independent: boolean;
  tenure_years: number | null;
}

interface Proposal {
  proposal: string;
  tag: string;
}

interface ProxyData {
  id: string;
  filing_date: string | null;
  filing_url: string | null;
  ceo_name: string | null;
  ceo_total_comp: number | null;
  ceo_salary: number | null;
  ceo_bonus: number | null;
  ceo_stock: number | null;
  ceo_other: number | null;
  ceo_median_pay_ratio: string | null;
  comp_interpretation: string | null;
  board_members: BoardMember[];
  ceo_is_chair: boolean;
  power_concentration: string;
  shareholder_proposals: Proposal[];
  governance_rating: string;
  governance_notes: string | null;
}

function formatDollars(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function Term({ term, tip }: { term: string; tip: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted decoration-muted-foreground/40 cursor-help">{term}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ProxyIntelligenceCard({
  companyId,
  companyName,
  isPubliclyTraded,
  secCik,
}: ProxyIntelligenceCardProps) {
  const [showSource, setShowSource] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Load cached data
  const { data: proxy, isLoading, refetch } = useQuery({
    queryKey: ["proxy-intelligence", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proxy_intelligence" as any)
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data as ProxyData | null;
    },
    enabled: isPubliclyTraded && !!secCik,
  });

  if (!isPubliclyTraded || !secCik) return null;

  const triggerFetch = async () => {
    setFetching(true);
    try {
      await supabase.functions.invoke("fetch-proxy-intelligence", {
        body: { companyId },
      });
      await refetch();
    } catch (e) {
      console.error("[ProxyIntelligence] fetch error:", e);
    } finally {
      setFetching(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!proxy) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-semibold">
              Proxy Intelligence
            </p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            SEC <Term term="proxy" tip="A proxy statement (DEF 14A) is a document public companies must file that reveals executive pay, board composition, and what shareholders are voting on." /> filing analysis is available for {companyName}.
          </p>
          <Button
            onClick={triggerFetch}
            disabled={fetching}
            size="sm"
            className="gap-1.5 text-xs"
          >
            {fetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            {fetching ? "Analyzing SEC Filing..." : "Analyze Proxy Filing"}
          </Button>
          {fetching && (
            <p className="text-[10px] text-muted-foreground mt-2 animate-pulse">
              Fetching and parsing Schedule 14A from EDGAR...
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const boardMembers = (proxy.board_members || []) as BoardMember[];
  const proposals = (proxy.shareholder_proposals || []) as Proposal[];
  const govColor =
    proxy.governance_rating === "Strong oversight"
      ? "text-emerald-400"
      : proxy.governance_rating === "Weak"
        ? "text-amber-400"
        : "text-muted-foreground";

  return (
    <Card className="border-border/40">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-semibold">
              Proxy Intelligence
            </p>
            <Badge variant="outline" className="text-[9px] font-mono">SEC DEF 14A</Badge>
          </div>
          {proxy.filing_date && (
            <span className="text-[10px] text-muted-foreground">
              Filed {new Date(proxy.filing_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Summary */}
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This filing shows how {companyName} is run, how leaders are paid, and what shareholders are being asked to approve.
          </p>
        </div>

        {/* 1. Leadership Pay */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Leadership Pay Snapshot</h4>
          </div>
          <div className="space-y-1.5">
            {proxy.ceo_name && (
              <p className="text-xs text-foreground">
                <span className="font-semibold">{proxy.ceo_name}</span> — Total: <span className="font-bold text-primary">{formatDollars(proxy.ceo_total_comp)}</span>
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Salary", val: proxy.ceo_salary },
                { label: "Bonus", val: proxy.ceo_bonus },
                { label: "Stock", val: proxy.ceo_stock },
                { label: "Other", val: proxy.ceo_other },
              ].map((item) => (
                <div key={item.label} className="bg-muted/40 rounded px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-xs font-semibold text-foreground">{formatDollars(item.val)}</p>
                </div>
              ))}
            </div>
            {proxy.ceo_median_pay_ratio && (
              <p className="text-[11px] text-muted-foreground">
                CEO-to-median employee <Term term="pay ratio" tip="The ratio of CEO total compensation to median employee pay. Required by SEC for public companies. A ratio of 300:1 means the CEO earns 300× what the typical employee does." />: <span className="font-semibold text-foreground">{proxy.ceo_median_pay_ratio}</span>
              </p>
            )}
            {proxy.comp_interpretation && (
              <p className="text-[11px] text-muted-foreground italic">
                {proxy.comp_interpretation}
              </p>
            )}
          </div>
        </section>

        {/* 2. Who Actually Has Power */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Crown className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Who Actually Has Power</h4>
          </div>
          <div className="space-y-1.5">
            {proxy.ceo_is_chair && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <p className="text-[11px] text-amber-400 font-medium">
                  CEO is also <Term term="Board Chair" tip="The Board Chair leads the company's board of directors. When the CEO also holds this role, it concentrates oversight and decision-making power in one person." /> — decision power is concentrated
                </p>
              </div>
            )}
            {!proxy.ceo_is_chair && (
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <p className="text-[11px] text-emerald-400 font-medium">
                  CEO and Chair roles are separated — decision power is distributed
                </p>
              </div>
            )}
            {boardMembers.length > 0 && (
              <div className="space-y-1 mt-1">
                {boardMembers.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground">
                      {m.name}
                      {m.title && <span className="text-muted-foreground"> — {m.title}</span>}
                    </span>
                    <div className="flex gap-1">
                      {m.independent && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0">Independent</Badge>
                      )}
                      {m.tenure_years != null && m.tenure_years >= 10 && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 border-amber-500/40 text-amber-400">
                          {m.tenure_years}yr tenure
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {boardMembers.length > 5 && (
                  <p className="text-[10px] text-muted-foreground">+{boardMembers.length - 5} more board members</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 3. Shareholder Votes */}
        {proposals.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <Vote className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">What Shareholders Are Voting On</h4>
            </div>
            <div className="space-y-1.5">
              {proposals.map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-foreground">• {p.proposal}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[8px] px-1.5 py-0 shrink-0",
                      p.tag === "Potentially controversial"
                        ? "border-amber-500/40 text-amber-400"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {p.tag}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Governance Signals */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Governance Signals</h4>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={cn("text-[9px] font-mono", govColor)}
            >
              {proxy.governance_rating || "Unknown"}
            </Badge>
          </div>
          {proxy.governance_notes && (
            <p className="text-[11px] text-muted-foreground">{proxy.governance_notes}</p>
          )}
        </section>

        {/* Tagline */}
        <p className="text-xs font-medium text-foreground pt-1 border-t border-border/30">
          This is what the record shows. Now decide if it works for you.
        </p>

        {/* Source document toggle */}
        <div>
          <button
            onClick={() => setShowSource(!showSource)}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform", showSource && "rotate-180")} />
            {showSource ? "Hide Source Document" : "View Source Document"}
          </button>
          {showSource && proxy.filing_url && (
            <div className="mt-2 p-3 bg-muted/30 rounded-lg">
              <a
                href={proxy.filing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Open DEF 14A on SEC EDGAR
              </a>
              <p className="text-[10px] text-muted-foreground mt-1">
                This links directly to the official SEC filing. The analysis above was extracted from this document.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
