import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/CompanyLogo";
import { MatchIndicator } from "@/components/jobs/MatchIndicator";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import {
  Shield, ShieldCheck, ExternalLink, Sparkles, Network, Eye, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { JobQualityBadge } from "@/components/jobs/JobQualityBadge";
import { evaluateJobQuality, hasEvergreenSignals, detectRepost } from "@/lib/jobQuality";
import { cn } from "@/lib/utils";

function trackApplyClick(jobId: string, companyId: string, url: string) {
  supabase.from("job_click_events").insert({
    job_id: jobId,
    company_id: companyId,
    click_type: "apply",
    destination_url: url,
  }).then(() => {});
}

interface JobIntegrityCardProps {
  job: {
    id: string;
    title: string;
    location: string | null;
    work_mode: string | null;
    url: string | null;
    created_at: string;
    posted_at?: string | null;
    company_id: string;
    salary_range?: string | null;
    companies?: {
      name: string;
      slug: string;
      logo_url: string | null;
      vetted_status: string | null;
      jackye_insight: string | null;
      description: string | null;
      civic_footprint_score?: number;
    };
  };
  matchCount?: number;
  matchedCategories?: string[];
  fitBadges?: string[];
  fitScore?: number;
  leverageLevel?: "low" | "medium" | "high";
}

export function JobIntegrityCard({ job, matchCount = 0, matchedCategories = [], fitBadges = [], fitScore, leverageLevel }: JobIntegrityCardProps) {
  const co = job.companies;
  const isCertified = co?.vetted_status === "certified";
  const isVerified = co?.vetted_status === "verified";
  const qualitySignal = evaluateJobQuality(job as any);
  const isEvergreen = hasEvergreenSignals((job as any).description);

  const { data: research } = useQuery({
    queryKey: ["job-research-snippet", job.company_id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_research")
        .select("connection_chain, research_summary")
        .eq("company_id", job.company_id)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!job.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className={cn(
      "bg-card/80 backdrop-blur-sm border-border/30 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group",
      isCertified && "ring-1 ring-amber-500/20 border-amber-500/15 hover:shadow-amber-500/10"
    )}>
      <CardContent className="p-4 md:p-5 space-y-2.5 md:space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <CompanyLogo companyName={co?.name || "Unknown"} logoUrl={co?.logo_url} size="sm" />
          <div className="flex-1 min-w-0">
            <Link to={`/job-board/${job.id}`} className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
              {job.title}
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Link to={`/company/${co?.slug}`} className="text-xs text-primary hover:underline">
                {co?.name || "Unknown Company"}
              </Link>
              {isVerified && (
                <Badge variant="outline" className="text-[9px] gap-0.5 bg-primary/5 text-primary border-primary/20">
                  <Shield className="w-2.5 h-2.5" /> Verified
                </Badge>
              )}
              {isCertified && (
                <Badge variant="outline" className="text-[9px] gap-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <ShieldCheck className="w-2.5 h-2.5" /> Certified
                </Badge>
              )}
              <MatchIndicator matchCount={matchCount} matchedCategories={matchedCategories} />
              {fitScore !== undefined && fitScore > 0 && (
                <Badge variant="outline" className={cn(
                  "text-[9px] gap-0.5",
                  fitScore >= 75 ? "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" :
                  fitScore >= 50 ? "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20" :
                  "bg-muted/50 text-muted-foreground border-border/30"
                )}>
                  {fitScore}% fit
                </Badge>
              )}
              {leverageLevel && (
                <Badge variant="outline" className={cn(
                  "text-[9px] gap-0.5",
                  leverageLevel === "high" ? "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" :
                  leverageLevel === "medium" ? "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20" :
                  "bg-muted/50 text-muted-foreground border-border/30"
                )}>
                  {leverageLevel === "high" ? "High" : leverageLevel === "medium" ? "Med" : "Low"} Lev.
                </Badge>
              )}
              {fitBadges.map((badge) => (
                <Badge key={badge} variant="outline" className={cn(
                  "text-[9px] gap-0.5",
                  badge === "Strong Fit" && "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20",
                  badge === "Flexible Work Fit" && "bg-primary/5 text-primary border-primary/20",
                  (badge === "Location Mismatch" || badge === "Compensation Mismatch" || badge === "Relocation Required") && "bg-destructive/10 text-destructive border-destructive/20",
                )}>
                  {badge}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {job.location || "Remote"} {job.work_mode ? `· ${job.work_mode}` : ""}
            </p>
            {/* Quality signal */}
            <div className="mt-1">
              <JobQualityBadge signal={qualitySignal} isEvergreen={isEvergreen} />
            </div>
          </div>
        </div>

        {/* Strategic Context */}
        {co?.jackye_insight && (
          <div className="p-3 bg-primary/[0.04] border border-primary/10 rounded-lg backdrop-blur-sm">
            <p className="text-[10px] font-medium text-primary mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Strategic Context
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {co.jackye_insight}
            </p>
          </div>
        )}

        {/* Connection Chain snippet */}
        {research?.connection_chain && (
          <div className="p-3 bg-muted/20 border border-border/30 rounded-lg backdrop-blur-sm">
            <p className="text-[10px] font-medium text-foreground mb-1 flex items-center gap-1">
              <Network className="w-3 h-3 text-muted-foreground" /> Connection Chain
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {research.connection_chain}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {job.url ? (
            <Button size="sm" asChild className="gap-1.5 flex-1"
              onClick={() => trackApplyClick(job.id, job.company_id, job.url!)}>
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          ) : co?.slug ? (
            <Button size="sm" variant="secondary" asChild className="gap-1.5 flex-1"
              onClick={() => trackApplyClick(job.id, job.company_id, `/company/${co.slug}`)}>
              <Link to={`/company/${co.slug}`}>
                View All Roles at {co.name} <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
          ) : (
            <Button size="sm" disabled className="gap-1.5 flex-1">
              Apply
            </Button>
          )}
          <SaveJobButton job={job as any} size="icon" className="h-8 w-8" />
          <Button size="sm" variant="outline" asChild className="gap-1 shrink-0">
            <Link to={`/job-board/${job.id}`}>
              <ChevronRight className="w-3 h-3" /> Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
