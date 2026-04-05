import { describe, it, expect, beforeEach } from "vitest";
import { getPersonaState, PERSONA_NAMES, SECTION_HEADER_COPY, CTA_COPY } from "../use-persona";
import { BADGES as SignalBadges } from "@/components/dashboard/SignalBadges";

describe("getPersonaState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default state when no persona is set", () => {
    const state = getPersonaState();
    expect(state.persona).toBeNull();
    expect(state.hasTakenQuiz).toBe(false);
    expect(state.nepotismFlag).toBeNull();
    expect(state.trustLevel).toBeNull();
  });

  it("reads persona from localStorage", () => {
    localStorage.setItem("wdiwf_persona", "job_seeker");
    const state = getPersonaState();
    expect(state.persona).toBe("job_seeker");
    expect(state.hasTakenQuiz).toBe(true);
  });

  it("reads all fields from localStorage", () => {
    localStorage.setItem("wdiwf_persona", "researcher");
    localStorage.setItem("wdiwf_nepotism_flag", "high");
    localStorage.setItem("wdiwf_trust", "skeptic");
    const state = getPersonaState();
    expect(state.persona).toBe("researcher");
    expect(state.nepotismFlag).toBe("high");
    expect(state.trustLevel).toBe("skeptic");
  });
});

describe("Persona constants", () => {
  it("PERSONA_NAMES covers all persona IDs", () => {
    const ids = ["job_seeker", "recruiter", "executive", "researcher", "sales", "marketing", "investor", "journalist", "career_changer"];
    ids.forEach(id => {
      expect(PERSONA_NAMES[id as keyof typeof PERSONA_NAMES]).toBeDefined();
    });
  });

  it("SECTION_HEADER_COPY and CTA_COPY match persona IDs", () => {
    Object.keys(PERSONA_NAMES).forEach(id => {
      expect(SECTION_HEADER_COPY[id as keyof typeof SECTION_HEADER_COPY]).toBeDefined();
      expect(CTA_COPY[id as keyof typeof CTA_COPY]).toBeDefined();
    });
  });
});

describe("SignalBadges definitions", () => {
  it("has exactly 3 badges", () => {
    expect(SignalBadges).toHaveLength(3);
  });

  it("each badge has required fields", () => {
    SignalBadges.forEach(badge => {
      expect(badge.id).toBeTruthy();
      expect(badge.label).toBeTruthy();
      expect(badge.meaning).toBeTruthy();
      expect(badge.icon).toBeTruthy();
    });
  });

  it("badge meanings are professional and not gamified", () => {
    SignalBadges.forEach(badge => {
      // Should not contain gamification language
      expect(badge.meaning.toLowerCase()).not.toContain("unlock");
      expect(badge.meaning.toLowerCase()).not.toContain("level up");
      expect(badge.meaning.toLowerCase()).not.toContain("achievement");
      expect(badge.meaning.toLowerCase()).not.toContain("points");
    });
  });
});
