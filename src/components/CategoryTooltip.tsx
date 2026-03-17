import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const CATEGORY_DEFINITIONS: Record<string, { label: string; definition: string }> = {
  institutional_alignment: {
    label: "Institutional Alignment",
    definition: "Analysis of corporate leadership ties to policy-shaping networks like the Heritage Foundation or Center for American Progress. We track board seats and public endorsements.",
  },
  political_spending: {
    label: "Political Spending",
    definition: "Direct receipts from FEC and OpenSecrets filings. We look at PAC distributions to see which 2026 legislative blueprints a company is funding.",
  },
  family_pillar: {
    label: "Family Pillar",
    definition: "A measure of alignment with 2026 family models, ranging from 'Traditional Restoration' (Heritage-aligned) to 'Progressive Flexibility' (CAP-aligned).",
  },
  dark_money: {
    label: "Dark Money Signals",
    definition: "Tracking non-disclosed contributions through trade associations and 501(c)(4) 'social welfare' organizations that do not require donor disclosure.",
  },
  insider_context: {
    label: "Insider Context",
    definition: "Qualitative data from verified employee testimonials and internal culture memos analyzed by our 2026 Career Intelligence model.",
  },
  lobbying: {
    label: "Lobbying Activity",
    definition: "Federal and state-level lobbying expenditures tracked via Senate Lobbying Disclosure Act filings. We map which bills and agencies each company targets.",
  },
  civil_rights: {
    label: "Civil Rights Signals",
    definition: "Data from EEOC, HRC Corporate Equality Index, and federal court records tracking discrimination filings, settlements, and diversity commitments.",
  },
  climate: {
    label: "Climate & Environment",
    definition: "EPA emissions data, CDP scores, and corporate climate pledges cross-referenced with actual emissions and energy policy lobbying.",
  },
  worker_treatment: {
    label: "Worker Treatment",
    definition: "OSHA violations, NLRB filings, WARN Act layoff notices, and compensation transparency signals aggregated from public records.",
  },
  government_contracts: {
    label: "Government Contracts",
    definition: "Federal contract awards tracked via USASpending.gov, including dollar amounts, awarding agencies, and controversy flags.",
  },
};

interface CategoryTooltipProps {
  category: string;
  className?: string;
}

export function CategoryTooltip({ category, className }: CategoryTooltipProps) {
  const def = CATEGORY_DEFINITIONS[category];
  if (!def) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={`inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ${className || ""}`}>
            <Info className="w-3 h-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          <p className="font-semibold text-foreground mb-1">{def.label}</p>
          <p className="text-muted-foreground">{def.definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
