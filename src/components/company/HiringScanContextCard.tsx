import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, ExternalLink, Info, Layers, Search } from "lucide-react";

interface ScanContext {
  classification: string;
  explanation: string;
  sourceChecked: string;
  confidence: "low" | "medium" | "high";
  atsDetected: string | null;
  departmentBreakdown: Record<string, number> | null;
  deeperUrlFound: string | null;
}

interface HiringSignal {
  signal_type: string;
  description: string;
  confidence: string;
}

interface HiringScanContextCardProps {
  companyId?: string;
  companyName: string;
}

const CLASSIFICATION_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  informational_landing: { label: "Informational Landing Page", icon: Info, color: "text-muted-foreground" },
  evergreen_recruiting: { label: "Evergreen Recruiting Page", icon: Layers, color: "text-amber-500" },
  live_jobs_page: { label: "Live Jobs Page", icon: CheckCircle, color: "text-primary" },
  ats_redirect: { label: "ATS Redirect", icon: ExternalLink, color: "text-primary" },
  dynamic_jobs_feed: { label: "Dynamic Jobs Feed", icon: Search, color: "text-amber-500" },
  department_landing: { label: "Department Landing Page", icon: Layers, color: "text-amber-500" },
  no_active_jobs: { label: "No Active Jobs Detected", icon: AlertTriangle, color: "text-destructive" },
  limited_active_jobs: { label: "Limited Active Jobs", icon: AlertTriangle, color: "text-amber-500" },
};

const DEPT_LABELS: Record<string, string> = {
  tech_product: "Tech / Product",
  corporate: "Corporate",
  sales_marketing: "Sales / Marketing",
  operations: "Operations",
  retail_frontline: "Retail / Frontline",
  customer_support: "Customer Support",
  design: "Design",
  other: "Other",
};

export function HiringScanContextCard({ companyId, companyName }: HiringScanContextCardProps) {
  const { data } = useQuery({
    queryKey: ["hiring-scan-context", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("company_report_sections")
        .select("content, summary, confidence_score, source_urls, updated_at")
        .eq("company_id", companyId)
        .eq("section_type", "careers")
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.content) return null;

  const content = data.content as any;
  const scanContext: ScanContext | undefined = content?.scanContext;
  const hiringSignals: HiringSignal[] = content?.hiringSignals || [];
  const deptBreakdown: Record<string, number> | undefined = content?.departmentBreakdown;
  const totalJobs: number = content?.totalJobs || 0;

  if (!scanContext) return null;

  const classInfo = CLASSIFICATION_LABELS[scanContext.classification] || CLASSIFICATION_LABELS.informational_landing;
  const ClassIcon = classInfo.icon;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Search className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="font-mono text-xs tracking-[0.15em] uppercase text-primary font-semibold">
          Hiring Scan Context
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Classification */}
        <div className="flex items-start gap-2.5">
          <ClassIcon className={`w-4 h-4 mt-0.5 shrink-0 ${classInfo.color}`} strokeWidth={1.5} />
          <div>
            <p className={`text-sm font-semibold ${classInfo.color}`}>{classInfo.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{scanContext.explanation}</p>
          </div>
        </div>

        {/* What was checked */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2">
          <span className="font-medium text-foreground/70">Source checked:</span>
          <span className="truncate">{scanContext.sourceChecked}</span>
          {scanContext.atsDetected && (
            <span className="ml-auto shrink-0 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold uppercase">
              {scanContext.atsDetected}
            </span>
          )}
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            scanContext.confidence === "high" ? "bg-primary/10 text-primary" :
            scanContext.confidence === "medium" ? "bg-amber-500/10 text-amber-500" :
            "bg-muted text-muted-foreground"
          }`}>
            {scanContext.confidence.charAt(0).toUpperCase() + scanContext.confidence.slice(1)}
          </span>
          {totalJobs > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {totalJobs} active role{totalJobs !== 1 ? "s" : ""} found
            </span>
          )}
        </div>

        {/* Department breakdown */}
        {deptBreakdown && Object.keys(deptBreakdown).length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              Role Distribution
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(deptBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => (
                  <span key={dept} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-xs text-foreground/80">
                    <span className="font-medium">{DEPT_LABELS[dept] || dept}</span>
                    <span className="text-muted-foreground">({count})</span>
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Hiring signals */}
        {hiringSignals.length > 0 && (
          <div className="pt-2 border-t border-border/50 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Hiring Signals
            </p>
            {hiringSignals.map((signal, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                  signal.confidence === "high" ? "text-primary" :
                  signal.confidence === "medium" ? "text-amber-500" :
                  "text-muted-foreground"
                }`} strokeWidth={1.5} />
                <p className="text-muted-foreground leading-relaxed">{signal.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
