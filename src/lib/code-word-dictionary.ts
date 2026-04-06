/**
 * Code Word Dictionary — flagged phrases from legal research on bias indicators.
 * Each entry maps a phrase to its risk category, severity, and plain-language explanation.
 */

export type CodeWordSeverity = "flag" | "watch" | "note";

export interface CodeWordEntry {
  phrase: string;
  category: string;
  severity: CodeWordSeverity;
  riskSignal: string;
  explanation: string;
}

export const CODE_WORD_DICTIONARY: CodeWordEntry[] = [
  // Age discrimination signals
  { phrase: "young and hungry", category: "Age Discrimination", severity: "flag", riskSignal: "Age-coded language", explanation: "Courts have recognized 'young' in job postings as evidence of age preference. This phrase signals the employer may favor younger workers." },
  { phrase: "digital native", category: "Age Discrimination", severity: "flag", riskSignal: "Age proxy", explanation: "Functionally equivalent to requesting a younger worker. Frames older candidates as inherently less capable with technology." },
  { phrase: "recent graduate", category: "Age Discrimination", severity: "watch", riskSignal: "Age proxy when not role-appropriate", explanation: "Legitimate for entry-level roles, but a red flag if the role requires experience. Often used to filter out older applicants." },
  { phrase: "high energy", category: "Age Discrimination", severity: "watch", riskSignal: "Age and disability proxy", explanation: "Can function as code for 'young and able-bodied.' Evaluate whether physical stamina is genuinely required." },
  { phrase: "fresh perspective", category: "Age Discrimination", severity: "note", riskSignal: "Potential age preference", explanation: "Sometimes used to signal preference for less experienced (younger) candidates without stating it directly." },
  { phrase: "up-and-coming", category: "Age Discrimination", severity: "watch", riskSignal: "Age-coded language", explanation: "Implies the ideal candidate is early-career, which correlates with age and can discourage experienced applicants." },

  // Culture fit / exclusion signals
  { phrase: "culture fit", category: "Exclusion Proxy", severity: "flag", riskSignal: "Bias proxy in hiring", explanation: "Widely documented as a mechanism for subjective rejection. 'Culture fit' has been cited in discrimination cases as cover for racial, gender, or class bias." },
  { phrase: "not the right fit", category: "Exclusion Proxy", severity: "flag", riskSignal: "Vague rejection language", explanation: "When used without specifics, this is the most common language in discriminatory hiring decisions. Absence of concrete reasoning is the tell." },
  { phrase: "family-oriented", category: "Exclusion Proxy", severity: "watch", riskSignal: "Family-status signal", explanation: "Can signal hostility toward childfree workers, single parents, or non-traditional family structures. Also used to justify long-hours culture as 'sacrifice.'" },
  { phrase: "tight-knit team", category: "Exclusion Proxy", severity: "watch", riskSignal: "In-group preference", explanation: "Often correlates with homogeneous teams that resist outsiders. Can indicate difficulty for new hires who don't match existing demographics." },
  { phrase: "beer and ping pong", category: "Exclusion Proxy", severity: "watch", riskSignal: "Exclusionary culture signal", explanation: "Signals a social environment that may marginalize non-drinkers, introverts, people with disabilities, or those with caregiving responsibilities." },
  { phrase: "work hard play hard", category: "Exclusion Proxy", severity: "flag", riskSignal: "Burnout culture + exclusion", explanation: "Documented correlation with excessive hours, drinking culture, and hostility toward boundaries. Often present in workplaces with high turnover and harassment complaints." },
  { phrase: "like a family", category: "Exclusion Proxy", severity: "flag", riskSignal: "Boundary erosion signal", explanation: "Employment is a business transaction, not a family. This phrase is consistently associated with workplaces that exploit loyalty, discourage boundaries, and guilt employees for leaving." },
  { phrase: "we're all family here", category: "Exclusion Proxy", severity: "flag", riskSignal: "Boundary erosion signal", explanation: "Same as 'like a family.' Used to discourage complaints, normalize overwork, and create pressure against reporting misconduct." },

  // Gender bias signals
  { phrase: "aggressive", category: "Gender Bias", severity: "watch", riskSignal: "Gendered language in job descriptions", explanation: "Research shows 'aggressive' in job postings disproportionately deters women applicants. When applied to women in reviews, it's a documented bias indicator." },
  { phrase: "ninja", category: "Gender Bias", severity: "watch", riskSignal: "Gendered and racialized language", explanation: "Coded masculine language in tech recruiting. Studies show these terms reduce applications from women and non-binary candidates." },
  { phrase: "rockstar", category: "Gender Bias", severity: "watch", riskSignal: "Gendered language", explanation: "Like 'ninja,' coded masculine. Also signals unrealistic expectations and a culture that rewards individual heroics over sustainable teamwork." },
  { phrase: "he or she", category: "Gender Bias", severity: "note", riskSignal: "Binary-only language", explanation: "Excludes non-binary candidates. Modern inclusive practice uses 'they' or 'you.' Binary-only language can signal broader inclusion gaps." },
  { phrase: "manpower", category: "Gender Bias", severity: "note", riskSignal: "Gendered term", explanation: "Outdated gendered language. Minor signal on its own, but worth noting as part of a broader pattern." },

  // Disability and neurodivergence signals
  { phrase: "must be able to lift", category: "Disability", severity: "watch", riskSignal: "Potential ADA issue", explanation: "Legitimate only if physical requirements are essential job functions. Including this for desk jobs is an ADA red flag." },
  { phrase: "fast-paced environment", category: "Disability", severity: "watch", riskSignal: "Accommodation resistance signal", explanation: "Can signal resistance to reasonable accommodations for processing speed, chronic illness, or disability. Evaluate whether pace is genuinely required." },
  { phrase: "thrives under pressure", category: "Disability", severity: "note", riskSignal: "Mental health accommodation signal", explanation: "May indicate a high-stress environment hostile to mental health accommodations or neurodivergent working styles." },
  { phrase: "team player", category: "Disability", severity: "note", riskSignal: "Neurodivergence signal when overemphasized", explanation: "When heavily emphasized, can signal resistance to independent working styles common with autistic employees or those with social anxiety." },

  // Race and ethnicity signals
  { phrase: "professional appearance", category: "Race Proxy", severity: "flag", riskSignal: "Appearance-based discrimination proxy", explanation: "Documented in CROWN Act litigation as code for anti-Black hair discrimination. 'Professional appearance' standards disproportionately target Black workers." },
  { phrase: "clean-cut", category: "Race Proxy", severity: "flag", riskSignal: "Grooming discrimination", explanation: "Appearance standards that target natural hair, religious head coverings, or cultural dress. Frequently cited in race and religion discrimination cases." },
  { phrase: "speaks well", category: "Race Proxy", severity: "flag", riskSignal: "Racial microaggression", explanation: "When noted as exceptional, this is a documented racial microaggression reflecting surprise that a person of color is articulate." },
  { phrase: "urban", category: "Race Proxy", severity: "watch", riskSignal: "Racial euphemism", explanation: "Frequently used as a euphemism for Black or Latino communities. Context matters, but pattern usage is a signal." },

  // Retaliation and suppression signals
  { phrase: "no drama", category: "Retaliation Signal", severity: "flag", riskSignal: "Complaint suppression", explanation: "Documented in retaliation cases as language used to discourage reporting harassment, discrimination, or safety concerns." },
  { phrase: "leave your problems at the door", category: "Retaliation Signal", severity: "flag", riskSignal: "Complaint suppression", explanation: "Signals an environment hostile to raising concerns. Workers who 'bring problems' are often the ones reporting legitimate issues." },
  { phrase: "positive attitude required", category: "Retaliation Signal", severity: "watch", riskSignal: "Tone policing / complaint suppression", explanation: "Can be used to penalize employees who raise concerns about discrimination, safety, or labor violations under the guise of 'attitude.'" },
  { phrase: "thick skin", category: "Retaliation Signal", severity: "watch", riskSignal: "Harassment normalization", explanation: "Signals an environment where harassment or bullying is expected and tolerated. 'Thick skin' means 'don't report it.'" },
  { phrase: "not a complainer", category: "Retaliation Signal", severity: "flag", riskSignal: "Retaliation risk", explanation: "Explicitly values silence over reporting. Strong indicator of a workplace that punishes employees who raise legitimate concerns." },

  // Labor and wage signals
  { phrase: "competitive salary", category: "Wage Transparency", severity: "note", riskSignal: "Pay opacity", explanation: "Absence of a salary range when the phrase 'competitive salary' is used correlates with below-market offers. Pay transparency laws increasingly require ranges." },
  { phrase: "unlimited PTO", category: "Wage Transparency", severity: "watch", riskSignal: "Benefit ambiguity", explanation: "Studies show workers with 'unlimited PTO' take fewer days off than those with defined allowances. Can also reduce payout liability at separation." },
  { phrase: "startup mentality", category: "Wage Transparency", severity: "watch", riskSignal: "Labor exploitation signal", explanation: "Often used to justify below-market pay, excessive hours, and lack of structure. In established companies, it signals expectation of overwork without equity upside." },
  { phrase: "wear many hats", category: "Wage Transparency", severity: "note", riskSignal: "Role scope ambiguity", explanation: "Can indicate understaffing. One person doing three jobs for one salary is not versatility — it's cost-cutting." },
  { phrase: "other duties as assigned", category: "Wage Transparency", severity: "note", riskSignal: "Scope creep language", explanation: "Standard in most job descriptions, but watch for it in combination with vague role definitions as a sign of undefined expectations." },
  { phrase: "passion for the work", category: "Wage Transparency", severity: "watch", riskSignal: "Wage suppression justification", explanation: "Research shows 'passion' framing is used to justify lower pay and longer hours, particularly in female-dominated industries." },
  { phrase: "self-starter", category: "Wage Transparency", severity: "note", riskSignal: "Lack of training/support", explanation: "Can be legitimate, but in combination with other signals may indicate the employer provides no onboarding, training, or management support." },
];

/**
 * Scan text for code words. Returns matched entries with the source context.
 */
export function scanForCodeWords(text: string): (CodeWordEntry & { matchedText: string })[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matches: (CodeWordEntry & { matchedText: string })[] = [];

  for (const entry of CODE_WORD_DICTIONARY) {
    const idx = lower.indexOf(entry.phrase.toLowerCase());
    if (idx !== -1) {
      // Extract surrounding context (up to 40 chars each side)
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + entry.phrase.length + 40);
      matches.push({
        ...entry,
        matchedText: (start > 0 ? "..." : "") + text.slice(start, end).trim() + (end < text.length ? "..." : ""),
      });
    }
  }

  return matches;
}
