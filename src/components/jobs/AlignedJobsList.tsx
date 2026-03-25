import { useState } from "react";
import { useJobMatcher, MatchedJob } from "@/hooks/use-job-matcher";
import { useApplyQueue } from "@/hooks/use-auto-apply";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ExternalLink, Briefcase, MapPin, Building2, Shield, Sparkles,
  Loader2, Copy, Check, Wand2, ShieldAlert, X, Zap, FileDown,
} from "lucide-react";
import { generateCandidateAdvocacyPdf } from "@/lib/generateCandidateAdvocacyPdf";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { EasyApplyButton } from "./EasyApplyButton";

const AI_TRANSPARENCY_THRESHOLD = 70;

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-civic-green bg-civic-green/5 border-civic-green/20"
    : score >= 40 ? "text-civic-yellow bg-civic-yellow/5 border-civic-yellow/20"
    : "text-muted-foreground bg-muted border-border";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border", color)}>
      <Shield className="w-3 h-3" />
      {score}% aligned
    </span>
  );
}

function AlignmentGuardBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-destructive/30 text-destructive bg-destructive/5">
      <ShieldAlert className="w-3 h-3" />
      Below transparency threshold
    </span>
  );
}

function JobCard({ job, onQueue, queueing, isQueued }: {
  job: MatchedJob;
  onQueue: (job: MatchedJob) => void;
  queueing: boolean;
  isQueued: boolean;
}) {
  const belowThreshold = job.alignment_score < AI_TRANSPARENCY_THRESHOLD;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
              <ScoreBadge score={job.alignment_score} />
              {belowThreshold && <AlignmentGuardBadge />}
            </div>
            <Link to={`/company/${job.company_slug}`} className="text-sm text-primary hover:underline flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {job.company_name}
            </Link>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {job.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
              )}
              {job.employment_type && (
                <Badge variant="secondary" className="text-xs">{job.employment_type}</Badge>
              )}
              {job.salary_range && (
                <span className="font-medium text-foreground">{job.salary_range}</span>
              )}
              {job.department && <span>{job.department}</span>}
            </div>
            {job.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
            )}
            {job.matched_signals.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {job.matched_signals.slice(0, 5).map((sig) => (
                  <Badge key={sig} variant="outline" className="text-xs bg-primary/5 border-primary/20">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {sig}
                  </Badge>
                ))}
                {job.matched_signals.length > 5 && (
                  <Badge variant="outline" className="text-xs">+{job.matched_signals.length - 5}</Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <EasyApplyButton
              job={{
                id: job.job_id,
                company_id: job.company_id,
                title: job.title,
                company_name: job.company_name,
                url: job.url,
                alignment_score: job.alignment_score,
                matched_signals: job.matched_signals,
              }}
              className="gap-1.5"
            />
            {!belowThreshold && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQueue(job)}
                disabled={queueing || isQueued}
                className="gap-1.5 text-xs"
              >
                {isQueued ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Queued
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Auto-Apply
                  </>
                )}
              </Button>
            )}
            {job.url && (
              <Button size="sm" variant="ghost" asChild className="gap-1.5 text-xs">
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Post
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClipboardBanner({ payload, onDismiss }: {
  payload: {
    matchingStatement: string;
    targetedIntro?: string;
    hrTechAlignment?: string;
    valuesCheck?: string;
    detectedVendor?: string;
    biasAuditStatus?: string;
    alignmentScore: number;
    companyName: string;
    matchedSignals: string[];
    careerSiteUrl?: string;
    advocacyData?: any;
  };
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(payload.matchingStatement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-primary/30 bg-primary/5 mb-4 animate-in slide-in-from-top-2">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Custom Value Proposition copied to clipboard. Redirecting to Career Site...
              </span>
              <Badge variant="secondary" className="text-xs">{payload.alignmentScore}% aligned</Badge>
            </div>
            {payload.targetedIntro && (
              <p className="text-sm font-medium text-foreground mb-2 italic">"{payload.targetedIntro}"</p>
            )}
            {payload.valuesCheck && (
              <p className="text-xs text-muted-foreground mb-2">{payload.valuesCheck}</p>
            )}
            <div className="bg-background border border-border rounded-md p-3 text-sm text-foreground/90 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
              {payload.matchingStatement}
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {payload.detectedVendor && payload.detectedVendor !== 'Unknown' && (
                <Badge variant="outline" className="text-xs bg-accent/10 border-accent/30">
                  AI Vendor: {payload.detectedVendor}
                </Badge>
              )}
              {payload.biasAuditStatus && (
                <Badge variant="outline" className="text-xs">{payload.biasAuditStatus}</Badge>
              )}
              {payload.matchedSignals.map(s => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Statement"}
            </Button>
            {payload.advocacyData && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  const pdf = generateCandidateAdvocacyPdf(payload.advocacyData);
                  const slug = payload.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  pdf.save(`${slug}-advocacy-dossier.pdf`);
                }}
              >
                <FileDown className="w-3.5 h-3.5" />
                Advocacy Dossier
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onDismiss} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlignedJobsList() {
  const { data, isLoading, error } = useJobMatcher();
  const { queue, addToQueue } = useApplyQueue();
  const { toast } = useToast();
  const [activePayload, setActivePayload] = useState<any>(null);

  const queuedJobIds = new Set(queue.map(q => q.job_id).filter(Boolean));

  const handleQueue = (job: MatchedJob) => {
    addToQueue.mutate({
      job_id: job.job_id,
      company_id: job.company_id,
      job_title: job.title,
      company_name: job.company_name,
      alignment_score: job.alignment_score,
      matched_signals: job.matched_signals,
      application_url: job.url || undefined,
    });
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Card><CardContent className="p-6 text-center text-destructive">
        Failed to load matched jobs. Please try again.
      </CardContent></Card>
    );
  }

  const NON_US_PATTERNS = /\b(london|uk|united kingdom|toronto|canada|berlin|germany|paris|france|mumbai|india|bangalore|singapore|sydney|australia|tokyo|japan|amsterdam|netherlands|dublin|ireland|são paulo|brazil|mexico city|mexico|hong kong|shanghai|china|beijing|seoul|south korea|lagos|nigeria|nairobi|kenya|dubai|uae|tel aviv|israel)\b/i;

  const matches = (data?.matches || []).filter((job) => {
    if (!job.location) return true;
    const loc = job.location;
    if (NON_US_PATTERNS.test(loc)) return false;
    return true;
  });

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No matched jobs yet</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Set your signal preferences in the "Signal Preferences" tab, or check back as companies add job listings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activePayload && (
        <ClipboardBanner payload={activePayload} onDismiss={() => setActivePayload(null)} />
      )}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          {matches.length} job{matches.length !== 1 ? "s" : ""} aligned with your values
          {data?.preferences_applied ? ` · ${data.preferences_applied} signal filter${data.preferences_applied !== 1 ? "s" : ""} applied` : ""}
        </p>
      </div>
      {matches.map((job) => (
        <JobCard
          key={job.job_id}
          job={job}
          onQueue={handleQueue}
          queueing={addToQueue.isPending}
          isQueued={queuedJobIds.has(job.job_id)}
        />
      ))}
    </div>
  );
}
