import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CivicScoreCard, CivicScoreBadge } from "@/components/CivicScoreCard";
import { JobMatchBadge } from "./JobMatchBadge";
import { EasyApplyButton } from "./EasyApplyButton";
import { JobPostingSchema } from "./JobPostingSchema";
import { PremiumGate } from "@/components/PremiumGate";
import { VALUES_LENSES } from "@/lib/valuesLenses";
import {
  getStoredWorkProfile,
} from "@/components/WorkProfileQuiz";
import {
  generateBeforeYouSignItems,
  generateDualFramings,
  generateRankingExplanation,
  generateClashAlerts,
  getUiStatement,
  type CanonicalSignal,
} from "@/lib/signalPersonalization";
import {
  MapPin, Building2, ExternalLink, FileCheck, Wifi, Monitor, Home,
  Briefcase, DollarSign, Calendar, Clock, AlertTriangle, CheckCircle2,
  Sparkles, Info, Ghost, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const WORK_MODE_ICONS: Record<string, any> = {
  remote: Wifi, hybrid: Monitor, "on-site": Home,
};

interface JobDetailDrawerProps {
  job: any;
  companyValueSignals?: any[];
  companySignals?: CanonicalSignal[];
  matchScore?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (job: any) => void;
}

export function JobDetailDrawer({ job, companyValueSignals = [], companySignals = [], matchScore, open, onOpenChange, onApply }: JobDetailDrawerProps) {
  if (!job) return null;
  const company = job.companies;
  const WorkModeIcon = job.work_mode ? WORK_MODE_ICONS[job.work_mode] : null;
  const profile = getStoredWorkProfile();

  // Logic Bible V8.0 sections
  const beforeYouSign = generateBeforeYouSignItems(companySignals, profile, job);
  const dualFramings = generateDualFramings(companySignals, profile);
  const rankingExplanation = generateRankingExplanation(companySignals, profile, matchScore);
  const clashAlerts = generateClashAlerts(companySignals, profile);

  // Labor Impact Risk: detect if hiring_activity signal is "low" or job lacks ATS source
  const hiringSignal = companySignals.find(s => s.signal_category === "hiring_activity");
  const hasGhostRisk = hiringSignal?.value_normalized === "low" ||
    (hiringSignal?.summary?.toLowerCase().includes("repost") ?? false) ||
    (hiringSignal?.summary?.toLowerCase().includes("ghost") ?? false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {open && job && <JobPostingSchema job={job} />}
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
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Job Match</span>
                <span className="text-2xl font-bold text-foreground">{matchScore}%</span>
                <JobMatchBadge score={matchScore} size="md" />
              </div>
            )}
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/50 flex-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Civic Score</span>
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
            {job.salary_range && (
              <Badge variant="success" className="text-xs gap-0.5">
                <DollarSign className="w-2.5 h-2.5" /> Pay Transparent
              </Badge>
            )}
            {job.department && (
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.department}</span>
            )}
          </div>

          <Separator />

          {/* ── Labor Impact Risk Banner ── */}
          {hasGhostRisk && (
            <div className="p-3 rounded-lg border border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/5 flex items-start gap-2.5">
              <Ghost className="w-4 h-4 text-[hsl(var(--civic-yellow))] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Labor Impact Risk</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  This role may not appear on the company's own careers page. Confirm the listing is still active before applying.
                </p>
              </div>
            </div>
          )}

          {/* ── Before You Sign (Logic Bible V8.0) ── */}
          {beforeYouSign.length > 0 && (
            <div className="p-4 rounded-lg border border-border/60 bg-muted/30 space-y-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
                Before you sign…
              </p>
              {/* First 2 items always visible */}
              <div className="space-y-2">
                {beforeYouSign.slice(0, 2).map((item, i) => (
                  <BeforeYouSignRow key={i} item={item} />
                ))}
              </div>
              {/* Remaining items gated behind blur for free users */}
              {beforeYouSign.length > 2 && (
                <PremiumGate
                  feature="Deep-Dive Signals"
                  variant="blur"
                  blurCta={`This deep-dive found ${beforeYouSign.length - 2} more signals. Unlock to see what changed.`}
                >
                  <div className="space-y-2">
                    {beforeYouSign.slice(2).map((item, i) => (
                      <BeforeYouSignRow key={i + 2} item={item} />
                    ))}
                  </div>
                </PremiumGate>
              )}
            </div>
          )}

          {/* ── Values DNA Clash Alerts ── */}
          {clashAlerts.length > 0 && (
            <div className="p-4 rounded-lg border border-[hsl(var(--civic-yellow))]/20 bg-[hsl(var(--civic-yellow))]/[0.03] space-y-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
                Values Clash Detected
              </p>
              <div className="space-y-2">
                {clashAlerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className={cn(
                      "w-4 h-4 mt-0.5 shrink-0",
                      alert.severity === "clash" ? "text-destructive" : "text-[hsl(var(--civic-yellow))]"
                    )} />
                    <p className="text-muted-foreground leading-relaxed">{alert.statement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── What This Could Mean For You (Logic Bible V8.0) ── */}
          {dualFramings.length > 0 && (
            <div className="p-4 rounded-lg border border-primary/15 bg-primary/[0.03] space-y-3">
              <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                What this could mean for you
              </p>
              <div className="space-y-3">
                {dualFramings.map((f, i) => (
                  <div key={i} className="text-sm space-y-1">
                    <p className="text-foreground/90 leading-relaxed">
                      <span className="text-[hsl(var(--civic-yellow))]">⚠</span> {f.cautionary}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="text-[hsl(var(--civic-green))]">✓</span> {f.neutral}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Why This Is Ranked For You (Logic Bible V8.0) ── */}
          {companySignals.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why this is ranked for you</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{rankingExplanation}</p>
            </div>
          )}

          {/* Company signal badges */}
          {companyValueSignals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Company Signals</p>
              <div className="flex flex-wrap gap-1.5">
                {companyValueSignals.map((vs: any, idx: number) => {
                  const cat = VALUES_LENSES.find((c) => c.key === vs.value_category || c.key === vs.values_lens);
                  if (!cat) return null;
                  const Icon = cat.icon;
                  const isCertified = company?.vetted_status === "certified";
                  return (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={cn(
                        "text-xs gap-1",
                        !isCertified && "opacity-60 border-dashed"
                      )}
                      title={isCertified ? vs.signal_summary : "Unverified — Pending Certification Audit"}
                    >
                      <Icon className={cn("w-3 h-3", isCertified ? "text-[hsl(var(--civic-green))]" : "text-muted-foreground")} />
                      {isCertified ? cat.label : `${cat.label} — Pending Audit`}
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
            <EasyApplyButton job={job} className="flex-1" />
            {job.url && (
              <Button variant="outline" className="flex-1 gap-1.5" onClick={() => {
                supabase.from("job_click_events").insert({
                  job_id: job.id,
                  company_id: job.company_id,
                  click_type: "apply",
                  destination_url: job.url,
                }).then(() => {});
                onApply(job);
              }}>
                Apply External <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
            <Link to={`/offer-check/${company?.id}`}>
              <Button variant="outline" className="gap-1.5">
                <FileCheck className="w-3.5 h-3.5" /> Offer Check
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Extracted sub-component for Before You Sign rows
function BeforeYouSignRow({ item }: { item: { type: "positive" | "warning" | "neutral"; label: string; detail: string } }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {item.type === "positive" && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--civic-green))] mt-0.5 shrink-0" />}
      {item.type === "warning" && <AlertTriangle className="w-4 h-4 text-[hsl(var(--civic-yellow))] mt-0.5 shrink-0" />}
      {item.type === "neutral" && <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div>
        <span className="font-medium text-foreground">{item.label}</span>
        <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{item.detail}</p>
      </div>
    </div>
  );
}
