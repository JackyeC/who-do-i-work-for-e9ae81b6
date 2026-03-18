import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Wifi, Monitor, Home, DollarSign, Clock, Eye,
  TrendingUp, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

const WORK_MODE_META: Record<string, { icon: any; label: string }> = {
  remote: { icon: Wifi, label: "Remote" },
  hybrid: { icon: Monitor, label: "Hybrid" },
  "on-site": { icon: Home, label: "On-site" },
};

/** Freshness indicator based on posting age */
function getFreshness(createdAt: string) {
  const days = differenceInDays(new Date(), new Date(createdAt));
  if (days <= 3) return { label: "Fresh", className: "text-[hsl(var(--civic-green))]", icon: CheckCircle2 };
  if (days <= 14) return { label: `${days}d ago`, className: "text-muted-foreground", icon: Clock };
  if (days <= 45) return { label: `${days}d ago`, className: "text-[hsl(var(--civic-yellow))]", icon: Clock };
  return { label: "Stale", className: "text-[hsl(var(--civic-red))]", icon: AlertTriangle };
}

function getClarityConfig(score: number) {
  if (score >= 70) return { color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green)/0.12)]", border: "border-[hsl(var(--civic-green)/0.25)]" };
  if (score >= 40) return { color: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow)/0.12)]", border: "border-[hsl(var(--civic-yellow)/0.25)]" };
  return { color: "text-[hsl(var(--civic-red))]", bg: "bg-[hsl(var(--civic-red)/0.12)]", border: "border-[hsl(var(--civic-red)/0.25)]" };
}

export interface SmartJobRowProps {
  job: any;
  isSelected?: boolean;
  matchScore?: number;
  matchLabel?: string;
  onClick: () => void;
}

export function SmartJobRow({ job, isSelected, matchScore, matchLabel, onClick }: SmartJobRowProps) {
  const company = job.companies;
  const civicScore = company?.civic_footprint_score || 0;
  const clarity = getClarityConfig(civicScore);
  const workMode = job.work_mode ? WORK_MODE_META[job.work_mode] : null;
  const freshness = getFreshness(job.posted_at || job.created_at);
  const FreshnessIcon = freshness.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-border/40 transition-all duration-100 hover:bg-muted/40",
        isSelected && "bg-primary/5 border-l-2 border-l-primary"
      )}
    >
      {/* Row 1: Title + Clarity Score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{job.title}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            {company?.slug ? (
              <Link
                to={`/company/${company.slug}`}
                className="text-xs text-foreground/70 hover:text-primary hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {company?.name}
              </Link>
            ) : (
              <span className="text-xs text-foreground/70">{company?.name}</span>
            )}
            {job.location && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <MapPin className="w-3 h-3" /> {job.location}
              </span>
            )}
            {workMode && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <workMode.icon className="w-3 h-3" /> {workMode.label}
              </span>
            )}
          </div>
        </div>

        {/* Clarity Score */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border", clarity.bg, clarity.border, clarity.color)}>
                {civicScore}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs max-w-[180px]">
              <p className="font-semibold">Clarity Score {civicScore}/100</p>
              <p className="text-muted-foreground">Employer transparency across governance, lobbying, and workforce data.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Row 2: Signals strip */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {/* Freshness */}
        <Badge variant="outline" className={cn("text-[10px] gap-0.5 py-0", freshness.className)}>
          <FreshnessIcon className="w-2.5 h-2.5" /> {freshness.label}
        </Badge>

        {/* Salary / Pay Transparency */}
        {job.salary_range ? (
          <Badge variant="outline" className="text-[10px] gap-0.5 py-0 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green)/0.2)]">
            <DollarSign className="w-2.5 h-2.5" /> {job.salary_range}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] gap-0.5 py-0 text-muted-foreground border-dashed">
            <DollarSign className="w-2.5 h-2.5" /> No salary posted
          </Badge>
        )}

        {/* Values fit */}
        {matchScore != null && matchScore > 0 && (
          <Badge variant="outline" className={cn(
            "text-[10px] gap-0.5 py-0",
            matchScore >= 3 ? "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green)/0.2)] bg-[hsl(var(--civic-green)/0.06)]" :
            matchScore >= 2 ? "text-primary border-primary/20 bg-primary/5" :
            "text-muted-foreground"
          )}>
            <TrendingUp className="w-2.5 h-2.5" />
            {matchLabel || (matchScore >= 3 ? "Strong fit" : matchScore >= 2 ? "Good fit" : "Partial fit")}
          </Badge>
        )}

        {/* Seniority */}
        {job.seniority_level && (
          <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
            {job.seniority_level}
          </Badge>
        )}

        {/* Department */}
        {job.department && (
          <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
            {job.department}
          </Badge>
        )}
      </div>
    </button>
  );
}
