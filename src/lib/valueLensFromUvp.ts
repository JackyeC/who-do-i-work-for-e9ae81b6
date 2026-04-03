/**
 * Map user_values_profile row → human labels for top-weighted lenses (for Dream Job Profile).
 */
const UVP_KEYS: { key: string; label: string }[] = [
  { key: "pay_transparency_importance", label: "Pay transparency" },
  { key: "worker_protections_importance", label: "Worker protections" },
  { key: "ai_transparency_importance", label: "AI hiring transparency" },
  { key: "benefits_importance", label: "Benefits quality" },
  { key: "remote_flexibility_importance", label: "Remote flexibility" },
  { key: "mission_alignment_importance", label: "Mission alignment" },
  { key: "political_influence_sensitivity", label: "Political influence sensitivity" },
  { key: "representation_disclosure_importance", label: "DEI & representation" },
  { key: "labor_rights_importance", label: "Labor rights" },
  { key: "pay_equity_importance", label: "Pay equity" },
  { key: "data_privacy_importance", label: "Data privacy" },
  { key: "environment_climate_importance", label: "Climate & environment" },
  { key: "dei_equity_importance", label: "DEI equity" },
];

const MIN_SCORE = 58;

export function topValuesLensLabelsFromUvp(
  uvp: Record<string, unknown> | null | undefined,
  limit = 10
): string[] {
  if (!uvp) return [];
  const scored = UVP_KEYS.map(({ key, label }) => {
    const v = uvp[key];
    const n = typeof v === "number" ? v : 0;
    return { label, n };
  }).filter((x) => x.n >= MIN_SCORE);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of scored.sort((a, b) => b.n - a.n)) {
    if (seen.has(s.label)) continue;
    seen.add(s.label);
    out.push(s.label);
    if (out.length >= limit) break;
  }
  return out;
}
