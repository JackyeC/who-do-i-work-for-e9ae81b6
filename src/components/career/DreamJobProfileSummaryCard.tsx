import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Target, MapPin, Shield, RefreshCw, AlertCircle } from "lucide-react";
import { useDreamJobProfile } from "@/hooks/use-dream-job-profile";
import { cn } from "@/lib/utils";

interface DreamJobProfileSummaryCardProps {
  /** Dashboard: sync button */
  showSync?: boolean;
  className?: string;
  compact?: boolean;
}

/** Rich summary of the canonical Dream Job Profile — use on dashboard tabs, jobs feed, auto-apply. */
export function DreamJobProfileSummaryCard({
  showSync = false,
  className,
  compact = false,
}: DreamJobProfileSummaryCardProps) {
  const { profile, version, isLoading, isError, refetch, syncDreamJobProfile, isSyncing, schemaFallback } =
    useDreamJobProfile();

  const completeness = (() => {
    if (!profile) return 0;
    let pts = 0;
    const max = 5;
    if (profile.targetTitles?.length) pts++;
    if (profile.facets?.skills?.length) pts++;
    if (profile.facets?.valuesTags?.length) pts++;
    if (profile.facets?.minSalary || profile.facets?.locations?.length) pts++;
    if (Object.keys(profile.sources || {}).length) pts++;
    return Math.round((pts / max) * 100);
  })();

  if (isLoading) {
    return (
      <Card className={cn("border-border/40", className)}>
        <CardContent className="p-6 h-28 animate-pulse bg-muted/20 rounded-lg" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={cn("border-destructive/20 bg-destructive/[0.03]", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">Dream Job Profile</CardTitle>
          <CardDescription className="text-xs">We couldn’t load your profile snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => refetch()}>
            Try again
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" asChild>
            <Link to="/dashboard?tab=profile">Open profile tab</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (schemaFallback) {
    return (
      <Card className={cn("border-amber-500/25 bg-amber-500/[0.03]", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">Dream Job Profile</CardTitle>
          <CardDescription className="text-xs">
            Database not migrated — the <span className="font-mono text-[10px]">dream_job_profile</span> columns are missing on this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground leading-relaxed">
          Deploy migration <span className="font-mono">20260403120000_dream_job_profile_and_application_dossiers.sql</span> to Supabase, then refresh. Matching will use profile fields until then.
        </CardContent>
      </Card>
    );
  }

  const isEmptyProfile =
    !profile ||
    (!profile.targetTitles?.length &&
      !profile.facets?.skills?.length &&
      !profile.facets?.valuesTags?.length &&
      !profile.facets?.minSalary);

  return (
    <Card className={cn("border-primary/15 bg-gradient-to-br from-card to-card/80", className)}>
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-display">Dream Job Profile</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Canonical source for matching & auto-apply · v{version}
              </CardDescription>
            </div>
          </div>
          {showSync && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0"
              disabled={isSyncing}
              onClick={() => syncDreamJobProfile()}
            >
              <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
              Sync
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4", compact && "pt-0")}>
        <div>
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            <span>Profile strength</span>
            <span>{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-1.5" />
        </div>

        {isEmptyProfile && (
          <div className="rounded-xl border border-border/60 bg-muted/15 px-4 py-3">
            <p className="text-sm font-medium text-foreground">Start your Dream Job Profile</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Nothing here yet — add target titles, upload a resume, or complete Values so the feed and auto-apply have something real to work with.
            </p>
          </div>
        )}

        {!isEmptyProfile && completeness < 45 && (
          <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Add titles, skills, and values signals so matches and auto-apply reflect you — not generic defaults.
            </span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex gap-2">
            <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Targets</p>
              <p className="text-foreground/90 leading-snug">
                {profile?.targetTitles?.length
                  ? profile.targetTitles.slice(0, 4).join(" · ")
                  : "— Add in Profile"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Values & signals</p>
              <p className="text-foreground/90 leading-snug line-clamp-2">
                {profile?.facets?.valuesTags?.length
                  ? profile.facets.valuesTags.slice(0, 6).join(", ")
                  : "— Complete Values tab"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Skills</p>
              <p className="text-foreground/90 leading-snug line-clamp-2">
                {profile?.facets?.skills?.length
                  ? profile.facets.skills.slice(0, 8).join(", ")
                  : "— Upload resume or add skills"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Work & comp</p>
              <p className="text-foreground/90 leading-snug">
                {profile?.facets?.remotePreference && profile.facets.remotePreference !== "any"
                  ? `${profile.facets.remotePreference} · `
                  : ""}
                {profile?.facets?.minSalary
                  ? `≥ $${(profile.facets.minSalary / 1000).toFixed(0)}k`
                  : "— Set salary floor"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Object.entries(profile?.sources || {})
            .filter(([, v]) => !!v)
            .map(([k]) => (
              <Badge key={k} variant="secondary" className="text-[10px] font-normal">
                {k.replace(/_/g, " ")}
              </Badge>
            ))}
        </div>

        {!compact && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link to="/dashboard?tab=profile">Edit profile</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link to="/dashboard?tab=values">Values</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link to="/dashboard?tab=preferences">Signal prefs</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link to="/quiz">Workplace DNA</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
