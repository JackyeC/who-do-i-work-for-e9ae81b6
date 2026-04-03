import type { ParsedResume, ParsedResumeSection, ResumeParser } from "./types";

const SECTION_RE =
  /^(EDUCATION|EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|SKILLS|TECHNICAL SKILLS|SUMMARY|PROFILE|OBJECTIVE|PROJECTS|CERTIFICATIONS|AWARDS|VOLUNTEER|LANGUAGES)\s*:?\s*$/i;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

/** Common tech tokens for lightweight skill inference (expand over time or swap for LLM). */
const SKILL_LEXICON = new Set(
  [
    "typescript",
    "javascript",
    "python",
    "react",
    "next.js",
    "node",
    "nodejs",
    "sql",
    "postgresql",
    "aws",
    "gcp",
    "azure",
    "kubernetes",
    "docker",
    "figma",
    "salesforce",
    "tableau",
    "excel",
    "r",
    "scala",
    "go",
    "rust",
    "java",
    "kotlin",
    "swift",
    "graphql",
    "redis",
    "kafka",
    "terraform",
    "ansible",
  ].map((s) => s.toLowerCase())
);

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function splitSections(lines: string[]): ParsedResumeSection[] {
  const sections: ParsedResumeSection[] = [];
  let current: ParsedResumeSection = { heading: "Body", lines: [] };

  for (const line of lines) {
    if (SECTION_RE.test(line)) {
      if (current.lines.length || sections.length === 0) {
        sections.push(current);
      }
      current = { heading: line.replace(/:\s*$/, "").trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);
  return sections;
}

function extractBullets(sections: ParsedResumeSection[]): string[] {
  const bullets: string[] = [];
  for (const s of sections) {
    for (const line of s.lines) {
      if (/^[•\-–—*]/.test(line) || /^\d+\.\s/.test(line)) {
        bullets.push(line.replace(/^[•\-–—*\d.)\s]+/, "").trim());
      }
    }
  }
  return bullets;
}

function inferSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const token of SKILL_LEXICON) {
    if (lower.includes(token)) found.add(token);
  }
  return [...found].sort();
}

function inferTitles(lines: string[]): string[] {
  const titles: string[] = [];
  const titleLike = /(engineer|manager|director|lead|analyst|designer|developer|architect|scientist|consultant|specialist|coordinator)/i;
  for (let i = 0; i < Math.min(12, lines.length); i++) {
    const line = lines[i];
    if (line.length > 8 && line.length < 90 && titleLike.test(line) && !EMAIL_RE.test(line)) {
      titles.push(line);
    }
  }
  return [...new Set(titles)].slice(0, 5);
}

export function createHeuristicResumeParser(): ResumeParser {
  return {
    parsePlainText(text: string): ParsedResume {
      const rawText = text.trim();
      const lines = normalizeLines(rawText);
      const sections = splitSections(lines);
      const emails = [...rawText.matchAll(EMAIL_RE)].map((m) => m[0]);
      const phones = [...rawText.matchAll(PHONE_RE)].map((m) => m[0]);
      const inferredSkills = inferSkills(rawText);
      const inferredTitles = inferTitles(lines);
      const bullets = extractBullets(sections);

      return {
        rawText,
        sections,
        emails: [...new Set(emails)],
        phones: [...new Set(phones)],
        inferredSkills,
        inferredTitles,
        bullets,
      };
    },
  };
}
