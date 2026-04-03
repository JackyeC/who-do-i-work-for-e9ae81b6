/**
 * Parsed resume — provider-agnostic shape for matching + Dream Job Profile facets.
 */
export interface ParsedResumeSection {
  heading: string;
  lines: string[];
}

export interface ParsedResume {
  rawText: string;
  sections: ParsedResumeSection[];
  emails: string[];
  phones: string[];
  /** Heuristic skills / technologies */
  inferredSkills: string[];
  /** Likely job titles from headlines */
  inferredTitles: string[];
  /** Bullet lines (for downstream tailoring) */
  bullets: string[];
}

export interface ResumeParser {
  parsePlainText(text: string): ParsedResume;
}
