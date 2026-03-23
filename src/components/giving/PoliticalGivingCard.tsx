import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CauseTag, getCauseTag } from "./CauseTag";
import { GivingShareRow } from "./GivingShareRow";
import { ExternalLink } from "lucide-react";

interface PoliticalGivingCardProps {
  companyId: string;
  companyName: string;
  companySlug: string;
}

export function PoliticalGivingCard({ companyId, companyName, companySlug }: PoliticalGivingCardProps) {
  const { data } = useQuery({
    queryKey: ["political-giving-company", companyId],
    queryFn: async () => {
      const [partyRes, companyRes, instRes] = await Promise.all([
        supabase.from("company_party_breakdown").select("party, amount, color").eq("company_id", companyId),
        supabase.from("companies").select("total_pac_spending, lobbying_spend").eq("id", companyId).single(),
        (supabase as any).from("institutional_alignment_signals").select("institution_name, institution_category, link_description, evidence_source, evidence_url, confidence").eq("company_id", companyId),
      ]);
      return {
        partyBreakdown: partyRes.data || [],
        company: companyRes.data,
        institutionalLinks: instRes.data || [],
      };
    },
    enabled: !!companyId,
  });

  if (!data) return null;

  const { partyBreakdown, company, institutionalLinks } = data;
  const totalPac = company?.total_pac_spending || 0;
  const lobbyingSpend = company?.lobbying_spend || 0;

  // Calculate party percentages
  const demAmount = partyBreakdown.filter((p: any) => p.party?.toLowerCase().includes("democrat")).reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const repAmount = partyBreakdown.filter((p: any) => p.party?.toLowerCase().includes("republican")).reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const otherAmount = Math.max(0, totalPac - demAmount - repAmount);
  const total = demAmount + repAmount + otherAmount || 1;
  const demPct = (demAmount / total) * 100;
  const repPct = (repAmount / total) * 100;
  const otherPct = (otherAmount / total) * 100;

  // Institutional links cause mapping
  const INSTITUTION_CAUSES: Record<string, string> = {
    "Heritage Foundation": "Project 2025",
    "Alliance Defending Freedom": "Anti-LGBTQ+",
    "Federalist Society": "Project 2025",
    "Center for American Progress": "Labor / pro-worker",
    "Human Rights Campaign": "Voting rights — supportive",
    "Sierra Club": "Climate / clean energy",
    "Chamber of Commerce": "Labor / anti-union",
    "ALEC": "Voting restrictions",
  };

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const plainText = `${companyName} Political Giving\nPAC spend: ${formatCurrency(totalPac)} (${Math.round(repPct)}% R · ${Math.round(demPct)}% D)\nLobbying spend: ${formatCurrency(lobbyingSpend)}\nInstitutional links: ${institutionalLinks.slice(0, 3).map((l: any) => l.institution_name).join(" · ")}\nSource: FEC, LDA.gov, OpenSecrets · wdiwf.jackyeclayton.com`;

  return (
    <div className="space-y-6" id={`giving-${companySlug}`}>
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">Political Giving & Influence</h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
          Sourced from FEC filings, Senate LDA disclosures, and OpenSecrets. All figures represent publicly disclosed activity.
        </p>
      </div>

      {/* Sub-section 1: PAC Spending */}
      <div className="rounded-xl border border-border/40 bg-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">PAC Spending</h4>
        {totalPac > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Total PAC spend: <span className="text-foreground font-medium">{formatCurrency(totalPac)}</span>
            </p>
            {/* Party bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
              {demPct > 0 && <div style={{ width: `${demPct}%`, background: "#378ADD" }} />}
              {repPct > 0 && <div style={{ width: `${repPct}%`, background: "#E24B4A" }} />}
              {otherPct > 0 && <div style={{ width: `${otherPct}%`, background: "#888780" }} />}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px" }}>
              {demAmount > 0 && <span style={{ color: "#378ADD" }}>Democratic: {formatCurrency(demAmount)}</span>}
              {repAmount > 0 && <span style={{ color: "#E24B4A" }}>Republican: {formatCurrency(repAmount)}</span>}
              {otherAmount > 0 && <span style={{ color: "#888780" }}>Non-partisan: {formatCurrency(otherAmount)}</span>}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No PAC spending on record.</p>
        )}
      </div>

      {/* Sub-section 2: Lobbying */}
      <div className="rounded-xl border border-border/40 bg-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Lobbying Spend</h4>
        {lobbyingSpend > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-1">
              Annual lobbying: <span className="text-foreground font-medium">{formatCurrency(lobbyingSpend)}</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-border/40 rounded px-2 py-0.5">
                <ExternalLink className="w-2.5 h-2.5" /> LDA.gov · Senate Lobbying Disclosure
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No lobbying spend on record.</p>
        )}
      </div>

      {/* Sub-section 3: Institutional Links */}
      {institutionalLinks.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-3">Institutional Links</h4>
          <div className="space-y-3">
            {institutionalLinks.slice(0, 6).map((link: any, i: number) => {
              const causeLabel = INSTITUTION_CAUSES[link.institution_name];
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{link.institution_name}</span>
                      {causeLabel && <CauseTag {...getCauseTag(causeLabel)} />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {link.link_description || `Connection: ${link.link_type}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {link.evidence_source || "Public Filing"} · {link.confidence === "high" ? "Verified ✓" : "Cross-Referenced"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <GivingShareRow
        permalink={`https://wdiwf.jackyeclayton.com/company/${companySlug}#giving-${companySlug}`}
        plainText={plainText}
        tweetText={`${companyName} PAC spend: ${formatCurrency(totalPac)} (${Math.round(repPct)}% R · ${Math.round(demPct)}% D). Public FEC record. via @wdiwf`}
        companySlug={companySlug}
      />

      {/* Legal footer */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "12px",
        color: "hsl(var(--muted-foreground))",
        marginTop: "16px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        paddingTop: "12px",
      }}>
        Individual donation data sourced from FEC public records pursuant to 52 U.S.C. §30104. Contributions over $200 are required by law to be publicly disclosed. Cause classifications are based on publicly available voting records, congressional scorecards, and watchdog organization ratings (HRC, LCV, Brennan Center, AFL-CIO). This data reflects personal giving and does not represent company policy. WDIWF does not make character assessments or political endorsements. We connect the dots — you make the call.
      </p>
    </div>
  );
}
