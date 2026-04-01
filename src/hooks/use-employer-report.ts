import { useMemo } from "react";
import type { EmployerReport, DonorProfile, SpendingMetric } from "@/types/ReportSchema";

/**
 * Maps raw Supabase company data into the canonical EmployerReport shape.
 * Handles donor deduplication via nickname/alias matching.
 */
export function useEmployerReport(
  company: any,
  executives: any[] = [],
  contracts: any[] = [],
  issueSignals: any[] = [],
): EmployerReport | null {
  return useMemo(() => {
    if (!company) return null;

    const integrityScore = company.employer_clarity_score ?? company.civic_footprint_score ?? 50;

    // ── The Call logic based on integrity_score ──
    const theCall: EmployerReport["the_call"] =
      integrityScore < 40 ? "CRITICAL" : integrityScore <= 70 ? "WATCH" : "FAIR";

    // ── Spending record ──
    const spendingRecord: SpendingMetric[] = [
      {
        label: "Lobbying",
        amount: fmtMoney(company.lobbying_spend),
        trend: (company.lobbying_spend ?? 0) > 1_000_000 ? "up" : "neutral",
        description:
          (company.lobbying_spend ?? 0) > 1_000_000
            ? "Significant lobbying activity. This company is actively engaged in policy."
            : (company.lobbying_spend ?? 0) > 0
            ? "Some lobbying activity on record."
            : "No lobbying spend detected.",
        drill_down_url: "https://www.opensecrets.org/federal-lobbying",
      },
      {
        label: "PAC Spending",
        amount: fmtMoney(company.total_pac_spending),
        trend: (company.total_pac_spending ?? 0) > 500_000 ? "up" : "neutral",
        description:
          (company.total_pac_spending ?? 0) > 500_000
            ? "Consistent PAC activity. Worth reviewing where contributions are directed."
            : (company.total_pac_spending ?? 0) > 0
            ? "Some political giving on record."
            : "No PAC spending detected.",
        drill_down_url: "https://www.opensecrets.org/political-action-committees-pacs",
      },
      {
        label: "Gov Contracts",
        amount: fmtMoney(contracts.reduce((s: number, c: any) => s + (c.contract_value ?? 0), 0)),
        trend: contracts.length > 5 ? "up" : "neutral",
        description: contracts.length > 0
          ? `${contracts.length} contract${contracts.length > 1 ? "s" : ""} on record.`
          : "No federal contracts found.",
        drill_down_url: "https://www.usaspending.gov/",
      },
    ];

    if ((company.subsidies_received ?? 0) > 0) {
      spendingRecord.push({
        label: "Subsidies",
        amount: fmtMoney(company.subsidies_received),
        trend: "neutral",
        description: "Public funds received. Consider alongside workforce changes.",
        drill_down_url: "https://subsidytracker.goodjobsfirst.org/",
      });
    }

    // ── Deduplicated political donors ──
    const donorMap = new Map<string, DonorProfile>();
    for (const exec of executives.filter((e: any) => e.total_donations > 0)) {
      const canonical = canonicalName(exec.name);
      const existing = donorMap.get(canonical);
      if (existing) {
        existing.total_donated += exec.total_donations;
        if (!existing.aliases.includes(exec.name)) {
          existing.aliases.push(exec.name);
        }
      } else {
        donorMap.set(canonical, {
          name: canonical,
          aliases: [exec.name],
          total_donated: exec.total_donations,
          top_recipient: exec.title ?? "N/A",
          raw_fec_link: `https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(exec.name)}`,
        });
      }
    }
    const politicalDonors = Array.from(donorMap.values()).sort(
      (a, b) => b.total_donated - a.total_donated,
    );

    // ── Active signals ──
    const signalMap: Record<string, { count: number; description: string; evidence_link: string }> = {};
    for (const s of issueSignals) {
      const cat = normCategory(s.issue_category);
      if (!signalMap[cat]) {
        signalMap[cat] = { count: 0, description: s.description ?? "", evidence_link: s.source_url ?? "" };
      }
      signalMap[cat].count++;
    }

    const activeSignals = Object.entries(signalMap).map(([cat, v]) => ({
      category: cat as EmployerReport["active_signals"][number]["category"],
      count: v.count,
      description: v.description,
      evidence_link: v.evidence_link,
    }));

    return {
      id: company.slug,
      company_name: company.name,
      industry: company.industry,
      headcount: company.employee_count ?? "Unknown",
      integrity_score: integrityScore,
      the_call: theCall,
      spending_record: spendingRecord,
      active_signals: activeSignals,
      political_donors: politicalDonors,
      institutional_links: [],
    };
  }, [company, executives, contracts, issueSignals]);
}

/* ── Helpers ── */
function fmtMoney(n?: number | null): string {
  if (!n) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/** Normalize first name to canonical form for dedup */
function canonicalName(fullName: string): string {
  const NICKNAMES: Record<string, string> = {
    mike: "Michael", mick: "Michael", mikey: "Michael",
    andy: "Andrew", drew: "Andrew",
    steve: "Steven", stephen: "Steven",
    bob: "Robert", rob: "Robert", bobby: "Robert",
    bill: "William", will: "William", willy: "William",
    jim: "James", jimmy: "James", jamie: "James",
    joe: "Joseph", joey: "Joseph",
    tom: "Thomas", tommy: "Thomas",
    dick: "Richard", rick: "Richard", rich: "Richard",
    dan: "Daniel", danny: "Daniel",
    dave: "David", davy: "David",
    ed: "Edward", eddie: "Edward", ted: "Edward",
    tony: "Anthony",
    chris: "Christopher",
    matt: "Matthew",
    pat: "Patrick",
    nick: "Nicholas",
    alex: "Alexander",
    sam: "Samuel",
    ben: "Benjamin",
    jon: "Jonathan", john: "Jonathan",
    greg: "Gregory",
    jeff: "Jeffrey",
    jerry: "Gerald",
    larry: "Lawrence",
    kate: "Katherine", kathy: "Katherine", cathy: "Katherine",
    liz: "Elizabeth", beth: "Elizabeth", betty: "Elizabeth",
    jen: "Jennifer", jenny: "Jennifer",
    meg: "Margaret", maggie: "Margaret", peggy: "Margaret",
    sue: "Susan",
    barb: "Barbara",
    deb: "Deborah", debbie: "Deborah",
  };
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0].toLowerCase().replace(/[^a-z]/g, "");
  const canonical = NICKNAMES[first] ?? parts[0];
  return [canonical, ...parts.slice(1)].join(" ");
}

function normCategory(cat: string): string {
  const MAP: Record<string, string> = {
    "Civil Rights": "labor",
    "Labor": "labor",
    "Climate": "climate",
    "Immigration": "immigration",
    "Voting Rights": "voting_rights",
    "AI Bias": "ai_bias",
    "Compliance Failure": "labor",
    "Restructuring": "labor",
    "Fraud/Fiduciary": "labor",
  };
  return MAP[cat] ?? "labor";
}
