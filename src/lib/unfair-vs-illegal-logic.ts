/**
 * Unfair vs. Illegal — decision-tree logic for workplace incident triage.
 */

export type ProtectedBasis =
  | "race" | "sex" | "age" | "disability" | "religion"
  | "national_origin" | "pregnancy" | "genetic_info"
  | "retaliation" | "none";

export type PatternType = "pattern" | "isolated";
export type ReportedType = "yes" | "no" | "no_channels";

export interface TriageInput {
  protectedBasis: ProtectedBasis;
  pattern: PatternType;
  reported: ReportedType;
}

export interface TriageOutcome {
  category: string;
  legalStanding: string;
  explanation: string;
  documentationChecklist: string[];
  nextSteps: string[];
}

export function triageIncident(input: TriageInput): TriageOutcome {
  const { protectedBasis, pattern, reported } = input;

  // Retaliation is its own track
  if (protectedBasis === "retaliation") {
    return {
      category: "Potential Retaliation Claim",
      legalStanding: "Retaliation is illegal under federal law (Title VII, ADA, ADEA, OSHA). You do not need to prove the underlying claim was valid -- only that you engaged in protected activity and experienced adverse action.",
      explanation: "If you filed a complaint, participated in an investigation, or opposed unlawful practices and then experienced demotion, termination, reduced hours, or hostile treatment, this may constitute retaliation. Courts look at timing, pattern, and whether similarly-situated employees were treated differently.",
      documentationChecklist: [
        "Date you engaged in protected activity (complaint, report, testimony)",
        "Date adverse action occurred",
        "Timeline showing proximity between the two",
        "Names of decision-makers involved",
        "Any written communications referencing your complaint",
        "Comparator evidence: how were others treated who did not complain?",
      ],
      nextSteps: [
        "File a charge with the EEOC within 180 days (300 in some states)",
        "Consult an employment attorney -- many offer free initial consultations for retaliation claims",
        "Continue documenting every interaction with decision-makers",
        "Do not resign -- constructive discharge claims are harder to prove",
      ],
    };
  }

  // No protected characteristic -- unfair but likely not illegal
  if (protectedBasis === "none") {
    if (pattern === "pattern") {
      return {
        category: "Unfair Treatment -- Pattern Detected",
        legalStanding: "This appears to be unfair treatment or mismanagement, which is generally not a legal claim under federal employment law. However, a documented pattern strengthens your position in a severance negotiation or internal grievance.",
        explanation: "Most workplace mistreatment -- favoritism, rudeness, inconsistent policies, micromanagement -- is legal unless it targets a protected characteristic. That does not mean you have to accept it. Documented patterns create leverage.",
        documentationChecklist: [
          "Timeline of incidents with dates",
          "Names of all participants and witnesses",
          "Verbatim quotes where possible",
          "Any written policies that were violated",
          "Impact on your work output or mental health (factual, not emotional)",
          "Evidence that similarly-situated employees were treated differently",
        ],
        nextSteps: [
          "Use your evidence log to build a pattern case",
          "Request a meeting with HR and present documented evidence",
          "If the pattern continues, this documentation becomes leverage for a severance negotiation",
          "Consider whether this workplace serves your career trajectory",
        ],
      };
    }

    return {
      category: "Unfair but Not Illegal",
      legalStanding: "This appears to be an isolated incident of unfair treatment. While frustrating, isolated rudeness, favoritism, or poor management is generally not actionable under employment law unless it targets a protected class.",
      explanation: "Employment is a business transaction, not a family. Not every bad experience is a legal claim, but every experience is worth documenting. One incident becomes a data point. Three data points become a pattern.",
      documentationChecklist: [
        "Date, time, and location of the incident",
        "Who was involved",
        "What was said (verbatim if possible)",
        "Any witnesses",
        "Relevant company policy (if applicable)",
      ],
      nextSteps: [
        "Log this incident in your evidence logger -- even isolated events matter later",
        "Note whether this is consistent with how others are treated",
        "If it happens again, you'll have the start of a pattern",
        "Review your company's grievance procedures",
      ],
    };
  }

  // Protected characteristic + pattern = strongest case
  if (pattern === "pattern") {
    if (reported === "yes") {
      return {
        category: "Hostile Work Environment -- Strong Documentation",
        legalStanding: "A pattern of conduct based on a protected characteristic (${protectedBasis}) that you have reported constitutes a strong basis for a hostile work environment claim. The employer's response (or lack of response) to your report is critical evidence.",
        explanation: "You've done the right things: identified the basis, documented the pattern, and reported it. If the employer failed to investigate or take corrective action, that failure itself is evidence. Courts look at whether the conduct was severe or pervasive enough to alter working conditions.",
        documentationChecklist: [
          "Complete timeline of all incidents with dates",
          "Copy of your internal complaint/report",
          "Employer's response (or lack thereof) with dates",
          "Names of all witnesses",
          "Evidence that conduct was based on ${protectedBasis}",
          "Impact on your ability to perform your job",
          "Comparator evidence",
        ],
        nextSteps: [
          "Consult an employment attorney immediately -- you have a strong foundation",
          "File an EEOC charge within the deadline (180/300 days)",
          "Preserve all evidence including emails, texts, and chat logs",
          "Do not delete any communications",
          "Consider whether continued exposure to this environment is sustainable",
        ],
      };
    }

    if (reported === "no_channels") {
      return {
        category: "Potential Discrimination Claim -- No Internal Remedy",
        legalStanding: "A pattern of conduct based on a protected characteristic without available internal reporting channels actually strengthens your external claim. Employers are expected to maintain complaint mechanisms.",
        explanation: "The absence of a reporting channel is itself evidence of a systemic failure. You are not required to report internally before filing an external complaint if no reasonable mechanism exists.",
        documentationChecklist: [
          "Evidence that no reporting channel exists (employee handbook, org chart)",
          "Complete timeline of discriminatory incidents",
          "Names and roles of those involved",
          "Verbatim quotes tied to protected characteristic",
          "Impact documentation",
        ],
        nextSteps: [
          "File directly with the EEOC or your state's fair employment agency",
          "Document the absence of internal channels as part of your claim",
          "Consult an employment attorney",
          "Continue logging incidents",
        ],
      };
    }

    return {
      category: "Potential Discrimination Claim -- Report Recommended",
      legalStanding: "A documented pattern of conduct based on a protected characteristic is the foundation of a discrimination claim. However, courts often expect employees to use internal reporting channels first.",
      explanation: "You have a pattern but haven't reported it yet. Reporting creates a legal record and triggers the employer's obligation to investigate. Their response becomes evidence either way.",
      documentationChecklist: [
        "Complete incident timeline",
        "Evidence linking conduct to protected characteristic",
        "Company policy on discrimination/harassment",
        "Names of all involved parties",
        "Your internal complaint (once filed)",
      ],
      nextSteps: [
        "File an internal complaint through HR or your company's designated process",
        "Keep a copy of everything you submit",
        "Note the date, who received it, and any response",
        "If no action is taken within 2 weeks, consult an employment attorney",
        "Begin EEOC filing preparation",
      ],
    };
  }

  // Protected characteristic + isolated incident
  return {
    category: "Potential Discrimination -- Single Incident",
    legalStanding: "A single incident based on a protected characteristic can be actionable if it was severe enough (e.g., a slur, a threat, a tangible employment action like termination or demotion). For less severe incidents, you need to build a record.",
    explanation: "One incident is harder to litigate but not impossible. A single severe act (assault, explicit slur, retaliatory termination) can stand alone. Less severe incidents need pattern evidence. Start building that record now.",
    documentationChecklist: [
      "Exact date, time, and location",
      "Verbatim account of what happened",
      "Connection to protected characteristic (what was said/done that indicates bias)",
      "Witnesses present",
      "Your immediate response",
      "Any follow-up communications",
    ],
    nextSteps: [
      "Document this incident thoroughly in your evidence log",
      "Watch for additional incidents -- one event becomes a pattern with repetition",
      "If the incident was severe (slur, threat, adverse employment action), consult an attorney now",
      "If less severe, continue monitoring and documenting",
    ],
  };
}

export const PROTECTED_CHARACTERISTICS: { value: ProtectedBasis; label: string }[] = [
  { value: "race", label: "Race or ethnicity" },
  { value: "sex", label: "Sex, gender, or sexual orientation" },
  { value: "age", label: "Age (40+)" },
  { value: "disability", label: "Disability or medical condition" },
  { value: "religion", label: "Religion" },
  { value: "national_origin", label: "National origin" },
  { value: "pregnancy", label: "Pregnancy or parental status" },
  { value: "genetic_info", label: "Genetic information" },
  { value: "retaliation", label: "Retaliation for reporting/complaining" },
  { value: "none", label: "None of the above -- personality conflict, favoritism, general rudeness" },
];
