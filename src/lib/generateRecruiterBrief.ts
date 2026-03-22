/**
 * Pure-logic module: takes existing company data and produces
 * the 7 recruiter-brief sections without any API calls.
 */

export interface BriefSignal {
  label: string;
  detail: string;
  level: "positive" | "neutral" | "caution";
}

export interface RecruiterBriefData {
  companyName: string;
  industry: string;
  score: number;
  confidence: "High" | "Medium" | "Low";
  signals: BriefSignal[];
  patterns: string[];
  candidateQuestions: string[];
  candidateConcerns: string[];
  sayThis: string[];
  avoidThis: string[];
  strengths: string[];
  honestAbout: string[];
  beReadyToAnswer: string[];
}

interface CompanyRow {
  id: string;
  name: string;
  industry: string;
  civic_footprint_score: number;
  career_intelligence_score: number | null;
  confidence_rating: string;
  lobbying_spend: number | null;
  employee_count: string | null;
  jackye_insight: string | null;
  is_publicly_traded: boolean | null;
  description: string | null;
}

export function generateRecruiterBrief(
  company: CompanyRow,
  jobCount: number,
  warnCount: number,
  execTurnover: number,
  sentimentPositive: number,
  sentimentNegative: number,
  litigationCount: number,
): RecruiterBriefData {
  const cis = company.career_intelligence_score ?? 0;
  const cfs = company.civic_footprint_score ?? 0;
  const score = Math.round((cis * 10 + cfs) / 2);
  const lobby = company.lobbying_spend ?? 0;

  // Confidence
  const confidence: "High" | "Medium" | "Low" =
    cis >= 6 && cfs >= 50 ? "High" : cis >= 3 || cfs >= 25 ? "Medium" : "Low";

  // ── SIGNALS ──
  const signals: BriefSignal[] = [];

  if (jobCount > 30) {
    signals.push({ label: "High Hiring Volume", detail: `${jobCount} active postings detected — may indicate rapid scaling or high turnover`, level: "caution" });
  } else if (jobCount > 10) {
    signals.push({ label: "Moderate Hiring Activity", detail: `${jobCount} open roles — steady growth pace`, level: "neutral" });
  } else {
    signals.push({ label: "Selective Hiring", detail: `${jobCount} open roles — targeted hiring approach`, level: "positive" });
  }

  if (warnCount > 3) {
    signals.push({ label: "WARN Notices Filed", detail: `${warnCount} workforce reduction notices on record`, level: "caution" });
  } else if (warnCount > 0) {
    signals.push({ label: "Minor WARN History", detail: `${warnCount} historic notice(s) — low frequency`, level: "neutral" });
  }

  if (execTurnover > 3) {
    signals.push({ label: "Executive Turnover", detail: `${execTurnover} leadership departures logged — may signal instability or restructuring`, level: "caution" });
  } else if (execTurnover > 0) {
    signals.push({ label: "Stable Leadership", detail: "Minimal executive turnover detected", level: "positive" });
  }

  if (litigationCount > 2) {
    signals.push({ label: "Litigation Flags", detail: `${litigationCount} employment-related cases found`, level: "caution" });
  }

  if (lobby > 1_000_000) {
    signals.push({ label: "Significant Political Spending", detail: `$${(lobby / 1_000_000).toFixed(1)}M in lobbying — may surface candidate values questions`, level: "caution" });
  }

  if (sentimentPositive > sentimentNegative * 2) {
    signals.push({ label: "Positive Worker Sentiment", detail: "Employee reviews skew favorably", level: "positive" });
  } else if (sentimentNegative > sentimentPositive) {
    signals.push({ label: "Mixed Worker Sentiment", detail: "Negative themes present in employee reviews", level: "caution" });
  }

  // Ensure at least 3 signals
  if (signals.length < 3) {
    signals.push({ label: "Compensation Visibility", detail: cis >= 5 ? "Salary data publicly available" : "Limited public compensation data", level: cis >= 5 ? "positive" : "neutral" });
  }

  // ── PATTERNS ──
  const patterns: string[] = [];
  if (jobCount > 30) patterns.push("High operational pace — roles may evolve quickly");
  if (execTurnover > 3) patterns.push("Potential leadership ambiguity — org structure may be in flux");
  if (warnCount > 0) patterns.push("Historical workforce reductions — stability questions likely");
  if (sentimentNegative > sentimentPositive) patterns.push("Cultural concerns surface in reviews — candidates will notice");
  if (jobCount > 10 && jobCount <= 30) patterns.push("Steady growth trajectory — good sign for long-term roles");
  if (cfs >= 60) patterns.push("Strong civic track record — appeals to values-driven candidates");
  if (patterns.length === 0) patterns.push("Limited signals available — proceed with general market context");

  // ── CANDIDATE PERSPECTIVE ──
  const candidateQuestions: string[] = [
    "Why is this role open?",
    "What does day-to-day look like in the first 90 days?",
  ];
  if (jobCount > 20) candidateQuestions.push("How many people have held this role in the last 2 years?");
  if (warnCount > 0) candidateQuestions.push("Were there recent layoffs or restructuring?");
  if (cis < 5) candidateQuestions.push("What's the compensation band for this level?");

  const candidateConcerns: string[] = [];
  if (execTurnover > 2) candidateConcerns.push("Unclear reporting lines due to leadership changes");
  if (warnCount > 0) candidateConcerns.push("Job security after prior workforce reductions");
  if (sentimentNegative > sentimentPositive) candidateConcerns.push("Work-life balance and cultural fit");
  if (jobCount > 30) candidateConcerns.push("Role scope creep in a fast-scaling environment");
  if (candidateConcerns.length === 0) candidateConcerns.push("Standard due-diligence questions — nothing elevated");

  // ── COMMUNICATION GUIDANCE ──
  const sayThis: string[] = [];
  const avoidThis: string[] = [];

  sayThis.push("\"Here's what I can tell you about the role based on what I've seen internally.\"");
  if (warnCount > 0) sayThis.push("\"The company did go through a restructuring — here's what's different now.\"");
  if (execTurnover > 2) sayThis.push("\"There have been leadership changes. Here's who your direct report would be and how long they've been in the role.\"");
  if (sentimentNegative > sentimentPositive) sayThis.push("\"Some reviews mention pace and workload. Here's what the team says about that today.\"");
  sayThis.push("\"I'd rather be straight with you now than have you surprised later.\"");

  avoidThis.push("\"We're like a family here\"");
  avoidThis.push("\"This is a once-in-a-lifetime opportunity\"");
  if (warnCount > 0) avoidThis.push("Downplaying past layoffs — candidates will find them");
  if (execTurnover > 2) avoidThis.push("\"Leadership is stable\" when turnover data says otherwise");
  avoidThis.push("Vague answers about compensation structure");

  // ── TRADEOFFS ──
  const strengths: string[] = [];
  const honestAbout: string[] = [];

  if (cfs >= 50) strengths.push("Civic engagement record above industry average");
  if (company.is_publicly_traded) strengths.push("Public company with financial transparency");
  if (jobCount > 5) strengths.push("Active investment in growth and hiring");
  if (sentimentPositive > sentimentNegative) strengths.push("Generally positive employee sentiment");
  if (strengths.length === 0) strengths.push("Established market presence");

  if (execTurnover > 2) honestAbout.push("Leadership instability signals");
  if (warnCount > 0) honestAbout.push("Past workforce reductions are public record");
  if (sentimentNegative > sentimentPositive) honestAbout.push("Some employees report culture and workload concerns");
  if (lobby > 500_000) honestAbout.push("Political spending may not align with every candidate's values");
  if (honestAbout.length === 0) honestAbout.push("Limited data depth — brief based on available signals only");

  // ── BE READY TO ANSWER ──
  const beReadyToAnswer: string[] = [
    "\"What's the real reason this role is open?\"",
    "\"What happened to the last person in this position?\"",
  ];
  if (litigationCount > 0) beReadyToAnswer.push("\"I saw some legal issues — can you tell me about that?\"");
  if (warnCount > 0) beReadyToAnswer.push("\"Are more layoffs expected?\"");

  return {
    companyName: company.name,
    industry: company.industry,
    score,
    confidence,
    signals: signals.slice(0, 5),
    patterns,
    candidateQuestions,
    candidateConcerns,
    sayThis,
    avoidThis,
    strengths,
    honestAbout,
    beReadyToAnswer: beReadyToAnswer.slice(0, 3),
  };
}
