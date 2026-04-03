import { describe, it, expect } from "vitest";
import { createHeuristicResumeParser } from "./heuristic-parser";

describe("createHeuristicResumeParser", () => {
  it("extracts emails, skills, and bullets", () => {
    const parser = createHeuristicResumeParser();
    const text = `
JANE DOE
jane.doe@example.com

EXPERIENCE
Software Engineer — Acme
• Built features with TypeScript and React on AWS
• Led migration to PostgreSQL

SKILLS
Python, SQL, Docker
`;
    const r = parser.parsePlainText(text);
    expect(r.emails).toContain("jane.doe@example.com");
    expect(r.inferredSkills).toContain("typescript");
    expect(r.inferredSkills).toContain("react");
    expect(r.bullets.some((b) => b.toLowerCase().includes("typescript"))).toBe(true);
  });
});
