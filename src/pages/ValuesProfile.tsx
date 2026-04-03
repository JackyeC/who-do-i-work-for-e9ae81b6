import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { syncDreamJobProfileRemote } from "@/domain/career/sync-dream-job-profile";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useValuesFlow } from "@/components/values/useValuesFlow";
import { ForcedChoiceStep } from "@/components/values/ForcedChoiceStep";
import { DealbreakersStep } from "@/components/values/DealbreakersStep";
import { WorkStyleStep } from "@/components/values/WorkStyleStep";
import { SalaryFloorStep } from "@/components/values/SalaryFloorStep";
import { ValuesTopicsStep } from "@/components/values/ValuesTopicsStep";
import { ValuesSummaryCard } from "@/components/values/ValuesSummaryCard";

const STEP_LABELS = [
  "Tradeoffs",
  "Dealbreakers",
  "Work Style",
  "Salary Floor",
  "Values Topics",
  "Summary",
];

const TOTAL_STEPS = 6;

export default function ValuesProfile() {
  const [step, setStep] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const flow = useValuesFlow();

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleSave = useCallback(async () => {
    if (!user) {
      // Store intent and redirect to join
      navigate("/join");
      return;
    }
    const success = await flow.saveToDb(user.id);
    if (success) {
      try {
        await syncDreamJobProfileRemote(supabase, user.id);
        queryClient.invalidateQueries({ queryKey: ["dream-job-profile"] });
      } catch {
        /* non-fatal */
      }
      navigate("/dashboard");
    }
  }, [user, flow, navigate, queryClient]);

  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0E" }}>
      {/* Progress bar */}
      <div className="sticky top-0 z-50" style={{ background: "#0A0A0E" }}>
        <div className="h-1 w-full" style={{ background: "#242424" }}>
          <motion.div
            className="h-full"
            style={{ background: "#F0C040" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <p className="text-xs" style={{ color: "#9898A0", fontFamily: "DM Mono, monospace" }}>
            Step {step + 1} of {TOTAL_STEPS}
          </p>
          <p className="text-xs font-medium" style={{ color: "#F0C040", fontFamily: "DM Mono, monospace" }}>
            {STEP_LABELS[step]}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <ForcedChoiceStep
                choices={flow.draft.forcedChoices}
                onChange={flow.updateForcedChoices}
              />
            )}
            {step === 1 && (
              <DealbreakersStep
                data={flow.draft.dealbreakers}
                onChange={flow.updateDealbreakers}
              />
            )}
            {step === 2 && (
              <WorkStyleStep
                data={flow.draft.workStyle}
                onChange={flow.updateWorkStyle}
              />
            )}
            {step === 3 && (
              <SalaryFloorStep
                data={flow.draft.salary}
                onChange={flow.updateSalary}
              />
            )}
            {step === 4 && (
              <ValuesTopicsStep
                ratings={flow.draft.topics}
                onChange={flow.updateTopics}
              />
            )}
            {step === 5 && (
              <ValuesSummaryCard
                flow={flow}
                onNavigateToStep={setStep}
                onSave={handleSave}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: "linear-gradient(transparent, #0A0A0E 30%)" }}>
          <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={step === 0}
              className="flex items-center gap-1.5 text-sm font-medium transition-opacity disabled:opacity-30"
              style={{ color: "#9898A0", fontFamily: "DM Sans, sans-serif" }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold transition-all"
              style={{
                background: "#F0C040",
                color: "#0A0A0E",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
