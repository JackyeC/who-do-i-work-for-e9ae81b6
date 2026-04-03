import type { ResumeParser } from "./types";
import { createHeuristicResumeParser } from "./heuristic-parser";

export type { ParsedResume, ParsedResumeSection, ResumeParser } from "./types";
export { createHeuristicResumeParser };

/**
 * Default parser: deterministic heuristics (no network). Swap for LLM-backed implementation behind same interface.
 */
export function createResumeParser(): ResumeParser {
  return createHeuristicResumeParser();
}
