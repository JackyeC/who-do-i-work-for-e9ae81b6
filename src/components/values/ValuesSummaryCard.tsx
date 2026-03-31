import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useValuesFlow } from "./useValuesFlow";

interface Props {
  flow: ReturnType<typeof useValuesFlow>;
  onNavigateToStep: (step: number) => void;
  onSave: () => void;
}

function SummarySection({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onEdit(step)}
      className="w-full text-left rounded-xl p-4 border transition-all hover:border-[#F0C040]/40 group"
      style={{ background: "#13121A", borderColor: "#242424" }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "#F0C040", fontFamily: "DM Mono, monospace" }}>
          {title}
        </p>
        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#9898A0" }} />
      </div>
      {children}
    </button>
  );
}

export function ValuesSummaryCard({ flow, onNavigateToStep, onSave }: Props) {
  const topValues = flow.getTopValues();
  const dealbreakers = flow.getDealbreakers();
  const riskTolerance = flow.getRiskTolerance();
  const fitSummary = flow.getFitSummary();
  const warningSummary = flow.getWarningSummary();
  const salary = flow.draft.salary;
  const workStyle = flow.draft.workStyle;

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>
          This is what you said matters.
        </h2>
        <p className="text-sm" style={{ color: "#9898A0", fontFamily: "DM Sans, sans-serif" }}>
          We'll use this to evaluate companies, offers, and next moves. Tap any section to edit.
        </p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {/* Top Values */}
        <SummarySection title="Your Top Values" step={0} onEdit={onNavigateToStep}>
          <div className="flex flex-wrap gap-2">
            {topValues.map((v) => (
              <span
                key={v.column}
                className="rounded-lg px-2.5 py-1 text-xs font-medium border"
                style={{
                  background: "rgba(240,192,64,0.10)",
                  borderColor: "rgba(240,192,64,0.3)",
                  color: "#F0C040",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {v.label}
              </span>
            ))}
            {topValues.length === 0 && (
              <p className="text-xs" style={{ color: "#9898A0" }}>Complete the flow to see your top values</p>
            )}
          </div>
        </SummarySection>

        {/* Dealbreakers */}
        <SummarySection title="Dealbreakers" step={1} onEdit={onNavigateToStep}>
          <div className="space-y-1">
            {dealbreakers.map((d) => (
              <p key={d.column} className="text-sm" style={{ color: d.isWalkAway ? "#F0C040" : "#F0EBE0" }}>
                {d.isWalkAway ? "★ " : "• "}{d.label}
              </p>
            ))}
            {dealbreakers.length === 0 && (
              <p className="text-xs" style={{ color: "#9898A0" }}>No dealbreakers selected</p>
            )}
          </div>
        </SummarySection>

        {/* Work Style + Risk */}
        <SummarySection title="Work Style" step={2} onEdit={onNavigateToStep}>
          <div className="flex flex-wrap gap-2">
            {workStyle.growthVsStability && (
              <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "#242424", color: "#F0EBE0", fontFamily: "DM Mono, monospace" }}>
                {workStyle.growthVsStability === "startup" ? "Growth" : "Stability"}
              </span>
            )}
            {workStyle.companySize && (
              <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "#242424", color: "#F0EBE0", fontFamily: "DM Mono, monospace" }}>
                {workStyle.companySize === "small" ? "Small Co." : "Large Co."}
              </span>
            )}
            {workStyle.remote && (
              <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "#242424", color: "#F0EBE0", fontFamily: "DM Mono, monospace" }}>
                {workStyle.remote}
              </span>
            )}
            {workStyle.missionVsComp && (
              <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "#242424", color: "#F0EBE0", fontFamily: "DM Mono, monospace" }}>
                {workStyle.missionVsComp === "mission" ? "Mission-driven" : "Compensation-driven"}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "#242424", color: "#9898A0", fontFamily: "DM Mono, monospace" }}>
              Risk: {riskTolerance}
            </span>
          </div>
        </SummarySection>

        {/* Salary Floor */}
        {(salary.salaryFloor || salary.walkAway) && (
          <SummarySection title="Salary Floor" step={3} onEdit={onNavigateToStep}>
            {salary.salaryFloor && (
              <p className="text-lg font-bold" style={{ color: "#F0EBE0" }}>
                ${salary.salaryFloor.toLocaleString()}
              </p>
            )}
            {salary.walkAway && (
              <p className="text-xs mt-1" style={{ color: "#9898A0" }}>{salary.walkAway}</p>
            )}
          </SummarySection>
        )}

        {/* Fit Summary */}
        {fitSummary && (
          <div className="rounded-xl p-4 border" style={{ background: "rgba(240,192,64,0.05)", borderColor: "rgba(240,192,64,0.2)" }}>
            <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "#F0C040", fontFamily: "DM Mono, monospace" }}>
              Employer Fit Summary
            </p>
            <p className="text-sm" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>{fitSummary}</p>
          </div>
        )}

        {/* Warning Summary */}
        {warningSummary && (
          <div className="rounded-xl p-4 border" style={{ background: "rgba(255,100,100,0.04)", borderColor: "rgba(255,100,100,0.15)" }}>
            <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "#ef4444", fontFamily: "DM Mono, monospace" }}>
              Employer Warning Summary
            </p>
            <p className="text-sm" style={{ color: "#F0EBE0", fontFamily: "DM Sans, sans-serif" }}>{warningSummary}</p>
          </div>
        )}

        {/* Save CTA */}
        <div className="pt-4 space-y-3">
          <Button
            onClick={onSave}
            disabled={flow.saving}
            className="w-full h-12 text-base font-bold rounded-xl"
            style={{
              background: "#F0C040",
              color: "#0A0A0E",
            }}
          >
            {flow.saving ? "Saving…" : "Save My Values Profile"}
          </Button>
          <p className="text-xs text-center" style={{ color: "#9898A0", fontFamily: "DM Sans, sans-serif" }}>
            Your values profile is used to personalize employer, offer, and career guidance. You stay in control.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
