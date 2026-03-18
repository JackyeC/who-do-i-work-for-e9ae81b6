import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, DollarSign, Heart, TrendingUp, Shield, Briefcase } from "lucide-react";
import type { LegalFlag } from "./CivicLegalAudit";

interface Props {
  legalFlags: LegalFlag[];
  hasEquity: boolean;
  hasBonus: boolean;
  offerSalary: number;
  annualBaseline: number;
  companyName: string;
}

interface QuestionGroup {
  key: string;
  label: string;
  icon: typeof DollarSign;
  questions: string[];
}

function generateQuestions(props: Props): QuestionGroup[] {
  const { legalFlags, hasEquity, hasBonus, offerSalary, annualBaseline, companyName } = props;
  const groups: QuestionGroup[] = [];

  // Compensation
  const compQuestions: string[] = [];
  if (hasBonus) {
    compQuestions.push("How is the bonus calculated, and what does 'target' actually mean?");
    compQuestions.push("What percentage of employees hit their full target bonus last year?");
  }
  if (!hasBonus) {
    compQuestions.push("Is there a performance bonus or variable compensation component?");
  }
  if (offerSalary < annualBaseline * 1.2) {
    compQuestions.push("Is the base salary negotiable, or can we discuss a sign-on bonus to bridge the gap?");
  }
  compQuestions.push("When is the next compensation review cycle, and how are raises determined?");
  groups.push({ key: "compensation", label: "Compensation", icon: DollarSign, questions: compQuestions });

  // Benefits
  groups.push({
    key: "benefits", label: "Benefits", icon: Heart,
    questions: [
      "When do health benefits begin — first day, or is there a waiting period?",
      "What does the typical monthly employee premium look like?",
      "What is the 401(k) match structure?",
      "Is there a professional development or education reimbursement budget?",
    ],
  });

  // Equity
  if (hasEquity) {
    groups.push({
      key: "equity", label: "Equity", icon: TrendingUp,
      questions: [
        "What type of equity is this — RSUs, ISOs, or NSOs?",
        "What is the vesting schedule and cliff period?",
        "Is the grant subject to board approval, and if so, when does the board typically meet?",
        "Can you share context on the current valuation or strike price?",
        "What happens to unvested equity if there's a change of control or acquisition?",
      ],
    });
  }

  // Role & Growth
  groups.push({
    key: "growth", label: "Role & Growth", icon: Briefcase,
    questions: [
      "What does success in the first 90 days look like for this role?",
      "How is performance reviewed, and on what cadence?",
      "When was the last promotion on this team?",
      `Who will I report to, and can I meet them before my start date?`,
      "What is the typical career path from this role?",
    ],
  });

  // Legal Terms
  const legalQuestions: string[] = [];
  const hasArb = legalFlags.some(f => f.category === "Arbitration");
  const hasNonCompete = legalFlags.some(f => f.category === "Non-Compete");
  const hasIP = legalFlags.some(f => f.category === "IP Ownership");
  const hasRepayment = legalFlags.some(f => f.category === "Stay-or-Pay");

  if (hasArb) legalQuestions.push("Can we discuss a carve-out from the arbitration clause for discrimination, harassment, and wage claims?");
  if (hasNonCompete) legalQuestions.push("Can the non-compete be narrowed to direct competitors only, within a 50-mile radius, and limited to 6 months?");
  if (hasIP) legalQuestions.push("Can we exclude prior work, side projects, and inventions created on personal time from the IP assignment clause?");
  if (hasRepayment) legalQuestions.push("Can you confirm the repayment obligation is prorated on a monthly basis, not a full lump-sum payback?");
  legalQuestions.push("Can I receive copies of the employee handbook, arbitration agreement, and any referenced policy documents before signing?");

  groups.push({ key: "legal", label: "Legal Terms", icon: Shield, questions: legalQuestions });

  return groups;
}

export function QuestionsToAsk(props: Props) {
  const groups = generateQuestions(props);

  return (
    <div id="questions-to-ask">
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            Questions to Ask Before You Sign
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Tailored to the specific terms in your offer from {props.companyName}.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {groups.map(group => {
            const Icon = group.icon;
            return (
              <div key={group.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{group.label}</span>
                  <Badge variant="secondary" className="text-xs">{group.questions.length}</Badge>
                </div>
                <ul className="space-y-1.5 ml-5">
                  {group.questions.map((q, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/30 shrink-0" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
