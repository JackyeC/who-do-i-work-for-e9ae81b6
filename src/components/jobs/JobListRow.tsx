import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { JobMatchBadge } from "./JobMatchBadge";
import { VALUES_LENSES } from "@/lib/valuesLenses";
import {
  Building2, MapPin, Wifi, Monitor, Home, DollarSign,
  Bot, Heart, MessageSquare, Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

const WORK_MODE_ICONS: Record<string, any> = {
  remote: Wifi, hybrid: Monitor, "on-site": Home,
};

const SOURCE_LABELS: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
  workable: "Workable",
  custom: "Careers Page",
};

/** Signal indicator pills — neutral detection language */
const SIGNAL_INDICATORS = [
  { key: "benefits", label: "Benefits", icon: Heart, className: "text-[hsl(var(--civic-green))]" },
  { key: "hiring_tech", label: "Hiring Tech", icon: Bot, className: "text-[hsl(var(--civic-blue))]" },
  { key: "sentiment", label: "Sentiment", icon: MessageSquare, className: "text-[hsl(var(--civic-yellow))]" },
  { key: "influence", label: "Influence", icon: Landmark, className: "text-muted-foreground" },
];

function getCivicScoreExplainer(score: number): string {
  if (score >= 70) return "Strong transparency signals across governance, lobbying, and workforce data.";
  if (score >= 40) return "Mixed transparency signals — some areas lack public disclosure.";
  return "Limited transparency signals detected. Proceed with independent research.";
}

interface JobListRowProps {
  job: any;
  companyValueSignals?: any[];
  companySignalFlags?: string[];
  matchScore?: number;
  isSelected?: boolean;
  onClick: () => void;
}

export function JobListRow({ job, companyValueSignals = [], companySignalFlags = [], matchScore, isSelected, onClick }: JobListRowProps) {
  const company = job.companies;
  const WorkModeIcon = job.work_mode ? WORK_MODE_ICONS[job.work_mode] : null;
  const isSponsored = job.is_sponsored && (!job.sponsor_expires_at || new Date(job.sponsor_expires_at) > new Date());
  const civicScore = company?.civic_footprint_score || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 sm:p-4 rounded-xl border transition-all duration-150 hover:shadow-elegant group",
        isSponsored && "border-primary/20 bg-primary/[0.02]",
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-elegant"
          : !isSponsored && "border-border bg-card hover:border-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate text-sm">{job.title}</h3>
            {matchScore != null && <JobMatchBadge score={matchScore} />}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {company?.slug ? (
              <Link
                to={`/company/${company.slug}`}
                className="font-medium text-foreground/80 flex items-center gap-1 hover:text-primary hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Building2 className="w-3 h-3" />
                {company?.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground/80 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {company?.name}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location}
              </span>
            )}
            {job.work_mode && WorkModeIcon && (
              <span className="flex items-center gap-1 capitalize">
                <WorkModeIcon className="w-3 h-3" />
                {job.work_mode}
              </span>
            )}
          </div>

          {/* Salary + signal indicators + values badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {job.salary_range && (
              <span className="text-xs font-medium text-[hsl(var(--civic-green))] flex items-center gap-0.5">
                <DollarSign className="w-3 h-3" />{job.salary_range}
              </span>
            )}
            {job.source_platform && job.source_platform !== "custom" && (
              <Badge variant="outline" className="text-[10px] bg-muted/50">
                via {SOURCE_LABELS[job.source_platform] || job.source_platform}
              </Badge>
            )}
            {/* Signal indicator badges */}
            {SIGNAL_INDICATORS.map((sig) => {
              if (!companySignalFlags.includes(sig.key)) return null;
              const Icon = sig.icon;
              return (
                <Badge key={sig.key} variant="outline" className="text-[10px] gap-0.5">
                  <Icon className={`w-3 h-3 ${sig.className}`} />
                  {sig.label}
                </Badge>
              );
            })}
            {/* Value category badges — certified vs uncertified */}
            {companyValueSignals.slice(0, 3).map((vs: any, idx: number) => {
              const cat = VALUES_LENSES.find((c) => c.key === vs.value_category || c.key === vs.values_lens);
              if (!cat) return null;
              const Icon = cat.icon;
              const isCertified = company?.vetted_status === "certified";
              return (
                <TooltipProvider key={idx} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] gap-0.5",
                          !isCertified && "opacity-60 border-dashed"
                        )}
                      >
                        <Icon className={cn("w-3 h-3", isCertified ? "text-[hsl(var(--civic-green))]" : "text-muted-foreground")} />
                        {isCertified ? cat.label : `${cat.label} — Pending`}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-xs">
                      {isCertified
                        ? "Verified by Narrative Alignment Audit"
                        : "This employer has not completed the $599 Narrative Alignment Package. Stance is unverified."}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Civic score mini — with tooltip explainer + clickable to company profile */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={company?.slug ? `/company/${company.slug}` : "#"}
                className="shrink-0 flex flex-col items-center gap-0.5 hover:scale-105 transition-transform"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border",
                    civicScore >= 70
                      ? "bg-[hsl(var(--civic-green)/0.15)] border-[hsl(var(--civic-green)/0.3)] text-[hsl(var(--civic-green))]"
                      : civicScore >= 40
                      ? "bg-[hsl(var(--civic-yellow)/0.15)] border-[hsl(var(--civic-yellow)/0.3)] text-[hsl(var(--civic-yellow))]"
                      : "bg-[hsl(var(--civic-red)/0.15)] border-[hsl(var(--civic-red)/0.3)] text-[hsl(var(--civic-red))]"
                  )}
                >
                  {civicScore}
                </div>
                <span className="text-[9px] text-muted-foreground">Civic Score</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px] text-xs leading-relaxed">
              <p className="font-semibold mb-1">Civic Footprint Score™ ({civicScore}/100)</p>
              <p className="text-muted-foreground">{getCivicScoreExplainer(civicScore)}</p>
              <p className="text-primary mt-1 text-[10px]">Click to view full company profile →</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </button>
  );
}
