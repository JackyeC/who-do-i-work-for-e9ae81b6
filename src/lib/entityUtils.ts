/**
 * Cleans raw entity names by stripping technical identifiers (SEC CIK, FEC IDs, etc.)
 * and converting ALL CAPS to Title Case for readability.
 */
export function cleanEntityName(name: string): string {
  if (!name) return "Unknown";
  let cleaned = name.replace(/\b(SEC\s*)?CIK[\s:#]*\d+/gi, "").trim();
  cleaned = cleaned.replace(/\(?\s*FEC\s*(ID)?[\s:#]*C\d+\s*\)?/gi, "").trim();
  cleaned = cleaned.replace(/\s*C\d{8,}\s*/g, " ").trim();
  cleaned = cleaned.replace(/\b(EIN|TIN)[\s:#]*\d[\d-]+/gi, "").trim();
  cleaned = cleaned.replace(/\bDUNS[\s:#]*\d+/gi, "").trim();
  cleaned = cleaned.replace(/\(?\s*Ticker:\s*[A-Z]+\s*\)?/gi, "").trim();
  cleaned = cleaned.replace(/[\s,\-()]+$/, "").replace(/^[\s,\-()]+/, "").trim();
  // Convert ALL CAPS to Title Case
  if (cleaned.length > 3 && cleaned === cleaned.toUpperCase()) {
    cleaned = cleaned.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    cleaned = cleaned.replace(/\b(Pac|Llc|Inc|Ltd|Co|Corp)\b/g, m => m.toUpperCase());
  }
  return cleaned || name;
}

/**
 * Expands common acronyms into plain English so non-experts can read reports.
 */
const ACRONYM_MAP: Record<string, string> = {
  PAC: "Political Action Committee (PAC)",
  "Super PAC": "Super PAC (unlimited independent spending group)",
  FEC: "Federal Election Commission (FEC)",
  SEC: "Securities and Exchange Commission (SEC)",
  CIK: "SEC Regulatory ID (CIK)",
  LDA: "Lobbying Disclosure Act (LDA)",
  DOL: "Department of Labor (DOL)",
  OSHA: "Occupational Safety & Health Administration (OSHA)",
  FACA: "Federal Advisory Committee Act (FACA)",
  EIN: "Employer ID Number (EIN)",
  DUNS: "Federal Contractor ID (DUNS)",
  EDGAR: "SEC Electronic Filing System (EDGAR)",
  "501(c)(4)": "501(c)(4) dark money nonprofit",
  "501(c)(6)": "501(c)(6) trade association",
  "527": "527 political organization",
  "10-K": "Annual Report (10-K)",
  "10-Q": "Quarterly Report (10-Q)",
  "Form 4": "Insider Trading Disclosure (Form 4)",
  "Form D": "Private Offering Filing (Form D)",
  ROI: "Return on Investment (ROI)",
};

export function expandAcronym(text: string): string {
  if (!text) return text;
  // Only expand if the text IS the acronym (badge/label context)
  const direct = ACRONYM_MAP[text];
  if (direct) return direct;
  return text;
}

/**
 * Expands acronyms found inside longer text strings (descriptions, summaries).
 */
export function expandAcronymsInText(text: string): string {
  if (!text) return text;
  let result = text;
  // Replace standalone acronyms in running text (word-boundary match)
  const standaloneAcronyms: Record<string, string> = {
    "\\bPAC\\b": "Political Action Committee",
    "\\bFEC\\b": "Federal Election Commission",
    "\\bSEC\\b": "Securities and Exchange Commission",
    "\\bLDA\\b": "Lobbying Disclosure Act",
    "\\bDOL\\b": "Department of Labor",
    "\\bOSHA\\b": "Occupational Safety & Health Admin",
    "\\bFACA\\b": "Federal Advisory Committee Act",
    "\\bEDGAR\\b": "SEC filing system",
  };
  for (const [pattern, expansion] of Object.entries(standaloneAcronyms)) {
    result = result.replace(new RegExp(pattern, "g"), expansion);
  }
  return result;
}

/**
 * Generates a plain-English description of a lobbying relationship.
 * Handles the confusing case where a company lobbies for itself vs. hires a firm.
 */
export function describeLobbyingRelationship(
  companyName: string,
  registrantName: string,
  amount: number,
  filingYear: number | string,
  issues: string[] = [],
): string {
  const cleanCompany = cleanEntityName(companyName);
  const cleanRegistrant = cleanEntityName(registrantName);
  const amountStr = amount > 0 ? ` ($${amount.toLocaleString()})` : "";
  const issueStr = issues.length > 0 ? ` on issues including ${issues.slice(0, 3).join(", ")}` : "";

  // Company does its own lobbying (registrant = client)
  const companyLower = cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, "");
  const registrantLower = cleanRegistrant.toLowerCase().replace(/[^a-z0-9]/g, "");
  const isSelfLobby = companyLower === registrantLower
    || registrantLower.includes(companyLower)
    || companyLower.includes(registrantLower);

  if (isSelfLobby) {
    return `${cleanCompany} spent${amountStr} on in-house lobbying in ${filingYear}${issueStr}`;
  }

  return `${cleanCompany} hired ${cleanRegistrant} to lobby on their behalf${amountStr} in ${filingYear}${issueStr}`;
}

/**
 * Summarize long descriptions into readable text.
 */
export function summarizeDescription(
  description: string | null,
  linkType: string,
  sourceName: string,
  targetName: string
): string {
  if (!description) return "";
  if (linkType === "committee_oversight_of_contract" && description.length > 200) {
    const titleMatch = description.match(/TITLE:\s*([^\n]+)/i);
    const awardMatch = description.match(/\(Award ID:\s*([^)]+)\)/i);
    if (titleMatch) {
      const title = titleMatch[1].trim().length > 120
        ? titleMatch[1].trim().substring(0, 120) + "…"
        : titleMatch[1].trim();
      return `Federal contract: ${title}${awardMatch ? ` (${awardMatch[1]})` : ""}`;
    }
    return description.substring(0, 150) + "…";
  }
  if (linkType === "interlocking_directorate" && /SEC EDGAR/i.test(description)) {
    const tickerMatch = description.match(/Ticker:\s*([A-Z]+)/i);
    return tickerMatch
      ? `Publicly traded company (${tickerMatch[1]})`
      : "SEC filing confirms corporate identity";
  }
  // Expand acronyms in all descriptions
  let result = description.length > 200
    ? description.substring(0, 180) + "…"
    : description;
  return expandAcronymsInText(result);
}
