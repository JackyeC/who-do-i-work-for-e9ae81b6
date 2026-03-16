import { ExternalLink } from "lucide-react";

interface SignalSourceLinkProps {
  source: string;
  url?: string;
  className?: string;
}

const SOURCE_URLS: Record<string, string> = {
  "NLRB": "https://www.nlrb.gov/cases-decisions",
  "OSHA": "https://www.osha.gov/pls/imis/establishment.html",
  "EEOC": "https://www.eeoc.gov/data",
  "FEC": "https://www.fec.gov/data/",
  "OpenSecrets": "https://www.opensecrets.org/",
  "SEC": "https://www.sec.gov/cgi-bin/browse-edgar",
  "EPA": "https://echo.epa.gov/",
  "FTC": "https://www.ftc.gov/legal-library/browse/cases-proceedings",
  "CFPB": "https://www.consumerfinance.gov/enforcement/actions/",
  "BLS": "https://www.bls.gov/",
  "CDP": "https://www.cdp.net/en/companies-scores",
  "LDA": "https://lda.senate.gov/filings/public/filing/search/",
  "USASpending": "https://www.usaspending.gov/",
  "Glassdoor": "https://www.glassdoor.com/",
  "DOL Foreign Labor": "https://www.dol.gov/agencies/eta/foreign-labor/performance",
  "USCIS": "https://www.uscis.gov/",
  "ICE": "https://www.ice.gov/",
  "EPA GHGRP": "https://ghgdata.epa.gov/ghgp/main.do",
  "EPA ECHO": "https://echo.epa.gov/",
  "SBTi": "https://sciencebasedtargets.org/companies-taking-action",
  "InfluenceMap": "https://influencemap.org/",
  "Climate Case Chart": "https://climatecasechart.com/",
};

export function getSourceUrl(source: string): string | undefined {
  const key = Object.keys(SOURCE_URLS).find(k =>
    source.toLowerCase().includes(k.toLowerCase())
  );
  return key ? SOURCE_URLS[key] : undefined;
}

export function SignalSourceLink({ source, url, className }: SignalSourceLinkProps) {
  const resolvedUrl = url || getSourceUrl(source);

  return (
    <span className={className}>
      {resolvedUrl ? (
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-primary hover:underline text-[10px] font-medium"
        >
          Source: {source} <ExternalLink className="w-2.5 h-2.5" />
        </a>
      ) : (
        <span className="text-[10px] text-muted-foreground font-medium">Source: {source}</span>
      )}
    </span>
  );
}

/**
 * Formats a signal statement in the required "Algorithm Signal" format.
 * Instead of "This company has poor labor practices."
 * Use: "Algorithm Signal: 3 NLRB cases detected in 2024 [Source: NLRB.gov]"
 */
export function formatAlgorithmSignal(description: string, source?: string): string {
  const sourceTag = source ? ` [Source: ${source}]` : "";
  return `Algorithm Signal: ${description}${sourceTag}`;
}
