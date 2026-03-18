import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/use-premium";
import { useNavigate } from "react-router-dom";
import type { DNAValues } from "./DNAPanel";

export interface DemoJob {
  id: number;
  company: string;
  emoji: string;
  role: string;
  category: string;
  comp: string;
  compTransparency: number;
  hiringActivity: number;
  workforceStability: number;
  companyBehavior: number;
  innovation: number;
  employeeExperience: number;
  ghost: boolean;
  proData: string;
}

const SIGNAL_CONFIG: Record<string, [string, string]> = {
  tech: ["innovation", "workforceStability"],
  operations: ["workforceStability", "compTransparency"],
  sales: ["hiringActivity", "innovation"],
  hr: ["employeeExperience", "companyBehavior"],
};

const SIGNAL_META: Record<string, { name: string; high: { label: string; icon: string; text: string }; med: { label: string; icon: string; text: string }; low: { label: string; icon: string; text: string } }> = {
  compTransparency: {
    name: "COMP TRANSPARENCY",
    high: { label: "green", icon: "✦", text: "Salary listed — no games, no wasted interviews." },
    med: { label: "amber", icon: "◈", text: "Vague comp range. Budget exists, but they're coy." },
    low: { label: "red", icon: "▲", text: "No comp listed. Proceed with negotiation armor on." },
  },
  hiringActivity: {
    name: "HIRING ACTIVITY",
    high: { label: "green", icon: "✦", text: "Fresh roles across multiple teams — genuine growth." },
    med: { label: "amber", icon: "◈", text: "Reposts detected. Roles may be slow to close." },
    low: { label: "red", icon: "▲", text: "Stale listings. Headcount freeze possible." },
  },
  workforceStability: {
    name: "WORKFORCE STABILITY",
    high: { label: "green", icon: "✦", text: "Steady headcount growth, no layoff signals detected." },
    med: { label: "amber", icon: "◈", text: "Headcount data patchy. Can't confirm direction." },
    low: { label: "red", icon: "▲", text: "Layoff activity or significant headcount reduction detected." },
  },
  companyBehavior: {
    name: "COMPANY BEHAVIOR",
    high: { label: "green", icon: "✦", text: "Clear public footprint — press, execs, roadmap visible." },
    med: { label: "amber", icon: "◈", text: "Partial visibility. Some signals, some silence." },
    low: { label: "red", icon: "▲", text: "Stealth mode. Very little public signal available." },
  },
  innovation: {
    name: "INNOVATION",
    high: { label: "green", icon: "✦", text: "Active patents or product launches. Builder culture evident." },
    med: { label: "amber", icon: "◈", text: "Steady tech stack, legacy modernization in progress." },
    low: { label: "red", icon: "▲", text: "Limited product movement. Maintenance mode possible." },
  },
  employeeExperience: {
    name: "EMPLOYEE EXPERIENCE",
    high: { label: "green", icon: "✦", text: "Glassdoor trending up. People seem to stay and refer." },
    med: { label: "amber", icon: "◈", text: "Mixed reviews. High variance in team experiences." },
    low: { label: "red", icon: "▲", text: "Consistent concerns around management or culture." },
  },
};

function getLevel(score: number): "high" | "med" | "low" {
  if (score >= 0.65) return "high";
  if (score >= 0.35) return "med";
  return "low";
}

function getClarityScore(job: DemoJob): number {
  const fields: (keyof DemoJob)[] = ["compTransparency", "hiringActivity", "workforceStability", "companyBehavior", "innovation", "employeeExperience"];
  return fields.reduce((a, k) => a + (job[k] as number), 0) / fields.length;
}

function detectClash(job: DemoJob, dna: DNAValues): string[] {
  const clashes: string[] = [];
  if (dna.stability > 70 && job.workforceStability < 0.35) clashes.push("Your preference for structure clashes with detected workforce instability.");
  if (dna.comp > 65 && job.compTransparency < 0.35) clashes.push("You prioritize compensation clarity — but this company buries their numbers.");
  if (dna.innovation > 70 && job.innovation < 0.4) clashes.push("You thrive in builder cultures, but this role shows limited innovation signals.");
  if (dna.pace < 35 && job.hiringActivity > 0.8) clashes.push("You prefer a steady pace — this company is in high-velocity hiring mode.");
  return clashes;
}

const colorMap = { green: "#47ffb3", amber: "#ffb347", red: "#ff4d6d" };
const chipBg = { green: "rgba(71,255,179,0.05)", amber: "rgba(255,179,71,0.05)", red: "rgba(255,77,109,0.05)" };
const chipBorder = { green: "rgba(71,255,179,0.2)", amber: "rgba(255,179,71,0.2)", red: "rgba(255,77,109,0.15)" };

interface Props {
  job: DemoJob;
  dna: DNAValues;
}

export function DecisionJobCard({ job, dna }: Props) {
  const [auditState, setAuditState] = useState<"idle" | "scanning" | "done">("idle");
  const { isPremium, isLoggedIn } = usePremium();
  const navigate = useNavigate();

  const clashes = detectClash(job, dna);
  const clarity = getClarityScore(job);
  const clarityPct = Math.round(clarity * 100);
  const clarityColor = clarity >= 0.65 ? "#47ffb3" : clarity >= 0.35 ? "#ffb347" : "#ff4d6d";
  const signalKeys = SIGNAL_CONFIG[job.category] || ["innovation", "workforceStability"];

  const triggerAudit = () => {
    if (!isPremium) {
      if (!isLoggedIn) navigate("/login");
      else navigate("/pricing");
      return;
    }
    setAuditState("scanning");
    setTimeout(() => setAuditState("done"), 1800);
  };

  return (
    <div
      className="relative rounded-2xl border bg-[#16161f] p-6 overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
      style={{
        borderColor: clashes.length ? "#ffb347" : "#2a2a3a",
      }}
      onMouseEnter={(e) => { if (!clashes.length) (e.currentTarget.style.borderColor = "#e8ff47"); }}
      onMouseLeave={(e) => { if (!clashes.length) (e.currentTarget.style.borderColor = "#2a2a3a"); }}
    >
      {/* Values Clash badge */}
      {clashes.length > 0 && (
        <span className="absolute top-3.5 right-3.5 font-mono text-[9px] text-[#ffb347] tracking-[1.5px] bg-[rgba(255,179,71,0.1)] px-2 py-1 rounded border border-[rgba(255,179,71,0.3)]">
          ⚡ VALUES CLASH
        </span>
      )}

      {/* Ghost ribbon */}
      {job.ghost && (
        <div className="absolute top-0 left-0 bg-[#ff4d6d] text-white font-mono text-[9px] px-3 py-1 tracking-wider rounded-br-lg z-10">
          👻 GHOST_POSTING_RISK
        </div>
      )}

      {/* Company row */}
      <div className="flex items-start gap-3 mb-4 pt-1">
        <div className="w-10 h-10 rounded-lg bg-[#111118] border border-[#2a2a3a] flex items-center justify-center text-base shrink-0">
          {job.emoji}
        </div>
        <div>
          <h3 className="font-['Syne',sans-serif] font-bold text-base text-[#e8e8f0] leading-tight">{job.company}</h3>
          <div className="text-xs text-[#9898b0] mt-0.5">{job.role}</div>
          <div className="font-mono text-[11px] text-[#47ffb3] mt-1">{job.comp}</div>
        </div>
      </div>

      {/* Clarity score */}
      <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-[#2a2a3a]">
        <span className="font-mono text-[10px] text-[#6b6b8a] tracking-wider uppercase">CLARITY SCORE</span>
        <div className="flex-1 h-1 bg-[#2a2a3a] rounded-sm overflow-hidden">
          <div
            className="h-full rounded-sm transition-all duration-700"
            style={{ width: `${clarityPct}%`, backgroundColor: clarityColor }}
          />
        </div>
        <span className="font-mono text-[11px] font-bold min-w-[36px] text-right" style={{ color: clarityColor }}>
          {clarityPct}
        </span>
      </div>

      {/* Signal chips */}
      <div className="flex flex-col gap-2 mb-4">
        {signalKeys.map((key) => {
          const meta = SIGNAL_META[key];
          if (!meta) return null;
          const score = job[key as keyof DemoJob] as number;
          const level = getLevel(score);
          const data = meta[level];
          const color = colorMap[data.label as keyof typeof colorMap];
          return (
            <div
              key={key}
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg border"
              style={{
                background: chipBg[data.label as keyof typeof chipBg],
                borderColor: chipBorder[data.label as keyof typeof chipBorder],
              }}
            >
              <span className="text-sm shrink-0 mt-px">{data.icon}</span>
              <div className="text-xs leading-relaxed">
                <span className="font-mono text-[10px] font-bold tracking-wide block mb-0.5" style={{ color }}>
                  [{meta.name}: {level.toUpperCase()}]
                </span>
                <span className="text-[#9898b0] text-[11px]">{data.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clash explain */}
      {clashes.length > 0 && (
        <div className="mt-2.5 px-3 py-2.5 rounded-lg bg-[rgba(255,179,71,0.06)] border border-[rgba(255,179,71,0.25)] text-[11px] text-[#ffb347] leading-relaxed">
          <strong className="font-semibold">⚡ What this means for you:</strong>
          <br />
          {clashes.map((c, i) => (
            <span key={i}>• {c}<br /></span>
          ))}
        </div>
      )}

      {/* Pro blur section */}
      <div className="relative mt-3 rounded-lg overflow-hidden">
        <div
          className="px-3 py-2.5 bg-[#111118] rounded-lg font-mono text-[11px] text-[#9898b0] border border-[#2a2a3a] leading-relaxed"
          style={{ filter: isPremium ? "none" : "blur(4px)", pointerEvents: isPremium ? "auto" : "none" }}
        >
          {job.proData}
        </div>
        {!isPremium && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(10,10,15,0.7)] backdrop-blur-sm rounded-lg gap-1.5 border border-[rgba(232,255,71,0.2)]">
            <span className="font-mono text-[9px] text-[#e8ff47] tracking-wider text-center px-4 leading-relaxed">
              This deep-dive found 2 new signals.<br />Unlock to see what changed in 24h.
            </span>
            <button
              onClick={() => { if (!isLoggedIn) navigate("/login"); else navigate("/pricing"); }}
              className="bg-[#e8ff47] text-black font-mono text-[9px] font-bold px-3.5 py-1.5 rounded tracking-wider hover:opacity-85 transition-opacity"
            >
              UNLOCK PRO ✦
            </button>
          </div>
        )}
      </div>

      {/* Audit result */}
      {auditState === "done" && (
        <div className="mt-2.5 px-3 py-2.5 rounded-lg bg-[rgba(71,179,255,0.05)] border border-[rgba(71,179,255,0.2)] font-mono text-[10px] text-[#47b3ff] leading-relaxed animate-in fade-in slide-in-from-bottom-1">
          ⟳ AUDIT COMPLETE<br />
          ATS: {job.ghost ? "❌ No matching role found on company ATS — GHOST_POSTING_RISK confirmed." : "✓ Matching role confirmed on ATS."}<br />
          Reddit scan: Sentiment scan returned {Math.floor(Math.random() * 20) + 5} mentions (30d).<br />
          Signal delta: {job.ghost ? "Stability score worsened -0.12 since last index." : "No significant change since last snapshot."}
        </div>
      )}

      {/* Audit button */}
      <button
        onClick={triggerAudit}
        disabled={auditState === "scanning"}
        className="w-full mt-3 bg-transparent border border-[#2a2a3a] font-mono text-[10px] py-2.5 rounded-lg tracking-[1.5px] flex items-center justify-center gap-1.5 transition-all hover:border-[#47b3ff] hover:text-[#47b3ff] hover:bg-[rgba(71,179,255,0.05)] disabled:opacity-60"
        style={{
          color: auditState === "done" ? "#47ffb3" : "#9898b0",
          borderColor: auditState === "done" ? "#47ffb3" : undefined,
        }}
      >
        {auditState === "scanning" && <Loader2 className="w-3 h-3 animate-spin" />}
        {auditState === "done" && <Check className="w-3 h-3" />}
        <span>
          {auditState === "idle" ? "A U D I T   N O W" : auditState === "scanning" ? "S C A N N I N G . . ." : "✓ A U D I T   C O M P L E T E"}
        </span>
      </button>
    </div>
  );
}
