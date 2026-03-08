import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CivicScoreCard, CivicScoreBadge } from "@/components/CivicScoreCard";
import { JobMatchBadge } from "./JobMatchBadge";
import { VALUE_CATEGORIES } from "@/components/ValuesPreferenceSidebar";
import {
  MapPin, Building2, ExternalLink, FileCheck, Wifi, Monitor, Home,
  Briefcase, DollarSign, Calendar, Clock,
} from "lucide-react";

const WORK_MODE_ICONS: Record<string, any> = {
  remote: Wifi, hybrid: Monitor, "on-site": Home,
};

interface JobDetailDrawerProps {
  job: any;
  companyValueSignals?: any[];
  matchScore?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (job: any) => void;
}

export function JobDetailDrawer({ job, companyValueSignals = [], matchScore, open, onOpenChange, onApply }: JobDetailDrawerProps) {
  if (!job) return null;
  const company = job.companies;
  const WorkModeIcon = job.work_mode ? WORK_MODE_ICONS[job.work_mode] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left pb-0">
          <SheetTitle className="text-lg leading-snug">{job.title}</SheetTitle>
          <Link
            to={`/company/${company?.slug}`}
            className="text-sm text-primary hover:underline flex items-center gap-1 mt-0.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            {company?.name}
          </Link>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Match + Civic Score */}
          <div className="flex items-center gap-3">
            {matchScore != null && (
              <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/50 flex-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Job Match</span>
                <span className="text-2xl font-bold text-foreground">{matchScore}%</span>
                <JobMatchBadge score={matchScore} size="md" />
              </div>
            )}
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/50 flex-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Civic Score</span>
              <CivicScoreCard score={company?.civic_footprint_score || 0} size="sm" showLabel={false} />
              <CivicScoreBadge score={company?.civic_footprint_score || 0} />
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
            )}
            {job.work_mode && WorkModeIcon && (
              <span className="flex items-center gap-1 capitalize"><WorkModeIcon className="w-3.5 h-3.5" />{job.work_mode}</span>
            )}
            {job.employment_type && (
              <span className="flex items-center gap-1 capitalize"><Briefcase className="w-3.5 h-3.5" />{job.employment_type}</span>
            )}
            {job.salary_range && (
              <span className="flex items-center gap-1 text-civic-green font-medium"><DollarSign className="w-3.5 h-3.5" />{job.salary_range}</span>
            )}
            {job.department && (
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.department}</span>
            )}
          </div>

          <Separator />

          {/* Company signal badges */}
          {companyValueSignals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Company Signals</p>
              <div className="flex flex-wrap gap-1.5">
                {companyValueSignals.map((vs: any, idx: number) => {
                  const cat = VALUE_CATEGORIES.find((c) => c.key === vs.value_category);
                  if (!cat) return null;
                  const Icon = cat.icon;
                  return (
                    <Badge key={idx} variant="outline" className="text-xs gap-1" title={vs.signal_summary}>
                      <Icon className={`w-3 h-3 ${cat.color}`} />
                      {cat.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">{job.description}</p>
            </div>
          )}

          {/* Skills */}
          {job.extracted_skills && Array.isArray(job.extracted_skills) && job.extracted_skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {job.extracted_skills.map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            {job.url && (
              <Button className="flex-1 gap-1.5" onClick={() => onApply(job)}>
                Apply <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
            <Link to={`/offer-check/${company?.id}`} className="flex-1">
              <Button variant="outline" className="w-full gap-1.5">
                <FileCheck className="w-3.5 h-3.5" /> Offer Check
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
