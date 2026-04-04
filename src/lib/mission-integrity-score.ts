/**
 * Mission Integrity Score — compares what a company says vs. what records show.
 */

export interface MissionConflict {
  claim: string;
  evidence: string;
  category: string;
  severity: "high" | "medium" | "low";
}

export interface MissionIntegrityResult {
  score: number; // 0-100
  grade: string; // A-F
  conflicts: MissionConflict[];
  stanceCount: number;
  enforcementCount: number;
  donationMismatches: number;
}

const TOPIC_ENFORCEMENT_MAP: Record<string, string[]> = {
  "worker safety": ["osha", "safety", "workplace safety"],
  "diversity": ["eeoc", "discrimination", "title vii", "civil rights"],
  "equity": ["pay equity", "wage theft", "equal pay"],
  "inclusion": ["discrimination", "harassment", "hostile work environment"],
  "sustainability": ["epa", "environmental", "emissions", "pollution"],
  "transparency": ["sec", "fraud", "misrepresentation"],
  "employee wellness": ["osha", "safety", "workers comp"],
  "fair pay": ["wage", "flsa", "overtime", "minimum wage"],
  "anti-discrimination": ["eeoc", "discrimination", "title vii"],
  "lgbtq": ["discrimination", "title vii"],
  "racial equity": ["discrimination", "civil rights", "eeoc"],
  "gender equality": ["discrimination", "pay equity", "title vii"],
};

function gradeFromScore(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function computeMissionIntegrity(
  stances: { stance_topic: string; stance_summary: string }[],
  enforcements: { signal_type: string; description?: string; headline?: string }[],
  donations: { recipient_name?: string; party?: string; amount?: number }[],
): MissionIntegrityResult {
  const conflicts: MissionConflict[] = [];
  let score = 100;

  // Compare stances vs enforcement signals
  for (const stance of stances) {
    const topic = (stance.stance_topic || "").toLowerCase();
    const keywords = Object.entries(TOPIC_ENFORCEMENT_MAP)
      .filter(([key]) => topic.includes(key))
      .flatMap(([, vals]) => vals);

    if (keywords.length === 0) continue;

    const matchingEnforcements = enforcements.filter((e) => {
      const text = `${e.signal_type} ${e.description || ""} ${e.headline || ""}`.toLowerCase();
      return keywords.some((k) => text.includes(k));
    });

    if (matchingEnforcements.length > 0) {
      conflicts.push({
        claim: stance.stance_topic,
        evidence: `${matchingEnforcements.length} enforcement action(s) in this area`,
        category: "Enforcement Contradiction",
        severity: matchingEnforcements.length >= 3 ? "high" : matchingEnforcements.length >= 2 ? "medium" : "low",
      });
      score -= matchingEnforcements.length >= 3 ? 20 : matchingEnforcements.length >= 2 ? 12 : 6;
    }
  }

  // Check for political donation mismatches with stated values
  const progressiveStances = stances.filter((s) => {
    const t = (s.stance_topic || "").toLowerCase();
    return ["diversity", "equity", "inclusion", "lgbtq", "racial equity", "climate", "sustainability", "gender"].some((k) => t.includes(k));
  });

  let donationMismatches = 0;
  if (progressiveStances.length > 0 && donations.length > 0) {
    const antiAlignedDonations = donations.filter(
      (d) => d.party === "Republican" && (d.amount || 0) > 1000
    );
    if (antiAlignedDonations.length > 0) {
      donationMismatches = antiAlignedDonations.length;
      const totalAmount = antiAlignedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
      conflicts.push({
        claim: `Public stances on ${progressiveStances.map((s) => s.stance_topic).slice(0, 3).join(", ")}`,
        evidence: `$${totalAmount.toLocaleString()} in donations to candidates opposing these positions`,
        category: "Political Giving Contradiction",
        severity: totalAmount > 50000 ? "high" : totalAmount > 10000 ? "medium" : "low",
      });
      score -= totalAmount > 50000 ? 25 : totalAmount > 10000 ? 15 : 8;
    }
  }

  // Bonus for no contradictions
  if (stances.length > 0 && conflicts.length === 0) {
    score = Math.min(100, score + 5);
  }

  // Penalty for having no stances at all (transparency gap)
  if (stances.length === 0) {
    score = Math.max(0, score - 30);
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    grade: gradeFromScore(score),
    conflicts: conflicts.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    }).slice(0, 5),
    stanceCount: stances.length,
    enforcementCount: enforcements.length,
    donationMismatches,
  };
}
