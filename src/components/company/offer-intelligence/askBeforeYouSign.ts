/* ── Contextual questions by industry + company size ── */

export function getAskBeforeYouSign(
  industry: string,
  employeeCount?: string | null,
): string[] {
  const base = [
    "What does the funding structure look like — and has it changed in the last 12 months?",
    "What happened to the last person in this role?",
    "How is performance evaluated in the first year?",
  ];

  const industryQs: string[] = [];
  const lower = industry.toLowerCase();

  if (lower.includes("behavioral") || lower.includes("mental health")) {
    industryQs.push(
      "Is this position funded by Medicaid, managed care contracts, or private insurance revenue?",
    );
    industryQs.push(
      "What is the current patient-to-staff ratio on the unit I'd be joining?",
    );
    industryQs.push(
      "What is the employee turnover rate at this facility over the past 12 months?",
    );
    industryQs.push(
      "Has the facility received any CMS citations, state licensing complaints, or Joint Commission findings in the past 3 years?",
    );
    industryQs.push(
      "Have there been layoffs, site closures, or contract losses in the last 18 months?",
    );
  } else if (lower.includes("health") && !lower.includes("behavioral")) {
    industryQs.push(
      "Is this position funded by Medicaid, grants, or private revenue?",
    );
    industryQs.push(
      "Have there been layoffs or site closures in the last 18 months?",
    );
    industryQs.push(
      "What is the nurse/clinician-to-patient ratio and how has it changed?",
    );
  } else if (lower.includes("tech") || lower.includes("software")) {
    industryQs.push(
      "Is this role tied to a specific product line — and what's its revenue trajectory?",
    );
    industryQs.push(
      "What's the company's current runway or path to profitability?",
    );
  } else if (lower.includes("education")) {
    industryQs.push(
      "Is enrollment trending up or down at this institution?",
    );
    industryQs.push(
      "Are there pending budget cuts or restructuring plans?",
    );
  } else if (lower.includes("retail") || lower.includes("restaurant")) {
    industryQs.push(
      "How many locations have opened or closed in the last year?",
    );
    industryQs.push(
      "Is this a corporate role or does it depend on franchise-level decisions?",
    );
  } else if (lower.includes("nonprofit")) {
    industryQs.push(
      "What percentage of revenue comes from federal or state grants?",
    );
    industryQs.push(
      "Is this position grant-funded, and when does the grant cycle end?",
    );
  } else {
    industryQs.push(
      "What does leadership turnover look like at the director level and above?",
    );
    industryQs.push(
      "Has the company gone through a merger, acquisition, or restructuring recently?",
    );
  }

  if (employeeCount) {
    const count = parseInt(employeeCount.replace(/[^0-9]/g, ""), 10);
    if (count && count < 100) {
      industryQs.push(
        "Is there a dedicated HR function, or does the founder handle personnel decisions?",
      );
    }
  }

  return [...base, ...industryQs].slice(0, 7);
}
