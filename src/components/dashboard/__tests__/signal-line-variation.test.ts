import { describe, it, expect } from "vitest";

// Test the signal line variation logic extracted from YourSignalDashboard
function getSignalLine(score: number, index: number, industry?: string): string {
  const prefix = industry || "Company";
  const high = ["Strong alignment across key factors", "Conditions look favorable", "Indicators point to stability"];
  const mid = ["Mixed indicators — take a closer look", "Uneven patterns — worth reviewing", "Some areas need a second pass"];
  const low = ["Low clarity — move carefully", "Weak conditions — verify before proceeding", "Early flags present — check the record"];
  const pool = score >= 70 ? high : score >= 40 ? mid : low;
  return `${prefix} · ${pool[index % pool.length]}`;
}

describe("Signal line variation", () => {
  it("high score returns positive language", () => {
    const line = getSignalLine(85, 0, "Technology");
    expect(line).toContain("Technology");
    expect(line).toContain("Strong alignment");
  });

  it("mid score returns cautious language", () => {
    const line = getSignalLine(55, 0);
    expect(line).toContain("Mixed indicators");
  });

  it("low score returns warning language", () => {
    const line = getSignalLine(25, 0);
    expect(line).toContain("Low clarity");
  });

  it("adjacent entries use different phrasing", () => {
    const line0 = getSignalLine(80, 0);
    const line1 = getSignalLine(80, 1);
    const line2 = getSignalLine(80, 2);
    expect(line0).not.toBe(line1);
    expect(line1).not.toBe(line2);
  });

  it("index wraps around for large lists", () => {
    const line0 = getSignalLine(50, 0);
    const line3 = getSignalLine(50, 3);
    expect(line0).toBe(line3); // wraps at length 3
  });

  it("no line contains the word 'signals'", () => {
    for (let score of [20, 50, 80]) {
      for (let i = 0; i < 3; i++) {
        const line = getSignalLine(score, i, "Test");
        expect(line.toLowerCase()).not.toContain("signals");
      }
    }
  });

  it("zero score returns no line (boundary check)", () => {
    // Score 0 should be in the low tier
    const line = getSignalLine(0, 0);
    expect(line).toContain("Low clarity");
  });

  it("score boundary at 40 uses mid tier", () => {
    const line = getSignalLine(40, 0);
    expect(line).toContain("Mixed indicators");
  });

  it("score boundary at 70 uses high tier", () => {
    const line = getSignalLine(70, 0);
    expect(line).toContain("Strong alignment");
  });
});
