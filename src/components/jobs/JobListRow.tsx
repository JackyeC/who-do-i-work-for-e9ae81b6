import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { JobMatchBadge } from "./JobMatchBadge";
import { VALUE_CATEGORIES } from "@/components/ValuesPreferenceSidebar";
import {
  Building2, MapPin, Wifi, Monitor, Home, DollarSign,
  Bot, Heart, MessageSquare, Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 sm:p-4 rounded-xl border transition-all duration-150 hover:shadow-elegant group",
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-elegant"
          : "border-border bg-card hover:border-primary/20"
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
            <span className="font-medium text-foreground/80 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {company?.name}
            </span>
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
            {/* Value category badges */}
            {companyValueSignals.slice(0, 3).map((vs: any, idx: number) => {
              const cat = VALUE_CATEGORIES.find((c) => c.key === vs.value_category);
              if (!cat) return null;
              const Icon = cat.icon;
              return (
                <Badge key={idx} variant="outline" className="text-[10px] gap-0.5">
                  <Icon className={`w-3 h-3 ${cat.color}`} />
                  {cat.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Civic score mini */}
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border",
              (company?.civic_footprint_score || 0) >= 70
                ? "bg-[hsl(var(--civic-green)/0.15)] border-[hsl(var(--civic-green)/0.3)] text-[hsl(var(--civic-green))]"
                : (company?.civic_footprint_score || 0) >= 40
                ? "bg-[hsl(var(--civic-yellow)/0.15)] border-[hsl(var(--civic-yellow)/0.3)] text-[hsl(var(--civic-yellow))]"
                : "bg-[hsl(var(--civic-red)/0.15)] border-[hsl(var(--civic-red)/0.3)] text-[hsl(var(--civic-red))]"
            )}
          >
            {company?.civic_footprint_score || 0}
          </div>
          <span className="text-[9px] text-muted-foreground">Civic</span>
        </div>
      </div>
    </button>
  );
}
