import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface SourcesCheckedBannerProps {
  scanCompletion?: Json | null;
  intelligenceReports?: Record<string, any>;
  isPubliclyTraded?: boolean;
}

const SOURCE_MAP: { key: string; label: string; check: (props: SourcesCheckedBannerProps) => boolean }[] = [
  { key: "sec", label: "SEC 10-K", check: (p) => !!p.isPubliclyTraded },
  { key: "fec", label: "FEC Records", check: (p) => hasModule(p, "fec_campaign_finance") },
  { key: "warn", label: "WARN Filings", check: (p) => hasSectionType(p, "warn_notices") },
  { key: "career", label: "Career Portal", check: (p) => hasSectionType(p, "jobs") || hasModule(p, "ai_hr_scan") },
  { key: "ats", label: "ATS Feed", check: (p) => hasModule(p, "ai_hr_scan") },
  { key: "reddit", label: "Reddit / Forums", check: (p) => hasModule(p, "worker_sentiment") || hasModule(p, "social") },
  { key: "court", label: "Court Records", check: (p) => hasModule(p, "court_records") },
  { key: "contracts", label: "Federal Contracts", check: (p) => hasModule(p, "federal_contracts") || hasModule(p, "agency_contracts") },
  { key: "lobbying", label: "Lobbying Disclosure", check: (p) => hasModule(p, "lobbying_disclosure") },
  { key: "sanctions", label: "Sanctions & Watchlists", check: (p) => hasModule(p, "opensanctions") },
];

function hasModule(props: SourcesCheckedBannerProps, moduleKey: string): boolean {
  const sc = props.scanCompletion as Record<string, any> | null;
  if (!sc) return false;
  return !!sc[moduleKey];
}

function hasSectionType(props: SourcesCheckedBannerProps, sectionType: string): boolean {
  if (!props.intelligenceReports) return false;
  return !!props.intelligenceReports[sectionType];
}

export function SourcesCheckedBanner({ scanCompletion, intelligenceReports, isPubliclyTraded }: SourcesCheckedBannerProps) {
  const props = { scanCompletion, intelligenceReports, isPubliclyTraded };
  const activeSources = SOURCE_MAP.filter((s) => s.check(props));

  if (activeSources.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-1.5 shrink-0">
        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap">
          Sources Checked
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {activeSources.map((s) => (
          <Badge
            key={s.key}
            variant="outline"
            className="text-xs font-mono px-2 py-0.5 bg-muted/40 text-muted-foreground border-border/60 whitespace-nowrap"
          >
            {s.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
