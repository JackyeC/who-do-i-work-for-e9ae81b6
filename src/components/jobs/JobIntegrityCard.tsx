import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/CompanyLogo";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { Shield, ShieldCheck, ExternalLink, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { JobQualityBadge } from "@/components/jobs/JobQualityBadge";
import { evaluateJobQuality, hasEvergreenSignals } from "@/lib/jobQuality";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
    is_featured?: boolean;
    department?: string | null;
    seniority_level?: string | null;
    companies?: {
      name: string;
      slug: string;
      logo_url: string | null;
      vetted_status: string | null;
      jackye_insight: string | null;
      description: string | null;
      employer_clarity_score?: number;
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
  const clarityScore = co?.employer_clarity_score || 0;
  const postDate = job.posted_at || job.created_at;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 md:p-4 rounded-lg border border-border/30 hover:border-primary/30 hover:bg-muted/20 transition-all group",
      isCertified && "border-[hsl(var(--civic-yellow))]/15",
      job.is_featured && "ring-1 ring-primary/20 bg-primary/[0.02]"
    )}>
      {/* Logo */}
      <Link to={`/dossier/${co?.slug}`} className="shrink-0">
        <CompanyLogo companyName={co?.name || "Unknown"} logoUrl={co?.logo_url} size="sm" />
      </Link>

      {/* Center content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title row */}
        <div className="flex items-start gap-2">
          <Link to={`/job-board/${job.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors leading-tight">
            {job.title}
          </Link>
          {job.is_featured && (
            <Badge variant="outline" className="text-xs gap-0.5 bg-primary/10 text-primary border-primary/20 shrink-0">
              <Star className="w-2.5 h-2.5" /> Featured
            </Badge>
          )}
        </div>

        {/* Company + location */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <Link to={`/dossier/${co?.slug}`} className="text-primary hover:underline font-medium">
            {co?.name || "Unknown Company"}
          </Link>
          <span>·</span>
          <span>{job.location || "Remote"}</span>
          {job.work_mode && (
            <>
              <span>·</span>
              <span className="capitalize">{job.work_mode}</span>
            </>
          )}
          {job.salary_range && (
            <>
              <span>·</span>
              <span className="text-[hsl(var(--civic-green))]">{job.salary_range}</span>
            </>
          )}
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isVerified && (
            <Badge variant="outline" className="text-xs gap-0.5 bg-primary/5 text-primary border-primary/20 py-0">
              <Shield className="w-2.5 h-2.5" /> Verified
            </Badge>
          )}
          {isCertified && (
            <Badge variant="outline" className="text-xs gap-0.5 bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20 py-0">
              <ShieldCheck className="w-2.5 h-2.5" /> Certified
            </Badge>
          )}
          {job.department && (
            <Badge variant="outline" className="text-xs py-0 text-muted-foreground">
              {job.department}
            </Badge>
          )}
          {job.seniority_level && (
            <Badge variant="outline" className="text-xs py-0 text-muted-foreground">
              {job.seniority_level}
            </Badge>
          )}
          <JobQualityBadge signal={qualitySignal} isEvergreen={isEvergreen} />
          {fitScore !== undefined && fitScore >= 70 && (
            <Badge variant="outline" className="text-xs gap-0.5 py-0 bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20">
              {fitScore}% fit
            </Badge>
          )}
          {matchCount >= 2 && (
            <Badge variant="outline" className="text-xs gap-0.5 py-0 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-2.5 h-2.5" /> {matchCount >= 3 ? "Strong" : "Good"} Match
            </Badge>
          )}
        </div>
      </div>

      {/* Right side: clarity score + date + actions */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {/* Clarity score */}
        {clarityScore > 0 && (
          <div className={cn(
            "text-xs font-bold px-2 py-0.5 rounded",
            clarityScore >= 70 ? "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))]" :
            clarityScore >= 40 ? "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))]" :
            "bg-muted/50 text-muted-foreground"
          )}>
            {clarityScore}
          </div>
        )}

        {/* Date */}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(postDate), { addSuffix: false })}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {job.url && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" asChild
              onClick={() => trackApplyClick(job.id, job.company_id, job.url!)}>
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
          <SaveJobButton job={job as any} size="icon" className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
