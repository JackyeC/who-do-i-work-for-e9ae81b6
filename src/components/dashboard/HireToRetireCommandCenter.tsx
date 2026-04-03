import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sun, Sparkles, Briefcase, Radio, ArrowRight, Zap, Target, Mail,
} from "lucide-react";
import { useDashboardBriefing } from "@/hooks/use-dashboard-briefing";
import { useDreamJobProfile } from "@/hooks/use-dream-job-profile";
import { useJobMatcher } from "@/hooks/use-job-matcher";
import { useApplicationsTracker } from "@/hooks/use-job-matcher";
import { useApplicationDossiers } from "@/hooks/use-application-dossiers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

function Block({
  title,
  subtitle,
  children,
  className,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  eyebrow?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 bg-card border border-border/30 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.03]",
        className
      )}
    >
      {eyebrow && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{eyebrow}</p>
      )}
      <h3 className="text-[15px] font-bold text-foreground font-display mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

interface HireToRetireCommandCenterProps {
  onNavigate: (tab: string) => void;
}

/**
 * Hire-to-retire overview: six editorial blocks wired to live hooks.
 */
export function HireToRetireCommandCenter({ onNavigate }: HireToRetireCommandCenterProps) {
  const { data: briefing, isLoading: briefingLoading } = useDashboardBriefing();
  const { profile, version, schemaFallback } = useDreamJobProfile();
  const { data: matchData, isLoading: matchLoading } = useJobMatcher();
  const { applications } = useApplicationsTracker();
  const { data: dossiers } = useApplicationDossiers();

  const firstName = briefing?.firstName || "there";
  const matches = matchData?.matches || [];
  const topMatches = matches.slice(0, 3);
  const inMotion = applications.filter(
    (a: { status?: string }) => !["Rejected", "Withdrawn", "Ghosted"].includes(a.status || "")
  );
  const pendingDossiers = dossiers?.filter((d) => d.email_status === "pending").length ?? 0;
  const news = briefing?.news?.slice(0, 2) || [];

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto">
      {/* 1 — Today's Snapshot */}
      <motion.div {...anim(0)}>
        <Block
          eyebrow="Today"
          title="Today's snapshot"
          subtitle={`${firstName}, here's what your command center is tracking right now.`}
        >
          {briefingLoading ? (
            <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => onNavigate("tracked")}
                className="text-left rounded-xl border border-border/40 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Watching</p>
                <p className="text-2xl font-bold text-foreground">{briefing?.tracked?.length ?? 0}</p>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("matches")}
                className="text-left rounded-xl border border-border/40 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Matches</p>
                <p className="text-2xl font-bold text-foreground">{matches.length}</p>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("tracker")}
                className="text-left rounded-xl border border-border/40 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Applications</p>
                <p className="text-2xl font-bold text-foreground">{applications.length}</p>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("alerts")}
                className="text-left rounded-xl border border-border/40 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Alerts</p>
                <p className="text-2xl font-bold text-foreground">{briefing?.alerts?.length ?? 0}</p>
              </button>
            </div>
          )}
        </Block>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 2 — Dream Job Profile */}
        <motion.div {...anim(0.04)}>
          <Block
            eyebrow="Profile"
            title="Your Dream Job Profile"
            subtitle={
              schemaFallback
                ? "Deploy the dream_job_profile migration — profile merge is unavailable until then."
                : `Canonical inputs for matching & queue · v${version}.`
            }
          >
            <p className="text-xs text-muted-foreground mb-3">
              Version <span className="text-foreground font-mono">{schemaFallback ? "—" : version}</span>
              {profile?.targetTitles?.length ? ` · ${profile.targetTitles.length} titles` : ""}
              {profile?.facets?.skills?.length ? ` · ${profile.facets.skills.length} skills` : ""}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(profile?.facets?.valuesTags || []).slice(0, 8).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                  {t}
                </Badge>
              ))}
              {!profile?.facets?.valuesTags?.length && (
                <span className="text-xs text-muted-foreground">Complete Values & signal prefs to populate tags.</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onNavigate("values")}>
                Values
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onNavigate("profile")}>
                Profile
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onNavigate("preferences")}>
                Signals
              </Button>
            </div>
          </Block>
        </motion.div>

        {/* 3 — Today's Matches */}
        <motion.div {...anim(0.06)}>
          <Block
            eyebrow="Pipeline"
            title="Today's matches"
            subtitle="From your Dream Job Profile + employer signals."
          >
            {matchLoading ? (
              <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            ) : topMatches.length === 0 ? (
              <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-3 text-sm text-muted-foreground leading-relaxed">
                No strong matches surfaced yet. Tighten your Dream Job Profile (titles, skills, values) and signal prefs — then check back as new roles ingest.
              </div>
            ) : (
              <ul className="space-y-2 mb-4">
                {topMatches.map((j: { job_id: string; title: string; company_name: string; alignment_score: number }) => (
                  <li key={j.job_id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-foreground">{j.title}</span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {j.alignment_score}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => onNavigate("matches")}>
              Open matched jobs <ArrowRight className="w-3 h-3" />
            </Button>
          </Block>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 4 — Applications in motion */}
        <motion.div {...anim(0.08)}>
          <Block
            eyebrow="Motion"
            title="Applications in motion"
            subtitle={
              pendingDossiers
                ? `${pendingDossiers} dossier receipt(s) ready · email delivery still pending (outbound email is not live in all environments)`
                : "Track status, notes, and in-dashboard dossier receipts."
            }
          >
            <p className="text-sm text-foreground mb-3">
              {inMotion.length} active in pipeline
              {applications.length ? ` · ${applications.length} total` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                <Link to="/applications">Applications</Link>
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onNavigate("tracker")}>
                Tracker
              </Button>
            </div>
          </Block>
        </motion.div>

        {/* 5 — Today's Signals */}
        <motion.div {...anim(0.1)}>
          <Block
            eyebrow="Intel"
            title="Today's signals"
            subtitle="Work news & dossier-ready context."
          >
            {news.length === 0 ? (
              <p className="text-sm text-muted-foreground">News feed refreshes through the day.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {news.map((n: { id: string; headline: string }) => (
                  <li key={n.id} className="text-xs text-muted-foreground line-clamp-2">
                    {n.headline}
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
              <Link to="/browse">Research employers</Link>
            </Button>
          </Block>
        </motion.div>
      </div>

      {/* 6 — Today's Move */}
      <motion.div {...anim(0.12)}>
        <Block
          eyebrow="Action"
          title="Today's move"
          subtitle="One deliberate step — facts over feelings."
          className="border-l-[3px] border-l-[hsl(43,96%,56%)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground leading-relaxed">
                  {!profile?.facets?.skills?.length
                    ? "Upload a resume or add skills so matches reflect your real stack."
                    : matches.length < 2
                      ? "Tighten signal requirements or add target titles — then refresh matches."
                      : "Queue one aligned role for auto-apply or log an application to generate a dossier."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button size="sm" className="h-9 gap-1.5" onClick={() => onNavigate("matches")}>
                <Sparkles className="w-3.5 h-3.5" /> Matches
              </Button>
              <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => onNavigate("auto-apply")}>
                <Target className="w-3.5 h-3.5" /> Auto-apply
              </Button>
              <Button size="sm" variant="outline" className="h-9 gap-1.5" asChild>
                <Link to="/jobs-feed">
                  <Sun className="w-3.5 h-3.5" /> Jobs feed
                </Link>
              </Button>
            </div>
          </div>
        </Block>
      </motion.div>

      {/* Quick link strip */}
      <motion.div {...anim(0.14)} className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
        <Briefcase className="w-3.5 h-3.5" />
        <Link to="/dashboard?tab=tracker" className="hover:text-primary transition-colors">
          Pipeline
        </Link>
        <span className="opacity-30">·</span>
        <Radio className="w-3.5 h-3.5" />
        <Link to="/dashboard?tab=alerts" className="hover:text-primary transition-colors">
          Alerts
        </Link>
        <span className="opacity-30">·</span>
        <Mail className="w-3.5 h-3.5" />
        <Link to="/applications" className="hover:text-primary transition-colors">
          Dossiers
        </Link>
      </motion.div>
    </div>
  );
}
