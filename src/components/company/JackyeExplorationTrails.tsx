/**
 * JackyeExplorationTrails
 * ════════════════════════════════════════════════════════════════
 * Layer 3 of the personalization stack.
 *
 * Jackye-narrated "trails" that guide users through connected signals
 * across pages. Each trail is a curated click-path that tells a story
 * using data the platform already has.
 *
 * Trails are contextual — they appear based on what signals exist
 * for a given company, not randomly.
 * ════════════════════════════════════════════════════════════════
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Route, Banknote, ShieldAlert, Users, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersonalizedSignals } from "@/hooks/use-personalized-signals";

interface TrailDef {
  id: string;
  icon: React.ElementType;
  title: string;
  jackyeVoice: string;
  steps: { label: string; to: string }[];
  /** Signal keywords — trail only shows if at least one keyword has data */
  requiredSignals: string[];
  color: string;
}

interface JackyeExplorationTrailsProps {
  companySlug: string;
  companyName: string;
  /** Which signals exist for this company (simple string keys) */
  availableSignals: string[];
  className?: string;
}

function buildTrails(slug: string, name: string): TrailDef[] {
  return [
    {
      id: "follow-the-money",
      icon: Banknote,
      title: "Follow the money",
      jackyeVoice: `Where does ${name}'s money go after it leaves the building? PAC donations, lobbying spend, dark money channels — let's trace it.`,
      steps: [
        { label: "PAC & donations", to: `/company/${slug}#leadership-influence` },
        { label: "Lobbying filings", to: `/dossier/${slug}#political-influence` },
        { label: "Government contracts", to: `/dossier/${slug}#contracts` },
        { label: "Full receipts", to: `/receipts?company=${slug}` },
      ],
      requiredSignals: ["pac", "lobbying", "dark_money", "government_contract"],
      color: "text-[hsl(var(--civic-green))]",
    },
    {
      id: "culture-question",
      icon: ShieldAlert,
      title: "The culture question",
      jackyeVoice: `What's it actually like to work at ${name}? Let's look at what employees say, what the data shows, and where the gaps are.`,
      steps: [
        { label: "Employee sentiment", to: `/company/${slug}#structured-signals` },
        { label: "Pay equity signals", to: `/company/${slug}#structured-signals` },
        { label: "Perception gap", to: `/company/${slug}#perception-gap` },
        { label: "EEOC & conduct", to: `/dossier/${slug}#accountability` },
      ],
      requiredSignals: ["sentiment", "pay_equity", "eeoc", "discrimination", "safety"],
      color: "text-destructive",
    },
    {
      id: "whos-in-charge",
      icon: Users,
      title: "Who's really in charge?",
      jackyeVoice: `Board members, revolving doors, advisory committees — who has power at ${name} and where did they come from?`,
      steps: [
        { label: "Leadership & execs", to: `/company/${slug}#leadership-influence` },
        { label: "Board connections", to: `/dossier/${slug}#leadership` },
        { label: "Revolving door", to: `/dossier/${slug}#political-influence` },
        { label: "Governance signals", to: `/dossier/${slug}#accountability` },
      ],
      requiredSignals: ["lobbying", "revolving_door", "dark_money", "corruption"],
      color: "text-primary",
    },
    {
      id: "stability-check",
      icon: TrendingDown,
      title: "How stable is this place?",
      jackyeVoice: `Layoffs, WARN notices, hiring freezes — is ${name} growing or quietly restructuring? Let's find out.`,
      steps: [
        { label: "WARN filings", to: `/company/${slug}#structured-signals` },
        { label: "Hiring patterns", to: `/company/${slug}#structured-signals` },
        { label: "Workforce brief", to: `/workforce-brief?company=${slug}` },
        { label: "Innovation signals", to: `/company/${slug}#innovation` },
      ],
      requiredSignals: ["layoff", "warn", "sentiment"],
      color: "text-[hsl(var(--civic-yellow))]",
    },
  ];
}

export function JackyeExplorationTrails({
  companySlug,
  companyName,
  availableSignals,
  className,
}: JackyeExplorationTrailsProps) {
  const { hasProfile, checkSignalRelevance } = usePersonalizedSignals();

  const allTrails = useMemo(() => buildTrails(companySlug, companyName), [companySlug, companyName]);

  // Filter trails to only those with at least one matching signal
  const activeTrails = useMemo(() => {
    const signalSet = new Set(availableSignals.map(s => s.toLowerCase()));
    return allTrails.filter(trail =>
      trail.requiredSignals.some(rs => signalSet.has(rs))
    );
  }, [allTrails, availableSignals]);

  // Sort: personalized matches first
  const sortedTrails = useMemo(() => {
    if (!hasProfile) return activeTrails;
    return [...activeTrails].sort((a, b) => {
      const aRelevance = a.requiredSignals.some(rs => checkSignalRelevance(rs).isImportant) ? 1 : 0;
      const bRelevance = b.requiredSignals.some(rs => checkSignalRelevance(rs).isImportant) ? 1 : 0;
      return bRelevance - aRelevance;
    });
  }, [activeTrails, hasProfile, checkSignalRelevance]);

  if (sortedTrails.length === 0) return null;

  return (
    <div className={cn("mb-6 rounded-xl border border-border/50 bg-card overflow-hidden", className)}>
      <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
        <Route className="w-4 h-4 text-primary" />
        <div>
          <p className="text-sm font-bold text-foreground tracking-tight">Explore the Pattern</p>
          <p className="text-xs text-muted-foreground">Jackye-guided trails through {companyName}'s public record</p>
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {sortedTrails.map(trail => {
          const Icon = trail.icon;
          const isPersonalized = hasProfile && trail.requiredSignals.some(rs => checkSignalRelevance(rs).isImportant);

          return (
            <div key={trail.id} className="px-5 py-4 hover:bg-muted/20 transition-colors group">
              <div className="flex items-start gap-3">
                <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", trail.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{trail.title}</span>
                    {isPersonalized && (
                      <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                        ♥ For you
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed italic">
                    "{trail.jackyeVoice}"
                  </p>
                  <div className="flex flex-wrap gap-x-1 gap-y-1 mt-2">
                    {trail.steps.map((step, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <Link
                          to={step.to}
                          className="text-xs font-medium text-primary hover:underline transition-colors"
                        >
                          {step.label}
                        </Link>
                        {i < trail.steps.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
