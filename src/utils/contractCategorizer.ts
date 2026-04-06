/**
 * Corrects signal categorization for government contracts.
 * 
 * Prevents ICE (the agency abbreviation) from being misclassified as "immigration"
 * when the contract is actually defense, law enforcement, etc.
 */

const DEPARTMENT_CATEGORY_MAP: Record<string, string> = {
  "department of defense": "defense",
  "department of justice": "law enforcement",
  "department of health and human services": "healthcare",
  "department of transportation": "infrastructure",
  "department of homeland security": "homeland security",
  "smithsonian institution": "government services",
};

const IMMIGRATION_KEYWORDS = /\b(immigration|asylum|visa\s+processing|deportation|border\s+enforcement)\b/i;

/**
 * Given a signal's current issue_category and its associated text fields,
 * returns the corrected category. Only changes "immigration" when it was
 * assigned solely due to the "ICE" agency abbreviation.
 */
export function correctContractCategory(
  currentCategory: string,
  fields: {
    description?: string | null;
    agency_name?: string | null;
    signal_type?: string | null;
  }
): string {
  const cat = currentCategory.toLowerCase().trim();

  // Only intercept the "immigration" category
  if (cat !== "immigration") return currentCategory;

  const desc = fields.description || "";
  const agency = fields.agency_name || "";
  const signalType = fields.signal_type || "";
  const allText = `${desc} ${signalType}`;

  // If the description explicitly mentions immigration-related work, keep it
  if (IMMIGRATION_KEYWORDS.test(allText)) return currentCategory;

  // Check if the agency/description mentions a known department
  const combined = `${agency} ${desc}`.toLowerCase();
  for (const [dept, mappedCat] of Object.entries(DEPARTMENT_CATEGORY_MAP)) {
    if (combined.includes(dept)) return mappedCat;
  }

  // If it looks like a government contract signal but not immigration content,
  // recategorize as generic "government contract"
  const isContractSignal =
    signalType.toLowerCase().includes("contract") ||
    desc.toLowerCase().includes("contract") ||
    agency.length > 0;

  if (isContractSignal) return "government contract";

  // Fallback: keep original
  return currentCategory;
}

/**
 * Applies contract category correction to an array of issue signals,
 * returning new objects with corrected issue_category.
 */
export function correctSignalCategories<
  T extends { issue_category: string; description?: string; signal_type?: string; [key: string]: any }
>(signals: T[]): T[] {
  return signals.map(s => ({
    ...s,
    issue_category: correctContractCategory(s.issue_category, {
      description: s.description,
      agency_name: (s as any).agency_name,
      signal_type: s.signal_type,
    }),
  }));
}
