import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database, CheckCircle, AlertTriangle, XCircle, Clock,
  Shield, BarChart3, Layers, HelpCircle, Link2, ExternalLink,
  Wand2, Globe, Eye, CheckCircle2, X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IdentityStatusBadge, deriveIdentityStatus } from "@/components/IdentityStatusBadge";
import { toast } from "sonner";

/* ─── Coverage level mapping ─── */
type CoverageLevel = "strong" | "limited" | "none";

function mapStatusToCoverage(status: string): CoverageLevel {
  if (status === "healthy") return "strong";
  if (status === "delayed" || status === "partial") return "limited";
  return "none";
}

const COVERAGE_META: Record<CoverageLevel, { label: string; color: string; dot: string }> = {
  strong:  { label: "Strong Coverage",  color: "text-civic-green",        dot: "bg-civic-green" },
  limited: { label: "Limited Coverage", color: "text-civic-yellow",       dot: "bg-civic-yellow" },
  none:    { label: "No Recent Data",   color: "text-muted-foreground",   dot: "bg-muted-foreground" },
};

const SOURCE_DESCRIPTIONS: Record<string, Record<CoverageLevel, string>> = {
  "SEC / Corporate": {
    strong:  "Recent filings available and up to date.",
    limited: "Some corporate filings found, may not reflect latest activity.",
    none:    "No recent corporate filings found in public records.",
  },
  "WARN Notices": {
    strong:  "Recent layoff data available and current.",
    limited: "Some recent layoff data found, may not be complete.",
    none:    "No recent layoff notices found in public records.",
  },
  "FEC / Political": {
    strong:  "Public political contributions available and current.",
    limited: "Public political contributions available, limited recent activity.",
    none:    "No recent political contribution records found.",
  },
  "News / Briefings": {
    strong:  "Recent verified news sources available.",
    limited: "Some news coverage found, not recently updated.",
    none:    "No recent verified news sources found.",
  },
  "OSHA": {
    strong:  "Safety records available and current.",
    limited: "Some safety records available.",
    none:    "No recent safety records found.",
  },
  "Manual Research": {
    strong:  "Verified signals added through research.",
    limited: "Some manually verified data available.",
    none:    "No manual research data available yet.",
  },
};

function CoverageDot({ level }: { level: CoverageLevel }) {
  return <span className={cn("w-2 h-2 rounded-full inline-block", COVERAGE_META[level].dot)} />;
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic py-3">{text}</p>;
}

export function SignalsDataTab() {
  const [backfillRunning, setBackfillRunning] = useState(false);
  const queryClient = useQueryClient();
  // ─── Companies with dossier text but no website_url (same definition as Today tab) ───
  const { data: websiteGaps, isLoading: websiteGapsLoading } = useQuery({
    queryKey: ["founder-signals-website-gaps"],
    queryFn: async () => {
      const [countRes, listRes] = await Promise.all([
        supabase
          .from("companies")
          .select("id", { count: "exact", head: true })
          .is("website_url", null)
          .not("description", "is", null),
        supabase
          .from("companies")
          .select("id, name, slug")
          .is("website_url", null)
          .not("description", "is", null)
          .order("name", { ascending: true })
          .limit(40),
      ]);
      return {
        total: countRes.count ?? 0,
        rows: listRes.data ?? [],
        listError: listRes.error,
      };
    },
  });

  // ─── Coverage Snapshot ───
  const { data: coverage, isLoading: coverageLoading } = useQuery({
    queryKey: ["founder-signals-coverage"],
    queryFn: async () => {
      const staleDate = new Date(Date.now() - 90 * 86400000).toISOString();
      const [total, verified, missing, stale] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }).not("description", "is", null).gt("employer_clarity_score", 0),
        supabase.from("companies").select("id", { count: "exact", head: true }).or("description.is.null,employer_clarity_score.eq.0"),
        supabase.from("companies").select("id", { count: "exact", head: true }).lt("updated_at", staleDate),
      ]);
      return {
        total: total.count ?? 0,
        verified: verified.count ?? 0,
        missing: missing.count ?? 0,
        stale: stale.count ?? 0,
      };
    },
  });

  // ─── Source Status ───
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["founder-signals-sources"],
    queryFn: async () => {
      const [sec, warn, fec, news] = await Promise.all([
        supabase.from("company_corporate_structure").select("created_at").order("created_at", { ascending: false }).limit(1),
        supabase.from("company_warn_notices").select("created_at").order("created_at", { ascending: false }).limit(1),
        supabase.from("company_candidates").select("id").limit(1),
        supabase.from("briefing_signals").select("published_at").order("published_at", { ascending: false }).limit(1),
      ]);

      const getStatus = (data: any[] | null, dateField = "created_at") => {
        if (!data || data.length === 0) return "offline";
        const lastDate = new Date(data[0][dateField] || data[0].published_at);
        const age = Date.now() - lastDate.getTime();
        if (age < 86400000) return "healthy";
        if (age < 7 * 86400000) return "delayed";
        return "partial";
      };

      const unsorted = [
        { name: "SEC / Corporate", status: getStatus(sec.data) },
        { name: "WARN Notices", status: getStatus(warn.data) },
        { name: "FEC / Political", status: getStatus(fec.data, "id") },
        { name: "News / Briefings", status: getStatus(news.data, "published_at") },
        { name: "OSHA", status: "partial" as const },
        { name: "Manual Research", status: "healthy" as const },
      ];
      const order: Record<CoverageLevel, number> = { strong: 0, limited: 1, none: 2 };
      return unsorted.sort((a, b) => order[mapStatusToCoverage(a.status)] - order[mapStatusToCoverage(b.status)]);
    },
  });

  // ─── Claim Attribution Monitor (company_claims + company_corporate_claims) ───
  const { data: claimSafety, isLoading: claimsLoading } = useQuery({
    queryKey: ["founder-signals-claims"],
    queryFn: async () => {
      // Legacy corporate claims
      const [totalCorporate, corpWithUrl, corpMulti, corpInferred, corpNone] = await Promise.all([
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).not("claim_source_url", "is", null),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).is("claim_source_url", null).eq("extraction_method", "multi_source"),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).is("claim_source_url", null).not("claim_source", "is", null).neq("extraction_method", "multi_source"),
        supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).is("claim_source_url", null).is("claim_source", null),
      ]);

      // New structured claims — attribution enforcement + platform-wide counts
      const [totalNew, newAttributed, newUnattributed, companiesWithClaims, totalCompanies] = await Promise.all([
        (supabase as any).from("company_claims").select("id", { count: "exact", head: true }).eq("is_active", true),
        (supabase as any).from("company_claims").select("id", { count: "exact", head: true }).eq("is_active", true).not("source_url", "is", null).not("source_label", "is", null),
        (supabase as any).from("company_claims").select("id, company_id, claim_text, source_label, claim_type", { count: "exact" }).eq("is_active", true).or("source_url.is.null,source_label.is.null"),
        (supabase as any).from("company_claims").select("company_id").eq("is_active", true),
        supabase.from("companies").select("id", { count: "exact", head: true }),
      ]);

      // Count distinct companies with claims
      const uniqueCompaniesWithClaims = new Set((companiesWithClaims.data ?? []).map((r: any) => r.company_id)).size;

      // Per-company breakdown of unattributed claims
      const unattributedList = (newUnattributed.data ?? []) as any[];
      const perCompany: Record<string, { count: number; claims: string[] }> = {};
      for (const c of unattributedList) {
        const cid = c.company_id;
        if (!perCompany[cid]) perCompany[cid] = { count: 0, claims: [] };
        perCompany[cid].count++;
        if (perCompany[cid].claims.length < 3) perCompany[cid].claims.push(c.claim_text?.slice(0, 80) || "Untitled");
      }

      const total = (totalCorporate.count ?? 0) + (totalNew.count ?? 0);
      const verified = (corpWithUrl.count ?? 0) + (newAttributed.count ?? 0);
      const multi = corpMulti.count ?? 0;
      const inferred = corpInferred.count ?? 0;
      const none = (corpNone.count ?? 0) + (newUnattributed.count ?? 0);
      return {
        totalClaims: total,
        verified,
        multiSource: multi,
        inferred,
        noEvidence: none,
        missingSources: total - verified,
        unattributedPerCompany: perCompany,
        unattributedCount: newUnattributed.count ?? 0,
        companiesWithClaims: uniqueCompaniesWithClaims,
        companiesWithoutClaims: (totalCompanies.count ?? 0) - uniqueCompaniesWithClaims,
        totalCompanies: totalCompanies.count ?? 0,
      };
    },
  });

  // ─── Domain Review Queue ───
  const { data: domainReview, isLoading: domainReviewLoading } = useQuery({
    queryKey: ["founder-domain-review-queue"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("domain_review_queue")
        .select("id, company_id, discovered_url, discovered_domain, confidence, source_method, source_detail, status, created_at, companies!domain_review_queue_company_id_fkey(name, slug)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) console.error("domain review query error:", error);
      return data ?? [];
    },
  });

  // ─── Identity Status Counts ───
  const { data: identityStats, isLoading: identityStatsLoading } = useQuery({
    queryKey: ["founder-identity-stats"],
    queryFn: async () => {
      const [complete, partial, missing, autoFilled] = await Promise.all([
        (supabase as any).from("companies").select("id", { count: "exact", head: true }).eq("identity_status", "complete"),
        (supabase as any).from("companies").select("id", { count: "exact", head: true }).eq("identity_status", "partial"),
        (supabase as any).from("companies").select("id", { count: "exact", head: true }).eq("identity_status", "missing"),
        (supabase as any).from("companies").select("id", { count: "exact", head: true }).eq("domain_auto_filled", true),
      ]);
      return {
        complete: complete.count ?? 0,
        partial: partial.count ?? 0,
        missing: missing.count ?? 0,
        autoFilled: autoFilled.count ?? 0,
      };
    },
  });

  const runBackfill = async () => {
    setBackfillRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("backfill-website-urls", {
        body: { batchSize: 20 },
      });
      if (error) throw error;
      toast.success(`Backfill complete: ${data.autoFilled} auto-filled, ${data.queuedForReview} queued for review`);
      queryClient.invalidateQueries({ queryKey: ["founder-signals-website-gaps"] });
      queryClient.invalidateQueries({ queryKey: ["founder-domain-review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["founder-identity-stats"] });
    } catch (err: any) {
      toast.error("Backfill failed: " + (err.message || "Unknown error"));
    } finally {
      setBackfillRunning(false);
    }
  };

  const handleReviewAction = async (reviewId: string, action: "approved" | "rejected", companyId: string, url: string, domain: string) => {
    try {
      if (action === "approved") {
        await supabase.from("companies").update({
          website_url: url,
          domain,
          domain_source: "admin_review",
          domain_auto_filled: false,
          domain_confidence: "high",
        } as any).eq("id", companyId);
      }
      await (supabase as any).from("domain_review_queue").update({
        status: action,
        reviewed_at: new Date().toISOString(),
      }).eq("id", reviewId);
      toast.success(action === "approved" ? "Domain approved and applied" : "Domain rejected");
      queryClient.invalidateQueries({ queryKey: ["founder-domain-review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["founder-signals-website-gaps"] });
      queryClient.invalidateQueries({ queryKey: ["founder-identity-stats"] });
    } catch (err: any) {
      toast.error("Action failed: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Identity Status Overview */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Identity Resolution Status
        </h3>
        {identityStatsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/20 rounded-xl p-3 border border-border/30 text-center">
              <IdentityStatusBadge status="complete" className="mx-auto mb-1" />
              <p className="text-lg font-bold tabular-nums text-foreground">{identityStats?.complete ?? 0}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3 border border-border/30 text-center">
              <IdentityStatusBadge status="partial" className="mx-auto mb-1" />
              <p className="text-lg font-bold tabular-nums text-foreground">{identityStats?.partial ?? 0}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3 border border-border/30 text-center">
              <IdentityStatusBadge status="missing" className="mx-auto mb-1" />
              <p className="text-lg font-bold tabular-nums text-foreground">{identityStats?.missing ?? 0}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3 border border-border/30 text-center">
              <Badge variant="outline" className="text-xs gap-1 mx-auto mb-1 text-primary border-primary/30 bg-primary/8">
                <Wand2 className="w-3 h-3" /> Auto-Filled
              </Badge>
              <p className="text-lg font-bold tabular-nums text-foreground">{identityStats?.autoFilled ?? 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Website URL backfill — matches founder "missing website URL" metric (not live HTTP checks) */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-amber-600" /> Company website URLs
        </h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          These companies have a written dossier but no <span className="font-mono text-[11px]">website_url</span> in the database.
          Use the <strong className="font-medium text-foreground">AI Backfill</strong> button to auto-discover domains.
          High-confidence results are applied automatically; others go to review.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-2"
            disabled={backfillRunning || (websiteGaps?.total ?? 0) === 0}
            onClick={runBackfill}
          >
            <Wand2 className={cn("w-3.5 h-3.5", backfillRunning && "animate-spin")} />
            {backfillRunning ? "Running AI Backfill…" : `AI Backfill (${websiteGaps?.total ?? 0} missing)`}
          </Button>
        </div>
        {websiteGapsLoading ? (
          <Skeleton className="h-24" />
        ) : websiteGaps!.listError ? (
          <EmptyState text="Could not load the list (check permissions)." />
        ) : websiteGaps!.total === 0 ? (
          <p className="text-xs text-civic-green flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Every company with a dossier has a website URL on file.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-muted-foreground">Missing URL</span>
              <Badge variant="outline" className="font-mono text-amber-800 dark:text-amber-200 border-amber-500/40 bg-amber-500/10">
                {websiteGaps!.total.toLocaleString()} total
              </Badge>
            </div>
            <ul className="max-h-64 overflow-y-auto space-y-1 pr-1 border border-border/40 rounded-lg p-2 bg-muted/10">
              {websiteGaps!.rows.map((row: any) => (
                <li key={row.id}>
                  <Link
                    to={`/company/${row.slug}`}
                    className="flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded-md hover:bg-muted/50 text-foreground group"
                  >
                    <span className="truncate font-medium">{row.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {row.domain_auto_filled && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 text-primary border-primary/30">Auto-Filled</Badge>
                      )}
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {websiteGaps!.total > websiteGaps!.rows.length && (
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                Showing first {websiteGaps!.rows.length} of {websiteGaps!.total.toLocaleString()}. Sort is A–Z by company name.
              </p>
            )}
          </>
        )}
      </div>

      {/* Domain Review Queue */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[hsl(var(--civic-yellow))]" /> Needs Website Review
          {(domainReview?.length ?? 0) > 0 && (
            <Badge variant="outline" className="font-mono text-xs border-[hsl(var(--civic-yellow))]/40 text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10">
              {domainReview!.length}
            </Badge>
          )}
        </h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          These domains were discovered by AI with medium or low confidence. Review and approve or reject.
        </p>
        {domainReviewLoading ? (
          <Skeleton className="h-24" />
        ) : !domainReview || domainReview.length === 0 ? (
          <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" /> No domains pending review.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {domainReview.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-2.5 bg-muted/20 rounded-lg border border-border/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground truncate">
                      {item.companies?.name || "Unknown"}
                    </span>
                    <Badge variant="outline" className={cn("text-[9px] px-1 py-0",
                      item.confidence === "medium" ? "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30" : "text-destructive border-destructive/30"
                    )}>
                      {item.confidence}
                    </Badge>
                  </div>
                  <a href={item.discovered_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline font-mono truncate block">
                    {item.discovered_url}
                  </a>
                  {item.source_detail && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.source_detail}</p>
                  )}
                  <span className="text-[10px] text-muted-foreground">via {item.source_method}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-[hsl(var(--civic-green))] hover:bg-[hsl(var(--civic-green))]/10"
                    onClick={() => handleReviewAction(item.id, "approved", item.company_id, item.discovered_url, item.discovered_domain)}
                    title="Approve"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleReviewAction(item.id, "rejected", item.company_id, item.discovered_url, item.discovered_domain)}
                    title="Reject"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coverage Snapshot */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Coverage Snapshot
        </h3>
        {coverageLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CoverageCard label="Total indexed" value={coverage!.total} icon={BarChart3} color="text-foreground" />
            <CoverageCard label="Verified source" value={coverage!.verified} icon={CheckCircle} color="text-civic-green" />
            <CoverageCard label="Missing evidence" value={coverage!.missing} icon={XCircle} color="text-destructive" />
            <CoverageCard label="Stale data (90d+)" value={coverage!.stale} icon={Clock} color="text-civic-yellow" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Coverage */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-civic-green" /> Data Coverage
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            How much public data is available for this company right now.
          </p>
          {sourcesLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : !sources || sources.length === 0 ? (
            <EmptyState text="No data has been indexed here yet." />
          ) : (
            <>
              <div className="space-y-2">
                {sources.map((s) => {
                  const level = mapStatusToCoverage(s.status);
                  const meta = COVERAGE_META[level];
                  const desc = SOURCE_DESCRIPTIONS[s.name]?.[level] ?? "";
                  return (
                    <div key={s.name} className="p-2.5 bg-muted/20 rounded-lg border border-border/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground font-medium">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <CoverageDot level={level} />
                          <span className={cn("text-xs font-medium", meta.color)}>{meta.label}</span>
                        </div>
                      </div>
                      {desc && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-3 italic">
                More data becomes available as additional sources are indexed.
              </p>
            </>
          )}
        </div>

        {/* Claim Safety Monitor — Tier Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-civic-yellow" /> Claim Attribution Monitor
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Every claim must carry a source label. Claims without attribution are suppressed from display.
          </p>
        {claimsLoading ? (
            <Skeleton className="h-20" />
          ) : claimSafety!.totalClaims === 0 ? (
            <EmptyState text="No claims have been indexed yet." />
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total claims</span>
                <span className="font-mono font-medium text-foreground">{claimSafety!.totalClaims}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-civic-green"><CheckCircle className="w-3 h-3" /> Verified Source</span>
                <span className="font-mono font-medium text-civic-green">{claimSafety!.verified}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-primary"><Layers className="w-3 h-3" /> Multi-Source Signal</span>
                <span className="font-mono font-medium text-primary">{claimSafety!.multiSource}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5" style={{ color: "hsl(var(--civic-yellow))" }}><HelpCircle className="w-3 h-3" /> Inferred</span>
                <span className="font-mono font-medium" style={{ color: "hsl(var(--civic-yellow))" }}>{claimSafety!.inferred}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><XCircle className="w-3 h-3" /> Unattributed (suppressed)</span>
                <span className={cn("font-mono font-medium", claimSafety!.noEvidence > 0 ? "text-destructive" : "text-muted-foreground")}>{claimSafety!.noEvidence}</span>
              </div>

              {/* Platform-wide company coverage */}
              <div className="border-t border-border/40 pt-2 mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Companies with verified claims</span>
                  <span className="font-mono font-medium text-civic-green">{claimSafety!.companiesWithClaims} / {claimSafety!.totalCompanies}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Companies without claims</span>
                  <span className={cn("font-mono font-medium", claimSafety!.companiesWithoutClaims > 0 ? "text-civic-yellow" : "text-muted-foreground")}>{claimSafety!.companiesWithoutClaims}</span>
                </div>
              </div>

              {/* Unattributed per-company breakdown */}
              {claimSafety!.unattributedCount > 0 && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {claimSafety!.unattributedCount} unattributed claim{claimSafety!.unattributedCount !== 1 ? "s" : ""} hidden from public display
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {Object.entries(claimSafety!.unattributedPerCompany).map(([companyId, info]: [string, any]) => (
                      <div key={companyId} className="text-xs bg-background/50 rounded-md p-2 border border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-muted-foreground truncate">{companyId.slice(0, 8)}…</span>
                          <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">{info.count} missing</Badge>
                        </div>
                        <ul className="mt-1 space-y-0.5">
                          {info.claims.map((text: string, i: number) => (
                            <li key={i} className="text-[10px] text-muted-foreground truncate">• {text}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {claimSafety!.noEvidence === 0 && claimSafety!.totalClaims > 0 && (
                <p className="text-xs text-civic-green bg-civic-green/5 border border-civic-green/20 rounded-lg p-2">
                  ✓ All claims have source attribution. Nothing is suppressed.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoverageCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: typeof Database; color: string;
}) {
  return (
    <div className="bg-muted/20 rounded-xl p-3 border border-border/30 text-center">
      <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
      <p className={cn("text-lg font-bold tabular-nums", color)}>{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
