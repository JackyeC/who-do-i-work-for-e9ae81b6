import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, FileText, Radio, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const RESEARCH_STEPS = [
  { label: "Checking public filings...", icon: FileText },
  { label: "Scanning news and signals...", icon: Radio },
  { label: "Analyzing available data...", icon: Search },
] as const;

type DiscoveryOutcome = "limited" | "none";

interface DiscoveryModeProps {
  companyName: string;
  onResolved: (companyId: string) => void;
}

function getPopulatedCount(tablesPopulated?: Record<string, number>) {
  return Object.values(tablesPopulated ?? {}).reduce((total, count) => total + (count ?? 0), 0);
}

async function pollDiscoveredCompany(companyId: string, isCancelled: () => boolean): Promise<"resolved" | DiscoveryOutcome> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (isCancelled()) return "none";

    const [companyRes, claims, signals, layoffs, diversity] = await Promise.all([
      supabase
        .from("companies")
        .select("id, description, website_url, employer_clarity_score, lobbying_spend, total_pac_spending, record_status")
        .eq("id", companyId)
        .maybeSingle(),
      supabase.from("company_corporate_claims").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("company_signal_scans" as any).select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("company_warn_notices" as any).select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("company_diversity_disclosures").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    ]);

    const company = companyRes.data as {
      description?: string | null;
      website_url?: string | null;
      employer_clarity_score?: number | null;
      lobbying_spend?: number | null;
      total_pac_spending?: number | null;
      record_status?: string | null;
    } | null;

    const dataPointCount =
      (claims.count ?? 0) +
      (signals.count ?? 0) +
      (layoffs.count ?? 0) +
      (diversity.count ?? 0);

    const hasMeaningfulData = Boolean(
      (company?.lobbying_spend ?? 0) > 0 ||
      (company?.total_pac_spending ?? 0) > 0 ||
      (company?.employer_clarity_score ?? 0) > 0 ||
      dataPointCount > 0,
    );

    if (hasMeaningfulData) {
      return "resolved";
    }

    const hasLimitedContext = Boolean(
      company?.description ||
      company?.website_url ||
      company?.record_status === "research_in_progress" ||
      company?.record_status === "identity_matched",
    );

    if (attempt === 4) {
      return hasLimitedContext ? "limited" : "none";
    }

    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  return "none";
}

export default function DiscoveryMode({ companyName, onResolved }: DiscoveryModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [outcome, setOutcome] = useState<DiscoveryOutcome | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    const runResearch = async () => {
      setCurrentStep(0);
      setIsRunning(true);
      setOutcome(null);

      intervalId = window.setInterval(() => {
        setCurrentStep((prev) => Math.min(prev + 1, RESEARCH_STEPS.length - 1));
      }, 1800);

      try {
        const { data, error } = await supabase.functions.invoke("company-research", {
          body: { companyName },
        });

        if (cancelled) return;

        if (!error && data?.success) {
          const populatedCount = getPopulatedCount(data.tablesPopulated);
          const companyId = data.company?.id;

          if (companyId && (data.alreadyExists || populatedCount > 0)) {
            onResolved(companyId);
            return;
          }

          setOutcome(companyId ? "limited" : "none");
          return;
        }

        const { data: discoverData, error: discoverError } = await supabase.functions.invoke("company-discover", {
          body: { companyName, searchQuery: companyName },
        });

        if (cancelled) return;

        if (!discoverError && discoverData?.success) {
          if (discoverData.action === "existing" && discoverData.companyId) {
            onResolved(discoverData.companyId);
            return;
          }

          if (discoverData.companyId) {
            const pollResult = await pollDiscoveredCompany(discoverData.companyId, () => cancelled);
            if (cancelled) return;

            if (pollResult === "resolved") {
              onResolved(discoverData.companyId);
              return;
            }

            setOutcome(pollResult);
            return;
          }
        }

        setOutcome("none");
      } catch {
        if (!cancelled) {
          setOutcome("none");
        }
      } finally {
        if (intervalId) {
          window.clearInterval(intervalId);
        }
        if (!cancelled) {
          setIsRunning(false);
        }
      }
    };

    void runResearch();

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [companyName, onResolved]);

  if (!isRunning && outcome) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {outcome === "limited" ? (
          <div className="bg-accent/40 border border-border rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">Limited public data available</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              We searched public records for <span className="font-medium text-foreground">&quot;{companyName}&quot;</span> and found some context, but not enough yet for a full breakdown.
            </p>
            <div className="mt-4 space-y-1.5 text-left max-w-sm mx-auto">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                Public record checks have started
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                We&apos;ll keep surfacing new evidence as it appears
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 border border-border rounded-2xl p-6 text-center">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">No significant public records found yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              We searched available public sources for <span className="font-medium text-foreground">&quot;{companyName}&quot;</span> and didn&apos;t find enough verified information to build a meaningful report yet.
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-8 text-center"
    >
      <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
      <h3 className="text-lg font-bold text-foreground mb-1">We&apos;re pulling data on this company now</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        This isn&apos;t in our system yet. We&apos;re checking public records and building your report.
      </p>

      <div className="space-y-3 max-w-xs mx-auto text-left">
        {RESEARCH_STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = currentStep === i;
          const isDone = currentStep > i || !isRunning;

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.4 }}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors",
                isActive ? "text-primary font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/50",
              )}
            >
              {isDone ? (
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              ) : (
                <StepIcon className="w-4 h-4 shrink-0" />
              )}
              {step.label}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
