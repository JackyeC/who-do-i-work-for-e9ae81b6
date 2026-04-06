import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("WDIWF voice + IA contract", () => {
  it("wdiwf-voice.ts encodes decision intelligence and three-test bar", () => {
    const voice = read("supabase/functions/_shared/wdiwf-voice.ts");
    expect(voice).toContain("decision intelligence");
    expect(voice).toContain("Does this help someone decide");
    expect(voice).toContain("recruiter would avoid");
  });

  it("jrc-edit-prompt composes shared WDIWF baseline", () => {
    const jrc = read("supabase/functions/_shared/jrc-edit-prompt.ts");
    expect(jrc).toContain('from "./wdiwf-voice.ts"');
    expect(jrc).toContain("${WDIWF_VOICE_BASE}");
  });

  it("ask-jackye imports shared voice", () => {
    const ask = read("supabase/functions/ask-jackye/index.ts");
    expect(ask).toContain("../_shared/wdiwf-voice.ts");
    expect(ask).toContain("WDIWF_VOICE_BASE");
  });

  it("dynamic sitemap uses canonical paths and dossier filter", () => {
    const sm = read("supabase/functions/dynamic-sitemap/index.ts");
    expect(sm).toContain('/offer-check"');
    expect(sm).not.toContain("/would-you-work-here");
    expect(sm).toContain("/signal-alerts");
    expect(sm).not.toContain('{ path: "/signals"');
    expect(sm).toContain("COMPANY_SITEMAP_IDENTITY_STATUSES");
    expect(sm).toContain("SITEMAP_INCLUDE_ALL_COMPANIES");
  });
});
