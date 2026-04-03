import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { ExternalLink, X, Shield, FileText, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/* ─── Source metadata by agency ─── */
const SOURCE_META: Record<string, { label: string; color: string; tier: string; description: string }> = {
  "fec.gov": { label: "FEC", color: "text-blue-500", tier: "T1 — Federal Agency", description: "Federal Election Commission — Official campaign finance data filed by candidates and committees." },
  "sec.gov": { label: "SEC", color: "text-amber-500", tier: "T1 — Federal Agency", description: "Securities and Exchange Commission — Official corporate filings, enforcement actions, and financial disclosures." },
  "eeoc.gov": { label: "EEOC", color: "text-red-500", tier: "T1 — Federal Agency", description: "Equal Employment Opportunity Commission — Workplace discrimination complaints and enforcement actions." },
  "osha.gov": { label: "OSHA", color: "text-orange-500", tier: "T1 — Federal Agency", description: "Occupational Safety and Health Administration — Workplace safety violations, inspections, and penalties." },
  "nlrb.gov": { label: "NLRB", color: "text-purple-500", tier: "T1 — Federal Agency", description: "National Labor Relations Board — Union activity, unfair labor practice charges, and election results." },
  "justice.gov": { label: "DOJ", color: "text-red-600", tier: "T1 — Federal Agency", description: "Department of Justice — Federal enforcement, antitrust cases, and civil rights prosecutions." },
  "dol.gov": { label: "DOL", color: "text-blue-600", tier: "T1 — Federal Agency", description: "Department of Labor — Wage and hour violations, worker protection enforcement." },
  "epa.gov": { label: "EPA", color: "text-green-600", tier: "T1 — Federal Agency", description: "Environmental Protection Agency — Environmental violations, emissions data, and enforcement actions." },
  "echo.epa.gov": { label: "EPA ECHO", color: "text-green-600", tier: "T1 — Federal Agency", description: "EPA Enforcement & Compliance History — Facility-level compliance and enforcement data." },
  "ftc.gov": { label: "FTC", color: "text-teal-500", tier: "T1 — Federal Agency", description: "Federal Trade Commission — Consumer protection cases, antitrust enforcement, and corporate deception." },
  "usaspending.gov": { label: "USASpending", color: "text-blue-400", tier: "T1 — Federal Data", description: "Official federal spending data — Government contracts, grants, and awards to companies." },
  "congress.gov": { label: "Congress.gov", color: "text-indigo-500", tier: "T1 — Federal Records", description: "Official congressional records — Bills, votes, member data, and committee activity." },
  "opensecrets.org": { label: "OpenSecrets", color: "text-primary", tier: "T2 — Verified Nonprofit", description: "Center for Responsive Politics — Aggregated political spending, lobbying, and dark money analysis." },
  "subsidytracker.goodjobsfirst.org": { label: "Good Jobs First", color: "text-emerald-500", tier: "T2 — Verified Nonprofit", description: "Subsidy Tracker — Government subsidies, tax breaks, and incentives given to corporations." },
  "lda.senate.gov": { label: "Lobbying Disclosure", color: "text-indigo-400", tier: "T1 — Federal Records", description: "Senate Lobbying Disclosure — Official lobbying registration and activity reports." },
  "apnews.com": { label: "AP News", color: "text-foreground", tier: "T3 — Wire Service", description: "Associated Press — Fact-based news reporting from the world's oldest wire service." },
  "reuters.com": { label: "Reuters", color: "text-orange-400", tier: "T3 — Wire Service", description: "Reuters — International news wire with strict editorial standards." },
};

function getSourceMeta(url: string) {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    // Check exact match first, then partial
    for (const [domain, meta] of Object.entries(SOURCE_META)) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) return meta;
    }
    // Fallback
    const parts = hostname.split(".");
    const shortName = parts.length >= 2 ? parts[parts.length - 2] : hostname;
    return {
      label: shortName.charAt(0).toUpperCase() + shortName.slice(1),
      color: "text-muted-foreground",
      tier: "T4 — External Source",
      description: `External source: ${hostname}`,
    };
  } catch {
    return { label: "Source", color: "text-muted-foreground", tier: "Unknown", description: "External source" };
  }
}

/* ─── FEC Data Fetcher ─── */
async function fetchFECPreview(url: string): Promise<{ type: "fec"; data: any } | null> {
  try {
    // Extract committee/candidate name from URL params
    const u = new URL(url);
    const committeeName = u.searchParams.get("committee_name");
    const contributorName = u.searchParams.get("contributor_name");

    if (committeeName) {
      const resp = await fetch(`https://api.open.fec.gov/v1/candidates/search/?api_key=DEMO_KEY&name=${encodeURIComponent(committeeName)}&per_page=3&sort=-first_file_date`);
      if (resp.ok) {
        const data = await resp.json();
        return { type: "fec", data: { query: committeeName, results: (data.results || []).slice(0, 3), kind: "candidates" } };
      }
    }
    if (contributorName) {
      return { type: "fec", data: { query: contributorName, kind: "contributor", note: `Individual contribution records for "${contributorName}" are available at the full FEC portal.` } };
    }
    return null;
  } catch { return null; }
}

/* ─── Context for drawer state ─── */
interface SourceDrawerState {
  openSource: (url: string, context?: { signalType?: string; description?: string; amount?: number | null }) => void;
}

const SourceDrawerContext = createContext<SourceDrawerState | null>(null);

export function useSourceDrawer() {
  const ctx = useContext(SourceDrawerContext);
  if (!ctx) {
    // Fallback: just open in new tab
    return { openSource: (url: string) => window.open(url, "_blank") };
  }
  return ctx;
}

interface SourceDrawerProviderProps {
  children: ReactNode;
}

export function SourceDrawerProvider({ children }: SourceDrawerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [context, setContext] = useState<{ signalType?: string; description?: string; amount?: number | null }>({});
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const openSource = useCallback((url: string, ctx?: typeof context) => {
    setSourceUrl(url);
    setContext(ctx || {});
    setApiData(null);
    setIsOpen(true);

    // Try to fetch native data for supported APIs
    if (url.includes("fec.gov")) {
      setLoading(true);
      fetchFECPreview(url).then(data => { setApiData(data); setLoading(false); }).catch(() => setLoading(false));
    }
  }, []);

  const meta = sourceUrl ? getSourceMeta(sourceUrl) : null;

  return (
    <SourceDrawerContext.Provider value={{ openSource }}>
      {children}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={cn("text-sm font-black uppercase tracking-tight", meta?.color)}>
                      {meta?.label || "Source"}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                      {meta?.tier}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Public Record Source</p>
                </div>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Source description */}
              <div className="rounded-none border border-border/50 bg-muted/20 p-3">
                <p className="text-sm text-foreground leading-relaxed">{meta?.description}</p>
              </div>

              {/* Signal context */}
              {(context.description || context.signalType) && (
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    Signal Context
                  </p>
                  <div className="rounded-none border border-primary/20 bg-primary/5 p-3">
                    {context.signalType && (
                      <Badge variant="secondary" className="text-xs mb-2 font-mono">
                        {context.signalType.replace(/_/g, " ")}
                      </Badge>
                    )}
                    {context.description && (
                      <p className="text-sm text-foreground leading-snug">{context.description}</p>
                    )}
                    {context.amount != null && context.amount > 0 && (
                      <p className="font-mono text-lg font-black text-foreground mt-2">
                        ${context.amount >= 1_000_000_000
                          ? `${(context.amount / 1_000_000_000).toFixed(1)}B`
                          : context.amount >= 1_000_000
                          ? `${(context.amount / 1_000_000).toFixed(1)}M`
                          : context.amount >= 1_000
                          ? `${(context.amount / 1_000).toFixed(0)}K`
                          : context.amount.toLocaleString()
                        }
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Native API Data */}
              {loading && (
                <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Fetching live data...</span>
                </div>
              )}

              {apiData?.type === "fec" && apiData.data && (
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Live FEC Data
                  </p>
                  {apiData.data.kind === "candidates" && apiData.data.results?.map((c: any, i: number) => (
                    <div key={i} className="rounded-none border border-border/50 bg-muted/10 p-3">
                      <p className="text-sm font-semibold text-foreground">{c.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{c.party_full || c.party}</Badge>
                        <span className="text-xs text-muted-foreground">{c.office_full} — {c.state}</span>
                        {c.candidate_status === "C" && <Badge className="text-[10px] bg-civic-green/20 text-civic-green border-civic-green/30">Active</Badge>}
                      </div>
                    </div>
                  ))}
                  {apiData.data.kind === "contributor" && (
                    <div className="rounded-none border border-border/50 bg-muted/10 p-3">
                      <p className="text-sm text-foreground">{apiData.data.note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Trust note */}
              <div className="flex items-start gap-2 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-civic-yellow mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This data comes from public records. WDIWF surfaces it — we don't alter or editorialize. Verify at the source for the full record.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex gap-3">
              <Button
                variant="default"
                className="flex-1 rounded-none font-semibold gap-2"
                onClick={() => window.open(sourceUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                Open Full Source
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="rounded-none">
                  Close
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </SourceDrawerContext.Provider>
  );
}
