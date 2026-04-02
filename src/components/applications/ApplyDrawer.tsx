import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApplicationsTracker } from "@/hooks/use-job-matcher";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Briefcase,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Bell,
  FileText,
  AlertTriangle,
  Eye,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface ApplyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  companySlug?: string;
  civicScore: number;
  hasLayoffs?: boolean;
  hasEEOC?: boolean;
  hasPoliticalSpending?: boolean;
  alignmentScore?: number;
}

function getAlignmentLevel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "High", color: "text-[hsl(var(--civic-green))]" };
  if (score >= 40) return { label: "Medium", color: "text-[hsl(var(--civic-amber))]" };
  return { label: "Low", color: "text-destructive" };
}

function getVerdictLabel(score: number): string {
  if (score >= 70) return "Worth serious consideration";
  if (score >= 40) return "Proceed with caution";
  return "Protect your peace";
}

export function ApplyDrawer({
  open,
  onOpenChange,
  companyId,
  companyName,
  companySlug,
  civicScore,
  hasLayoffs,
  hasEEOC,
  hasPoliticalSpending,
  alignmentScore,
}: ApplyDrawerProps) {
  const navigate = useNavigate();
  const { trackApplication, applications } = useApplicationsTracker();
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualSource, setManualSource] = useState("");
  const [trackedJobIds, setTrackedJobIds] = useState<Set<string>>(new Set());

  // Fetch live jobs for this company
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["company-jobs-drawer", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_jobs")
        .select("id, title, location, salary_range, employment_type, posted_at, external_url")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("posted_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const alreadyTrackedTitles = new Set(
    applications
      .filter((a: any) => a.company_id === companyId)
      .map((a: any) => a.job_title?.toLowerCase())
  );

  const handleTrackJob = (job: any) => {
    trackApplication.mutate(
      {
        company_id: companyId,
        job_id: job.id,
        job_title: job.title,
        company_name: companyName,
        application_link: job.external_url || undefined,
        alignment_score: alignmentScore,
        status: "Considering",
      },
      {
        onSuccess: () => {
          setTrackedJobIds((prev) => new Set(prev).add(job.id));
          toast.success("Tracked. Find it under Applications.");
        },
      }
    );
  };

  const handleManualSubmit = () => {
    if (!manualTitle.trim()) return;
    trackApplication.mutate(
      {
        company_id: companyId,
        job_title: manualTitle.trim(),
        company_name: companyName,
        application_link: manualSource || undefined,
        alignment_score: alignmentScore,
        status: "Considering",
      },
      {
        onSuccess: () => {
          setManualTitle("");
          setManualSource("");
          setShowManualForm(false);
          toast.success("Tracked. Find it under Applications.");
        },
      }
    );
  };

  const alignment = getAlignmentLevel(civicScore);

  // Build coaching bullets based on signals
  const coachingBullets: { icon: typeof FileText; text: string }[] = [];

  if (hasLayoffs) {
    coachingBullets.push({
      icon: AlertTriangle,
      text: `Ask about headcount stability. ${companyName} has WARN filings on record — find out if the team you'd join was affected.`,
    });
  } else {
    coachingBullets.push({
      icon: FileText,
      text: `Highlight tenure and commitment in your resume. No recent layoff signals — this employer may value long-term hires.`,
    });
  }

  if (hasPoliticalSpending) {
    coachingBullets.push({
      icon: Eye,
      text: `Check if political spending aligns with the company's stated values. If the JD mentions DEI or sustainability, compare it to their PAC record.`,
    });
  }

  if (hasEEOC) {
    coachingBullets.push({
      icon: AlertTriangle,
      text: `In interviews, ask how they handle internal complaints. EEOC filings are on record — a direct question reveals whether they've changed.`,
    });
  } else if (!hasLayoffs && !hasPoliticalSpending) {
    coachingBullets.push({
      icon: Eye,
      text: `Look for specifics in the job description. Vague language about "fast-paced environment" or "wearing many hats" can signal under-resourcing.`,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base font-bold">{companyName}</SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-xs ${alignment.color} border-current`}>
              {alignment.label} Alignment
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getVerdictLabel(civicScore)}
            </span>
          </div>
        </SheetHeader>

        <Separator className="my-2" />

        {/* Job List Section */}
        <div className="space-y-3 py-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            Open Roles
          </h3>

          {jobsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-2">
              {jobs.map((job: any) => {
                const isTracked =
                  trackedJobIds.has(job.id) ||
                  alreadyTrackedTitles.has(job.title?.toLowerCase());
                return (
                  <div
                    key={job.id}
                    className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {job.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {job.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3" />
                            {job.salary_range}
                          </span>
                        )}
                        <Badge variant="outline" className={`text-[10px] ${alignment.color} border-current`}>
                          {alignment.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTracked ? (
                        <Button size="sm" variant="ghost" disabled className="text-xs gap-1 h-7">
                          <CheckCircle2 className="w-3 h-3" />
                          Tracked
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1 h-7"
                          onClick={() => handleTrackJob(job)}
                          disabled={trackApplication.isPending}
                        >
                          <Shield className="w-3 h-3" />
                          Track Application
                        </Button>
                      )}
                      {job.external_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs gap-1 h-7"
                          onClick={() => window.open(job.external_url, "_blank")}
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-muted-foreground">
                We don't see live roles for this employer right now.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" className="text-xs gap-1 h-7">
                  <BookmarkPlus className="w-3 h-3" />
                  Save this company
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1 h-7"
                  onClick={() => toast("We'll notify you when roles appear.", { icon: "🔔" })}
                >
                  <Bell className="w-3 h-3" />
                  Notify me
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Manual Entry */}
        <div className="py-3">
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            {showManualForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Apply to a role not listed here
          </button>
          {showManualForm && (
            <div className="mt-3 space-y-3 p-3 rounded-lg border border-border/60 bg-muted/20">
              <div>
                <Label className="text-xs">Job Title</Label>
                <Input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Senior Product Manager"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Source (optional)</Label>
                <Input
                  value={manualSource}
                  onChange={(e) => setManualSource(e.target.value)}
                  placeholder="e.g. LinkedIn, company site"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                onClick={handleManualSubmit}
                disabled={!manualTitle.trim() || trackApplication.isPending}
                className="w-full text-xs h-8 gap-1"
              >
                {trackApplication.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Track This Role
              </Button>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Coaching Section */}
        <div className="py-3 space-y-2">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Applying here? Know this first.
          </h3>
          <div className="space-y-2">
            {coachingBullets.map((bullet, i) => (
              <div key={i} className="flex gap-2 items-start">
                <bullet.icon className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {bullet.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Footer Actions */}
        <div className="py-3 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              onOpenChange(false);
              navigate("/applications");
            }}
          >
            View All Applications
          </Button>
          {companySlug && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                onOpenChange(false);
                navigate(`/dossier/${companySlug}`);
              }}
            >
              Back to Full Dossier
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
