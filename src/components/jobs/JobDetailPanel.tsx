import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Link } from "react-router-dom";
import {
  ExternalLink, MapPin, Wifi, Monitor, Home, DollarSign,
  Clock, Shield, ShieldCheck, Sparkles, Network, Building2,
  AlertTriangle, Eye, ChevronRight, X, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInDays } from "date-fns";

const WORK_MODE_META: Record<string, { icon: any; label: string }> = {
  remote: { icon: Wifi, label: "Remote" },
  hybrid: { icon: Monitor, label: "Hybrid" },
  "on-site": { icon: Home, label: "On-site" },
};

function getFreshnessLabel(dateStr: string) {
  const days = differenceInDays(new Date(), new Date(dateStr));
  if (days <= 3) return { label: "Fresh listing", color: "text-[hsl(var(--civic-green))]" };
  if (days <= 14) return { label: `Posted ${formatDistanceToNow(new Date(dateStr), { addSuffix: true })}`, color: "text-muted-foreground" };
  if (days <= 45) return { label: `Posted ${days} days ago`, color: "text-[hsl(var(--civic-yellow))]" };
  return { label: "Limited hiring visibility", color: "text-[hsl(var(--civic-red))]" };
}

function getClarityLabel(score: number) {
  if (score >= 70) return "High transparency";
  if (score >= 40) return "Mixed transparency";
  return "Limited transparency";
}

interface JobDetailPanelProps {
  job: any;
  matchCount?: number;
  matchedCategories?: string[];
  onClose: () => void;
}

function trackApplyClick(jobId: string, companyId: string, url: string) {
  supabase.from("job_click_events").insert({
    job_id: jobId,
    company_id: companyId,
    click_type: "apply",
    destination_url: url,
  }).then(() => {});
}

export function JobDetailPanel({ job, matchCount = 0, matchedCategories = [], onClose }: JobDetailPanelProps) {
  const co = job.companies;
  const civicScore = co?.civic_footprint_score || 0;
  const isCertified = co?.vetted_status === "certified";
  const isVerified = co?.vetted_status === "verified";
  const workMode = job.work_mode ? WORK_MODE_META[job.work_mode] : null;
  const freshness = getFreshnessLabel(job.posted_at || job.created_at);

  // Fetch company research
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
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border/60 flex items-start gap-3">
        <CompanyLogo companyName={co?.name || "Unknown"} logoUrl={co?.logo_url} size="sm" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground text-base leading-tight">{job.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Link to={`/company/${co?.slug}`} className="text-sm text-primary hover:underline font-medium">
              {co?.name || "Unknown Company"}
            </Link>
            {isVerified && (
              <Badge variant="outline" className="text-[10px] gap-0.5 bg-primary/5 text-primary border-primary/20">
                <Shield className="w-2.5 h-2.5" /> Verified
              </Badge>
            )}
            {isCertified && (
              <Badge variant="outline" className="text-[10px] gap-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                <ShieldCheck className="w-2.5 h-2.5" /> Certified
              </Badge>
            )}
          </div>
        </div>
        <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
          )}
          {workMode && (
            <span className="flex items-center gap-1"><workMode.icon className="w-3 h-3" /> {workMode.label}</span>
          )}
          {job.employment_type && (
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.employment_type}</span>
          )}
          <span className={cn("flex items-center gap-1", freshness.color)}>
            <Clock className="w-3 h-3" /> {freshness.label}
          </span>
        </div>

        {/* Salary + Clarity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Compensation</p>
            {job.salary_range ? (
              <p className="text-sm font-semibold text-[hsl(var(--civic-green))] flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> {job.salary_range}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not disclosed</p>
            )}
          </div>
          <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Clarity Score</p>
            <p className={cn(
              "text-sm font-semibold",
              civicScore >= 70 ? "text-[hsl(var(--civic-green))]" :
              civicScore >= 40 ? "text-[hsl(var(--civic-yellow))]" :
              "text-[hsl(var(--civic-red))]"
            )}>
              {civicScore}/100 · {getClarityLabel(civicScore)}
            </p>
          </div>
        </div>

        {/* Values fit */}
        {matchCount > 0 && (
          <div className="p-3 rounded-lg border border-primary/15 bg-primary/[0.03]">
            <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Values Alignment
            </p>
            <p className="text-xs text-foreground">
              {matchCount >= 3 ? "Strong alignment" : matchCount >= 2 ? "Good alignment" : "Partial alignment"} with your priorities
            </p>
            {matchedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {matchedCategories.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px] py-0 bg-primary/5 border-primary/15 text-primary">
                    {c.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Strategic Context */}
        {co?.jackye_insight && (
          <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
            <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Eye className="w-3 h-3 text-muted-foreground" /> Strategic Context
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{co.jackye_insight}</p>
          </div>
        )}

        {/* Connection Chain */}
        {research?.connection_chain && (
          <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
            <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Network className="w-3 h-3 text-muted-foreground" /> Connection Chain
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{research.connection_chain}</p>
          </div>
        )}

        {/* Job Description */}
        {job.description && (
          <div>
            <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-2">About This Role</p>
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-[20]">
              {job.description}
            </div>
          </div>
        )}

        {/* Company snapshot */}
        {co?.description && (
          <div>
            <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-2">About {co.name}</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{co.description}</p>
          </div>
        )}

        <Separator />

        {/* Before you apply */}
        <div className="p-3 rounded-lg border border-[hsl(var(--civic-yellow)/0.2)] bg-[hsl(var(--civic-yellow)/0.04)]">
          <p className="text-[10px] font-medium text-[hsl(var(--civic-yellow))] uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Before You Apply
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {!job.salary_range && <li>• No salary disclosed — ask early in the process</li>}
            {civicScore < 40 && <li>• Limited transparency signals — do independent research</li>}
            {differenceInDays(new Date(), new Date(job.posted_at || job.created_at)) > 30 && (
              <li>• Listing is {differenceInDays(new Date(), new Date(job.posted_at || job.created_at))} days old — confirm it's still active</li>
            )}
            <li>• Review the <Link to={`/company/${co?.slug}`} className="text-primary hover:underline">full company profile</Link> before deciding</li>
          </ul>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="p-4 border-t border-border/60 space-y-2">
        {job.url ? (
          <Button className="w-full gap-2" asChild
            onClick={() => trackApplyClick(job.id, job.company_id, job.url!)}>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              Apply Now <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        ) : (
          <Button className="w-full gap-2" variant="secondary" asChild>
            <Link to={`/company/${co?.slug}`}>
              View All Roles <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        )}
        <Button variant="outline" className="w-full gap-2 text-xs" asChild>
          <Link to={`/company/${co?.slug}`}>
            <Building2 className="w-3 h-3" /> Full Company Intelligence
          </Link>
        </Button>
      </div>
    </div>
  );
}
