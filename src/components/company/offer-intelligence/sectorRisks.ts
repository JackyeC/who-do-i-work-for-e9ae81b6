/* ── Sector risk intelligence with detailed 2025–2026 context ── */

export interface SectorRiskEntry {
  summary: string;
  detail: string;
}

export const SECTOR_RISKS: Record<string, SectorRiskEntry> = {
  "Behavioral Health": {
    summary:
      "Behavioral health employers are under severe financial pressure in 2025–2026 due to Medicaid reimbursement cuts.",
    detail:
      "Nearly 500 behavioral health workers were laid off in Colorado alone in early 2025, and Texas has its own Medicaid volatility exposure. Ask about funding source stability — whether the facility runs on state Medicaid, managed care contracts, or private insurance — before signing.",
  },
  Healthcare: {
    summary:
      "Healthcare consolidation is accelerating. Private equity ownership and staffing mandates are shifting the ground under workers.",
    detail:
      "Ask who actually owns this company, how they're funded, and whether your role is tied to a specific contract or facility that could be restructured.",
  },
  Education: {
    summary:
      "School closures, enrollment shifts, and funding volatility are hitting education employers hard.",
    detail:
      "Ask about enrollment trends, state/federal funding dependency, and whether pending budget cuts or restructuring plans could affect this role within 18 months.",
  },
  Staffing: {
    summary:
      "Staffing agencies are facing margin compression and contract instability.",
    detail:
      "Ask about guaranteed hours, benefits eligibility timelines, and how long the client contract backing your placement is expected to last.",
  },
  Retail: {
    summary:
      "Retail is shedding stores and shifting to distribution and e-commerce.",
    detail:
      "Ask whether the role you're being offered will exist in 18 months, how many locations have opened or closed recently, and whether this is a corporate or franchise-level decision.",
  },
  Media: {
    summary:
      "Media layoffs have been relentless since 2023.",
    detail:
      "Ask about revenue diversification and whether your role is tied to a single product, advertiser, or client relationship.",
  },
  "Real Estate": {
    summary:
      "Commercial real estate is still correcting. Residential is bifurcated by market.",
    detail:
      "Ask about occupancy rates, whether your compensation is tied to transaction volume, and what the company's 12-month pipeline looks like.",
  },
  Tech: {
    summary:
      "Tech hiring has rebounded selectively — mostly in AI and infrastructure.",
    detail:
      "If the role isn't in AI, cloud infrastructure, or security, ask why it's open now, what happened to the previous person, and whether the product line has a clear revenue trajectory.",
  },
  Nonprofit: {
    summary:
      "Nonprofit funding is volatile, especially for orgs dependent on federal grants.",
    detail:
      "Ask about funding runway, whether your position is grant-funded, when the grant cycle ends, and what percentage of revenue comes from government sources.",
  },
  "Financial Services": {
    summary:
      "Financial services is automating aggressively.",
    detail:
      "Ask whether this role has a two-year horizon, whether it's backfilling someone who left or a net-new position, and how AI/automation is expected to affect the function.",
  },
};

export function getSectorRisk(industry: string): SectorRiskEntry | null {
  for (const [sector, risk] of Object.entries(SECTOR_RISKS)) {
    if (industry.toLowerCase().includes(sector.toLowerCase())) return risk;
  }
  return null;
}
