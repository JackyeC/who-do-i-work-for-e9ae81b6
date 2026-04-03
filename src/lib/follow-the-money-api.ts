/**
 * Follow the Money — API client
 * Reads from Supabase tables: entity_linkages, company_executives,
 * executive_recipients, company_aliases, company_political_risk.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  FollowTheMoneyResponse,
  ElectionCycle,
  TopRecipient,
  CoverageStatus,
  MatchConfidence,
} from "@/types/follow-the-money";

const DISCLAIMER =
  "This data is compiled from FEC filings, Senate LDA disclosures, and public corporate records. " +
  "Contributions shown are from individuals employed by or affiliated with this company — not the company itself. " +
  "Totals may not reflect all activity. We show what the public record shows.";

/** Fetch the full Follow the Money dossier for a company */
export async function fetchFollowTheMoney(
  companyId: string
): Promise<FollowTheMoneyResponse> {
  // 1. Get company name
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, slug")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    throw new Error(companyError?.message || "Company not found");
  }

  // 2. Fetch entity linkages (donation types)
  const donationTypes = [
    "donation_to_member",
    "trade_association_lobbying",
    "dark_money_channel",
    "lobbying_on_bill",
  ];

  const { data: linkages, error: linkError } = await supabase
    .from("entity_linkages")
    .select("amount, created_at, target_entity_name, target_entity_type, link_type, source_entity_name, metadata, confidence_score")
    .eq("company_id", companyId)
    .in("link_type", donationTypes);

  if (linkError) throw new Error(linkError.message);

  // 3. Fetch executive recipients for cycle/recipient breakdown
  const { data: executives } = await supabase
    .from("company_executives")
    .select("id, name, total_donations")
    .eq("company_id", companyId);

  const execIds = (executives || []).map((e) => e.id);

  let recipients: { name: string; amount: number; party: string | null; state: string | null }[] = [];
  if (execIds.length > 0) {
    const { data: recData } = await supabase
      .from("executive_recipients")
      .select("name, amount, party, state")
      .in("executive_id", execIds);
    recipients = recData || [];
  }

  // 4. Fetch aliases
  const { data: aliases } = await supabase
    .from("company_aliases")
    .select("alias_name")
    .eq("company_id", companyId);

  const aliasesSearched = [
    company.name,
    ...(aliases || []).map((a) => a.alias_name),
  ];

  // 5. Compute cycles from linkages metadata or created_at year
  const cycleMap = new Map<number, { total: number; count: number; recipientMap: Map<string, number> }>();

  for (const link of linkages || []) {
    const year = new Date(link.created_at).getFullYear();
    const cycle = year % 2 === 0 ? year : year + 1; // even election cycles
    const entry = cycleMap.get(cycle) || { total: 0, count: 0, recipientMap: new Map() };
    const amt = Number(link.amount) || 0;
    entry.total += amt;
    entry.count += 1;
    if (link.target_entity_name) {
      entry.recipientMap.set(
        link.target_entity_name,
        (entry.recipientMap.get(link.target_entity_name) || 0) + amt
      );
    }
    cycleMap.set(cycle, entry);
  }

  // Also fold in executive_recipients
  for (const r of recipients) {
    // We don't have year on recipients, aggregate into "all" via latest cycle
    const latestCycle = Math.max(...Array.from(cycleMap.keys()), new Date().getFullYear());
    const cycle = latestCycle % 2 === 0 ? latestCycle : latestCycle + 1;
    const entry = cycleMap.get(cycle) || { total: 0, count: 0, recipientMap: new Map() };
    const amt = Number(r.amount) || 0;
    entry.total += amt;
    entry.count += 1;
    if (r.name) {
      entry.recipientMap.set(r.name, (entry.recipientMap.get(r.name) || 0) + amt);
    }
    cycleMap.set(cycle, entry);
  }

  const cycles: ElectionCycle[] = Array.from(cycleMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([cycle, data]) => ({
      cycle,
      totalAmount: data.total,
      contributionCount: data.count,
      topRecipients: Array.from(data.recipientMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount })),
    }));

  const totalLinked = cycles.reduce((s, c) => s + c.totalAmount, 0);
  const totalCount = cycles.reduce((s, c) => s + c.contributionCount, 0);

  // 6. Determine status
  let status: CoverageStatus = "none";
  if (totalCount >= 10) status = "strong";
  else if (totalCount > 0) status = "limited";

  // 7. Match confidence
  let matchConfidence: MatchConfidence = "low";
  if (aliasesSearched.length > 2 && totalCount >= 10) matchConfidence = "high";
  else if (totalCount > 0) matchConfidence = "medium";

  // 8. Last refreshed — most recent linkage created_at
  const lastRefreshedAt =
    (linkages || []).length > 0
      ? (linkages || [])
          .map((l) => l.created_at)
          .sort()
          .reverse()[0]
      : null;

  return {
    companyId,
    companyName: company.name,
    status,
    summary: {
      totalLinkedContributions: totalLinked,
      contributionCount: totalCount,
      lastRefreshedAt,
    },
    cycles,
    aliasesSearched,
    matchConfidence,
    disclaimer: DISCLAIMER,
  };
}

/** Fetch a list of companies for the browse/search view */
export async function fetchCompaniesWithMoneyTrail(limit = 20) {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, industry, total_pac_spending, lobbying_spend, corporate_pac_exists")
    .or("total_pac_spending.gt.0,lobbying_spend.gt.0,corporate_pac_exists.eq.true")
    .order("total_pac_spending", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}
