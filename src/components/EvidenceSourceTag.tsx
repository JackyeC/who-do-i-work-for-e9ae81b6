import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvidenceSourceTagProps {
  source: string;
  url?: string;
  date?: string;
  className?: string;
}

const EVIDENCE_URLS: Record<string, string> = {
  FEC: "https://www.fec.gov/data/",
  "SEC Proxy": "https://www.sec.gov/cgi-bin/browse-edgar",
  SEC: "https://www.sec.gov/cgi-bin/browse-edgar",
  WARN: "https://www.dol.gov/agencies/eta/layoffs/warn",
  "WARN Database": "https://www.dol.gov/agencies/eta/layoffs/warn",
  LDA: "https://lda.senate.gov/filings/public/filing/search/",
  "Lobbying Disclosures": "https://lda.senate.gov/filings/public/filing/search/",
  "Earnings Transcript": "https://www.sec.gov/cgi-bin/browse-edgar",
  USASpending: "https://www.usaspending.gov/",
  OpenSecrets: "https://www.opensecrets.org/",
  NLRB: "https://www.nlrb.gov/cases-decisions",
  OSHA: "https://www.osha.gov/pls/imis/establishment.html",
  EEOC: "https://www.eeoc.gov/data",
  EPA: "https://echo.epa.gov/",
  BLS: "https://www.bls.gov/",
  Glassdoor: "https://www.glassdoor.com/",
  CDP: "https://www.cdp.net/en/companies-scores",
};

function resolveUrl(source: string): string | undefined {
  const key = Object.keys(EVIDENCE_URLS).find((k) =>
    source.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? EVIDENCE_URLS[key] : undefined;
}

export function EvidenceSourceTag({ source, url, date, className }: EvidenceSourceTagProps) {
  const resolvedUrl = url || resolveUrl(source);

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px]", className)}>
      <span className="font-mono uppercase tracking-wider text-muted-foreground/70 font-semibold">
        Evidence:
      </span>
      {resolvedUrl ? (
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
        >
          {source}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      ) : (
        <span className="text-muted-foreground font-medium">{source}</span>
      )}
      {date && (
        <span className="text-muted-foreground/60 ml-1">· {date}</span>
      )}
    </span>
  );
}
